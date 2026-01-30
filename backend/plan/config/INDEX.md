# Configuration

## Quick Reference

| Config Area | Source | Validation |
|-------------|--------|------------|
| Environment | `.env` file | Zod schema |
| Database | `DATABASE_URL` | Connection pool |
| Redis | `REDIS_URL` | ioredis client |
| Server | `PORT`, `HOST` | Hono serve |

## Environment Variables

```typescript
// src/env.ts
import { z } from "zod";

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),

  // URLs
  APP_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string(),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(32),

  // Optional
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

## Database Connection

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env";
import * as schema from "./schema";

const client = postgres(env.DATABASE_URL, {
  max: 10,                    // Max connections
  idle_timeout: 20,           // Close idle after 20s
  connect_timeout: 10,        // Connection timeout
});

export const db = drizzle(client, { schema });
```

## Redis Connection

```typescript
// src/lib/redis.ts
import Redis from "ioredis";
import { env } from "~/env";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect: true,
});

redis.on("error", (err) => console.error("Redis error:", err));
redis.on("connect", () => console.log("Redis connected"));
```

## Graceful Shutdown

```typescript
// src/index.ts
import { serve } from "@hono/node-server";
import { app } from "./app";
import { env } from "./env";
import { closeQueues } from "./queue/manager";
import { redis } from "./lib/redis";

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
  hostname: env.HOST,
});

console.log(`Server running on ${env.HOST}:${env.PORT}`);

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);

  // Stop accepting requests
  server.close();

  // Close queue workers
  await closeQueues();

  // Close Redis
  await redis.quit();

  console.log("Shutdown complete");
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
```

## Build Configuration

```typescript
// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  sourcemap: true,
  dts: false,
  splitting: false,
  treeshake: true,
  external: ["better-sqlite3"], // Native modules
});
```

## Drizzle Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

## Sample .env File

```bash
# .env.example

# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# URLs
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/myapp

# Redis
REDIS_URL=redis://localhost:6379

# Auth (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-secret-key-at-least-32-chars

# Logging
LOG_LEVEL=debug
```

## Production Considerations

### Database Connection Pool

```typescript
const client = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === "production" ? 20 : 5,
  idle_timeout: 30,
  connect_timeout: 10,
  prepare: false, // Disable for connection poolers like PgBouncer
});
```

### Redis Cluster

```typescript
import { Cluster } from "ioredis";

const redis = new Cluster([
  { host: "node1.redis.example.com", port: 6379 },
  { host: "node2.redis.example.com", port: 6379 },
], {
  redisOptions: {
    password: env.REDIS_PASSWORD,
  },
});
```

### Health Check Endpoint

```typescript
app.get("/health", async (c) => {
  const checks = {
    database: false,
    redis: false,
  };

  try {
    await db.execute(sql`SELECT 1`);
    checks.database = true;
  } catch {}

  try {
    await redis.ping();
    checks.redis = true;
  } catch {}

  const healthy = Object.values(checks).every(Boolean);

  return c.json({
    status: healthy ? "healthy" : "unhealthy",
    checks,
    timestamp: new Date().toISOString(),
  }, healthy ? 200 : 503);
});
```

## Related Documentation

- [Overview](../OVERVIEW.md)
- [Queue Processing](../queue/INDEX.md)
- [Database](../database/INDEX.md)

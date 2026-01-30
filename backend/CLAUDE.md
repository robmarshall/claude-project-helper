# Backend Guide

TypeScript backend patterns using Hono, Drizzle ORM, BullMQ, and better-auth.

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Hono.js | Lightweight web framework with OpenAPI |
| Database | PostgreSQL + Drizzle | Type-safe ORM with migrations |
| Queue | BullMQ + Redis | Background job processing |
| Auth | better-auth | Session-based auth with API keys |
| Validation | Zod | Schema validation + OpenAPI generation |
| Build | tsup | Fast ESM bundling |
| Testing | Vitest + Testcontainers | Tests with real databases |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│   Routes (Hono) → Middleware (auth/validation) → Handlers   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│   Business Logic → Validation → Database Operations         │
└─────────────────────────────┬───────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │     Redis       │  │    BullMQ       │
│   (Drizzle)     │  │   (Sessions)    │  │   (Jobs)        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Hono app configuration
│   ├── env.ts                # Environment validation
│   ├── config/
│   │   ├── database.ts       # PostgreSQL/Drizzle connection
│   │   └── redis.ts          # Redis/IORedis connection
│   ├── db/
│   │   ├── index.ts          # Re-exports database connection
│   │   ├── schema/           # Table definitions
│   │   └── migrations/       # Generated migrations
│   ├── routes/
│   │   ├── health.ts         # Health check
│   │   ├── auth.ts           # Auth endpoints
│   │   ├── v1/               # Public API (API key auth)
│   │   │   ├── openapi.ts
│   │   │   ├── openapi-schemas.ts
│   │   │   ├── projects/
│   │   │   └── handlers/
│   │   ├── admin/            # Admin panel (Session auth)
│   │   │   ├── organisations.ts
│   │   │   └── projects.ts
│   │   └── superadmin/       # Superadmin only
│   ├── middleware/
│   │   ├── api-key-auth.ts   # API key validation
│   │   ├── session-auth.ts   # Session-based auth
│   │   ├── org-validation.ts # Organization membership
│   │   └── superadmin-auth.ts
│   ├── services/
│   │   ├── api-key-service.ts      # Simple flat services
│   │   ├── organisation-service.ts
│   │   ├── queue/                  # Complex domain folders
│   │   │   └── queue-manager.ts
│   │   └── stripe/
│   │       ├── stripe-client.ts
│   │       └── subscription-manager.ts
│   ├── queue/
│   │   ├── manager.ts        # Queue setup
│   │   └── processors/       # Job handlers
│   └── lib/
│       └── auth.ts           # better-auth config
├── drizzle.config.ts
├── tsup.config.ts
└── vitest.config.ts
```

## Routing Table

| User wants... | Read |
|---------------|------|
| Folder organization, file naming | [structure/](./structure/) |
| Database schemas, queries, migrations | [database/](./database/) |
| API routes, OpenAPI, handlers | [api/](./api/) |
| Session auth, API keys, RBAC | [auth/](./auth/) |
| Request middleware, rate limiting | [middleware/](./middleware/) |
| Business logic, service patterns | [services/](./services/) |
| Background jobs, scheduled tasks | [queue/](./queue/) |
| Unit tests, integration tests | [testing/](./testing/) |
| Environment, connections, shutdown | [config/](./config/) |

## Quick Start

### 1. Install Dependencies

```bash
npm install hono @hono/node-server @hono/zod-openapi zod
npm install drizzle-orm postgres
npm install bullmq ioredis
npm install better-auth
npm install -D typescript tsup vitest drizzle-kit @types/node
```

### 2. Create Entry Point

```typescript
// src/index.ts
import { serve } from "@hono/node-server";
import { app } from "./app";
import { env } from "./env";

const server = serve({ fetch: app.fetch, port: env.PORT });
console.log(`Server running on port ${env.PORT}`);

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close();
  process.exit(0);
});
```

### 3. Create App

```typescript
// src/app.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

export const app = new OpenAPIHono();

app.use("*", logger());
app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));
```

### 4. Add Environment Validation

```typescript
// src/env.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  BETTER_AUTH_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

## Key Principles

### 1. Three-Tier Route Organization
- **v1/**: Public API with API key auth
- **admin/**: Dashboard routes with session auth
- **superadmin/**: Internal admin with isAdmin check

### 2. Type Safety Everywhere
- Database queries typed via Drizzle
- API routes typed via Zod + OpenAPI
- Environment validated at startup

### 3. Layered Architecture
- **Routes**: HTTP handling only
- **Middleware**: Cross-cutting concerns
- **Services**: Business logic (framework-agnostic)
- **Database**: Data access via Drizzle

### 4. Auth Strategy
- **Sessions**: For web UI (cookie-based via better-auth)
- **API Keys**: For programmatic access (bearer tokens)
- **RBAC**: Role-based permissions per organization

### 5. Background Processing
- BullMQ for reliable job queuing
- Redis for queue storage
- Graceful shutdown with job completion

## Common Patterns

### Adding a New Domain

1. **Create schema**: `src/db/schema/[domain].ts`
2. **Generate migration**: `npx drizzle-kit generate`
3. **Create service**: `src/services/[domain]-service.ts` (simple) or `src/services/[domain]/` (complex)
4. **Create routes**: Add to appropriate tier (v1/, admin/, or superadmin/)
5. **Mount routes**: Add to route aggregation file

### Adding Public API Endpoint

```typescript
// 1. Add schema to routes/v1/openapi-schemas.ts
// 2. Add handler to routes/v1/handlers/[feature].handler.ts
// 3. Add route to routes/v1/projects/index.ts
```

### Adding Admin Endpoint

```typescript
// Add inline handler in routes/admin/[resource].ts
```

### Adding Background Jobs

```typescript
import { queues } from "~/queue/manager";

// In service
await queues.email.add("welcome", { userId: "123" });
```

## Detailed Documentation

For complete code examples and patterns, see the [plan/](./plan/) directory which contains comprehensive documentation extracted from production patterns.

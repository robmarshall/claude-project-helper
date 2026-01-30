# Testing (Vitest + Testcontainers)

## Quick Reference

| Tool | Purpose |
|------|---------|
| Vitest | Test runner and assertions |
| Testcontainers | Real PostgreSQL/Redis in Docker |
| supertest | HTTP request testing |

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | With coverage |
| `npm run test:ui` | Vitest UI |

## Basic Test Structure

```typescript
// src/services/queues/index.test.ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "~/db";
import { queues } from "~/db/schema";
import { eq } from "drizzle-orm";
import * as queueService from "./index";

describe("Queue Service", () => {
  const testOrgId = "test-org";
  const testUserId = "test-user";

  beforeEach(async () => {
    // Clean test data
    await db.delete(queues).where(eq(queues.organizationId, testOrgId));
  });

  it("creates a queue", async () => {
    const queue = await queueService.createQueue({
      name: "Test Queue",
      organizationId: testOrgId,
      createdBy: testUserId,
    });

    expect(queue.name).toBe("Test Queue");
    expect(queue.organizationId).toBe(testOrgId);
  });

  it("lists queues with pagination", async () => {
    // Create test data
    for (let i = 0; i < 5; i++) {
      await queueService.createQueue({
        name: `Queue ${i}`,
        organizationId: testOrgId,
        createdBy: testUserId,
      });
    }

    const result = await queueService.listQueues({
      organizationId: testOrgId,
      page: 1,
      limit: 2,
    });

    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(5);
    expect(result.pagination.totalPages).toBe(3);
  });
});
```

## Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    poolOptions: {
      forks: {
        singleFork: true, // Share DB connection
      },
    },
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
```

## Test Setup with Testcontainers

```typescript
// src/test/setup.ts
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer } from "testcontainers";
import { beforeAll, afterAll } from "vitest";

let pgContainer: StartedPostgreSqlContainer;
let redisContainer: StartedGenericContainer;

beforeAll(async () => {
  // Start PostgreSQL
  pgContainer = await new PostgreSqlContainer()
    .withDatabase("test")
    .start();

  // Start Redis
  redisContainer = await new GenericContainer("redis:7")
    .withExposedPorts(6379)
    .start();

  // Set env vars for connections
  process.env.DATABASE_URL = pgContainer.getConnectionUri();
  process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

  // Run migrations
  await runMigrations();
}, 60000);

afterAll(async () => {
  await pgContainer?.stop();
  await redisContainer?.stop();
});
```

## Related Documentation

- [Full Patterns & Examples](./patterns.md)
- [Services](../services/INDEX.md)
- [Database](../database/INDEX.md)

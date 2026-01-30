# Testing (Vitest + Testcontainers)

## Overview

| Tool | Purpose |
|------|---------|
| Vitest | Test runner and assertions |
| Testcontainers | Real PostgreSQL/Redis in Docker |

## Commands

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
npm run test:ui       # Vitest UI
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
      forks: { singleFork: true }, // Share DB connection
    },
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/test/**"],
    },
  },
  resolve: {
    alias: { "~": path.resolve(__dirname, "./src") },
  },
});
```

## Test Setup with Testcontainers

```typescript
// src/test/setup.ts
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer } from "testcontainers";
import { beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "~/db/schema";

let pgContainer, redisContainer, sql, db;

beforeAll(async () => {
  // Start PostgreSQL
  pgContainer = await new PostgreSqlContainer("postgres:16")
    .withDatabase("testdb")
    .start();

  // Start Redis
  redisContainer = await new GenericContainer("redis:7-alpine")
    .withExposedPorts(6379)
    .start();

  // Set env vars
  process.env.DATABASE_URL = pgContainer.getConnectionUri();
  process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

  // Initialize database
  sql = postgres(process.env.DATABASE_URL);
  db = drizzle(sql, { schema });

  // Run migrations
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
}, 60000);

afterAll(async () => {
  await sql?.end();
  await pgContainer?.stop();
  await redisContainer?.stop();
});

export { db };
```

## Service Unit Tests

```typescript
// src/services/queues/index.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "~/test/setup";
import { queues } from "~/db/schema";
import { eq } from "drizzle-orm";
import * as queueService from "./index";

describe("Queue Service", () => {
  const testOrgId = "test-org";
  const testUserId = "test-user";

  beforeEach(async () => {
    await db.delete(queues).where(eq(queues.organizationId, testOrgId));
  });

  describe("createQueue", () => {
    it("creates a queue with defaults", async () => {
      const queue = await queueService.createQueue({
        name: "Test Queue",
        organizationId: testOrgId,
        createdBy: testUserId,
      });

      expect(queue.name).toBe("Test Queue");
      expect(queue.maxConcurrency).toBe(5);
    });

    it("throws on duplicate name", async () => {
      await queueService.createQueue({ name: "Dup", organizationId: testOrgId, createdBy: testUserId });

      await expect(
        queueService.createQueue({ name: "Dup", organizationId: testOrgId, createdBy: testUserId })
      ).rejects.toThrow("already exists");
    });
  });

  describe("listQueues", () => {
    beforeEach(async () => {
      for (let i = 0; i < 5; i++) {
        await queueService.createQueue({ name: `Queue ${i}`, organizationId: testOrgId, createdBy: testUserId });
      }
    });

    it("returns paginated results", async () => {
      const result = await queueService.listQueues({ organizationId: testOrgId, page: 1, limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3 });
    });

    it("filters by search", async () => {
      await queueService.createQueue({ name: "Special", organizationId: testOrgId, createdBy: testUserId });

      const result = await queueService.listQueues({ organizationId: testOrgId, page: 1, limit: 10, search: "Special" });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Special");
    });
  });
});
```

## API Integration Tests

```typescript
// src/routes/queues/index.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { app } from "~/app";
import { db } from "~/test/setup";
import { queues } from "~/db/schema";
import { eq } from "drizzle-orm";

// Mock auth
vi.mock("~/middleware/auth", () => ({
  authMiddleware: vi.fn((c, next) => {
    c.set("user", { id: "test-user", email: "test@example.com", name: "Test" });
    c.set("organizationId", "test-org");
    c.set("isApiKey", false);
    return next();
  }),
}));

describe("Queue Routes", () => {
  beforeEach(async () => {
    await db.delete(queues).where(eq(queues.organizationId, "test-org"));
  });

  it("POST /api/queues creates a queue", async () => {
    const res = await app.request("/api/queues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Queue" }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.name).toBe("New Queue");
  });

  it("GET /api/queues returns list", async () => {
    await db.insert(queues).values([
      { name: "Q1", organizationId: "test-org", createdBy: "test-user" },
      { name: "Q2", organizationId: "test-org", createdBy: "test-user" },
    ]);

    const res = await app.request("/api/queues?page=1&limit=10");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
  });

  it("GET /api/queues/:id returns 404 for missing", async () => {
    const res = await app.request("/api/queues/non-existent");
    expect(res.status).toBe(404);
  });
});
```

## Test Utilities

```typescript
// src/test/utils.ts
import { db } from "./setup";
import { users, organizations, apiKeys } from "~/db/schema";
import { createId } from "@paralleldrive/cuid2";

export async function createTestOrganization(name = "Test Org") {
  const [org] = await db.insert(organizations).values({
    id: createId(),
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
  }).returning();
  return org;
}

export async function createTestUser(orgId: string) {
  const [user] = await db.insert(users).values({
    id: createId(),
    email: `test-${createId()}@example.com`,
    name: "Test User",
    organizationId: orgId,
  }).returning();
  return user;
}

export function createTestFixtures() {
  let org, user;
  return {
    async setup() {
      org = await createTestOrganization();
      user = await createTestUser(org.id);
      return { org, user };
    },
    get org() { return org; },
    get user() { return user; },
  };
}
```

## Mocking External Services

```typescript
// src/test/mocks.ts
import { vi } from "vitest";

export const mockEmailService = {
  sendEmail: vi.fn().mockResolvedValue({ messageId: "mock-id" }),
};

vi.mock("~/lib/email", () => mockEmailService);

export const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  publish: vi.fn(),
};

vi.mock("~/config/redis", () => ({ redis: mockRedis }));

export function resetMocks() {
  mockEmailService.sendEmail.mockClear();
  Object.values(mockRedis).forEach((fn) => fn.mockClear());
}
```

## Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

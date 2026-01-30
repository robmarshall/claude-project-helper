# Testing Patterns

## Complete Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Use globals (describe, it, expect without imports)
    globals: true,

    // Node environment
    environment: "node",

    // Test file patterns
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],

    // Exclude patterns
    exclude: ["node_modules", "dist"],

    // Setup file
    setupFiles: ["./src/test/setup.ts"],

    // Pool configuration for database tests
    poolOptions: {
      forks: {
        singleFork: true, // Share connection across tests
      },
    },

    // Timeouts
    testTimeout: 30000,
    hookTimeout: 30000,

    // Coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/test/**",
        "src/types/**",
      ],
    },

    // Reporter
    reporters: ["verbose"],
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
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer, StartedTestContainer } from "testcontainers";
import { beforeAll, afterAll, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "~/db/schema";

// Container references
let pgContainer: StartedPostgreSqlContainer;
let redisContainer: StartedTestContainer;

// Database client
let sql: postgres.Sql;
let db: ReturnType<typeof drizzle>;

beforeAll(async () => {
  console.log("Starting test containers...");

  // Start PostgreSQL container
  pgContainer = await new PostgreSqlContainer("postgres:16")
    .withDatabase("testdb")
    .withUsername("test")
    .withPassword("test")
    .start();

  // Start Redis container
  redisContainer = await new GenericContainer("redis:7-alpine")
    .withExposedPorts(6379)
    .start();

  // Set environment variables
  const pgUri = pgContainer.getConnectionUri();
  const redisUri = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

  process.env.DATABASE_URL = pgUri;
  process.env.REDIS_URL = redisUri;

  console.log(`PostgreSQL: ${pgUri}`);
  console.log(`Redis: ${redisUri}`);

  // Initialize database
  sql = postgres(pgUri);
  db = drizzle(sql, { schema });

  // Run migrations
  await migrate(db, { migrationsFolder: "./src/db/migrations" });

  console.log("Test containers ready");
}, 60000); // 60 second timeout for container startup

afterAll(async () => {
  console.log("Stopping test containers...");

  // Close database connection
  await sql?.end();

  // Stop containers
  await pgContainer?.stop();
  await redisContainer?.stop();

  console.log("Test containers stopped");
});

// Export for use in tests
export { db };
```

## Service Unit Tests

```typescript
// src/services/queues/index.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "~/test/setup";
import { queues, queueItems } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import * as queueService from "./index";

describe("Queue Service", () => {
  const testOrgId = "test-org-123";
  const testUserId = "test-user-123";

  // Clean up before each test
  beforeEach(async () => {
    await db.delete(queueItems);
    await db.delete(queues).where(eq(queues.organizationId, testOrgId));
  });

  describe("createQueue", () => {
    it("creates a queue with default values", async () => {
      const queue = await queueService.createQueue({
        name: "Test Queue",
        organizationId: testOrgId,
        createdBy: testUserId,
      });

      expect(queue).toMatchObject({
        name: "Test Queue",
        organizationId: testOrgId,
        createdBy: testUserId,
        maxConcurrency: 5, // default
      });
      expect(queue.id).toBeDefined();
      expect(queue.createdAt).toBeInstanceOf(Date);
    });

    it("creates a queue with custom values", async () => {
      const queue = await queueService.createQueue({
        name: "Custom Queue",
        description: "A test queue",
        maxConcurrency: 10,
        organizationId: testOrgId,
        createdBy: testUserId,
      });

      expect(queue.description).toBe("A test queue");
      expect(queue.maxConcurrency).toBe(10);
    });

    it("throws on duplicate name within organization", async () => {
      await queueService.createQueue({
        name: "Unique Name",
        organizationId: testOrgId,
        createdBy: testUserId,
      });

      await expect(
        queueService.createQueue({
          name: "Unique Name",
          organizationId: testOrgId,
          createdBy: testUserId,
        })
      ).rejects.toThrow("Queue with this name already exists");
    });

    it("allows same name in different organizations", async () => {
      await queueService.createQueue({
        name: "Shared Name",
        organizationId: testOrgId,
        createdBy: testUserId,
      });

      const queue = await queueService.createQueue({
        name: "Shared Name",
        organizationId: "other-org",
        createdBy: testUserId,
      });

      expect(queue.name).toBe("Shared Name");
    });
  });

  describe("getQueue", () => {
    it("returns queue by id and org", async () => {
      const created = await queueService.createQueue({
        name: "Find Me",
        organizationId: testOrgId,
        createdBy: testUserId,
      });

      const found = await queueService.getQueue(created.id, testOrgId);

      expect(found).toMatchObject({
        id: created.id,
        name: "Find Me",
      });
    });

    it("returns undefined for wrong organization", async () => {
      const created = await queueService.createQueue({
        name: "Find Me",
        organizationId: testOrgId,
        createdBy: testUserId,
      });

      const found = await queueService.getQueue(created.id, "wrong-org");

      expect(found).toBeUndefined();
    });

    it("returns undefined for non-existent id", async () => {
      const found = await queueService.getQueue("non-existent", testOrgId);
      expect(found).toBeUndefined();
    });
  });

  describe("listQueues", () => {
    beforeEach(async () => {
      // Create test queues
      for (let i = 1; i <= 5; i++) {
        await queueService.createQueue({
          name: `Queue ${i}`,
          organizationId: testOrgId,
          createdBy: testUserId,
        });
      }
    });

    it("returns paginated results", async () => {
      const result = await queueService.listQueues({
        organizationId: testOrgId,
        page: 1,
        limit: 2,
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
    });

    it("returns correct page", async () => {
      const page1 = await queueService.listQueues({
        organizationId: testOrgId,
        page: 1,
        limit: 2,
      });

      const page2 = await queueService.listQueues({
        organizationId: testOrgId,
        page: 2,
        limit: 2,
      });

      // Different results
      expect(page1.data[0].id).not.toBe(page2.data[0].id);
    });

    it("filters by search term", async () => {
      await queueService.createQueue({
        name: "Special Queue",
        organizationId: testOrgId,
        createdBy: testUserId,
      });

      const result = await queueService.listQueues({
        organizationId: testOrgId,
        page: 1,
        limit: 10,
        search: "Special",
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Special Queue");
    });
  });

  describe("updateQueue", () => {
    it("updates queue fields", async () => {
      const created = await queueService.createQueue({
        name: "Original Name",
        organizationId: testOrgId,
        createdBy: testUserId,
      });

      const updated = await queueService.updateQueue(
        created.id,
        testOrgId,
        { name: "New Name", maxConcurrency: 20 }
      );

      expect(updated?.name).toBe("New Name");
      expect(updated?.maxConcurrency).toBe(20);
    });

    it("returns undefined for non-existent queue", async () => {
      const result = await queueService.updateQueue(
        "non-existent",
        testOrgId,
        { name: "New Name" }
      );

      expect(result).toBeUndefined();
    });
  });

  describe("deleteQueue", () => {
    it("soft deletes a queue", async () => {
      const created = await queueService.createQueue({
        name: "Delete Me",
        organizationId: testOrgId,
        createdBy: testUserId,
      });

      const deleted = await queueService.deleteQueue(created.id, testOrgId);

      expect(deleted).toBe(true);

      // Should not be found anymore
      const found = await queueService.getQueue(created.id, testOrgId);
      expect(found).toBeUndefined();
    });

    it("returns false for non-existent queue", async () => {
      const deleted = await queueService.deleteQueue("non-existent", testOrgId);
      expect(deleted).toBe(false);
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
import { queues, users, organizations } from "~/db/schema";
import { eq } from "drizzle-orm";

// Mock auth middleware
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

  describe("POST /api/queues", () => {
    it("creates a queue", async () => {
      const res = await app.request("/api/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Queue" }),
      });

      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.data.name).toBe("New Queue");
      expect(body.data.id).toBeDefined();
    });

    it("returns 400 for missing name", async () => {
      const res = await app.request("/api/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/queues", () => {
    it("returns paginated list", async () => {
      // Create test data directly
      await db.insert(queues).values([
        { name: "Queue 1", organizationId: "test-org", createdBy: "test-user" },
        { name: "Queue 2", organizationId: "test-org", createdBy: "test-user" },
      ]);

      const res = await app.request("/api/queues?page=1&limit=10");

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toHaveLength(2);
      expect(body.pagination.total).toBe(2);
    });

    it("filters by search", async () => {
      await db.insert(queues).values([
        { name: "Alpha", organizationId: "test-org", createdBy: "test-user" },
        { name: "Beta", organizationId: "test-org", createdBy: "test-user" },
      ]);

      const res = await app.request("/api/queues?search=Alpha");
      const body = await res.json();

      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe("Alpha");
    });
  });

  describe("GET /api/queues/:id", () => {
    it("returns queue by id", async () => {
      const [queue] = await db.insert(queues).values({
        name: "Find Me",
        organizationId: "test-org",
        createdBy: "test-user",
      }).returning();

      const res = await app.request(`/api/queues/${queue.id}`);

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.name).toBe("Find Me");
    });

    it("returns 404 for non-existent queue", async () => {
      const res = await app.request("/api/queues/non-existent");
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/queues/:id", () => {
    it("updates queue", async () => {
      const [queue] = await db.insert(queues).values({
        name: "Original",
        organizationId: "test-org",
        createdBy: "test-user",
      }).returning();

      const res = await app.request(`/api/queues/${queue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.name).toBe("Updated");
    });
  });

  describe("DELETE /api/queues/:id", () => {
    it("deletes queue", async () => {
      const [queue] = await db.insert(queues).values({
        name: "Delete Me",
        organizationId: "test-org",
        createdBy: "test-user",
      }).returning();

      const res = await app.request(`/api/queues/${queue.id}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(204);

      // Verify deleted
      const getRes = await app.request(`/api/queues/${queue.id}`);
      expect(getRes.status).toBe(404);
    });
  });
});
```

## Testing Utilities

```typescript
// src/test/utils.ts
import { db } from "./setup";
import { users, organizations, apiKeys } from "~/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { hashApiKey, generateApiKey } from "~/services/api-keys";

export async function createTestOrganization(name = "Test Org") {
  const [org] = await db.insert(organizations).values({
    id: createId(),
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
  }).returning();

  return org;
}

export async function createTestUser(orgId: string, data?: Partial<typeof users.$inferInsert>) {
  const [user] = await db.insert(users).values({
    id: createId(),
    email: `test-${createId()}@example.com`,
    name: "Test User",
    organizationId: orgId,
    ...data,
  }).returning();

  return user;
}

export async function createTestApiKey(userId: string, orgId: string) {
  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);

  const [apiKey] = await db.insert(apiKeys).values({
    id: createId(),
    name: "Test API Key",
    keyHash,
    keyPrefix: rawKey.slice(0, 12),
    userId,
    organizationId: orgId,
  }).returning();

  return { apiKey, rawKey };
}

// Factory for creating test fixtures
export function createTestFixtures() {
  let org: typeof organizations.$inferSelect;
  let user: typeof users.$inferSelect;
  let apiKey: { apiKey: typeof apiKeys.$inferSelect; rawKey: string };

  return {
    async setup() {
      org = await createTestOrganization();
      user = await createTestUser(org.id);
      apiKey = await createTestApiKey(user.id, org.id);

      return { org, user, apiKey };
    },

    get org() { return org; },
    get user() { return user; },
    get apiKey() { return apiKey; },
  };
}
```

## Mocking External Services

```typescript
// src/test/mocks.ts
import { vi } from "vitest";

// Mock email service
export const mockEmailService = {
  sendEmail: vi.fn().mockResolvedValue({ messageId: "mock-id" }),
};

vi.mock("~/lib/email", () => mockEmailService);

// Mock Redis
export const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  publish: vi.fn(),
  subscribe: vi.fn(),
};

vi.mock("~/config/redis", () => ({
  redis: mockRedis,
}));

// Reset mocks between tests
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
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts"
  }
}
```

## Related Documentation

- [Quick Reference](./INDEX.md)
- [Services](../services/INDEX.md)
- [Database](../database/INDEX.md)

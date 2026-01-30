# Service Patterns

## Complete CRUD Service

```typescript
// src/services/queues/index.ts
import { db } from "~/db";
import { queues, queueItems, type Queue, type NewQueue } from "~/db/schema";
import { eq, and, desc, like, count, isNull } from "drizzle-orm";
import { NotFoundError, ValidationError } from "~/lib/errors";

// ============================================================
// Types
// ============================================================

export interface CreateQueueInput {
  name: string;
  description?: string | null;
  maxConcurrency?: number;
  organizationId: string;
  createdBy: string;
}

export interface UpdateQueueInput {
  name?: string;
  description?: string | null;
  maxConcurrency?: number;
}

export interface ListQueuesInput {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================
// Create
// ============================================================

export async function createQueue(input: CreateQueueInput): Promise<Queue> {
  // Validate unique name within organization
  const existing = await db
    .select({ id: queues.id })
    .from(queues)
    .where(and(
      eq(queues.organizationId, input.organizationId),
      eq(queues.name, input.name)
    ))
    .limit(1);

  if (existing.length > 0) {
    throw new ValidationError("Queue with this name already exists");
  }

  const [queue] = await db.insert(queues).values({
    name: input.name,
    description: input.description ?? null,
    maxConcurrency: input.maxConcurrency ?? 5,
    organizationId: input.organizationId,
    createdBy: input.createdBy,
  }).returning();

  return queue;
}

// ============================================================
// Read
// ============================================================

export async function getQueue(
  id: string,
  organizationId: string
): Promise<Queue | undefined> {
  const [queue] = await db
    .select()
    .from(queues)
    .where(and(
      eq(queues.id, id),
      eq(queues.organizationId, organizationId),
      isNull(queues.deletedAt) // Soft delete check
    ))
    .limit(1);

  return queue;
}

export async function getQueueOrThrow(
  id: string,
  organizationId: string
): Promise<Queue> {
  const queue = await getQueue(id, organizationId);

  if (!queue) {
    throw new NotFoundError("Queue not found");
  }

  return queue;
}

export async function listQueues(
  input: ListQueuesInput
): Promise<PaginatedResult<Queue>> {
  const { organizationId, page, limit, search } = input;
  const offset = (page - 1) * limit;

  // Build where clause
  const whereConditions = [
    eq(queues.organizationId, organizationId),
    isNull(queues.deletedAt),
  ];

  if (search) {
    whereConditions.push(like(queues.name, `%${search}%`));
  }

  const where = and(...whereConditions);

  // Parallel queries for data and count
  const [data, countResult] = await Promise.all([
    db.select()
      .from(queues)
      .where(where)
      .orderBy(desc(queues.createdAt))
      .limit(limit)
      .offset(offset),

    db.select({ total: count() })
      .from(queues)
      .where(where),
  ]);

  const total = countResult[0]?.total ?? 0;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================
// Update
// ============================================================

export async function updateQueue(
  id: string,
  organizationId: string,
  input: UpdateQueueInput
): Promise<Queue | undefined> {
  // Check exists
  const existing = await getQueue(id, organizationId);
  if (!existing) {
    return undefined;
  }

  // Check name uniqueness if changing
  if (input.name && input.name !== existing.name) {
    const duplicate = await db
      .select({ id: queues.id })
      .from(queues)
      .where(and(
        eq(queues.organizationId, organizationId),
        eq(queues.name, input.name)
      ))
      .limit(1);

    if (duplicate.length > 0) {
      throw new ValidationError("Queue with this name already exists");
    }
  }

  const [updated] = await db
    .update(queues)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(queues.id, id))
    .returning();

  return updated;
}

// ============================================================
// Delete
// ============================================================

export async function deleteQueue(
  id: string,
  organizationId: string
): Promise<boolean> {
  // Soft delete
  const result = await db
    .update(queues)
    .set({ deletedAt: new Date() })
    .where(and(
      eq(queues.id, id),
      eq(queues.organizationId, organizationId),
      isNull(queues.deletedAt)
    ))
    .returning({ id: queues.id });

  return result.length > 0;
}

// Hard delete (use with caution)
export async function hardDeleteQueue(
  id: string,
  organizationId: string
): Promise<boolean> {
  const result = await db
    .delete(queues)
    .where(and(
      eq(queues.id, id),
      eq(queues.organizationId, organizationId)
    ))
    .returning({ id: queues.id });

  return result.length > 0;
}
```

## Transaction Pattern

```typescript
// src/services/queues/index.ts
import { db } from "~/db";

export async function createQueueWithItems(
  queueInput: CreateQueueInput,
  items: CreateQueueItemInput[]
): Promise<{ queue: Queue; items: QueueItem[] }> {
  return db.transaction(async (tx) => {
    // Create queue
    const [queue] = await tx.insert(queues).values({
      name: queueInput.name,
      description: queueInput.description,
      organizationId: queueInput.organizationId,
      createdBy: queueInput.createdBy,
    }).returning();

    // Create items
    const createdItems = await tx.insert(queueItems).values(
      items.map((item) => ({
        queueId: queue.id,
        payload: item.payload,
        priority: item.priority ?? 0,
      }))
    ).returning();

    return { queue, items: createdItems };
  });
}
```

## Service with External Dependencies

```typescript
// src/services/notifications/index.ts
import { db } from "~/db";
import { notifications } from "~/db/schema";
import { redis } from "~/config/redis";
import { queueManager } from "~/queue/manager";

interface SendNotificationInput {
  userId: string;
  type: "email" | "push" | "in_app";
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendNotification(input: SendNotificationInput) {
  // Save to database
  const [notification] = await db.insert(notifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    data: input.data ?? {},
    status: "pending",
  }).returning();

  // Queue for processing
  await queueManager.addJob("notifications", {
    notificationId: notification.id,
    type: input.type,
  });

  // Publish real-time event
  await redis.publish(`user:${input.userId}:notifications`, JSON.stringify({
    type: "new_notification",
    notification,
  }));

  return notification;
}
```

## Error Classes

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: Record<string, string>) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}
```

## Using Errors in Services

```typescript
// src/services/queues/index.ts
import { NotFoundError, ValidationError, ConflictError } from "~/lib/errors";

export async function createQueue(input: CreateQueueInput): Promise<Queue> {
  // Check for duplicates
  const existing = await db
    .select({ id: queues.id })
    .from(queues)
    .where(and(
      eq(queues.organizationId, input.organizationId),
      eq(queues.name, input.name)
    ))
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError("Queue with this name already exists");
  }

  // Validate input
  if (input.maxConcurrency && input.maxConcurrency > 100) {
    throw new ValidationError("Max concurrency cannot exceed 100", {
      maxConcurrency: "Must be between 1 and 100",
    });
  }

  // Create...
}

export async function getQueueOrThrow(
  id: string,
  organizationId: string
): Promise<Queue> {
  const queue = await getQueue(id, organizationId);

  if (!queue) {
    throw new NotFoundError(`Queue ${id} not found`);
  }

  return queue;
}
```

## Handling Errors in Routes

```typescript
// src/routes/queues/handlers.ts
import * as queueService from "~/services/queues";
import { NotFoundError, ValidationError, ConflictError } from "~/lib/errors";

export const createQueue = async (c) => {
  try {
    const queue = await queueService.createQueue({
      ...c.req.valid("json"),
      organizationId: c.get("organizationId"),
      createdBy: c.get("user").id,
    });

    return c.json({ data: queue }, 201);
  } catch (error) {
    if (error instanceof ConflictError) {
      return c.json({ error: error.message }, 409);
    }
    if (error instanceof ValidationError) {
      return c.json({ error: error.message, details: error.details }, 400);
    }
    throw error; // Let error middleware handle
  }
};

// Or use global error handler (preferred)
// src/middleware/error-handler.ts
export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json({
      error: err.message,
      code: err.code,
      ...(err instanceof ValidationError && err.details ? { details: err.details } : {}),
    }, err.statusCode);
  }

  // Handle other errors...
}
```

## Composing Services

```typescript
// src/services/organizations/index.ts
import * as userService from "~/services/users";
import * as roleService from "~/services/roles";
import * as queueService from "~/services/queues";

export async function createOrganizationWithOwner(
  orgInput: CreateOrganizationInput,
  userInput: CreateUserInput
) {
  return db.transaction(async (tx) => {
    // Create organization
    const [org] = await tx.insert(organizations).values({
      name: orgInput.name,
      slug: orgInput.slug,
    }).returning();

    // Create user with org reference
    const [user] = await tx.insert(users).values({
      ...userInput,
      organizationId: org.id,
    }).returning();

    // Assign owner role
    await tx.insert(userRoles).values({
      userId: user.id,
      organizationId: org.id,
      roleId: "owner",
    });

    // Create default queue
    const [defaultQueue] = await tx.insert(queues).values({
      name: "Default",
      organizationId: org.id,
      createdBy: user.id,
    }).returning();

    return {
      organization: org,
      user,
      defaultQueue,
    };
  });
}
```

## Service Testing

```typescript
// src/services/queues/index.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "~/db";
import { queues } from "~/db/schema";
import * as queueService from "./index";

describe("Queue Service", () => {
  const testOrgId = "test-org-id";
  const testUserId = "test-user-id";

  beforeEach(async () => {
    // Clean up test data
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
      expect(queue.organizationId).toBe(testOrgId);
    });

    it("throws on duplicate name", async () => {
      await queueService.createQueue({
        name: "Duplicate",
        organizationId: testOrgId,
        createdBy: testUserId,
      });

      await expect(
        queueService.createQueue({
          name: "Duplicate",
          organizationId: testOrgId,
          createdBy: testUserId,
        })
      ).rejects.toThrow("Queue with this name already exists");
    });
  });
});
```

## Related Documentation

- [Quick Reference](./INDEX.md)
- [Database](../database/INDEX.md)
- [Testing](../testing/INDEX.md)

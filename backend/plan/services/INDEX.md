# Services (Business Logic Layer)

## Quick Reference

| Concept | Description |
|---------|-------------|
| Service | Pure business logic, no HTTP concerns |
| Input types | Define what the service needs |
| Return types | Define what the service provides |
| Transactions | Use for multi-step operations |
| Errors | Throw domain-specific errors |

## Service Layer Purpose

```
Route Handler → Service → Database
      ↑            ↓
   HTTP      Business Logic
  concerns     (pure functions)
```

Services:
- Contain business logic and validation
- Handle database operations
- Are framework-agnostic (no Hono types)
- Can be unit tested in isolation
- Are reusable across different entry points (API, queue jobs, CLI)

## Basic Service Pattern

```typescript
// src/services/queues/index.ts
import { db } from "~/db";
import { queues, type Queue, type NewQueue } from "~/db/schema";
import { eq, and, desc, like } from "drizzle-orm";

// Input types
interface CreateQueueInput {
  name: string;
  description?: string;
  maxConcurrency?: number;
  organizationId: string;
  createdBy: string;
}

interface ListQueuesInput {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
}

// Service functions
export async function createQueue(input: CreateQueueInput): Promise<Queue> {
  const [queue] = await db.insert(queues).values({
    name: input.name,
    description: input.description ?? null,
    maxConcurrency: input.maxConcurrency ?? 5,
    organizationId: input.organizationId,
    createdBy: input.createdBy,
  }).returning();

  return queue;
}

export async function getQueue(
  id: string,
  organizationId: string
): Promise<Queue | undefined> {
  const [queue] = await db
    .select()
    .from(queues)
    .where(and(
      eq(queues.id, id),
      eq(queues.organizationId, organizationId)
    ))
    .limit(1);

  return queue;
}

export async function listQueues(input: ListQueuesInput) {
  const { organizationId, page, limit, search } = input;
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [eq(queues.organizationId, organizationId)];
  if (search) {
    conditions.push(like(queues.name, `%${search}%`));
  }

  // Get data and count
  const [data, [{ total }]] = await Promise.all([
    db.select()
      .from(queues)
      .where(and(...conditions))
      .orderBy(desc(queues.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() })
      .from(queues)
      .where(and(...conditions)),
  ]);

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
```

## Using Services in Handlers

```typescript
// src/routes/queues/handlers.ts
import * as queueService from "~/services/queues";

export const createQueue = async (c) => {
  const body = c.req.valid("json");
  const organizationId = c.get("organizationId");
  const userId = c.get("user").id;

  // Delegate to service
  const queue = await queueService.createQueue({
    ...body,
    organizationId,
    createdBy: userId,
  });

  return c.json({ data: queue }, 201);
};
```

## Related Documentation

- [Full Patterns & Examples](./patterns.md)
- [Database](../database/INDEX.md)
- [API Routes](../api/INDEX.md)

# Database Patterns

## Full Schema Examples

### Users Table with Auth Integration

```typescript
// src/db/schema/users.ts
import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { organizations } from "./organizations";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),

  // Core fields
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),

  // Organization (multi-tenant)
  organizationId: text("organization_id")
    .references(() => organizations.id, { onDelete: "set null" }),

  // Auth fields (managed by better-auth)
  emailVerified: boolean("email_verified").default(false).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  orgIdx: index("users_org_idx").on(table.organizationId),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### API Keys Table

```typescript
// src/db/schema/api-keys.ts
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";
import { organizations } from "./organizations";

export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey().$defaultFn(() => createId()),

  // Key identification
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(), // Hashed API key
  keyPrefix: text("key_prefix").notNull(), // First 8 chars for identification

  // Ownership
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  // Metadata
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  keyHashIdx: index("api_keys_hash_idx").on(table.keyHash),
  orgIdx: index("api_keys_org_idx").on(table.organizationId),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
```

### Queue Items with Status

```typescript
// src/db/schema/queue-items.ts
import { pgTable, text, timestamp, integer, jsonb, index, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { queues } from "./queues";

export const queueItemStatusEnum = pgEnum("queue_item_status", [
  "waiting",
  "processing",
  "completed",
  "failed",
]);

export const queueItems = pgTable("queue_items", {
  id: text("id").primaryKey().$defaultFn(() => createId()),

  // Queue reference
  queueId: text("queue_id")
    .notNull()
    .references(() => queues.id, { onDelete: "cascade" }),

  // Item data
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
  status: queueItemStatusEnum("status").default("waiting").notNull(),
  priority: integer("priority").default(0).notNull(),

  // Processing metadata
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(3).notNull(),
  errorMessage: text("error_message"),

  // Timing
  scheduledFor: timestamp("scheduled_for"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  queueIdx: index("queue_items_queue_idx").on(table.queueId),
  statusIdx: index("queue_items_status_idx").on(table.status),
  scheduledIdx: index("queue_items_scheduled_idx").on(table.scheduledFor),
}));

export type QueueItem = typeof queueItems.$inferSelect;
export type NewQueueItem = typeof queueItems.$inferInsert;
```

## Query Patterns

### Basic CRUD Operations

```typescript
import { db } from "~/db";
import { users, type User, type NewUser } from "~/db/schema";
import { eq, and, desc, like, isNull } from "drizzle-orm";

// Create
async function createUser(data: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

// Read one
async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user;
}

// Read many with filters
async function getUsers(orgId: string, search?: string): Promise<User[]> {
  return db
    .select()
    .from(users)
    .where(
      and(
        eq(users.organizationId, orgId),
        search ? like(users.name, `%${search}%`) : undefined,
        isNull(users.deletedAt)
      )
    )
    .orderBy(desc(users.createdAt));
}

// Update
async function updateUser(id: string, data: Partial<NewUser>): Promise<User> {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

// Delete
async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

// Soft delete
async function softDeleteUser(id: string): Promise<void> {
  await db
    .update(users)
    .set({ deletedAt: new Date() })
    .where(eq(users.id, id));
}
```

### Pagination Pattern

```typescript
import { sql, count } from "drizzle-orm";

interface PaginationParams {
  page: number;
  limit: number;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function getPaginatedUsers(
  orgId: string,
  { page, limit }: PaginationParams
): Promise<PaginatedResult<User>> {
  const offset = (page - 1) * limit;

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(users)
    .where(eq(users.organizationId, orgId));

  // Get paginated data
  const data = await db
    .select()
    .from(users)
    .where(eq(users.organizationId, orgId))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

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

### Joins and Relations

```typescript
import { db } from "~/db";
import { users, organizations, userRoles, roles } from "~/db/schema";
import { eq } from "drizzle-orm";

// Simple join
async function getUserWithOrg(userId: string) {
  const [result] = await db
    .select({
      user: users,
      organization: organizations,
    })
    .from(users)
    .leftJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.id, userId));

  return result;
}

// Many-to-many with junction table
async function getUserRoles(userId: string) {
  return db
    .select({
      role: roles,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));
}

// Using Drizzle relations (define in schema)
// schema/relations.ts
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  apiKeys: many(apiKeys),
}));

// Query with relations
const userWithRelations = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    organization: true,
    apiKeys: true,
  },
});
```

### Transaction Pattern

```typescript
import { db } from "~/db";

async function createUserWithApiKey(userData: NewUser, keyName: string) {
  return db.transaction(async (tx) => {
    // Create user
    const [user] = await tx.insert(users).values(userData).returning();

    // Generate API key
    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);

    // Create API key record
    const [apiKey] = await tx.insert(apiKeys).values({
      name: keyName,
      keyHash,
      keyPrefix: rawKey.slice(0, 8),
      userId: user.id,
      organizationId: user.organizationId,
    }).returning();

    return { user, apiKey, rawKey };
  });
}
```

### Upsert Pattern

```typescript
import { db } from "~/db";
import { users } from "~/db/schema";
import { sql } from "drizzle-orm";

async function upsertUser(data: NewUser) {
  return db
    .insert(users)
    .values(data)
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: data.name,
        updatedAt: new Date(),
      },
    })
    .returning();
}
```

## Migration Workflow

### 1. Make Schema Changes

Edit your schema files in `src/db/schema/`.

### 2. Generate Migration

```bash
npx drizzle-kit generate
```

This creates a migration file in `src/db/migrations/`.

### 3. Review Migration

Check the generated SQL in the migration file.

### 4. Apply Migration

```bash
# Production: run migrations
npx drizzle-kit migrate

# Development: push directly (no migration file)
npx drizzle-kit push
```

### 5. Inspect with Studio

```bash
npx drizzle-kit studio
```

## Schema Index File

```typescript
// src/db/schema/index.ts
export * from "./users";
export * from "./organizations";
export * from "./api-keys";
export * from "./queues";
export * from "./queue-items";
export * from "./relations";
```

## Related Documentation

- [Quick Reference](./INDEX.md)
- [Services](../services/INDEX.md)
- [Testing](../testing/INDEX.md)

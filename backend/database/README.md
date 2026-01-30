# Database (Drizzle ORM + PostgreSQL)

## Quick Reference

| Task | Command/Pattern |
|------|-----------------|
| Generate migration | `npx drizzle-kit generate` |
| Run migrations | `npx drizzle-kit migrate` |
| Push schema (dev) | `npx drizzle-kit push` |
| Open studio | `npx drizzle-kit studio` |

## Connection Setup

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env";
import * as schema from "./schema";

const client = postgres(env.DATABASE_URL, {
  max: 10,              // Max connections
  idle_timeout: 20,     // Close idle after 20s
});

export const db = drizzle(client, { schema });
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
});
```

## Schema Definition

```typescript
// src/db/schema/users.ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  organizationId: text("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Infer types from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

## Common Patterns

### Enum Column

```typescript
import { pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["pending", "active", "completed"]);

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  status: statusEnum("status").default("pending").notNull(),
});
```

### JSON Column

```typescript
export const queueItems = pgTable("queue_items", {
  id: text("id").primaryKey(),
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
});
```

### Indexes

```typescript
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  organizationId: text("organization_id"),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  orgIdx: index("users_org_idx").on(table.organizationId),
}));
```

### Junction Table (Many-to-Many)

```typescript
export const userRoles = pgTable("user_roles", {
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));
```

## Query Patterns

### Basic CRUD

```typescript
import { db } from "~/db";
import { users } from "~/db/schema";
import { eq, and, desc } from "drizzle-orm";

// Create
const [user] = await db.insert(users).values({ email, name }).returning();

// Read
const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

// Update
const [user] = await db
  .update(users)
  .set({ name, updatedAt: new Date() })
  .where(eq(users.id, id))
  .returning();

// Delete
await db.delete(users).where(eq(users.id, id));
```

### Pagination

```typescript
import { count } from "drizzle-orm";

async function getPaginatedUsers(orgId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [data, [{ total }]] = await Promise.all([
    db.select()
      .from(users)
      .where(eq(users.organizationId, orgId))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() })
      .from(users)
      .where(eq(users.organizationId, orgId)),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
```

### Joins

```typescript
// Simple join
const [result] = await db
  .select({ user: users, organization: organizations })
  .from(users)
  .leftJoin(organizations, eq(users.organizationId, organizations.id))
  .where(eq(users.id, userId));

// With relations (define in schema first)
const userWithRelations = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { organization: true, apiKeys: true },
});
```

### Transactions

```typescript
const result = await db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values(userData).returning();
  const [apiKey] = await tx.insert(apiKeys).values({
    userId: user.id,
    ...keyData,
  }).returning();
  return { user, apiKey };
});
```

### Upsert

```typescript
await db
  .insert(users)
  .values(data)
  .onConflictDoUpdate({
    target: users.email,
    set: { name: data.name, updatedAt: new Date() },
  });
```

## Migration Workflow

1. **Edit schema** in `src/db/schema/`
2. **Generate**: `npx drizzle-kit generate`
3. **Review** the SQL in `src/db/migrations/`
4. **Apply**: `npx drizzle-kit migrate` (prod) or `npx drizzle-kit push` (dev)

## Schema Index File

```typescript
// src/db/schema/index.ts
export * from "./users";
export * from "./organizations";
export * from "./api-keys";
export * from "./queues";
```

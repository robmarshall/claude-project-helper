# Database (Drizzle ORM + PostgreSQL)

## Quick Reference

| Task | Command/Pattern |
|------|-----------------|
| Generate migration | `npx drizzle-kit generate` |
| Run migrations | `npx drizzle-kit migrate` |
| Push schema (dev) | `npx drizzle-kit push` |
| Open studio | `npx drizzle-kit studio` |
| Query with types | `db.select().from(table)` |
| Insert | `db.insert(table).values({...})` |
| Update | `db.update(table).set({...}).where(eq(col, val))` |
| Delete | `db.delete(table).where(eq(col, val))` |

## Schema Definition Quick Start

```typescript
// src/db/schema/users.ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Infer types from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

## Common Patterns

### One-to-Many Relationship

```typescript
// Organizations have many users
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
});
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

### Enum Column

```typescript
import { pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["pending", "active", "completed"]);

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  status: statusEnum("status").default("pending").notNull(),
});
```

### Soft Delete Pattern

```typescript
export const items = pgTable("items", {
  id: text("id").primaryKey(),
  deletedAt: timestamp("deleted_at"),
});

// Query active items only
const activeItems = await db
  .select()
  .from(items)
  .where(isNull(items.deletedAt));
```

## Database Connection

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema";

const client = postgres(env.DATABASE_URL);
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

## Related Documentation

- [Full Patterns & Examples](./patterns.md)
- [API Routes](../api/INDEX.md)
- [Services](../services/INDEX.md)

# Authentication Patterns

## Complete better-auth Configuration

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "~/db";
import { env } from "~/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),

  // Base URL for callbacks
  baseURL: env.APP_URL,

  // Email + password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set true in production
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // Refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache session for 5 minutes
    },
  },

  // Organization/team support
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
  ],

  // Advanced options
  advanced: {
    generateId: () => createId(), // Use cuid2 for IDs
  },
});

export type Auth = typeof auth;
```

## Mount Auth Routes

```typescript
// src/app.ts
import { Hono } from "hono";
import { auth } from "./lib/auth";

const app = new Hono();

// Mount better-auth routes at /api/auth/*
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});
```

## API Key System

### Schema

```typescript
// src/db/schema/api-keys.ts
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(), // "qb_abc123" for display

  // Owner
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),

  // Permissions (null = full access)
  permissions: text("permissions").array(),

  // Metadata
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  keyHashIdx: index("api_keys_hash_idx").on(table.keyHash),
}));
```

### Service

```typescript
// src/services/api-keys/index.ts
import { createHash, randomBytes } from "crypto";
import { db } from "~/db";
import { apiKeys } from "~/db/schema";
import { eq, and } from "drizzle-orm";

const KEY_PREFIX = "qb_";

export function generateApiKey(): string {
  const randomPart = randomBytes(24).toString("base64url");
  return `${KEY_PREFIX}${randomPart}`;
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function createApiKey(input: {
  name: string;
  userId: string;
  organizationId: string;
  permissions?: string[];
  expiresAt?: Date;
}) {
  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12); // "qb_xxxxxxx"

  const [apiKey] = await db.insert(apiKeys).values({
    name: input.name,
    keyHash,
    keyPrefix,
    userId: input.userId,
    organizationId: input.organizationId,
    permissions: input.permissions,
    expiresAt: input.expiresAt,
  }).returning();

  // Return raw key ONLY on creation (never stored)
  return { apiKey, rawKey };
}

export async function validateApiKey(rawKey: string) {
  if (!rawKey.startsWith(KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashApiKey(rawKey);

  const [result] = await db
    .select()
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .innerJoin(organizations, eq(apiKeys.organizationId, organizations.id))
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (!result) {
    return null;
  }

  // Check expiration
  if (result.api_keys.expiresAt && result.api_keys.expiresAt < new Date()) {
    return null;
  }

  // Update last used
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, result.api_keys.id));

  return {
    apiKey: result.api_keys,
    user: result.users,
    organization: result.organizations,
  };
}

export async function revokeApiKey(id: string, organizationId: string) {
  const result = await db
    .delete(apiKeys)
    .where(and(
      eq(apiKeys.id, id),
      eq(apiKeys.organizationId, organizationId)
    ))
    .returning();

  return result.length > 0;
}
```

## Role-Based Access Control (RBAC)

### Permissions Schema

```typescript
// src/db/schema/permissions.ts
import { pgTable, text, primaryKey } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permission: text("permission").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permission] }),
}));

export const userRoles = pgTable("user_roles", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.organizationId] }),
}));
```

### Permission Constants

```typescript
// src/lib/permissions.ts
export const PERMISSIONS = {
  // Queue permissions
  QUEUES_READ: "queues:read",
  QUEUES_WRITE: "queues:write",
  QUEUES_DELETE: "queues:delete",

  // User management
  USERS_READ: "users:read",
  USERS_INVITE: "users:invite",
  USERS_REMOVE: "users:remove",

  // Organization
  ORG_SETTINGS: "org:settings",
  ORG_BILLING: "org:billing",

  // API Keys
  API_KEYS_READ: "api_keys:read",
  API_KEYS_WRITE: "api_keys:write",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Default roles
export const DEFAULT_ROLES = {
  owner: [
    PERMISSIONS.QUEUES_READ,
    PERMISSIONS.QUEUES_WRITE,
    PERMISSIONS.QUEUES_DELETE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_INVITE,
    PERMISSIONS.USERS_REMOVE,
    PERMISSIONS.ORG_SETTINGS,
    PERMISSIONS.ORG_BILLING,
    PERMISSIONS.API_KEYS_READ,
    PERMISSIONS.API_KEYS_WRITE,
  ],
  admin: [
    PERMISSIONS.QUEUES_READ,
    PERMISSIONS.QUEUES_WRITE,
    PERMISSIONS.QUEUES_DELETE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_INVITE,
    PERMISSIONS.API_KEYS_READ,
    PERMISSIONS.API_KEYS_WRITE,
  ],
  member: [
    PERMISSIONS.QUEUES_READ,
    PERMISSIONS.QUEUES_WRITE,
  ],
  viewer: [
    PERMISSIONS.QUEUES_READ,
  ],
};
```

### Permission Service

```typescript
// src/services/permissions/index.ts
import { db } from "~/db";
import { userRoles, rolePermissions } from "~/db/schema";
import { eq, and } from "drizzle-orm";

export async function getUserPermissions(
  userId: string,
  organizationId: string
): Promise<string[]> {
  const results = await db
    .select({ permission: rolePermissions.permission })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .where(and(
      eq(userRoles.userId, userId),
      eq(userRoles.organizationId, organizationId)
    ));

  return results.map((r) => r.permission);
}

export async function hasPermission(
  userId: string,
  organizationId: string,
  permission: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId, organizationId);
  return permissions.includes(permission);
}

export async function hasAnyPermission(
  userId: string,
  organizationId: string,
  requiredPermissions: string[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId, organizationId);
  return requiredPermissions.some((p) => permissions.includes(p));
}
```

## Auth Middleware Implementation

```typescript
// src/middleware/auth.ts
import type { Context, Next } from "hono";
import { auth } from "~/lib/auth";
import { validateApiKey } from "~/services/api-keys";
import type { HonoEnv } from "~/app";

export async function authMiddleware(c: Context<HonoEnv>, next: Next) {
  // Check for API key first
  const authHeader = c.req.header("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    // Check if it's an API key (starts with prefix)
    if (token.startsWith("qb_")) {
      const result = await validateApiKey(token);

      if (!result) {
        return c.json({ error: "Invalid API key" }, 401);
      }

      c.set("user", {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      });
      c.set("organizationId", result.organization.id);
      c.set("isApiKey", true);
      c.set("apiKeyPermissions", result.apiKey.permissions);

      return next();
    }
  }

  // Fall back to session auth
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "Authentication required" }, 401);
  }

  // Get active organization from session or header
  const orgId = c.req.header("X-Organization-Id") || session.session.activeOrganizationId;

  if (!orgId) {
    return c.json({ error: "Organization context required" }, 400);
  }

  c.set("user", {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });
  c.set("organizationId", orgId);
  c.set("isApiKey", false);

  return next();
}
```

## Permission Middleware

```typescript
// src/middleware/permissions.ts
import type { Context, Next } from "hono";
import { hasPermission, hasAnyPermission } from "~/services/permissions";
import type { HonoEnv } from "~/app";

export function requirePermission(permission: string) {
  return async (c: Context<HonoEnv>, next: Next) => {
    const user = c.get("user");
    const organizationId = c.get("organizationId");
    const isApiKey = c.get("isApiKey");
    const apiKeyPermissions = c.get("apiKeyPermissions");

    // Check API key permissions if applicable
    if (isApiKey && apiKeyPermissions) {
      if (!apiKeyPermissions.includes(permission)) {
        return c.json({ error: "API key lacks required permission" }, 403);
      }
    }

    // Check user permissions
    const allowed = await hasPermission(user.id, organizationId, permission);

    if (!allowed) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    return next();
  };
}

export function requireAnyPermission(permissions: string[]) {
  return async (c: Context<HonoEnv>, next: Next) => {
    const user = c.get("user");
    const organizationId = c.get("organizationId");

    const allowed = await hasAnyPermission(user.id, organizationId, permissions);

    if (!allowed) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    return next();
  };
}
```

## Usage in Routes

```typescript
// src/routes/queues/index.ts
import { requirePermission } from "~/middleware/permissions";
import { PERMISSIONS } from "~/lib/permissions";

// Read-only route
queueRoutes.get("/", requirePermission(PERMISSIONS.QUEUES_READ), listQueues);

// Write route
queueRoutes.post("/", requirePermission(PERMISSIONS.QUEUES_WRITE), createQueue);

// Delete route
queueRoutes.delete("/:id", requirePermission(PERMISSIONS.QUEUES_DELETE), deleteQueue);
```

## Related Documentation

- [Quick Reference](./INDEX.md)
- [Middleware](../middleware/INDEX.md)
- [API Routes](../api/INDEX.md)

# Authentication (better-auth + API Keys)

## Auth Strategy Overview

| Auth Type | Use Case | Mechanism |
|-----------|----------|-----------|
| Session | Web UI users | Cookie (automatic via better-auth) |
| API Key | Programmatic access | `Authorization: Bearer qb_...` |

## Request Flow

```
Request → Check Authorization header
              │
    ┌─────────┴─────────┐
    │                   │
  Bearer?            No header
    │                   │
    ▼                   ▼
  API Key           Session
  Validation        Cookie Check
    │                   │
    └─────────┬─────────┘
              ▼
    Set user + org in context
```

## better-auth Setup

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "~/db";
import { env } from "~/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  baseURL: env.APP_URL,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // Refresh daily
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  plugins: [
    organization({ allowUserToCreateOrganization: true }),
  ],
});
```

Mount auth routes:

```typescript
// src/app.ts
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
```

## API Key System

### Schema

```typescript
// src/db/schema/api-keys.ts
export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),   // SHA-256 hash
  keyPrefix: text("key_prefix").notNull(), // "qb_abc..." for display
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  permissions: text("permissions").array(), // null = full access
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Service

```typescript
// src/services/api-keys/index.ts
import { createHash, randomBytes } from "crypto";

const KEY_PREFIX = "qb_";

export function generateApiKey(): string {
  return `${KEY_PREFIX}${randomBytes(24).toString("base64url")}`;
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function createApiKey(input: {
  name: string;
  userId: string;
  organizationId: string;
  permissions?: string[];
}) {
  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);

  const [apiKey] = await db.insert(apiKeys).values({
    name: input.name,
    keyHash,
    keyPrefix: rawKey.slice(0, 12),
    userId: input.userId,
    organizationId: input.organizationId,
    permissions: input.permissions,
  }).returning();

  // Return raw key ONLY on creation
  return { apiKey, rawKey };
}

export async function validateApiKey(rawKey: string) {
  if (!rawKey.startsWith(KEY_PREFIX)) return null;

  const keyHash = hashApiKey(rawKey);
  const [result] = await db
    .select()
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .innerJoin(organizations, eq(apiKeys.organizationId, organizations.id))
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (!result) return null;
  if (result.api_keys.expiresAt && result.api_keys.expiresAt < new Date()) return null;

  // Update last used
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, result.api_keys.id));

  return { apiKey: result.api_keys, user: result.users, organization: result.organizations };
}
```

## Auth Middleware

```typescript
// src/middleware/auth.ts
import { auth } from "~/lib/auth";
import { validateApiKey } from "~/services/api-keys";

export async function authMiddleware(c, next) {
  const authHeader = c.req.header("Authorization");

  // Try API key first
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    if (token.startsWith("qb_")) {
      const result = await validateApiKey(token);
      if (!result) return c.json({ error: "Invalid API key" }, 401);

      c.set("user", { id: result.user.id, email: result.user.email, name: result.user.name });
      c.set("organizationId", result.organization.id);
      c.set("isApiKey", true);
      c.set("apiKeyPermissions", result.apiKey.permissions);
      return next();
    }
  }

  // Fall back to session
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Authentication required" }, 401);

  const orgId = c.req.header("X-Organization-Id") || session.session.activeOrganizationId;
  if (!orgId) return c.json({ error: "Organization context required" }, 400);

  c.set("user", { id: session.user.id, email: session.user.email, name: session.user.name });
  c.set("organizationId", orgId);
  c.set("isApiKey", false);
  return next();
}
```

## RBAC (Role-Based Access Control)

### Permissions

```typescript
// src/lib/permissions.ts
export const PERMISSIONS = {
  QUEUES_READ: "queues:read",
  QUEUES_WRITE: "queues:write",
  QUEUES_DELETE: "queues:delete",
  USERS_READ: "users:read",
  USERS_INVITE: "users:invite",
  ORG_SETTINGS: "org:settings",
  API_KEYS_WRITE: "api_keys:write",
} as const;

export const DEFAULT_ROLES = {
  owner: Object.values(PERMISSIONS),
  admin: [PERMISSIONS.QUEUES_READ, PERMISSIONS.QUEUES_WRITE, PERMISSIONS.USERS_READ],
  member: [PERMISSIONS.QUEUES_READ, PERMISSIONS.QUEUES_WRITE],
  viewer: [PERMISSIONS.QUEUES_READ],
};
```

### Permission Service

```typescript
// src/services/permissions/index.ts
export async function getUserPermissions(userId: string, orgId: string): Promise<string[]> {
  const results = await db
    .select({ permission: rolePermissions.permission })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .where(and(eq(userRoles.userId, userId), eq(userRoles.organizationId, orgId)));

  return results.map((r) => r.permission);
}

export async function hasPermission(userId: string, orgId: string, permission: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId, orgId);
  return permissions.includes(permission);
}
```

### Permission Middleware

```typescript
// src/middleware/permissions.ts
export function requirePermission(permission: string) {
  return async (c, next) => {
    const user = c.get("user");
    const orgId = c.get("organizationId");
    const apiKeyPermissions = c.get("apiKeyPermissions");

    // Check API key permissions if applicable
    if (c.get("isApiKey") && apiKeyPermissions && !apiKeyPermissions.includes(permission)) {
      return c.json({ error: "API key lacks required permission" }, 403);
    }

    // Check user role permissions
    const allowed = await hasPermission(user.id, orgId, permission);
    if (!allowed) return c.json({ error: "Insufficient permissions" }, 403);

    return next();
  };
}
```

### Usage in Routes

```typescript
import { requirePermission } from "~/middleware/permissions";
import { PERMISSIONS } from "~/lib/permissions";

queueRoutes.get("/", requirePermission(PERMISSIONS.QUEUES_READ), listHandler);
queueRoutes.post("/", requirePermission(PERMISSIONS.QUEUES_WRITE), createHandler);
queueRoutes.delete("/:id", requirePermission(PERMISSIONS.QUEUES_DELETE), deleteHandler);
```

## Context Access

```typescript
// In any handler
const user = c.get("user");           // { id, email, name }
const orgId = c.get("organizationId"); // string
const isApiKey = c.get("isApiKey");    // boolean
```

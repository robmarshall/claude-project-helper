# Middleware

## Middleware Organization

Use specific, descriptive names for middleware files:

```
middleware/
├── api-key-auth.ts        # API key validation (v1 routes)
├── session-auth.ts        # Session-based auth (admin routes)
├── org-validation.ts      # Organization membership check
├── project-validation.ts  # Project access check
├── superadmin-auth.ts     # Admin flag check
└── usage-limit.ts         # Subscription limits check
```

## Three-Tier Auth Pattern

Different route tiers use different auth middleware:

| Tier | Middleware Stack |
|------|------------------|
| v1 (Public API) | `apiKeyAuth` → `projectValidation` → `usageLimit` |
| admin | `sessionAuth` → `orgValidation` |
| superadmin | `sessionAuth` → `superadminAuth` |

```typescript
// src/app.ts
import { apiKeyAuth } from "./middleware/api-key-auth";
import { sessionAuth } from "./middleware/session-auth";
import { orgValidation } from "./middleware/org-validation";
import { projectValidation } from "./middleware/project-validation";
import { superadminAuth } from "./middleware/superadmin-auth";
import { usageLimit } from "./middleware/usage-limit";

// Public API routes (API key auth)
app.use("/v1/*", apiKeyAuth);
app.use("/v1/projects/:projectId/*", projectValidation, usageLimit);
app.route("/v1", v1Routes);

// Admin routes (session auth)
app.use("/admin/*", sessionAuth, orgValidation);
app.route("/admin", adminRoutes);

// Superadmin routes
app.use("/superadmin/*", sessionAuth, superadminAuth);
app.route("/superadmin", superadminRoutes);
```

## API Key Auth Middleware

```typescript
// src/middleware/api-key-auth.ts
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import * as apiKeyService from "~/services/api-key-service";
import type { HonoEnv } from "~/app";

export async function apiKeyAuth(c: Context<HonoEnv>, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing API key" });
  }

  const apiKey = authHeader.slice(7);
  const keyData = await apiKeyService.validateApiKey(apiKey);

  if (!keyData) {
    throw new HTTPException(401, { message: "Invalid API key" });
  }

  // Set context for downstream handlers
  c.set("organisationId", keyData.organisationId);
  c.set("isApiKey", true);
  c.set("user", { id: keyData.createdBy, email: "", name: "" });

  // Track API key usage
  await apiKeyService.recordUsage(keyData.id);

  return next();
}
```

## Session Auth Middleware

```typescript
// src/middleware/session-auth.ts
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { auth } from "~/lib/auth";
import type { HonoEnv } from "~/app";

export async function sessionAuth(c: Context<HonoEnv>, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  c.set("user", {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? "",
  });
  c.set("isApiKey", false);

  return next();
}
```

## Organization Validation Middleware

```typescript
// src/middleware/org-validation.ts
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { db } from "~/config/database";
import { organisationMembers } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import type { HonoEnv } from "~/app";

export async function orgValidation(c: Context<HonoEnv>, next: Next) {
  const orgId = c.req.header("X-Organisation-Id") || c.req.query("orgId");
  const userId = c.get("user").id;

  if (!orgId) {
    throw new HTTPException(400, { message: "Organisation ID required" });
  }

  // Check membership
  const [membership] = await db
    .select()
    .from(organisationMembers)
    .where(and(
      eq(organisationMembers.userId, userId),
      eq(organisationMembers.organisationId, orgId)
    ))
    .limit(1);

  if (!membership) {
    throw new HTTPException(403, { message: "Not a member of this organisation" });
  }

  c.set("organisationId", orgId);
  c.set("memberRole", membership.role);

  return next();
}
```

## Project Validation Middleware

```typescript
// src/middleware/project-validation.ts
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { db } from "~/config/database";
import { projects } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import type { HonoEnv } from "~/app";

export async function projectValidation(c: Context<HonoEnv>, next: Next) {
  const projectId = c.req.param("projectId");
  const orgId = c.get("organisationId");

  if (!projectId) {
    throw new HTTPException(400, { message: "Project ID required" });
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(
      eq(projects.id, projectId),
      eq(projects.organisationId, orgId)
    ))
    .limit(1);

  if (!project) {
    throw new HTTPException(404, { message: "Project not found" });
  }

  c.set("projectId", projectId);
  c.set("project", project);

  return next();
}
```

## Superadmin Auth Middleware

```typescript
// src/middleware/superadmin-auth.ts
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { db } from "~/config/database";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";
import type { HonoEnv } from "~/app";

export async function superadminAuth(c: Context<HonoEnv>, next: Next) {
  const userId = c.get("user").id;

  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.isAdmin) {
    throw new HTTPException(403, { message: "Superadmin access required" });
  }

  return next();
}
```

## Usage Limit Middleware

```typescript
// src/middleware/usage-limit.ts
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import * as usageService from "~/services/usage/usage-tracker";
import type { HonoEnv } from "~/app";

export async function usageLimit(c: Context<HonoEnv>, next: Next) {
  const orgId = c.get("organisationId");

  const usage = await usageService.getCurrentUsage(orgId);

  if (usage.isOverLimit) {
    throw new HTTPException(429, {
      message: "Usage limit exceeded. Please upgrade your plan.",
    });
  }

  // Add usage info to response headers
  c.header("X-Usage-Current", String(usage.current));
  c.header("X-Usage-Limit", String(usage.limit));

  return next();
}
```

## Common Middleware Stack

```typescript
// src/app.ts
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new OpenAPIHono();

// 1. Logging (all requests)
app.use("*", logger());

// 2. CORS (all requests)
app.use("*", cors({
  origin: ["http://localhost:3000"],
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization", "X-Organisation-Id"],
}));

// 3. Public routes (no auth)
app.get("/health", (c) => c.json({ status: "ok" }));

// 4. Route-specific auth (see three-tier pattern above)
```

## Middleware Pattern

```typescript
import type { Context, Next } from "hono";
import type { HonoEnv } from "~/app";

export async function myMiddleware(c: Context<HonoEnv>, next: Next) {
  // Before handler
  const startTime = Date.now();

  await next();

  // After handler
  c.header("X-Response-Time", `${Date.now() - startTime}ms`);
}
```

## Middleware with Options

```typescript
interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export function rateLimiter(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix = "ratelimit" } = options;

  return async (c: Context, next: Next) => {
    const key = `${keyPrefix}:${c.req.header("x-forwarded-for") || "anon"}`;
    const windowSeconds = Math.ceil(windowMs / 1000);

    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, max - count)));

    if (count > max) {
      const ttl = await redis.ttl(key);
      c.header("Retry-After", String(ttl));
      throw new HTTPException(429, { message: "Rate limit exceeded" });
    }

    return next();
  };
}

// Usage
app.use("/v1/*", rateLimiter({ windowMs: 60000, max: 100 }));
```

## Request ID Middleware

```typescript
import { createId } from "@paralleldrive/cuid2";

export async function requestIdMiddleware(c: Context, next: Next) {
  const requestId = c.req.header("X-Request-Id") || createId();
  c.set("requestId", requestId);
  c.header("X-Request-Id", requestId);
  await next();
}
```

## Error Handler

```typescript
// src/app.ts
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

app.onError((err, c) => {
  const requestId = c.get("requestId") || "unknown";

  console.error({ requestId, error: err.message, stack: err.stack });

  if (err instanceof HTTPException) {
    return c.json({ error: err.message, requestId }, err.status);
  }

  if (err instanceof ZodError) {
    return c.json({
      error: "Validation failed",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
      requestId,
    }, 400);
  }

  return c.json({ error: "Internal server error", requestId }, 500);
});

app.notFound((c) => {
  return c.json({
    error: "Not found",
    path: c.req.path,
    requestId: c.get("requestId"),
  }, 404);
});
```

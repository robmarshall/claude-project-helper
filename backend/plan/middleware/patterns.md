# Middleware Patterns

## Complete Auth Middleware

```typescript
// src/middleware/auth.ts
import type { Context, Next } from "hono";
import { auth } from "~/lib/auth";
import { validateApiKey } from "~/services/api-keys";
import type { HonoEnv } from "~/app";

export async function authMiddleware(c: Context<HonoEnv>, next: Next) {
  const authHeader = c.req.header("Authorization");

  // Try API key authentication first
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    // API keys start with "qb_"
    if (token.startsWith("qb_")) {
      const result = await validateApiKey(token);

      if (!result) {
        return c.json({ error: "Invalid API key" }, 401);
      }

      // Set context for API key auth
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

  // Try session authentication
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ error: "Authentication required" }, 401);
  }

  // Get organization from header or session
  const orgId = c.req.header("X-Organization-Id") ||
                session.session.activeOrganizationId;

  if (!orgId) {
    return c.json({ error: "Organization context required" }, 400);
  }

  // Set context for session auth
  c.set("user", {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });
  c.set("organizationId", orgId);
  c.set("isApiKey", false);

  return next();
}

// Optional auth - sets user if available but doesn't require it
export async function optionalAuthMiddleware(c: Context<HonoEnv>, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    if (token.startsWith("qb_")) {
      const result = await validateApiKey(token);
      if (result) {
        c.set("user", {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        });
        c.set("organizationId", result.organization.id);
        c.set("isApiKey", true);
      }
    }
  } else {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session?.user) {
      c.set("user", {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      });
      c.set("organizationId", session.session.activeOrganizationId);
      c.set("isApiKey", false);
    }
  }

  return next();
}
```

## Permission Middleware

```typescript
// src/middleware/permissions.ts
import type { Context, Next } from "hono";
import { hasPermission, hasAnyPermission } from "~/services/permissions";
import type { HonoEnv } from "~/app";

// Require a specific permission
export function requirePermission(permission: string) {
  return async (c: Context<HonoEnv>, next: Next) => {
    const user = c.get("user");
    const organizationId = c.get("organizationId");
    const isApiKey = c.get("isApiKey");
    const apiKeyPermissions = c.get("apiKeyPermissions");

    if (!user || !organizationId) {
      return c.json({ error: "Authentication required" }, 401);
    }

    // Check API key permissions if using API key
    if (isApiKey && apiKeyPermissions) {
      if (!apiKeyPermissions.includes(permission)) {
        return c.json({
          error: "API key lacks required permission",
          required: permission,
        }, 403);
      }
    }

    // Check user's role-based permissions
    const allowed = await hasPermission(user.id, organizationId, permission);

    if (!allowed) {
      return c.json({
        error: "Insufficient permissions",
        required: permission,
      }, 403);
    }

    return next();
  };
}

// Require any of multiple permissions
export function requireAnyPermission(permissions: string[]) {
  return async (c: Context<HonoEnv>, next: Next) => {
    const user = c.get("user");
    const organizationId = c.get("organizationId");

    if (!user || !organizationId) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const allowed = await hasAnyPermission(user.id, organizationId, permissions);

    if (!allowed) {
      return c.json({
        error: "Insufficient permissions",
        required: permissions,
      }, 403);
    }

    return next();
  };
}

// Require all of multiple permissions
export function requireAllPermissions(permissions: string[]) {
  return async (c: Context<HonoEnv>, next: Next) => {
    const user = c.get("user");
    const organizationId = c.get("organizationId");

    if (!user || !organizationId) {
      return c.json({ error: "Authentication required" }, 401);
    }

    for (const permission of permissions) {
      const allowed = await hasPermission(user.id, organizationId, permission);
      if (!allowed) {
        return c.json({
          error: "Insufficient permissions",
          required: permissions,
        }, 403);
      }
    }

    return next();
  };
}
```

## Request ID Middleware

```typescript
// src/middleware/request-id.ts
import { createId } from "@paralleldrive/cuid2";
import type { Context, Next } from "hono";
import type { HonoEnv } from "~/app";

export async function requestIdMiddleware(c: Context<HonoEnv>, next: Next) {
  const requestId = c.req.header("X-Request-Id") || createId();

  c.set("requestId", requestId);
  c.header("X-Request-Id", requestId);

  await next();
}
```

## Timing Middleware

```typescript
// src/middleware/timing.ts
import type { Context, Next } from "hono";

export async function timingMiddleware(c: Context, next: Next) {
  const start = performance.now();

  await next();

  const duration = performance.now() - start;
  c.header("X-Response-Time", `${duration.toFixed(2)}ms`);
}
```

## Validation Middleware

```typescript
// src/middleware/validation.ts
import type { Context, Next } from "hono";
import { z } from "zod";

// Validate request body against schema
export function validateBody<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const parsed = schema.parse(body);
      c.set("validatedBody", parsed);
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: "Validation failed",
          details: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        }, 400);
      }
      throw error;
    }
  };
}

// Validate query parameters
export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const query = Object.fromEntries(new URL(c.req.url).searchParams);
      const parsed = schema.parse(query);
      c.set("validatedQuery", parsed);
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: "Invalid query parameters",
          details: error.errors,
        }, 400);
      }
      throw error;
    }
  };
}
```

## Rate Limiting Middleware

```typescript
// src/middleware/rate-limit.ts
import type { Context, Next } from "hono";
import { redis } from "~/config/redis";

interface RateLimitOptions {
  windowMs: number;     // Time window in milliseconds
  max: number;          // Max requests per window
  keyPrefix?: string;   // Redis key prefix
  keyGenerator?: (c: Context) => string; // Custom key generator
}

export function rateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    keyPrefix = "ratelimit",
    keyGenerator = (c) => c.req.header("x-forwarded-for") ||
                          c.req.header("x-real-ip") ||
                          "anonymous",
  } = options;

  return async (c: Context, next: Next) => {
    const key = `${keyPrefix}:${keyGenerator(c)}`;
    const windowSeconds = Math.ceil(windowMs / 1000);

    // Increment counter
    const count = await redis.incr(key);

    // Set expiry on first request
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    // Get remaining TTL for header
    const ttl = await redis.ttl(key);

    // Set rate limit headers
    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, max - count)));
    c.header("X-RateLimit-Reset", String(Math.ceil(Date.now() / 1000) + ttl));

    if (count > max) {
      c.header("Retry-After", String(ttl));
      return c.json({
        error: "Too many requests",
        retryAfter: ttl,
      }, 429);
    }

    return next();
  };
}

// Usage
app.use("/api/public/*", rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
}));

// Stricter limit for auth endpoints
app.use("/api/auth/*", rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyPrefix: "ratelimit:auth",
}));
```

## CORS Middleware Configuration

```typescript
// src/middleware/cors.ts
import { cors } from "hono/cors";
import { env } from "~/env";

export const corsMiddleware = cors({
  origin: env.NODE_ENV === "production"
    ? ["https://app.example.com"]
    : ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Organization-Id", "X-Request-Id"],
  exposeHeaders: ["X-Request-Id", "X-Response-Time", "X-RateLimit-Remaining"],
  maxAge: 86400, // 24 hours
});
```

## Error Handling Middleware

```typescript
// src/middleware/error-handler.ts
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export function errorHandler(err: Error, c: Context) {
  const requestId = c.get("requestId") || "unknown";

  // Log error with context
  console.error({
    requestId,
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  // HTTP exceptions (thrown intentionally)
  if (err instanceof HTTPException) {
    return c.json({
      error: err.message,
      requestId,
    }, err.status);
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return c.json({
      error: "Validation failed",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
      requestId,
    }, 400);
  }

  // Database constraint errors
  if (err.message.includes("unique constraint")) {
    return c.json({
      error: "Resource already exists",
      requestId,
    }, 409);
  }

  // Generic server error
  return c.json({
    error: "Internal server error",
    requestId,
  }, 500);
}

// Apply in app.ts
app.onError(errorHandler);
```

## Middleware Composition

```typescript
// src/middleware/compose.ts
import type { MiddlewareHandler } from "hono";

// Combine multiple middleware into one
export function composeMiddleware(
  ...middlewares: MiddlewareHandler[]
): MiddlewareHandler {
  return async (c, next) => {
    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;

      if (i < middlewares.length) {
        await middlewares[i](c, () => dispatch(i + 1));
      } else {
        await next();
      }
    };

    await dispatch(0);
  };
}

// Usage
const protectedRoute = composeMiddleware(
  authMiddleware,
  requirePermission("queues:read"),
  rateLimiter({ windowMs: 60000, max: 100 })
);

app.use("/api/queues/*", protectedRoute);
```

## Complete Middleware Stack

```typescript
// src/app.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { requestIdMiddleware } from "./middleware/request-id";
import { timingMiddleware } from "./middleware/timing";
import { corsMiddleware } from "./middleware/cors";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";

// HonoEnv type defined inline
type HonoEnv = {
  Variables: {
    user: { id: string; email: string; name: string };
    organisationId: string;
    isApiKey: boolean;
    requestId: string;
  };
};

export const app = new OpenAPIHono<HonoEnv>();
export type { HonoEnv };

// Global middleware (order matters!)
app.use("*", requestIdMiddleware);
app.use("*", timingMiddleware);
app.use("*", logger());
app.use("*", corsMiddleware);

// Error handler
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json({
    error: "Not found",
    path: c.req.path,
    requestId: c.get("requestId"),
  }, 404);
});

// Health check (no auth)
app.get("/health", (c) => c.json({ status: "ok" }));

// Protected API routes
app.use("/api/*", authMiddleware);

// Mount route modules
app.route("/api/users", userRoutes);
app.route("/api/queues", queueRoutes);
```

## Related Documentation

- [Quick Reference](./INDEX.md)
- [Authentication](../auth/INDEX.md)
- [API Routes](../api/INDEX.md)

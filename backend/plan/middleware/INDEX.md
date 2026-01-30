# Middleware

## Quick Reference

| Middleware | Purpose | Apply To |
|------------|---------|----------|
| `authMiddleware` | Validate session/API key | `/api/*` routes |
| `requirePermission(perm)` | Check specific permission | Individual routes |
| `requireOrg` | Ensure org context exists | Routes needing org |
| `rateLimiter` | Rate limiting | Public endpoints |
| `logger()` | Request logging | All routes |
| `cors()` | CORS headers | All routes |

## Common Middleware Stack

```typescript
// src/app.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import type { HonoEnv } from "./app";

export const app = new OpenAPIHono<HonoEnv>();

// 1. Logging (all requests)
app.use("*", logger());

// 2. CORS (all requests)
app.use("*", cors({
  origin: ["http://localhost:3000"],
  credentials: true,
}));

// 3. Public routes (no auth)
app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/api/auth", authRoutes);

// 4. Protected routes (require auth)
app.use("/api/*", authMiddleware);
app.route("/api/users", userRoutes);
app.route("/api/queues", queueRoutes);
```

## Middleware Pattern

```typescript
import type { Context, Next } from "hono";
import type { HonoEnv } from "~/app";

export async function myMiddleware(c: Context<HonoEnv>, next: Next) {
  // Before handler
  const startTime = Date.now();

  // Continue to next middleware/handler
  await next();

  // After handler
  const duration = Date.now() - startTime;
  c.header("X-Response-Time", `${duration}ms`);
}
```

## Middleware with Options

```typescript
interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimiter(options: RateLimitOptions) {
  const { windowMs, max } = options;
  const requests = new Map<string, { count: number; resetAt: number }>();

  return async (c: Context, next: Next) => {
    const key = c.req.header("x-forwarded-for") || "unknown";
    const now = Date.now();

    const entry = requests.get(key);

    if (!entry || entry.resetAt < now) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
    } else if (entry.count >= max) {
      return c.json({ error: "Rate limit exceeded" }, 429);
    } else {
      entry.count++;
    }

    return next();
  };
}

// Usage
app.use("/api/public/*", rateLimiter({ windowMs: 60000, max: 100 }));
```

## Context Types

```typescript
// Defined in src/app.ts (exported for use elsewhere)
type HonoEnv = {
  Variables: {
    user: {
      id: string;
      email: string;
      name: string;
    };
    organizationId: string;
    isApiKey: boolean;
    apiKeyPermissions?: string[];
    requestId: string;
  };
}
```

## Related Documentation

- [Full Patterns & Examples](./patterns.md)
- [Authentication](../auth/INDEX.md)
- [API Routes](../api/INDEX.md)

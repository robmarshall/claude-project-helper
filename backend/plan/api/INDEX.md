# API Routes (Hono + OpenAPI)

## Quick Reference

| Task | Pattern |
|------|---------|
| Create route module | `new OpenAPIHono<HonoEnv>()` |
| Define typed route | `createRoute({ method, path, request, responses })` |
| Register handler | `routes.openapi(route, handler)` |
| Get context data | `c.get("user")`, `c.get("organizationId")` |
| Parse body | `c.req.valid("json")` |
| Parse query | `c.req.valid("query")` |
| Parse params | `c.req.valid("param")` |
| Return JSON | `c.json({ data }, 200)` |
| Return error | `c.json({ error: "message" }, 400)` |

## Basic Route Structure

```typescript
// src/routes/users/index.ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { HonoEnv } from "~/app";

export const userRoutes = new OpenAPIHono<HonoEnv>();

// Define route with OpenAPI spec
const getUser = createRoute({
  method: "get",
  path: "/:id",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            email: z.string(),
            name: z.string(),
          }),
        },
      },
      description: "User found",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "User not found",
    },
  },
});

// Register with typed handler
userRoutes.openapi(getUser, async (c) => {
  const { id } = c.req.valid("param");
  const user = await getUserById(id);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user, 200);
});
```

## Context Types

```typescript
// Defined in src/app.ts (exported for use elsewhere)
import type { Context } from "hono";

type HonoEnv = {
  Variables: {
    user: {
      id: string;
      email: string;
      name: string;
    };
    organisationId: string;
    isApiKey: boolean;
  };
};

export type AppContext = Context<HonoEnv>;
```

## Common Response Patterns

```typescript
// Success with data
return c.json({ data: users }, 200);

// Created with location
return c.json({ data: user }, 201);

// No content
return c.body(null, 204);

// Validation error
return c.json({ error: "Invalid email format" }, 400);

// Unauthorized
return c.json({ error: "Authentication required" }, 401);

// Forbidden
return c.json({ error: "Insufficient permissions" }, 403);

// Not found
return c.json({ error: "Resource not found" }, 404);

// Server error
return c.json({ error: "Internal server error" }, 500);
```

## App Registration

```typescript
// src/app.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { userRoutes } from "./routes/users";
import { queueRoutes } from "./routes/queues";
// HonoEnv defined in app.ts, not in separate types folder

export const app = new OpenAPIHono<HonoEnv>();
export type { HonoEnv };

// Mount route modules
app.route("/api/users", userRoutes);
app.route("/api/queues", queueRoutes);

// OpenAPI documentation
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: { title: "My API", version: "1.0.0" },
});
```

## Related Documentation

- [Full Patterns & Examples](./patterns.md)
- [Middleware](../middleware/INDEX.md)
- [Authentication](../auth/INDEX.md)

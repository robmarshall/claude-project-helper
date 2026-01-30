# API Routes (Hono + OpenAPI)

## Quick Reference

| Task | Pattern |
|------|---------|
| Create route module | `new OpenAPIHono<HonoEnv>()` |
| Define typed route | `createRoute({ method, path, request, responses })` |
| Register handler | `routes.openapi(route, handler)` |
| Get context | `c.get("user")`, `c.get("organisationId")` |
| Parse body | `c.req.valid("json")` |
| Parse query | `c.req.valid("query")` |
| Parse params | `c.req.valid("param")` |
| Return JSON | `c.json({ data }, 200)` |

## Three-Tier Route Organization

Routes are organized by authentication type:

```
routes/
├── health.ts              # Public health check
├── auth.ts                # Auth endpoints (better-auth)
├── stripe-webhook.ts      # Webhook handlers
├── v1/                    # Public API (API key auth)
│   ├── index.ts           # v1 route aggregation
│   ├── openapi.ts         # Swagger UI + OpenAPI config
│   ├── openapi-schemas.ts # All v1 request/response schemas
│   ├── projects/          # Resource grouping
│   │   └── index.ts
│   └── handlers/          # Business logic handlers
│       ├── messages.handler.ts
│       └── queues.handler.ts
├── admin/                 # Admin panel (Session auth)
│   ├── organisations.ts
│   ├── projects.ts
│   └── messages.ts
└── superadmin/            # Superadmin only (requires isAdmin)
    └── index.ts
```

| Tier | Auth Type | Handler Location |
|------|-----------|------------------|
| v1 (Public API) | API key | `routes/v1/handlers/` (separate files) |
| admin | Session | Inline in route files |
| superadmin | Session + isAdmin | Inline in route files |

## Context Types

```typescript
// Define in app.ts or types file
type HonoEnv = {
  Variables: {
    user: { id: string; email: string; name: string };
    organisationId: string;
    projectId: string;
    isApiKey: boolean;
  };
};
```

## Public API Routes (v1/)

The v1 API uses centralized schemas and separate handler files.

### OpenAPI Setup

```typescript
// src/routes/v1/openapi.ts
import { swaggerUI } from "@hono/swagger-ui";
import type { OpenAPIHono } from "@hono/zod-openapi";

export function setupOpenAPI(app: OpenAPIHono) {
  app.doc("/v1/openapi.json", {
    openapi: "3.1.0",
    info: { title: "Public API", version: "1.0.0" },
    security: [{ bearerAuth: [] }],
  });

  app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    description: "API key as bearer token",
  });

  app.get("/v1/docs", swaggerUI({ url: "/v1/openapi.json" }));
}
```

### Centralized Schemas

```typescript
// src/routes/v1/openapi-schemas.ts
import { z } from "@hono/zod-openapi";

// Error responses
export const errorResponse = z.object({ error: z.string() });

// Pagination
export const paginationQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const paginationMeta = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

// Queue schemas
export const queueSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const createQueueBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const queueResponse = z.object({ data: queueSchema });

export const queueListResponse = z.object({
  data: z.array(queueSchema),
  pagination: paginationMeta,
});

// Message schemas
export const messageSchema = z.object({
  id: z.string(),
  payload: z.any(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  createdAt: z.string().datetime(),
});

export const createMessageBody = z.object({
  payload: z.any(),
  delay: z.number().optional(),
});
```

### Route Definitions (v1/)

```typescript
// src/routes/v1/projects/index.ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as schemas from "../openapi-schemas";
import * as messagesHandler from "../handlers/messages.handler";
import type { HonoEnv } from "~/app";

export const projectRoutes = new OpenAPIHono<HonoEnv>();

// List messages
const listMessages = createRoute({
  method: "get",
  path: "/:projectId/messages",
  tags: ["Messages"],
  request: {
    params: z.object({ projectId: z.string() }),
    query: schemas.paginationQuery,
  },
  responses: {
    200: { content: { "application/json": { schema: schemas.messageListResponse } } },
  },
});

// Create message
const createMessage = createRoute({
  method: "post",
  path: "/:projectId/messages",
  tags: ["Messages"],
  request: {
    params: z.object({ projectId: z.string() }),
    body: { content: { "application/json": { schema: schemas.createMessageBody } } },
  },
  responses: {
    201: { content: { "application/json": { schema: schemas.messageResponse } } },
    400: { content: { "application/json": { schema: schemas.errorResponse } } },
  },
});

// Register with handlers from separate file
projectRoutes.openapi(listMessages, messagesHandler.list);
projectRoutes.openapi(createMessage, messagesHandler.create);
```

### Handler Files (v1/handlers/)

```typescript
// src/routes/v1/handlers/messages.handler.ts
import { RouteHandler } from "@hono/zod-openapi";
import * as messageService from "~/services/message-service";

export const list: RouteHandler = async (c) => {
  const { projectId } = c.req.valid("param");
  const query = c.req.valid("query");

  const result = await messageService.listMessages(projectId, query);
  return c.json(result, 200);
};

export const create: RouteHandler = async (c) => {
  const { projectId } = c.req.valid("param");
  const body = c.req.valid("json");
  const organisationId = c.get("organisationId");

  const message = await messageService.createMessage({
    projectId,
    organisationId,
    ...body,
  });

  return c.json({ data: message }, 201);
};

export const get: RouteHandler = async (c) => {
  const { projectId, messageId } = c.req.valid("param");

  const message = await messageService.getMessage(projectId, messageId);
  if (!message) return c.json({ error: "Message not found" }, 404);

  return c.json({ data: message }, 200);
};
```

## Admin Routes

Admin routes use session auth and inline handlers (simpler pattern for internal dashboards).

```typescript
// src/routes/admin/organisations.ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as orgService from "~/services/organisation-service";
import type { HonoEnv } from "~/app";

export const organisationRoutes = new OpenAPIHono<HonoEnv>();

const listOrganisations = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(z.object({
              id: z.string(),
              name: z.string(),
              createdAt: z.string().datetime(),
            })),
          }),
        },
      },
    },
  },
});

// Inline handler for admin routes
organisationRoutes.openapi(listOrganisations, async (c) => {
  const userId = c.get("user").id;
  const orgs = await orgService.listUserOrganisations(userId);
  return c.json({ data: orgs }, 200);
});

const getOrganisation = createRoute({
  method: "get",
  path: "/:orgId",
  request: { params: z.object({ orgId: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.object({ data: z.any() }) } } },
    404: { content: { "application/json": { schema: z.object({ error: z.string() }) } } },
  },
});

organisationRoutes.openapi(getOrganisation, async (c) => {
  const { orgId } = c.req.valid("param");
  const userId = c.get("user").id;

  const org = await orgService.getOrganisation(orgId, userId);
  if (!org) return c.json({ error: "Organisation not found" }, 404);

  return c.json({ data: org }, 200);
});
```

## Superadmin Routes

```typescript
// src/routes/superadmin/index.ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { HonoEnv } from "~/app";

export const superadminRoutes = new OpenAPIHono<HonoEnv>();

// System metrics (superadmin only)
const getMetrics = createRoute({
  method: "get",
  path: "/metrics",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            totalUsers: z.number(),
            totalOrganisations: z.number(),
            totalMessages: z.number(),
          }),
        },
      },
    },
  },
});

superadminRoutes.openapi(getMetrics, async (c) => {
  const metrics = await getSystemMetrics();
  return c.json(metrics, 200);
});
```

## Mounting Routes

```typescript
// src/app.ts
import { apiKeyAuth } from "./middleware/api-key-auth";
import { sessionAuth } from "./middleware/session-auth";
import { superadminAuth } from "./middleware/superadmin-auth";
import { v1Routes } from "./routes/v1";
import { adminRoutes } from "./routes/admin";
import { superadminRoutes } from "./routes/superadmin";

// Public API (API key auth)
app.use("/v1/*", apiKeyAuth);
app.route("/v1", v1Routes);

// Admin routes (session auth)
app.use("/admin/*", sessionAuth);
app.route("/admin", adminRoutes);

// Superadmin routes
app.use("/superadmin/*", sessionAuth, superadminAuth);
app.route("/superadmin", superadminRoutes);
```

## Route Aggregation Files

```typescript
// src/routes/v1/index.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { projectRoutes } from "./projects";
import { setupOpenAPI } from "./openapi";
import type { HonoEnv } from "~/app";

export const v1Routes = new OpenAPIHono<HonoEnv>();

setupOpenAPI(v1Routes);
v1Routes.route("/projects", projectRoutes);

// src/routes/admin/index.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { organisationRoutes } from "./organisations";
import { projectRoutes } from "./projects";
import type { HonoEnv } from "~/app";

export const adminRoutes = new OpenAPIHono<HonoEnv>();

adminRoutes.route("/organisations", organisationRoutes);
adminRoutes.route("/projects", projectRoutes);
```

## Error Handling

```typescript
// Global error handler in app.ts
import { HTTPException } from "hono/http-exception";

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  if (err.name === "ZodError") {
    return c.json({ error: "Validation failed", details: err.errors }, 400);
  }
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => {
  return c.json({ error: "Not found", path: c.req.path }, 404);
});
```

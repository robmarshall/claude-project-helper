# API Patterns

## Complete Route Module Example

```typescript
// src/routes/queues/index.ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { HonoEnv } from "~/app";
import * as handlers from "./handlers";
import * as schemas from "./schemas";

export const queueRoutes = new OpenAPIHono<HonoEnv>();

// LIST - Get all queues
const listQueues = createRoute({
  method: "get",
  path: "/",
  tags: ["Queues"],
  summary: "List all queues",
  request: {
    query: schemas.listQueuesQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: schemas.listQueuesResponse,
        },
      },
      description: "List of queues",
    },
  },
});

// GET - Get single queue
const getQueue = createRoute({
  method: "get",
  path: "/:id",
  tags: ["Queues"],
  summary: "Get queue by ID",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: schemas.queueResponse,
        },
      },
      description: "Queue details",
    },
    404: {
      content: {
        "application/json": {
          schema: schemas.errorResponse,
        },
      },
      description: "Queue not found",
    },
  },
});

// CREATE - Create new queue
const createQueue = createRoute({
  method: "post",
  path: "/",
  tags: ["Queues"],
  summary: "Create a new queue",
  request: {
    body: {
      content: {
        "application/json": {
          schema: schemas.createQueueBody,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: schemas.queueResponse,
        },
      },
      description: "Queue created",
    },
    400: {
      content: {
        "application/json": {
          schema: schemas.errorResponse,
        },
      },
      description: "Validation error",
    },
  },
});

// UPDATE - Update queue
const updateQueue = createRoute({
  method: "patch",
  path: "/:id",
  tags: ["Queues"],
  summary: "Update queue",
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: schemas.updateQueueBody,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: schemas.queueResponse,
        },
      },
      description: "Queue updated",
    },
    404: {
      content: {
        "application/json": {
          schema: schemas.errorResponse,
        },
      },
      description: "Queue not found",
    },
  },
});

// DELETE - Delete queue
const deleteQueue = createRoute({
  method: "delete",
  path: "/:id",
  tags: ["Queues"],
  summary: "Delete queue",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    204: {
      description: "Queue deleted",
    },
    404: {
      content: {
        "application/json": {
          schema: schemas.errorResponse,
        },
      },
      description: "Queue not found",
    },
  },
});

// Register all routes
queueRoutes.openapi(listQueues, handlers.listQueues);
queueRoutes.openapi(getQueue, handlers.getQueue);
queueRoutes.openapi(createQueue, handlers.createQueue);
queueRoutes.openapi(updateQueue, handlers.updateQueue);
queueRoutes.openapi(deleteQueue, handlers.deleteQueue);
```

## Schemas File

```typescript
// src/routes/queues/schemas.ts
import { z } from "@hono/zod-openapi";

// Shared schemas
export const errorResponse = z.object({
  error: z.string(),
});

// Queue schemas
export const queueSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  maxConcurrency: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const queueResponse = z.object({
  data: queueSchema,
});

// List query params
export const listQueuesQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

// List response with pagination
export const listQueuesResponse = z.object({
  data: z.array(queueSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// Create body
export const createQueueBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  maxConcurrency: z.number().min(1).max(100).default(5),
});

// Update body (all optional)
export const updateQueueBody = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  maxConcurrency: z.number().min(1).max(100).optional(),
});
```

## Handlers File

```typescript
// src/routes/queues/handlers.ts
import type { RouteHandler } from "@hono/zod-openapi";
import type { HonoEnv } from "~/app";
import * as queueService from "~/services/queues";

// List queues
export const listQueues: RouteHandler<typeof import("./index").listQueues, HonoEnv> = async (c) => {
  const { page, limit, search } = c.req.valid("query");
  const organizationId = c.get("organizationId");

  const result = await queueService.listQueues(organizationId, { page, limit, search });

  return c.json(result, 200);
};

// Get single queue
export const getQueue: RouteHandler<typeof import("./index").getQueue, HonoEnv> = async (c) => {
  const { id } = c.req.valid("param");
  const organizationId = c.get("organizationId");

  const queue = await queueService.getQueue(id, organizationId);

  if (!queue) {
    return c.json({ error: "Queue not found" }, 404);
  }

  return c.json({ data: queue }, 200);
};

// Create queue
export const createQueue: RouteHandler<typeof import("./index").createQueue, HonoEnv> = async (c) => {
  const body = c.req.valid("json");
  const organizationId = c.get("organizationId");
  const userId = c.get("user").id;

  const queue = await queueService.createQueue({
    ...body,
    organizationId,
    createdBy: userId,
  });

  return c.json({ data: queue }, 201);
};

// Update queue
export const updateQueue: RouteHandler<typeof import("./index").updateQueue, HonoEnv> = async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const organizationId = c.get("organizationId");

  const queue = await queueService.updateQueue(id, organizationId, body);

  if (!queue) {
    return c.json({ error: "Queue not found" }, 404);
  }

  return c.json({ data: queue }, 200);
};

// Delete queue
export const deleteQueue: RouteHandler<typeof import("./index").deleteQueue, HonoEnv> = async (c) => {
  const { id } = c.req.valid("param");
  const organizationId = c.get("organizationId");

  const deleted = await queueService.deleteQueue(id, organizationId);

  if (!deleted) {
    return c.json({ error: "Queue not found" }, 404);
  }

  return c.body(null, 204);
};
```

## Nested Routes

```typescript
// src/routes/queues/items/index.ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { HonoEnv } from "~/app";

export const queueItemRoutes = new OpenAPIHono<HonoEnv>();

const addItem = createRoute({
  method: "post",
  path: "/",
  tags: ["Queue Items"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            payload: z.record(z.unknown()),
            priority: z.number().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.object({
              id: z.string(),
              status: z.string(),
            }),
          }),
        },
      },
      description: "Item added to queue",
    },
  },
});

queueItemRoutes.openapi(addItem, async (c) => {
  const queueId = c.req.param("queueId"); // From parent route
  const body = c.req.valid("json");
  // ... handler logic
});

// Mount in parent
// src/routes/queues/index.ts
import { queueItemRoutes } from "./items";
queueRoutes.route("/:queueId/items", queueItemRoutes);
```

## Error Handling

```typescript
// Global error handler in app.ts
import { HTTPException } from "hono/http-exception";

app.onError((err, c) => {
  console.error(err);

  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    return c.json({
      error: "Validation failed",
      details: err.errors,
    }, 400);
  }

  return c.json({ error: "Internal server error" }, 500);
});

// Throw errors in handlers
import { HTTPException } from "hono/http-exception";

if (!hasPermission) {
  throw new HTTPException(403, { message: "Insufficient permissions" });
}
```

## File Uploads

```typescript
const uploadFile = createRoute({
  method: "post",
  path: "/upload",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.instanceof(File),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ url: z.string() }),
        },
      },
      description: "File uploaded",
    },
  },
});

routes.openapi(uploadFile, async (c) => {
  const { file } = await c.req.parseBody();

  if (!(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  const url = await uploadToStorage(file);
  return c.json({ url }, 200);
});
```

## OpenAPI Documentation

```typescript
// src/app.ts
import { swaggerUI } from "@hono/swagger-ui";

// JSON spec
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Queue API",
    version: "1.0.0",
    description: "API for queue management",
  },
  servers: [
    { url: "http://localhost:3000", description: "Development" },
    { url: "https://api.example.com", description: "Production" },
  ],
});

// Swagger UI
app.get("/docs", swaggerUI({ url: "/openapi.json" }));
```

## Security Definitions

```typescript
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: { title: "API", version: "1.0.0" },
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "API key or session token",
      },
    },
  },
});
```

## Related Documentation

- [Quick Reference](./INDEX.md)
- [Middleware](../middleware/INDEX.md)
- [Authentication](../auth/INDEX.md)
- [Services](../services/INDEX.md)

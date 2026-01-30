# Backend Architecture Overview

## Quick Reference

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Hono.js | Lightweight TypeScript web framework |
| Database | PostgreSQL + Drizzle ORM | Relational data with type-safe queries |
| Queue | BullMQ (Redis) | Background job processing |
| Auth | better-auth + API keys | Session-based auth + bearer tokens |
| Validation | Zod + OpenAPI | Schema validation with auto-docs |
| Build | tsup | ESM bundle compilation |
| Testing | Vitest + Testcontainers | Unit/integration tests with real DBs |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           API Layer                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Routes    │  │  Middleware │  │   OpenAPI   │                  │
│  │  (Hono)     │  │  (auth/val) │  │   (Docs)    │                  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘                  │
└─────────┼────────────────┼──────────────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Service Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Business  │  │    Auth     │  │   Queue     │                  │
│  │   Logic     │  │  (better-   │  │  (BullMQ)   │                  │
│  │             │  │   auth)     │  │             │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
└─────────┼────────────────┼────────────────┼─────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                   │
│  ┌─────────────────────────┐      ┌─────────────────────────┐       │
│  │      PostgreSQL         │      │         Redis           │       │
│  │    (Drizzle ORM)        │      │    (Queue Storage)      │       │
│  └─────────────────────────┘      └─────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

## Request Flow

```
Request → Middleware (auth/validation) → Route Handler → Service → Database
                                              ↓
                                         Response ← Transform ← Result
```

## Core Dependencies

### Runtime Dependencies

```json
{
  "dependencies": {
    // Framework
    "hono": "^4.x",
    "@hono/node-server": "^1.x",
    "@hono/zod-openapi": "^0.x",

    // Database
    "drizzle-orm": "^0.x",
    "postgres": "^3.x",

    // Queue
    "bullmq": "^5.x",
    "ioredis": "^5.x",

    // Auth
    "better-auth": "^1.x",

    // Validation
    "zod": "^3.x",

    // Utilities
    "nanoid": "^5.x",
    "date-fns": "^3.x"
  }
}
```

### Dev Dependencies

```json
{
  "devDependencies": {
    // Build
    "tsup": "^8.x",
    "typescript": "^5.x",

    // Testing
    "vitest": "^2.x",
    "@testcontainers/postgresql": "^10.x",

    // Database tools
    "drizzle-kit": "^0.x",

    // Types
    "@types/node": "^22.x"
  }
}
```

## Project Structure Overview

```
backend/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Hono app configuration
│   ├── env.ts                # Environment variables
│   ├── config/
│   │   ├── database.ts       # PostgreSQL/Drizzle connection
│   │   └── redis.ts          # Redis/IORedis connection
│   ├── db/
│   │   ├── index.ts          # Re-exports database
│   │   ├── schema/           # Drizzle schema definitions
│   │   └── migrations/       # Database migrations
│   ├── routes/
│   │   ├── health.ts         # Health check
│   │   ├── auth.ts           # Auth endpoints
│   │   ├── v1/               # Public API (API key auth)
│   │   │   ├── openapi.ts
│   │   │   ├── openapi-schemas.ts
│   │   │   ├── projects/
│   │   │   └── handlers/
│   │   ├── admin/            # Admin panel (Session auth)
│   │   └── superadmin/       # Superadmin only
│   ├── middleware/
│   │   ├── api-key-auth.ts   # API key validation
│   │   ├── session-auth.ts   # Session-based auth
│   │   ├── org-validation.ts # Organization check
│   │   ├── project-validation.ts
│   │   ├── superadmin-auth.ts
│   │   └── usage-limit.ts
│   ├── services/
│   │   ├── api-key-service.ts      # Simple flat services
│   │   ├── organisation-service.ts
│   │   ├── queue/                  # Complex domain folders
│   │   ├── stripe/
│   │   └── workflow/
│   ├── queue/
│   │   ├── manager.ts        # Queue manager
│   │   └── processors/       # Job processors
│   └── lib/
│       └── auth.ts           # better-auth configuration
├── drizzle.config.ts         # Drizzle configuration
├── tsup.config.ts            # Build configuration
├── vitest.config.ts          # Test configuration
└── package.json
```

## Key Concepts

### 1. Three-Tier Route Organization

Routes are organized by authentication type:

| Tier | Path | Auth | Purpose |
|------|------|------|---------|
| v1 | `/v1/*` | API key | Public programmatic API |
| admin | `/admin/*` | Session | Web dashboard |
| superadmin | `/superadmin/*` | Session + isAdmin | Internal admin |

### 2. Type-Safe Everything

- Database queries are fully typed via Drizzle ORM
- API routes have typed request/response via Zod + OpenAPI
- Environment variables are validated at startup
- Types inferred from Drizzle schemas (no separate types folder)

### 3. Layered Architecture

- **Routes**: HTTP handling, request parsing
- **Middleware**: Cross-cutting concerns (auth, validation)
- **Services**: Business logic, database operations
- **Queue**: Background job processing

### 4. Auth Strategy

- **Session-based**: For web UI via better-auth
- **API keys**: For programmatic access via bearer tokens
- **RBAC**: Role-based permissions per organization

### 5. Services Organization

- Flat files for simple services (`api-key-service.ts`)
- Folders for complex domains (`workflow/`, `stripe/`)
- Types co-located in service folders when needed

### 6. Background Processing

- BullMQ for reliable job queuing
- Redis for queue storage and pub/sub
- Graceful shutdown with job completion

## Related Documentation

- [Project Structure](../structure/README.md)
- [Database Patterns](../database/README.md)
- [API Routes](../api/README.md)
- [Authentication](../auth/README.md)
- [Middleware](../middleware/README.md)
- [Services](../services/README.md)
- [Queue Processing](../queue/README.md)
- [Testing](../testing/README.md)
- [Configuration](../config/README.md)

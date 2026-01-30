# Authentication (better-auth + API Keys)

## Quick Reference

| Auth Type | Use Case | Header/Cookie |
|-----------|----------|---------------|
| Session | Web UI users | Cookie-based (automatic) |
| API Key | Programmatic access | `Authorization: Bearer <key>` |

| Task | Pattern |
|------|---------|
| Get current user | `c.get("user")` |
| Get organization | `c.get("organizationId")` |
| Check if API key | `c.get("isApiKey")` |
| Require permission | `requirePermission("queues:write")` middleware |

## Auth Strategy Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Request Arrives                       │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Has Authorization    │
              │  Bearer header?       │
              └───────────┬───────────┘
                    │           │
                   Yes          No
                    │           │
                    ▼           ▼
         ┌──────────────┐  ┌──────────────┐
         │  Validate    │  │   Check      │
         │  API Key     │  │   Session    │
         │  (bearer-auth)│  │   Cookie     │
         └──────┬───────┘  └──────┬───────┘
                │                 │
                ▼                 ▼
         ┌──────────────────────────────┐
         │   Set user & org in context  │
         │   c.set("user", user)        │
         │   c.set("organizationId", id)│
         └──────────────────────────────┘
```

## Session Auth (better-auth)

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
});
```

## API Key Generation

```typescript
import { createHash, randomBytes } from "crypto";

// Generate new API key
function generateApiKey(): string {
  const prefix = "qb_";
  const key = randomBytes(24).toString("base64url");
  return `${prefix}${key}`;
}

// Hash for storage (never store raw key)
function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// Validate API key format
function isValidApiKeyFormat(key: string): boolean {
  return /^qb_[A-Za-z0-9_-]{32}$/.test(key);
}
```

## Context Access in Handlers

```typescript
// In any route handler
app.get("/api/me", async (c) => {
  const user = c.get("user");
  const organizationId = c.get("organizationId");
  const isApiKey = c.get("isApiKey");

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    organization: organizationId,
    authType: isApiKey ? "api_key" : "session",
  });
});
```

## Related Documentation

- [Full Patterns & Examples](./patterns.md)
- [Middleware](../middleware/INDEX.md)
- [API Routes](../api/INDEX.md)

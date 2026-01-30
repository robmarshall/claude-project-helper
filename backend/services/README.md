# Services (Business Logic Layer)

## Purpose

Services contain business logic and are framework-agnostic:

```
Route Handler → Service → Database
      ↑            ↓
   HTTP      Business Logic
  concerns    (pure functions)
```

- Contain validation and business rules
- Handle database operations
- No HTTP/Hono types
- Reusable across API, queue jobs, CLI
- Unit testable in isolation

## Services Organization

Use **flat files** for simple services, **folders** for complex domains:

```
services/
├── api-key-service.ts         # Simple: single responsibility
├── organisation-service.ts    # Simple: CRUD + basic logic
├── signature-service.ts       # Simple: utility functions
├── schedule-executor.ts       # Simple: scheduled task runner
├── queue/                     # Complex: multiple related files
│   ├── queue-manager.ts
│   └── webhook-processor.ts
├── stripe/                    # Integration: external service grouping
│   ├── stripe-client.ts
│   ├── subscription-manager.ts
│   └── plan-config.ts
├── usage/
│   └── usage-tracker.ts
└── workflow/                  # Complex: domain with types
    ├── index.ts
    ├── workflow-engine.ts
    ├── run-manager.ts
    └── types.ts
```

### When to use flat files

- Single responsibility service
- CRUD operations for a single resource
- Utility/helper functions
- Less than ~200 lines of code

### When to use folders

- Multiple related services (e.g., stripe client + subscription manager)
- Complex domain with internal types
- Service that spawns multiple sub-services
- External integration grouping

## Simple Service Pattern (Flat File)

```typescript
// src/services/api-key-service.ts
import { db } from "~/config/database";
import { apiKeys } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { hash, verify } from "argon2";

type ApiKey = typeof apiKeys.$inferSelect;

interface CreateApiKeyInput {
  name: string;
  organisationId: string;
  createdBy: string;
}

export async function createApiKey(input: CreateApiKeyInput) {
  const rawKey = `sk_${createId()}`;
  const hashedKey = await hash(rawKey);

  const [apiKey] = await db.insert(apiKeys).values({
    name: input.name,
    keyHash: hashedKey,
    keyPrefix: rawKey.slice(0, 8),
    organisationId: input.organisationId,
    createdBy: input.createdBy,
  }).returning();

  // Return raw key only on creation (never stored)
  return { ...apiKey, rawKey };
}

export async function validateApiKey(rawKey: string): Promise<ApiKey | null> {
  const prefix = rawKey.slice(0, 8);

  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyPrefix, prefix), eq(apiKeys.isActive, true)))
    .limit(1);

  if (!apiKey) return null;

  const isValid = await verify(apiKey.keyHash, rawKey);
  return isValid ? apiKey : null;
}

export async function revokeApiKey(id: string, orgId: string): Promise<boolean> {
  const result = await db
    .update(apiKeys)
    .set({ isActive: false, revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.organisationId, orgId)))
    .returning({ id: apiKeys.id });

  return result.length > 0;
}
```

## Complex Service Pattern (Folder)

```typescript
// src/services/workflow/types.ts
export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  type: "http" | "delay" | "condition";
  config: Record<string, unknown>;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed";
  currentStep: number;
}
```

```typescript
// src/services/workflow/index.ts
export * from "./workflow-engine";
export * from "./run-manager";
export type * from "./types";
```

```typescript
// src/services/workflow/workflow-engine.ts
import { db } from "~/config/database";
import { workflows } from "~/db/schema";
import type { WorkflowDefinition, WorkflowStep } from "./types";

export async function createWorkflow(definition: WorkflowDefinition) {
  const [workflow] = await db.insert(workflows).values({
    name: definition.name,
    steps: definition.steps,
  }).returning();

  return workflow;
}

export async function executeStep(step: WorkflowStep, context: Record<string, unknown>) {
  switch (step.type) {
    case "http":
      return executeHttpStep(step.config, context);
    case "delay":
      return executeDelayStep(step.config);
    case "condition":
      return evaluateCondition(step.config, context);
  }
}
```

```typescript
// src/services/workflow/run-manager.ts
import { db } from "~/config/database";
import { workflowRuns } from "~/db/schema";
import { eq } from "drizzle-orm";
import type { WorkflowRun } from "./types";

export async function createRun(workflowId: string): Promise<WorkflowRun> {
  const [run] = await db.insert(workflowRuns).values({
    workflowId,
    status: "pending",
    currentStep: 0,
  }).returning();

  return run;
}

export async function updateRunStatus(runId: string, status: WorkflowRun["status"]) {
  await db.update(workflowRuns)
    .set({ status, updatedAt: new Date() })
    .where(eq(workflowRuns.id, runId));
}
```

## Integration Service Pattern

Group external service interactions in a folder:

```typescript
// src/services/stripe/stripe-client.ts
import Stripe from "stripe";
import { env } from "~/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});
```

```typescript
// src/services/stripe/plan-config.ts
export const PLANS = {
  free: { priceId: null, limits: { messagesPerMonth: 1000 } },
  pro: { priceId: "price_xxx", limits: { messagesPerMonth: 50000 } },
  enterprise: { priceId: "price_yyy", limits: { messagesPerMonth: -1 } },
} as const;

export type PlanType = keyof typeof PLANS;
```

```typescript
// src/services/stripe/subscription-manager.ts
import { db } from "~/config/database";
import { subscriptions, organisations } from "~/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "./stripe-client";
import { PLANS, type PlanType } from "./plan-config";

export async function createCheckoutSession(orgId: string, plan: PlanType) {
  const planConfig = PLANS[plan];
  if (!planConfig.priceId) throw new Error("Cannot checkout free plan");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    metadata: { organisationId: orgId },
    success_url: `${env.APP_URL}/settings/billing?success=true`,
    cancel_url: `${env.APP_URL}/settings/billing?canceled=true`,
  });

  return session;
}

export async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata.organisationId;

  await db.update(subscriptions).set({
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  }).where(eq(subscriptions.organisationId, orgId));
}
```

## Using Services in Handlers

```typescript
// src/routes/v1/handlers/api-keys.handler.ts
import * as apiKeyService from "~/services/api-key-service";

export const create = async (c) => {
  const body = c.req.valid("json");
  const orgId = c.get("organisationId");
  const userId = c.get("user").id;

  const apiKey = await apiKeyService.createApiKey({
    ...body,
    organisationId: orgId,
    createdBy: userId,
  });

  return c.json({ data: apiKey }, 201);
};
```

## Error Classes

```typescript
// src/services/errors.ts (or inline in service files)
export class AppError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 500) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: Record<string, string>) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, "CONFLICT", 409);
  }
}
```

## Transactions

```typescript
// Use db.transaction for multi-table operations
export async function createOrganisationWithOwner(orgInput, userInput) {
  return db.transaction(async (tx) => {
    const [org] = await tx.insert(organisations).values(orgInput).returning();

    await tx.insert(organisationMembers).values({
      userId: userInput.userId,
      organisationId: org.id,
      role: "owner",
    });

    return org;
  });
}
```

## Type Inference from Drizzle

Types are inferred from Drizzle schemas, not maintained separately:

```typescript
import { users } from "~/db/schema";

// Infer types from schema
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;

// Use in service functions
export async function createUser(input: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(input).returning();
  return user;
}
```

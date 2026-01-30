# Queue Processing (BullMQ)

## Overview

BullMQ provides reliable background job processing backed by Redis.

| Component | Purpose |
|-----------|---------|
| Queue | Named job queue |
| Worker | Processes jobs from queue |
| Job | Unit of work with payload |

## Quick Reference

```typescript
// Add job
await queue.add("jobName", { data });

// Add with options
await queue.add("jobName", { data }, { delay: 5000, attempts: 3 });

// Add bulk
await queue.addBulk([{ name: "job1", data: {} }, { name: "job2", data: {} }]);
```

## Queue Manager

```typescript
// src/queue/manager.ts
import { Queue, Worker } from "bullmq";
import { redis } from "~/config/redis";

const connection = { connection: redis };

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { count: 100, age: 86400 },
  removeOnFail: { count: 500, age: 604800 },
};

// Create queues
export const queues = {
  email: new Queue("email", { ...connection, defaultJobOptions }),
  webhook: new Queue("webhook", { ...connection, defaultJobOptions }),
  notification: new Queue("notification", { ...connection, defaultJobOptions }),
};

// Workers storage
const workers: Worker[] = [];

// Initialize workers
export function initializeWorkers() {
  // Email worker
  workers.push(new Worker("email", async (job) => {
    const { type, data } = job.data;
    switch (type) {
      case "welcome": await sendWelcomeEmail(data); break;
      case "reset": await sendResetEmail(data); break;
      default: throw new Error(`Unknown type: ${type}`);
    }
  }, { ...connection, concurrency: 5 }));

  // Webhook worker
  workers.push(new Worker("webhook", async (job) => {
    const { url, payload } = job.data;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
  }, { ...connection, concurrency: 10 }));

  // Event listeners
  for (const worker of workers) {
    worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
    worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed:`, err.message));
  }
}

// Graceful shutdown
export async function closeQueues() {
  await Promise.all(workers.map((w) => w.close()));
  await Promise.all(Object.values(queues).map((q) => q.close()));
}
```

## Job Processor Pattern

```typescript
// src/queue/processors/email.ts
import type { Job } from "bullmq";

interface EmailJobData {
  type: "welcome" | "notification";
  to: string;
  templateData: Record<string, unknown>;
}

export async function processEmailJob(job: Job<EmailJobData>) {
  const { type, to, templateData } = job.data;

  await job.updateProgress(10);

  const template = getTemplate(type);
  await job.updateProgress(30);

  await sendEmail({ to, subject: template.subject, html: render(template, templateData) });
  await job.updateProgress(100);

  return { sent: true };
}
```

## Adding Jobs

```typescript
// In services
import { queues } from "~/queue/manager";

// Simple job
await queues.email.add("welcome", { to: "user@example.com", data: { name: "John" } });

// With delay
await queues.email.add("reminder", { userId: "123" }, { delay: 60000 });

// With retry
await queues.webhook.add("notify", { url, payload }, {
  attempts: 5,
  backoff: { type: "exponential", delay: 5000 },
});

// Scheduled
await queues.notification.add("daily", { type: "digest" }, {
  delay: new Date("2024-01-01T09:00:00").getTime() - Date.now(),
});

// Bulk
await queues.email.addBulk([
  { name: "notification", data: { userId: "1" } },
  { name: "notification", data: { userId: "2" } },
]);
```

## Scheduled/Recurring Jobs

```typescript
// src/queue/scheduled.ts
export async function setupScheduledJobs() {
  // Remove existing repeatable jobs
  const existing = await queues.cleanup.getRepeatableJobs();
  for (const job of existing) {
    await queues.cleanup.removeRepeatableByKey(job.key);
  }

  // Daily at 3 AM
  await queues.cleanup.add("daily", { type: "expired" }, {
    repeat: { pattern: "0 3 * * *" },
  });

  // Every hour
  await queues.cleanup.add("hourly", { type: "stats" }, {
    repeat: { every: 60 * 60 * 1000 },
  });
}
```

## Queue Events

```typescript
import { QueueEvents } from "bullmq";

const queueEvents = new QueueEvents("email", { connection: redis });

queueEvents.on("waiting", ({ jobId }) => console.log(`${jobId} waiting`));
queueEvents.on("active", ({ jobId }) => console.log(`${jobId} active`));
queueEvents.on("completed", ({ jobId }) => console.log(`${jobId} completed`));
queueEvents.on("failed", ({ jobId, failedReason }) => console.error(`${jobId} failed:`, failedReason));
queueEvents.on("stalled", ({ jobId }) => console.warn(`${jobId} stalled`));
```

## Queue Stats

```typescript
export async function getQueueStats() {
  const stats = {};

  for (const [name, queue] of Object.entries(queues)) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    stats[name] = { waiting, active, completed, failed, delayed };
  }

  return stats;
}
```

## Health Check

```typescript
export async function checkQueueHealth() {
  try {
    const stats = await getQueueStats();

    const issues = [];
    for (const [name, { waiting, active }] of Object.entries(stats)) {
      if (waiting > 1000) issues.push(`${name}: ${waiting} waiting`);
      if (active > 100) issues.push(`${name}: ${active} active (possible stall)`);
    }

    return { healthy: issues.length === 0, stats, issues };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}
```

## Integration Example

```typescript
// src/services/queues/index.ts
import { queues } from "~/queue/manager";

export async function enqueueItem(queueId: string, payload: object, options?: { scheduledFor?: Date }) {
  const [item] = await db.insert(queueItems).values({
    queueId,
    payload,
    status: "waiting",
    scheduledFor: options?.scheduledFor,
  }).returning();

  if (options?.scheduledFor) {
    await queues.process.add("item", { itemId: item.id }, {
      delay: options.scheduledFor.getTime() - Date.now(),
    });
  } else {
    await queues.process.add("item", { itemId: item.id });
  }

  return item;
}
```

## Server Integration

```typescript
// src/index.ts
import { initializeWorkers, closeQueues } from "./queue/manager";
import { setupScheduledJobs } from "./queue/scheduled";

async function main() {
  initializeWorkers();
  await setupScheduledJobs();

  const server = serve({ fetch: app.fetch, port: 3000 });

  process.on("SIGTERM", async () => {
    server.close();
    await closeQueues();
    process.exit(0);
  });
}
```

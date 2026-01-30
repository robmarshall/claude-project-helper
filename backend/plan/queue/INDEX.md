# Queue Processing (BullMQ)

## Quick Reference

| Component | Purpose |
|-----------|---------|
| BullMQ | Job queue backed by Redis |
| Queue | Named queue for job types |
| Worker | Processes jobs from queue |
| Job | Unit of work with payload |

| Operation | Method |
|-----------|--------|
| Add job | `queue.add(name, data, options)` |
| Add bulk | `queue.addBulk([{ name, data, opts }])` |
| Get job | `queue.getJob(id)` |
| Remove job | `job.remove()` |
| Retry job | `job.retry()` |

## Basic Setup

```typescript
// src/queue/manager.ts
import { Queue, Worker } from "bullmq";
import { redis } from "~/config/redis";

const connection = { connection: redis };

// Create queues
export const emailQueue = new Queue("email", connection);
export const webhookQueue = new Queue("webhook", connection);

// Create workers
const emailWorker = new Worker("email", async (job) => {
  // Process email job
  await sendEmail(job.data);
}, connection);

const webhookWorker = new Worker("webhook", async (job) => {
  // Process webhook job
  await sendWebhook(job.data);
}, connection);

// Graceful shutdown
export async function closeQueues() {
  await emailWorker.close();
  await webhookWorker.close();
  await emailQueue.close();
  await webhookQueue.close();
}
```

## Adding Jobs

```typescript
// Add single job
await emailQueue.add("welcome", {
  to: "user@example.com",
  template: "welcome",
  data: { name: "John" },
});

// Add with options
await emailQueue.add("reminder", { userId: "123" }, {
  delay: 60000,           // Delay 1 minute
  attempts: 3,            // Retry 3 times
  backoff: {
    type: "exponential",
    delay: 5000,          // 5s, 10s, 20s
  },
  removeOnComplete: 100,  // Keep last 100 completed
  removeOnFail: 500,      // Keep last 500 failed
});

// Add bulk
await emailQueue.addBulk([
  { name: "notification", data: { userId: "1" } },
  { name: "notification", data: { userId: "2" } },
  { name: "notification", data: { userId: "3" } },
]);
```

## Worker Events

```typescript
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});
```

## Related Documentation

- [Full Patterns & Examples](./patterns.md)
- [Configuration](../config/INDEX.md)
- [Services](../services/INDEX.md)

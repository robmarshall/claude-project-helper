# Queue Patterns

## Queue Manager

```typescript
// src/queue/manager.ts
import { Queue, Worker, QueueEvents } from "bullmq";
import { redis } from "~/config/redis";
import { env } from "~/env";

// Connection config
const connection = {
  connection: redis,
};

// Default job options
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 5000,
  },
  removeOnComplete: {
    count: 100,   // Keep last 100
    age: 86400,   // Or older than 1 day
  },
  removeOnFail: {
    count: 500,
    age: 604800,  // 7 days
  },
};

// Queue definitions
export const queues = {
  email: new Queue("email", { ...connection, defaultJobOptions }),
  webhook: new Queue("webhook", { ...connection, defaultJobOptions }),
  notification: new Queue("notification", { ...connection, defaultJobOptions }),
  cleanup: new Queue("cleanup", { ...connection, defaultJobOptions }),
};

// Worker storage for cleanup
const workers: Worker[] = [];
const queueEvents: QueueEvents[] = [];

// Initialize workers
export function initializeWorkers() {
  // Email worker
  workers.push(new Worker("email", async (job) => {
    const { type, data } = job.data;

    switch (type) {
      case "welcome":
        await sendWelcomeEmail(data);
        break;
      case "reset-password":
        await sendPasswordResetEmail(data);
        break;
      case "notification":
        await sendNotificationEmail(data);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  }, {
    ...connection,
    concurrency: 5,
    limiter: {
      max: 100,
      duration: 60000, // 100 emails per minute
    },
  }));

  // Webhook worker
  workers.push(new Worker("webhook", async (job) => {
    const { url, payload, headers } = job.data;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    return { status: response.status };
  }, {
    ...connection,
    concurrency: 10,
  }));

  // Setup event listeners
  for (const worker of workers) {
    worker.on("completed", (job) => {
      console.log(`[${job.queueName}] Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
      console.error(`[${job?.queueName}] Job ${job?.id} failed:`, err.message);
    });

    worker.on("error", (err) => {
      console.error("Worker error:", err);
    });
  }

  console.log(`Initialized ${workers.length} queue workers`);
}

// Graceful shutdown
export async function closeQueues() {
  console.log("Closing queue workers...");

  // Close workers first (stop accepting new jobs)
  await Promise.all(workers.map((w) => w.close()));

  // Close queue events
  await Promise.all(queueEvents.map((e) => e.close()));

  // Close queues
  await Promise.all(Object.values(queues).map((q) => q.close()));

  console.log("Queue workers closed");
}

// Helper to add jobs
export async function addJob<T>(
  queueName: keyof typeof queues,
  data: T,
  options?: Partial<typeof defaultJobOptions>
) {
  const queue = queues[queueName];
  return queue.add(queueName, data, options);
}

// Helper to add scheduled job
export async function scheduleJob<T>(
  queueName: keyof typeof queues,
  data: T,
  delay: number | Date
) {
  const delayMs = delay instanceof Date
    ? delay.getTime() - Date.now()
    : delay;

  return addJob(queueName, data, { delay: delayMs });
}
```

## Job Processor Pattern

```typescript
// src/queue/processors/email.ts
import type { Job } from "bullmq";
import { sendEmail } from "~/lib/email";
import { db } from "~/db";
import { emailLogs } from "~/db/schema";

interface EmailJobData {
  type: "welcome" | "reset-password" | "notification";
  to: string;
  subject?: string;
  templateData: Record<string, unknown>;
}

export async function processEmailJob(job: Job<EmailJobData>) {
  const { type, to, templateData } = job.data;

  // Update progress
  await job.updateProgress(10);

  // Get template
  const template = getEmailTemplate(type);
  await job.updateProgress(30);

  // Send email
  const result = await sendEmail({
    to,
    subject: template.subject,
    html: renderTemplate(template, templateData),
  });
  await job.updateProgress(80);

  // Log result
  await db.insert(emailLogs).values({
    jobId: job.id,
    type,
    recipient: to,
    status: "sent",
    messageId: result.messageId,
  });
  await job.updateProgress(100);

  return { messageId: result.messageId };
}

function getEmailTemplate(type: string) {
  const templates = {
    welcome: {
      subject: "Welcome to Our Platform",
      template: "welcome.html",
    },
    "reset-password": {
      subject: "Reset Your Password",
      template: "reset-password.html",
    },
    notification: {
      subject: "New Notification",
      template: "notification.html",
    },
  };

  return templates[type] || templates.notification;
}
```

## Webhook Job with Retry Logic

```typescript
// src/queue/processors/webhook.ts
import type { Job } from "bullmq";
import crypto from "crypto";
import { db } from "~/db";
import { webhookDeliveries } from "~/db/schema";
import { eq } from "drizzle-orm";

interface WebhookJobData {
  webhookId: string;
  url: string;
  event: string;
  payload: Record<string, unknown>;
  secret?: string;
}

export async function processWebhookJob(job: Job<WebhookJobData>) {
  const { webhookId, url, event, payload, secret } = job.data;

  // Generate signature if secret provided
  const signature = secret
    ? generateSignature(JSON.stringify(payload), secret)
    : undefined;

  // Create delivery record
  const [delivery] = await db.insert(webhookDeliveries).values({
    webhookId,
    event,
    payload,
    status: "pending",
    attemptNumber: job.attemptsMade + 1,
  }).returning();

  try {
    const startTime = Date.now();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Event": event,
        "X-Webhook-Delivery": delivery.id,
        "X-Webhook-Timestamp": String(Math.floor(Date.now() / 1000)),
        ...(signature ? { "X-Webhook-Signature": signature } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    const duration = Date.now() - startTime;
    const responseBody = await response.text();

    // Update delivery record
    await db.update(webhookDeliveries)
      .set({
        status: response.ok ? "success" : "failed",
        statusCode: response.status,
        responseBody: responseBody.slice(0, 10000), // Limit size
        duration,
        completedAt: new Date(),
      })
      .where(eq(webhookDeliveries.id, delivery.id));

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    return {
      status: response.status,
      duration,
    };
  } catch (error) {
    // Update delivery as failed
    await db.update(webhookDeliveries)
      .set({
        status: "failed",
        errorMessage: error.message,
        completedAt: new Date(),
      })
      .where(eq(webhookDeliveries.id, delivery.id));

    throw error; // Re-throw for retry
  }
}

function generateSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
}
```

## Scheduled/Recurring Jobs

```typescript
// src/queue/scheduled.ts
import { Queue } from "bullmq";
import { redis } from "~/config/redis";

const cleanupQueue = new Queue("cleanup", { connection: redis });

// Add recurring job on startup
export async function setupScheduledJobs() {
  // Remove existing repeatable jobs
  const repeatableJobs = await cleanupQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await cleanupQueue.removeRepeatableByKey(job.key);
  }

  // Daily cleanup at 3 AM
  await cleanupQueue.add(
    "daily-cleanup",
    { type: "expired-sessions" },
    {
      repeat: {
        pattern: "0 3 * * *", // Cron: 3 AM daily
      },
    }
  );

  // Hourly stats aggregation
  await cleanupQueue.add(
    "hourly-stats",
    { type: "aggregate-stats" },
    {
      repeat: {
        every: 60 * 60 * 1000, // Every hour
      },
    }
  );

  // Weekly report
  await cleanupQueue.add(
    "weekly-report",
    { type: "generate-report" },
    {
      repeat: {
        pattern: "0 9 * * 1", // Cron: Monday 9 AM
      },
    }
  );

  console.log("Scheduled jobs configured");
}
```

## Queue Events and Monitoring

```typescript
// src/queue/events.ts
import { QueueEvents } from "bullmq";
import { redis } from "~/config/redis";

export function setupQueueEvents(queueName: string) {
  const queueEvents = new QueueEvents(queueName, { connection: redis });

  queueEvents.on("waiting", ({ jobId }) => {
    console.log(`[${queueName}] Job ${jobId} is waiting`);
  });

  queueEvents.on("active", ({ jobId, prev }) => {
    console.log(`[${queueName}] Job ${jobId} active (was ${prev})`);
  });

  queueEvents.on("completed", ({ jobId, returnvalue }) => {
    console.log(`[${queueName}] Job ${jobId} completed`, returnvalue);
  });

  queueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`[${queueName}] Job ${jobId} failed:`, failedReason);
  });

  queueEvents.on("progress", ({ jobId, data }) => {
    console.log(`[${queueName}] Job ${jobId} progress:`, data);
  });

  queueEvents.on("stalled", ({ jobId }) => {
    console.warn(`[${queueName}] Job ${jobId} stalled`);
  });

  return queueEvents;
}
```

## Queue Stats and Health

```typescript
// src/queue/stats.ts
import { queues } from "./manager";

export async function getQueueStats() {
  const stats: Record<string, object> = {};

  for (const [name, queue] of Object.entries(queues)) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    stats[name] = {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed,
    };
  }

  return stats;
}

// Health check endpoint
export async function checkQueueHealth() {
  try {
    // Check Redis connection via queue
    const queue = Object.values(queues)[0];
    await queue.client;

    const stats = await getQueueStats();

    // Check for stuck jobs
    const issues: string[] = [];
    for (const [name, { waiting, active }] of Object.entries(stats)) {
      if (waiting > 1000) {
        issues.push(`${name}: ${waiting} waiting jobs`);
      }
      if (active > 100) {
        issues.push(`${name}: ${active} active jobs (possible stall)`);
      }
    }

    return {
      healthy: issues.length === 0,
      stats,
      issues,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
}
```

## Integration with Services

```typescript
// src/services/queues/index.ts
import { addJob, scheduleJob } from "~/queue/manager";
import { db } from "~/db";
import { queueItems } from "~/db/schema";

export async function enqueueItem(
  queueId: string,
  payload: Record<string, unknown>,
  options?: { priority?: number; scheduledFor?: Date }
) {
  // Save to database
  const [item] = await db.insert(queueItems).values({
    queueId,
    payload,
    status: "waiting",
    priority: options?.priority ?? 0,
    scheduledFor: options?.scheduledFor,
  }).returning();

  // Add to processing queue
  if (options?.scheduledFor) {
    await scheduleJob("process-item", {
      itemId: item.id,
      queueId,
    }, options.scheduledFor);
  } else {
    await addJob("process-item", {
      itemId: item.id,
      queueId,
    }, {
      priority: options?.priority,
    });
  }

  return item;
}
```

## Graceful Shutdown Integration

```typescript
// src/index.ts
import { serve } from "@hono/node-server";
import { app } from "./app";
import { initializeWorkers, closeQueues } from "./queue/manager";
import { setupScheduledJobs } from "./queue/scheduled";

async function main() {
  // Initialize workers
  initializeWorkers();
  await setupScheduledJobs();

  // Start server
  const server = serve({ fetch: app.fetch, port: 3000 });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down...`);

    // Stop accepting new requests
    server.close();

    // Close queue workers (wait for active jobs)
    await closeQueues();

    // Close other connections...

    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main();
```

## Related Documentation

- [Quick Reference](./INDEX.md)
- [Configuration](../config/INDEX.md)
- [Services](../services/INDEX.md)

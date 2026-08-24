import "dotenv/config";
import { executionJobSchema, executionQueueName } from "@braincrew/contracts";
import { getPrismaClient } from "@braincrew/database";
import { createLogger } from "@braincrew/observability";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { ExecutionProcessor } from "./execution-processor.js";

const logger = createLogger("braincrew-worker");
const redisUrl = process.env.REDIS_URL;

if (!redisUrl || !process.env.DATABASE_URL) {
  logger.warn("Worker idle: configure REDIS_URL and DATABASE_URL to process Braincrew executions.");
  setInterval(() => undefined, 60_000);
} else {
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const processor = new ExecutionProcessor({ prisma: getPrismaClient() });
  const worker = new Worker(
    executionQueueName,
    async (job) => processor.process(executionJobSchema.parse(job.data)),
    {
      connection,
      concurrency: Number(process.env.WORKER_CONCURRENCY ?? 4),
      lockDuration: 600_000,
    },
  );

  worker.on("completed", (job) => logger.info({ jobId: job.id }, "execution completed"));
  worker.on("failed", (job, error) => logger.error({ jobId: job?.id, error }, "execution failed"));

  const shutdown = async () => {
    await worker.close();
    await connection.quit();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

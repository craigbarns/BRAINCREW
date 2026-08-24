import { executionJobSchema, executionQueueName } from "@braincrew/contracts";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

export interface ExecutionDispatcher {
  dispatch(job: { executionId: string; organizationId: string }): Promise<void>;
  close(): Promise<void>;
}

export class NoopExecutionDispatcher implements ExecutionDispatcher {
  async dispatch() {}
  async close() {}
}

export class BullMqExecutionDispatcher implements ExecutionDispatcher {
  private readonly connection: Redis;
  private readonly queue: Queue;

  constructor(redisUrl: string) {
    this.connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
    this.queue = new Queue(executionQueueName, { connection: this.connection });
  }

  async dispatch(rawJob: { executionId: string; organizationId: string }) {
    const job = executionJobSchema.parse(rawJob);
    await this.queue.add("execute", job, {
      jobId: job.executionId,
      attempts: 3,
      backoff: { type: "exponential", delay: 2_000 },
      removeOnComplete: 1_000,
      removeOnFail: 5_000,
    });
  }

  async close() {
    await this.queue.close();
    await this.connection.quit();
  }
}

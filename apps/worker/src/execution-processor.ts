import { executionJobSchema, type ExecutionJob } from "@braincrew/contracts";
import { asJson, type BraincrewPrismaClient, withTenant } from "@braincrew/database";
import {
  createAgentRuntime,
  runtimeRequestSchema,
  type AgentRuntime,
  type RuntimeEvent,
  type RuntimeResult,
} from "@braincrew/orchestrator-dsh";

export interface ProcessorOptions {
  prisma: BraincrewPrismaClient;
  runtime?: AgentRuntime;
}

export class ExecutionProcessor {
  private readonly runtime: AgentRuntime;

  constructor(private readonly options: ProcessorOptions) {
    this.runtime = options.runtime ?? createAgentRuntime();
  }

  async process(rawJob: ExecutionJob): Promise<void> {
    const job = executionJobSchema.parse(rawJob);

    await withTenant(
      this.options.prisma,
      { organizationId: job.organizationId, worker: true },
      async (tx) => {
        const execution = await tx.execution.findUniqueOrThrow({
          where: {
            organizationId_id: {
              organizationId: job.organizationId,
              id: job.executionId,
            },
          },
          include: {
            agentVersion: {
              include: {
                model: true,
                plugins: { include: { installation: { include: { definition: true } } } },
              },
            },
            workflowVersion: {
              include: {
                nodes: {
                  include: {
                    agentVersion: {
                      include: {
                        model: true,
                        plugins: {
                          include: { installation: { include: { definition: true } } },
                        },
                      },
                    },
                  },
                },
                edges: true,
              },
            },
          },
        });

        if (!["QUEUED", "FAILED"].includes(execution.status)) return;

        await tx.execution.update({
          where: { id: execution.id },
          data: { status: "RUNNING", startedAt: new Date(), errorCode: null, errorMessage: null },
        });
        await this.appendEvent(tx, job, {
          type: "execution.started",
          level: "INFO",
          message: "L’exécution Braincrew a démarré.",
        });

        try {
          const results: RuntimeResult[] = [];

          if (execution.kind === "AGENT" && execution.agentVersion) {
            results.push(
              await this.runAgent(tx, job, execution.agentVersion, execution.input, undefined),
            );
          } else if (execution.kind === "WORKFLOW" && execution.workflowVersion) {
            const orderedNodes = this.orderWorkflowNodes(
              execution.workflowVersion.nodes,
              execution.workflowVersion.edges,
            );
            let currentInput: unknown = execution.input;
            let sequence = 1;
            for (const node of orderedNodes) {
              if (node.kind !== "AGENT" || !node.agentVersion) continue;
              const step = await tx.executionStep.create({
                data: {
                  organizationId: job.organizationId,
                  executionId: job.executionId,
                  agentVersionId: node.agentVersion.id,
                  nodeKey: node.key,
                  sequence,
                  status: "RUNNING",
                  input: asJson(currentInput),
                  startedAt: new Date(),
                },
              });
              try {
                const result = await this.runAgent(
                  tx,
                  job,
                  node.agentVersion,
                  currentInput,
                  step.id,
                );
                results.push(result);
                currentInput = result.output;
                await tx.executionStep.update({
                  where: { id: step.id },
                  data: {
                    status: "SUCCEEDED",
                    output: asJson(result.output),
                    ...(result.sessionId ? { dshSessionId: result.sessionId } : {}),
                    finishedAt: new Date(),
                  },
                });
              } catch (error) {
                await tx.executionStep.update({
                  where: { id: step.id },
                  data: {
                    status: "FAILED",
                    errorMessage: error instanceof Error ? error.message : String(error),
                    finishedAt: new Date(),
                  },
                });
                throw error;
              }
              sequence += 1;
            }
          } else {
            throw new Error("Execution target is missing or inconsistent");
          }

          const lastResult = results.at(-1);
          const inputTokens = results.reduce((sum, result) => sum + result.inputTokens, 0);
          const outputTokens = results.reduce((sum, result) => sum + result.outputTokens, 0);
          const cost = results.reduce((sum, result) => sum + result.cost, 0);
          await tx.execution.update({
            where: { id: execution.id },
            data: {
              status: "SUCCEEDED",
              output: asJson(lastResult?.output ?? {}),
              ...(lastResult?.sessionId ? { dshSessionId: lastResult.sessionId } : {}),
              totalInputTokens: inputTokens,
              totalOutputTokens: outputTokens,
              totalCost: cost,
              finishedAt: new Date(),
            },
          });
          await this.appendEvent(tx, job, {
            type: "execution.completed",
            level: "INFO",
            message: "L’exécution Braincrew est terminée.",
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await tx.execution.update({
            where: { id: execution.id },
            data: {
              status: "FAILED",
              errorCode: "RUNTIME_ERROR",
              errorMessage: message,
              finishedAt: new Date(),
            },
          });
          await this.appendEvent(tx, job, {
            type: "execution.failed",
            level: "ERROR",
            message,
          });
          throw error;
        }
      },
    );
  }

  private async runAgent(
    tx: any,
    job: ExecutionJob,
    agentVersion: any,
    input: unknown,
    stepId?: string,
  ): Promise<RuntimeResult> {
    const request = runtimeRequestSchema.parse({
      executionId: job.executionId,
      organizationId: job.organizationId,
      systemPrompt: agentVersion.systemPrompt,
      userInput: input,
      provider: agentVersion.model.provider,
      model: agentVersion.model.modelName,
      modelParameters: agentVersion.modelParameters,
      maxSteps: agentVersion.maxSteps,
      timeoutMs: agentVersion.timeoutMs,
      plugins: agentVersion.plugins.map((binding: any) => ({
        key: binding.installation.definition.key,
        version: binding.installation.definition.version,
        packageName: binding.installation.definition.packageName,
        config: { ...binding.installation.config, ...binding.config },
        permissions: binding.permissions,
      })),
    });

    const result = await this.runtime.execute(request, (event) =>
      this.appendEvent(tx, job, event, stepId),
    );

    await tx.usageEvent.create({
      data: {
        organizationId: job.organizationId,
        executionId: job.executionId,
        stepId,
        modelDefinitionId: agentVersion.modelDefinitionId,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cost: result.cost,
      },
    });
    return result;
  }

  private async appendEvent(tx: any, job: ExecutionJob, event: RuntimeEvent, stepId?: string) {
    const aggregate = await tx.executionEvent.aggregate({
      where: { organizationId: job.organizationId, executionId: job.executionId },
      _max: { sequence: true },
    });
    await tx.executionEvent.create({
      data: {
        organizationId: job.organizationId,
        executionId: job.executionId,
        stepId,
        sequence: (aggregate._max.sequence ?? 0) + 1,
        level: event.level,
        type: event.type,
        message: event.message,
        payload: event.payload ? asJson(event.payload) : undefined,
      },
    });
  }

  private orderWorkflowNodes(nodes: any[], edges: any[]): any[] {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const indegree = new Map(nodes.map((node) => [node.id, 0]));
    const outgoing = new Map<string, string[]>();
    for (const edge of edges) {
      indegree.set(edge.targetNodeId, (indegree.get(edge.targetNodeId) ?? 0) + 1);
      outgoing.set(edge.sourceNodeId, [
        ...(outgoing.get(edge.sourceNodeId) ?? []),
        edge.targetNodeId,
      ]);
    }
    const queue = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
    const ordered: any[] = [];
    while (queue.length) {
      const id = queue.shift();
      if (!id) break;
      const node = byId.get(id);
      if (node) ordered.push(node);
      for (const target of outgoing.get(id) ?? []) {
        const next = (indegree.get(target) ?? 1) - 1;
        indegree.set(target, next);
        if (next === 0) queue.push(target);
      }
    }
    if (ordered.length !== nodes.length) throw new Error("Workflow graph contains a cycle");
    return ordered;
  }
}

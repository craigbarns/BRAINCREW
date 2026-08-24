import type {
  AgentCreateInput,
  BrandingInput,
  ExecutionCreateInput,
  WorkflowCreateInput,
} from "@braincrew/contracts";
import { asJson, Prisma, type BraincrewPrismaClient, withTenant } from "@braincrew/database";
import type { RequestContext } from "./types.js";

export interface BraincrewStore {
  getOrganization(context: RequestContext): Promise<unknown>;
  updateBranding(context: RequestContext, input: BrandingInput): Promise<unknown>;
  getOverview(context: RequestContext): Promise<unknown>;
  listModels(context: RequestContext): Promise<unknown[]>;
  listPlugins(context: RequestContext): Promise<unknown[]>;
  listAgents(context: RequestContext): Promise<unknown[]>;
  createAgent(context: RequestContext, input: AgentCreateInput): Promise<unknown>;
  listWorkflows(context: RequestContext): Promise<unknown[]>;
  createWorkflow(context: RequestContext, input: WorkflowCreateInput): Promise<unknown>;
  listExecutions(context: RequestContext): Promise<unknown[]>;
  createExecution(context: RequestContext, input: ExecutionCreateInput): Promise<any>;
  getExecution(context: RequestContext, executionId: string): Promise<unknown | null>;
}

export class PrismaBraincrewStore implements BraincrewStore {
  constructor(private readonly prisma: BraincrewPrismaClient) {}

  private tenant<T>(context: RequestContext, operation: Parameters<typeof withTenant<T>>[2]) {
    return withTenant(this.prisma, context, operation);
  }

  async getOrganization(context: RequestContext) {
    return this.tenant(context, (tx) =>
      tx.organization.findUniqueOrThrow({
        where: { id: context.organizationId },
        include: { branding: true, subscription: true },
      }),
    );
  }

  async updateBranding(context: RequestContext, input: BrandingInput) {
    return this.tenant(context, (tx) =>
      tx.organizationBranding.upsert({
        where: { organizationId: context.organizationId },
        update: {
          ...input,
          customDomain: input.customDomain || null,
          logoUrl: input.logoUrl || null,
          faviconUrl: input.faviconUrl || null,
          emailFromName: input.emailFromName || null,
        },
        create: {
          organizationId: context.organizationId,
          ...input,
          customDomain: input.customDomain || null,
          logoUrl: input.logoUrl || null,
          faviconUrl: input.faviconUrl || null,
          emailFromName: input.emailFromName || null,
        },
      }),
    );
  }

  async getOverview(context: RequestContext) {
    return this.tenant(context, async (tx) => {
      const [agents, workflows, executions, usage] = await Promise.all([
        tx.agent.count({ where: { organizationId: context.organizationId, deletedAt: null } }),
        tx.workflow.count({ where: { organizationId: context.organizationId, deletedAt: null } }),
        tx.execution.count({ where: { organizationId: context.organizationId } }),
        tx.usageEvent.aggregate({
          where: { organizationId: context.organizationId },
          _sum: { inputTokens: true, outputTokens: true, cost: true },
        }),
      ]);
      return {
        agents,
        workflows,
        executions,
        inputTokens: usage._sum.inputTokens ?? 0,
        outputTokens: usage._sum.outputTokens ?? 0,
        cost: Number(usage._sum.cost ?? 0),
      };
    });
  }

  async listModels(context: RequestContext) {
    return this.tenant(context, (tx) =>
      tx.modelDefinition.findMany({ where: { enabled: true }, orderBy: { displayName: "asc" } }),
    );
  }

  async listPlugins(context: RequestContext) {
    return this.tenant(context, (tx) =>
      tx.pluginInstallation.findMany({
        where: { organizationId: context.organizationId },
        include: { definition: true },
        orderBy: { name: "asc" },
      }),
    );
  }

  async listAgents(context: RequestContext) {
    return this.tenant(context, (tx) =>
      tx.agent.findMany({
        where: { organizationId: context.organizationId, deletedAt: null },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            include: { model: true, plugins: { include: { installation: true } } },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    );
  }

  async createAgent(context: RequestContext, input: AgentCreateInput) {
    return this.tenant(context, async (tx) => {
      const agent = await tx.agent.create({
        data: {
          organizationId: context.organizationId,
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          createdByUserId: context.userId,
        },
      });
      const version = await tx.agentVersion.create({
        data: {
          organizationId: context.organizationId,
          agentId: agent.id,
          modelDefinitionId: input.modelDefinitionId,
          version: 1,
          systemPrompt: input.systemPrompt,
          modelParameters: asJson(input.modelParameters),
          maxSteps: input.maxSteps,
          timeoutMs: input.timeoutMs,
          createdByUserId: context.userId,
        },
      });
      if (input.pluginInstallationIds.length > 0) {
        await tx.agentVersionPlugin.createMany({
          data: input.pluginInstallationIds.map((pluginInstallationId, order) => ({
            organizationId: context.organizationId,
            agentVersionId: version.id,
            pluginInstallationId,
            order,
          })),
        });
      }
      return tx.agent.findUniqueOrThrow({
        where: {
          organizationId_id: { organizationId: context.organizationId, id: agent.id },
        },
        include: { versions: { include: { model: true, plugins: true } } },
      });
    });
  }

  async listWorkflows(context: RequestContext) {
    return this.tenant(context, (tx) =>
      tx.workflow.findMany({
        where: { organizationId: context.organizationId, deletedAt: null },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            include: { nodes: true, edges: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    );
  }

  async createWorkflow(context: RequestContext, input: WorkflowCreateInput) {
    return this.tenant(context, async (tx) => {
      const workflow = await tx.workflow.create({
        data: {
          organizationId: context.organizationId,
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          status: input.publish ? "ACTIVE" : "DRAFT",
          createdByUserId: context.userId,
        },
      });
      const version = await tx.workflowVersion.create({
        data: {
          organizationId: context.organizationId,
          workflowId: workflow.id,
          version: 1,
          status: input.publish ? "PUBLISHED" : "DRAFT",
          publishedAt: input.publish ? new Date() : null,
          createdByUserId: context.userId,
        },
      });
      await tx.workflowNode.createMany({
        data: input.nodes.map((node) => ({
          organizationId: context.organizationId,
          workflowVersionId: version.id,
          key: node.key,
          name: node.name,
          kind: node.kind,
          agentVersionId: node.agentVersionId ?? null,
          config: asJson(node.config),
          positionX: node.positionX,
          positionY: node.positionY,
        })),
      });
      const versionNodes = await tx.workflowNode.findMany({
        where: {
          organizationId: context.organizationId,
          workflowVersionId: version.id,
        },
      });
      const nodeByKey = new Map(versionNodes.map((node) => [node.key, node.id]));

      await tx.workflowEdge.createMany({
        data: input.edges.map((edge) => {
          const sourceNodeId = nodeByKey.get(edge.sourceKey);
          const targetNodeId = nodeByKey.get(edge.targetKey);
          if (!sourceNodeId || !targetNodeId) {
            throw new Error(`Unknown workflow edge: ${edge.sourceKey} -> ${edge.targetKey}`);
          }
          return {
            organizationId: context.organizationId,
            workflowVersionId: version.id,
            sourceNodeId,
            targetNodeId,
            label: edge.label ?? null,
            condition: edge.condition ? asJson(edge.condition) : Prisma.DbNull,
            priority: edge.priority,
          };
        }),
      });

      return tx.workflow.findUniqueOrThrow({
        where: { organizationId_id: { organizationId: context.organizationId, id: workflow.id } },
        include: { versions: { include: { nodes: true, edges: true } } },
      });
    });
  }

  async listExecutions(context: RequestContext) {
    return this.tenant(context, (tx) =>
      tx.execution.findMany({
        where: { organizationId: context.organizationId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { events: { orderBy: { sequence: "asc" }, take: 5 } },
      }),
    );
  }

  async createExecution(context: RequestContext, input: ExecutionCreateInput) {
    return this.tenant(context, async (tx) => {
      const execution = await tx.execution.create({
        data: {
          organizationId: context.organizationId,
          kind: input.kind,
          agentVersionId: input.agentVersionId ?? null,
          workflowVersionId: input.workflowVersionId ?? null,
          initiatedByUserId: context.userId,
          idempotencyKey: input.idempotencyKey ?? null,
          input: asJson(input.input),
        },
      });
      await tx.outboxEvent.create({
        data: {
          organizationId: context.organizationId,
          aggregateType: "Execution",
          aggregateId: execution.id,
          type: "execution.queued",
          payload: { executionId: execution.id, organizationId: context.organizationId },
        },
      });
      return execution;
    });
  }

  async getExecution(context: RequestContext, executionId: string) {
    return this.tenant(context, (tx) =>
      tx.execution.findUnique({
        where: { organizationId_id: { organizationId: context.organizationId, id: executionId } },
        include: {
          steps: { orderBy: { sequence: "asc" } },
          events: { orderBy: { sequence: "asc" } },
          usageEvents: true,
        },
      }),
    );
  }
}

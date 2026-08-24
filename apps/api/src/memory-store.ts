import { randomUUID } from "node:crypto";
import type {
  AgentCreateInput,
  BrandingInput,
  ExecutionCreateInput,
  WorkflowCreateInput,
} from "@braincrew/contracts";
import type { BraincrewStore } from "./store.js";
import type { RequestContext } from "./types.js";

const now = () => new Date().toISOString();

export class MemoryBraincrewStore implements BraincrewStore {
  private branding = {
    primaryColor: "#7C5CFC",
    secondaryColor: "#12101A",
    accentColor: "#B8FF65",
    logoUrl: null,
    faviconUrl: null,
    customDomain: null,
    emailFromName: "Braincrew Labs",
  };

  private readonly models = [
    {
      id: "00000000-0000-4000-8000-000000000020",
      key: "deepseek-chat",
      provider: "deepseek-official",
      modelName: "deepseek-chat",
      displayName: "DeepSeek Chat",
    },
    {
      id: "00000000-0000-4000-8000-000000000021",
      key: "deepseek-reasoner",
      provider: "deepseek-official",
      modelName: "deepseek-reasoner",
      displayName: "DeepSeek Reasoner",
    },
    {
      id: "00000000-0000-4000-8000-000000000022",
      key: "openai-gpt-5.6-terra",
      provider: "openai",
      modelName: "gpt-5.6-terra",
      displayName: "OpenAI GPT-5.6 Terra",
    },
    {
      id: "00000000-0000-4000-8000-000000000023",
      key: "openai-gpt-5.6-luna",
      provider: "openai",
      modelName: "gpt-5.6-luna",
      displayName: "OpenAI GPT-5.6 Luna",
    },
    {
      id: "00000000-0000-4000-8000-000000000024",
      key: "openai-gpt-5.6-sol",
      provider: "openai",
      modelName: "gpt-5.6-sol",
      displayName: "OpenAI GPT-5.6 Sol",
    },
  ];

  private readonly plugins = [
    {
      id: "00000000-0000-4000-8000-000000000040",
      name: "Web public",
      slug: "web-public",
      status: "ACTIVE",
      definition: { key: "web-access", displayName: "Accès Web", kind: "TOOL" },
    },
    {
      id: "00000000-0000-4000-8000-000000000041",
      name: "Gmail commercial",
      slug: "gmail-commercial",
      status: "ACTIVE",
      definition: { key: "gmail", displayName: "Gmail", kind: "INTEGRATION" },
    },
    {
      id: "00000000-0000-4000-8000-000000000042",
      name: "CRM principal",
      slug: "crm-principal",
      status: "ACTIVE",
      definition: { key: "crm", displayName: "CRM", kind: "INTEGRATION" },
    },
  ];

  private readonly agents: any[] = [
    {
      id: "00000000-0000-4000-8000-000000000050",
      name: "Éclaireur marché",
      slug: "eclaireur-marche",
      description: "Surveille les concurrents et synthétise les signaux utiles.",
      status: "ACTIVE",
      updatedAt: now(),
      versions: [
        {
          id: "00000000-0000-4000-8000-000000000051",
          version: 1,
          status: "PUBLISHED",
          systemPrompt: "Tu es un analyste de veille B2B.",
          model: this.models[0],
          plugins: [{ installation: this.plugins[0] }],
        },
      ],
    },
    {
      id: "00000000-0000-4000-8000-000000000052",
      name: "Inbox Captain",
      slug: "inbox-captain",
      description: "Trie les emails entrants et prépare les réponses prioritaires.",
      status: "ACTIVE",
      updatedAt: now(),
      versions: [
        {
          id: "00000000-0000-4000-8000-000000000053",
          version: 3,
          status: "PUBLISHED",
          systemPrompt: "Tu pilotes une boîte de réception commerciale.",
          model: this.models[0],
          plugins: [{ installation: this.plugins[1] }],
        },
      ],
    },
  ];

  private readonly workflows: any[] = [
    {
      id: "00000000-0000-4000-8000-000000000060",
      name: "Radar concurrentiel",
      slug: "radar-concurrentiel",
      description: "Collecte, analyse puis prépare un rapport hebdomadaire.",
      status: "ACTIVE",
      updatedAt: now(),
      versions: [{ id: "00000000-0000-4000-8000-000000000061", version: 2, nodes: [], edges: [] }],
    },
  ];

  private readonly executions: any[] = [
    {
      id: "00000000-0000-4000-8000-000000000070",
      kind: "WORKFLOW",
      status: "SUCCEEDED",
      totalInputTokens: 12_840,
      totalOutputTokens: 2_914,
      totalCost: 0.18,
      createdAt: now(),
      finishedAt: now(),
      events: [{ sequence: 1, level: "INFO", type: "workflow.completed" }],
    },
  ];

  async getOrganization(context: RequestContext) {
    return {
      id: context.organizationId,
      name: "Braincrew Labs",
      slug: "braincrew-labs",
      status: "ACTIVE",
      branding: this.branding,
      subscription: { planKey: "growth", status: "ACTIVE", seats: 8 },
    };
  }

  async updateBranding(_context: RequestContext, input: BrandingInput) {
    this.branding = { ...this.branding, ...input } as typeof this.branding;
    return this.branding;
  }

  async getOverview() {
    return {
      agents: this.agents.length,
      workflows: this.workflows.length,
      executions: 248,
      inputTokens: 1_842_300,
      outputTokens: 483_900,
      cost: 47.82,
    };
  }

  async listModels() {
    return this.models;
  }

  async listPlugins() {
    return this.plugins;
  }

  async listAgents() {
    return this.agents;
  }

  async createAgent(_context: RequestContext, input: AgentCreateInput) {
    const agent = {
      id: randomUUID(),
      name: input.name,
      slug: input.slug,
      description: input.description,
      status: "DRAFT",
      updatedAt: now(),
      versions: [
        {
          id: randomUUID(),
          version: 1,
          status: "DRAFT",
          systemPrompt: input.systemPrompt,
          model: this.models.find((model) => model.id === input.modelDefinitionId),
          plugins: this.plugins
            .filter((plugin) => input.pluginInstallationIds.includes(plugin.id))
            .map((installation) => ({ installation })),
        },
      ],
    };
    this.agents.unshift(agent);
    return agent;
  }

  async listWorkflows() {
    return this.workflows;
  }

  async createWorkflow(_context: RequestContext, input: WorkflowCreateInput) {
    const workflow = {
      id: randomUUID(),
      ...input,
      status: input.publish ? "ACTIVE" : "DRAFT",
      updatedAt: now(),
      versions: [{ id: randomUUID(), version: 1, nodes: input.nodes, edges: input.edges }],
    };
    this.workflows.unshift(workflow);
    return workflow;
  }

  async listExecutions() {
    return this.executions;
  }

  async createExecution(_context: RequestContext, input: ExecutionCreateInput) {
    const execution = {
      id: randomUUID(),
      ...input,
      status: "QUEUED",
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      createdAt: now(),
      events: [],
    };
    this.executions.unshift(execution);
    return execution;
  }

  async getExecution(_context: RequestContext, executionId: string) {
    return this.executions.find((execution) => execution.id === executionId) ?? null;
  }
}

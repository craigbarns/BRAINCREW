import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DIRECT_URL or DATABASE_URL is required to seed Braincrew.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const ids = {
  user: "00000000-0000-4000-8000-000000000001",
  organization: "00000000-0000-4000-8000-000000000010",
  chatModel: "00000000-0000-4000-8000-000000000020",
  reasonerModel: "00000000-0000-4000-8000-000000000021",
  openAiTerraModel: "00000000-0000-4000-8000-000000000022",
  openAiLunaModel: "00000000-0000-4000-8000-000000000023",
  openAiSolModel: "00000000-0000-4000-8000-000000000024",
  webPlugin: "00000000-0000-4000-8000-000000000030",
  gmailPlugin: "00000000-0000-4000-8000-000000000031",
  crmPlugin: "00000000-0000-4000-8000-000000000032",
  webInstallation: "00000000-0000-4000-8000-000000000040",
  gmailInstallation: "00000000-0000-4000-8000-000000000041",
  crmInstallation: "00000000-0000-4000-8000-000000000042",
  agent: "00000000-0000-4000-8000-000000000050",
  agentVersion: "00000000-0000-4000-8000-000000000051",
  inboxAgent: "00000000-0000-4000-8000-000000000052",
  inboxAgentVersion: "00000000-0000-4000-8000-000000000053",
  workflow: "00000000-0000-4000-8000-000000000060",
  workflowVersion: "00000000-0000-4000-8000-000000000061",
  startNode: "00000000-0000-4000-8000-000000000062",
  scoutNode: "00000000-0000-4000-8000-000000000063",
  inboxNode: "00000000-0000-4000-8000-000000000064",
  endNode: "00000000-0000-4000-8000-000000000065",
};

async function main() {
  await prisma.user.upsert({
    where: { id: ids.user },
    update: {},
    create: {
      id: ids.user,
      email: "founder@braincrew.ai",
      firstName: "Gregory",
      lastName: "Founder",
    },
  });

  await prisma.organization.upsert({
    where: { id: ids.organization },
    update: {},
    create: {
      id: ids.organization,
      name: "Braincrew Labs",
      slug: "braincrew-labs",
      branding: {
        create: {
          primaryColor: "#7C5CFC",
          secondaryColor: "#12101A",
          accentColor: "#B8FF65",
        },
      },
    },
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: ids.organization,
        userId: ids.user,
      },
    },
    update: { role: "OWNER", status: "ACTIVE" },
    create: {
      organizationId: ids.organization,
      userId: ids.user,
      role: "OWNER",
    },
  });

  await prisma.modelDefinition.upsert({
    where: { key: "deepseek-chat" },
    update: {},
    create: {
      id: ids.chatModel,
      key: "deepseek-chat",
      provider: "deepseek-official",
      modelName: "deepseek-chat",
      displayName: "DeepSeek Chat",
      capabilities: { tools: true, streaming: true },
    },
  });

  await prisma.modelDefinition.upsert({
    where: { key: "deepseek-reasoner" },
    update: {},
    create: {
      id: ids.reasonerModel,
      key: "deepseek-reasoner",
      provider: "deepseek-official",
      modelName: "deepseek-reasoner",
      displayName: "DeepSeek Reasoner",
      capabilities: { tools: true, reasoning: true },
    },
  });

  await prisma.modelDefinition.upsert({
    where: { key: "openai-gpt-5.6-terra" },
    update: {},
    create: {
      id: ids.openAiTerraModel,
      key: "openai-gpt-5.6-terra",
      provider: "openai",
      modelName: "gpt-5.6-terra",
      displayName: "OpenAI GPT-5.6 Terra",
      capabilities: { tools: true, reasoning: true, vision: true, streaming: true },
      inputPricePerMToken: "2",
      outputPricePerMToken: "12",
    },
  });

  await prisma.modelDefinition.upsert({
    where: { key: "openai-gpt-5.6-luna" },
    update: {},
    create: {
      id: ids.openAiLunaModel,
      key: "openai-gpt-5.6-luna",
      provider: "openai",
      modelName: "gpt-5.6-luna",
      displayName: "OpenAI GPT-5.6 Luna",
      capabilities: { tools: true, reasoning: true, vision: true, streaming: true },
      inputPricePerMToken: "0.2",
      outputPricePerMToken: "1.2",
    },
  });

  await prisma.modelDefinition.upsert({
    where: { key: "openai-gpt-5.6-sol" },
    update: {},
    create: {
      id: ids.openAiSolModel,
      key: "openai-gpt-5.6-sol",
      provider: "openai",
      modelName: "gpt-5.6-sol",
      displayName: "OpenAI GPT-5.6 Sol",
      capabilities: { tools: true, reasoning: true, vision: true, streaming: true },
      inputPricePerMToken: "4",
      outputPricePerMToken: "20",
    },
  });

  await prisma.pluginDefinition.upsert({
    where: { key_version: { key: "web-access", version: "1.0.0" } },
    update: {},
    create: {
      id: ids.webPlugin,
      key: "web-access",
      version: "1.0.0",
      displayName: "Accès Web",
      description: "Recherche et lecture de pages web avec garde-fous.",
      kind: "TOOL",
      packageName: "@braincrew/plugin-web-access",
      configSchema: { type: "object", properties: {} },
    },
  });

  await prisma.pluginDefinition.upsert({
    where: { key_version: { key: "gmail", version: "1.0.0" } },
    update: {},
    create: {
      id: ids.gmailPlugin,
      key: "gmail",
      version: "1.0.0",
      displayName: "Gmail",
      description: "Recherche et préparation contrôlée d’emails Gmail.",
      kind: "INTEGRATION",
      packageName: "@braincrew/plugin-gmail",
      configSchema: { type: "object", properties: {} },
    },
  });

  await prisma.pluginDefinition.upsert({
    where: { key_version: { key: "crm", version: "1.0.0" } },
    update: {},
    create: {
      id: ids.crmPlugin,
      key: "crm",
      version: "1.0.0",
      displayName: "CRM",
      description: "Lecture et mise à jour de contacts via une API CRM HTTPS.",
      kind: "INTEGRATION",
      packageName: "@braincrew/plugin-crm",
      configSchema: { type: "object", properties: {} },
    },
  });

  await prisma.pluginInstallation.upsert({
    where: {
      organizationId_id: { organizationId: ids.organization, id: ids.webInstallation },
    },
    update: {},
    create: {
      id: ids.webInstallation,
      organizationId: ids.organization,
      pluginDefinitionId: ids.webPlugin,
      name: "Web public",
      slug: "web-public",
    },
  });

  await prisma.pluginInstallation.upsert({
    where: {
      organizationId_id: { organizationId: ids.organization, id: ids.gmailInstallation },
    },
    update: {},
    create: {
      id: ids.gmailInstallation,
      organizationId: ids.organization,
      pluginDefinitionId: ids.gmailPlugin,
      name: "Gmail commercial",
      slug: "gmail-commercial",
    },
  });

  await prisma.pluginInstallation.upsert({
    where: {
      organizationId_id: { organizationId: ids.organization, id: ids.crmInstallation },
    },
    update: {},
    create: {
      id: ids.crmInstallation,
      organizationId: ids.organization,
      pluginDefinitionId: ids.crmPlugin,
      name: "CRM principal",
      slug: "crm-principal",
    },
  });

  await prisma.agent.upsert({
    where: { organizationId_id: { organizationId: ids.organization, id: ids.agent } },
    update: {},
    create: {
      id: ids.agent,
      organizationId: ids.organization,
      name: "Éclaireur marché",
      slug: "eclaireur-marche",
      description: "Surveille les concurrents et synthétise les signaux utiles.",
      status: "ACTIVE",
    },
  });

  await prisma.agentVersion.upsert({
    where: {
      organizationId_agentId_version: {
        organizationId: ids.organization,
        agentId: ids.agent,
        version: 1,
      },
    },
    update: {},
    create: {
      id: ids.agentVersion,
      organizationId: ids.organization,
      agentId: ids.agent,
      modelDefinitionId: ids.chatModel,
      version: 1,
      status: "PUBLISHED",
      systemPrompt:
        "Tu es un analyste de veille B2B. Recherche, vérifie les sources et produis une synthèse actionnable.",
      publishedAt: new Date(),
    },
  });

  await prisma.agentVersionPlugin.upsert({
    where: {
      organizationId_agentVersionId_pluginInstallationId: {
        organizationId: ids.organization,
        agentVersionId: ids.agentVersion,
        pluginInstallationId: ids.webInstallation,
      },
    },
    update: {},
    create: {
      organizationId: ids.organization,
      agentVersionId: ids.agentVersion,
      pluginInstallationId: ids.webInstallation,
      permissions: { network: ["https"] },
    },
  });

  await prisma.agent.upsert({
    where: {
      organizationId_id: { organizationId: ids.organization, id: ids.inboxAgent },
    },
    update: {},
    create: {
      id: ids.inboxAgent,
      organizationId: ids.organization,
      name: "Inbox Captain",
      slug: "inbox-captain",
      description: "Trie les messages et prépare les réponses prioritaires.",
      status: "ACTIVE",
    },
  });
  await prisma.agentVersion.upsert({
    where: {
      organizationId_agentId_version: {
        organizationId: ids.organization,
        agentId: ids.inboxAgent,
        version: 1,
      },
    },
    update: {},
    create: {
      id: ids.inboxAgentVersion,
      organizationId: ids.organization,
      agentId: ids.inboxAgent,
      modelDefinitionId: ids.chatModel,
      version: 1,
      status: "PUBLISHED",
      systemPrompt: "Tu transformes une synthèse de veille en brief email court et actionnable.",
      publishedAt: new Date(),
    },
  });
  await prisma.agentVersionPlugin.upsert({
    where: {
      organizationId_agentVersionId_pluginInstallationId: {
        organizationId: ids.organization,
        agentVersionId: ids.inboxAgentVersion,
        pluginInstallationId: ids.gmailInstallation,
      },
    },
    update: {},
    create: {
      organizationId: ids.organization,
      agentVersionId: ids.inboxAgentVersion,
      pluginInstallationId: ids.gmailInstallation,
    },
  });

  await prisma.workflow.upsert({
    where: { organizationId_id: { organizationId: ids.organization, id: ids.workflow } },
    update: {},
    create: {
      id: ids.workflow,
      organizationId: ids.organization,
      name: "Radar concurrentiel",
      slug: "radar-concurrentiel",
      description: "Collecte, analyse puis prépare un brief commercial.",
      status: "ACTIVE",
    },
  });
  await prisma.workflowVersion.upsert({
    where: {
      organizationId_workflowId_version: {
        organizationId: ids.organization,
        workflowId: ids.workflow,
        version: 1,
      },
    },
    update: {},
    create: {
      id: ids.workflowVersion,
      organizationId: ids.organization,
      workflowId: ids.workflow,
      version: 1,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  const workflowNodes = [
    {
      id: ids.startNode,
      key: "start",
      name: "Départ",
      kind: "START" as const,
      agentVersionId: null,
    },
    {
      id: ids.scoutNode,
      key: "scout",
      name: "Éclaireur marché",
      kind: "AGENT" as const,
      agentVersionId: ids.agentVersion,
    },
    {
      id: ids.inboxNode,
      key: "brief",
      name: "Inbox Captain",
      kind: "AGENT" as const,
      agentVersionId: ids.inboxAgentVersion,
    },
    { id: ids.endNode, key: "end", name: "Terminé", kind: "END" as const, agentVersionId: null },
  ];
  for (const node of workflowNodes) {
    await prisma.workflowNode.upsert({
      where: {
        organizationId_workflowVersionId_key: {
          organizationId: ids.organization,
          workflowVersionId: ids.workflowVersion,
          key: node.key,
        },
      },
      update: {},
      create: {
        ...node,
        organizationId: ids.organization,
        workflowVersionId: ids.workflowVersion,
      },
    });
  }
  await prisma.workflowEdge.createMany({
    data: [
      {
        organizationId: ids.organization,
        workflowVersionId: ids.workflowVersion,
        sourceNodeId: ids.startNode,
        targetNodeId: ids.scoutNode,
      },
      {
        organizationId: ids.organization,
        workflowVersionId: ids.workflowVersion,
        sourceNodeId: ids.scoutNode,
        targetNodeId: ids.inboxNode,
      },
      {
        organizationId: ids.organization,
        workflowVersionId: ids.workflowVersion,
        sourceNodeId: ids.inboxNode,
        targetNodeId: ids.endNode,
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

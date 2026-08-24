-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'BUILDER', 'VIEWER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PluginKind" AS ENUM ('TOOL', 'INTEGRATION', 'MEMORY', 'MODEL', 'GUARDRAIL');

-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ERROR');

-- CreateEnum
CREATE TYPE "CredentialKind" AS ENUM ('API_KEY', 'OAUTH2', 'BASIC_AUTH', 'SERVICE_ACCOUNT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkflowNodeKind" AS ENUM ('START', 'AGENT', 'CONDITION', 'PARALLEL', 'JOIN', 'HUMAN_APPROVAL', 'DELAY', 'END');

-- CreateEnum
CREATE TYPE "TriggerKind" AS ENUM ('MANUAL', 'SCHEDULE', 'WEBHOOK', 'EVENT');

-- CreateEnum
CREATE TYPE "ExecutionKind" AS ENUM ('AGENT', 'WORKFLOW');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('QUEUED', 'RUNNING', 'WAITING_APPROVAL', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'TIMED_OUT');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'UNPAID', 'PAUSED');

-- CreateEnum
CREATE TYPE "AuditActorKind" AS ENUM ('USER', 'API_KEY', 'SYSTEM', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationBranding" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#6D5EF5',
    "secondaryColor" TEXT NOT NULL DEFAULT '#111827',
    "accentColor" TEXT NOT NULL DEFAULT '#22C55E',
    "customDomain" TEXT,
    "emailFromName" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "OrganizationBranding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "lastSeenAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "OrganizationRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("organizationId","userId")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastUsedAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelDefinition" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "capabilities" JSONB NOT NULL DEFAULT '{}',
    "inputPricePerMToken" DECIMAL(18,8),
    "outputPricePerMToken" DECIMAL(18,8),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ModelDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "CredentialKind" NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedPayload" BYTEA NOT NULL,
    "encryptionKeyId" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginDefinition" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "kind" "PluginKind" NOT NULL,
    "packageName" TEXT NOT NULL,
    "entrypoint" TEXT,
    "configSchema" JSONB NOT NULL DEFAULT '{}',
    "requiredScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PluginDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluginInstallation" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "pluginDefinitionId" UUID NOT NULL,
    "credentialId" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "InstallationStatus" NOT NULL DEFAULT 'ACTIVE',
    "config" JSONB NOT NULL DEFAULT '{}',
    "lastError" TEXT,
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PluginInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "AgentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentVersion" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "modelDefinitionId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "VersionStatus" NOT NULL DEFAULT 'DRAFT',
    "systemPrompt" TEXT NOT NULL,
    "modelParameters" JSONB NOT NULL DEFAULT '{}',
    "maxSteps" INTEGER NOT NULL DEFAULT 12,
    "timeoutMs" INTEGER NOT NULL DEFAULT 300000,
    "memoryConfig" JSONB NOT NULL DEFAULT '{}',
    "guardrailConfig" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMPTZ(3),
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentVersionPlugin" (
    "organizationId" UUID NOT NULL,
    "agentVersionId" UUID NOT NULL,
    "pluginInstallationId" UUID NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentVersionPlugin_pkey" PRIMARY KEY ("organizationId","agentVersionId","pluginInstallationId")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowVersion" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "VersionStatus" NOT NULL DEFAULT 'DRAFT',
    "inputSchema" JSONB NOT NULL DEFAULT '{}',
    "outputSchema" JSONB NOT NULL DEFAULT '{}',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMPTZ(3),
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowNode" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "workflowVersionId" UUID NOT NULL,
    "agentVersionId" UUID,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "WorkflowNodeKind" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WorkflowNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowEdge" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "workflowVersionId" UUID NOT NULL,
    "sourceNodeId" UUID NOT NULL,
    "targetNodeId" UUID NOT NULL,
    "label" TEXT,
    "condition" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTrigger" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "TriggerKind" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "secretHash" TEXT,
    "nextRunAt" TIMESTAMPTZ(3),
    "lastTriggeredAt" TIMESTAMPTZ(3),
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WorkflowTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Execution" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "kind" "ExecutionKind" NOT NULL,
    "agentVersionId" UUID,
    "workflowVersionId" UUID,
    "triggerId" UUID,
    "initiatedByUserId" UUID,
    "idempotencyKey" TEXT,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'QUEUED',
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "dshSessionId" TEXT,
    "traceId" TEXT,
    "totalInputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "queuedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMPTZ(3),
    "finishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionStep" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "executionId" UUID NOT NULL,
    "agentVersionId" UUID,
    "nodeKey" TEXT,
    "parentStepId" UUID,
    "sequence" INTEGER NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'QUEUED',
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "dshSessionId" TEXT,
    "startedAt" TIMESTAMPTZ(3),
    "finishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ExecutionStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionEvent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "executionId" UUID NOT NULL,
    "stepId" UUID,
    "sequence" INTEGER NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "type" TEXT NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "executionId" UUID NOT NULL,
    "stepId" UUID,
    "modelDefinitionId" UUID NOT NULL,
    "providerRequestId" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedInputTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "planKey" TEXT NOT NULL DEFAULT 'starter',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "seats" INTEGER NOT NULL DEFAULT 1,
    "currentPeriodStart" TIMESTAMPTZ(3),
    "currentPeriodEnd" TIMESTAMPTZ(3),
    "trialEndsAt" TIMESTAMPTZ(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "actorKind" "AuditActorKind" NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalWebhookEvent" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "provider" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL,
    "errorMessage" TEXT,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ExternalWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMPTZ(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationBranding_organizationId_key" ON "OrganizationBranding"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationBranding_customDomain_key" ON "OrganizationBranding"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Membership_userId_status_idx" ON "Membership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_prefix_key" ON "ApiKey"("prefix");

-- CreateIndex
CREATE INDEX "ApiKey_organizationId_revokedAt_idx" ON "ApiKey"("organizationId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_organizationId_id_key" ON "ApiKey"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ModelDefinition_key_key" ON "ModelDefinition"("key");

-- CreateIndex
CREATE INDEX "Credential_organizationId_provider_revokedAt_idx" ON "Credential"("organizationId", "provider", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_organizationId_id_key" ON "Credential"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_organizationId_name_key" ON "Credential"("organizationId", "name");

-- CreateIndex
CREATE INDEX "PluginDefinition_kind_enabled_idx" ON "PluginDefinition"("kind", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "PluginDefinition_key_version_key" ON "PluginDefinition"("key", "version");

-- CreateIndex
CREATE INDEX "PluginInstallation_organizationId_status_idx" ON "PluginInstallation"("organizationId", "status");

-- CreateIndex
CREATE INDEX "PluginInstallation_pluginDefinitionId_idx" ON "PluginInstallation"("pluginDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "PluginInstallation_organizationId_id_key" ON "PluginInstallation"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PluginInstallation_organizationId_slug_key" ON "PluginInstallation"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "Agent_organizationId_status_updatedAt_idx" ON "Agent"("organizationId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_organizationId_id_key" ON "Agent"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_organizationId_slug_key" ON "Agent"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "AgentVersion_organizationId_agentId_status_idx" ON "AgentVersion"("organizationId", "agentId", "status");

-- CreateIndex
CREATE INDEX "AgentVersion_modelDefinitionId_idx" ON "AgentVersion"("modelDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentVersion_organizationId_id_key" ON "AgentVersion"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AgentVersion_organizationId_agentId_version_key" ON "AgentVersion"("organizationId", "agentId", "version");

-- CreateIndex
CREATE INDEX "AgentVersionPlugin_organizationId_pluginInstallationId_idx" ON "AgentVersionPlugin"("organizationId", "pluginInstallationId");

-- CreateIndex
CREATE INDEX "Workflow_organizationId_status_updatedAt_idx" ON "Workflow"("organizationId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_organizationId_id_key" ON "Workflow"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_organizationId_slug_key" ON "Workflow"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "WorkflowVersion_organizationId_workflowId_status_idx" ON "WorkflowVersion"("organizationId", "workflowId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowVersion_organizationId_id_key" ON "WorkflowVersion"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowVersion_organizationId_workflowId_version_key" ON "WorkflowVersion"("organizationId", "workflowId", "version");

-- CreateIndex
CREATE INDEX "WorkflowNode_organizationId_agentVersionId_idx" ON "WorkflowNode"("organizationId", "agentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowNode_organizationId_workflowVersionId_id_key" ON "WorkflowNode"("organizationId", "workflowVersionId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowNode_organizationId_workflowVersionId_key_key" ON "WorkflowNode"("organizationId", "workflowVersionId", "key");

-- CreateIndex
CREATE INDEX "WorkflowEdge_organizationId_workflowVersionId_idx" ON "WorkflowEdge"("organizationId", "workflowVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowEdge_organizationId_id_key" ON "WorkflowEdge"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowEdge_organizationId_workflowVersionId_sourceNodeId__key" ON "WorkflowEdge"("organizationId", "workflowVersionId", "sourceNodeId", "targetNodeId", "priority");

-- CreateIndex
CREATE INDEX "WorkflowTrigger_organizationId_enabled_nextRunAt_idx" ON "WorkflowTrigger"("organizationId", "enabled", "nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTrigger_organizationId_id_key" ON "WorkflowTrigger"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTrigger_organizationId_workflowId_name_key" ON "WorkflowTrigger"("organizationId", "workflowId", "name");

-- CreateIndex
CREATE INDEX "Execution_organizationId_status_createdAt_idx" ON "Execution"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Execution_organizationId_agentVersionId_createdAt_idx" ON "Execution"("organizationId", "agentVersionId", "createdAt");

-- CreateIndex
CREATE INDEX "Execution_organizationId_workflowVersionId_createdAt_idx" ON "Execution"("organizationId", "workflowVersionId", "createdAt");

-- CreateIndex
CREATE INDEX "Execution_traceId_idx" ON "Execution"("traceId");

-- CreateIndex
CREATE UNIQUE INDEX "Execution_organizationId_id_key" ON "Execution"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Execution_organizationId_idempotencyKey_key" ON "Execution"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "ExecutionStep_organizationId_executionId_status_idx" ON "ExecutionStep"("organizationId", "executionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionStep_organizationId_id_key" ON "ExecutionStep"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionStep_organizationId_executionId_sequence_attempt_key" ON "ExecutionStep"("organizationId", "executionId", "sequence", "attempt");

-- CreateIndex
CREATE INDEX "ExecutionEvent_organizationId_executionId_createdAt_idx" ON "ExecutionEvent"("organizationId", "executionId", "createdAt");

-- CreateIndex
CREATE INDEX "ExecutionEvent_organizationId_level_createdAt_idx" ON "ExecutionEvent"("organizationId", "level", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionEvent_organizationId_executionId_sequence_key" ON "ExecutionEvent"("organizationId", "executionId", "sequence");

-- CreateIndex
CREATE INDEX "UsageEvent_organizationId_occurredAt_idx" ON "UsageEvent"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "UsageEvent_organizationId_executionId_idx" ON "UsageEvent"("organizationId", "executionId");

-- CreateIndex
CREATE INDEX "UsageEvent_modelDefinitionId_occurredAt_idx" ON "UsageEvent"("modelDefinitionId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "Subscription"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_status_currentPeriodEnd_idx" ON "Subscription"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_resourceType_resourceId_idx" ON "AuditLog"("organizationId", "resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "ExternalWebhookEvent_status_receivedAt_idx" ON "ExternalWebhookEvent"("status", "receivedAt");

-- CreateIndex
CREATE INDEX "ExternalWebhookEvent_organizationId_receivedAt_idx" ON "ExternalWebhookEvent"("organizationId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalWebhookEvent_provider_externalEventId_key" ON "ExternalWebhookEvent"("provider", "externalEventId");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_availableAt_idx" ON "OutboxEvent"("status", "availableAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_organizationId_aggregateType_aggregateId_idx" ON "OutboxEvent"("organizationId", "aggregateType", "aggregateId");

-- AddForeignKey
ALTER TABLE "OrganizationBranding" ADD CONSTRAINT "OrganizationBranding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PluginInstallation" ADD CONSTRAINT "PluginInstallation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PluginInstallation" ADD CONSTRAINT "PluginInstallation_pluginDefinitionId_fkey" FOREIGN KEY ("pluginDefinitionId") REFERENCES "PluginDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PluginInstallation" ADD CONSTRAINT "PluginInstallation_organizationId_credentialId_fkey" FOREIGN KEY ("organizationId", "credentialId") REFERENCES "Credential"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentVersion" ADD CONSTRAINT "AgentVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentVersion" ADD CONSTRAINT "AgentVersion_organizationId_agentId_fkey" FOREIGN KEY ("organizationId", "agentId") REFERENCES "Agent"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentVersion" ADD CONSTRAINT "AgentVersion_modelDefinitionId_fkey" FOREIGN KEY ("modelDefinitionId") REFERENCES "ModelDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentVersionPlugin" ADD CONSTRAINT "AgentVersionPlugin_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentVersionPlugin" ADD CONSTRAINT "AgentVersionPlugin_organizationId_agentVersionId_fkey" FOREIGN KEY ("organizationId", "agentVersionId") REFERENCES "AgentVersion"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentVersionPlugin" ADD CONSTRAINT "AgentVersionPlugin_organizationId_pluginInstallationId_fkey" FOREIGN KEY ("organizationId", "pluginInstallationId") REFERENCES "PluginInstallation"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowVersion" ADD CONSTRAINT "WorkflowVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowVersion" ADD CONSTRAINT "WorkflowVersion_organizationId_workflowId_fkey" FOREIGN KEY ("organizationId", "workflowId") REFERENCES "Workflow"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowNode" ADD CONSTRAINT "WorkflowNode_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowNode" ADD CONSTRAINT "WorkflowNode_organizationId_workflowVersionId_fkey" FOREIGN KEY ("organizationId", "workflowVersionId") REFERENCES "WorkflowVersion"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowNode" ADD CONSTRAINT "WorkflowNode_organizationId_agentVersionId_fkey" FOREIGN KEY ("organizationId", "agentVersionId") REFERENCES "AgentVersion"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEdge" ADD CONSTRAINT "WorkflowEdge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEdge" ADD CONSTRAINT "WorkflowEdge_organizationId_workflowVersionId_fkey" FOREIGN KEY ("organizationId", "workflowVersionId") REFERENCES "WorkflowVersion"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEdge" ADD CONSTRAINT "WorkflowEdge_organizationId_workflowVersionId_sourceNodeId_fkey" FOREIGN KEY ("organizationId", "workflowVersionId", "sourceNodeId") REFERENCES "WorkflowNode"("organizationId", "workflowVersionId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEdge" ADD CONSTRAINT "WorkflowEdge_organizationId_workflowVersionId_targetNodeId_fkey" FOREIGN KEY ("organizationId", "workflowVersionId", "targetNodeId") REFERENCES "WorkflowNode"("organizationId", "workflowVersionId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTrigger" ADD CONSTRAINT "WorkflowTrigger_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTrigger" ADD CONSTRAINT "WorkflowTrigger_organizationId_workflowId_fkey" FOREIGN KEY ("organizationId", "workflowId") REFERENCES "Workflow"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_organizationId_agentVersionId_fkey" FOREIGN KEY ("organizationId", "agentVersionId") REFERENCES "AgentVersion"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_organizationId_workflowVersionId_fkey" FOREIGN KEY ("organizationId", "workflowVersionId") REFERENCES "WorkflowVersion"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_organizationId_triggerId_fkey" FOREIGN KEY ("organizationId", "triggerId") REFERENCES "WorkflowTrigger"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionStep" ADD CONSTRAINT "ExecutionStep_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionStep" ADD CONSTRAINT "ExecutionStep_organizationId_executionId_fkey" FOREIGN KEY ("organizationId", "executionId") REFERENCES "Execution"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionStep" ADD CONSTRAINT "ExecutionStep_organizationId_agentVersionId_fkey" FOREIGN KEY ("organizationId", "agentVersionId") REFERENCES "AgentVersion"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionEvent" ADD CONSTRAINT "ExecutionEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionEvent" ADD CONSTRAINT "ExecutionEvent_organizationId_executionId_fkey" FOREIGN KEY ("organizationId", "executionId") REFERENCES "Execution"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionEvent" ADD CONSTRAINT "ExecutionEvent_organizationId_stepId_fkey" FOREIGN KEY ("organizationId", "stepId") REFERENCES "ExecutionStep"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_organizationId_executionId_fkey" FOREIGN KEY ("organizationId", "executionId") REFERENCES "Execution"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_organizationId_stepId_fkey" FOREIGN KEY ("organizationId", "stepId") REFERENCES "ExecutionStep"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_modelDefinitionId_fkey" FOREIGN KEY ("modelDefinitionId") REFERENCES "ModelDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalWebhookEvent" ADD CONSTRAINT "ExternalWebhookEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;



-- Braincrew invariants that Prisma cannot express.
ALTER TABLE "Execution"
ADD CONSTRAINT "Execution_target_check"
CHECK (
  ("kind" = 'AGENT' AND "agentVersionId" IS NOT NULL AND "workflowVersionId" IS NULL)
  OR
  ("kind" = 'WORKFLOW' AND "workflowVersionId" IS NOT NULL AND "agentVersionId" IS NULL)
);

ALTER TABLE "WorkflowNode"
ADD CONSTRAINT "WorkflowNode_agent_check"
CHECK (
  ("kind" = 'AGENT' AND "agentVersionId" IS NOT NULL)
  OR
  ("kind" <> 'AGENT' AND "agentVersionId" IS NULL)
);

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_organization_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_organization_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.is_worker()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('app.is_worker', true), '')::boolean, false)
$$;

CREATE OR REPLACE FUNCTION app.is_current_org_member(target_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Membership"
    WHERE "organizationId" = target_org
      AND "userId" = app.current_user_id()
      AND "status" = 'ACTIVE'
  )
$$;

REVOKE ALL ON FUNCTION app.is_current_org_member(uuid) FROM PUBLIC;

-- Runtime roles are provisioned separately in Supabase so passwords never enter migrations.

DO $braincrew_rls$
DECLARE
  table_name text;
  tenant_tables text[] := ARRAY[
    'OrganizationBranding', 'Membership', 'ApiKey', 'Credential',
    'PluginInstallation', 'Agent', 'AgentVersion', 'AgentVersionPlugin',
    'Workflow', 'WorkflowVersion', 'WorkflowNode', 'WorkflowEdge',
    'WorkflowTrigger', 'Execution', 'ExecutionStep', 'ExecutionEvent',
    'UsageEvent', 'Subscription', 'AuditLog', 'OutboxEvent'
  ];
BEGIN
  FOREACH table_name IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (
        "organizationId" = app.current_organization_id()
        AND (app.is_worker() OR app.is_current_org_member("organizationId"))
      ) WITH CHECK (
        "organizationId" = app.current_organization_id()
        AND (app.is_worker() OR app.is_current_org_member("organizationId"))
      )',
      'tenant_isolation_' || lower(table_name), table_name
    );
  END LOOP;
END
$braincrew_rls$;

ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_organization ON "Organization"
FOR ALL USING (
  "id" = app.current_organization_id()
  AND (app.is_worker() OR app.is_current_org_member("id"))
)
WITH CHECK (
  "id" = app.current_organization_id()
  AND (app.is_worker() OR app.is_current_org_member("id"))
);

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
CREATE POLICY user_self_access ON "User"
FOR ALL USING (
  "id" = app.current_user_id() OR app.is_worker()
)
WITH CHECK (
  "id" = app.current_user_id() OR app.is_worker()
);

-- ExternalWebhookEvent remains available only to the privileged webhook/migration role.
ALTER TABLE "ExternalWebhookEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExternalWebhookEvent" FORCE ROW LEVEL SECURITY;

import { z } from "zod";

export const uuidSchema = z.uuid();

export const organizationRoleSchema = z.enum(["OWNER", "ADMIN", "BUILDER", "VIEWER"]);
export type OrganizationRole = z.infer<typeof organizationRoleSchema>;

export const agentStatusSchema = z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]);
export const versionStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const executionStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "WAITING_APPROVAL",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "TIMED_OUT",
]);

export const brandingSchema = z.object({
  logoUrl: z.url().nullable().optional(),
  faviconUrl: z.url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  customDomain: z.string().min(3).max(253).nullable().optional(),
  emailFromName: z.string().min(1).max(80).nullable().optional(),
});
export type BrandingInput = z.infer<typeof brandingSchema>;

export const modelParametersSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().max(131_072).optional(),
  reasoningEffort: z.enum(["low", "medium", "high"]).optional(),
});

export const agentCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  description: z.string().trim().max(400).optional(),
  systemPrompt: z.string().trim().min(10).max(50_000),
  modelDefinitionId: uuidSchema,
  modelParameters: modelParametersSchema.default({}),
  maxSteps: z.number().int().min(1).max(64).default(12),
  timeoutMs: z.number().int().min(5_000).max(3_600_000).default(300_000),
  pluginInstallationIds: z.array(uuidSchema).max(20).default([]),
});
export type AgentCreateInput = z.infer<typeof agentCreateSchema>;

export const agentVersionCreateSchema = agentCreateSchema
  .omit({ name: true, slug: true, description: true })
  .extend({ publish: z.boolean().default(false) });
export type AgentVersionCreateInput = z.infer<typeof agentVersionCreateSchema>;

export const workflowNodeSchema = z.object({
  key: z
    .string()
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
    .max(80),
  name: z.string().min(1).max(80),
  kind: z.enum([
    "START",
    "AGENT",
    "CONDITION",
    "PARALLEL",
    "JOIN",
    "HUMAN_APPROVAL",
    "DELAY",
    "END",
  ]),
  agentVersionId: uuidSchema.nullable().optional(),
  config: z.record(z.string(), z.unknown()).default({}),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
});

export const workflowEdgeSchema = z.object({
  sourceKey: z.string(),
  targetKey: z.string(),
  label: z.string().max(80).optional(),
  condition: z.record(z.string(), z.unknown()).nullable().optional(),
  priority: z.number().int().default(0),
});

export const workflowCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  description: z.string().trim().max(400).optional(),
  nodes: z.array(workflowNodeSchema).min(2).max(100),
  edges: z.array(workflowEdgeSchema).min(1).max(300),
  publish: z.boolean().default(false),
});
export type WorkflowCreateInput = z.infer<typeof workflowCreateSchema>;

export const executionCreateSchema = z
  .object({
    kind: z.enum(["AGENT", "WORKFLOW"]),
    agentVersionId: uuidSchema.optional(),
    workflowVersionId: uuidSchema.optional(),
    input: z.record(z.string(), z.unknown()).default({}),
    idempotencyKey: z.string().min(8).max(200).optional(),
  })
  .superRefine((value, context) => {
    const validAgent = value.kind === "AGENT" && value.agentVersionId && !value.workflowVersionId;
    const validWorkflow =
      value.kind === "WORKFLOW" && value.workflowVersionId && !value.agentVersionId;
    if (!validAgent && !validWorkflow) {
      context.addIssue({
        code: "custom",
        message: "Exactly one target matching the execution kind is required.",
      });
    }
  });
export type ExecutionCreateInput = z.infer<typeof executionCreateSchema>;

export const executionJobSchema = z.object({
  executionId: uuidSchema,
  organizationId: uuidSchema,
});
export type ExecutionJob = z.infer<typeof executionJobSchema>;

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const executionQueueName = "braincrew-executions";

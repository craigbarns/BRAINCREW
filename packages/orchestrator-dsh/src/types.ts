import { z } from "zod";

export const runtimePluginSchema = z.object({
  key: z.string(),
  version: z.string(),
  packageName: z.string(),
  config: z.record(z.string(), z.unknown()).default({}),
  permissions: z.record(z.string(), z.unknown()).default({}),
});

export const runtimeRequestSchema = z.object({
  executionId: z.uuid(),
  organizationId: z.uuid(),
  systemPrompt: z.string().min(1),
  userInput: z.unknown(),
  provider: z.string(),
  model: z.string(),
  modelParameters: z.record(z.string(), z.unknown()).default({}),
  maxSteps: z.number().int().positive(),
  timeoutMs: z.number().int().positive(),
  plugins: z.array(runtimePluginSchema).default([]),
});

export type RuntimePlugin = z.infer<typeof runtimePluginSchema>;
export type RuntimeRequest = z.infer<typeof runtimeRequestSchema>;

export interface RuntimeEvent {
  type: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  message?: string;
  payload?: Record<string, unknown>;
}

export interface RuntimeResult {
  output: unknown;
  sessionId?: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface AgentRuntime {
  execute(
    request: RuntimeRequest,
    emit: (event: RuntimeEvent) => Promise<void> | void,
  ): Promise<RuntimeResult>;
}

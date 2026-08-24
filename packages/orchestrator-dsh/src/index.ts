export * from "./types.js";
export * from "./mock-runtime.js";
export * from "./process-runtime.js";

import { MockAgentRuntime } from "./mock-runtime.js";
import { DshProcessRuntime } from "./process-runtime.js";
import type { AgentRuntime } from "./types.js";

export function createAgentRuntime(mode = process.env.DSH_EXECUTION_MODE): AgentRuntime {
  return mode === "process" ? new DshProcessRuntime() : new MockAgentRuntime();
}

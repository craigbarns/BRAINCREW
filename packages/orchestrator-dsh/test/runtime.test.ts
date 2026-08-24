import { describe, expect, it, vi } from "vitest";
import { MockAgentRuntime } from "../src/mock-runtime.js";

describe("MockAgentRuntime", () => {
  it("returns a traceable deterministic result", async () => {
    const emit = vi.fn();
    const runtime = new MockAgentRuntime();
    const result = await runtime.execute(
      {
        executionId: "00000000-0000-4000-8000-000000000001",
        organizationId: "00000000-0000-4000-8000-000000000010",
        systemPrompt: "Analyse le marché.",
        userInput: { subject: "Agents IA" },
        provider: "deepseek-official",
        model: "deepseek-chat",
        modelParameters: {},
        maxSteps: 12,
        timeoutMs: 30_000,
        plugins: [],
      },
      emit,
    );

    expect(result.outputTokens).toBeGreaterThan(0);
    expect(result.sessionId).toContain("mock-");
    expect(emit).toHaveBeenCalledTimes(2);
  });
});

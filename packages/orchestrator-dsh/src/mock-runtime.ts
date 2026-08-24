import type { AgentRuntime, RuntimeRequest, RuntimeResult } from "./types.js";

function estimateTokens(value: string): number {
  return Math.max(1, Math.ceil(value.length / 4));
}

export class MockAgentRuntime implements AgentRuntime {
  async execute(
    request: RuntimeRequest,
    emit: Parameters<AgentRuntime["execute"]>[1],
  ): Promise<RuntimeResult> {
    await emit({
      type: "runtime.started",
      level: "INFO",
      message: `Agent démarré avec ${request.model}`,
    });

    for (const plugin of request.plugins) {
      await emit({
        type: "plugin.mounted",
        level: "DEBUG",
        message: `${plugin.key}@${plugin.version}`,
      });
    }

    const input = JSON.stringify(request.userInput);
    const output = {
      summary:
        "Exécution de démonstration réussie. Branchez DEEPSEEK_API_KEY et DSH_EXECUTION_MODE=process pour utiliser le runtime réel.",
      received: request.userInput,
      model: request.model,
      capabilities: request.plugins.map((plugin) => plugin.key),
    };

    await emit({
      type: "runtime.completed",
      level: "INFO",
      message: "Résultat produit par le runtime de démonstration",
    });

    return {
      output,
      sessionId: `mock-${request.executionId}`,
      inputTokens: estimateTokens(request.systemPrompt + input),
      outputTokens: estimateTokens(JSON.stringify(output)),
      cost: 0,
    };
  }
}

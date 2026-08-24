import { describe, expect, it } from "vitest";
import { buildDshPatch } from "../src/process-runtime.js";

describe("DSH process isolation patch", () => {
  it("disables host tools and mounts only approved Braincrew plugins", () => {
    const patch = buildDshPatch({
      executionId: "00000000-0000-4000-8000-000000000070",
      organizationId: "00000000-0000-4000-8000-000000000010",
      systemPrompt: "Tu es un agent métier strictement limité.",
      userInput: {},
      provider: "deepseek-official",
      model: "deepseek-chat",
      modelParameters: {},
      maxSteps: 12,
      timeoutMs: 30_000,
      plugins: [
        {
          key: "web-access",
          version: "1.0.0",
          packageName: "@braincrew/plugin-web-access",
          config: { allowedDomains: ["example.com"] },
          permissions: {},
        },
      ],
    }) as Array<{ id: string; disabled?: boolean; name?: string; config?: unknown }>;

    expect(patch).toContainEqual({
      id: "llm-pi-ai",
      config: { providers: { openai: { apiKeyEnv: "OPENAI_API_KEY" } } },
    });
    expect(patch).toContainEqual(expect.objectContaining({ id: "tool-bash", disabled: true }));
    expect(patch).toContainEqual(
      expect.objectContaining({
        insert: expect.arrayContaining([
          expect.objectContaining({ id: "braincrew-plugin-0-web-access" }),
        ]),
      }),
    );
  });

  it("rejects packages outside the server allow-list", () => {
    expect(() =>
      buildDshPatch({
        executionId: "00000000-0000-4000-8000-000000000070",
        organizationId: "00000000-0000-4000-8000-000000000010",
        systemPrompt: "Tu es un agent métier strictement limité.",
        userInput: {},
        provider: "deepseek-official",
        model: "deepseek-chat",
        modelParameters: {},
        maxSteps: 12,
        timeoutMs: 30_000,
        plugins: [
          { key: "bad", version: "1", packageName: "malicious", config: {}, permissions: {} },
        ],
      }),
    ).toThrow("not approved");
  });
});

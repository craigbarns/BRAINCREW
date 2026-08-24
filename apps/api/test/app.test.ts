import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { apiConfigSchema } from "../src/config.js";
import { NoopExecutionDispatcher } from "../src/dispatcher.js";
import { MemoryBraincrewStore } from "../src/memory-store.js";

const config = apiConfigSchema.parse({
  NODE_ENV: "test",
  AUTH_BYPASS: "true",
  AUTH_BYPASS_USER_ID: "00000000-0000-4000-8000-000000000001",
  AUTH_BYPASS_ORGANIZATION_ID: "00000000-0000-4000-8000-000000000010",
});

describe("Braincrew API", () => {
  it("reports health", async () => {
    const app = await buildApp({
      config,
      store: new MemoryBraincrewStore(),
      dispatcher: new NoopExecutionDispatcher(),
    });
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok" });
    await app.close();
  });

  it("lists demo agents in authenticated bypass mode", async () => {
    const app = await buildApp({
      config,
      store: new MemoryBraincrewStore(),
      dispatcher: new NoopExecutionDispatcher(),
    });
    const response = await app.inject({ method: "GET", url: "/v1/agents" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(2);
    await app.close();
  });

  it("creates an agent, a multi-agent workflow and queues an execution", async () => {
    const app = await buildApp({
      config,
      store: new MemoryBraincrewStore(),
      dispatcher: new NoopExecutionDispatcher(),
    });

    const agent = await app.inject({
      method: "POST",
      url: "/v1/agents",
      payload: {
        name: "Agent de test",
        slug: "agent-de-test",
        systemPrompt: "Tu exécutes une mission de test de manière rigoureuse.",
        modelDefinitionId: "00000000-0000-4000-8000-000000000020",
        pluginInstallationIds: ["00000000-0000-4000-8000-000000000040"],
      },
    });
    expect(agent.statusCode).toBe(201);

    const workflow = await app.inject({
      method: "POST",
      url: "/v1/workflows",
      payload: {
        name: "Escouade test",
        slug: "escouade-test",
        publish: true,
        nodes: [
          { key: "start", name: "Départ", kind: "START" },
          {
            key: "agent",
            name: "Agent",
            kind: "AGENT",
            agentVersionId: "00000000-0000-4000-8000-000000000051",
          },
          { key: "end", name: "Fin", kind: "END" },
        ],
        edges: [
          { sourceKey: "start", targetKey: "agent" },
          { sourceKey: "agent", targetKey: "end" },
        ],
      },
    });
    expect(workflow.statusCode).toBe(201);

    const execution = await app.inject({
      method: "POST",
      url: "/v1/executions",
      payload: {
        kind: "AGENT",
        agentVersionId: "00000000-0000-4000-8000-000000000051",
        input: { subject: "test" },
      },
    });
    expect(execution.statusCode).toBe(202);
    expect(execution.json()).toMatchObject({ status: "QUEUED", kind: "AGENT" });
    await app.close();
  });
});

import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AgentRuntime, RuntimeRequest, RuntimeResult } from "./types.js";

export interface DshProcessRuntimeOptions {
  binary?: string;
}

const require = createRequire(import.meta.url);
const pluginEntrypoints: Record<string, string> = {
  "@braincrew/plugin-web-access": require.resolve("@braincrew/plugin-web-access"),
  "@braincrew/plugin-gmail": require.resolve("@braincrew/plugin-gmail"),
  "@braincrew/plugin-crm": require.resolve("@braincrew/plugin-crm"),
};

const disabledToolIds = [
  "tool-bash",
  "tool-pwsh",
  "tool-jobs",
  "tool-fs",
  "tool-fs-search",
  "tool-skill",
  "tool-goal",
  "tool-subagent-control",
  "tool-subagent-list-agents",
  "tool-subagent",
  "tool-subagent-fork",
  "tool-workflow",
  "tool-ralph",
  "tool-str-replace-editor",
  "tool-todo",
  "tool-web",
];

export function buildDshPatch(request: RuntimeRequest): unknown[] {
  const pluginRows = request.plugins.map((plugin, index) => {
    const entrypoint = pluginEntrypoints[plugin.packageName];
    if (!entrypoint) throw new Error(`Plugin package is not approved: ${plugin.packageName}`);
    return {
      id: `braincrew-plugin-${index}-${plugin.key}`,
      name: entrypoint,
      config: plugin.config,
    };
  });

  return [
    {
      id: "agent-default-model",
      config: { provider: request.provider, model: request.model },
    },
    {
      id: "system-prompt",
      config: { persona: request.systemPrompt },
    },
    ...disabledToolIds.map((id) => ({ id, disabled: true })),
    ...(pluginRows.length > 0 ? [{ insert: pluginRows }] : []),
  ];
}

export class DshProcessRuntime implements AgentRuntime {
  constructor(private readonly options: DshProcessRuntimeOptions = {}) {}

  async execute(
    request: RuntimeRequest,
    emit: Parameters<AgentRuntime["execute"]>[1],
  ): Promise<RuntimeResult> {
    const runtimeHome = join(tmpdir(), "braincrew-dsh", request.organizationId);
    const runDirectory = join(runtimeHome, "runs", request.executionId);
    const patchPath = join(runDirectory, "braincrew.patch.json");
    await mkdir(runDirectory, { recursive: true, mode: 0o700 });
    await writeFile(patchPath, JSON.stringify(buildDshPatch(request)), {
      encoding: "utf8",
      mode: 0o600,
    });

    const prompt = [
      "Exécute la mission métier avec les seules capacités autorisées.",
      "Entrée:",
      JSON.stringify(request.userInput),
    ].join("\n");

    await emit({ type: "dsh.started", level: "INFO", message: "Runtime DSH isolé démarré" });

    const configuredBinary = this.options.binary ?? process.env.DSH_BIN;
    const dshEntrypoint = require.resolve("@deepseek-ai/dsh/lib/bin.js");
    const executable = configuredBinary ?? process.execPath;
    const arguments_ = configuredBinary
      ? ["--profile", "headless", "--patch", patchPath, prompt]
      : [dshEntrypoint, "--profile", "headless", "--patch", patchPath, prompt];
    const child = spawn(executable, arguments_, {
      cwd: runDirectory,
      env: {
        ...process.env,
        DSH_HOME: runtimeHome,
        DSH_CWD: runDirectory,
        DSH_PERMISSION_MODE: "read-only",
        DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ?? "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    let exitCode: number;
    try {
      exitCode = await new Promise<number>((resolve, reject) => {
        const timeout = setTimeout(() => {
          child.kill("SIGTERM");
          reject(new Error(`DSH execution timed out after ${request.timeoutMs}ms`));
        }, request.timeoutMs);

        child.once("error", (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        child.once("close", (code) => {
          clearTimeout(timeout);
          resolve(code ?? 1);
        });
      });
    } finally {
      await rm(runDirectory, { recursive: true, force: true });
    }

    if (exitCode !== 0) {
      await emit({ type: "dsh.failed", level: "ERROR", message: stderr.slice(-2_000) });
      throw new Error(`DSH exited with code ${exitCode}: ${stderr.slice(-1_000)}`);
    }

    await emit({ type: "dsh.completed", level: "INFO", message: "Runtime DSH terminé" });
    return {
      output: { text: stdout.trim() },
      sessionId: request.executionId,
      inputTokens: Math.max(1, Math.ceil((request.systemPrompt.length + prompt.length) / 4)),
      outputTokens: Math.max(1, Math.ceil(stdout.length / 4)),
      cost: 0,
    };
  }
}

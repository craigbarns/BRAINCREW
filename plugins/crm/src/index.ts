import type { Context } from "@deepseek-ai/cordis";
import { defineTool } from "@deepseek-ai/dsh-tools";

export const name = "braincrew-crm";
export const inject = ["tools"];

export interface Config {
  baseUrl: string;
  accessToken: string;
  allowedPaths?: string[];
}

export function apply(ctx: Context, config: Config) {
  const base = new URL(config.baseUrl);
  if (base.protocol !== "https:") throw new Error("CRM baseUrl must use HTTPS");
  const allowedPaths = config.allowedPaths ?? ["/contacts/upsert"];

  ctx.tools.register(
    defineTool({
      name: "braincrew_crm_upsert_contact",
      description: "Create or update a contact through the approved CRM connector.",
      parameters: {
        email: { type: "string", required: true },
        firstName: { type: "string" },
        lastName: { type: "string" },
        company: { type: "string" },
      },
      output: {
        schema: { type: "object", additionalProperties: true, properties: {} },
        render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }],
      },
      timeoutMs: 20_000,
      async execute(args, exec) {
        const path = "/contacts/upsert";
        if (!allowedPaths.includes(path)) throw new Error("CRM operation is not allowed");
        const response = await fetch(new URL(path, base), {
          method: "POST",
          signal: exec.signal,
          headers: {
            authorization: `Bearer ${config.accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(args),
        });
        if (!response.ok) throw new Error(`CRM API returned ${response.status}`);
        return response.json();
      },
    }),
  );
}

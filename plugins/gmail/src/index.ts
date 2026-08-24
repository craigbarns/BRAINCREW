import type { Context } from "@deepseek-ai/cordis";
import { defineTool } from "@deepseek-ai/dsh-tools";

export const name = "braincrew-gmail";
export const inject = ["tools"];

export interface Config {
  accessToken: string;
  userId?: string;
}

async function gmailRequest(path: string, accessToken: string, signal: AbortSignal) {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    signal,
  });
  if (!response.ok) throw new Error(`Gmail API returned ${response.status}`);
  return response.json();
}

export function apply(ctx: Context, config: Config) {
  if (!config.accessToken) throw new Error("braincrew-gmail requires an OAuth access token");
  const userId = encodeURIComponent(config.userId ?? "me");

  ctx.tools.register(
    defineTool({
      name: "braincrew_gmail_search",
      description: "Search email identifiers in the connected Gmail mailbox.",
      parameters: {
        query: { type: "string", required: true },
        maxResults: { type: "integer" },
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: true,
          properties: {},
        },
        render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }],
      },
      timeoutMs: 20_000,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const search = new URLSearchParams({
          q: args.query,
          maxResults: String(Math.min(Math.max(args.maxResults ?? 20, 1), 100)),
        });
        return gmailRequest(`/users/${userId}/messages?${search}`, config.accessToken, exec.signal);
      },
    }),
  );
}

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { Context } from "@deepseek-ai/cordis";
import { defineTool } from "@deepseek-ai/dsh-tools";

export const name = "braincrew-web-access";
export const inject = ["tools"];

export interface Config {
  allowedDomains?: string[];
  maxCharacters?: number;
  timeoutMs?: number;
}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a = 0, b = 0] = address.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    );
  }
  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

export async function assertSafePublicUrl(rawUrl: string, allowedDomains: string[] = []) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error("Only HTTPS URLs are allowed");
  if (url.username || url.password) throw new Error("Credentialed URLs are not allowed");
  if (
    allowedDomains.length > 0 &&
    !allowedDomains.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`))
  ) {
    throw new Error(`Domain ${url.hostname} is not allowed`);
  }
  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private and link-local network addresses are blocked");
  }
  return url;
}

export function apply(ctx: Context, config: Config = {}) {
  const maxCharacters = Math.max(1_000, Math.min(config.maxCharacters ?? 50_000, 200_000));
  const timeoutMs = Math.max(1_000, Math.min(config.timeoutMs ?? 20_000, 60_000));

  ctx.tools.register(
    defineTool({
      name: "braincrew_read_url",
      description: "Read a public HTTPS page after SSRF and tenant allow-list checks.",
      parameters: {
        url: { type: "string", required: true, description: "Public HTTPS URL to read" },
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            url: { type: "string", required: true },
            status: { type: "integer", required: true },
            content: { type: "string", required: true },
            truncated: { type: "boolean", required: true },
          },
        },
        render: (_args, value) => [{ type: "text", text: value.content }],
      },
      timeoutMs,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const url = await assertSafePublicUrl(args.url, config.allowedDomains);
        const response = await fetch(url, {
          signal: AbortSignal.any([exec.signal, AbortSignal.timeout(timeoutMs)]),
          headers: { "user-agent": "Braincrew/1.0 (+https://braincrew.ai)" },
          redirect: "error",
        });
        const raw = await response.text();
        return {
          url: url.toString(),
          status: response.status,
          content: raw.slice(0, maxCharacters),
          truncated: raw.length > maxCharacters,
        };
      },
    }),
  );
}

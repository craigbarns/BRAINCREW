import pino, { type LoggerOptions } from "pino";

export function createLogger(name: string, options: LoggerOptions = {}) {
  return pino({
    name,
    level: process.env.LOG_LEVEL ?? "info",
    redact: {
      paths: [
        "req.headers.authorization",
        "*.accessToken",
        "*.refreshToken",
        "*.apiKey",
        "*.secret",
        "*.encryptedPayload",
      ],
      censor: "[REDACTED]",
    },
    ...options,
  });
}

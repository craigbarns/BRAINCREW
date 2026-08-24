import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

export const apiConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: optionalUrl,
  WEBHOOK_DATABASE_URL: optionalUrl,
  REDIS_URL: optionalUrl,
  SUPABASE_URL: optionalUrl,
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  AUTH_BYPASS: z.stringbool().default(false),
  AUTH_BYPASS_USER_ID: z.uuid().default("00000000-0000-4000-8000-000000000001"),
  AUTH_BYPASS_ORGANIZATION_ID: z.uuid().default("00000000-0000-4000-8000-000000000010"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().url().default("http://localhost:3000/settings?billing=success"),
  STRIPE_CANCEL_URL: z.string().url().default("http://localhost:3000/settings?billing=cancelled"),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;

export function loadApiConfig(environment = process.env): ApiConfig {
  return apiConfigSchema.parse(environment);
}

import { defineRailway, github, preserve, project, redis, service } from "railway/iac";

const region = "europe-west4-drams3a";
const repository = "craigbarns/BRAINCREW";

export default defineRailway(() => {
  const queue = redis("redis", { region });

  const api = service("api", {
    source: github(repository),
    build: "pnpm turbo run build --filter=@braincrew/api",
    preDeploy:
      'if [ -n "$DIRECT_URL" ]; then pnpm db:deploy; else echo "DIRECT_URL unset, skipping migrations"; fi',
    start: "pnpm --filter @braincrew/api start",
    healthcheck: "/health",
    healthcheckTimeout: 120,
    replicas: { [region]: 1 },
    deploy: {
      restartPolicyType: "ON_FAILURE",
      restartPolicyMaxRetries: 5,
    },
    env: {
      NODE_ENV: "production",
      AUTH_BYPASS: "false",
      WEB_ORIGIN: "https://braincrew-production-c6e7.up.railway.app,https://braincrew.ai",
      DATABASE_URL: preserve(),
      DIRECT_URL: preserve(),
      WEBHOOK_DATABASE_URL: preserve(),
      REDIS_URL: queue.env.REDIS_URL,
      SUPABASE_URL: preserve(),
      SUPABASE_PUBLISHABLE_KEY: preserve(),
      SUPABASE_SERVICE_ROLE_KEY: preserve(),
      STRIPE_SECRET_KEY: preserve(),
      STRIPE_WEBHOOK_SECRET: preserve(),
      STRIPE_PRICE_ID: preserve(),
      STRIPE_SUCCESS_URL: "https://braincrew-production-c6e7.up.railway.app/settings?billing=success",
      STRIPE_CANCEL_URL: "https://braincrew-production-c6e7.up.railway.app/settings?billing=cancelled",
    },
  });

  const web = service("BRAINCREW", {
    source: github(repository),
    build: "pnpm turbo run build --filter=@braincrew/web",
    start: "pnpm --filter @braincrew/web start",
    healthcheck: "/dashboard",
    healthcheckTimeout: 120,
    replicas: { [region]: 1 },
    deploy: {
      restartPolicyType: "ON_FAILURE",
      restartPolicyMaxRetries: 3,
    },
    env: {
      NODE_ENV: "production",
      NEXT_PUBLIC_API_URL: "https://api-production-720e.up.railway.app",
      NEXT_PUBLIC_SUPABASE_URL: preserve(),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: preserve(),
    },
  });

  const worker = service("worker", {
    source: github(repository),
    build: "pnpm turbo run build --filter=@braincrew/worker",
    start: "pnpm --filter @braincrew/worker start",
    replicas: { [region]: 1 },
    deploy: {
      restartPolicyType: "ON_FAILURE",
      restartPolicyMaxRetries: 10,
    },
    env: {
      NODE_ENV: "production",
      DATABASE_URL: preserve(),
      REDIS_URL: queue.env.REDIS_URL,
      DSH_EXECUTION_MODE: "process",
      DEEPSEEK_API_KEY: preserve(),
      ENCRYPTION_MASTER_KEY: preserve(),
      WORKER_CONCURRENCY: "4",
    },
  });

  return project("braincrew", { resources: [queue, web, api, worker] });
});

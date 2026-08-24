import { resolveIdentity } from "@braincrew/auth";
import {
  agentCreateSchema,
  brandingSchema,
  executionCreateSchema,
  uuidSchema,
  workflowCreateSchema,
} from "@braincrew/contracts";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyInstance } from "fastify";
import rawBody from "fastify-raw-body";
import type { ApiConfig } from "./config.js";
import { DisabledBillingService, type BillingService } from "./billing.js";
import type { ExecutionDispatcher } from "./dispatcher.js";
import type { BraincrewStore } from "./store.js";
import "./types.js";

export interface BuildAppOptions {
  config: ApiConfig;
  store: BraincrewStore;
  dispatcher: ExecutionDispatcher;
  billing?: BillingService;
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" } });

  await app.register(cors, { origin: options.config.WEB_ORIGIN, credentials: true });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, { max: 200, timeWindow: "1 minute" });
  await app.register(swagger, {
    openapi: {
      info: { title: "Braincrew API", version: "0.1.0" },
      servers: [{ url: "http://localhost:4000" }],
    },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });
  await app.register(rawBody, { global: false, field: "rawBody", encoding: false, runFirst: true });
  const billing = options.billing ?? new DisabledBillingService();

  app.setErrorHandler((error, _request, reply) => {
    const candidate = error as {
      statusCode?: number;
      issues?: unknown;
      name?: string;
      message?: string;
    };
    const statusCode = candidate.statusCode ?? (candidate.issues ? 400 : 500);
    if (statusCode >= 500) app.log.error(error);
    return reply.status(statusCode).send({
      error: {
        code: candidate.name || "INTERNAL_ERROR",
        message:
          statusCode >= 500
            ? "Une erreur interne est survenue."
            : candidate.message || "Requête invalide.",
        ...(candidate.issues ? { details: candidate.issues } : {}),
      },
    });
  });

  app.addHook("onClose", async () => options.dispatcher.close());

  app.get("/health", async () => ({ status: "ok", service: "braincrew-api" }));
  app.post("/v1/webhooks/stripe", { config: { rawBody: true } }, async (request, reply) => {
    const signature = request.headers["stripe-signature"];
    if (typeof signature !== "string" || !request.rawBody) {
      return reply.status(400).send({
        error: { code: "INVALID_WEBHOOK", message: "Signature Stripe manquante." },
      });
    }
    await billing.processWebhook(request.rawBody, signature);
    return reply.status(200).send({ received: true });
  });

  app.register(async (secured) => {
    secured.addHook("preHandler", async (request) => {
      const identity = await resolveIdentity({
        ...(request.headers.authorization ? { authorization: request.headers.authorization } : {}),
        ...(options.config.SUPABASE_URL ? { supabaseUrl: options.config.SUPABASE_URL } : {}),
        ...(options.config.SUPABASE_PUBLISHABLE_KEY
          ? { supabasePublishableKey: options.config.SUPABASE_PUBLISHABLE_KEY }
          : {}),
        bypass: options.config.AUTH_BYPASS,
        bypassUserId: options.config.AUTH_BYPASS_USER_ID,
      });
      const headerOrganization = request.headers["x-organization-id"];
      const organizationId = uuidSchema.parse(
        typeof headerOrganization === "string"
          ? headerOrganization
          : options.config.AUTH_BYPASS_ORGANIZATION_ID,
      );
      request.braincrew = { ...identity, organizationId };
    });

    secured.get("/v1/organization", async (request) =>
      options.store.getOrganization(request.braincrew),
    );
    secured.patch("/v1/organization/branding", async (request) =>
      options.store.updateBranding(request.braincrew, brandingSchema.parse(request.body)),
    );
    secured.get("/v1/overview", async (request) => options.store.getOverview(request.braincrew));
    secured.get("/v1/models", async (request) => options.store.listModels(request.braincrew));
    secured.get("/v1/plugins", async (request) => options.store.listPlugins(request.braincrew));
    secured.post("/v1/billing/checkout", async (request) =>
      billing.createCheckout(request.braincrew),
    );
    secured.post("/v1/billing/portal", async (request) => billing.createPortal(request.braincrew));
    secured.get("/v1/agents", async (request) => options.store.listAgents(request.braincrew));
    secured.post("/v1/agents", async (request, reply) => {
      const agent = await options.store.createAgent(
        request.braincrew,
        agentCreateSchema.parse(request.body),
      );
      return reply.status(201).send(agent);
    });
    secured.get("/v1/workflows", async (request) => options.store.listWorkflows(request.braincrew));
    secured.post("/v1/workflows", async (request, reply) => {
      const workflow = await options.store.createWorkflow(
        request.braincrew,
        workflowCreateSchema.parse(request.body),
      );
      return reply.status(201).send(workflow);
    });
    secured.get("/v1/executions", async (request) =>
      options.store.listExecutions(request.braincrew),
    );
    secured.post("/v1/executions", async (request, reply) => {
      const execution = await options.store.createExecution(
        request.braincrew,
        executionCreateSchema.parse(request.body),
      );
      await options.dispatcher.dispatch({
        executionId: execution.id,
        organizationId: request.braincrew.organizationId,
      });
      return reply.status(202).send(execution);
    });
    secured.get<{ Params: { executionId: string } }>(
      "/v1/executions/:executionId",
      async (request, reply) => {
        const execution = await options.store.getExecution(
          request.braincrew,
          uuidSchema.parse(request.params.executionId),
        );
        return (
          execution ??
          reply.status(404).send({ error: { code: "NOT_FOUND", message: "Execution inconnue" } })
        );
      },
    );
  });

  return app;
}

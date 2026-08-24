import "dotenv/config";
import { createPrismaClient, getPrismaClient } from "@braincrew/database";
import { buildApp } from "./app.js";
import { DisabledBillingService, StripeBillingService } from "./billing.js";
import { loadApiConfig } from "./config.js";
import { BullMqExecutionDispatcher, NoopExecutionDispatcher } from "./dispatcher.js";
import { MemoryBraincrewStore } from "./memory-store.js";
import { PrismaBraincrewStore } from "./store.js";

const config = loadApiConfig();
const store = config.DATABASE_URL
  ? new PrismaBraincrewStore(getPrismaClient())
  : new MemoryBraincrewStore();
const dispatcher = config.REDIS_URL
  ? new BullMqExecutionDispatcher(config.REDIS_URL)
  : new NoopExecutionDispatcher();
const appPrisma = config.DATABASE_URL ? getPrismaClient() : undefined;
const billing =
  appPrisma &&
  config.STRIPE_SECRET_KEY &&
  config.STRIPE_WEBHOOK_SECRET &&
  config.STRIPE_PRICE_ID &&
  config.WEBHOOK_DATABASE_URL
    ? new StripeBillingService({
        secretKey: config.STRIPE_SECRET_KEY,
        webhookSecret: config.STRIPE_WEBHOOK_SECRET,
        priceId: config.STRIPE_PRICE_ID,
        successUrl: config.STRIPE_SUCCESS_URL,
        cancelUrl: config.STRIPE_CANCEL_URL,
        appPrisma,
        webhookPrisma: createPrismaClient(config.WEBHOOK_DATABASE_URL),
      })
    : new DisabledBillingService();
const app = await buildApp({ config, store, dispatcher, billing });

await app.listen({ port: config.PORT, host: config.HOST });

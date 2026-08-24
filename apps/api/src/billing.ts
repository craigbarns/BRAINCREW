import {
  asJson,
  type BraincrewPrismaClient,
  type SubscriptionStatus,
  withTenant,
} from "@braincrew/database";
import Stripe from "stripe";
import type { RequestContext } from "./types.js";

export interface BillingService {
  createCheckout(context: RequestContext): Promise<{ url: string }>;
  createPortal(context: RequestContext): Promise<{ url: string }>;
  processWebhook(payload: string | Buffer, signature: string): Promise<void>;
}

export class BillingUnavailableError extends Error {
  readonly statusCode = 503;

  constructor() {
    super("Stripe n’est pas configuré sur cet environnement.");
    this.name = "BillingUnavailableError";
  }
}

export class DisabledBillingService implements BillingService {
  async createCheckout(): Promise<{ url: string }> {
    throw new BillingUnavailableError();
  }

  async createPortal(): Promise<{ url: string }> {
    throw new BillingUnavailableError();
  }

  async processWebhook(): Promise<void> {
    throw new BillingUnavailableError();
  }
}

export interface StripeBillingOptions {
  secretKey: string;
  webhookSecret: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  appPrisma: BraincrewPrismaClient;
  webhookPrisma: BraincrewPrismaClient;
}

export class StripeBillingService implements BillingService {
  private readonly stripe: Stripe;

  constructor(private readonly options: StripeBillingOptions) {
    this.stripe = new Stripe(options.secretKey);
  }

  async createCheckout(context: RequestContext): Promise<{ url: string }> {
    const organization = await withTenant(this.options.appPrisma, context, (tx) =>
      tx.organization.findUniqueOrThrow({
        where: { id: context.organizationId },
        include: { subscription: true },
      }),
    );

    let customerId = organization.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        name: organization.name,
        ...(context.email ? { email: context.email } : {}),
        metadata: { organizationId: organization.id },
      });
      customerId = customer.id;
      await withTenant(this.options.appPrisma, context, (tx) =>
        tx.subscription.create({
          data: {
            organizationId: organization.id,
            stripeCustomerId: customer.id,
            planKey: "starter",
          },
        }),
      );
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: this.options.priceId, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: organization.id,
      success_url: this.options.successUrl,
      cancel_url: this.options.cancelUrl,
      subscription_data: { metadata: { organizationId: organization.id } },
      metadata: { organizationId: organization.id },
    });

    if (!session.url) throw new Error("Stripe n’a pas retourné d’URL de paiement.");
    return { url: session.url };
  }

  async createPortal(context: RequestContext): Promise<{ url: string }> {
    const subscription = await withTenant(this.options.appPrisma, context, (tx) =>
      tx.subscription.findUnique({ where: { organizationId: context.organizationId } }),
    );
    if (!subscription) throw new Error("Aucun compte de facturation Stripe n’est associé.");

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: this.options.successUrl,
    });
    return { url: session.url };
  }

  async processWebhook(payload: string | Buffer, signature: string): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.options.webhookSecret,
    );
    const key = { provider_externalEventId: { provider: "stripe", externalEventId: event.id } };
    const existing = await this.options.webhookPrisma.externalWebhookEvent.findUnique({
      where: key,
    });
    if (existing?.status === "PROCESSED") return;

    await this.options.webhookPrisma.externalWebhookEvent.upsert({
      where: key,
      update: { payload: asJson(event) },
      create: {
        provider: "stripe",
        externalEventId: event.id,
        payload: asJson(event),
      },
    });

    try {
      if (
        event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated" ||
        event.type === "customer.subscription.deleted"
      ) {
        await this.synchronizeSubscription(event.data.object);
      }
      await this.options.webhookPrisma.externalWebhookEvent.update({
        where: key,
        data: { status: "PROCESSED", processedAt: new Date(), errorMessage: null },
      });
    } catch (error) {
      await this.options.webhookPrisma.externalWebhookEvent.update({
        where: key,
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  private async synchronizeSubscription(subscription: Stripe.Subscription): Promise<void> {
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const known = await this.options.webhookPrisma.subscription.findUnique({
      where: { stripeCustomerId: customerId },
    });
    const organizationId = subscription.metadata.organizationId || known?.organizationId;
    if (!organizationId) {
      throw new Error(`Stripe subscription ${subscription.id} has no Braincrew organizationId`);
    }

    const item = subscription.items.data[0];
    const status = stripeStatus(subscription.status);
    await this.options.webhookPrisma.subscription.upsert({
      where: { organizationId },
      update: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: item?.price.id ?? null,
        planKey: item?.price.lookup_key ?? "starter",
        status,
        seats: item?.quantity ?? 1,
        currentPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
        currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      create: {
        organizationId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: item?.price.id ?? null,
        planKey: item?.price.lookup_key ?? "starter",
        status,
        seats: item?.quantity ?? 1,
        currentPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
        currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }
}

function stripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const statuses: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: "ACTIVE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    incomplete_expired: "CANCELED",
    past_due: "PAST_DUE",
    paused: "PAUSED",
    trialing: "TRIALING",
    unpaid: "UNPAID",
  };
  return statuses[status];
}

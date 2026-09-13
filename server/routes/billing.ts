import { Router } from "express";
import Stripe from "stripe";
import { authenticate, type AuthenticatedRequest } from "../auth.js";
import { prisma } from "../db.js";
import { asyncHandler, getCompanyContextOrThrow } from "./helpers.js";

// Flat $12/month per company, whole crew included.
const DEFAULT_PRICE_ID = "price_1UF0CWGqAqGK5sfYZG3ecr05";

function getPriceId(): string {
  return process.env.STRIPE_PRICE_ID?.trim() || DEFAULT_PRICE_ID;
}

function getAppUrl(): string {
  const url = process.env.APP_URL?.trim();
  if (!url) {
    throw new Error("APP_URL is not set.");
  }
  return url.replace(/\/$/, "");
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  return new Stripe(key);
}

/** Subscription statuses that grant access to the app. */
const ACTIVE_STATUSES = new Set(["trialing", "active"]);

export function hasActiveSubscription(status: string | null | undefined): boolean {
  return !!status && ACTIVE_STATUSES.has(status);
}

const router = Router();

/**
 * Create a Stripe Checkout session for the $12/mo company plan.
 * ADMIN only. Reuses the company's Stripe customer when one exists.
 */
router.post(
  "/billing/checkout",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (req.auth!.role !== "ADMIN") {
      res.status(403).json({ error: "Only an admin can manage billing." });
      return;
    }

    const stripe = getStripe();
    const appUrl = getAppUrl();
    const { company } = await getCompanyContextOrThrow(req.auth!.companyId);

    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user!.email,
        name: company.companyName,
        metadata: { companyId: company.id },
      });
      customerId = customer.id;
      await prisma.company.update({
        where: { id: company.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: getPriceId(), quantity: 1 }],
      subscription_data: { metadata: { companyId: company.id } },
      success_url: `${appUrl}/?billing=success`,
      cancel_url: `${appUrl}/?billing=cancelled`,
      metadata: { companyId: company.id },
    });

    res.json({ url: session.url });
  }),
);

/**
 * Create a Stripe customer-portal session so an admin can update
 * payment details or cancel. ADMIN only.
 */
router.post(
  "/billing/portal",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (req.auth!.role !== "ADMIN") {
      res.status(403).json({ error: "Only an admin can manage billing." });
      return;
    }

    const stripe = getStripe();
    const appUrl = getAppUrl();
    const { company } = await getCompanyContextOrThrow(req.auth!.companyId);

    if (!company.stripeCustomerId) {
      res.status(409).json({ error: "No billing account yet. Subscribe first." });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: appUrl,
    });

    res.json({ url: session.url });
  }),
);

/** Current billing state for the caller's company. */
router.get(
  "/billing/status",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { company } = await getCompanyContextOrThrow(req.auth!.companyId);
    res.json({
      status: company.subscriptionStatus,
      trialEndsAt: company.subscriptionTrialEndsAt,
      hasCustomer: Boolean(company.stripeCustomerId),
      active: hasActiveSubscription(company.subscriptionStatus),
    });
  }),
);

async function applySubscriptionState(
  subscription: Stripe.Subscription,
  companyId: string | null,
) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const where = companyId
    ? { id: companyId }
    : { stripeCustomerId: customerId };

  const company = await prisma.company.findFirst({ where });
  if (!company) {
    console.warn(`[billing] webhook: no company for subscription ${subscription.id}`);
    return;
  }

  await prisma.company.update({
    where: { id: company.id },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionTrialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    },
  });
}

/**
 * Stripe webhook. Mounted with express.raw() in server/index.ts so the
 * signature can be verified. Never add express.json() before this route.
 */
router.post(
  "/stripe/webhook",
  asyncHandler(async (req, res) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret) {
      res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET is not set." });
      return;
    }

    const stripe = getStripe();
    const signature = req.header("stripe-signature");
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header." });
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, signature, secret);
    } catch (err) {
      console.warn("[billing] webhook signature verification failed:", (err as Error).message);
      res.status(400).json({ error: "Invalid signature." });
      return;
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const companyId =
            session.metadata?.companyId ?? subscription.metadata?.companyId ?? null;
          await applySubscriptionState(subscription, companyId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await applySubscriptionState(subscription, subscription.metadata?.companyId ?? null);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        const company = await prisma.company.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (company) {
          await prisma.company.update({
            where: { id: company.id },
            data: { subscriptionStatus: "canceled", stripeSubscriptionId: subscription.id },
          });
        }
        break;
      }
      default:
        break;
    }

    res.json({ received: true });
  }),
);

export { router as billingRouter };

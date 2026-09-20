import { Router } from "express";
import Stripe from "stripe";
import { authenticate, type AuthenticatedRequest } from "../auth.js";
import { prisma } from "../db.js";
import { companyHasPaidAccess } from "../billingAccess.js";
import { sendSubscriptionReceiptEmail } from "../email/subscriptionReceiptEmail.js";
import { asyncHandler, companyHasComplimentaryMember, getCompanyContextOrThrow } from "./helpers.js";

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
      active:
        (await companyHasComplimentaryMember(company.id)) ||
        companyHasPaidAccess(
          company.subscriptionStatus,
          company.subscriptionTrialEndsAt,
          req.user!.email,
        ),
    });
  }),
);

/**
 * Pull the company's latest Stripe subscription into the database.
 * Used after Checkout returns so access does not depend on the webhook alone.
 */
router.post(
  "/billing/sync",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const stripe = getStripe();
    const { company } = await getCompanyContextOrThrow(req.auth!.companyId);

    if (!company.stripeCustomerId) {
      res.json({
        status: company.subscriptionStatus,
        hasCustomer: false,
        active:
          (await companyHasComplimentaryMember(company.id)) ||
          companyHasPaidAccess(
            company.subscriptionStatus,
            company.subscriptionTrialEndsAt,
            req.user!.email,
          ),
      });
      return;
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: company.stripeCustomerId,
      status: "all",
      limit: 10,
    });
    const subscription =
      subscriptions.data.find((row) => hasActiveSubscription(row.status)) ??
      subscriptions.data[0] ??
      null;

    if (subscription) {
      await applySubscriptionState(subscription, company.id);
    }

    const status = subscription?.status ?? company.subscriptionStatus;
    const trialEndsAt = subscription?.trial_end
      ? new Date(subscription.trial_end * 1000)
      : company.subscriptionTrialEndsAt;
    res.json({
      status,
      hasCustomer: true,
      active:
        (await companyHasComplimentaryMember(company.id)) ||
        companyHasPaidAccess(status, trialEndsAt, req.user!.email),
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

  if (subscription.status === "active" && !company.subscriptionReceiptSentAt) {
    const admin = await prisma.user.findFirst({
      where: { companyId: company.id, role: "ADMIN", status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      select: { email: true, fullName: true },
    });
    if (admin?.email) {
      try {
        let appUrl = "https://app.myguystime.com";
        try {
          appUrl = getAppUrl();
        } catch {
          // Receipts should still send if APP_URL is missing in a webhook process.
        }
        const sent = await sendSubscriptionReceiptEmail({
          to: admin.email,
          companyName: company.companyName,
          subscriberName: admin.fullName,
          amountLabel: "$12.00 / month",
          subscriptionId: subscription.id,
          appUrl,
        });
        if (sent) {
          await prisma.company.update({
            where: { id: company.id },
            data: { subscriptionReceiptSentAt: new Date() },
          });
        }
      } catch (error) {
        console.warn("[billing:receipt] send threw:", (error as Error).message);
      }
    }
  }
}

/**
 * Stripe webhook. Mounted with express.raw() in server/index.ts so the
 * signature can be verified. Never add express.json() before this route.
 * /billing/webhook is the Vercel-reachable path (Hobby functions only
 * match one extra path segment unless a dedicated api/<prefix> file exists).
 */
router.post(
  ["/stripe/webhook", "/billing/webhook"],
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

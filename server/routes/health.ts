import { Router } from "express";
import { Sentry, sentryEnabled, sentryVerificationEnabled } from "../sentry.js";
import { authenticate, type AuthenticatedRequest } from "../auth.js";
import { asyncHandler, authorizeAdmin } from "./helpers.js";

const router = Router();

router.get("/health", asyncHandler(async (_req, res) => {
  res.json({ ok: true });
}));

router.post("/debug/sentry-test", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  if (!sentryVerificationEnabled) {
    res.status(404).json({ error: "Temporary Sentry verification route is disabled." });
    return;
  }

  if (!sentryEnabled) {
    res.status(409).json({ error: "Set SENTRY_DSN before using the backend Sentry verification route." });
    return;
  }

  const eventId = Sentry.captureException(
    new Error("Temporary Sentry backend verification event. Disable the verification route after confirming delivery."),
  );

  await Sentry.flush(2000);
  res.status(202).json({ ok: true, eventId: eventId ?? null });
}));

export { router as healthRouter };

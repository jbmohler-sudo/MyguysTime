import { assertNoTestEmailSideEffects } from "../envSafety.js";

export type InviteEmailDeliveryMode = "email" | "dev_link" | "test";

export interface InviteEmailPayload {
  to: string;
  inviteUrl: string;
  companyName?: string | null;
  invitedByName?: string | null;
  role: "EMPLOYEE" | "FOREMAN";
}

export interface InviteEmailResult {
  deliveryMode: InviteEmailDeliveryMode;
  providerMessageId?: string;
}

export const sentInviteEmailEvents: InviteEmailPayload[] = [];

export class InviteEmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InviteEmailConfigurationError";
  }
}

export class InviteEmailSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InviteEmailSendError";
  }
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getInviteEmailConfigStatus() {
  const provider = process.env.INVITE_EMAIL_PROVIDER?.trim().toLowerCase() || "";
  const from = process.env.INVITE_EMAIL_FROM?.trim() || "";
  const transport = process.env.INVITE_EMAIL_TRANSPORT?.trim().toLowerCase() || "";

  return {
    provider,
    hasProvider: Boolean(provider),
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY?.trim()),
    hasFrom: Boolean(from),
    from,
    transport,
    nodeEnv: process.env.NODE_ENV || "",
    fixtureEnv: process.env.MYGUYS_FIXTURE_ENV?.trim().toLowerCase() || "",
  };
}

function sanitizeFromAddress(value: string) {
  return value.replace(/[^\w\s@.+<>()-]/g, "").slice(0, 160);
}

function logInviteEmailDecision(
  decision: string,
  status = getInviteEmailConfigStatus(),
  extra?: Record<string, string | boolean>,
) {
  console.info("[invite:email-config]", {
    decision,
    provider: status.provider || "(missing)",
    hasResendApiKey: status.hasResendApiKey,
    hasFrom: status.hasFrom,
    from: status.from ? sanitizeFromAddress(status.from) : "(missing)",
    transport: status.transport || "(default)",
    nodeEnv: status.nodeEnv || "(unset)",
    fixtureEnv: status.fixtureEnv || "(unset)",
    ...extra,
  });
}

function getAppName(payload: InviteEmailPayload) {
  return payload.companyName?.trim() || "MyGuysTime";
}

function buildEmailBody(payload: InviteEmailPayload) {
  const appName = getAppName(payload);
  const inviter = payload.invitedByName?.trim();
  const roleLabel = payload.role === "FOREMAN" ? "foreman" : "worker";
  return [
    `You have been invited${inviter ? ` by ${inviter}` : ""} to join ${appName} as a ${roleLabel}.`,
    "",
    "Use this secure link to finish setting up your account:",
    payload.inviteUrl,
    "",
    "This link expires in 72 hours.",
  ].join("\n");
}

async function sendWithResend(payload: InviteEmailPayload): Promise<InviteEmailResult> {
  const status = getInviteEmailConfigStatus();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = status.from;

  if (!apiKey || !from) {
    logInviteEmailDecision("resend_config_missing", status);
    throw new InviteEmailConfigurationError(
      "Invite email is configured for Resend, but RESEND_API_KEY or INVITE_EMAIL_FROM is missing.",
    );
  }

  logInviteEmailDecision("resend_send_attempt", status);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: `You're invited to ${getAppName(payload)}`,
      text: buildEmailBody(payload),
    }),
  });

  const responseBody = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!response.ok) {
    logInviteEmailDecision("resend_send_rejected", status, {
      resendMessage: responseBody?.message ?? "(no message)",
    });
    throw new InviteEmailSendError(responseBody?.message ?? "Invite email provider rejected the send request.");
  }

  logInviteEmailDecision("resend_send_accepted", status, {
    providerMessageIdPresent: Boolean(responseBody?.id),
  });
  return { deliveryMode: "email", providerMessageId: responseBody?.id };
}

export async function sendInviteEmail(payload: InviteEmailPayload): Promise<InviteEmailResult> {
  assertNoTestEmailSideEffects();

  if (process.env.INVITE_EMAIL_TRANSPORT === "test") {
    logInviteEmailDecision("test_transport");
    sentInviteEmailEvents.push(payload);
    return { deliveryMode: "test", providerMessageId: `test-${sentInviteEmailEvents.length}` };
  }

  const status = getInviteEmailConfigStatus();
  const provider = status.provider;

  if (provider === "resend") {
    return sendWithResend(payload);
  }

  if (provider) {
    logInviteEmailDecision("unsupported_provider", status);
    throw new InviteEmailConfigurationError(`Unsupported invite email provider "${provider}".`);
  }

  if (isProduction()) {
    logInviteEmailDecision("production_provider_missing", status);
    throw new InviteEmailConfigurationError(
      "Invite email provider is not configured. Set INVITE_EMAIL_PROVIDER=resend, RESEND_API_KEY, and INVITE_EMAIL_FROM.",
    );
  }

  logInviteEmailDecision("dev_link_fallback", status);
  return { deliveryMode: "dev_link" };
}

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
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.INVITE_EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    throw new InviteEmailConfigurationError(
      "Invite email is configured for Resend, but RESEND_API_KEY or INVITE_EMAIL_FROM is missing.",
    );
  }

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
    throw new InviteEmailSendError(responseBody?.message ?? "Invite email provider rejected the send request.");
  }

  return { deliveryMode: "email", providerMessageId: responseBody?.id };
}

export async function sendInviteEmail(payload: InviteEmailPayload): Promise<InviteEmailResult> {
  if (process.env.INVITE_EMAIL_TRANSPORT === "test") {
    sentInviteEmailEvents.push(payload);
    return { deliveryMode: "test", providerMessageId: `test-${sentInviteEmailEvents.length}` };
  }

  const provider = process.env.INVITE_EMAIL_PROVIDER?.trim().toLowerCase();

  if (provider === "resend") {
    return sendWithResend(payload);
  }

  if (provider) {
    throw new InviteEmailConfigurationError(`Unsupported invite email provider "${provider}".`);
  }

  if (isProduction()) {
    throw new InviteEmailConfigurationError(
      "Invite email provider is not configured. Set INVITE_EMAIL_PROVIDER=resend, RESEND_API_KEY, and INVITE_EMAIL_FROM.",
    );
  }

  console.log(`[invite:dev-link] ${payload.to} -> ${payload.inviteUrl}`);
  return { deliveryMode: "dev_link" };
}

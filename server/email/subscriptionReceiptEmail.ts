import { assertNoTestEmailSideEffects } from "../envSafety.js";

export interface SubscriptionReceiptPayload {
  to: string;
  companyName: string;
  subscriberName?: string | null;
  amountLabel: string;
  subscriptionId: string;
  appUrl: string;
}

function getFromAddress() {
  return (
    process.env.RECEIPT_EMAIL_FROM?.trim() ||
    process.env.INVITE_EMAIL_FROM?.trim() ||
    ""
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildText(payload: SubscriptionReceiptPayload) {
  const name = payload.subscriberName?.trim();
  return [
    name ? `Hi ${name},` : "Hi,",
    "",
    `This is your receipt for MyGuysTime — $12/month flat for ${payload.companyName}.`,
    "",
    `Amount: ${payload.amountLabel}`,
    "Plan: Company subscription (whole crew included)",
    `Reference: ${payload.subscriptionId}`,
    "",
    `Open the app: ${payload.appUrl}`,
    "",
    "You can update payment details or cancel from Account → Billing.",
  ].join("\n");
}

function buildHtml(payload: SubscriptionReceiptPayload) {
  const name = payload.subscriberName?.trim();
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  const company = escapeHtml(payload.companyName);
  const amount = escapeHtml(payload.amountLabel);
  const reference = escapeHtml(payload.subscriptionId);
  const appUrl = escapeHtml(payload.appUrl);

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <div style="display:none;max-height:0;overflow:hidden;">
    Receipt for MyGuysTime — $12/month for ${company}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:28px 24px;">
          <tr>
            <td>
              <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;">Receipt</p>
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">MyGuysTime subscription</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">${greeting}</p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.5;">
                Payment received for <strong>${company}</strong>. This covers the whole company — every foreman, worker, and office user.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;margin:0 0 20px;">
                <tr>
                  <td style="padding:16px 18px;font-size:15px;line-height:1.6;">
                    <strong>Amount:</strong> ${amount}<br />
                    <strong>Plan:</strong> Company subscription<br />
                    <strong>Reference:</strong> ${reference}
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px;">
                <a href="${appUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:16px;font-weight:600;">
                  Open MyGuysTime
                </a>
              </p>
              <p style="margin:0;font-size:14px;line-height:1.5;color:#4b5563;">
                Update payment details or cancel from Account → Billing.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendSubscriptionReceiptEmail(
  payload: SubscriptionReceiptPayload,
): Promise<boolean> {
  assertNoTestEmailSideEffects();

  if (process.env.INVITE_EMAIL_TRANSPORT === "test") {
    return true;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getFromAddress();
  if (!apiKey || !from) {
    console.warn("[billing:receipt] skipped — RESEND_API_KEY or INVITE_EMAIL_FROM is not set.");
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `subscription-receipt/${payload.subscriptionId}`.slice(0, 256),
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: `Receipt for MyGuysTime — ${payload.companyName}`,
      text: buildText(payload),
      html: buildHtml(payload),
    }),
  });

  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  if (!response.ok) {
    console.warn("[billing:receipt] send failed:", body?.message ?? response.status);
    return false;
  }

  return true;
}

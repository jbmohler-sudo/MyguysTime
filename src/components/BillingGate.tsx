interface BillingGateProps {
  companyName: string;
  isAdmin: boolean;
  hasCustomer: boolean;
  status: string | null;
  busy: boolean;
  error: string | null;
  justSubscribed: boolean;
  onSubscribe: () => void;
  onManageBilling: () => void;
  onLogout: () => void;
}

function statusNote(status: string | null): string | null {
  if (status === "past_due") {
    return "Your last payment didn't go through. Update your payment method to keep the crew board running.";
  }
  if (status === "canceled") {
    return "Your subscription was canceled. Resubscribe to keep using MyGuysTime.";
  }
  if (status === "incomplete" || status === "incomplete_expired") {
    return "Your checkout didn't finish. Subscribe below to activate the company.";
  }
  return null;
}

export function BillingGate({
  companyName,
  isAdmin,
  hasCustomer,
  status,
  busy,
  error,
  justSubscribed,
  onSubscribe,
  onManageBilling,
  onLogout,
}: BillingGateProps) {
  const note = statusNote(status);

  return (
    <div className="loading-screen">
      <div className="panel compact-panel" style={{ maxWidth: "30rem", textAlign: "center" }}>
        <p className="eyebrow">Billing</p>
        <h2 style={{ marginTop: "0.25rem" }}>
          {justSubscribed ? "You're subscribed!" : `${companyName} needs a subscription`}
        </h2>
        {justSubscribed ? (
          <p style={{ marginTop: "0.75rem" }}>
            Payment confirmed — your crew board is unlocking. If it doesn't load in a few
            seconds, refresh the page.
          </p>
        ) : (
          <>
            <p style={{ marginTop: "0.75rem" }}>
              MyGuysTime is <strong>$12/month flat</strong> for the whole company — every
              foreman, worker, and office user included. No per-seat fees.
            </p>
            {note ? (
              <p className="error-banner" style={{ marginTop: "0.75rem" }}>
                {note}
              </p>
            ) : null}
            {isAdmin ? (
              <div
                className="adjustment-actions"
                style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.25rem", flexWrap: "wrap" }}
              >
                <button
                  className="button-strong"
                  type="button"
                  disabled={busy}
                  onClick={onSubscribe}
                >
                  {busy ? "Opening checkout..." : "Subscribe — $12/month"}
                </button>
                {hasCustomer ? (
                  <button
                    className="button"
                    type="button"
                    disabled={busy}
                    onClick={onManageBilling}
                  >
                    Manage billing
                  </button>
                ) : null}
              </div>
            ) : (
              <p style={{ marginTop: "1rem" }}>
                Ask your company admin to subscribe to keep using MyGuysTime.
              </p>
            )}
          </>
        )}
        {error ? (
          <p className="error-banner" style={{ marginTop: "0.75rem" }}>
            {error}
          </p>
        ) : null}
        <div style={{ marginTop: "1.5rem" }}>
          <button className="button" type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

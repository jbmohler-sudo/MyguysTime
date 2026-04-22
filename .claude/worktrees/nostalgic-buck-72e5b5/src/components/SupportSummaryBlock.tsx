interface SupportSummaryBlockProps {
  supportLevel: "full" | "partial_manual" | "unsupported";
  hasStateIncomeTax: boolean;
  hasExtraEmployeeWithholdings: boolean;
  supportedLines: string[];
  extraWithholdingLabel?: string;
  stateCode: string;
  stateName: string;
  stateDisclaimer: string;
  lastReviewedAt?: string | null;
  sourceLabel?: string;
  sourceUrl?: string;
  context?: "setup" | "settings";
}

function prettySupportLevel(level: SupportSummaryBlockProps["supportLevel"]) {
  if (level === "full") {
    return "Full";
  }
  if (level === "partial_manual") {
    return "Partial / Manual";
  }
  return "Unsupported";
}

function explainSupportLevel(level: SupportSummaryBlockProps["supportLevel"]) {
  if (level === "full") {
    return "The app can show federal and supported state payroll-prep estimates for this state.";
  }
  if (level === "partial_manual") {
    return "The app can help with time tracking and payroll prep, but some state-specific withholding details still need manual review.";
  }
  return "The app is still usable for time tracking and payroll prep, but state-specific withholding should be verified with your accountant or official state resources.";
}

function formatReviewedAt(value?: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function SupportSummaryBlock({
  supportLevel,
  hasStateIncomeTax,
  hasExtraEmployeeWithholdings,
  supportedLines,
  extraWithholdingLabel,
  stateCode,
  stateName,
  stateDisclaimer,
  lastReviewedAt,
  sourceLabel,
  sourceUrl,
  context = "settings",
}: SupportSummaryBlockProps) {
  const title = context === "setup" ? "Selected state support" : "Support summary";
  const stateWithholdingSupport = !hasStateIncomeTax
    ? "No state income tax withholding"
    : supportLevel === "full"
      ? "State withholding estimate supported"
      : supportLevel === "partial_manual"
        ? "State withholding requires manual review"
        : "State withholding not supported in-app";
  const extraWithholdingSupport = hasExtraEmployeeWithholdings
    ? extraWithholdingLabel || supportedLines.find((line) => line !== "Federal withholding estimate" && line !== "State withholding estimate")
    : "Manual extra withholding only";

  return (
    <section className="support-summary">
      <div className="support-summary__header">
        <div>
          <p className="eyebrow">State Support</p>
          <h3>{title}</h3>
        </div>
        <span className={`support-pill support-pill--${supportLevel}`}>
          {stateCode} - {stateName} - {prettySupportLevel(supportLevel)}
        </span>
      </div>

      <div className="support-summary__grid">
        <div>
          <span>Federal estimate support</span>
          <strong>Supported</strong>
        </div>
        <div>
          <span>State withholding support</span>
          <strong>{stateWithholdingSupport}</strong>
        </div>
        <div>
          <span>Extra withholding lines</span>
          <strong>{extraWithholdingSupport}</strong>
        </div>
        <div>
          <span>Support level</span>
          <strong>{prettySupportLevel(supportLevel)}</strong>
        </div>
        <div>
          <span>Last reviewed</span>
          <strong>{formatReviewedAt(lastReviewedAt)}</strong>
        </div>
        <div>
          <span>Source</span>
          <strong>{sourceLabel || "Internal review"}</strong>
        </div>
      </div>

      <p className="support-summary__explanation">{explainSupportLevel(supportLevel)}</p>

      {sourceUrl ? (
        <p className="support-summary__source">
          Source: <a href={sourceUrl} rel="noreferrer" target="_blank">{sourceUrl}</a>
        </p>
      ) : null}

      {stateDisclaimer ? <p className="support-summary__disclaimer">{stateDisclaimer}</p> : null}
    </section>
  );
}

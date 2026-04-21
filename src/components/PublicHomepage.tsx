import { useEffect } from "react";

interface PublicHomepageProps {
  appUrl: string;
}

const SOFTWARE_APPLICATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "My Guys Time",
  category: "BusinessApplication",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: "Contractor hour tracking and payroll-prep tool for small crews",
  url: "https://www.myguystime.com",
};

function ProductPreview() {
  return (
    <div className="homepage-shot" aria-label="My Guys Time product screenshot">
      <div className="homepage-shot__topbar">
        <div>
<div className="brand-logo">
  <span className="brand-logo__primary">My Guys</span>
  <span className="brand-logo__secondary">Time</span>
</div>          <h3>Weekly crew board</h3>
        </div>
        <span className="homepage-shot__badge">Payroll-prep ready</span>
      </div>
      <div className="homepage-shot__stats">
        <div>
          <span>Weeks to review</span>
          <strong>3</strong>
        </div>
        <div>
          <span>Net estimate</span>
          <strong>$4,982</strong>
        </div>
        <div>
          <span>Missing confirmations</span>
          <strong>2</strong>
        </div>
      </div>
      <div className="homepage-shot__board">
        <article className="homepage-shot__card">
          <div className="homepage-shot__card-header">
            <div>
              <strong>Luis Ortega</strong>
              <span>Masonry Crew</span>
            </div>
            <span className="pill pill--approved">Foreman Approved</span>
          </div>
          <div className="homepage-shot__days">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
              <div className={index === 2 ? "homepage-shot__day homepage-shot__day--today" : "homepage-shot__day"} key={day}>
                <strong>{day}</strong>
                <span>{index < 5 ? "7:00 - 3:30" : "--"}</span>
                <small>{index < 5 ? "7.5h" : "0h"}</small>
              </div>
            ))}
          </div>
          <div className="homepage-shot__footer">
            <span className="alert-chip alert-chip--ok">Adjusted</span>
            <strong>Net check estimate: $1,248</strong>
          </div>
        </article>

        <article className="homepage-shot__card homepage-shot__card--secondary">
          <div className="homepage-shot__card-header">
            <div>
              <strong>Office review</strong>
              <span>Checks, exports, and accountant handoff</span>
            </div>
          </div>
          <ul className="homepage-shot__list">
            <li>Payroll summary CSV</li>
            <li>Time detail CSV</li>
            <li>Reimbursements and deductions</li>
            <li>Private office-only reports</li>
          </ul>
        </article>
      </div>
    </div>
  );
}

export function PublicHomepage({ appUrl }: PublicHomepageProps) {
  useEffect(() => {
    document.title = "Contractor Hour Tracking App | My Guys Time";

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "Track crew hours, review the week, and export payroll-ready totals. Simple time tracking for contractors and small crews.",
    );

    const scriptId = "my-guys-time-schema";
    let schema = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!schema) {
      schema = document.createElement("script");
      schema.id = scriptId;
      schema.type = "application/ld+json";
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify(SOFTWARE_APPLICATION_SCHEMA);

    return () => {
      const schemaNode = document.getElementById(scriptId);
      if (schemaNode) {
        schemaNode.remove();
      }
    };
  }, []);

  return (
    <div className="marketing-shell">
      <header className="marketing-hero">
        <div className="marketing-hero__copy">
          <p className="eyebrow">My Guys Time</p>
          <h1>Track Crew Hours &amp; Prep Payroll in Seconds, Built for Contractors</h1>
          <p className="marketing-lead">
            My Guys Time is a simple contractor hour tracking app built for small crews. Track your
            guys&apos; hours, review the week, and export clean totals for your accountant.
          </p>
          <div className="marketing-actions">
            <a className="button-strong marketing-link-button" href={appUrl}>
              Start your week
            </a>
            <a className="marketing-link" href="#workflow">
              See how it works
            </a>
          </div>
          <p className="marketing-note">
            Contractor hour tracking app for roofing, masonry, landscaping, and other small crews
            that need simple construction payroll prep without full payroll software.
          </p>
        </div>
        <ProductPreview />
      </header>

      <main className="marketing-main">
        <section className="marketing-section marketing-section--bridge">
          <p className="eyebrow">Why crews use it</p>
          <h2>The bridge between the job site and your accountant</h2>
          <p>
            This is the missing middle. Not full payroll. Not a heavy office system. Just a clean
            way to check hours, review the week, and hand off payroll-ready totals.
          </p>
        </section>

        <section className="marketing-section" id="workflow">
          <p className="eyebrow">How It Works</p>
          <h2>Simple weekly workflow for crews and office</h2>
          <div className="marketing-steps">
            <article className="marketing-step">
              <span>Step 1</span>
              <h3>Enter hours in the truck</h3>
              <p>
                Fast, simple hour tracking for contractors in the field. Built for real job sites,
                not office desks.
              </p>
            </article>
            <article className="marketing-step">
              <span>Step 2</span>
              <h3>Review the week in the office</h3>
              <p>
                See your entire crew in one place. It works as a small crew timecard app with clear
                weekly status and day-by-day review.
              </p>
            </article>
            <article className="marketing-step">
              <span>Step 3</span>
              <h3>Adjust and finalize</h3>
              <p>
                Handle gas, petty cash, deductions, and mixed crews. It also works as a simple
                subcontractor 1099 tracker when you need clean weekly review.
              </p>
            </article>
            <article className="marketing-step">
              <span>Step 4</span>
              <h3>Export checks</h3>
              <p>
                Export timesheets to CSV for your accountant. No payroll system required, just
                verified labor hour logs and a practical weekly handoff.
              </p>
            </article>
          </div>
        </section>

        <section className="marketing-section">
          <p className="eyebrow">Why It&apos;s Different</p>
          <h2>Built for small crews, not generic SaaS workflows</h2>
          <div className="marketing-columns">
            <div className="marketing-card">
              <h3>Made for the way contractors actually work</h3>
              <p>
                Your foreman and your office do not need another bloated system. My Guys Time keeps
                the weekly flow direct, practical, and easy to trust.
              </p>
            </div>
            <div className="marketing-card">
              <h3>Payroll-prep positioning stays clear</h3>
              <p>
                You can run payroll prep, review deductions, and export totals without pretending
                this is a full compliance engine.
              </p>
            </div>
          </div>
        </section>

        <section className="marketing-section">
          <p className="eyebrow">Feature Snapshot</p>
          <h2>Small feature list, focused on weekly work</h2>
          <ul className="marketing-feature-list">
            <li>Contractor hour tracking app built for crews</li>
            <li>Simple construction payroll prep workflow</li>
            <li>Export timesheets to CSV for accountant handoff</li>
            <li>Verified labor hour logs for weekly review</li>
            <li>Small crew management for roughly 2 to 15 workers</li>
            <li>Subcontractor and W-2 tracking support in one weekly board</li>
          </ul>
        </section>

        <section className="marketing-section marketing-section--trust">
          <p className="eyebrow">Payroll Prep Reminder</p>
          <h2>Built for payroll preparation, not payroll processing</h2>
          <p>
            My Guys Time helps you track hours, review totals, and estimate pay and withholdings.
            Always verify numbers before issuing checks or finalizing payroll.
          </p>
        </section>
      </main>
    </div>
  );
}

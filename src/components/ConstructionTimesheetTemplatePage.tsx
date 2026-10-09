import { ArrowRight, Download } from "lucide-react";
import { APP_LOGIN_URL, MarketingBreadcrumb, MarketingFooter, MarketingHeader } from "./MarketingChrome";

export const PDF_HREF = "/templates/construction-timesheet-template.pdf";
export const XLSX_HREF = "/templates/construction-timesheet-template.xlsx";

export const templateFaqItems: { q: string; a: string }[] = [
  {
    q: "Is there a free timesheet template?",
    a: "Yes, this one. Download the weekly crew time card free as a PDF or an Excel file. No signup needed.",
  },
  {
    q: "How do I make my own timesheet?",
    a: "Start with the basics: worker name, date, job, start time, end time, unpaid break and total hours, plus a spot for the foreman to sign. Or skip the setup and start from ours, then change the columns to fit your crew.",
  },
  {
    q: "Is there a construction timesheet template in Excel?",
    a: "Yes. The Excel version adds up daily hours and the week for every worker. Totals come out in decimal hours, the way the office needs them.",
  },
  {
    q: "Should construction timesheets be daily or weekly?",
    a: "Fill them in daily, sign them weekly. Most small crews do best with one weekly crew card that gets filled in at the truck every day and signed on Friday. Daily sheets make sense for short jobs, big crews or sites that ask for one. See daily vs weekly timesheets above.",
  },
  {
    q: "Can I track 1099 subs on the same timesheet?",
    a: "Yes. List W-2 employees and 1099 subs on the same sheet and mark each one in the worker type column. How you pay and report each worker is a question for your accountant. The sheet just keeps the hours straight.",
  },
];

const FIELDS: { title: string; body: string }[] = [
  {
    title: "Company, crew and foreman.",
    body: "So the sheet ends up in the right pile on Friday.",
  },
  {
    title: "Week ending date.",
    body: "One date at the top, so nobody argues about which week it was.",
  },
  {
    title: "Job or site, for each day.",
    body: "Hours tied to a job tell you where the week actually went.",
  },
  {
    title: "Worker name and type (W-2 or 1099).",
    body: "The type column is a label so the office can separate hours by worker type. That's all it does.",
  },
  {
    title: "Start, end and unpaid break, for each day (paper form).",
    body: "Write the times and do the math after. Breaks are where totals drift on paper.",
  },
  {
    title: "Daily hours and weekly total.",
    body: "In decimal hours (7.5, not 7:30), which is what the office works with.",
  },
  {
    title: "Sign-off.",
    body: "Foreman signature and date, then office reviewed and date. A signed card on Friday settles the week before anybody has to argue about it.",
  },
];

const STEPS = [
  "Fill it in at the truck, the day it's worked. Not Friday. Friday memory rounds up, rounds down and forgets the half day.",
  "One row per guy. Mark each one W-2 or 1099.",
  "Write the job, start time, end time and unpaid break for each day.",
  "Total the day in decimal hours. 7:00 to 3:30 with a 30-minute unpaid lunch is 8.0 hours.",
  "Foreman checks the week and signs it Friday.",
  "Office reviews, signs and keeps a copy. A phone photo of the signed sheet counts.",
];

const FORMAT_ROWS = [
  ["Printable PDF", "A clipboard in the truck, zero tech", "Print on US Letter, landscape. Fill it in with a pen."],
  ["Excel (.xlsx)", "Office totals", "Enter In/Out as times; daily hours and weekly totals add up. Or type hours directly."],
];

const MISTAKES = [
  "Rebuilding the week from memory. By Thursday, Monday is a guess.",
  "Skipping the break. Or writing it some days and not others.",
  "Handwriting nobody can read. Is that a 1 or a 7?",
  "Lost cards. Glove box, back pocket, a tailgate in the rain.",
  "No sign-off. Then every question about the week is your word against his.",
];

function TextLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className="text-orange-600 font-semibold hover:underline">
      {children}
    </a>
  );
}

function DownloadButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <a
        href={PDF_HREF}
        className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Download PDF
      </a>
      <a
        href={XLSX_HREF}
        className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:border-orange-400 hover:text-orange-600 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Download Excel (.xlsx)
      </a>
    </div>
  );
}

export function ConstructionTimesheetTemplatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingHeader />
      <main>
        <MarketingBreadcrumb
          widthClass="max-w-6xl"
          items={[
            { name: "Home", href: "/" },
            { name: "Construction Time Tracking", href: "/construction-time-tracking" },
            { name: "Construction Timesheet Template" },
          ]}
        />

        <article className="max-w-6xl mx-auto px-6 pt-8 pb-4">
          <p className="text-orange-600 font-semibold text-sm uppercase tracking-widest mb-4">Free template</p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 max-w-3xl">
            Free Construction Timesheet Template for Small Crews
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
            This is the weekly crew time card we'd hand a foreman: one sheet per crew per week, one row per guy, sized
            to ride on a clipboard in the truck. It covers the job, start and end times, unpaid breaks (on the paper
            form), daily and weekly hours, and a foreman sign-off. It tracks hours, not pay. Download it as a printable
            PDF or an Excel file with weekly totals set up.
          </p>
          <div className="mt-8">
            <DownloadButtons />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 items-start">
            <img
              src="/templates/construction-timesheet-template-example.png"
              alt="construction timesheet template – weekly crew time card"
              width={1320}
              height={1020}
              className="w-full rounded-2xl border border-slate-200 bg-white"
            />
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-slate-700 leading-relaxed">
                A construction timesheet should record, for each worker and day, the job or site, start and end times,
                unpaid breaks, total hours, and notes, with a foreman sign-off at the end of the week. Download the
                free weekly crew template below (PDF or Excel), or log crew hours from your phone with My Guys Time.
              </p>
            </div>
          </div>
        </article>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">What's in this construction timesheet template</h2>
          <p className="text-slate-600 leading-relaxed mb-6">Every field is on the sheet for a reason. Here's what each one does.</p>
          <ul className="list-disc pl-6 space-y-3 text-slate-600 leading-relaxed">
            {FIELDS.map((field) => (
              <li key={field.title}>
                <strong className="text-slate-900">{field.title}</strong> {field.body}
              </li>
            ))}
          </ul>
          <p className="text-slate-600 leading-relaxed mt-6">
            What's not on it: pay rates or pay totals. It's an hours sheet. Whoever runs your payroll takes it from
            there.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            How to fill out a construction time card (daily, not Friday)
          </h2>
          <ol className="list-decimal pl-6 space-y-3 text-slate-600 leading-relaxed">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <h3 id="daily-vs-weekly" className="text-2xl font-bold text-slate-900 mt-10 mb-4">
            Daily vs weekly timesheets
          </h3>
          <p className="text-slate-600 leading-relaxed">
            A daily sheet makes sense for short jobs, bigger crews, or a site where the GC wants one sheet per day. For
            most small crews, the weekly crew card is easier: one sheet, one signature, one handoff. If you do use
            daily sheets, staple them behind the weekly card so the totals live in one place.
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Printable PDF or Excel: which to use</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Format
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Best for
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    How it works
                  </th>
                </tr>
              </thead>
              <tbody>
                {FORMAT_ROWS.map((row) => (
                  <tr key={row[0]} className="border-b border-slate-100 last:border-0">
                    <th className="p-4 font-medium text-slate-900" scope="row">
                      {row[0]}
                    </th>
                    <td className="p-4 text-slate-600">{row[1]}</td>
                    <td className="p-4 text-slate-600">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <DownloadButtons />
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Common timesheet mistakes on job sites</h2>
          <ul className="list-disc pl-6 space-y-3 text-slate-600 leading-relaxed">
            {MISTAKES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-slate-600 leading-relaxed mt-6">
            If these sound familiar, read <TextLink href="/vs/paper-timesheets">why paper time cards leak hours</TextLink>{" "}
            and <TextLink href="/vs/spreadsheets">the Thursday spreadsheet problem</TextLink>.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">When to move from paper to an app</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              This sheet works if somebody fills it in every day. If that's the part that keeps slipping, an app does
              the same job with less chasing.
            </p>
            <p>
              In My Guys Time, the foreman enters the crew's hours from his phone the day they're worked. He approves
              the week on the weekly crew board (one-person crews auto-approve). W-2 and 1099 workers sit on one board.
              It's $12/month flat for the whole company, with a 7-day trial.
            </p>
            <p>
              The app started the same way this sheet did. The mason who built it kept his crew's hours penciled on a
              length of 2x6 stashed in the cab, until a second crew made that impossible.
            </p>
            <p>
              <TextLink href="/construction-time-tracking">
                Skip the paper: construction time tracking for $12/month
              </TextLink>
              {" · "}
              <TextLink href="/demo/employee">Try the crew view</TextLink>
              {" · "}
              <TextLink href="/how-it-works">See the 4-step weekly workflow</TextLink>
            </p>
          </div>
          <div className="mt-8">
            <a
              href={APP_LOGIN_URL}
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
            >
              Skip the paper: start my free week <ArrowRight className="w-4 h-4 ml-2" />
            </a>
            <p className="text-slate-600 leading-relaxed mt-4">
              7-day trial, no card, then <TextLink href="/pricing">$12/month flat for the whole crew</TextLink>. Cancel
              anytime.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Construction timesheet FAQ</h2>
          <div className="space-y-4">
            {templateFaqItems.map((item) => (
              <details key={item.q} className="bg-white border border-slate-200 rounded-xl p-5 group">
                <summary className="font-semibold text-slate-900 cursor-pointer list-none flex justify-between items-center gap-4">
                  {item.q}
                  <span className="text-orange-500 text-xl leading-none group-open:rotate-45 transition-transform shrink-0">
                    +
                  </span>
                </summary>
                <p className="text-slate-600 mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

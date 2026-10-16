import { Download } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "./MarketingChrome";

export const DAILY_REPORT_PDF_HREF = "/templates/construction-daily-report-template.pdf";
export const DAILY_REPORT_XLSX_HREF = "/templates/construction-daily-report-template.xlsx";

export const dailyReportFaqItems: { q: string; a: string }[] = [
  {
    q: "What should be included in a construction daily report?",
    a: "The job and date, weather, who was on site and their hours, work completed, deliveries, equipment, visitors and inspections, delays, safety incidents and near misses, photos, and the foreman's signature. Keep each one short.",
  },
  {
    q: "Who fills out the daily report?",
    a: "Usually the foreman or lead on site, before the crew leaves for the day.",
  },
  {
    q: "Is there a free app for construction daily reports?",
    a: "Several construction apps include daily logs. This template costs nothing and works on paper or in Excel. My Guys Time covers crew hours, foreman approval, incident notes and receipt photos for $12/month flat for the whole company, but it isn't a daily-report app.",
  },
  {
    q: "Daily report vs daily log: what's the difference?",
    a: "Mostly the name. Some GCs call the superintendent's own record the \"daily log\" and the version that goes to the customer the \"daily report.\" For a small crew, one sheet does both jobs.",
  },
  {
    q: "Do I need a daily report on small residential jobs?",
    a: "That depends on your contract and the job, so we can't give a legal answer. Plenty of owners keep one anyway, because it settles \"what happened that day\" questions fast.",
  },
];

const FIELDS: { title: string; body: string }[] = [
  {
    title: "Job and date.",
    body: "Job name and address, the date, the foreman's name, and a report number so the sheets stay in order.",
  },
  {
    title: "Weather.",
    body: "Morning and afternoon conditions and the temperature. Short, but it matters when you're pouring concrete, laying block or on a roof.",
  },
  {
    title: "Crew on site.",
    body: "For each guy: name, trade or role, W-2 or 1099, start, end, lunch, and hours. This is the box that settles \"who was there and how long\" later. Lunch is a column on this paper form.",
  },
  {
    title: "Work completed today.",
    body: "Plain bullets by area. \"East wall, courses 4 to 9\" beats a paragraph.",
  },
  {
    title: "Deliveries and materials.",
    body: "What showed up, what was short, and who signed for it.",
  },
  {
    title: "Equipment.",
    body: "What was on site, and what's rented, so the rental doesn't sit there a week nobody's using it.",
  },
  {
    title: "Visitors and inspections.",
    body: "Who came by, which inspection, pass or fail.",
  },
  {
    title: "Delays and issues.",
    body: "Weather, waiting on another trade, missing material, a change the customer asked for.",
  },
  {
    title: "Safety, incidents and near misses.",
    body: "What happened, who got hurt if anyone, and who you told.",
  },
  {
    title: "Photos.",
    body: "Yes or no, and what of. Photos beat paragraphs.",
  },
  {
    title: "Signature.",
    body: "The foreman signs. Add the owner's or GC's signature if the job calls for it.",
  },
];

const CREW_ROWS: { name: string; role: string; type: string; start: string; end: string; lunch: string; hours: string }[] = [
  { name: "Mike", role: "Foreman / mason", type: "W-2", start: "7:00", end: "3:30", lunch: "30 min", hours: "8.0" },
  { name: "Dave", role: "Mason", type: "W-2", start: "7:00", end: "3:30", lunch: "30 min", hours: "8.0" },
  { name: "Luis", role: "Laborer", type: "W-2", start: "7:00", end: "3:30", lunch: "30 min", hours: "8.0" },
  { name: "Tony", role: "Sub (pump)", type: "1099", start: "10:00", end: "1:00", lunch: "none", hours: "3.0" },
];

const TIPS = [
  "Fill it out before you leave the site. Tomorrow morning, you'll forget the delivery time. By Thursday, you'll forget the whole day.",
  "Keep it to one page. If it takes 30 minutes, it won't get done.",
  "Take photos. A picture of the short delivery ticket says more than three sentences.",
  "Keep a copy with the job file. It's useful if there's a disagreement later about what happened that day.",
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
        href={DAILY_REPORT_PDF_HREF}
        className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Download PDF
      </a>
      <a
        href={DAILY_REPORT_XLSX_HREF}
        className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:border-orange-400 hover:text-orange-600 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Download Excel (.xlsx)
      </a>
    </div>
  );
}

export function ConstructionDailyReportTemplatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingHeader />
      <main>
        <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-6 pt-8 text-sm text-slate-500">
          <a href="/" className="hover:text-orange-600">
            Home
          </a>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <a href="/templates/construction-timesheet-template" className="hover:text-orange-600">
            Free Construction Timesheet Template
          </a>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-slate-700">Construction Daily Report Template</span>
        </nav>

        <article className="max-w-6xl mx-auto px-6 pt-8 pb-4">
          <p className="text-orange-600 font-semibold text-sm uppercase tracking-widest mb-4">
            Foreman daily log · PDF + Excel
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 max-w-3xl">
            Free Construction Daily Report Template for Small Crews
          </h1>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-3xl">
            <p className="text-slate-700 leading-relaxed">
              A construction daily report is a one-page record of what happened on the job today: who was on site and
              for how long, what got done, what was delivered, what held you up, and anything that went wrong. Fill it
              out before you leave the site, not on Thursday. Download the free one-page template as a PDF or Excel
              file below.
            </p>
          </div>
        </article>

        <section className="max-w-6xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Download the template</h2>
          <DownloadButtons />
          <p className="text-slate-600 leading-relaxed mt-6 max-w-3xl">
            One page, letter size. Print a stack for the clipboard in the truck, or fill in the Excel file on a laptop.
            No email, no signup.
          </p>
          <img
            src="/templates/construction-daily-report-template.png"
            alt="construction daily report template, one page"
            width={900}
            height={1165}
            className="mt-8 w-full max-w-xl rounded-2xl border border-slate-200 bg-white"
          />
          <p className="text-slate-600 leading-relaxed mt-6 max-w-3xl">
            This isn't a four-page superintendent form. It's one sheet a foreman on a small crew will actually fill out
            in the truck before he heads home, with the crew's hours right up front.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">What goes in a construction daily report</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Here's every box on the template, in the order it appears:
          </p>
          <ol className="list-decimal pl-6 space-y-3 text-slate-600 leading-relaxed">
            {FIELDS.map((field) => (
              <li key={field.title}>
                <strong className="text-slate-900">{field.title}</strong> {field.body}
              </li>
            ))}
          </ol>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Example: a filled-in day</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Here's what a good one looks like. This is a made-up masonry day, just for the example:
          </p>
          <ul className="list-disc pl-6 space-y-3 text-slate-600 leading-relaxed mb-6">
            <li>
              <strong className="text-slate-900">Job:</strong> Hillside Rd. retaining wall · <strong className="text-slate-900">Date:</strong> Tue, Oct 13 ·{" "}
              <strong className="text-slate-900">Foreman:</strong> Mike · <strong className="text-slate-900">Report #</strong> 7
            </li>
            <li>
              <strong className="text-slate-900">Weather:</strong> AM clear, 52°F. PM cloudy, 61°F.
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mb-4">
            <strong className="text-slate-900">Crew:</strong>
          </p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Name
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Role
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    W-2 / 1099
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Start
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    End
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Lunch
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Hours
                  </th>
                </tr>
              </thead>
              <tbody>
                {CREW_ROWS.map((row) => (
                  <tr key={row.name} className="border-b border-slate-100 last:border-0">
                    <th className="p-4 font-medium text-slate-900" scope="row">
                      {row.name}
                    </th>
                    <td className="p-4 text-slate-600">{row.role}</td>
                    <td className="p-4 text-slate-600">{row.type}</td>
                    <td className="p-4 text-slate-600">{row.start}</td>
                    <td className="p-4 text-slate-600">{row.end}</td>
                    <td className="p-4 text-slate-600">{row.lunch}</td>
                    <td className="p-4 text-slate-600">{row.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed mt-3">
            The lunch column is on this paper form. The example hours already subtract that lunch.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-slate-600 leading-relaxed mt-6">
            <li>
              <strong className="text-slate-900">Work completed:</strong> East section, block courses 4 through 9.
              Drainage pipe set behind lower courses.
            </li>
            <li>
              <strong className="text-slate-900">Deliveries:</strong> Block arrived 9:40, scheduled for 7:30. 2 pallets
              short. Mike signed with a note.
            </li>
            <li>
              <strong className="text-slate-900">Equipment:</strong> Mixer (ours). Mini-excavator (rented, returned
              2:00).
            </li>
            <li>
              <strong className="text-slate-900">Visitors and inspections:</strong> None.
            </li>
            <li>
              <strong className="text-slate-900">Delays:</strong> Crew stacked and staged for two hours waiting on
              block. Shifted to pipe and backfill prep.
            </li>
            <li>
              <strong className="text-slate-900">Safety:</strong> Near miss. A pallet shifted on the forks during
              unloading. Nobody hurt. Talked to the driver and the crew at lunch.
            </li>
            <li>
              <strong className="text-slate-900">Photos:</strong> Yes. Wall progress, short delivery ticket.
            </li>
            <li>
              <strong className="text-slate-900">Signed:</strong> Mike
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-6">
            That's it. Ten minutes in the truck, and anybody who asks about Tuesday a month from now gets a straight
            answer.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Daily report vs time card vs daily log</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              A daily report, or daily log, is the job's day: what happened on site. A time card is each guy's hours.
              On big jobs those are different people's paperwork. On a small crew, the foreman usually does both, which
              is why this template keeps a crew-hours box on the daily report.
            </p>
            <p>
              If you need the weekly hours for each guy on one sheet, grab the{" "}
              <TextLink href="/templates/construction-timesheet-template">construction timesheet template</TextLink>. If
              your cards are in hours and minutes, this chart helps you{" "}
              <TextLink href="/templates/time-to-decimal-chart">convert minutes to decimal hours</TextLink>.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Tips that keep it from turning into paperwork nobody reads
          </h2>
          <ul className="list-disc pl-6 space-y-3 text-slate-600 leading-relaxed">
            {TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <p className="text-slate-600 leading-relaxed mt-6">
            If hours keep going missing between the job and the office, here's{" "}
            <TextLink href="/guides/how-contractors-track-crew-hours">how contractors track crew hours</TextLink>{" "}
            without the Thursday rebuild.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Where My Guys Time fits</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                If the crew-hours box is the part you're always chasing, that's what My Guys Time does. Each guy joins
                the crew team from his own phone, he or the foreman logs the hours daily in the browser, the foreman
                approves the week and adds incident notes on the day something goes wrong, and receipt photos ride on
                the card. W-2 guys and 1099 subs sit on the same board. $12/month flat for the whole company.
              </p>
              <p>
                To be straight with you: it's a time card, not a full daily-report app. It doesn't do weather,
                deliveries or job logs. Keep using this template for that. More on{" "}
                <TextLink href="/construction-time-tracking">construction time tracking</TextLink> for small crews.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <a
                href="/demo/foreman"
                className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
              >
                See the foreman view, no signup
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:border-orange-400 hover:text-orange-600 transition-colors"
              >
                See pricing
              </a>
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Construction daily reports: common questions</h2>
          <div className="space-y-4">
            {dailyReportFaqItems.map((item) => (
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

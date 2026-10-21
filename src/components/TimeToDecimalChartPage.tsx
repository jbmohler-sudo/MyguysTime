import { Fragment } from "react";
import { Download } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "./MarketingChrome";

export const DECIMAL_CHART_PDF_HREF = "/templates/time-to-decimal-chart.pdf";
export const DECIMAL_CHART_XLSX_HREF = "/templates/time-to-decimal-chart.xlsx";

export const decimalChartFaqItems: { q: string; a: string }[] = [
  {
    q: "How do I calculate decimal hours?",
    a: "Divide the minutes by 60 and add the result to the whole hours. 8 hours 15 minutes is 8 + 0.25 = 8.25 hours.",
  },
  {
    q: "What is 15 minutes in decimal form?",
    a: "0.25 hours. 30 minutes is 0.50 and 45 minutes is 0.75.",
  },
  {
    q: "What is .26 of an hour?",
    a: "About 16 minutes. 0.26 times 60 is 15.6 minutes.",
  },
  {
    q: "Why does payroll want decimal hours?",
    a: "Hours get multiplied by a rate, so they need to be a plain number, not hours and minutes. 7:45 can't be multiplied cleanly. 7.75 can.",
  },
  {
    q: "Is 7.30 the same as 7 hours 30 minutes?",
    a: "No. 7 hours 30 minutes is 7.50 hours. 7.30 hours is 7 hours 18 minutes.",
  },
];

/** Minutes 1-60 divided by 60, half-up to two decimal places. */
export const decimalMinuteRows: { minutes: number; decimal: string }[] = [
  { minutes: 1, decimal: "0.02" },
  { minutes: 2, decimal: "0.03" },
  { minutes: 3, decimal: "0.05" },
  { minutes: 4, decimal: "0.07" },
  { minutes: 5, decimal: "0.08" },
  { minutes: 6, decimal: "0.10" },
  { minutes: 7, decimal: "0.12" },
  { minutes: 8, decimal: "0.13" },
  { minutes: 9, decimal: "0.15" },
  { minutes: 10, decimal: "0.17" },
  { minutes: 11, decimal: "0.18" },
  { minutes: 12, decimal: "0.20" },
  { minutes: 13, decimal: "0.22" },
  { minutes: 14, decimal: "0.23" },
  { minutes: 15, decimal: "0.25" },
  { minutes: 16, decimal: "0.27" },
  { minutes: 17, decimal: "0.28" },
  { minutes: 18, decimal: "0.30" },
  { minutes: 19, decimal: "0.32" },
  { minutes: 20, decimal: "0.33" },
  { minutes: 21, decimal: "0.35" },
  { minutes: 22, decimal: "0.37" },
  { minutes: 23, decimal: "0.38" },
  { minutes: 24, decimal: "0.40" },
  { minutes: 25, decimal: "0.42" },
  { minutes: 26, decimal: "0.43" },
  { minutes: 27, decimal: "0.45" },
  { minutes: 28, decimal: "0.47" },
  { minutes: 29, decimal: "0.48" },
  { minutes: 30, decimal: "0.50" },
  { minutes: 31, decimal: "0.52" },
  { minutes: 32, decimal: "0.53" },
  { minutes: 33, decimal: "0.55" },
  { minutes: 34, decimal: "0.57" },
  { minutes: 35, decimal: "0.58" },
  { minutes: 36, decimal: "0.60" },
  { minutes: 37, decimal: "0.62" },
  { minutes: 38, decimal: "0.63" },
  { minutes: 39, decimal: "0.65" },
  { minutes: 40, decimal: "0.67" },
  { minutes: 41, decimal: "0.68" },
  { minutes: 42, decimal: "0.70" },
  { minutes: 43, decimal: "0.72" },
  { minutes: 44, decimal: "0.73" },
  { minutes: 45, decimal: "0.75" },
  { minutes: 46, decimal: "0.77" },
  { minutes: 47, decimal: "0.78" },
  { minutes: 48, decimal: "0.80" },
  { minutes: 49, decimal: "0.82" },
  { minutes: 50, decimal: "0.83" },
  { minutes: 51, decimal: "0.85" },
  { minutes: 52, decimal: "0.87" },
  { minutes: 53, decimal: "0.88" },
  { minutes: 54, decimal: "0.90" },
  { minutes: 55, decimal: "0.92" },
  { minutes: 56, decimal: "0.93" },
  { minutes: 57, decimal: "0.95" },
  { minutes: 58, decimal: "0.97" },
  { minutes: 59, decimal: "0.98" },
  { minutes: 60, decimal: "1.00" },
];

const REVERSE_ROWS: { decimal: string; minutes: string }[] = [
  { decimal: "0.10", minutes: "6" },
  { decimal: "0.20", minutes: "12" },
  { decimal: "0.22", minutes: "about 13 (13.2)" },
  { decimal: "0.23", minutes: "about 14 (13.8)" },
  { decimal: "0.25", minutes: "15" },
  { decimal: "0.26", minutes: "about 16 (15.6)" },
  { decimal: "0.33", minutes: "about 20 (19.8)" },
  { decimal: "0.50", minutes: "30" },
  { decimal: "0.75", minutes: "45" },
  { decimal: "0.90", minutes: "54" },
];

const WEEK_ROWS: { day: string; start: string; end: string; hours: string; decimal: string }[] = [
  { day: "Mon", start: "7:00", end: "3:45", hours: "8 h 45 min", decimal: "8.75" },
  { day: "Tue", start: "6:45", end: "3:30", hours: "8 h 45 min", decimal: "8.75" },
  { day: "Wed", start: "7:00", end: "2:20", hours: "7 h 20 min", decimal: "7.33" },
  { day: "Thu", start: "7:15", end: "3:50", hours: "8 h 35 min", decimal: "8.58" },
  { day: "Fri", start: "7:00", end: "12:10", hours: "5 h 10 min", decimal: "5.17" },
];

const CHART_ROW_COUNT = 15;

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
        href={DECIMAL_CHART_PDF_HREF}
        className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Download the one-page chart (PDF)
      </a>
      <a
        href={DECIMAL_CHART_XLSX_HREF}
        className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:border-orange-400 hover:text-orange-600 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Excel version (.xlsx)
      </a>
    </div>
  );
}

export function TimeToDecimalChartPage() {
  const chartRows = Array.from({ length: CHART_ROW_COUNT }, (_, rowIndex) =>
    [0, 1, 2, 3].map((colIndex) => decimalMinuteRows[rowIndex + colIndex * CHART_ROW_COUNT]),
  );

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
          <span className="text-slate-700">Time to Decimal Chart</span>
        </nav>

        <article className="max-w-6xl mx-auto px-6 pt-8 pb-4">
          <p className="text-orange-600 font-semibold text-sm uppercase tracking-widest mb-4">
            Free printable · for time cards
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 max-w-3xl">
            Time to Decimal Chart: Convert Minutes to Decimal Hours
          </h1>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-3xl">
            <p className="text-slate-700 leading-relaxed">
              To turn minutes into decimal hours, divide the minutes by 60. 15 minutes is 0.25 hours, 30 minutes is
              0.50, 45 minutes is 0.75. So 7 hours 45 minutes is 7.75 hours. Use the chart below for any minute from 1
              to 60, or print the one-page PDF and tape it inside the truck.
            </p>
          </div>
          <div className="mt-8">
            <DownloadButtons />
          </div>
        </article>

        <section className="max-w-6xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Minutes to decimal hours chart (1 to 60)</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Decimal hours rounded to two places (minutes divided by 60).
          </p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            <table
              aria-label="decimal time chart, minutes to decimal hours 1 to 60"
              className="w-full text-left text-sm min-w-[720px]"
            >
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[0, 1, 2, 3].map((col) => (
                    <Fragment key={col}>
                      <th className="p-4 font-semibold text-slate-900" scope="col">
                        Minutes
                      </th>
                      <th className="p-4 font-semibold text-slate-900" scope="col">
                        Decimal
                      </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartRows.map((pairs) => (
                  <tr key={pairs[0].minutes} className="border-b border-slate-100 last:border-0">
                    {pairs.map((pair) => (
                      <Fragment key={pair.minutes}>
                        <td className="p-4 font-medium text-slate-900">{pair.minutes}</td>
                        <td className="p-4 text-slate-600">{pair.decimal}</td>
                      </Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">How to convert time to decimal</h2>
          <ol className="list-decimal pl-6 space-y-3 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">Keep the whole hours.</strong> 6 hours 20 minutes starts as 6.
            </li>
            <li>
              <strong className="text-slate-900">Turn the leftover minutes into a decimal.</strong> Divide by 60, or
              find them in the chart. 20 minutes is 0.33.
            </li>
            <li>
              <strong className="text-slate-900">Add them together.</strong> 6 + 0.33 = 6.33 hours.
            </li>
          </ol>
          <p className="text-slate-600 leading-relaxed mt-6">
            Working in Excel? Put the minutes in a cell and divide by 60 (=B2/60). That's all the formula there is.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Decimal hours back to minutes</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Going the other way, multiply the decimal by 60. These are the ones people ask about most:
          </p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[320px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Decimal hours
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Minutes
                  </th>
                </tr>
              </thead>
              <tbody>
                {REVERSE_ROWS.map((row) => (
                  <tr key={row.decimal} className="border-b border-slate-100 last:border-0">
                    <th className="p-4 font-medium text-slate-900" scope="row">
                      {row.decimal}
                    </th>
                    <td className="p-4 text-slate-600">{row.minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">A worked time card week</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Here's one guy's week, written the way it comes off a paper card. These numbers are made up for the
            example.
          </p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Day
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Start
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    End
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Hours and minutes
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Decimal hours
                  </th>
                </tr>
              </thead>
              <tbody>
                {WEEK_ROWS.map((row) => (
                  <tr key={row.day} className="border-b border-slate-100">
                    <th className="p-4 font-medium text-slate-900" scope="row">
                      {row.day}
                    </th>
                    <td className="p-4 text-slate-600">{row.start}</td>
                    <td className="p-4 text-slate-600">{row.end}</td>
                    <td className="p-4 text-slate-600">{row.hours}</td>
                    <td className="p-4 text-slate-600">{row.decimal}</td>
                  </tr>
                ))}
                <tr>
                  <th className="p-4 font-semibold text-slate-900" scope="row">
                    Week
                  </th>
                  <td className="p-4" />
                  <td className="p-4" />
                  <td className="p-4 font-semibold text-slate-900">38 h 35 min</td>
                  <td className="p-4 font-semibold text-slate-900">38.58</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 leading-relaxed mt-6">
            Check it both ways. The minutes add up to 38 hours 35 minutes, and 35 minutes is 0.58, so the week is
            38.58. Adding the daily decimals gives 38.58 too. When the two don't match, it's usually because each day
            got rounded. Add up the hours and minutes first, then convert once, and the rounding can't stack up on you.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Why decimal hours trip people up</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              "7.30" on a time card is not 7 hours 30 minutes. 7 hours 30 minutes is 7.50. 7.30 is 7 hours and 18
              minutes.
            </p>
            <p>
              This is the classic Thursday-night mistake. Somebody is retyping a stack of paper cards, sees 7:30
              written by hand, and types 7.30. Do that on a few cards and the week is short for no reason anybody can
              find. If the card says hours and minutes, convert it. If it says decimals, leave it alone. Don't mix the
              two on one sheet.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">What about rounding?</h2>
          <p className="text-slate-600 leading-relaxed">
            Some businesses round punch times, to the nearest tenth or quarter hour for example. Federal and state
            rules govern how that can be done, and this chart doesn't decide it for you. Ask whoever runs your payroll
            how your company handles it. The chart above is straight math: minutes divided by 60, rounded to two
            places.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Print it</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              <TextLink href={DECIMAL_CHART_PDF_HREF}>Download the one-page chart (PDF)</TextLink>. It prints on one
              letter-size sheet and fits on a clipboard or the inside of a truck visor. There's also an{" "}
              <TextLink href={DECIMAL_CHART_XLSX_HREF}>Excel version</TextLink> with the same table.
            </p>
            <p>
              Reading a punch clock in 24-hour time? Use the{" "}
              <TextLink href="/templates/military-time-chart">military time chart</TextLink>.
            </p>
            <p>
              Need the card itself? Grab the{" "}
              <TextLink href="/templates/construction-timesheet-template">construction timesheet template</TextLink>.
              If hours keep going missing between the job and the office, here's{" "}
              <TextLink href="/guides/how-contractors-track-crew-hours">
                how contractors track crew hours without the Thursday rebuild
              </TextLink>
              , and why <TextLink href="/vs/paper-timesheets">paper timesheets</TextLink> leak.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Tired of converting?</h2>
            <p className="text-slate-600 leading-relaxed">
              With My Guys Time, each guy joins the crew team from his own phone, he or the foreman logs the hours
              every day, the foreman approves the week, and the office sees it all in one place. $12/month flat for
              the whole company.
            </p>
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
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Decimal hours: common questions</h2>
          <div className="space-y-4">
            {decimalChartFaqItems.map((item) => (
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

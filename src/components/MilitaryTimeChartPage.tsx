import { Download } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "./MarketingChrome";

export const MILITARY_CHART_PDF_HREF = "/templates/military-time-chart.pdf";
export const MILITARY_CHART_XLSX_HREF = "/templates/military-time-chart.xlsx";

export const militaryChartFaqItems: { q: string; a: string }[] = [
  {
    q: "What is 1700 in military time?",
    a: "1700 is 5:00 PM.",
  },
  {
    q: "Is midnight 0000 or 2400?",
    a: "0000 starts the day. Some clocks show 2400 at the end of the day. Time cards usually use 0000.",
  },
  {
    q: "How do I convert military time to standard time?",
    a: "For hours 13 to 23, subtract 12 and add PM. 12xx is PM. 00xx is the 12 AM hour. Minutes stay the same.",
  },
  {
    q: "How do I figure hours worked from military time?",
    a: "Subtract in from out, borrowing 60 minutes if you need to, take out any unpaid lunch, then convert the minutes to decimal. See the minutes to decimal chart.",
  },
  {
    q: "Is the chart free?",
    a: "Yes. The PDF and Excel files are free to download, no signup.",
  },
];

const MINUTE_MARKS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** 24-hour clock to standard time. 0000 is 12:00 AM, 1200 is 12:00 PM, 2359 is 11:59 PM. */
export function militaryToStandard(hour: number, minute: number): string {
  const hour12 = hour % 12 || 12;
  const period = hour < 12 ? "AM" : "PM";
  return `${hour12}:${pad2(minute)} ${period}`;
}

export function militaryCode(hour: number, minute: number): string {
  return `${pad2(hour)}${pad2(minute)}`;
}

export const militaryHourRows: { am: string; amMil: string; pm: string; pmMil: string }[] = Array.from(
  { length: 12 },
  (_, hour) => ({
    am: militaryToStandard(hour, 0),
    amMil: militaryCode(hour, 0),
    pm: militaryToStandard(hour + 12, 0),
    pmMil: militaryCode(hour + 12, 0),
  }),
);

export function militaryExampleCell(hour: number, minute: number): string {
  return `${militaryCode(hour, minute)} = ${militaryToStandard(hour, minute)}`;
}

const TIME_CARD_ROWS: { label: string; value: string }[][] = [
  [
    { label: "In", value: "0645" },
    { label: "Out", value: "1530" },
    { label: "On the clock", value: "8 h 45 min" },
    { label: "30-minute unpaid lunch (on paper)", value: "minus 30 min" },
    { label: "Hours", value: "8 h 15 min" },
    { label: "Decimal", value: "8.25" },
  ],
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
        href={MILITARY_CHART_PDF_HREF}
        className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Download the one-page chart (PDF)
      </a>
      <a
        href={MILITARY_CHART_XLSX_HREF}
        className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:border-orange-400 hover:text-orange-600 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Excel version (.xlsx)
      </a>
    </div>
  );
}

function FaqAnswer({ item }: { item: { q: string; a: string } }) {
  const marker = "minutes to decimal chart";
  if (item.a.includes(marker)) {
    const [before, after] = item.a.split(marker);
    return (
      <p className="text-slate-600 mt-3 leading-relaxed">
        {before}
        <a href="/templates/time-to-decimal-chart" className="text-orange-600 font-semibold hover:underline">
          {marker}
        </a>
        {after}
      </p>
    );
  }
  return <p className="text-slate-600 mt-3 leading-relaxed">{item.a}</p>;
}

export function MilitaryTimeChartPage() {
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
          <span className="text-slate-700">Military Time Chart</span>
        </nav>

        <article className="max-w-6xl mx-auto px-6 pt-8 pb-4">
          <p className="text-orange-600 font-semibold text-sm uppercase tracking-widest mb-4">
            Printable · PDF + Excel
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 max-w-3xl">
            Military Time Chart: 24-Hour Clock to Standard Time
          </h1>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-3xl">
            <p className="text-slate-700 leading-relaxed">
              Military time counts the day from 0000 (midnight) to 2359. For any time from 1 PM on, subtract 12 from
              the hour to get standard time: 1430 is 2:30 PM, 1715 is 5:15 PM. Before 1 PM the hours match, except
              0000 to 0059, which is the 12 AM hour (0030 is 12:30 AM). Print the chart below and keep it with the
              time cards.
            </p>
          </div>
          <div className="mt-8">
            <DownloadButtons />
          </div>
        </article>

        <section className="max-w-6xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Military time chart (24 hours)</h2>
          <p className="text-slate-600 leading-relaxed mb-6">Every hour of the day in standard and 24-hour time.</p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            <table
              aria-label="military time chart, 24-hour clock to standard time, AM and PM"
              className="w-full text-left text-sm min-w-[640px]"
            >
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Standard (AM)
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Military
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Standard (PM)
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Military
                  </th>
                </tr>
              </thead>
              <tbody>
                {militaryHourRows.map((row) => (
                  <tr key={row.amMil} className="border-b border-slate-100 last:border-0">
                    <td className="p-4 font-medium text-slate-900">{row.am}</td>
                    <td className="p-4 text-slate-600">{row.amMil}</td>
                    <td className="p-4 font-medium text-slate-900">{row.pm}</td>
                    <td className="p-4 text-slate-600">{row.pmMil}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-slate-600 leading-relaxed mt-8 mb-6">
            <strong className="text-slate-900">Minutes don't change.</strong> The minutes are the same in both
            formats, so you just convert the hour:
          </p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[1100px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {MINUTE_MARKS.map((minute) => (
                    <th key={minute} className="p-4 font-semibold text-slate-900" scope="col">
                      :{pad2(minute)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[7, 15].map((hour) => (
                  <tr key={hour} className="border-b border-slate-100 last:border-0">
                    {MINUTE_MARKS.map((minute) => (
                      <td key={minute} className="p-4 text-slate-600 whitespace-nowrap">
                        {militaryExampleCell(hour, minute)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 leading-relaxed mt-6">
            <strong className="text-slate-900">About midnight:</strong> 0000 is the start of the day. Some systems
            print 2400 for the very end of the day. Same moment, different label.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">How to convert military time to standard time</h2>
          <ol className="list-decimal pl-6 space-y-3 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">Hour 13 to 23?</strong> Subtract 12 and add PM. 1645 is 4:45 PM.
            </li>
            <li>
              <strong className="text-slate-900">Hour 12 or 00?</strong> 12xx is the noon hour, so 1215 is 12:15 PM.
              00xx is the 12 AM hour, so 0010 is 12:10 AM.
            </li>
            <li>
              <strong className="text-slate-900">Leave the minutes alone.</strong> They're the same in both formats.
            </li>
          </ol>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Standard time to military time</h2>
          <p className="text-slate-600 leading-relaxed">
            Add 12 to any PM hour, except 12 PM, which stays 12. 3:30 PM is 1530. For 12 AM, the hour becomes 00, so
            12:45 AM is 0045. Morning hours from 1 AM to 11 AM just get a leading zero: 6:45 AM is 0645.
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Reading a time card in military time</h2>
          <p className="text-slate-600 leading-relaxed mb-6">Here's a made-up crew day off a punch-clock card:</p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[760px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {TIME_CARD_ROWS[0].map((column) => (
                    <th key={column.label} className="p-4 font-semibold text-slate-900" scope="col">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {TIME_CARD_ROWS[0].map((column) => (
                    <td key={column.label} className="p-4 text-slate-600">
                      {column.value}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="space-y-4 text-slate-600 leading-relaxed mt-6">
            <p>
              Subtract in from out: 1530 minus 0645. Borrow an hour since 30 is less than 45: 14 hours 90 minutes
              minus 6 hours 45 minutes is 8 hours 45 minutes. Take out the half hour for lunch and that's 8 hours 15
              minutes, or 8.25 hours. Use the{" "}
              <TextLink href="/templates/time-to-decimal-chart">chart that converts minutes to decimal hours</TextLink>{" "}
              for the last step.
            </p>
            <p>
              <strong className="text-slate-900">Overnight shift?</strong> If the out time is smaller than the in
              time, add 24 hours to the out time first. In 2200, out 0630: 0630 becomes 3030, and 3030 minus 2200 is
              8 hours 30 minutes.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Why punch clocks and apps print 24-hour time</h2>
          <p className="text-slate-600 leading-relaxed">
            No AM and PM mix-ups. A smudged "7" on a card could be morning or night. 0700 and 1900 can't be confused.
            That's the whole reason, and it's a good one when you're squinting at a stack of cards on a Friday.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Print it</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              <TextLink href={MILITARY_CHART_PDF_HREF}>Download the one-page chart (PDF)</TextLink>. It prints on one
              letter-size sheet: the 24-hour chart, the minutes strip, and the conversion rule. The{" "}
              <TextLink href={MILITARY_CHART_XLSX_HREF}>Excel version</TextLink> has the same table plus a simple in
              and out sheet that works out the hours for you.
            </p>
            <p>
              Need the card itself? Grab the{" "}
              <TextLink href="/templates/construction-timesheet-template">construction timesheet template</TextLink>.
              Or see <TextLink href="/guides">all guides and templates</TextLink>.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Converting times off paper cards every Friday?</h2>
            <p className="text-slate-600 leading-relaxed">
              On My Guys Time each guy joins his crew's team from his own phone, he or the foreman logs his hours, the
              foreman approves the week, and the office sees weekly hours, hours past 40, and a simple gross pay
              estimate. $12/month flat for the whole company.
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
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Military time: common questions</h2>
          <div className="space-y-4">
            {militaryChartFaqItems.map((item) => (
              <details key={item.q} className="bg-white border border-slate-200 rounded-xl p-5 group">
                <summary className="font-semibold text-slate-900 cursor-pointer list-none flex justify-between items-center gap-4">
                  {item.q}
                  <span className="text-orange-500 text-xl leading-none group-open:rotate-45 transition-transform shrink-0">
                    +
                  </span>
                </summary>
                <FaqAnswer item={item} />
              </details>
            ))}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

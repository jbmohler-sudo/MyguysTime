import { ArrowRight } from "lucide-react";
import { APP_LOGIN_URL, MarketingFooter, MarketingHeader } from "./MarketingChrome";

export const constructionFaqItems: { q: string; a: string }[] = [
  {
    q: "How much does a construction clock time tracker cost?",
    a: "It depends on how the app is priced. Per-seat apps charge a monthly base fee plus a fee for every user, so the cost follows your headcount. Some apps have free plans capped at a set number of users. Others charge one flat price. My Guys Time is $12/month flat for the whole company, whether you run three guys or thirty. See $12/month flat for the whole crew.",
  },
  {
    q: "Can QuickBooks track time for contractors?",
    a: "Intuit sells a separate time tracking product called QuickBooks Time. My Guys Time is a different kind of tool: it doesn't connect to QuickBooks and it doesn't run payroll. It exports a weekly summary CSV and a time detail CSV that your office or bookkeeper can use when entering hours into QuickBooks or whatever you use for payroll. Compare QuickBooks Time and My Guys Time.",
  },
  {
    q: "How do you keep track of hours worked as a contractor?",
    a: "Log hours daily, not weekly. The foreman enters the crew's hours from the job the day they're worked, checks the week on Friday, and the office signs off before anything goes out. Paper works if somebody actually fills it in every day. An app makes the daily part easier and keeps the whole week in one place the office can see.",
  },
  {
    q: "What is the best free timesheet app?",
    a: "There's no single right answer, and free options do exist. Connecteam's pricing page says it's free for up to 10 users, busybusy lists a Free tier, and Jibble calls its construction time tracking \"Free Forever.\" The trade-offs are usually user caps, features saved for paid tiers, and a bill that shows up as the crew grows. My Guys Time isn't free. It's $12/month flat, after a 7-day trial with no card required.",
  },
  {
    q: "What is the best app for contractors to track job progress?",
    a: "We can't pick one for you, because My Guys Time doesn't do that. It tracks crew hours, not job progress, schedules or budgets. If you need project management, look at tools built for it. If you need clean crew hours every week without chasing anybody, that's what this is for.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. There's no app store download. My Guys Time runs in the phone's browser on iPhone or Android. Open the site, choose Add to Home Screen when your phone offers it, and it sits on the home screen like any other app. Your foreman can be logging hours the same day you sign up.",
  },
  {
    q: "Do I pay per employee?",
    a: "No. $12 a month covers the whole company: foremen, laborers, subs and office. Hiring another guy doesn't change the bill.",
  },
  {
    q: "Does it handle 1099 subs or just W-2 guys?",
    a: "Both. W-2 employees and 1099 subs go on the same weekly board. The app keeps the hours. How you classify and pay each worker is between you and your accountant.",
  },
  {
    q: "What happens after the 7-day trial?",
    a: "To keep going after seven days, you subscribe at $12/month for the whole company. The trial doesn't take a card, so nothing gets charged unless you choose to subscribe. After that, you can cancel anytime from the billing portal.",
  },
];

const FAQ_LINKS: Record<string, { phrase: string; href: string }> = {
  "How much does a construction clock time tracker cost?": {
    phrase: "$12/month flat for the whole crew",
    href: "/pricing",
  },
  "Can QuickBooks track time for contractors?": {
    phrase: "Compare QuickBooks Time and My Guys Time",
    href: "/vs/quickbooks-time",
  },
};

const FEATURES: { title: string; body: string }[] = [
  {
    title: "Hour entry built for the truck",
    body: "A mobile-first screen that runs in the phone's browser. Add it to the home screen and it opens like an app. No app store, no install.",
  },
  {
    title: "Weekly crew board with foreman approval",
    body: "Every guy, every day, on one board. The foreman approves his crew's week. One-person crews auto-approve past that step.",
  },
  {
    title: "Foreman incident notes",
    body: "Something happened on the job? The note goes on that day's entry, where the office will see it, instead of a text thread that scrolls away.",
  },
  {
    title: "Copyable invite links",
    body: "Text a new hire a link and he's in. No download, no setup call.",
  },
  {
    title: "Multiple crews on different jobs",
    body: "Run two or three crews on different jobs and review all of them in one place.",
  },
  {
    title: "Mixed W-2 and 1099 crews",
    body: "Employees and subs on the same weekly board. How you classify them is between you and your accountant. The app keeps the hours.",
  },
  {
    title: "Expenses with receipt photos",
    body: "Reimbursements and petty cash go on the card, with a photo of the receipt taken on the phone. No shoebox.",
  },
  {
    title: "Office view: hours, rate and notes",
    body: "The office sees hours, rate and notes for each person. It doesn't calculate pay. It shows the office what it needs for the handoff.",
  },
  {
    title: "CSV exports",
    body: "A weekly summary and a time detail, both as CSV files.",
  },
];

const TRADES = [
  {
    name: "Roofing",
    body: "Weather days, tear-offs and crews that move between roofs in the same week. See ",
    href: "/trades/roofing",
    label: "roofing crew time tracking",
  },
  {
    name: "Masonry",
    body: "Block, brick, stone and a supply-house run in the middle of every day. It's the trade this app came from: ",
    href: "/trades/masonry",
    label: "masonry crew time tracking",
  },
  {
    name: "Landscaping",
    body: "Crews that grow in spring and shrink by fall. See ",
    href: "/trades/landscaping",
    label: "landscaping crew time tracking",
  },
  {
    name: "Painting",
    body: "Guys spread across three houses at once. See ",
    href: "/trades/painting",
    label: "painting crew time tracking",
  },
  {
    name: "Plumbing",
    body: "Short calls and small jobs that never make it onto a paper card. See ",
    href: "/trades/plumbing",
    label: "plumbing time tracking",
  },
  {
    name: "Electrical",
    body: "Leads and helpers split between jobs. See ",
    href: "/trades/electrical",
    label: "electrical crew time tracking",
  },
  {
    name: "General contracting",
    body: "Your own guys and your subs on the same job. See ",
    href: "/trades/general-contracting",
    label: "time tracking for general contractors and their subs",
  },
];

function TextLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className="text-orange-600 font-semibold hover:underline">
      {children}
    </a>
  );
}

function StartFreeWeek({ className }: { className?: string }) {
  return (
    <a
      href={APP_LOGIN_URL}
      className={
        className ??
        "inline-flex items-center justify-center px-8 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
      }
    >
      Start my free week <ArrowRight className="w-4 h-4 ml-2" />
    </a>
  );
}

function FaqAnswer({ item }: { item: { q: string; a: string } }) {
  const link = FAQ_LINKS[item.q];
  if (!link) {
    return <>{item.a}</>;
  }
  const index = item.a.indexOf(link.phrase);
  if (index === -1) {
    return <>{item.a}</>;
  }
  return (
    <>
      {item.a.slice(0, index)}
      <TextLink href={link.href}>{link.phrase}</TextLink>
      {item.a.slice(index + link.phrase.length)}
    </>
  );
}

export function ConstructionTimeTrackingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingHeader />
      <main>
        <nav aria-label="Breadcrumb" className="max-w-3xl mx-auto px-6 pt-8 text-sm text-slate-500">
          <a href="/" className="hover:text-orange-600">
            Home
          </a>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-slate-700">Construction Time Tracking</span>
        </nav>

        <article className="max-w-3xl mx-auto px-6 pt-8 pb-4">
          <p className="text-orange-600 font-semibold text-sm uppercase tracking-widest mb-4">
            Construction time tracking
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Construction Time Tracking for Small Crews, Built by a Contractor
          </h1>
          <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
            <p>
              It's Thursday at 5pm. Your foreman is sitting in the truck trying to remember who was on which job
              Tuesday, and whether the new guy left at 2 or at 3. That's how a lot of small crews track time, and
              it's where hours go missing.
            </p>
            <p>
              This page is for owners running 2 to 30 guys in roofing, masonry, landscaping, concrete, painting or
              general contracting. No office staff chasing time cards. No patience for software that takes a week to
              set up.
            </p>
            <p>The idea is simple: hours go in from the truck, totals come out in the office.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <StartFreeWeek />
            <a
              href="/demo/admin"
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:border-orange-400 hover:text-orange-600 transition-colors"
            >
              Try the live demo, no signup
            </a>
          </div>

          <p className="text-lg text-slate-700 leading-relaxed mt-10">
            The simplest way to track construction crew hours is to have each foreman log hours from the job every
            day, then review the week and export clean totals from the office. Many crew apps charge per seat, so the
            bill climbs with every hire. My Guys Time is $12/month flat for the whole company, however many guys you
            run.
          </p>
        </article>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            What construction time tracking needs to do for a small crew
          </h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              Construction time tracking means writing down who worked, on which job, and for how many hours, every
              day. Then turning those days into weekly totals the office can hand to whoever runs payroll.
            </p>
            <p>
              My Guys Time handles the hours part. It doesn't run payroll and it doesn't figure anybody's pay. It gets
              clean hours to the person who does.
            </p>
            <p>For a small crew, that comes down to three jobs:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong className="text-slate-900">Capture hours in the field.</strong> The day they're worked, by
                someone who was there.
              </li>
              <li>
                <strong className="text-slate-900">Review the week.</strong> A foreman who knows the crew checks it
                before it goes up.
              </li>
              <li>
                <strong className="text-slate-900">Hand off clean totals.</strong> The office gets numbers it can use
                without retyping anything.
              </li>
            </ol>
            <p>
              Bigger outfits shop for geofencing, kiosks, biometric clocks and cost codes. Those tools exist for a
              reason, and some companies need them. Most crews of five or fifteen guys need something simpler: the
              basics, done every day, by the people on the job.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            The best way to track construction crew hours (4 steps)
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            Same four steps every week. You can <TextLink href="/how-it-works">see the 4-step weekly workflow</TextLink>{" "}
            or click through it yourself in the demo.
          </p>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. Log hours in the truck, the day they're worked</h3>
              <p className="text-slate-600 leading-relaxed">
                The foreman opens My Guys Time on his phone and taps in the crew's hours before he pulls off the job.
                It runs in the phone's browser, so there's nothing to download from an app store. On an iPhone or an
                Android phone, open the site, choose Add to Home Screen, and it sits there like any other app. The
                screen is built for a guy standing next to a tailgate, not someone at a desk. Hours logged the same day
                are hours you can trust. <TextLink href="/demo/employee">Try the crew view</TextLink>.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. Foreman reviews and approves the crew's week</h3>
              <p className="text-slate-600 leading-relaxed">
                There are three roles: Admin, Foreman and Employee. The foreman sees his crew on the weekly crew
                board, day by day, and approves the week before it goes to the office. Running a one-man crew? It
                auto-approves past the foreman step, so nobody waits on himself. If something happened on the job, the
                foreman adds an incident note right on that day. New guys join from a copyable invite link you can text
                them. <TextLink href="/demo/foreman">See the foreman view</TextLink>.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Office reviews and finalizes</h3>
              <p className="text-slate-600 leading-relaxed">
                The office view shows hours, rate and notes for every person. A guy bought a box of wall ties out of
                pocket? He snaps a photo of the receipt on his phone and it goes on his card as an expense to
                reimburse. W-2 employees and 1099 subs sit on the same board, so one review covers everybody who worked
                that week. <TextLink href="/demo/admin">Open the office view</TextLink>.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-3">4. Export weekly totals to CSV</h3>
              <p className="text-slate-600 leading-relaxed">
                When the week is right, export it. You get two CSV files: a weekly summary and a time detail. Send them
                to your bookkeeper, or open them in whatever you use for payroll. That's the handoff. There's no
                integration to set up and nothing to keep in sync, just a clean file of hours that were logged the day
                they happened.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Paper, spreadsheets, or an app?</h2>
          <p className="text-slate-600 leading-relaxed mb-8 max-w-3xl">
            Ask around on r/Construction how guys track hours and you'll hear the same answer a lot: paper timesheets,
            typed into Excel later by somebody in the office. Nothing wrong with starting there. Most of us did. Here's
            how the three options stack up.
          </p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4" scope="col" />
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Paper time card
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Spreadsheet
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Crew app
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "When hours get recorded",
                    "Whenever someone remembers, often Thursday",
                    "When the office types them in",
                    "The day they're worked, from the job",
                  ],
                  [
                    "Can you read it?",
                    "Depends on the handwriting and the rain",
                    "Yes, if it was typed right",
                    "Yes, it's entered on the phone",
                  ],
                  [
                    "Who can see the week",
                    "Whoever has the card",
                    "Whoever has the file",
                    "Foreman and office, on one board",
                  ],
                  [
                    "Handoff to the office",
                    "Someone retypes it",
                    "Someone rebuilds it every week",
                    "Export a CSV",
                  ],
                  [
                    "Cost model",
                    "Free, but hours leak",
                    "Free, but someone rebuilds it weekly",
                    "Per seat, or one flat price",
                  ],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-slate-100 last:border-0">
                    <th className="p-4 font-medium text-slate-900" scope="row">
                      {row[0]}
                    </th>
                    <td className="p-4 text-slate-600">{row[1]}</td>
                    <td className="p-4 text-slate-600">{row[2]}</td>
                    <td className="p-4 text-slate-700">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 leading-relaxed mt-8 max-w-3xl">
            If paper's working for you, make it work better with a{" "}
            <TextLink href="/templates/construction-timesheet-template">
              free printable construction timesheet template
            </TextLink>. If it isn't, here's <TextLink href="/vs/paper-timesheets">why paper time cards leak hours</TextLink> and{" "}
            <TextLink href="/vs/spreadsheets">the Thursday spreadsheet problem</TextLink>.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">What does construction time tracking software cost?</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              Crew time apps are priced three ways: per seat (a base fee plus a fee for every user),{" "}
              <TextLink href="/vs/connecteam">free plans capped at a set number of users</TextLink>, or one flat
              company price. See the{" "}
              <TextLink href="/vs/clockshark">ClockShark alternative with flat pricing</TextLink>. My Guys Time is{" "}
              <TextLink href="/pricing">$12/month flat for the whole crew</TextLink>.
            </p>
            <p>
              The calculator, the questions to ask a vendor, and how the bill changes as the crew grows are on{" "}
              <TextLink href="/construction-time-tracking-cost">what construction time tracking really costs</TextLink>.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
            Features that matter for small crews (and what we left out)
          </h2>
          <p className="text-slate-600 leading-relaxed text-center mb-10">
            The list is short on purpose. Here's <TextLink href="/features">every feature, no bloat</TextLink>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl border border-slate-200 p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.body}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-900 rounded-3xl px-8 py-12 mt-8">
            <h3 className="text-2xl font-bold text-white mb-4">What it's not</h3>
            <p className="text-slate-300 text-lg leading-relaxed max-w-3xl">
              It's not a heavy office system. It's not per-seat pricing. It's not another app-store download your guys
              will ignore. And there's no GPS tracking or geofencing. Plenty of apps call location tracking a
              must-have. We made a different bet: a foreman who logs his crew's hours every day and signs off on them
              tells you more than a map of where everybody's phone was.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Built by a contractor who tracked hours on a 2x6
          </h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              For years my time card was a scrap of 2x6 wedged behind the seat of my truck. At the end of the day I'd
              pencil in who worked and how long. That held up fine, because it was one crew and I was standing right
              there.
            </p>
            <p>
              It stopped working when I started a second crew and put a foreman on it. I wasn't on that job every day
              anymore, so the hours reached me secondhand. Every Thursday around 5pm my foreman was piecing the week
              back together from memory, tired and trying to get home. Some weeks it was close. Some weeks it wasn't.
            </p>
            <p>
              So I went through the Play Store looking for an app. What I found was made for people who sit at desks,
              and just about every one of them priced by the head. More guys, bigger bill. Why should the app cost more
              because you hired another guy?
            </p>
            <p>
              I couldn't find what I wanted, so I built it. Hours go in from the truck, the foreman signs off, the
              office gets a clean file, and the price is the same whether you run three guys or thirty.
            </p>
          </div>
          <p className="mt-6 text-slate-800 italic">Jeff Mohler, founder</p>
          <div className="mt-8">
            <StartFreeWeek />
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Time tracking by trade</h2>
          <ul className="space-y-4 text-slate-600 leading-relaxed">
            {TRADES.map((trade) => (
              <li key={trade.href}>
                <strong className="text-slate-900">{trade.name}.</strong> {trade.body}
                <TextLink href={trade.href}>{trade.label}</TextLink>.
              </li>
            ))}
          </ul>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Construction time tracking FAQ</h2>
          <div className="space-y-4">
            {constructionFaqItems.map((item) => (
              <details
                key={item.q}
                className="bg-white border border-slate-200 rounded-xl p-5 group"
              >
                <summary className="font-semibold text-slate-900 cursor-pointer list-none flex justify-between items-center gap-4">
                  {item.q}
                  <span className="text-orange-500 text-xl leading-none group-open:rotate-45 transition-transform shrink-0">
                    +
                  </span>
                </summary>
                <p className="text-slate-600 mt-3 leading-relaxed">
                  <FaqAnswer item={item} />
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 mt-20">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl px-8 py-14 text-center shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Run a real pay period free</h2>
            <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
              Seven days, no card required. That's a full pay period before you pay a dime. After that it's $12/month
              flat for the whole company, and you can cancel anytime from the billing portal.
            </p>
            <StartFreeWeek className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-orange-600 font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg" />
            <p className="text-orange-100 mt-8">
              Not ready yet? Pick a role and poke around the real app:{" "}
              <a href="/demo/admin" className="text-white font-semibold underline">
                Admin
              </a>
              ,{" "}
              <a href="/demo/foreman" className="text-white font-semibold underline">
                Foreman
              </a>{" "}
              or{" "}
              <a href="/demo/employee" className="text-white font-semibold underline">
                Employee
              </a>
              . No signup, no password.
            </p>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

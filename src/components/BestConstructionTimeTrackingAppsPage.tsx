import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { APP_LOGIN_URL, MarketingFooter, MarketingHeader } from "./MarketingChrome";

export const bestAppsFaqItems: { q: string; a: string }[] = [
  {
    q: "How do I track my time as a contractor?",
    a: "Write it down the day you work it. Hours rebuilt at the end of the week are always a little off. A paper card, a spreadsheet or an app all work if somebody fills them in daily. With a crew, the easiest version is the foreman logging everyone's hours from the truck before he leaves the job.",
  },
  {
    q: "Is Clockify really free?",
    a: "Clockify has a free plan, but its pricing page caps it at a small number of users, and paid plans are per seat. It's a general timer for many kinds of work, not built around a crew and a foreman. My Guys Time isn't free either: it's a 7-day trial, then $12/month flat for the whole company.",
  },
  {
    q: "What is the best app for contractors to track job progress?",
    a: "That's a different job from tracking hours. Some platforms on this list, like BusyBusy Premium and Workyard Pro, add project reports or project dashboards. A time card app like My Guys Time tracks who worked and how long, with foreman notes on the day. It doesn't track job progress.",
  },
  {
    q: "Do I need GPS tracking on my crew's time?",
    a: "Not always. GPS helps when you can't be on site and need proof of arrival, mileage or travel time. Plenty of small outfits rely on the foreman instead: he logs the day and signs the week. If your foreman's sign-off is the check you trust, you can skip GPS.",
  },
  {
    q: "Which option costs the least?",
    a: "It depends on your crew size. A capped free plan costs nothing while you're under the cap. Per-user plans grow with every guy who's active. A flat company price stays the same. Run your own numbers with what construction time tracking costs. My Guys Time is $12/month for the whole company.",
  },
];

const FAQ_LINKS: Record<string, { phrase: string; href: string }> = {
  "Which option costs the least?": {
    phrase: "what construction time tracking costs",
    href: "/construction-time-tracking-cost",
  },
};

function TextLink({
  href,
  children,
  external,
}: {
  href: string;
  children: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      className="text-orange-600 font-semibold hover:underline"
      {...(external ? { target: "_blank", rel: "nofollow noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function FaqAnswer({ item }: { item: { q: string; a: string } }) {
  const link = FAQ_LINKS[item.q];
  if (!link) return <>{item.a}</>;
  const index = item.a.indexOf(link.phrase);
  if (index === -1) return <>{item.a}</>;
  return (
    <>
      {item.a.slice(0, index)}
      <TextLink href={link.href}>{link.phrase}</TextLink>
      {item.a.slice(index + link.phrase.length)}
    </>
  );
}

type AppCard = {
  title: string;
  who: string;
  charges: ReactNode;
  well: string;
  skip: string;
  more?: { href: string; label: string };
  after?: ReactNode;
};

const APPS: AppCard[] = [
  {
    title: "ClockShark: best for scheduling and GPS in one field app",
    who: "field service and construction outfits that schedule crews job to job and want GPS on the clock.",
    charges: (
      <>
        a monthly base price plus a fee per user, on Standard or Pro plans. ClockShark pro-rates for active users, so
        you pay for guys while they're active. Current rates are on{" "}
        <TextLink href="https://www.clockshark.com/pricing/" external>
          ClockShark's pricing page
        </TextLink>
        .
      </>
    ),
    well: "time tracking with GPS and geofencing, drag-and-drop scheduling, job and task tracking, manager approvals and third-party integrations. Pro adds time off tracking, mileage, multi-department controls and advanced job costing. It has Android and iOS apps plus a website, and built-in Spanish.",
    skip: "if you don't schedule crews in the app and don't need location tracking, you're paying per head for tools you won't open.",
    more: { href: "/vs/clockshark", label: "ClockShark vs My Guys Time" },
  },
  {
    title: "BusyBusy: best for GPS time tracking with job costing, starting free",
    who: "construction companies that want time, job costs and equipment in one place, and like the idea of starting on a free plan.",
    charges: (
      <>
        a Free plan, then Pro and Premium plans that charge per user per month plus an admin license. It bills for
        users who are active that month, which helps seasonal crews. Current rates are on{" "}
        <TextLink href="https://busybusy.com/price/" external>
          BusyBusy's pricing page
        </TextLink>
        .
      </>
    ),
    well: "the Free plan already covers GPS time tracking, job costing and equipment tracking. Pro adds breadcrumb GPS, supervisor tools, daily sign-offs, scheduling and a kiosk. Premium adds daily project reports, progress tracking and team messaging. There's a payroll add-on too.",
    skip: "if all you need is a weekly time card, the paid plans carry a lot of platform you'll never use, and the per-user math starts once you need a Pro tool.",
    more: { href: "/vs/busybusy", label: "BusyBusy vs My Guys Time" },
  },
  {
    title: "Workyard: best for GPS-verified time and mileage",
    who: "contractors who need proof of who was on which site, for how long, and how far they drove between jobs.",
    charges: (
      <>
        per user per month, billed annually or monthly, across Starter, Pro, Autopilot and Enterprise plans. Current
        rates are on{" "}
        <TextLink href="https://www.workyard.com/pricing" external>
          Workyard's pricing page
        </TextLink>
        .
      </>
    ),
    well: "precise GPS and mileage reporting on every plan, plus a supervisor mode that clocks in a whole crew at once. Payroll export to QuickBooks, ADP, Gusto and others starts on Starter. Pro adds scheduling, geofence clock-in rules, a kiosk and project labor costs. Autopilot adds automatic clock-in and an AI assistant that reviews timecards.",
    skip: "if you don't need location data, it's a lot of GPS platform to pay for by the head.",
    more: { href: "/vs/workyard", label: "Workyard vs My Guys Time" },
  },
  {
    title: "Connecteam: best free all-in-one for a team of 10 or fewer",
    who: "small teams that want a time clock, scheduling, team chat and HR tools in one app, and fit under the free plan's cap.",
    charges: (
      <>
        its Small Business Plan is free for up to 10 users. Above that, paid plans are sold per hub (Operations,
        Communications, HR & Skills), each at a fixed price for the first 30 users and a fee for every user after.
        Current rates are on{" "}
        <TextLink href="https://connecteam.com/pricing/" external>
          Connecteam's pricing page
        </TextLink>
        .
      </>
    ),
    well: "a lot of ground for no money if you're small: time clock with GPS, scheduling, chat, forms, onboarding. Payroll integration is listed in its Operations plans.",
    skip: "if you're past 10 guys and just want a time card, you're now picking hubs and tiers to get there. It's built for every kind of hourly team, not crews in particular.",
    more: { href: "/vs/connecteam", label: "Connecteam vs My Guys Time" },
  },
  {
    title: "QuickBooks Time: best if you already run QuickBooks Online",
    who: "businesses already on QuickBooks Online that want time tracking from the same company.",
    charges: (
      <>
        a monthly base fee that covers one admin, plus a fee per user per month, on Premium or Elite plans. Intuit's
        pricing page says a QuickBooks Online account is required. Current rates are on{" "}
        <TextLink href="https://quickbooks.intuit.com/time-tracking/pricing/" external>
          Intuit's QuickBooks Time pricing page
        </TextLink>
        .
      </>
    ),
    well: "it syncs time into QuickBooks for accounting and payroll, and its plans include scheduling and a time kiosk. There's a mobile app for iPhone and Android.",
    skip: "if you're not on QuickBooks Online, or you don't want a per-user bill on top of your accounting subscription.",
    more: { href: "/vs/quickbooks-time", label: "QuickBooks Time vs My Guys Time" },
  },
  {
    title: "My Guys Time: best flat price weekly crew card",
    who: "owners of small crews who want the foreman to log hours the day they're worked, sign off on the week, and hand the office a clean set of hours.",
    charges: (
      <>
        $12/month flat for the whole company. Foremen, laborers, subs and the office are all covered, and the bill
        doesn't move when you hire. 7-day free trial, no card. See <TextLink href="/pricing">pricing</TextLink>.
      </>
    ),
    well: "a weekly crew board where the foreman approves the week (one-person crews auto-approve), incident notes on the day they happen, receipt photos on expenses, and W-2 and 1099 guys on one board. The office sees hours, rate and notes. It runs in the phone's browser and you add it to the home screen. The crew joins through a copyable invite link.",
    skip: "if you need GPS, geofencing, scheduling, job costing or a payroll integration, pick one of the apps above. My Guys Time doesn't calculate pay or taxes. It hands hours to whoever runs payroll.",
    after: (
      <>
        Built by a mason who used to keep his crew's hours on a 2x6. More on{" "}
        <TextLink href="/how-it-works">how it works</TextLink>.
      </>
    ),
  },
  {
    title: "Paper and spreadsheets: best when it's one crew you see every day",
    who: "an owner who's on the job with his guys every day and does the hours himself.",
    charges: "a pad of time cards, or a spreadsheet you already have.",
    well: "nothing to learn, nothing to pay for. A good printed card or sheet with job, start, end and hours, plus a foreman signature, holds up fine for one crew.",
    skip: "the week you put a second foreman out there and stop seeing every day yourself. That's when Thursday turns into a memory test and the office starts retyping.",
    after: (
      <>
        Start with our{" "}
        <TextLink href="/templates/construction-timesheet-template">free construction timesheet template</TextLink>{" "}
        (PDF or Excel), or compare <TextLink href="/vs/paper-timesheets">paper timesheets</TextLink> and{" "}
        <TextLink href="/vs/spreadsheets">spreadsheets</TextLink> against an app.
      </>
    ),
  },
];

export function BestConstructionTimeTrackingAppsPage() {
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
          <span>Comparisons</span>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-slate-700">Best Time Tracking Apps for Small Construction Crews</span>
        </nav>

        <article className="max-w-3xl mx-auto px-6 pt-8 pb-4">
          <p className="text-orange-600 font-semibold text-sm uppercase tracking-widest mb-4">
            Crew time apps, compared by fit
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Best Time Tracking Apps for Small Construction Crews
          </h1>
          <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
            <p>
              If you run a trade crew of somewhere between 2 and 30 guys, most &quot;best time tracking app&quot; lists
              aren&apos;t written for you. They&apos;re written for freelancers billing hours to clients, or for HR
              departments with a hundred people on staff. A crew is different. Hours get worked in the mud, on three
              jobs a week, and somebody in the office has to make sense of them by Friday.
            </p>
            <p>
              So this list is sorted by fit. Each app gets a &quot;best for&quot; slot, the way its pricing works, what
              it does well, and when to skip it. No paid placements, no star ratings we made up.
            </p>
            <p>
              One thing up front: we make My Guys Time, and it&apos;s on this list. We put it where it fits and told you
              where it doesn&apos;t.
            </p>
          </div>
          <p className="text-lg text-slate-700 leading-relaxed mt-8">
            The best time tracking app for a small construction crew depends on fit. Pick a GPS ops platform if you
            need geofenced clock-ins and job costing. Pick a capped free plan if you&apos;re under the user limit and
            want chat and scheduling too. Pick a flat-price crew time card if you mainly need daily hours and a foreman
            sign-off. My Guys Time is $12/month for the whole company.
          </p>
        </article>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Quick picks</h2>
          <ul className="list-disc pl-6 space-y-3 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">Best for GPS proof across job sites:</strong> Workyard or BusyBusy. See{" "}
              <TextLink href="/vs/workyard">Workyard vs My Guys Time</TextLink> and{" "}
              <TextLink href="/vs/busybusy">BusyBusy vs My Guys Time</TextLink>.
            </li>
            <li>
              <strong className="text-slate-900">Best for scheduling plus GPS in field service and construction:</strong>{" "}
              ClockShark. See <TextLink href="/vs/clockshark">ClockShark vs My Guys Time</TextLink>.
            </li>
            <li>
              <strong className="text-slate-900">Best free all-in-one for a very small team:</strong> Connecteam, free
              for up to 10 users. See <TextLink href="/vs/connecteam">Connecteam vs My Guys Time</TextLink>.
            </li>
            <li>
              <strong className="text-slate-900">Best if you already run QuickBooks Online:</strong> QuickBooks Time. See{" "}
              <TextLink href="/vs/quickbooks-time">QuickBooks Time vs My Guys Time</TextLink>.
            </li>
            <li>
              <strong className="text-slate-900">Best flat price weekly crew card:</strong> My Guys Time, $12/month for
              the whole company.
            </li>
            <li>
              <strong className="text-slate-900">Still on paper or a spreadsheet?</strong> That can work for a while. See{" "}
              <TextLink href="/vs/paper-timesheets">paper timesheets vs an app</TextLink>,{" "}
              <TextLink href="/vs/spreadsheets">spreadsheets vs an app</TextLink>, or grab the{" "}
              <TextLink href="/templates/construction-timesheet-template">free construction timesheet template</TextLink>
              .
            </li>
          </ul>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">How we sorted these</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              We looked at each app&apos;s own pricing and feature pages in October 2026 and asked four questions a crew
              owner would ask. Does it fit how a foreman&apos;s day actually goes? How does the price move when you
              hire? What does it do that a crew would really use? And what&apos;s the honest reason to pass on it?
            </p>
            <p>
              We don&apos;t print competitors&apos; prices. They change, and the number on a vendor&apos;s own page (or
              in your quote) is the one that counts. We describe how each one charges, and link to the page with the
              current rates. For the math on your own crew, see{" "}
              <TextLink href="/construction-time-tracking-cost">what construction time tracking costs</TextLink>.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">The apps</h2>
          <div className="space-y-6">
            {APPS.map((card) => (
              <article key={card.title} className="bg-white border border-slate-200 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{card.title}</h3>
                <div className="space-y-4 text-slate-600 leading-relaxed">
                  <p>
                    <strong className="text-slate-900">Who it&apos;s for:</strong> {card.who}
                  </p>
                  <p>
                    <strong className="text-slate-900">How it charges:</strong> {card.charges}
                  </p>
                  <p>
                    <strong className="text-slate-900">What it does well:</strong> {card.well}
                  </p>
                  <p>
                    <strong className="text-slate-900">When to skip it:</strong> {card.skip}
                  </p>
                  {card.more && (
                    <p>
                      More detail: <TextLink href={card.more.href}>{card.more.label}</TextLink>.
                    </p>
                  )}
                  {card.after && <p>{card.after}</p>}
                </div>
              </article>
            ))}
          </div>

          <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">Also worth a look</h3>
          <ul className="list-disc pl-6 space-y-3 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">Supercrew</strong> (formerly ConstructionClock): crew time tracking
              with a free trial, then you pay per crew member. Its higher plan adds automatic GPS clock-in and payroll
              integrations (
              <TextLink href="https://supercrew.com/pricing" external>
                Supercrew pricing
              </TextLink>
              ).
            </li>
            <li>
              <strong className="text-slate-900">Clockify:</strong> a general-purpose time tracker used across many
              industries. Its free plan is capped at a handful of users, and paid plans are priced per seat (
              <TextLink href="https://clockify.me/pricing" external>
                Clockify pricing
              </TextLink>
              ). It&apos;s built around tracking time, not around a crew and a foreman.
            </li>
          </ul>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">How to choose in 5 questions</h2>
          <ol className="list-decimal pl-6 space-y-3 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">Do you need GPS proof of where guys were?</strong> If yes, look at
              Workyard, BusyBusy or ClockShark. If your foreman&apos;s word and signature are good enough, you don&apos;t
              need to pay for location tracking.
            </li>
            <li>
              <strong className="text-slate-900">Do you schedule crews in the app?</strong> If yes, ClockShark,
              Connecteam, BusyBusy Pro and Workyard Pro all do it. If the schedule lives in your head and a group text,
              skip it.
            </li>
            <li>
              <strong className="text-slate-900">Will a free plan&apos;s cap hold?</strong> Connecteam is free for up to
              10 users, and BusyBusy has a Free plan. Plan for your spring headcount, not your winter one.
            </li>
            <li>
              <strong className="text-slate-900">Integration or handoff?</strong> If you want hours to land in payroll
              software by themselves, pick an app with a payroll integration. If someone in the office already enters
              payroll, a clean weekly set of hours may be all they need.
            </li>
            <li>
              <strong className="text-slate-900">How much does your headcount swing?</strong> Per-user bills move with
              it. Some apps bill by active user, which softens the swing. A flat company price doesn&apos;t move at all.
            </li>
          </ol>
          <p className="text-slate-600 leading-relaxed mt-6">
            Still deciding how to price it out? Here&apos;s{" "}
            <TextLink href="/construction-time-tracking-cost">what construction time tracking costs</TextLink>, and our
            guide to{" "}
            <TextLink href="/construction-time-tracking">construction time tracking for small crews</TextLink>.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">FAQ</h2>
          <div className="space-y-4">
            {bestAppsFaqItems.map((item) => (
              <details key={item.q} className="bg-white border border-slate-200 rounded-xl p-5 group">
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Just need the crew time card? Try it free for 7 days.
            </h2>
            <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
              One flat price. The whole crew. Cancel anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={APP_LOGIN_URL}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-orange-600 font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
              >
                Start my free week
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="/demo/foreman"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-colors text-lg"
              >
                See the foreman view, no signup
              </a>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

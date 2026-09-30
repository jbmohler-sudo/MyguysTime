import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { APP_LOGIN_URL, MarketingFooter, MarketingHeader } from "./MarketingChrome";

export const costFaqItems: { q: string; a: string }[] = [
  {
    q: "How much does a construction clock time tracker cost?",
    a: "It depends on the pricing model. Per-user apps charge a fee for every worker, often plus a monthly base fee, so the cost is base fee + (per-user fee × crew size). Some apps have free plans capped at a set number of users. Others charge one flat price. My Guys Time is $12/month flat for the whole company.",
  },
  {
    q: "Is there a free time clock app?",
    a: "Yes. Some apps offer free plans, usually capped by number of users or by features. Connecteam's pricing page says it's free for up to 10 users, busybusy lists a Free tier, and Jibble's construction page says \"Free Forever.\" Check the cap, what's included, and what the paid plan looks like once your crew grows past it.",
  },
  {
    q: "What is the best time clock with no monthly fee?",
    a: "It depends on your crew. Free plans avoid a monthly fee until you pass their limits, and a hardware punch clock is a one-time purchase instead of a subscription. My Guys Time does charge monthly: $12 flat for the whole company, instead of a fee for every person.",
  },
  {
    q: "How much does a time tracker cost?",
    a: "Most time trackers are priced per user, as a capped free plan, or at one flat price. For a per-user app, add the base fee to the per-user fee times your headcount. My Guys Time is $12/month for the whole company.",
  },
  {
    q: "Do I pay per employee?",
    a: "No. $12 a month covers the whole company: foremen, workers, subs and office. Hiring another guy never raises your bill.",
  },
];

const INCLUDED = [
  "Hour entry from the truck, in the phone's browser (add it to the home screen, no app store)",
  "Weekly crew board with foreman approval; one-person crews auto-approve",
  "Foreman incident notes on the day's entry",
  "Copyable invite links for new guys",
  "Expenses and reimbursements with receipt photos taken on the phone",
  "Office view with hours, rate and notes for each person",
  "W-2 and 1099 workers on the same board",
];

const MODEL_ROWS = [
  ["3 guys", "base fee + 3 seats", "free if you're under the cap; paid plan above it", "$12/month"],
  ["8 guys", "base fee + 8 seats", "free if you're under the cap; paid plan above it", "$12/month"],
  ["15 guys", "base fee + 15 seats", "free if you're under the cap; paid plan above it", "$12/month"],
  ["30 guys", "base fee + 30 seats", "free if you're under the cap; paid plan above it", "$12/month"],
];

const ASK_ROWS = [
  [
    "Is there a base fee or admin license on top of the per-user fee?",
    "It's part of the bill even with one guy.",
    "No. $12 is the whole bill.",
  ],
  [
    "Is that price monthly, or with a year paid up front?",
    "The advertised price is often the prepaid one.",
    "$12 a month.",
  ],
  [
    "Is there a contract term?",
    "You may be committed longer than you think.",
    "No contract. Cancel anytime from the billing portal.",
  ],
  [
    "Are features split across tiers or add-on modules?",
    "The feature you want may sit on the next plan up.",
    "One plan, no tiers.",
  ],
  [
    "Do seasonal or inactive workers count as users?",
    "Headcount swings are normal in construction.",
    "Doesn't matter. Everybody's included.",
  ],
  [
    "What does a second crew or another office user cost?",
    "Growth shouldn't come with a surprise.",
    "Nothing extra.",
  ],
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

function parseFee(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

function parseCrew(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
}

function money(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const body = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return "$" + body;
}

function PerSeatCalculator() {
  const [baseFee, setBaseFee] = useState("");
  const [perUserFee, setPerUserFee] = useState("");
  const [crewSize, setCrewSize] = useState("");
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const base = parseFee(baseFee);
  const perUser = parseFee(perUserFee);
  const crew = parseCrew(crewSize);
  const ready = base !== null && perUser !== null && crew !== null;
  const monthly = ready ? base + perUser * crew : 0;
  const yearly = monthly * 12;
  const monthClass = billing === "monthly" ? "font-bold text-slate-900" : "";
  const yearClass = billing === "annual" ? "font-bold text-slate-900" : "";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Base fee ($/month)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={baseFee}
            onChange={(event) => setBaseFee(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900"
          />
          <span className="block mt-2 text-slate-500">from the quote or pricing page you're looking at</span>
        </label>
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Per-user fee ($/month)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={perUserFee}
            onChange={(event) => setPerUserFee(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900"
          />
          <span className="block mt-2 text-slate-500">from the quote or pricing page you're looking at</span>
        </label>
        <label className="block text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Crew size</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={crewSize}
            onChange={(event) => setCrewSize(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900"
          />
          <span className="block mt-2 text-slate-500">count everyone who'd log hours, including subs</span>
        </label>
      </div>
      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-slate-900">Which total to emphasize</legend>
        <p className="text-sm text-slate-500 mt-1">
          Monthly or annual only changes which total is emphasized. Enter the monthly rate from the quote, including a
          lower monthly rate for paying a year up front.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            aria-pressed={billing === "monthly"}
            onClick={() => setBilling("monthly")}
            className={
              billing === "monthly"
                ? "px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold"
                : "px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
            }
          >
            Monthly
          </button>
          <button
            type="button"
            aria-pressed={billing === "annual"}
            onClick={() => setBilling("annual")}
            className={
              billing === "annual"
                ? "px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold"
                : "px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
            }
          >
            Annual
          </button>
        </div>
      </fieldset>
      {ready ? (
        <div className="mt-6 border-t border-slate-200 pt-6 space-y-3">
          <p className="text-slate-700">
            Your per-seat bill: <span className={monthClass}>{money(monthly)}/month</span>
            {", "}
            <span className={yearClass}>{money(yearly)}/year</span>
          </p>
          <p className="text-slate-700">
            My Guys Time: <span className={monthClass}>$12/month</span>
            {", "}
            <span className={yearClass}>$144/year</span>
          </p>
          <p className="text-slate-800">Your crew on My Guys Time: $12/month.</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <StartFreeWeek />
            <a href="/demo/admin" className="text-orange-600 font-semibold hover:underline">
              See it working in 30 seconds
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ConstructionTimeTrackingCostPage() {
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
          <span className="text-slate-700">Construction Time Tracking Cost</span>
        </nav>

        <article className="max-w-3xl mx-auto px-6 pt-8 pb-4">
          <p className="text-orange-600 font-semibold text-sm uppercase tracking-widest mb-4">Pricing, explained</p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            What Does Construction Time Tracking Cost? Per-Seat vs Flat
          </h1>
          <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
            <p>
              Here's how it usually goes. A crew app quotes you a price per user that sounds like nothing. You sign up
              with six guys. Then spring hits, you hire four more, and a couple of subs need to log hours too. Nobody
              raised the price. Your headcount did.
            </p>
            <p>
              This page covers how construction time tracking apps are actually priced, how to run the numbers on your
              own crew in about 30 seconds, and what to ask before you sign anything.
            </p>
          </div>
          <p className="text-lg text-slate-700 leading-relaxed mt-10">
            Construction time tracking apps are usually priced one of three ways: per user (a fee for every worker,
            often plus a base fee), free plans capped at a set number of users, or one flat company price. Per-user
            bills grow with every hire. My Guys Time is $12/month flat for the whole company, however many guys you
            run.
          </p>
        </article>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">The 3 ways crew time tracking apps are priced</h2>
          <h3 className="text-2xl font-bold text-slate-900 mt-8 mb-3">Per user (per seat)</h3>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              You pay a fee for every person who uses the app, often on top of a monthly base fee or an admin license.
              The bill follows headcount. Add a guy, pay more. Whether you pay less when a guy leaves depends on how
              the vendor counts users.
            </p>
            <p>
              This is the most familiar model among crew apps. ClockShark lists its plans as a base price plus a
              per-user fee. busybusy prices its paid plans per user, with an admin license on top. Workyard's plans are
              priced per user per month. Supercrew says you pay per crew member. For current rates, go to each vendor's
              pricing page. Prices change, and the quote you get is the number that counts.
            </p>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-8 mb-3">Free plans with a cap</h3>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              Some apps are free up to a set number of users, or free with a limited set of features. For a small crew,
              that can be a real deal. Connecteam's pricing page says its Small Business Plan is free for up to 10
              users, with a footnote on which features are included. busybusy lists a Free tier. Jibble's construction
              page is titled "Free Forever."
            </p>
            <p>
              What to weigh: how many users the cap allows, which features you actually get on the free plan, and what
              the paid plan looks like the month you go past the cap.
            </p>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-8 mb-3">Flat company price</h3>
          <p className="text-slate-600 leading-relaxed">
            One price for everyone, no matter how many guys you run. My Guys Time is $12/month for the whole company:
            foremen, laborers, subs and office. Hiring doesn't change the bill. See{" "}
            <TextLink href="/pricing">$12/month flat for the whole crew</TextLink>.
          </p>
          <h3 className="text-2xl font-bold text-slate-900 mt-8 mb-3">One more: user bands</h3>
          <p className="text-slate-600 leading-relaxed">
            There's a fourth model worth knowing. You pay a fixed price for a range of users, then a per-user fee above
            it. Connecteam's paid plans work this way: its pricing page lists a fixed price for the first 30 users on
            each hub, then a fee for each additional user.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Do the math on your own crew</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>Every per-seat quote comes down to the same formula:</p>
            <p>
              <strong className="text-slate-900">
                Per-seat monthly cost = base fee + (per-user fee × number of users)
              </strong>
            </p>
            <p>Multiply by 12 for the year. If the vendor offers a lower rate for paying a year up front, run it both ways.</p>
          </div>
          <PerSeatCalculator />
          <p className="text-slate-600 leading-relaxed mt-8">Here's how the models compare as the crew grows:</p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto mt-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Crew size
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Per-seat app
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Capped free plan
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    My Guys Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODEL_ROWS.map((row) => (
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
          <p className="text-slate-600 leading-relaxed mt-6">
            Plug in your quote, then run it again with your busiest month's headcount. That's the number you'll actually
            be paying on.
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">What else changes the bill (questions to ask any vendor)</h2>
          <p className="text-slate-600 leading-relaxed max-w-3xl mb-6">
            The per-user fee isn't the whole story. Ask these before you sign:
          </p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Ask the vendor
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    Why it matters
                  </th>
                  <th className="p-4 font-semibold text-slate-900" scope="col">
                    My Guys Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {ASK_ROWS.map((row) => (
                  <tr key={row[0]} className="border-b border-slate-100 last:border-0">
                    <th className="p-4 font-medium text-slate-900" scope="row">
                      {row[0]}
                    </th>
                    <td className="p-4 text-slate-600">{row[1]}</td>
                    <td className="p-4 text-slate-700">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Is a free time clock app good enough for a crew?</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              Sometimes, yes. If you run three or four guys and a free plan covers what you need, use it. Plenty of
              small outfits do.
            </p>
            <p>
              Where free gets harder: user caps you'll outgrow, features held back for paid tiers, and a bill that
              shows up right when the business is growing. Before you commit, look at the paid plan you'll land on, not
              just the free one.
            </p>
            <p>
              The flat $12 is for crews that want something built around how a crew actually works: a weekly crew board,
              foreman approval (one-person crews auto-approve), foreman incident notes, receipt photos on the card, W-2
              and 1099 guys on the same board. And the price doesn't move when you hire. The guy who built it is a mason
              who went looking for a crew app and kept finding per-head pricing. His question still sets the price: why
              should the app cost more because you hired another guy?
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">What $12 a month gets a construction crew</h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
            {INCLUDED.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-slate-600 leading-relaxed mt-6">
            See <TextLink href="/features">what's included</TextLink>,{" "}
            <TextLink href="/how-it-works">how the week runs</TextLink>, or{" "}
            <TextLink href="/demo/admin">open the office view</TextLink>.
          </p>
          <p className="text-slate-700 leading-relaxed mt-6">
            <strong className="text-slate-900">What it's not:</strong> no GPS tracking, no scheduling, and no payroll or
            pay calculation. Hours hand off cleanly to whoever runs payroll — no payroll integration.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Compare specific apps</h2>
          <ul className="list-disc pl-6 space-y-3 text-slate-600 leading-relaxed">
            <li>
              <TextLink href="/vs/clockshark">ClockShark's per-user pricing model</TextLink>: a base fee plus a fee per
              user, next to one flat price.
            </li>
            <li>
              <TextLink href="/vs/quickbooks-time">QuickBooks Time vs My Guys Time</TextLink>: keep your accounting,
              change how hours come in.
            </li>
            <li>
              <TextLink href="/vs/paper-timesheets">Paper timesheets</TextLink>: free to print, costly in lost hours.
            </li>
            <li>
              <TextLink href="/vs/spreadsheets">Spreadsheets</TextLink>: a free file that someone rebuilds every week.
            </li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-6">
            Still on paper? Read the full guide to{" "}
            <TextLink href="/construction-time-tracking">construction time tracking for small crews</TextLink>.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Construction time tracking cost FAQ</h2>
          <div className="space-y-4">
            {costFaqItems.map((item) => (
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

        <section className="max-w-6xl mx-auto px-6 mt-20">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl px-8 py-14 text-center shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Run the math, then run a real week</h2>
            <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
              Seven days, no card required. That's a full pay period before you pay a dime. After that it's $12/month
              flat for the whole company, and you can cancel anytime from the billing portal.
            </p>
            <StartFreeWeek className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-orange-600 font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg" />
            <p className="text-orange-100 mt-8">
              See it working in 30 seconds:{" "}
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

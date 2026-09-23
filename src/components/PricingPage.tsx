import { Check, X } from "lucide-react";
import {
  MarketingHeader,
  MarketingFooter,
  CtaBand,
  PageHero,
  startFreeWeek,
} from "./MarketingChrome";

const INCLUDED = [
  "Unlimited crew members — foremen, workers, office, all of them",
  "Weekly crew board with day-by-day review",
  "Weekly summary + time-detail CSV exports",
  "Reimbursements, deductions, and petty cash on the time card",
  "Receipt photo capture",
  "Mixed W-2 and 1099 crews",
  "Private office-only reports",
  "Copyable invite links",
];

export function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingHeader />
      <main>
        <PageHero
          eyebrow="Pricing"
          title="One price. The whole crew."
          sub="$12 a month. Flat. No per-seat fees, no tiers, no surprises."
        />

        <section className="max-w-3xl mx-auto px-6 mt-12">
          <div className="bg-white rounded-3xl border-2 border-orange-500 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-8 py-10 text-center">
              <p className="text-orange-100 font-semibold uppercase tracking-widest text-sm mb-2">
                Every company, one plan
              </p>
              <p className="text-white">
                <span className="text-6xl font-bold">$12</span>
                <span className="text-xl">/month</span>
              </p>
              <p className="text-orange-100 mt-3">Flat. The whole company included.</p>
            </div>
            <div className="px-8 py-10">
              <ul className="space-y-4">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-orange-600" />
                    </span>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={startFreeWeek}
                className="w-full mt-10 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-lg"
              >
                Start my free week
              </button>
              <p className="text-center text-sm text-slate-500 mt-4">
                7 days free — a full pay period before you pay a dime.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">The per-seat math</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Eight guys on a typical per-seat app runs $64 or more a month — and your bill
              goes up every time you hire. That&apos;s backwards. Why should the app cost more
              because you hired another guy?
            </p>
            <p className="text-slate-600 leading-relaxed">
              Here it&apos;s $12 whether you run three guys or thirty. Hiring another guy never
              raises your bill.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">No gotchas</h2>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                No per-employee fees, ever
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                No tiers holding features hostage
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                No contract, no retention call — cancel anytime from the billing portal
              </li>
            </ul>
          </div>
        </section>

        <CtaBand
          heading="Run a real pay period free"
          sub="7 days free, then $12/mo flat. Cancel before the trial ends and you pay nothing."
        />
      </main>
      <MarketingFooter />
    </div>
  );
}

import { Truck, Eye, SlidersHorizontal, FileSpreadsheet } from "lucide-react";
import { MarketingHeader, MarketingFooter, CtaBand, PageHero } from "./MarketingChrome";

const STEPS = [
  {
    icon: Truck,
    step: "Step 1",
    title: "Enter hours in the truck",
    body: "Fast, simple hour tracking for contractors in the field. Built for real job sites, not office desks — your crew logs hours directly from the field with an intuitive mobile-first screen. No install, no app store.",
  },
  {
    icon: Eye,
    step: "Step 2",
    title: "Review the week in the office",
    body: "See your entire crew in one place, with clear weekly status and day-by-day review. It works as a small crew time card app with the review built in — catch discrepancies before they slow the office down.",
  },
  {
    icon: SlidersHorizontal,
    step: "Step 3",
    title: "Adjust and finalize",
    body: "Handle reimbursements, deductions, and mixed crews — W-2 and 1099. Clean weekly review with all the details that matter to your bottom line.",
  },
  {
    icon: FileSpreadsheet,
    step: "Step 4",
    title: "Export time cards",
    body: "Export timesheets to CSV for the office handoff. Just verified labor hour logs and a practical weekly handoff — the office gets exactly what it needs.",
  },
];

const ROLES = [
  {
    title: "Employee",
    body: "Logs hours from the field. That's the whole job — open it, enter hours, done.",
  },
  {
    title: "Foreman",
    body: "Reviews his crew's week, adds incident notes, and sends it up. No more reconstructing the week from memory on Thursday at 5pm.",
  },
  {
    title: "Admin / Office",
    body: "Finalizes the week, handles adjustments, and exports clean CSVs. Private office-only reports stay private.",
  },
];

export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingHeader />
      <main>
        <PageHero
          eyebrow="How it works"
          title="Four steps. Every week."
          sub="A simple weekly workflow for crews and office. Hours in the field, totals in the office, nothing in between."
        />

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <div
                key={s.step}
                className="bg-white rounded-2xl border border-slate-200 p-8 flex gap-6 hover:border-orange-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <s.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-orange-600 font-semibold text-sm uppercase tracking-widest mb-1">
                    {s.step}
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">{s.title}</h2>
                  <p className="text-slate-600 leading-relaxed">{s.body}</p>
                  {i === 0 && (
                    <a
                      href="/demo/employee"
                      className="inline-block mt-4 text-orange-600 font-semibold hover:text-orange-700"
                    >
                      Try the field view in the live demo &rarr;
                    </a>
                  )}
                  {i === 1 && (
                    <a
                      href="/demo/foreman"
                      className="inline-block mt-4 text-orange-600 font-semibold hover:text-orange-700"
                    >
                      Try the foreman view in the live demo &rarr;
                    </a>
                  )}
                  {i === 2 && (
                    <a
                      href="/demo/admin"
                      className="inline-block mt-4 text-orange-600 font-semibold hover:text-orange-700"
                    >
                      Try the office view in the live demo &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
            Everyone knows their lane
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROLES.map((r) => (
              <div key={r.title} className="bg-white rounded-2xl border border-slate-200 p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-3">{r.title}</h3>
                <p className="text-slate-600 leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        <CtaBand
          heading="See it working in 30 seconds"
          sub="Pick a role and poke around the real app — no signup, no password. Or start your free week."
        />
      </main>
      <MarketingFooter />
    </div>
  );
}

import {
  Truck,
  LayoutDashboard,
  Users,
  Receipt,
  FileSpreadsheet,
  Camera,
  Link2,
  ClipboardList,
  Lock,
  Layers,
} from "lucide-react";
import { MarketingHeader, MarketingFooter, CtaBand, PageHero } from "./MarketingChrome";

const FEATURES = [
  {
    icon: Truck,
    title: "Hour entry built for trucks",
    body: "Your crew logs hours from the field on a mobile-first screen made for job sites, not office desks. No app store, no install — it runs in the browser and pins to the home screen like an app.",
  },
  {
    icon: LayoutDashboard,
    title: "Weekly crew board",
    body: "The whole crew on one board with clear weekly status. Day-by-day review catches discrepancies before they slow the office down.",
  },
  {
    icon: Users,
    title: "Three roles, zero confusion",
    body: "Admin, Foreman, Employee. The foreman reviews his crew's week; the office gives the final sign-off. Everybody knows their lane.",
  },
  {
    icon: Receipt,
    title: "Adjustments right on the card",
    body: "Reimbursements, deductions, and petty cash logged directly on the time card. Guy buys materials out of pocket? It lands in the weekly totals.",
  },
  {
    icon: Layers,
    title: "Mixed crews welcome",
    body: "W-2 and 1099 in the same week. Mixed crews are normal — the app doesn't care how you classify them.",
  },
  {
    icon: FileSpreadsheet,
    title: "CSV exports for the office",
    body: "Weekly summary and time-detail CSVs for the office handoff. Verified labor hour logs, nothing more, nothing missing.",
  },
  {
    icon: Camera,
    title: "Receipt photos",
    body: "Snap a photo of the materials receipt and it's attached to the week. No more shoebox of faded receipts at tax time.",
  },
  {
    icon: Link2,
    title: "Copyable invite links",
    body: "Get a new hire into the app with a link. No IT department, no onboarding call, no paperwork.",
  },
  {
    icon: ClipboardList,
    title: "Foreman incident notes",
    body: "Notes from the field live with the week's hours, where the office can actually find them — not in a text thread that scrolls away.",
  },
  {
    icon: Lock,
    title: "Office-only reports",
    body: "Private reports the crew never sees. The office gets exactly what it needs; the field doesn't get noise.",
  },
];

export function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingHeader />
      <main>
        <PageHero
          eyebrow="Features"
          title="Every feature earns its place."
          sub="No seventeen modules you'll never open. Just the weekly workflow: hours in the field, totals in the office."
        />

        <section className="max-w-6xl mx-auto px-6 mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-slate-200 p-8 hover:border-orange-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h2>
                <p className="text-slate-600 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 mt-16">
          <div className="bg-slate-900 rounded-3xl px-8 py-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">What it&apos;s not</h2>
            <p className="text-slate-300 text-lg max-w-3xl mx-auto leading-relaxed">
              Not a heavy office system. Not per-seat pricing that punishes you for hiring.
              Not another app-store download your guys will ignore. Hours in the truck,
              totals in the office — that&apos;s the whole job.
            </p>
          </div>
        </section>

        <CtaBand
          heading="See every feature working"
          sub="Poke around the live demo — no signup — or start your free week and run a real pay period through it."
        />
      </main>
      <MarketingFooter />
    </div>
  );
}

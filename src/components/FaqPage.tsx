import { MarketingHeader, MarketingFooter, CtaBand, PageHero } from "./MarketingChrome";
import { faqItems } from "./PublicHomepage";

export const faqPageItems: { q: string; a: string }[] = [
  ...faqItems,
  {
    q: "Is there a free plan?",
    a: "No free-forever tier — it's $12 a month flat. But the 7-day free trial covers a full pay period, so you know exactly what you're getting before you pay a dime.",
  },
  {
    q: "Can my foreman approve hours?",
    a: "Yes. The foreman reviews his crew's week and adds incident notes; the office gives the final sign-off.",
  },
  {
    q: "What if a guy forgets to log his hours?",
    a: "The weekly board flags missing confirmations, so the office sees the gaps before totals go out — no more reconstructing the week from memory on Thursday at 5pm.",
  },
  {
    q: "Does it do payroll?",
    a: "No — and that's on purpose. It hands clean hour totals to whoever runs your payroll. Hours, rates, and notes; nothing pretending to be an accountant.",
  },
];

export function FaqPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingHeader />
      <main>
        <PageHero
          eyebrow="FAQ"
          title="Asked by contractors, answered straight."
          sub="No sales-speak. The questions owners actually ask before putting their crew on it."
        />

        <section className="max-w-3xl mx-auto px-6 mt-12">
          <div className="space-y-4">
            {faqPageItems.map((item) => (
              <details
                key={item.q}
                className="bg-white rounded-2xl border border-slate-200 px-8 py-6 group hover:border-orange-300 transition-colors"
              >
                <summary className="font-bold text-slate-900 text-lg cursor-pointer list-none flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-orange-500 text-2xl font-light group-open:rotate-45 transition-transform shrink-0">
                    +
                  </span>
                </summary>
                <p className="text-slate-600 leading-relaxed mt-4">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <CtaBand
          heading="Still got a question?"
          sub="Start the free week and run your actual crew through it — or email jeff@myguystime.com and ask a human."
        />
      </main>
      <MarketingFooter />
    </div>
  );
}

import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, ClipboardList } from "lucide-react";
import { MarketingChrome } from "./MarketingChrome";
import { TRADES, getTrade, type TradeConfig } from "./trades";

export function TradePage({ slug }: { slug: string }) {
  const trade: TradeConfig | undefined = getTrade(slug);
  if (!trade) {
    return (
      <MarketingChrome>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Trade not found</h1>
          <Link to="/features" className="text-orange-600 hover:underline">
            See all features
          </Link>
        </div>
      </MarketingChrome>
    );
  }
  const others = TRADES.filter((t) => t.slug !== trade.slug);

  return (
    <MarketingChrome>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-orange-600 font-semibold mb-4">For {trade.plural}</p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">{trade.h1}</h1>
          <p className="text-xl text-slate-600 mb-4">{trade.sub}</p>
          <p className="text-slate-600 mb-8 max-w-3xl mx-auto">{trade.intro}</p>
          <MarketingChrome.CtaButtons />
          <p className="text-sm text-slate-500 mt-4">$12/mo flat for the whole company · 7-day free trial · Cancel anytime</p>
        </div>
      </section>

      {/* Pains */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
            Where {trade.trade.toLowerCase()} hours go missing
          </h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
            If any of these sound like your week, your time cards are leaking.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {trade.pains.map((p) => (
              <div key={p.title} className="border border-slate-200 rounded-xl p-6 bg-slate-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">{p.title}</h3>
                    <p className="text-slate-600 text-sm">{p.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly flow */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">
            The {trade.trade.toLowerCase()} week on My Guys Time
          </h2>
          <div className="space-y-6">
            {trade.flow.map((s, i) => (
              <div key={s.title} className="flex gap-4 bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Callout */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">{trade.calloutTitle}</h2>
                <p className="text-slate-700">{trade.calloutText}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            {trade.trade} questions, answered straight
          </h2>
          <div className="space-y-4">
            {trade.faqs.map((f) => (
              <details key={f.q} className="bg-white border border-slate-200 rounded-xl p-5 group">
                <summary className="font-semibold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                  {f.q}
                  <span className="text-orange-500 text-xl leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-slate-600 mt-3 text-sm">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/faq" className="text-orange-600 hover:underline font-medium inline-flex items-center gap-1">
              <ClipboardList className="w-4 h-4" /> All frequently asked questions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Other trades */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl font-bold text-slate-900 mb-4 text-center">Other trades</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {others.map((t) => (
              <Link
                key={t.slug}
                to={`/trades/${t.slug}`}
                className="px-4 py-2 border border-slate-200 rounded-full text-sm text-slate-700 hover:border-orange-400 hover:text-orange-600 transition-colors"
              >
                {t.trade}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <MarketingChrome.CtaBand
        title={`Run a ${trade.trade.toLowerCase()} crew? Try it free for 7 days.`}
        sub="One flat price. The whole crew. Cancel anytime."
      />
    </MarketingChrome>
  );
}

import { AlertCircle, ArrowRight, CheckCircle2, ClipboardList, XCircle } from "lucide-react";
import {
  APP_LOGIN_URL,
  CtaBand,
  MarketingFooter,
  MarketingHeader,
  PageHero,
} from "./MarketingChrome";
import { VS_PAGES, getVs, type VsConfig, type VsFaq, type VsTextPart } from "./vs";

function VsLinkedText({ parts }: { parts: VsTextPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.href ? (
          <a
            key={index}
            href={part.href}
            className="text-orange-600 font-semibold hover:underline"
            {...(part.external ? { target: "_blank", rel: "nofollow noopener noreferrer" } : {})}
          >
            {part.text}
          </a>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

function VsFaqAnswer({ faq }: { faq: VsFaq }) {
  const link = faq.link;
  if (!link) return <>{faq.text}</>;
  const index = faq.text.indexOf(link.phrase);
  if (index === -1) return <>{faq.text}</>;
  return (
    <>
      {faq.text.slice(0, index)}
      <a
        href={link.href}
        className="text-orange-600 font-semibold hover:underline"
        {...(link.external ? { target: "_blank", rel: "nofollow noopener noreferrer" } : {})}
      >
        {link.phrase}
      </a>
      {faq.text.slice(index + link.phrase.length)}
    </>
  );
}

export function VsPage({ slug }: { slug: string }) {
  const vs: VsConfig | undefined = getVs(slug);
  if (!vs) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <MarketingHeader />
        <main>
          <PageHero
            eyebrow="Comparisons"
            title="Comparison not found"
            sub="That page doesn't exist — but the time cards do."
          />
          <div className="text-center pb-20">
            <a href="/features" className="text-orange-600 hover:underline font-medium">
              See all features
            </a>
          </div>
        </main>
        <MarketingFooter />
      </div>
    );
  }
  const others = VS_PAGES.filter((v) => v.slug !== vs.slug);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingHeader />
      <main>
        <PageHero
          eyebrow={`My Guys Time vs ${vs.name}`}
          title={vs.h1}
          sub={vs.sub}
        />

        <section className="max-w-3xl mx-auto px-6 mt-4 text-center">
          <p className="text-slate-600 leading-relaxed">{vs.intro}</p>
          {vs.afterIntro && (
            <p className="text-slate-600 leading-relaxed mt-4">
              <VsLinkedText parts={vs.afterIntro} />
            </p>
          )}
          <p className="text-slate-600 leading-relaxed mt-4">
            For the full picture, see the{" "}
            <a href="/construction-time-tracking" className="text-orange-600 font-semibold hover:underline">
              construction time tracking app
            </a>{" "}
            built for small crews.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <a
              href={APP_LOGIN_URL}
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
            >
              Start my free week <ArrowRight className="w-4 h-4 ml-2" />
            </a>
            <a
              href="/how-it-works"
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:border-orange-400 hover:text-orange-600 transition-colors"
            >
              See how it works
            </a>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            $12/mo flat for the whole company &middot; 7-day free trial &middot; Cancel anytime
          </p>
        </section>

        {/* Pains */}
        <section className="max-w-6xl mx-auto px-6 mt-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
            {vs.painHeading ?? `What ${vs.name.toLowerCase()} costs you every week`}
          </h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
            {vs.painSub ?? "If any of these sound like your week, your time cards are leaking."}
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {vs.pains.map((p) => (
              <div key={p.title} className="bg-white border border-slate-200 rounded-2xl p-8">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">{p.title}</h3>
                    <p className="text-slate-600">{p.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Side-by-side comparison */}
        <section className="max-w-5xl mx-auto px-6 mt-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">
            {vs.name} vs My Guys Time, side by side
          </h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
              <div className="p-4"></div>
              <div className="p-4 font-semibold text-slate-500 text-sm sm:text-base">{vs.name}</div>
              <div className="p-4 font-semibold text-slate-900 text-sm sm:text-base">My Guys Time</div>
            </div>
            {vs.compare.map((row) => (
              <div key={row.label} className="grid grid-cols-3 border-b border-slate-100 last:border-0">
                <div className="p-4 font-medium text-slate-900 text-sm sm:text-base">{row.label}</div>
                <div className="p-4 text-slate-500 text-sm sm:text-base">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                    <span>{row.oldWay}</span>
                  </div>
                </div>
                <div className="p-4 text-slate-700 text-sm sm:text-base">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0 mt-1" />
                    <span>{row.myGuys}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {vs.compareCta && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <a
                href={APP_LOGIN_URL}
                className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
              >
                Start my free week <ArrowRight className="w-4 h-4 ml-2" />
              </a>
              <a
                href="/demo/foreman"
                className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:border-orange-400 hover:text-orange-600 transition-colors"
              >
                Try the foreman view, no signup
              </a>
            </div>
          )}
        </section>

        {/* Weekly flow */}
        <section className="max-w-4xl mx-auto px-6 mt-20">
          <h2 className={`text-3xl font-bold text-slate-900 text-center ${vs.flowLink ? "mb-4" : "mb-10"}`}>
            {vs.flowHeading ?? "The same week on My Guys Time"}
          </h2>
          {vs.flowLink && (
            <p className="text-center mb-10">
              <a href={vs.flowLink.href} className="text-orange-600 font-semibold hover:underline">
                {vs.flowLink.label}
              </a>
            </p>
          )}
          <div className="space-y-6">
            {vs.flow.map((s, i) => (
              <div key={s.title} className="flex gap-4 bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{s.title}</h3>
                  <p className="text-slate-600">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {vs.fit && (
          <section className="max-w-5xl mx-auto px-6 mt-20">
            <div className="grid md:grid-cols-2 gap-6">
              {vs.fit.columns.map((column) => (
                <div key={column.heading} className="bg-white border border-slate-200 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">{column.heading}</h2>
                  <ul className="list-disc pl-5 space-y-3 text-slate-600">
                    {column.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {vs.fit.footer && (
              <p className="text-slate-600 leading-relaxed mt-6 text-center">
                <VsLinkedText parts={vs.fit.footer} />
              </p>
            )}
          </section>
        )}

        {/* Callout */}
        <section className="max-w-3xl mx-auto px-6 mt-20">
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">{vs.calloutTitle}</h2>
                <p className="text-slate-700 leading-relaxed">{vs.calloutText}</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 mt-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            {vs.faqHeading ?? `${vs.name} questions, answered straight`}
          </h2>
          <div className="space-y-4">
            {vs.faqs.map((f) => (
              <details key={f.q} className="bg-white border border-slate-200 rounded-xl p-5 group">
                <summary className="font-semibold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                  {f.q}
                  <span className="text-orange-500 text-xl leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-slate-600 mt-3">
                  <VsFaqAnswer faq={f} />
                </p>
              </details>
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="/faq" className="text-orange-600 hover:underline font-medium inline-flex items-center gap-1">
              <ClipboardList className="w-4 h-4" /> All frequently asked questions <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Other comparisons */}
        <section className="max-w-6xl mx-auto px-6 mt-20">
          <h2 className="text-xl font-bold text-slate-900 mb-4 text-center">Other comparisons</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {others.map((v) => (
              <a
                key={v.slug}
                href={`/vs/${v.slug}`}
                className="px-4 py-2 border border-slate-200 rounded-full text-sm text-slate-700 hover:border-orange-400 hover:text-orange-600 transition-colors bg-white"
              >
                vs {v.name}
              </a>
            ))}
          </div>
        </section>

        <CtaBand
          heading={vs.closingHeading ?? `Still on ${vs.name.toLowerCase()}? Try it free for 7 days.`}
          sub="One flat price. The whole crew. Cancel anytime."
        />
      </main>
      <MarketingFooter />
    </div>
  );
}

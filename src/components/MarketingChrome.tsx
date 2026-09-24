import { CheckCircle2, ArrowRight } from "lucide-react";

export const APP_LOGIN_URL = "https://app.myguystime.com/login";

export function startFreeWeek() {
  window.location.href = APP_LOGIN_URL;
}

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

export function MarketingHeader() {
  return (
    <header className="border-b border-slate-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <p className="text-2xl font-bold text-slate-900">My Guys Time</p>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-slate-600 hover:text-orange-500 transition-colors text-sm font-medium"
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={startFreeWeek}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Start my free week
          </button>
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-slate-900">My Guys Time</h4>
            </div>
            <p className="text-sm text-slate-600">
              Simple contractor hour tracking for small and multiple crews.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="hover:text-orange-500 transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Trades</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="/trades/roofing" className="hover:text-orange-500 transition-colors">Roofing</a></li>
              <li><a href="/trades/masonry" className="hover:text-orange-500 transition-colors">Masonry</a></li>
              <li><a href="/trades/landscaping" className="hover:text-orange-500 transition-colors">Landscaping</a></li>
              <li><a href="/trades/painting" className="hover:text-orange-500 transition-colors">Painting</a></li>
              <li><a href="/trades/plumbing" className="hover:text-orange-500 transition-colors">Plumbing</a></li>
              <li><a href="/trades/electrical" className="hover:text-orange-500 transition-colors">Electrical</a></li>
              <li><a href="/trades/general-contracting" className="hover:text-orange-500 transition-colors">General Contracting</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Comparisons</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="/vs/paper-timesheets" className="hover:text-orange-500 transition-colors">vs Paper Timesheets</a></li>
              <li><a href="/vs/quickbooks-time" className="hover:text-orange-500 transition-colors">vs QuickBooks Time</a></li>
              <li><a href="/vs/spreadsheets" className="hover:text-orange-500 transition-colors">vs Spreadsheets</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Try it</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="/demo/admin" className="hover:text-orange-500 transition-colors">
                  Live demo
                </a>
              </li>
              <li>
                <a href={APP_LOGIN_URL} className="hover:text-orange-500 transition-colors">
                  Start free week
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="mailto:jeff@myguystime.com" className="hover:text-orange-500 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-12 border-t border-slate-200 text-center text-sm text-slate-600">
          <p>&copy; 2026 My Guys Time. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export function CtaBand({
  heading = "Start my free week",
  sub = "7 days free. $12/mo flat after that. Cancel anytime.",
}: {
  heading?: string;
  sub?: string;
}) {
  return (
    <section className="max-w-6xl mx-auto px-6 mt-20">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl px-8 py-14 text-center shadow-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{heading}</h2>
        <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">{sub}</p>
        <button
          onClick={startFreeWeek}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-600 font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
        >
          {heading}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}

export function PageHero({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-16 pb-8 text-center">
      <p className="text-orange-600 font-semibold text-sm uppercase tracking-widest mb-4">{eyebrow}</p>
      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">{title}</h1>
      <p className="text-xl text-slate-600 max-w-3xl mx-auto">{sub}</p>
    </section>
  );
}

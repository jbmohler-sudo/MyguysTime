import { useState, useEffect } from 'react';
import { CheckCircle2, Truck, Eye, BarChart3, FileText, ArrowRight, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface WorkflowStep {
  number: number;
  title: string;
  description: string;
  details: string;
  icon: React.ReactNode;
}

const workflowSteps: WorkflowStep[] = [
  {
    number: 1,
    title: 'Enter hours in the truck',
    description: 'Fast, simple hour tracking for contractors in the field.',
    details: 'Built for real job sites, not office desks. Your crew logs hours directly from the field with an intuitive mobile-first interface.',
    icon: <Truck className="w-8 h-8" />,
  },
  {
    number: 2,
    title: 'Review the week in the office',
    description: 'See your entire crew in one place, with clear weekly status and day-by-day review.',
    details: 'It works as a small crew timecard app with clear weekly status and day-by-day review. Catch discrepancies before they slow the office down.',
    icon: <Eye className="w-8 h-8" />,
  },
  {
    number: 3,
    title: 'Adjust and finalize',
    description: 'Handle reimbursements, deductions, and mixed crews — W-2 and 1099.',
    details: 'Clean weekly review with all the details that matter to your bottom line.',
    icon: <BarChart3 className="w-8 h-8" />,
  },
  {
    number: 4,
    title: 'Export time cards',
    description: 'Export timesheets to CSV for the office handoff.',
    details: 'Just verified labor hour logs and a practical weekly handoff. The office gets exactly what it needs.',
    icon: <FileText className="w-8 h-8" />,
  },
];

const features = [
  'Contractor hour tracking app built for small crews',
  'Simple construction time card workflow',
  'Export timesheets to CSV for office handoff',
  'Manage multiple crews on different jobs seamlessly',
];

function ProductPreview() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50 hover:shadow-3xl transition-shadow duration-500">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Weekly crew board</h3>
          </div>
        </div>
        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
          Time-card ready
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="text-center">
          <p className="text-xs text-slate-600 mb-1">Weeks to review</p>
          <p className="text-2xl font-bold text-slate-900">3</p>
        </div>
        <div className="text-center border-l border-r border-slate-200">
          <p className="text-xs text-slate-600 mb-1">Hours logged</p>
          <p className="text-2xl font-bold text-slate-900">148</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-600 mb-1">Missing confirmations</p>
          <p className="text-2xl font-bold text-slate-900">2</p>
        </div>
      </div>

      {/* Crew Cards */}
      <div className="p-6 space-y-4">
        {/* Primary Card */}
        <div className="border border-slate-200 rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50/30 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-semibold text-slate-900">Luis Ortega</p>
              <p className="text-sm text-slate-600">Masonry Crew</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
              Foreman Approved
            </span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <div
                key={day}
                className={`text-center p-2 rounded border transition-all duration-300 ${
                  index === 2
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <p className="text-xs font-semibold text-slate-900">{day}</p>
                <p className="text-xs text-slate-600 mt-1">{index < 5 ? '7:00 - 3:30' : '--'}</p>
                <p className="text-xs font-bold text-slate-900 mt-1">{index < 5 ? '7.5h' : '0h'}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
              Adjusted
            </span>
            <p className="font-semibold text-slate-900">37.5h logged</p>
          </div>
        </div>

        {/* Secondary Card */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-all duration-300">
          <p className="font-semibold text-slate-900 mb-3">Office review</p>
          <p className="text-sm text-slate-600 mb-3">Time cards, exports, and office handoff</p>
          <ul className="space-y-2">
            {['Weekly summary CSV', 'Time detail CSV', 'Reimbursements and deductions', 'Private office-only reports'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-orange-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function PublicHomepage() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const [visibleFeatures, setVisibleFeatures] = useState<Set<number>>(new Set());
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallReady, setIsInstallReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    document.title = 'My Guys Time — Simple Time Cards for Contractor Crews | $12/mo Flat';
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepNumber = parseInt(entry.target.getAttribute('data-step') || '0');
            if (stepNumber > 0) {
              setVisibleSteps((prev) => new Set([...prev, stepNumber]));
            }

            const featureIndex = parseInt(entry.target.getAttribute('data-feature') || '-1');
            if (featureIndex >= 0) {
              setVisibleFeatures((prev) => new Set([...prev, featureIndex]));
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    document.querySelectorAll('[data-step], [data-feature]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const standaloneQuery =
      typeof window.matchMedia === "function" ? window.matchMedia("(display-mode: standalone)") : null;

    const syncInstalledState = () => {
      const installed =
        standaloneQuery?.matches === true ||
        ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
      setIsInstalled(installed);
      if (installed) {
        setDeferredInstallPrompt(null);
        setIsInstallReady(false);
      }
    };

    syncInstalledState();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
      setIsInstallReady(true);
    };

    const handleInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsInstallReady(false);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if (standaloneQuery) {
      if (typeof standaloneQuery.addEventListener === "function") {
        standaloneQuery.addEventListener("change", syncInstalledState);
      } else {
        standaloneQuery.addListener(syncInstalledState);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);

      if (standaloneQuery) {
        if (typeof standaloneQuery.removeEventListener === "function") {
          standaloneQuery.removeEventListener("change", syncInstalledState);
        } else {
          standaloneQuery.removeListener(syncInstalledState);
        }
      }
    };
  }, []);

  const handleStartClick = () => {
    window.location.href = 'https://app.myguystime.com/login';
  };

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);
    setIsInstallReady(false);
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">My Guys Time</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#workflow" className="text-slate-600 hover:text-orange-500 transition-colors text-sm font-medium">
              How It Works
            </a>
            <a href="#features" className="text-slate-600 hover:text-orange-500 transition-colors text-sm font-medium">
              Features
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-orange-500 transition-colors text-sm font-medium">
              Pricing
            </a>
            {isInstallReady && !isInstalled ? (
              <button
                onClick={() => void handleInstallApp()}
                className="px-5 py-2 border border-slate-300 hover:border-orange-500 text-slate-900 hover:text-orange-500 font-semibold rounded-lg transition-all duration-300"
              >
                Install app
              </button>
            ) : null}
            <button
              onClick={handleStartClick}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
              Start my free week
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold tracking-widest text-orange-600 uppercase">Simple Construction Time Cards</span>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mt-3">
                Track crew hours without the Thursday-at-5pm scramble.
              </h1>
            </div>

            <p className="text-lg text-slate-600 leading-relaxed">
              My Guys Time is a <strong>contractor hour tracking app</strong> built for small crews. Your guys log hours from the field, you review the week from the office, and the totals come out clean. Roofing, masonry, landscaping — any trade.
            </p>
            <p className="text-lg font-semibold text-orange-600 leading-relaxed">
              Stop using crinkled notebooks or scraps of wood from the jobsite to track hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleStartClick}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2">
                Start my free week
                <ArrowRight className="w-5 h-5" />
              </button>
              {isInstallReady && !isInstalled ? (
                <button
                  onClick={() => void handleInstallApp()}
                  className="px-8 py-4 border-2 border-slate-300 hover:border-orange-500 text-slate-900 hover:text-orange-500 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Install on this phone
                </button>
              ) : null}
              <a
                href="#workflow"
                className="px-8 py-4 border-2 border-slate-300 hover:border-orange-500 text-slate-900 hover:text-orange-500 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                See how it works
              </a>
            </div>

            <p className="text-sm font-semibold text-slate-700">
              $12/month flat for the whole company — 7 days free, no per-seat fees, cancel anytime.
            </p>

            <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-5">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-orange-600 uppercase">Live demo</p>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">See it working in 30 seconds.</h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Pick a role and poke around the real app — no signup, no password.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => { window.location.href = "/demo/admin"; }}
                    className="px-5 py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-all duration-300"
                  >
                    Start as Admin
                  </button>
                  <button
                    onClick={() => { window.location.href = "/demo/foreman"; }}
                    className="px-5 py-4 bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-900 font-semibold rounded-xl border border-slate-300 transition-all duration-300"
                  >
                    Start as Foreman
                  </button>
                  <button
                    onClick={() => { window.location.href = "/demo/employee"; }}
                    className="px-5 py-4 bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-900 font-semibold rounded-xl border border-slate-300 transition-all duration-300"
                  >
                    Start as Employee
                  </button>
                </div>
                {isInstalled ? (
                  <p className="text-sm font-medium text-slate-600">App is already installed on this device.</p>
                ) : null}
              </div>
            </div>

            <p className="text-sm text-slate-600 pt-4">
              Contractor hour tracking app for roofing, masonry, landscaping, and other small crews that need simple job site time cards without office bloat.
            </p>
          </div>

          {/* Right: Product Preview */}
          <div className="hidden lg:block">
            <ProductPreview />
          </div>
        </div>

        {/* Mobile Product Preview */}
        <div className="lg:hidden mt-12">
          <ProductPreview />
        </div>
      </section>

      {/* Founder Story Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <span className="text-xs font-semibold tracking-widest text-orange-600 uppercase">Why this exists</span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
            Built by a contractor, for contractors.
          </h2>
          <img
            src="/images/myguystime-story-hook.webp"
            alt="Contractor staring into the camera, overwhelmed, with math swirling around his head"
            className="rounded-2xl shadow-xl w-full"
          />
          <div className="text-left text-lg text-slate-600 leading-relaxed space-y-4">
            <p>
              I used to track hours on a chunk of 2x6 I kept behind the truck seat. Scribble the hours, done. It worked fine when it was my small crew and I was there to write it down.
            </p>
            <img
              src="/images/myguystime-story-2x8.jpg"
              alt="Hand writing crew hours on a 2x8 with a carpenter&apos;s pencil"
              className="rounded-2xl shadow-xl w-full"
            />
            <p>
              Then I put a foreman on a second crew, and every Thursday at 5pm they&apos;d try to reconstruct the entire week from memory while trying to get home. It was a mess.
            </p>
            <p>
              I went looking on the Play Store. Everything was built for office people, and every one of them wanted to charge me per guy. Absurd that an app costs more because you hired another person.
            </p>
            <p>
              So I built the app I actually wanted: one flat price, the whole crew. W-2s and 1099s, petty cash, and reimbursements for when the guys have to spend their own money. A contractor&apos;s app, made by one.
            </p>
          </div>
        </div>
      </section>

      {/* Bridge Section */}
      <section className="bg-gradient-to-r from-orange-50 to-orange-50/50 py-16 border-y border-orange-200/50">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <span className="text-xs font-semibold tracking-widest text-orange-600 uppercase">Why crews use it</span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
            The bridge between the job site and the office, without the bloat
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            This is the missing middle. Not a heavy office system. Just a clean way to check hours, review the week, and hand off time-card totals.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        {/* Workflow Section */}
        <section id="workflow" className="mb-32">
          <div className="mb-20">
            <div className="inline-block mb-4">
              <span className="text-xs font-semibold tracking-widest text-orange-600 uppercase">How it works</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              Simple weekly workflow for crews and office
            </h2>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-12 md:space-y-16">
            {workflowSteps.map((step, index) => {
              const isVisible = visibleSteps.has(step.number);
              const isExpanded = expandedStep === step.number;
              const isLeft = index % 2 === 0;

              return (
                <div
                  key={step.number}
                  data-step={step.number}
                  className={`transition-all duration-700 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  <div className={`flex gap-8 md:gap-12 items-stretch ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                    {/* Left Side - Step Indicator */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="relative">
                        {/* Step Circle */}
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 ${
                            isExpanded
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110'
                              : 'bg-white border-2 border-slate-200 text-slate-900 shadow-sm'
                          }`}
                        >
                          {step.number}
                        </div>
                        {/* Connecting Line */}
                        {index < workflowSteps.length - 1 && (
                          <div
                            className={`absolute top-16 left-1/2 -translate-x-1/2 w-1 h-20 md:h-24 transition-all duration-700 ${
                              isExpanded ? 'bg-orange-500' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Right Side - Content Card */}
                    <div className="flex-1 pt-2">
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.number)}
                        className="w-full text-left transition-all duration-500 group"
                      >
                        <div
                          className={`card p-6 md:p-8 rounded-xl border-2 transition-all duration-500 ${
                            isExpanded
                              ? 'border-orange-500 bg-orange-50 shadow-lg'
                              : 'border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300'
                          }`}
                        >
                          {/* Step Label */}
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-semibold tracking-widest text-orange-600 uppercase">
                              Step {step.number}
                            </span>
                            <div
                              className={`text-slate-400 transition-transform duration-500 ${
                                isExpanded ? 'text-orange-500 rotate-90' : 'group-hover:text-slate-600'
                              }`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>

                          {/* Icon and Title */}
                          <div className="flex items-start gap-4 mb-3">
                            <div
                              className={`p-3 rounded-lg transition-all duration-500 ${
                                isExpanded
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                              }`}
                            >
                              {step.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                                {step.title}
                              </h3>
                              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          <div
                            className={`overflow-hidden transition-all duration-500 ${
                              isExpanded ? 'max-h-48 opacity-100 mt-4 pt-4 border-t border-orange-200' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <p className="text-slate-600 leading-relaxed">
                              {step.details}
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mb-32">
          <div className="mb-16">
            <div className="inline-block mb-4">
              <span className="text-xs font-semibold tracking-widest text-orange-600 uppercase">Feature snapshot</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              Small feature list, focused on weekly work—no bloat
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const isVisible = visibleFeatures.has(index);
              return (
                <div
                  key={index}
                  data-feature={index}
                  className={`flex items-start gap-4 p-6 rounded-lg border-2 border-slate-200 bg-white hover:border-orange-500 hover:bg-orange-50/30 transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${index * 100}ms` : '0ms',
                  }}
                >
                  <Check className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700 font-medium leading-relaxed">{feature}</p>
                </div>
              );
            })}
          </div>
        </section>

          {/* Pricing Section */}
        <section id="pricing" className="mb-32">
          <div className="mb-16 text-center">
            <span className="text-xs font-semibold tracking-widest text-orange-600 uppercase">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mt-4">
              One price. The whole crew.
            </h2>
          </div>

          <div className="max-w-2xl mx-auto bg-white rounded-2xl border-2 border-orange-500 shadow-xl p-8 md:p-12">
            <div className="text-center mb-8">
              <p className="text-5xl font-bold text-slate-900">$12<span className="text-xl font-semibold text-slate-600">/month</span></p>
              <p className="text-slate-600 mt-2">Flat. No per-seat fees, no tiers, no surprises.</p>
            </div>
            <ul className="space-y-4 mb-8">
              {[
                'Every foreman, worker, and office user included',
                '7 days free — run a full pay period before you pay a dime',
                'Hiring another guy never raises your bill',
                'Cancel anytime from the billing portal — no contracts, no phone calls',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-700 font-medium">
                  <Check className="w-6 h-6 text-orange-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={handleStartClick}
              className="w-full px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Start my free week
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="mb-32">
          <div className="mb-16">
            <span className="text-xs font-semibold tracking-widest text-orange-600 uppercase">Questions</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mt-4">
              Asked by contractors, answered straight
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              { q: 'Do I need to install anything?', a: "No app store, no downloads forced on anyone. It runs in the browser and installs to the home screen like an app on any phone." },
              { q: 'Do I pay per employee?', a: "No. $12 a month covers the entire company — foremen, workers, office, all of them." },
              { q: 'Does it handle 1099 subs or just W-2 guys?', a: "Both. Mixed crews are normal; the app doesn't care how you classify them." },
              { q: 'What if my guys buy materials out of pocket?', a: "Log it as a reimbursement or petty cash right on the time card. It lands in the weekly totals." },
              { q: 'What happens after the 7-day trial?', a: "The $12/month subscription starts. Cancel anytime before that and you pay nothing." },
              { q: 'Can I cancel?', a: "Anytime, from the billing portal. No contract, no retention call." },
            ].map((item) => (
              <div key={item.q} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.q}</h3>
                <p className="text-slate-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

      {/* Trust Section */}
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-12 md:p-16 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <span className="text-xs font-semibold tracking-widest text-orange-400 uppercase">No bloat</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
              The missing middle between the job site and the office.
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Not a heavy office system with seventeen modules you&apos;ll never open. Just clean hour tracking, weekly review, and totals the office can actually use.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
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
                <li>
                  <a href="#workflow" className="hover:text-orange-500 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-orange-500 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-orange-500 transition-colors">
                    FAQ
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
    </div>
  );
}

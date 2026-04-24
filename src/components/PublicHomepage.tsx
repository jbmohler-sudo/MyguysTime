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
    description: 'See your entire crew in one place. Perfect for small crew timecard management.',
    details: 'It works as a small crew timecard app with clear weekly status and day-by-day review. Catch discrepancies before they become payroll issues.',
    icon: <Eye className="w-8 h-8" />,
  },
  {
    number: 3,
    title: 'Adjust and finalize',
    description: 'Handle reimbursements, deductions, and mixed crews. Works as a simple subcontractor 1099 tracker.',
    details: 'It also works as a simple subcontractor 1099 tracker when you need clean weekly review. Manage all the details that matter to your bottom line.',
    icon: <BarChart3 className="w-8 h-8" />,
  },
  {
    number: 4,
    title: 'Export checks',
    description: 'Export timesheets to CSV for your accountant. No payroll system required.',
    details: 'No payroll system required, just verified labor hour logs and a practical weekly handoff. Your accountant gets exactly what they need.',
    icon: <FileText className="w-8 h-8" />,
  },
];

const features = [
  'Contractor hour tracking app built for small crews',
  'Simple construction payroll prep workflow',
  'Export timesheets to CSV for accountant handoff',
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
          Payroll-prep ready
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="text-center">
          <p className="text-xs text-slate-600 mb-1">Weeks to review</p>
          <p className="text-2xl font-bold text-slate-900">3</p>
        </div>
        <div className="text-center border-l border-r border-slate-200">
          <p className="text-xs text-slate-600 mb-1">Net estimate</p>
          <p className="text-2xl font-bold text-slate-900">$4,982</p>
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
            <p className="font-semibold text-slate-900">Net check: $1,248</p>
          </div>
        </div>

        {/* Secondary Card */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-all duration-300">
          <p className="font-semibold text-slate-900 mb-3">Office review</p>
          <p className="text-sm text-slate-600 mb-3">Checks, exports, and accountant handoff</p>
          <ul className="space-y-2">
            {['Payroll summary CSV', 'Time detail CSV', 'Reimbursements and deductions', 'Private office-only reports'].map((item) => (
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

interface PublicHomepageProps {
  onStartDemo: (role: "admin" | "foreman" | "employee") => Promise<void>;
}

export function PublicHomepage({ onStartDemo }: PublicHomepageProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const [visibleFeatures, setVisibleFeatures] = useState<Set<number>>(new Set());
  const [launchingRole, setLaunchingRole] = useState<"admin" | "foreman" | "employee" | null>(null);
  const [demoError, setDemoError] = useState("");
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallReady, setIsInstallReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    document.title = 'Contractor Hour Tracking App | My Guys Time';
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

  const handleDemoStart = async (role: "admin" | "foreman" | "employee") => {
    setDemoError("");
    setLaunchingRole(role);
    try {
      await onStartDemo(role);
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : "Unable to open the demo right now.");
    } finally {
      setLaunchingRole(null);
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
              Start your week
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
              <span className="text-xs font-semibold tracking-widest text-orange-600 uppercase">Simple Construction Payroll Prep</span>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mt-3">
                Track Crew Hours &amp; Prep Payroll in Seconds—Built for Contractors
              </h1>
            </div>

            <p className="text-lg text-slate-600 leading-relaxed">
              My Guys Time is a simple <strong>contractor hour tracking app</strong> built for small crews. Track your guys' hours, review the week, and export clean totals for your accountant. Perfect for roofing, masonry, landscaping, and other trades.
            </p>
            <p className="text-lg font-semibold text-orange-600 leading-relaxed">
              Stop using crinkled notebooks or scraps of wood from the jobsite to track hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleStartClick}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2">
                Start your week
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

            <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-5">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-orange-600 uppercase">Live Demo Access</p>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">Jump straight into the real app by role</h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Use seeded demo users so we can inspect the live interface without typing passwords every time.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => void handleDemoStart("admin")}
                    disabled={launchingRole !== null}
                    className="px-5 py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-all duration-300"
                  >
                    {launchingRole === "admin" ? "Opening admin..." : "Start as Admin"}
                  </button>
                  <button
                    onClick={() => void handleDemoStart("foreman")}
                    disabled={launchingRole !== null}
                    className="px-5 py-4 bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-900 font-semibold rounded-xl border border-slate-300 transition-all duration-300"
                  >
                    {launchingRole === "foreman" ? "Opening foreman..." : "Start as Foreman"}
                  </button>
                  <button
                    onClick={() => void handleDemoStart("employee")}
                    disabled={launchingRole !== null}
                    className="px-5 py-4 bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-900 font-semibold rounded-xl border border-slate-300 transition-all duration-300"
                  >
                    {launchingRole === "employee" ? "Opening employee..." : "Start as Employee"}
                  </button>
                </div>
                {demoError ? (
                  <p className="text-sm font-medium text-red-600">{demoError}</p>
                ) : null}
                {isInstalled ? (
                  <p className="text-sm font-medium text-slate-600">App is already installed on this device.</p>
                ) : null}
              </div>
            </div>

            <p className="text-sm text-slate-600 pt-4">
              Contractor hour tracking app for roofing, masonry, landscaping, and other small crews that need simple construction payroll prep without full payroll software.
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

      {/* Bridge Section */}
      <section className="bg-gradient-to-r from-orange-50 to-orange-50/50 py-16 border-y border-orange-200/50">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <span className="text-xs font-semibold tracking-widest text-orange-600 uppercase">Why crews use it</span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
            The bridge between the job site and your accountant—no bloat, just payroll prep
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            This is the missing middle. Not full payroll. Not a heavy office system. Just a clean way to check hours, review the week, and hand off payroll-ready totals.
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
              Simple weekly workflow for crews and office—from field to accountant
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

        {/* Trust Section */}
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-12 md:p-16 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <span className="text-xs font-semibold tracking-widest text-orange-400 uppercase">Payroll Prep Reminder</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
              Built for payroll preparation, not payroll processing
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              My Guys Time helps you track hours, review totals, and estimate paychecks and withholdings. Always verify numbers before issuing checks or finalizing payroll. This app is designed to prepare data for your accountant, not to process payroll directly.
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
                Simple contractor hour tracking and payroll prep for small and multiple crews.
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
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-orange-500 transition-colors">
                    About
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-orange-500 transition-colors">
                    Privacy
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

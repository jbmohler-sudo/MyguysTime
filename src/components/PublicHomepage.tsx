import { useState, useEffect } from 'react';
import { CheckCircle2, Truck, Eye, BarChart3, FileText, ArrowRight, Check } from 'lucide-react';
import { useLocation } from 'wouter';

/**
 * Design Philosophy: Modern Minimalist with Progressive Disclosure
 * Applied across entire marketing homepage for "My Guys Time"
 * - Staggered left-right layout for workflow steps
 * - Progressive disclosure: details reveal on interaction
 * - Scroll-triggered animations feel natural and purposeful
 * - Construction orange accent (#FF6B35) ties to industry
 * - Minimal color palette (off-white, slate, orange) feels premium
 * - Product preview mock-up integrated seamlessly
 * - SEO-optimized with keyword-rich content and proper heading hierarchy
 */

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
  'Verified labor hour logs for weekly review',
  'Small crew management (2–15 workers)',
  'Manage multiple crews on different jobs seamlessly',
  'Subcontractor 1099 and W-2 tracking in one board',
  'Perfect for roofers, masons, landscapers, and construction crews',
  'Fast load time, mobile-first design for job sites',
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

export default function PublicHomepage() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const [visibleFeatures, setVisibleFeatures] = useState<Set<number>>(new Set());
  const [, navigate] = useLocation();

  // Set page title and meta tags dynamically for SEO
  useEffect(() => {
    document.title = 'Contractor Hour Tracking App | My Guys Time';
  }, []);

  // Intersection observer for scroll-triggered animations
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

  const handleStartClick = () => {
    navigate('/login');
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
            <a href="#workflow" className="text-slate-
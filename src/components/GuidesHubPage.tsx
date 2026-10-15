import { MarketingBreadcrumb, MarketingFooter, MarketingHeader } from "./MarketingChrome";

export const guidesHubItems: { href: string; title: string; description: string }[] = [
  {
    href: "/guides/how-contractors-track-crew-hours",
    title: "How Contractors Track Crew Hours",
    description:
      "Paper time cards, a spreadsheet, or a crew app: what each one does well, and where a small crew outgrows it.",
  },
  {
    href: "/guides/do-1099-subs-get-overtime",
    title: "Do 1099 Subs Get Overtime?",
    description:
      "A crew owner's plain answer for mixed W-2 and 1099 crews. General information, not legal or tax advice.",
  },
  {
    href: "/templates/construction-timesheet-template",
    title: "Free Construction Timesheet Template",
    description:
      "A weekly crew time card for the truck: the job, start and end, daily and weekly hours, and a foreman sign-off. PDF or Excel.",
  },
  {
    href: "/templates/time-to-decimal-chart",
    title: "Time to Decimal Chart",
    description:
      "Minutes to decimal hours, from 1 to 60, for writing a time card, plus decimal hours back to minutes.",
  },
];

export function GuidesHubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingHeader />
      <main>
        <MarketingBreadcrumb
          items={[
            { name: "Home", href: "/" },
            { name: "Construction Time Tracking", href: "/construction-time-tracking" },
            { name: "Guides" },
          ]}
        />

        <article className="max-w-3xl mx-auto px-6 pt-8 pb-16">
          <p className="text-orange-600 font-semibold text-sm uppercase tracking-widest mb-4">
            Construction time tracking
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Guides and Templates for Construction Crew Hours
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Plain-language guides and free templates for contractors who track crew hours. They sit under{" "}
            <a href="/construction-time-tracking" className="text-orange-600 font-semibold hover:underline">
              construction time tracking
            </a>
            . My Guys Time is $12/month flat for the whole company, and each person uses his own phone.
          </p>

          <ul className="mt-10 space-y-8">
            {guidesHubItems.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-xl font-semibold text-orange-600 hover:underline">
                  {item.title}
                </a>
                <p className="text-slate-600 mt-2 leading-relaxed">{item.description}</p>
              </li>
            ))}
          </ul>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}

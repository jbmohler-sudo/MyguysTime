import { ArrowRight } from "lucide-react";
import { MarketingBreadcrumb, MarketingFooter, MarketingHeader } from "./MarketingChrome";

export const overtimeGuideFaqItems: { q: string; a: string }[] = [
  {
    q: "Do 1099 employees get paid overtime?",
    a: "A true independent contractor isn't covered by the FLSA's overtime rules. But a \"1099 employee\" is really either one or the other, and the 1099 form doesn't decide which. A worker who is actually an employee may be owed overtime. This is general information, not legal advice.",
  },
  {
    q: "How many hours can a 1099 sub work?",
    a: "There's no federal cap. The contract sets it. But a full-time schedule set by one company is one of the signals the DOL looks at when deciding whether someone is really an employee.",
  },
  {
    q: "Are independent contractors exempt from overtime?",
    a: "Not \"exempt\" in the legal sense. In FLSA terms, \"exempt\" describes certain employees who aren't owed overtime. Independent contractors simply aren't covered by the law's overtime rules in the first place, because they aren't employees.",
  },
  {
    q: "Is it better to pay my guys 1099 or W-2?",
    a: "It isn't really a choice you make to save money. The working relationship decides it, under federal and state rules. If you're not sure, talk to a CPA or employment attorney before you set anyone up.",
  },
  {
    q: "Does My Guys Time handle W-2 and 1099 guys together?",
    a: "Yes. Both go on one weekly crew board with the foreman's approval. It doesn't calculate overtime, pay or taxes, and it doesn't classify anyone.",
  },
];

function TextLink({
  href,
  children,
  external,
}: {
  href: string;
  children: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      className="text-orange-600 font-semibold hover:underline"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export function Do1099SubsOvertimePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingHeader />
      <main>
        <MarketingBreadcrumb
          items={[
            { name: "Home", href: "/" },
            { name: "Construction Time Tracking", href: "/construction-time-tracking" },
            { name: "Do 1099 Subs Get Overtime?" },
          ]}
        />

        <article className="max-w-3xl mx-auto px-6 pt-8 pb-4">
          <p className="text-orange-600 font-semibold text-sm uppercase tracking-widest mb-4">
            Guide · W-2 and 1099 crews
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Do 1099 Subs Get Overtime? A Crew Owner's Plain Answer
          </h1>
          <p className="text-slate-500 italic mb-6">By Jeff Mohler, founder of My Guys Time</p>
          <p className="text-slate-700 leading-relaxed mb-6">
            This is a contractor's plain-English overview, not legal or tax advice. Rules vary by state and change.
            Talk to an employment attorney or CPA about your crew.
          </p>
          <p className="text-lg text-slate-700 leading-relaxed">
            Under federal law, overtime is owed to employees, not to independent contractors, so a true 1099 sub isn't
            owed time-and-a-half. But calling someone a 1099 doesn't make him one. If you set his hours, supply his
            tools and he only works for you, the Department of Labor may see an employee who is owed overtime. Some
            states are stricter. When in doubt, ask an employment attorney.
          </p>
        </article>

        <section className="max-w-3xl mx-auto px-6 mt-10">
          <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
            <p>
              Picture a Friday in July. You've got three W-2 laborers and a 1099 sub on the same wall, and everybody
              put in 50 hours that week to beat the rain. The laborers' overtime is a question for whoever runs your
              payroll. But what about the sub? Does he get time-and-a-half too?
            </p>
            <p>
              I've had mixed crews like that. Here's what I learned, in plain words, with links to where the government
              says it. I'm a contractor, not a lawyer, so read this as a starting point, not the final word.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">The short answer</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              The federal overtime law is the Fair Labor Standards Act (FLSA). According to the{" "}
              <TextLink href="https://www.dol.gov/agencies/whd/overtime" external>
                Department of Labor
              </TextLink>
              , unless they're exempt, employees covered by the law must get overtime pay for hours worked over 40 in
              a workweek, at not less than one and a half times their regular rate.
            </p>
            <p>
              That law covers employees. The DOL's{" "}
              <TextLink href="https://www.dol.gov/agencies/whd/fact-sheets/13-flsa-employment-relationship" external>
                Fact Sheet 13
              </TextLink>{" "}
              says independent contractors are in business for themselves and aren't covered by the FLSA, so they
              don't get its overtime protections.
            </p>
            <p>
              So a real independent contractor isn't owed federal overtime. The catch is the word "real." The same fact
              sheet says what you call a worker doesn't decide it. Getting a 1099, getting paid off the books, or
              signing an independent contractor agreement doesn't by itself make someone an independent contractor
              under the FLSA.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            What makes someone a 1099 sub vs an employee, in crew terms
          </h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              The DOL looks at the "economic reality" of the whole working relationship: is the worker in business for
              himself, or does he depend on you for work? No single factor settles it. The fact sheet lists six
              factors. Here's how they tend to show up on a job site. These are questions to think about, not a test
              you can score yourself:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-slate-900">Can he make or lose money on how he runs his business?</strong> Does
                he bid his own jobs, hire his own helpers, buy his own materials, and turn work down when he's busy? Or
                does he just work the hours you give him?
              </li>
              <li>
                <strong className="text-slate-900">Whose investment is it?</strong> Owning his own truck, trailer and
                equipment to run a business points one way. Buying a few hand tools for your job doesn't count for
                much.
              </li>
              <li>
                <strong className="text-slate-900">How permanent is it?</strong> A specialty sub who comes in for one
                phase of a project and works for other contractors is different from a guy who's been on your crew
                every day for two years.
              </li>
              <li>
                <strong className="text-slate-900">Who controls the work?</strong> Who sets his schedule, his start
                time, his pay rate? Can he work for other people?
              </li>
              <li>
                <strong className="text-slate-900">Is the work a core part of your business?</strong> A laborer on a
                masonry crew doing masonry work is doing exactly what your company sells. A specialty trade you rarely
                need is different.
              </li>
              <li>
                <strong className="text-slate-900">Is he using his skill to run a business?</strong> Being highly
                skilled isn't enough. The question is whether he markets that skill and runs it like a business.
              </li>
            </ul>
            <p>
              The IRS has its own guidance for tax purposes. Its page on{" "}
              <TextLink
                href="https://www.irs.gov/businesses/small-businesses-self-employed/independent-contractor-self-employed-or-employee"
                external
              >
                independent contractor or employee
              </TextLink>{" "}
              groups the evidence into three categories: behavioral control, financial control, and the type of
              relationship. The questions overlap a lot with the DOL list.
            </p>
            <p>
              One more thing. The federal rules on this have been changing. Fact Sheet 13 currently notes a rule from
              2024 that is being challenged in court, enforcement guidance from 2025, and a new proposed rule announced
              in February 2026. Check the DOL page for where things stand when you read this.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">State rules can be stricter</h2>
          <p className="text-slate-600 leading-relaxed">
            Federal law is the floor. Some states use a tougher test. California is the best-known example: its{" "}
            <TextLink href="https://www.dir.ca.gov/dlse/faq_independentcontractor.htm" external>
              Labor Commissioner
            </TextLink>{" "}
            explains the "ABC test," which starts by assuming a worker is an employee and puts it on the hiring
            business to prove otherwise. Other states have their own rules. Check with your state labor department.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">How many hours can a 1099 sub work?</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              There's no federal limit on the hours an independent contractor can work. His contract and his own
              business decide that. And for employees, the DOL says the FLSA doesn't cap hours for workers 16 and older
              either; it requires overtime pay past 40.
            </p>
            <p>
              But hours can be a signal. A "sub" working a full-time schedule you set, for your company only, week
              after week, looks a lot like the control and permanence factors above. Those are the kinds of facts that
              can tip the answer.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">What to keep on paper for a mixed crew</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              Whatever the answer is for any one guy, good records make every conversation easier. Here's what I'd
              keep:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-slate-900">
                  Daily hours for everybody, W-2 and 1099, written down the day they're worked.
                </strong>{" "}
                Not rebuilt on Thursday from texts and memory.
              </li>
              <li>
                <strong className="text-slate-900">Who approved the hours.</strong> A foreman's sign-off on the week.
              </li>
              <li>
                <strong className="text-slate-900">Receipts</strong> for anything a guy bought for the job.
              </li>
            </ul>
            <p>
              For employees, the FLSA has recordkeeping rules. DOL{" "}
              <TextLink href="https://www.dol.gov/agencies/whd/fact-sheets/21-flsa-recordkeeping" external>
                Fact Sheet 21
              </TextLink>{" "}
              lists what employers must keep for non-exempt workers, including hours worked each day and total hours
              each workweek. It also says any timekeeping method is acceptable as long as it's complete and accurate.
              Many owners keep the same daily record for their subs too, so there's no gap if a question ever comes
              up.
            </p>
            <p>
              That's the part My Guys Time handles. W-2 guys and 1099 subs go on the same weekly crew board, hours get
              logged daily, the foreman approves the week, and receipt photos ride on the card.{" "}
              <strong className="text-slate-900">
                It doesn't calculate overtime, pay or taxes, and it doesn't decide who's an employee.
              </strong>{" "}
              The office hands the approved hours to whoever runs payroll, and they take it from there. See how that
              works for a{" "}
              <TextLink href="/trades/general-contracting">GC's W-2 crew and 1099 subs</TextLink>, or read more on{" "}
              <TextLink href="/guides/how-contractors-track-crew-hours">how contractors track crew hours</TextLink>.
              More of these sit on the <TextLink href="/guides">guides</TextLink> page.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">If you think you've got it wrong</h2>
          <p className="text-slate-600 leading-relaxed">
            Don't panic and don't guess. Talk to an employment attorney or your CPA, and bring your records. If a
            worker's status is still unclear, the IRS says a business or a worker can file{" "}
            <TextLink href="https://www.irs.gov/forms-pubs/about-form-ss-8" external>
              Form SS-8
            </TextLink>{" "}
            to ask the IRS to determine it for federal tax purposes. The IRS notes it can take at least six months to
            get an answer. The DOL's Wage and Hour Division also takes questions at 1-866-487-9243.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">1099 subs and overtime: common questions</h2>
          <div className="space-y-4">
            {overtimeGuideFaqItems.map((item) => (
              <details key={item.q} className="bg-white border border-slate-200 rounded-xl p-5 group">
                <summary className="font-semibold text-slate-900 cursor-pointer list-none flex justify-between items-center gap-4">
                  {item.q}
                  <span className="text-orange-500 text-xl leading-none group-open:rotate-45 transition-transform shrink-0">
                    +
                  </span>
                </summary>
                <p className="text-slate-600 mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="max-w-3xl mx-auto px-6 mt-16 text-slate-600 leading-relaxed">
          This guide is general information from a contractor, not legal or tax advice. Laws differ by state and
          change over time. For your crew, check the DOL, the IRS and your state labor department, and talk to an
          employment attorney or CPA.
        </p>

        <section className="max-w-6xl mx-auto px-6 mt-8">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl px-8 py-14 text-center shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Keep everyone's hours on one board.</h2>
            <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
              W-2 guys and 1099 subs, logged daily, approved by the foreman. $12/month flat for the whole company.
              7-day free trial, no card.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-orange-600 font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
              >
                Start my free week
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="/construction-time-tracking"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-colors text-lg"
              >
                Construction time tracking
              </a>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

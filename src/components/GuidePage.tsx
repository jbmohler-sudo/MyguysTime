import { ArrowRight } from "lucide-react";
import { APP_LOGIN_URL, MarketingFooter, MarketingHeader } from "./MarketingChrome";

export const guideFaqItems: { q: string; a: string }[] = [
  {
    q: "How can I track my hours for work?",
    a: "Write them down the day you work them, not at the end of the week. A paper card, a spreadsheet or an app all work if you fill it in daily. Memory is what makes hours drift.",
  },
  {
    q: "What is the best free way to track work hours?",
    a: "A printed or spreadsheet time card costs nothing. Our construction timesheet template is a free download (PDF or Excel). Some apps also have free plans, usually capped by users or features. My Guys Time isn't free: it's a 7-day trial with no card, then $12/month flat for the whole company.",
  },
  {
    q: "Is there an app that can track my work hours?",
    a: "Yes, plenty. Which one fits depends on whether you need GPS, scheduling or a free plan. See the best time tracking apps for small construction crews. For a crew run by a foreman, My Guys Time is a weekly crew time card at one flat price.",
  },
  {
    q: "Is it legal to track salaried employees' hours?",
    a: "The rules depend on where you are and how each person is classified. Ask your payroll provider or an employment attorney. We don't give legal advice.",
  },
  {
    q: "How do contractors track employee hours on a job site?",
    a: "The method that holds up is the foreman logging the crew's hours on the job, the same day, before anybody leaves. Then he signs off on the week, and the office reviews it once. That's the workflow My Guys Time is built around. See how it works.",
  },
];

const FAQ_LINKS: Record<string, { phrase: string; href: string }> = {
  "What is the best free way to track work hours?": {
    phrase: "construction timesheet template",
    href: "/templates/construction-timesheet-template",
  },
  "Is there an app that can track my work hours?": {
    phrase: "the best time tracking apps for small construction crews",
    href: "/best-construction-time-tracking-apps",
  },
  "How do contractors track employee hours on a job site?": {
    phrase: "how it works",
    href: "/how-it-works",
  },
};

function TextLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className="text-orange-600 font-semibold hover:underline">
      {children}
    </a>
  );
}

function FaqAnswer({ item }: { item: { q: string; a: string } }) {
  const link = FAQ_LINKS[item.q];
  if (!link) return <>{item.a}</>;
  const index = item.a.indexOf(link.phrase);
  if (index === -1) return <>{item.a}</>;
  return (
    <>
      {item.a.slice(0, index)}
      <TextLink href={link.href}>{link.phrase}</TextLink>
      {item.a.slice(index + link.phrase.length)}
    </>
  );
}

export function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <MarketingHeader />
      <main>
        <nav aria-label="Breadcrumb" className="max-w-3xl mx-auto px-6 pt-8 text-sm text-slate-500">
          <a href="/" className="hover:text-orange-600">
            Home
          </a>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <a href="/construction-time-tracking" className="hover:text-orange-600">
            Construction Time Tracking
          </a>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-slate-700">How Contractors Track Crew Hours</span>
        </nav>

        <article className="max-w-3xl mx-auto px-6 pt-8 pb-4">
          <p className="text-orange-600 font-semibold text-sm uppercase tracking-widest mb-4">Guide for crew owners</p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            How Contractors Track Crew Hours: Paper vs Spreadsheet vs App
          </h1>
          <p className="text-slate-500 italic mb-6">By Jeff Mohler, founder of My Guys Time</p>
          <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
            <p>
              It's Thursday, a little after five. The trucks are back, everybody wants to go home, and you're standing
              in the yard asking your foreman what time the crew got to Tuesday's job. He thinks it was seven. Maybe
              seven-thirty. The concrete truck was late, so maybe they started on the other site first.
            </p>
            <p>
              That conversation is how most small outfits track hours, whatever the paperwork says. This guide is about
              the three ways contractors actually do it (paper, spreadsheets and apps), what each one is good at, and
              the point where each one stops working. Honest tradeoffs, not a feature list.
            </p>
          </div>
          <p className="text-lg text-slate-700 leading-relaxed mt-8">
            Most small contractors start on paper, move hours into a spreadsheet on Thursday, then look for an app when
            a second foreman shows up and the week can't be rebuilt from memory. Paper is fine for one crew you see
            every day. Spreadsheets help the office and still fail in the truck. A simple crew time card app gets hours
            in the day they're worked. My Guys Time is $12/month flat for the whole company.
          </p>
        </article>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Paper time cards: what still works</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              Paper has one big thing going for it: everybody understands it. No logins, no phones, no training. Hand a
              guy a card and a pencil and he knows what to do. It costs next to nothing, and if you're on the job with
              your crew every day, you can check it with your own eyes.
            </p>
            <p>Where it falls apart:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-slate-900">Cards go missing.</strong> They ride around in pockets, lunch boxes
                and cup holders. Some of them come back. Some come back wet.
              </li>
              <li>
                <strong className="text-slate-900">Nobody can read them.</strong> Is that a 7 or a 1? By Friday, the guy
                who wrote it doesn't remember either.
              </li>
              <li>
                <strong className="text-slate-900">Somebody retypes everything.</strong> Every hour on paper gets
                entered again by whoever does the books. That's two chances to get it wrong.
              </li>
              <li>
                <strong className="text-slate-900">Receipts drift away from the hours.</strong> The supply-house run is
                on one slip, the hours are on another, and the two never meet up.
              </li>
            </ul>
            <p>
              If you're sticking with paper for now, use a card that asks for the right things every day: job, start,
              end, hours, and a foreman signature at the end of the week. Our{" "}
              <TextLink href="/templates/construction-timesheet-template">free construction timesheet template</TextLink>{" "}
              is a weekly crew card you can download as a PDF or Excel file. And here's a straight comparison of{" "}
              <TextLink href="/vs/paper-timesheets">paper timesheets vs an app</TextLink>.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Spreadsheets: better for the office, not the truck</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              A spreadsheet is where most outfits go next, usually because the bookkeeper asked for it. It adds the
              totals for you, it's easy to send around, and it's a lot easier to read than pencil on cardboard.
            </p>
            <p>
              The trouble is who fills it in, and when. Foremen don't update spreadsheets from the job. They're running
              a crew. So the spreadsheet usually gets filled in on Thursday, from paper cards, texts and memory. That
              means the spreadsheet is cleaner, but the hours going into it are just as shaky as before.
            </p>
            <p>
              Then there are the copies. One version on the office computer, one emailed to the bookkeeper, one with
              Tuesday fixed and Wednesday not. Somebody always ends up asking which one is right.
            </p>
            <p>
              A spreadsheet is a good tool for the office. It just doesn't solve the part that happens in the truck.
              More on that in <TextLink href="/vs/spreadsheets">spreadsheets vs an app</TextLink>.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Crew time apps: three shapes</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>Once you go looking for an app, you'll find they come in about three shapes. They're priced differently and built for different outfits.</p>
            <h3 className="text-xl font-bold text-slate-900 pt-2">Per-user GPS platforms</h3>
            <p>
              These verify time with GPS, often with geofences, scheduling and job costing built in. They're strong
              when you can't be on every site and need proof of who was where. They're usually priced per user per
              month, sometimes with a base fee or admin license on top, so the bill grows with your crew. See how two
              of them compare in <TextLink href="/vs/workyard">Workyard vs My Guys Time</TextLink> and{" "}
              <TextLink href="/vs/busybusy">BusyBusy vs My Guys Time</TextLink>.
            </p>
            <h3 className="text-xl font-bold text-slate-900 pt-2">Free all-in-one apps with a cap</h3>
            <p>
              Some apps bundle a time clock with scheduling, chat and HR tools, and they're free up to a set number of
              users. For a very small team that's a real deal. Once you pass the cap, you're picking paid plans. See{" "}
              <TextLink href="/vs/connecteam">Connecteam vs My Guys Time</TextLink> for one example.
            </p>
            <h3 className="text-xl font-bold text-slate-900 pt-2">A flat-price crew time card</h3>
            <p>
              One price for the whole company, built around a foreman entering the crew's hours and signing off on the
              week. That's what My Guys Time is, at $12/month flat, whatever your headcount.
            </p>
            <p>
              For the side-by-side math, see{" "}
              <TextLink href="/construction-time-tracking-cost">what construction time tracking costs</TextLink>. For a
              fit-by-fit rundown of the main options, see{" "}
              <TextLink href="/best-construction-time-tracking-apps">
                the best time tracking apps for small construction crews
              </TextLink>
              .
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">How I got from a 2x6 to an app</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              I'm a mason. For a long time, my crew's hours lived on a short length of 2x6 that rode behind the seat of
              my truck. At the end of each day I'd pencil on who was there and how long we worked. It wasn't pretty,
              but it was accurate, because I was on that job every day and I wrote it down myself.
            </p>
            <p>
              That held up until I started a second crew and put a foreman in charge of it. Now I wasn't there to see
              the day. The hours came to me secondhand, and by Thursday evening my foreman and I were trying to put the
              week back together from what we could remember. Some weeks we got close. Some weeks we didn't.
            </p>
            <p>
              So I went looking for an app. What I kept finding was built for people at desks, and nearly every one of
              them charged per guy. That never made sense to me. Why should the app cost more because you hired another
              guy?
            </p>
            <p>
              I couldn't find the thing I wanted, so I built it. The foreman logs the crew's hours from the truck before
              he leaves the job. He signs off on the week on one board. The office sees hours, rate and notes, and hands
              the hours to whoever runs payroll. One price, the whole company. If you're curious how that plays out on
              a masonry crew, there's more on <TextLink href="/trades/masonry">masonry crews</TextLink>.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Decision checklist</h2>
          <p className="text-slate-600 leading-relaxed mb-4">Answer these five and you'll know which shape fits:</p>
          <ol className="list-decimal pl-6 space-y-3 text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">How big is the crew, and how much does it swing?</strong> If your
              headcount jumps every spring, a per-user bill will jump with it. A flat price won't.
            </li>
            <li>
              <strong className="text-slate-900">Are you on site every day?</strong> If you see every hour with your own
              eyes, paper may be all you need. If a foreman runs the day without you, you need hours entered on the
              job, the day they're worked.
            </li>
            <li>
              <strong className="text-slate-900">Do you need GPS proof?</strong> If you can't trust the hours without
              location data, look at a GPS platform. If the foreman's sign-off is good enough, you can skip it.
            </li>
            <li>
              <strong className="text-slate-900">Who runs payroll?</strong> If you or a bookkeeper enter payroll by
              hand, a clean, approved week of hours may be all they need. If you want hours to flow into payroll
              software by themselves, you'll want an app with a payroll integration.
            </li>
            <li>
              <strong className="text-slate-900">Do you need the extras?</strong> Scheduling, chat, job costing and HR
              tools are worth paying for if you'll use them. If you won't, a simpler time card does the job for less
              hassle.
            </li>
          </ol>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">FAQ</h2>
          <div className="space-y-4">
            {guideFaqItems.map((item) => (
              <details key={item.q} className="bg-white border border-slate-200 rounded-xl p-5 group">
                <summary className="font-semibold text-slate-900 cursor-pointer list-none flex justify-between items-center gap-4">
                  {item.q}
                  <span className="text-orange-500 text-xl leading-none group-open:rotate-45 transition-transform shrink-0">
                    +
                  </span>
                </summary>
                <p className="text-slate-600 mt-3 leading-relaxed">
                  <FaqAnswer item={item} />
                </p>
              </details>
            ))}
          </div>
        </section>

        <p className="max-w-3xl mx-auto px-6 mt-16 text-slate-600 leading-relaxed">
          The full picture for small crews:{" "}
          <TextLink href="/construction-time-tracking">construction time tracking</TextLink>.
        </p>

        <section className="max-w-6xl mx-auto px-6 mt-8">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl px-8 py-14 text-center shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Done rebuilding the week on Thursday? Try it free for 7 days.
            </h2>
            <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">One flat price. The whole crew. Cancel anytime.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={APP_LOGIN_URL}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-orange-600 font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
              >
                Start my free week
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="/demo/foreman"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-colors text-lg"
              >
                See the foreman view, no signup
              </a>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

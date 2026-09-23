export interface TradeFaq {
  q: string;
  a: string;
}

export interface TradeConfig {
  slug: string;
  trade: string;
  plural: string;
  h1: string;
  sub: string;
  intro: string;
  pains: { title: string; text: string }[];
  flow: { title: string; text: string }[];
  calloutTitle: string;
  calloutText: string;
  faqs: TradeFaq[];
}

export const TRADES: TradeConfig[] = [
  {
    slug: "roofing",
    trade: "Roofing",
    plural: "roofing crews",
    h1: "Roofing hours, tracked from the ground.",
    sub: "Tear-off crew on one house, install crew on another, and a foreman who'd rather be on the roof than doing paperwork. Log it from the driveway.",
    intro:
      "Roofing weeks don't happen in one place. You've got a tear-off crew stripping shingles on one street, an install crew laying architectural on another, and maybe a repair guy running around with a caulk gun. By Friday nobody remembers who was where on Tuesday. My Guys Time gives every foreman a truck-ready way to log hours the day they happen — and gives you one weekly review where it all adds up.",
    pains: [
      {
        title: "Crews scattered across jobs",
        text: "Two or three roofs going at once, guys shuffled between them mid-week. Hours get guessed per job, and job costing turns into fiction.",
      },
      {
        title: "Weather days and half days",
        text: "Rain blows in at 10am and the crew's done by noon. Those partial days are exactly the hours that vanish from memory by Thursday.",
      },
      {
        title: "Subs mixed with your own guys",
        text: "Big tear-off brings in a sub crew alongside your W-2 roofers. You need their hours tracked and separated — not tangled together.",
      },
      {
        title: "Injuries need a paper trail",
        text: "Roofing is dangerous work. When something happens on a roof, the foreman's incident note — date, crew, what happened — is the record you'll wish you had.",
      },
    ],
    flow: [
      {
        title: "Foreman logs from the driveway",
        text: "Before the crew leaves the job site, the foreman taps in the day's hours from his phone. Tear-off, install, repair — logged while it's fresh, not reconstructed Friday night.",
      },
      {
        title: "You review the week",
        text: "Monday morning (or whenever you do payroll), the crew board shows every day, every guy. Weather-shortened days are right there instead of guessed.",
      },
      {
        title: "Adjust and separate",
        text: "Move a guy's Tuesday from the Elm Street tear-off to the Maple install. Keep sub hours apart from employee hours. Fix it once, in one place.",
      },
      {
        title: "Export for payroll",
        text: "Weekly summary and time-detail CSVs drop straight into whatever you use for payroll. Dump runs and supply-house receipts are already attached to the day they happened.",
      },
    ],
    calloutTitle: "Built for the way roofing weeks actually go",
    calloutText:
      "Dump fees, ridge vent runs, tarps after a blow-off — the little costs pile up on roofing jobs. The crew snaps a receipt photo when it happens and it lands on that day's time card, so job costs and hours live together instead of in a glove box full of fading receipts.",
    faqs: [
      {
        q: "My foreman isn't tech-savvy. Will he actually use this?",
        text: "That's who it's built for. No app to install, no login maze — he opens it in his phone browser and taps in hours. If he can text, he can log a day.",
      },
      {
        q: "Can I track hours per job, not just per week?",
        text: "Hours are logged per day on each guy's time card, and your weekly review shows the whole picture. For job-level costing, the CSV detail export gives you day-by-day hours to allocate however you split your jobs.",
      },
      {
        q: "How do sub crews work?",
        text: "Subs get their own role on the crew board, separate from your W-2 guys. Their hours are tracked the same way but stay cleanly separated for 1099 reporting.",
      },
    ],
  },
  {
    slug: "masonry",
    trade: "Masonry",
    plural: "masonry crews",
    h1: "Masonry hours without the Thursday scramble.",
    sub: "Block, brick, stone, hardscapes — and a crew that'd rather be laying than logging. Hours go in from the field; you review once a week.",
    intro:
      "This one we know cold — My Guys Time was built by a mason who used to track hours on a chunk of 2x6 behind the truck seat. Masonry crews split between foundations, veneers, chimneys, and hardscape jobs, with material deliveries and supply-house runs breaking up the day. It's exactly the kind of scattered week that turns Thursday at 5pm into a memory test. Now the hours go in from the field, the day they happen.",
    pains: [
      {
        title: "Crews split across job types",
        text: "Two guys on a block foundation, three on a brick veneer, and you floating between both. Splitting the week by job from memory is how hours leak.",
      },
      {
        title: "Material runs eat the middle of the day",
        text: "Somebody's always heading to the supply house for mortar, wall ties, or another pallet. Those partial-day interruptions never make it onto a paper time card.",
      },
      {
        title: "Tenders and laborers rotate",
        text: "Laborers bounce between crews week to week. Without daily logging, you end up paying everybody for a full week everywhere.",
      },
      {
        title: "Cash for the little stuff",
        text: "Petty cash for coffee, a grinder blade, a bag of mortar — it walks out of the truck and never comes back onto the books.",
      },
    ],
    flow: [
      {
        title: "Log it from the field",
        text: "Foreman or lead taps in the day's hours before the crew breaks down the mixer. Block day, brick day, hardscape day — logged while the mortar's still wet.",
      },
      {
        title: "You review the week",
        text: "The crew board lays out every guy, every day. You see the whole week at a glance instead of decoding handwriting Thursday night.",
      },
      {
        title: "Adjust and true it up",
        text: "Tender spent Wednesday with the other crew? Move his hours. Supply-house run took two hours off the wall? Note it. One review, then it's done.",
      },
      {
        title: "Export for payroll",
        text: "Weekly summary and time-detail CSVs, ready for payroll. Petty cash and reimbursements are already on the time cards they belong to.",
      },
    ],
    calloutTitle: "From the trade that started it",
    calloutText:
      "My Guys Time exists because a mason got tired of reconstructing the week from memory. The 2x6 behind the truck seat became this: a time card that takes less effort than finding a pen. If it works for a crew covered in mortar dust with gloves on, it'll work for yours.",
    faqs: [
      {
        q: "We do a lot of small repair jobs. Is this overkill?",
        text: "No — small jobs are where hours leak fastest, because nobody bothers writing down a three-hour chimney repair. Tapping in a day takes seconds, and those small jobs are the ones you most need to know were profitable.",
      },
      {
        q: "How does petty cash work?",
        text: "Petty cash, reimbursements, and deductions can be attached right to a guy's time card for the week, so the cash that leaves the truck shows up next to the hours — no separate envelope system.",
      },
      {
        q: "Do my guys need smartphones?",
        text: "The foreman can log for the whole crew from one phone. Every guy doesn't need the app — one phone per crew is enough.",
      },
    ],
  },
  {
    slug: "landscaping",
    trade: "Landscaping",
    plural: "landscaping crews",
    h1: "Mowing routes and install crews, one weekly review.",
    sub: "Route crews hitting twelve properties a day, install crews on a patio job, and seasonal help that turns over by July. Track it all without the paperwork.",
    intro:
      "Landscaping runs two different businesses at once: route work where a crew touches a dozen properties before lunch, and install work where the same guys spend three days on one hardscape. Add seasonal crew turnover and Saturday cleanups, and the weekly hours become a blur. My Guys Time lets each crew lead log the day from the truck — and gives you one board where routes and installs add up together.",
    pains: [
      {
        title: "Route days are a blur",
        text: "Twelve properties, one crew, one day. Nobody's writing down hours per stop — but you still need the week's total to be right, not guessed.",
      },
      {
        title: "Install crews vs. route crews",
        text: "Different work, different pace, sometimes different guys mid-week. Hours get lumped together and you lose sight of which side is actually making money.",
      },
      {
        title: "Seasonal turnover",
        text: "New faces every spring, some gone by August. Getting a new hire onto paper time cards — and off them cleanly — is a hassle you don't need.",
      },
      {
        title: "Saturday and weather makeup days",
        text: "Rain pushes the route to Saturday. Those odd days are the first ones forgotten when payroll comes around.",
      },
    ],
    flow: [
      {
        title: "Crew lead logs from the truck",
        text: "Route done, tailgate down, hours tapped in. Takes less time than fueling up. The install foreman does the same from the patio job.",
      },
      {
        title: "You review the week",
        text: "One board: route crew, install crew, every day. Saturday makeup hours are already there — no Monday-morning detective work.",
      },
      {
        title: "Adjust for the shuffles",
        text: "Pulled two guys off route to finish the install Thursday? Move their hours. New seasonal hire started Wednesday? He's on the board from day one.",
      },
      {
        title: "Export for payroll",
        text: "Weekly summary and time-detail CSVs. Copyable invite links mean a new hire is logging hours the same day he starts — no paperwork delay.",
      },
    ],
    calloutTitle: "New hire Monday, logging hours Monday",
    calloutText:
      "Landscaping hires fast and loses people faster. There's no onboarding packet for a time card here — you send the new guy a copyable invite link, he opens it in his phone browser, and he's on the crew board. When he leaves in August, he's just off the board. Nothing to collect, nothing to file.",
    faqs: [
      {
        q: "Can I see route hours separate from install hours?",
        text: "Each crew has its own board, so route and install hours stay visually separated all week. The CSV detail export gives you the day-by-day breakdown for job costing.",
      },
      {
        q: "What if a crew lead forgets to log a day?",
        text: "You'll see the gap on the weekly board — an empty day is obvious. And a solo crew can auto-approve, so a one-man route operation barely touches the system at all.",
      },
      {
        q: "Does it handle overtime?",
        text: "The weekly summary shows total hours per person per week, so overtime math is straightforward from the export. Saturday makeup days are already in the totals.",
      },
    ],
  },
  {
    slug: "painting",
    trade: "Painting",
    plural: "painting crews",
    h1: "Prep days, paint days, one clean time card.",
    sub: "Crews split between interiors and exteriors, prep running long, touch-up callbacks eating Fridays. Log the day it's worked.",
    intro:
      "Painting weeks are choppy: Monday is all prep and masking, Wednesday the sprayers are out, Friday somebody's back for touch-ups on last week's job. Crews split between interior and exterior work, and the hours blur together across jobs. My Guys Time keeps it simple — the foreman logs the day from the job site, and your weekly review shows what actually happened instead of what everybody half-remembers.",
    pains: [
      {
        title: "Prep vs. paint vs. callbacks",
        text: "Different phases, sometimes different days on the same house. When the week gets reconstructed from memory, it all flattens into '40 hours' and you learn nothing.",
      },
      {
        title: "Crews split across jobs",
        text: "Two guys finishing an interior while three start an exterior across town. Splitting their week between jobs on Friday is guesswork.",
      },
      {
        title: "Touch-up trips vanish",
        text: "A two-hour callback on Friday afternoon is real labor on a real job — and it's the first thing forgotten on a paper time card.",
      },
      {
        title: "Paint store runs",
        text: "Somebody's always running for another five of ceiling paint or the right sheen. The middle of the day disappears into errands.",
      },
    ],
    flow: [
      {
        title: "Foreman logs from the job",
        text: "Last brush cleaned, hours tapped in from the phone. Prep day, spray day, callback — logged the day it's worked, not Friday from memory.",
      },
      {
        title: "You review the week",
        text: "The crew board shows every painter, every day. The Friday touch-up trip is right there instead of lost.",
      },
      {
        title: "Adjust and split",
        text: "Move hours between the interior job and the exterior job. Fix the day somebody left early for the paint store. One pass and payroll's ready.",
      },
      {
        title: "Export for payroll",
        text: "Weekly summary and time-detail CSVs drop into payroll. Receipt photos from the paint store are already attached to the right day.",
      },
    ],
    calloutTitle: "Callbacks count too",
    calloutText:
      "The two-hour touch-up trip is the most-forgotten labor in painting — it never feels worth writing down, so it never gets billed or tracked. When logging a day takes seconds from the truck, even the small trips make it onto the card. That's where the margin was hiding.",
    faqs: [
      {
        q: "We pay some guys hourly and some by the day. Does that work?",
        text: "Hours are tracked per day per person, so the weekly totals work for hourly payroll. For day-rate guys, the daily log still gives you the attendance record and the CSV export to reconcile against.",
      },
      {
        q: "Can the foreman log for guys who don't have smartphones?",
        text: "Yes — one phone per crew is enough. The foreman logs the whole crew's day from his phone in the browser.",
      },
      {
        q: "What about side jobs or weekend work?",
        text: "Any day can be logged, including Saturdays. Weekend and callback hours show up on the same weekly board, so nothing worked gets forgotten.",
      },
    ],
  },
  {
    slug: "plumbing",
    trade: "Plumbing",
    plural: "plumbing crews",
    h1: "Service calls and rough-ins, hours that add up.",
    sub: "Vans running service calls all day, a rough-in crew on new construction, and an apprentice riding along. One weekly board for all of it.",
    intro:
      "Plumbing splits between two rhythms: service techs bouncing between calls in the van, and construction crews spending full days on rough-ins and trims. Apprentices ride along, on-call weekends happen, and 1099 subs fill in on big jobs. My Guys Time handles the mix — daily logging from the field, one weekly review, clean separation between your W-2 crew and everybody else.",
    pains: [
      {
        title: "Service days are fragmented",
        text: "Six calls, six driveways, one van. The tech's day is real work, but reconstructing it Friday from a pile of work orders is fantasy.",
      },
      {
        title: "Apprentices ride along",
        text: "The apprentice's hours mirror the journeyman's — except when they don't, because he got sent for parts for two hours. Somebody has to track the difference.",
      },
      {
        title: "On-call and weekend calls",
        text: "Sunday emergency call-outs are premium hours. They're also the hours most likely to be forgotten by payroll time.",
      },
      {
        title: "Subs on big rough-ins",
        text: "Large new-construction work brings in 1099 help. Their hours need tracking without mixing into your employee payroll.",
      },
    ],
    flow: [
      {
        title: "Log from the van",
        text: "Last call done, hours tapped in from the phone. The rough-in foreman logs the crew the same way from the job site.",
      },
      {
        title: "You review the week",
        text: "Service techs, construction crew, apprentices — one board, every day. The Sunday call-out is already on it.",
      },
      {
        title: "Adjust and separate",
        text: "Split the apprentice's parts-run hours, keep 1099 sub hours apart from W-2 hours, fix the day the tech left early. One review pass.",
      },
      {
        title: "Export for payroll",
        text: "Weekly summary and time-detail CSVs. Supply-house receipt photos are attached to the day they happened.",
      },
    ],
    calloutTitle: "W-2 and 1099, cleanly separated",
    calloutText:
      "Plumbing is one of the trades most likely to run a mixed crew — your own techs plus 1099 subs on big jobs. My Guys Time keeps both on the same weekly board but in separate lanes, so payroll sees employee hours and your 1099 reporting sees sub hours, with nothing tangled between them.",
    faqs: [
      {
        q: "Do techs need to log per call or per day?",
        text: "Per day. This is a time card, not dispatch software — the tech logs his day's hours in seconds, and your work orders still handle the per-call detail.",
      },
      {
        q: "How do on-call hours work?",
        text: "Any hours worked get logged to the day they're worked, including weekends and call-outs. The weekly totals include them automatically.",
      },
      {
        q: "Can I track hours against specific jobs for billing?",
        text: "Daily hours per tech give you the labor side; the CSV detail export lets you allocate to jobs however you bill. For time-and-materials work, the weekly summary is your backup.",
      },
    ],
  },
  {
    slug: "electrical",
    trade: "Electrical",
    plural: "electrical crews",
    h1: "Every hour on every job, accounted for.",
    sub: "Service trucks, new-construction crews, apprentices, and the occasional 2am emergency call. Log it from the field.",
    intro:
      "Electrical work swings between service calls and full-day construction — trim-outs, panel upgrades, new rough-ins — with apprentices in the mix and emergency calls that don't respect business hours. Hours get logged per day from the field, reviewed once a week, and exported clean for payroll. No more reconstructing the week from a pile of work orders and memory.",
    pains: [
      {
        title: "Service and construction mix",
        text: "The service truck's day looks nothing like the rough-in crew's day, but both end up on the same payroll. One system has to handle both rhythms.",
      },
      {
        title: "Apprentice hours need watching",
        text: "Apprentices split time between riding along, running parts, and classroom hours. Their weeks are the hardest to reconstruct accurately.",
      },
      {
        title: "Emergency calls",
        text: "The 2am no-power call is overtime or premium pay — and exactly the kind of hour that slips through when the week is rebuilt from memory.",
      },
      {
        title: "Material runs break up days",
        text: "Supply-house trips for breakers, wire, and fixtures punch holes in the middle of the day that paper time cards never capture.",
      },
    ],
    flow: [
      {
        title: "Log from the truck or the site",
        text: "Service tech taps in his day between calls; the foreman logs the construction crew before leaving the site. Both take seconds.",
      },
      {
        title: "You review the week",
        text: "One board: service, construction, apprentices. The emergency call-out and the supply-house gaps are visible, not guessed.",
      },
      {
        title: "Adjust and true it up",
        text: "Correct the apprentice's classroom day, separate sub hours on the big commercial rough-in, approve the week.",
      },
      {
        title: "Export for payroll",
        text: "Weekly summary and time-detail CSVs. Receipt photos from the supply house sit on the right day's card.",
      },
    ],
    calloutTitle: "The hours nobody writes down",
    calloutText:
      "Emergency call-outs, supply-house runs, the apprentice's half-day in class — electrical weeks are full of hours that don't look like a normal workday, so they don't make it onto normal time cards. Daily logging from the phone catches all of them, because it takes less effort than remembering to write them down later.",
    faqs: [
      {
        q: "We have service techs and construction crews. One system for both?",
        text: "Yes. Each crew has its own board, but you review them together. The daily-logging workflow is identical — only the work is different.",
      },
      {
        q: "How are apprentices handled?",
        text: "Apprentices are crew members like anyone else, with their own daily hours. Their classroom or training days get logged like any other day, so the record is complete.",
      },
      {
        q: "Is there an app to install on company phones?",
        text: "No install needed — it runs in the phone browser and can be added to the home screen. Nothing for IT to manage, which for most shops means nothing at all.",
      },
    ],
  },
  {
    slug: "general-contracting",
    trade: "General Contracting",
    plural: "GC crews",
    h1: "Your crew and your subs, one weekly payroll picture.",
    sub: "W-2 carpenters on your payroll, 1099 subs on every job, and five sites moving at once. See the whole labor picture every week.",
    intro:
      "General contracting is really two workforces: your own W-2 crew and a rotating cast of 1099 subs — framers, drywallers, painters, and everybody else. They're on different jobs, different schedules, and different tax forms, but you review labor once a week. My Guys Time puts both on one weekly board with clean separation, so payroll and 1099 reporting each get exactly what they need.",
    pains: [
      {
        title: "Two workforces, one week",
        text: "Your carpenters are W-2, the drywall crew is 1099, and they're both on the Johnson job Tuesday. Tracking them in separate systems is how hours fall through the cracks.",
      },
      {
        title: "Subs across multiple jobs",
        text: "The same sub crew bounces between your jobs through the week. Without daily logging, their hours per job are a guess — and your job costing with them.",
      },
      {
        title: "Your crew floats too",
        text: "Your own guys move between sites as priorities shift. Splitting their week across five jobs from memory on Friday doesn't work.",
      },
      {
        title: "Payroll vs. 1099 reporting",
        text: "Employee hours go to payroll; sub hours go to 1099s. Mix them together and you've created tax-season misery for yourself.",
      },
    ],
    flow: [
      {
        title: "Everyone logs from the field",
        text: "Your foreman logs the W-2 crew; sub foremen log their own guys. Same simple workflow, separate lanes, all from phone browsers.",
      },
      {
        title: "You review the whole week",
        text: "One board shows every worker on every job, every day — employees and subs side by side but never mixed.",
      },
      {
        title: "Adjust across jobs",
        text: "Move hours between jobs as the week actually went. Employee adjustments stay in the payroll lane; sub hours stay in the 1099 lane.",
      },
      {
        title: "Export both",
        text: "Weekly summary and time-detail CSVs — clean employee hours for payroll, clean sub hours for 1099 reporting. One export, both answers.",
      },
    ],
    calloutTitle: "The 1099 problem, solved by structure",
    calloutText:
      "Most GCs track subs on spreadsheets and employees on something else, then reconcile the two by hand. My Guys Time was built for mixed crews from the start: 1099 subs live on the same weekly board as your W-2 crew but in their own lane, so the separation your accountant needs is structural, not something you maintain with discipline.",
    faqs: [
      {
        q: "Do my subs need to pay for seats?",
        text: "There are no seats. $12/month flat covers the whole company — your crew, your subs, your office. Everybody.",
      },
      {
        q: "Can subs see my other jobs or rates?",
        text: "Reports are private to the office. Subs log their hours; they don't see payroll data, other crews' information, or anything beyond their own time card.",
      },
      {
        q: "We run a lot of jobs at once. How many can it handle?",
        text: "Crews are organized per team, and the weekly review shows the full picture. The CSV detail export gives you day-by-day hours to allocate across as many jobs as you run.",
      },
    ],
  },
];

export function getTrade(slug: string): TradeConfig | undefined {
  return TRADES.find((t) => t.slug === slug);
}

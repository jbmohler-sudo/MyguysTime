export interface VsFaq {
  q: string;
  text: string;
  link?: { phrase: string; href: string; external?: boolean };
}

export interface VsCompareRow {
  label: string;
  oldWay: string;
  myGuys: string;
}

export interface VsTextPart {
  text: string;
  href?: string;
  external?: boolean;
}

export interface VsConfig {
  slug: string;
  name: string;
  h1: string;
  sub: string;
  intro: string;
  pains: { title: string; text: string }[];
  painHeading?: string;
  painSub?: string;
  compare: VsCompareRow[];
  /** Extra CTAs under the comparison table (free week + foreman demo). */
  compareCta?: boolean;
  /** Label for the foreman-demo button under the comparison table. */
  compareSecondaryLabel?: string;
  /** Hero secondary button. Defaults to "See how it works". */
  heroSecondary?: { label: string; href: string };
  flow: { title: string; text: string }[];
  flowHeading?: string;
  flowLink?: { label: string; href: string };
  fit?: {
    columns: { heading: string; points: string[] }[];
    footer?: VsTextPart[];
  };
  /** Sentence under the intro, used to link the cost hub from live comparison pages. */
  afterIntro?: VsTextPart[];
  calloutTitle: string;
  calloutText: string;
  faqHeading?: string;
  faqs: VsFaq[];
  closingHeading?: string;
}

export const VS_PAGES: VsConfig[] = [
  {
    slug: "paper-timesheets",
    name: "Paper Timesheets",
    h1: "Retire the paper time card.",
    sub: "Crinkled notebooks, rain-soaked cards, handwriting nobody can read. There's a cheaper way to stop losing hours.",
    intro:
      "My Guys Time exists because paper time cards don't work — the guy who built it used to track hours on a chunk of 2x6 behind the truck seat. Paper is fine on Monday. By Thursday at 5pm, the whole week has to be reconstructed from memory, smudged pencil, and a card that's been through the rain twice. The hours you're paying for stop being the hours that were worked.",
    afterIntro: [
      { text: "Staying on paper for now? Use a " },
      { text: "free printable construction timesheet template", href: "/templates/construction-timesheet-template" },
      { text: " (PDF or Excel) for the weekly crew card." },
    ],
    pains: [
      {
        title: "Thursday-night reconstruction",
        text: "Nobody fills out a paper card daily. The week gets rebuilt Thursday night from memory — and memory invents hours. Some guys get overpaid, some get shorted, and you pay for all of it.",
      },
      {
        title: "Handwriting nobody can read",
        text: "Is that a 6 or an 8? A 3 or a 5? The foreman's scrawl on Friday decides somebody's paycheck, and you're the one squinting at it.",
      },
      {
        title: "Cards get lost, wet, or buried",
        text: "Glove box, back pocket, tailgate in the rain. There's no backup of a paper card — when it's gone, the week's hours are gone with it and you're starting from memory.",
      },
      {
        title: "Nothing attaches to a paper card",
        text: "The supply-house receipt fades in the glove box. Petty cash walks out of the truck and never comes back onto the books. Paper holds hours and nothing else.",
      },
    ],
    compare: [
      {
        label: "Logging a day",
        oldWay: "Find a pen, find the card, write it down — if anyone remembers",
        myGuys: "Foreman taps it in from the truck in seconds, the day it's worked",
      },
      {
        label: "Thursday payroll",
        oldWay: "Reconstruct the week from memory and smudged pencil",
        myGuys: "Review one weekly board that's already filled in",
      },
      {
        label: "Lost or damaged cards",
        oldWay: "Start over from memory",
        myGuys: "It's in the browser, backed up — nothing to lose",
      },
      {
        label: "Receipts and petty cash",
        oldWay: "A separate envelope system nobody actually keeps",
        myGuys: "Receipt photo snapped and attached to that day's time card",
      },
      {
        label: "What it costs",
        oldWay: "Free — plus the hours you lose every single week",
        myGuys: "$12/mo flat for the whole company",
      },
    ],
    flow: [
      {
        title: "Foreman logs from the field",
        text: "Same moment he'd reach for the pen — instead he taps the day's hours into his phone browser. Takes less time than finding the card.",
      },
      {
        title: "You review the week",
        text: "The crew board shows every guy, every day, already filled in. No decoding handwriting, no Thursday-night archaeology.",
      },
      {
        title: "Adjust and approve",
        text: "Fix the day somebody left early, move hours where they belong. One pass and the week is true.",
      },
      {
        title: "Export for payroll",
        text: "Weekly summary and time-detail CSVs. The receipt photos and petty cash are already on the cards they belong to.",
      },
    ],
    calloutTitle: "From the trade that retired the 2x6",
    calloutText:
      "The chunk of 2x6 behind the truck seat became this: a time card that takes less effort than finding a pen. If it works for a crew covered in mortar dust with gloves on, it'll work for yours — and you'll never squint at a rain-soaked card again.",
    faqs: [
      {
        q: "My guys won't use an app.",
        text: "There's no app to install — it opens in the phone browser and can be added to the home screen. The foreman can log the whole crew from one phone. If he can text, he can log a day.",
      },
      {
        q: "Paper is free. Why pay $12 a month?",
        text: "Paper costs you the hours you forget. One forgotten half-day a month — one guy, four hours you paid for but can't verify — costs more than a year of My Guys Time. The $12 is flat for the whole company, not per person.",
      },
      {
        q: "Do I have to enter everything myself?",
        text: "No. The foreman logs from the field during the week; you just review the board once and export. Your Thursday-night data-entry session disappears.",
      },
    ],
  },
  {
    slug: "quickbooks-time",
    name: "QuickBooks Time",
    h1: "Stop paying per head.",
    sub: "Every hire raises the bill. Seasonal help, subs, a new laborer — each one is another seat. There's a flatter way to track crew hours.",
    intro:
      "Per-seat pricing punishes you for growing. Hire a guy Monday, pay more next month. Bring on seasonal help, pay for seats that sit empty all winter. Add a 1099 sub to the job, pay for him too. My Guys Time was built on the opposite idea: why should the app cost more because you hired another guy? One flat price, the whole company, no seats to count.",
    afterIntro: [
      { text: "See " },
      { text: "what crew time apps cost", href: "/construction-time-tracking-cost" },
      { text: "." },
    ],
    pains: [
      {
        title: "Every hire raises the bill",
        text: "New laborer starts Monday — your software bill goes up next month. Growth is supposed to make you money, not raise your overhead one seat at a second.",
      },
      {
        title: "Seasonal crews cost you year-round",
        text: "You hire in spring and lose guys by fall, but per-seat plans charge you for every seat whether somebody's in it or not. Construction isn't a 12-months-same-headcount business.",
      },
      {
        title: "Subs need seats too",
        text: "The 1099 crew on your big job still counts as users on a per-seat plan. You're paying full price to track guys who aren't even your employees.",
      },
      {
        title: "Built for HR, not the field",
        text: "Corporate time software comes with onboarding videos, settings panels, and integrations nobody in the truck asked for. You need a time card, not an HR platform.",
      },
    ],
    compare: [
      {
        label: "Pricing",
        oldWay: "Per user, per month — the bill grows with your headcount",
        myGuys: "$12/mo flat for the whole company. Hire ten guys, pay the same.",
      },
      {
        label: "Adding a new hire",
        oldWay: "Buy another seat, set up another account, update the invoice",
        myGuys: "Send a copyable invite link — he's logging hours the same day",
      },
      {
        label: "1099 subs",
        oldWay: "More seats, more cost, for guys who aren't your employees",
        myGuys: "Included in the flat price, tracked in their own lane",
      },
      {
        label: "Learning curve",
        oldWay: "Onboarding flows, settings to configure, features to ignore",
        myGuys: "Foreman opens it in the browser and taps in hours. That's it.",
      },
      {
        label: "Support",
        oldWay: "Ticket queues and chatbots",
        myGuys: "Built by a contractor — email jeff@myguystime.com and get a human",
      },
    ],
    flow: [
      {
        title: "Crew logs from the field",
        text: "Foreman taps in the day's hours from his phone — no per-seat logins to manage, no onboarding course. One phone per crew is enough.",
      },
      {
        title: "You review the week",
        text: "One board: employees and subs, every day. Seasonal hires appear the day they start and disappear the day they leave — no seat juggling.",
      },
      {
        title: "Adjust and separate",
        text: "Move hours, fix days, keep W-2 and 1099 hours in their own lanes for payroll and tax time.",
      },
      {
        title: "Export for payroll",
        text: "Weekly summary and time-detail CSVs drop into whatever you run payroll with — including QuickBooks. Keep your accounting; fix your time tracking.",
      },
    ],
    calloutTitle: "One price. The whole crew.",
    calloutText:
      "That's the entire pricing page: $12 a month, flat, for everybody — foremen, laborers, subs, office. Seven-day free trial, cancel anytime from the billing portal. No tiers, no seat math, no surprise invoice because you had a good hiring month.",
    faqs: [
      {
        q: "We already use QuickBooks for accounting. Does this replace it?",
        text: "No — keep your accounting. My Guys Time handles the time cards: daily logging, weekly review, and CSV exports that drop into payroll. It's the front end your crew actually touches.",
      },
      {
        q: "$12 a month for the whole company — what's the catch?",
        text: "No catch. No tiers, no per-seat fees, no feature gates. The 7-day trial is free and you can cancel anytime from the billing portal. It costs $12 because a time card shouldn't cost more than that.",
      },
      {
        q: "Can it handle a bigger crew?",
        text: "The flat price covers the whole company — 5 guys or 50. Crews get their own boards, and the weekly review shows the full picture no matter how many teams you're running.",
      },
    ],
  },
  {
    slug: "spreadsheets",
    name: "Spreadsheets",
    h1: "Kill the Thursday spreadsheet.",
    sub: "One person knows how the formulas work. The week gets rebuilt from memory every Thursday at 5pm. There's a simpler way.",
    intro:
      "Every contractor knows this spreadsheet. Somebody built it three years ago, only one person understands the formulas, and the file name has the word FINAL in it twice. Every Thursday at 5pm the week gets reconstructed from texts, memory, and a foreman's verbal report — typed cell by cell into a system that lives on one office computer while the crew is out in the field.",
    afterIntro: [
      { text: "Need a sheet to start from? Download the " },
      { text: "free construction timesheet template", href: "/templates/construction-timesheet-template" },
      { text: " as a PDF or an Excel file." },
    ],
    pains: [
      {
        title: "Thursday at 5pm, every week",
        text: "The whole week gets rebuilt from memory and text messages, typed cell by cell. It's hours of office work to produce a record that was already half-wrong when the week happened.",
      },
      {
        title: "One person knows the formulas",
        text: "She's out sick, and nobody can run payroll. The entire system lives in one person's head, and that person has vacation days.",
      },
      {
        title: "Version chaos",
        text: "TimeCards_FINAL_v3_REAL.xlsx. Which one is right? Who edited it last? The spreadsheet multiplies, and every copy disagrees with the others.",
      },
      {
        title: "The field has no say",
        text: "The sheet lives on the office computer. The crew can't enter their own hours — everything filters through whoever's doing the typing Thursday night.",
      },
    ],
    compare: [
      {
        label: "Entering hours",
        oldWay: "Office types in whatever the field texts over",
        myGuys: "Field logs it the day it's worked, from the truck",
      },
      {
        label: "Payroll Thursday",
        oldWay: "Rebuild the week cell by cell from memory",
        myGuys: "Review the board — it's already filled in — and export",
      },
      {
        label: "Mistakes",
        oldWay: "One bad formula, one wrong paycheck, one awkward Friday",
        myGuys: "Daily entries, visible all week, adjustable in one place",
      },
      {
        label: "Receipts and notes",
        oldWay: "A separate folder nobody maintains",
        myGuys: "Receipt photos and incident notes attached to the day's card",
      },
      {
        label: "Who can run it",
        oldWay: "Whoever built the spreadsheet",
        myGuys: "Anyone — foreman logs, office reviews, CSV exports itself",
      },
    ],
    flow: [
      {
        title: "Field logs daily",
        text: "The foreman taps in hours from the job site. No more Thursday-night text-message archaeology — the data enters itself during the week.",
      },
      {
        title: "Office reviews once",
        text: "One weekly board, every guy, every day. The review that used to take Thursday evening takes a coffee break.",
      },
      {
        title: "Adjust in one place",
        text: "Fix a day, move hours between crews. No formulas to protect, no cells to unmerge, no FINAL_v4.",
      },
      {
        title: "Export the sheet",
        text: "You still get your spreadsheet — weekly summary and time-detail CSVs, generated from real daily entries instead of reconstructed memory.",
      },
    ],
    calloutTitle: "You still get the spreadsheet",
    calloutText:
      "Nobody's asking you to give up the format you trust. The CSV exports are the spreadsheet you already use — except the numbers in it were logged daily from the field instead of invented Thursday at 5pm. Same rows, honest data.",
    faqs: [
      {
        q: "I like my spreadsheet layout. Do I have to give it up?",
        text: "No. The weekly summary and time-detail CSV exports drop into whatever you already use. The difference is the numbers arrive filled in from daily field entries instead of your Thursday-night memory.",
      },
      {
        q: "What if a day needs fixing after it's logged?",
        text: "The weekly review is built for exactly that — adjust any day on the board before export. One place, no formula surgery.",
      },
      {
        q: "Do my guys need to learn software?",
        text: "The foreman logs from the phone browser — it takes seconds a day. There's nothing to install and no spreadsheet skills required on the crew's end.",
      },
    ],
  },
  {
    slug: "clockshark",
    name: "ClockShark",
    h1: "ClockShark vs My Guys Time: Per-User Pricing or One Flat Price",
    sub: "One bill grows every time you hire. The other stays at $12 whether you run three guys or thirty.",
    intro:
      "ClockShark charges a monthly base fee plus a fee for every user, so the bill rises each time you add a worker. My Guys Time is $12/month flat for the whole company. ClockShark does more (GPS tracking, scheduling, payroll integrations); My Guys Time is a simpler weekly crew time card with CSV exports.",
    afterIntro: [
      { text: "See " },
      { text: "what crew time apps cost", href: "/construction-time-tracking-cost" },
      { text: "." },
    ],
    painHeading: "What per-user pricing costs a small crew every week",
    painSub: "If any of these sound like your week, the pricing model is working against you.",
    pains: [
      {
        title: "Every hire raises the bill.",
        text: "On a per-user plan, the laborer you add in spring shows up on next month's invoice, and every month he stays. Growing the crew is supposed to make you money, not grow your software bill.",
      },
      {
        title: "Seasonal crews move the number.",
        text: "Construction headcount moves with the weather and the backlog. Under a per-user model, the bill moves with it. You end up budgeting software around how many guys you hired instead of how much work got done.",
      },
      {
        title: "More app than the crew needs.",
        text: "GPS, geofencing, scheduling and job costing are real tools, and some outfits need them. A five-guy crew that just needs hours in and a clean week out is paying for a platform built to do a lot more.",
      },
      {
        title: "The Thursday rebuild still happens.",
        text: "No app fixes hours that never got entered. If nobody logs the day it's worked, somebody rebuilds the week at 5pm Thursday. The fix is a foreman who taps in hours from the truck before he leaves the job.",
      },
    ],
    compareCta: true,
    compare: [
      {
        label: "Pricing model",
        oldWay: "A monthly base fee plus a fee per user, on Standard or Pro plans",
        myGuys: "$12/month flat for the whole company. One plan.",
      },
      {
        label: "What's included",
        oldWay:
          "Time tracking with GPS and geofencing, scheduling, job and task tracking, manager approvals. Pro adds PTO, multi-department controls and advanced job costing.",
        myGuys:
          "Crew time cards, weekly crew board, foreman approval (one-person crews auto-approve), foreman incident notes, receipt photos for expenses, W-2 and 1099 on one board",
      },
      {
        label: "Getting hours to payroll",
        oldWay: "Direct integrations, including QuickBooks, ADP, Gusto, Xero and Sage 100 Contractor",
        myGuys: "Weekly summary CSV and time detail CSV for whoever runs payroll. No integrations, and it doesn't calculate pay.",
      },
      {
        label: "How the crew uses it",
        oldWay: "Android and iOS mobile apps, or the website",
        myGuys: "Runs in the phone's browser; add it to the home screen. Invite the crew with a copyable link.",
      },
      {
        label: "Trying it",
        oldWay: "14-day free trial",
        myGuys: "7-day free trial, no card. Demo roles with no signup.",
      },
    ],
    flowHeading: "How a week runs in My Guys Time",
    flowLink: { label: "See the weekly workflow", href: "/how-it-works" },
    flow: [
      {
        title: "Foreman logs from the truck",
        text: "Before he leaves the job, the foreman taps in the crew's hours on his phone. The day gets logged the day it happens, not pieced together from memory at the end of the week.",
      },
      {
        title: "Foreman approves the week",
        text: "The weekly crew board shows every guy, every day. The foreman adds incident notes where they belong and approves the week. One-person crews auto-approve past this step.",
      },
      {
        title: "Office reviews",
        text: "The office sees hours, rate and notes for each person, plus receipt photos for anything a guy paid for out of pocket. Fix what needs fixing in one place.",
      },
      {
        title: "Hand off the CSVs",
        text: "Export the weekly summary and time detail CSVs and hand them to whoever runs payroll. No sync to set up, nothing to reconnect.",
      },
    ],
    fit: {
      columns: [
        {
          heading: "When ClockShark is the better fit",
          points: [
            "You want GPS or geofenced clock-ins, crew scheduling, job costing or PTO tracking.",
            "You want hours to flow straight into QuickBooks, ADP, Gusto or Sage without a CSV step.",
            "You want dedicated Android and iOS apps.",
          ],
        },
        {
          heading: "When My Guys Time fits better",
          points: [
            "You run small crews, roughly 2 to 30 guys, and want hours entered the day they're worked.",
            "You want a foreman sign-off, receipts on the card, and W-2 and 1099 guys on the same board.",
            "You want one flat bill that doesn't move when you hire.",
          ],
        },
      ],
      footer: [
        { text: "More on " },
        { text: "construction time tracking for small crews", href: "/construction-time-tracking" },
        { text: ", or see " },
        { text: "$12/month flat for the whole crew", href: "/pricing" },
        { text: "." },
      ],
    },
    calloutTitle: "It started with a 2x6 behind the seat",
    calloutText:
      "My Guys Time was built by a mason whose first time card was a piece of 2x6 that rode around behind the seat of his pickup. When he went shopping for an app, everything he found charged by the head. Why should the app cost more because you hired another guy? So there's one price, no contract, and you can cancel anytime from the billing portal.",
    faqHeading: "ClockShark vs My Guys Time: common questions",
    faqs: [
      {
        q: "How much does ClockShark cost per month?",
        text: "It depends on crew size. ClockShark charges a monthly base fee plus a fee for each user, on a Standard or Pro plan. For current rates, check ClockShark's current pricing. ClockShark's pricing page also says a contract term of three (3) years applies to all pricing plans (checked October 2026). The math is base fee + (per-user fee × crew size). My Guys Time is $12/month flat for the whole company, whatever that math comes to.",
        link: {
          phrase: "ClockShark's current pricing",
          href: "https://www.clockshark.com/pricing/",
          external: true,
        },
      },
      {
        q: "Is ClockShark free?",
        text: "ClockShark's pricing page doesn't list a free plan (as of September 2026). It offers a 14-day free trial. My Guys Time isn't free either: you get a 7-day trial with no card required, then it's $12/month flat for everybody.",
      },
      {
        q: "Does ClockShark track your location?",
        text: "Yes. ClockShark's plans list GPS tracking and geofencing. My Guys Time doesn't track location at all. The foreman logs the crew's hours and approves the week, and that sign-off is the check.",
      },
      {
        q: "Is ClockShark worth the investment?",
        text: "It depends on what you'll use. If you want GPS clock-ins, scheduling, job costing and hours flowing straight into your payroll software, ClockShark covers a lot of ground. If you mainly need daily hours, a foreman sign-off and a clean weekly CSV, a flat-price crew time card may fit better.",
      },
      {
        q: "What is the ClockShark app?",
        text: "The ClockShark app is a time tracking and scheduling app for field service and construction businesses, according to ClockShark's own site. It runs on Android and iOS or on the web. My Guys Time is narrower: a weekly crew time card that runs in the phone's browser, built around a foreman's sign-off.",
      },
    ],
    closingHeading: "Paying per user? Try it free for 7 days.",
  },
  {
    slug: "connecteam",
    name: "Connecteam",
    h1: "Connecteam vs My Guys Time: All-in-One App or Crew Time Card",
    sub: "One app for every kind of team, or one time card built for crews. Both are worth a look.",
    intro:
      "Connecteam is free for up to 10 users, and its paid plans cover a set number of users per hub, with per-user fees beyond that. It's a broad employee app: time clock, scheduling, chat, and HR tools. My Guys Time is a narrower weekly crew time card, built by a contractor, at $12/month flat for the whole company.",
    heroSecondary: { label: "See the foreman view, no signup", href: "/demo/foreman" },
    painHeading: "When an all-in-one app is more than a crew needs",
    painSub: "Connecteam does a lot. Here's where that can get in the way of a crew that just needs its hours.",
    pains: [
      {
        title: "Hubs and tiers to sort out.",
        text: "Connecteam sells separate hubs (Operations, Communications, and HR & Skills), each with Basic, Advanced, Expert and Enterprise plans. If all you need is crew hours, you first have to work out which hub and tier covers it. My Guys Time is one plan.",
      },
      {
        title: "The free plan has a ceiling.",
        text: "Free for up to 10 users is a real deal for a small team, and it's worth saying so. Past 10 users, the all-features free plan no longer fits, and you're choosing between a limited free tier and paid plans per hub. Plan for your spring crew, not your winter one.",
      },
      {
        title: "Built for every kind of team.",
        text: "Connecteam serves construction alongside cleaning, healthcare, retail, food service and security teams, so it covers a lot of ground. My Guys Time is built around one job: a foreman's weekly crew card.",
      },
      {
        title: "The week still gets rebuilt Thursday.",
        text: "An app can't fix hours nobody entered. If the day isn't logged the day it's worked, somebody's rebuilding the week at 5pm Thursday. The fix is a foreman tapping in hours from the truck before he leaves the job.",
      },
    ],
    compareCta: true,
    compareSecondaryLabel: "See the foreman view",
    compare: [
      {
        label: "Pricing model",
        oldWay:
          "Free Small Business Plan for up to 10 users. Paid plans are sold per hub (Basic, Advanced, Expert, Enterprise) at a fixed price for the first 30 users, then a fee for each additional user. Yearly or monthly billing.",
        myGuys: "$12/month flat for the whole company. One plan, no tiers.",
      },
      {
        label: "What it covers",
        oldWay:
          "Three hubs: Operations (time clock with GPS, scheduling, forms, tasks), Communications (chat, updates, knowledge base and more), HR & Skills (onboarding, training, documents, time off)",
        myGuys:
          "Crew time cards, weekly crew board, foreman approval (one-person crews auto-approve), foreman incident notes, receipt photos for expenses, W-2 and 1099 on one board",
      },
      {
        label: "Getting hours to payroll",
        oldWay: "Payroll integration listed in its Operations plans",
        myGuys: "Office reviews the week and hands hours to whoever runs payroll. No integrations, and it doesn't calculate pay.",
      },
      {
        label: "Adding the crew",
        oldWay: "Android and iOS apps from the Google Play Store and Apple App Store",
        myGuys: "Browser app you add to the home screen. Invite the crew with a copyable link.",
      },
      {
        label: "Trying it",
        oldWay: "14-day free trial, no credit card, plus the free plan for up to 10 users",
        myGuys: "7-day free trial, no card. Demo roles with no signup.",
      },
    ],
    flowHeading: "How a week runs in My Guys Time",
    flowLink: { label: "See how it works", href: "/how-it-works" },
    flow: [
      {
        title: "Hours go in from the truck",
        text: "The foreman taps in the crew's hours on his phone at the end of the day, while everybody's still on site. Nothing waits until Thursday.",
      },
      {
        title: "Foreman signs off on the week",
        text: "Every guy, every day, on the weekly crew board. The foreman adds an incident note on the day something happened, then approves the week. A one-person crew auto-approves past this step.",
      },
      {
        title: "Office checks it once",
        text: "Hours, rate and notes for each person, with receipt photos attached to anything a guy paid for himself. Adjust what needs adjusting in one place.",
      },
      {
        title: "Office hands hours to payroll",
        text: "The office reviews the approved week and hands the hours to whoever runs payroll. That's the whole handoff. No payroll integration.",
      },
    ],
    fit: {
      columns: [
        {
          heading: "When Connecteam is the better fit",
          points: [
            "You have up to 10 users and want a free plan.",
            "You want scheduling, GPS clock-ins, team chat, onboarding, training or HR documents in the same app.",
            "You want a payroll integration.",
          ],
        },
        {
          heading: "When My Guys Time fits better",
          points: [
            "You run crews on job sites and want the time card done right, without the rest.",
            "You want hours entered daily by the foreman, a sign-off, receipts on the card, and W-2 and 1099 guys on one board.",
            "You want a clean weekly handoff for the office and one price with no hubs or tiers, no matter how big the crew gets.",
          ],
        },
      ],
      footer: [
        { text: "Weighing the pricing models? See " },
        { text: "free plans vs per-seat vs flat pricing", href: "/construction-time-tracking-cost" },
        { text: ", " },
        { text: "ClockShark's per-user model", href: "/vs/clockshark" },
        { text: ", or " },
        { text: "construction time tracking for small crews", href: "/construction-time-tracking" },
        { text: ". Still writing the week down? Use a " },
        { text: "free construction timesheet template", href: "/templates/construction-timesheet-template" },
        { text: "." },
      ],
    },
    calloutTitle: "A mason's answer to per-user pricing",
    calloutText:
      "The guy behind My Guys Time is a mason. Before there was an app, his crew's hours lived on a 2x6 offcut behind the driver's seat. Most of the apps he tried later charged per user, which never made sense to him: why should the app cost more because you hired another guy? So the price is one number, $12 a month, for the whole company.",
    faqHeading: "Connecteam vs My Guys Time: common questions",
    faqs: [
      {
        q: "Is the Connecteam app free?",
        text: "Yes, for up to 10 users on its Small Business Plan, according to Connecteam's pricing page (checked September 2026). Its pricing FAQ also describes a Limited plan with the essentials of each hub. Teams that want more pay per hub. My Guys Time isn't free: it's a 7-day trial with no card, then $12/month flat for everyone.",
      },
      {
        q: "Is Connecteam worth it?",
        text: "It can be, depending on your team. If you have up to 10 users, or you'll actually use scheduling, chat and HR tools, it covers a lot in one app. If all you need is crew hours with a foreman sign-off and a weekly office handoff, a simpler crew time card may fit better.",
      },
      {
        q: "What are the benefits of using Connecteam?",
        text: "Per Connecteam's site: one app for time clock, scheduling, team chat and HR tools, a free plan for small teams, and a payroll integration on its Operations plans. My Guys Time does less on purpose. It's a weekly crew time card with foreman approval and receipt photos, at one flat price.",
      },
      {
        q: "How does Connecteam pricing work?",
        text: "Connecteam has a free plan for up to 10 users. Paid plans are sold per hub, in Basic, Advanced, Expert and Enterprise tiers. Each is a fixed price for the first 30 users, then a fee for each additional user, and paying yearly costs less than paying monthly. For current rates, see Connecteam's current plans.",
        link: {
          phrase: "Connecteam's current plans",
          href: "https://connecteam.com/pricing/",
          external: true,
        },
      },
      {
        q: "Do I pay per employee with My Guys Time?",
        text: "No. $12 a month covers the whole company: foremen, laborers, subs and office. There are no hubs, tiers or per-user fees, and hiring another guy doesn't change the bill.",
      },
    ],
    closingHeading: "Just need the time card? Try it free for 7 days.",
  },
  {
    slug: "busybusy",
    name: "BusyBusy",
    h1: "BusyBusy vs My Guys Time: Per-User Pricing or One Flat Price",
    sub: "One is a construction platform that bills per user once you go paid. The other is a crew time card that costs the same with three guys or thirty.",
    intro:
      "BusyBusy is a construction time tracking app with Free, Pro, and Premium plans. Its paid plans charge per user plus a monthly admin license. My Guys Time is a narrower weekly crew time card at $12/month flat for the whole company. BusyBusy does more (GPS time tracking, job costing, equipment tracking). My Guys Time keeps the week simple: the foreman logs it, signs it, and the office hands the hours to whoever runs payroll.",
    painHeading: "What per-user construction apps cost a growing crew",
    painSub:
      "BusyBusy is a solid construction app. Here's where the pricing model and the size of the platform can work against a small crew.",
    pains: [
      {
        title: "Every active guy is on the bill.",
        text: "BusyBusy's paid plans charge for each user, plus an admin license on top. To its credit, it bills for active users, so a guy who sits out the winter drops off. But every guy who clocks in that month counts, and the spring crew you add in April shows up on the invoice.",
      },
      {
        title: "The Free plan is real. The paid tools cost per head.",
        text: "BusyBusy's Free plan includes GPS time tracking, job costing and equipment tracking, and it's worth saying so. Breadcrumb GPS, supervisor tools, scheduling, the kiosk and daily sign-offs sit on the paid plans. Once you need one of those, the per-user math starts.",
      },
      {
        title: "Built to run the whole operation.",
        text: "Job costing, equipment, safety forms, daily project reports, progress tracking. Real tools, worth it for outfits that use them. A five-guy crew that just needs a weekly time card is buying into a wider platform the day it leaves Free.",
      },
      {
        title: "The Thursday rebuild still happens.",
        text: "No app fixes hours nobody entered. If the day doesn't get logged the day it's worked, somebody's rebuilding the week at 5pm Thursday. The fix is a foreman who taps in the crew's hours from the truck before he leaves the job.",
      },
    ],
    compareCta: true,
    compareSecondaryLabel: "See the foreman view, no signup",
    compare: [
      {
        label: "Pricing model",
        oldWay:
          "Free plan, plus paid Pro and Premium plans. Paid plans charge per user per month plus an admin license (first user included). Monthly or annual billing. Bills for active users.",
        myGuys: "$12/month flat for the whole company. One plan, no tiers.",
      },
      {
        label: "What's included",
        oldWay:
          "Free: GPS time tracking, job costing, equipment tracking. Pro adds breadcrumb GPS, supervisor tools, daily sign-offs, photos and notes, scheduling and a kiosk. Premium adds documents, daily project reports, progress tracking and team messaging.",
        myGuys:
          "Crew time cards, weekly crew board, foreman approval (one-person crews auto-approve), foreman incident notes, receipt photos for expenses, W-2 and 1099 guys on one board",
      },
      {
        label: "Getting hours to payroll",
        oldWay: "Integrations with other software, plus a BusyPayroll add-on that runs payroll with Gusto",
        myGuys:
          "The office reviews the week and hands the hours to whoever runs payroll. No integrations, and it doesn't calculate pay.",
      },
      {
        label: "How the crew uses it",
        oldWay: "BusyBusy mobile time clock app",
        myGuys: "Runs in the phone's browser; add it to the home screen. Invite the crew with a copyable link.",
      },
      {
        label: "Trying it",
        oldWay: "14-day free trial of Pro, no credit card, plus the Free plan",
        myGuys: "7-day free trial, no card. Demo roles with no signup.",
      },
    ],
    flowHeading: "How a week runs in My Guys Time",
    flowLink: { label: "See how it works", href: "/how-it-works" },
    flow: [
      {
        title: "Hours go in from the truck",
        text: "At the end of the day, before anybody leaves the job, the foreman taps in the crew's hours on his phone. The day gets logged the day it happens.",
      },
      {
        title: "Foreman signs off",
        text: "The weekly crew board shows every guy, every day. The foreman adds an incident note on the day something happened, then approves the week. A one-person crew auto-approves past this step.",
      },
      {
        title: "Office checks it once",
        text: "Hours, rate and notes for each person, with receipt photos on anything a guy paid for out of his own pocket. Fix what needs fixing in one place.",
      },
      {
        title: "Hours go to whoever runs payroll",
        text: "The office takes the approved week and hands the hours off to whoever does payroll. That's the handoff. Nothing to sync, nothing to reconnect.",
      },
    ],
    fit: {
      columns: [
        {
          heading: "When BusyBusy is the better fit",
          points: [
            "You want GPS-verified clock-ins, breadcrumbs, a kiosk or scheduling.",
            "You track job costs, cost codes or equipment hours and want it all in the time app.",
            "You want to start on a Free plan, or you want payroll run from inside the app.",
          ],
        },
        {
          heading: "When My Guys Time fits better",
          points: [
            "You run a small crew, roughly 2 to 30 guys, and want hours entered by the foreman the day they're worked.",
            "You want a foreman sign-off, receipts on the card, and W-2 and 1099 guys on the same board.",
            "You want one flat bill that doesn't move when you hire.",
          ],
        },
      ],
      footer: [
        { text: "Weighing the pricing models? See " },
        { text: "free plans vs per-seat vs flat pricing", href: "/construction-time-tracking-cost" },
        { text: ", or read the guide to " },
        { text: "construction time tracking for small crews", href: "/construction-time-tracking" },
        { text: ". Here's " },
        { text: "$12/month flat for the whole crew", href: "/pricing" },
        { text: "." },
      ],
    },
    calloutTitle: "Priced by a guy who used to write hours on lumber",
    calloutText:
      "My Guys Time comes from a mason who kept his crew's hours penciled on a scrap of 2x6 behind the truck seat. When that quit working and he went looking for an app, nearly everything he found was built for office people and priced per guy. Why should the app cost more because you hired another guy? So it's one price for the whole company, and you can cancel anytime.",
    faqHeading: "BusyBusy vs My Guys Time: common questions",
    faqs: [
      {
        q: "How much does BusyBusy cost?",
        text: "It depends on your plan and how many guys are active. BusyBusy has a Free plan. Its Pro and Premium plans charge per user per month plus a monthly admin license, billed monthly or annually, and it bills for active users each month. For current rates, check BusyBusy's current pricing. My Guys Time is $12/month flat for the whole company, no matter how many guys clock in.",
        link: {
          phrase: "BusyBusy's current pricing",
          href: "https://busybusy.com/price/",
          external: true,
        },
      },
      {
        q: "What exactly does BusyBusy do?",
        text: "According to its site, BusyBusy is construction time tracking with GPS, job costing and equipment tracking, plus paid tools like scheduling, safety, daily project reports and payroll. The BusyBusy app is the time clock your crew carries. My Guys Time does less on purpose: a weekly crew time card with a foreman sign-off.",
      },
      {
        q: "Is BusyBusy free?",
        text: "Yes, it lists a Free plan (checked October 2026), and its paid plans unlock more tools. My Guys Time isn't free: you get a 7-day trial with no card, then it's $12/month flat for everybody.",
      },
      {
        q: "How much does a time tracker cost?",
        text: "Most crew time apps use one of three models: a per-user fee (often with a base fee or admin license on top), a free plan capped by users or features, or one flat price for the company. We lay out the math in what construction time tracking costs.",
        link: {
          phrase: "what construction time tracking costs",
          href: "/construction-time-tracking-cost",
        },
      },
      {
        q: "Do I pay per employee with My Guys Time?",
        text: "No. $12 a month covers the whole company: foremen, laborers, subs and the office. No admin license, no per-user fee, and hiring another guy doesn't change the bill.",
      },
    ],
    closingHeading: "Just need the time card? Try it free for 7 days.",
  },
  {
    slug: "workyard",
    name: "Workyard",
    h1: "Workyard vs My Guys Time: Per-User GPS Ops or Flat Crew Card",
    sub: "One tracks where every guy was, down to the minute. The other is a weekly time card the foreman fills in and signs. Pick the one your crew needs.",
    intro:
      "Workyard is a construction operations platform priced per user per month, with Starter, Pro, Autopilot and Enterprise plans. It leans on GPS-verified time, geofencing, mileage tracking and payroll integrations. My Guys Time is a simpler weekly crew time card at $12/month flat for the whole company. The foreman logs and signs off on the hours, and the office hands them to whoever runs payroll.",
    painHeading: "When per-user GPS platforms outgrow a small crew",
    painSub:
      "Workyard is built to verify time and run field operations. Here's where that can be more than a small crew needs.",
    pains: [
      {
        title: "The bill follows headcount.",
        text: "Workyard prices every plan per user per month. That's a fair model for a big outfit, but it means every guy you hire adds a seat. Your software bill grows with the crew instead of staying put.",
      },
      {
        title: "An ops platform, not just a time card.",
        text: "Scheduling, task management, geofence clock-in rules, labor cost reports, an AI time assistant, ERP sync. Those are real tools for companies that run on them. A crew that just needs hours in and a signed week out may never touch most of it.",
      },
      {
        title: "GPS and mileage are the product.",
        text: "If you need proof of who was on which site, for how long, and how many miles they drove between jobs, Workyard is built for exactly that. My Guys Time isn't. There's no GPS, no geofence and no mileage tracking. The foreman's sign-off is the check.",
      },
      {
        title: "The Thursday rebuild still happens.",
        text: "No app fixes hours nobody entered. If the day doesn't get logged the day it's worked, somebody's rebuilding the week at 5pm Thursday. The fix is a foreman who taps in the crew's hours from the truck before he leaves the job.",
      },
    ],
    compareCta: true,
    compareSecondaryLabel: "See the foreman view, no signup",
    compare: [
      {
        label: "Pricing model",
        oldWay:
          "Per user per month, billed annually or monthly. Starter, Pro, Autopilot and Enterprise plans.",
        myGuys: "$12/month flat for the whole company. One plan, no tiers.",
      },
      {
        label: "What's included",
        oldWay:
          "Starter: GPS-verified time, supervisor-led crew clock-in, mileage and travel time reports, timesheet audit trail, notes, receipts and photos on time cards. Pro adds scheduling, geofence clock-in rules, a kiosk, facial photo verification and project labor cost reports. Autopilot adds an AI time assistant and automatic clock-in.",
        myGuys:
          "Crew time cards, weekly crew board, foreman approval (one-person crews auto-approve), foreman incident notes, receipt photos for expenses, W-2 and 1099 guys on one board",
      },
      {
        label: "Getting hours to payroll",
        oldWay:
          "One-click export to QuickBooks Online, QuickBooks Desktop, ADP, Gusto and more, on every plan",
        myGuys:
          "The office reviews the week and hands the hours to whoever runs payroll. No integrations, and it doesn't calculate pay.",
      },
      {
        label: "Location",
        oldWay: "Precise GPS and a live crew map on every plan; geofence clock-in rules on Pro and up",
        myGuys: "No GPS, no geofencing, no location tracking",
      },
      {
        label: "Trying it",
        oldWay: "Free for 14 days, no credit card",
        myGuys: "7-day free trial, no card. Demo roles with no signup.",
      },
    ],
    flowHeading: "How a week runs in My Guys Time",
    flowLink: { label: "See how it works", href: "/how-it-works" },
    flow: [
      {
        title: "Foreman logs from the truck",
        text: "Before the crew leaves the job, the foreman taps in everybody's hours on his phone. No map, no geofence. Just the guy who was there writing down what happened, the day it happened.",
      },
      {
        title: "Foreman approves the week",
        text: "Every guy, every day, on the weekly crew board. The foreman drops an incident note on the day something went sideways, then signs off. A one-person crew auto-approves past this step.",
      },
      {
        title: "Office reviews once",
        text: "Hours, rate and notes for each person, with receipt photos on anything a guy paid for himself. Fix what needs fixing in one place.",
      },
      {
        title: "Hours go to whoever runs payroll",
        text: "The office takes the approved week and hands the hours off to whoever does payroll. That's the whole handoff, with no integration to set up or keep connected.",
      },
    ],
    fit: {
      columns: [
        {
          heading: "When Workyard is the better fit",
          points: [
            "You need GPS-verified time across several job sites, or mileage and travel time reports.",
            "You want geofenced or automatic clock-ins, a kiosk, or AI help reviewing timecards.",
            "You want hours to go straight into QuickBooks, ADP or Gusto through an integration.",
          ],
        },
        {
          heading: "When My Guys Time fits better",
          points: [
            "You run a small crew, roughly 2 to 30 guys, and trust your foreman to log the day.",
            "You want a foreman sign-off, receipts on the card, and W-2 and 1099 guys on one board.",
            "You want one flat bill that stays the same when you hire.",
          ],
        },
      ],
      footer: [
        { text: "Weighing the pricing models? See " },
        { text: "free plans vs per-seat vs flat pricing", href: "/construction-time-tracking-cost" },
        { text: ", " },
        { text: "how BusyBusy prices per user", href: "/vs/busybusy" },
        { text: ", or the guide to " },
        { text: "construction time tracking for small crews", href: "/construction-time-tracking" },
        { text: "." },
      ],
    },
    calloutTitle: "No GPS, by choice",
    calloutText:
      "My Guys Time was built by a mason whose crew's hours used to ride around on a piece of 2x6 behind his truck seat. What he wanted from an app was simple: hours in from the job, a foreman who stands behind them, and a price that didn't climb with every hire. Why should the app cost more because you hired another guy? So it's $12 a month for the whole company, and the foreman's name on the week is the check.",
    faqHeading: "Workyard vs My Guys Time: common questions",
    faqs: [
      {
        q: "How much does Workyard cost?",
        text: "Workyard prices per user per month, billed annually or monthly, across Starter, Pro, Autopilot and Enterprise plans. For current rates, check Workyard's current pricing. The math is the per-user rate times your crew size, at whatever plan you need. My Guys Time is $12/month flat for the whole company.",
        link: {
          phrase: "Workyard's current pricing",
          href: "https://www.workyard.com/pricing",
          external: true,
        },
      },
      {
        q: "Does Workyard track mileage?",
        text: "Yes. Workyard's Starter plan lists mileage and travel time reporting, with GPS that detects driving between sites, according to its pricing page. My Guys Time doesn't track mileage or location at all.",
      },
      {
        q: "What is the best timesheet app for construction?",
        text: "It depends on the crew. If you need GPS proof and mileage, a platform like Workyard is built for it. If you mainly need daily hours, a foreman sign-off and a clean week for the office, a simpler crew time card may fit better. We'll have a fit-by-fit rundown of the main options soon.",
      },
      {
        q: "How much does a time tracker cost?",
        text: "Most crew time apps use one of three models: a per-user fee (sometimes with a base fee on top), a free plan capped by users or features, or one flat price for the company. We lay out the math in what construction time tracking costs.",
        link: {
          phrase: "what construction time tracking costs",
          href: "/construction-time-tracking-cost",
        },
      },
      {
        q: "Do I pay per employee with My Guys Time?",
        text: "No. $12 a month covers the whole company: foremen, laborers, subs and the office. There's no per-user fee, and hiring another guy doesn't change the bill.",
      },
    ],
    closingHeading: "Don't need the map? Try it free for 7 days.",
  },
];

export function getVs(slug: string): VsConfig | undefined {
  return VS_PAGES.find((v) => v.slug === slug);
}

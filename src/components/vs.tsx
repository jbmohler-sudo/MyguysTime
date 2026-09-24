export interface VsFaq {
  q: string;
  text: string;
}

export interface VsCompareRow {
  label: string;
  oldWay: string;
  myGuys: string;
}

export interface VsConfig {
  slug: string;
  name: string;
  h1: string;
  sub: string;
  intro: string;
  pains: { title: string; text: string }[];
  compare: VsCompareRow[];
  flow: { title: string; text: string }[];
  calloutTitle: string;
  calloutText: string;
  faqs: VsFaq[];
}

export const VS_PAGES: VsConfig[] = [
  {
    slug: "paper-timesheets",
    name: "Paper Timesheets",
    h1: "Retire the paper time card.",
    sub: "Crinkled notebooks, rain-soaked cards, handwriting nobody can read. There's a cheaper way to stop losing hours.",
    intro:
      "My Guys Time exists because paper time cards don't work — the guy who built it used to track hours on a chunk of 2x6 behind the truck seat. Paper is fine on Monday. By Thursday at 5pm, the whole week has to be reconstructed from memory, smudged pencil, and a card that's been through the rain twice. The hours you're paying for stop being the hours that were worked.",
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
];

export function getVs(slug: string): VsConfig | undefined {
  return VS_PAGES.find((v) => v.slug === slug);
}

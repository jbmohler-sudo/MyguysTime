import { MarketingFooter, MarketingHeader } from "./MarketingChrome";

export function PrivacyPage() {
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
          <span className="text-slate-700">Privacy</span>
        </nav>

        <article className="max-w-3xl mx-auto px-6 pt-8 pb-16 text-slate-700 leading-relaxed">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-600 mb-8">Effective date: October 15, 2026 (2026-10-15).</p>

          <p className="mb-6">
            This page says what My Guys Time does with information, based on how the app is built. It is a
            browser time card for contractor crews, on myguystime.com and app.myguystime.com.
          </p>
          <p className="mb-6">
            [JEFF: confirm the legal entity name that operates My Guys Time, and the mailing address.]
          </p>
          <p className="mb-10">
            Questions about this policy:{" "}
            <a href="mailto:jeff@myguystime.com" className="text-orange-600 font-semibold hover:underline">
              jeff@myguystime.com
            </a>
            .
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">We do not sell your data</h2>
          <p className="mb-4">
            We do not sell your data. Nothing in the app sells personal information or sends it to a data
            broker. We do send information to the companies listed below so they can host the app, log
            people in, store files, take payment, send email, measure traffic, and record errors.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Accounts and company records</h2>
          <p className="mb-4">
            Signup asks for a full name, a company name, an email, and a password of at least 8 characters.
            The password is handled by Supabase Auth. The app database stores the name, the email, the
            role, and a Supabase user id. It does not store the password.
          </p>
          <p className="mb-4">
            The company record stores the company name, the owner name, and a two-letter company state. New
            signups are saved with state code TX until someone changes Company state in settings. The
            company can also store which day the week starts on.
          </p>
          <p className="mb-4">
            A worker record stores a first name, last name, display name, whether the person is marked as
            an employee or a 1099 worker, an hourly rate, and which crew he is on. Logins have a role:
            admin, foreman, or worker. An admin can invite someone by email. The invite stores that email
            and a hash of the invite link, not the link itself.
          </p>
          <p className="mb-4">
            The app does not ask for a phone number. The database has an optional phone column on users and
            on invites, and the current screens do not fill it in.
          </p>
          <p>
            You can change the name on the account. Changing the email sends confirmation links to the old
            address and the new one through Supabase. You can change the password.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Hours, notes, and receipt photos</h2>
          <p className="mb-4">
            For each day, the app can store a start time, an end time, a lunch-minutes number, the total
            minutes, an optional job tag, and whether that day was confirmed. A week has a status, such as
            draft or approved, and a short audit note when the status changes.
          </p>
          <p className="mb-4">
            An expense can store an amount, a category, a note, and an optional photo of a receipt. Receipt
            photos are uploaded to a private Supabase Storage bucket named receipts. Opening one uses a
            signed link that lasts 5 minutes. A worker can open his own receipt. People in the same company
            with a higher role can open that company's receipts.
          </p>
          <p className="mb-4">
            A foreman or an admin can write an incident note: a description, a category, a severity, and an
            optional job tag. Those notes are loaded for the company admin.
          </p>
          <p>
            The app does not collect locations. There is no GPS, geolocation, or geofence code. Job tags
            are text someone types.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Hours past 40 and the gross pay estimate</h2>
          <p className="mb-4">
            Each worker record stores an hourly rate. The company has one pay setting for the whole
            company. Flat rate stores that worker's overtime rate as the same hourly rate, so every hour
            uses one rate. Standard employee leaves the overtime rate empty. The estimate then uses 1.5
            times the hourly rate for hours past 40. Marking someone as an employee or a 1099 worker does
            not change the rate.
          </p>
          <p className="mb-4">
            When a timesheet is loaded, the app adds up that week's minutes. Minutes through 40 hours are
            regular hours. Minutes past 40 hours are overtime hours. Weekly gross is regular hours times
            the hourly rate, plus overtime hours times the overtime rate. Expense amounts are stored on
            the week and are not added to that gross. The app does not calculate taxes, deductions, or net
            pay.
          </p>
          <p className="mb-4">
            Admin and foreman see the hourly rate, the overtime hours, and the weekly gross. The office
            screen shows this note: "Estimate only: hours x rate plus overtime past 40 hrs/week. Overtime
            and pay rules vary by state and locality, so check the rules that apply to you." Their
            year-to-date figure is the sum of those weekly gross estimates. A worker login still receives
            his hours, including hours past 40. That response leaves out the hourly rate, sets gross pay
            to empty, and omits the pay estimate and the year-to-date dollar total.
          </p>
          <p>
            Creating a week writes a stored pay row with the pay fields at 0, including a leftover
            net-check column set to 0. The gross number on the screen is the live calculation above. The
            app does not return that net-check column.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Payment and email</h2>
          <p className="mb-4">
            Billing runs through Stripe. When an admin starts checkout, Stripe receives that admin's email,
            the company name, and the company id. We store the Stripe customer id, the subscription id, the
            subscription status, and the trial end date. We do not store card numbers.
          </p>
          <p>
            Email is sent through Resend. That covers crew invite emails, when email sending is turned on,
            and a receipt to the company admin the first time a subscription becomes paid. The receipt
            includes the admin's name, the company name, the amount, and the subscription id.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Where the data lives</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Login and receipt files: Supabase, project ufbanjchatwkheaqafsf.</li>
            <li>Crews, hours, expenses, notes, and billing status: a Postgres database on Neon.</li>
            <li>The website and the app: Vercel.</li>
            <li>Payments: Stripe.</li>
            <li>Invite emails and the first paid receipt: Resend.</li>
          </ul>
          <p>
            [JEFF: confirm which country or region each of those providers stores data in. The code names
            the providers. It does not name a data-center region, except that PostHog's default address in
            the code is us.i.posthog.com.]
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Analytics and error reports</h2>
          <p className="mb-4">
            The site HTML loads Google Analytics, measurement id G-EEFB8F86YM, from googletagmanager.com.
            That tag is on the same HTML shell the marketing site and the app use, so it runs on those
            pages. Google Analytics uses cookies.
          </p>
          <p className="mb-4">
            PostHog runs only when a project key is configured. It can record a page view and product
            events such as login, signup, invites, onboarding steps, and an expense being submitted. After
            login it can store the user id, the role, the company id, and the company name. The default
            host in the code is https://us.i.posthog.com. PostHog may keep an identifier in the browser.
          </p>
          <p>
            Sentry runs only when a DSN is configured. It records errors. The browser setup masks all text
            and blocks all media in session replay, and both the browser and the server are set not to send
            Sentry's default personal data. The server removes the Authorization header before an error is
            sent. Replay is sampled: about 1 in 10 sessions, and sessions where an error happens.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Cookies and what stays on the device</h2>
          <p className="mb-4">
            A cookie named view_mode remembers office view versus truck view for up to one year. It is set
            with SameSite=Lax. The login token is kept in the browser's local storage under the name
            crew-timecard-token. Onboarding progress is kept in local storage under myguystime_onboarding_v1.
            Google Analytics, and PostHog when it is on, may set their own cookies or local storage.
          </p>
          <p>The app does not show a cookie consent banner.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">How long we keep it</h2>
          <p className="mb-4">
            [JEFF: confirm how long account, timesheet, receipt-photo, and billing records are kept, and
            how a customer asks to have them deleted.]
          </p>
          <p>
            What the code does today: archiving a worker turns off that person's login and revokes pending
            invites. There is no delete-my-company button, and the code does not state a retention period.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Who can see a company's data</h2>
          <p>
            Records are tied to one company. A worker sees his own week, including hours past 40, and does
            not receive the hourly rate or the gross pay estimate. A foreman sees the crews he leads,
            including the rate and the weekly gross. An admin sees the same pay fields for the company.
            This policy does not promise a particular security certification.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Contact</h2>
          <p>
            Email{" "}
            <a href="mailto:jeff@myguystime.com" className="text-orange-600 font-semibold hover:underline">
              jeff@myguystime.com
            </a>
            .
          </p>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}

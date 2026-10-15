import { MarketingFooter, MarketingHeader } from "./MarketingChrome";

export function TermsPage() {
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
          <span className="text-slate-700">Terms</span>
        </nav>

        <article className="max-w-3xl mx-auto px-6 pt-8 pb-16 text-slate-700 leading-relaxed">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Terms of Use</h1>
          <p className="text-slate-600 mb-8">Effective date: October 15, 2026 (2026-10-15).</p>

          <p className="mb-6">
            These terms cover My Guys Time, a browser-based crew time card. The price is $12 a month flat
            for the whole company, with a 7-day trial and no card to start. It is built for owners of small
            contractor crews. A company can run more than one crew. Each worker joins his crew's team and
            then uses his own phone. He or the foreman logs the hours in the browser. There is no app-store
            download.
          </p>
          <p className="mb-6">
            [JEFF: confirm the legal entity name that offers the service.]
          </p>
          <p className="mb-10">
            Questions:{" "}
            <a href="mailto:jeff@myguystime.com" className="text-orange-600 font-semibold hover:underline">
              jeff@myguystime.com
            </a>
            . The privacy policy is at{" "}
            <a href="/privacy" className="text-orange-600 font-semibold hover:underline">
              /privacy
            </a>
            .
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Accounts</h2>
          <p className="mb-4">
            The person who signs up creates the company and is the admin. Signup needs a name, a company
            name, an email, and a password of at least 8 characters. The admin invites foremen and workers
            by email or with an invite link. Each person who joins gets his own login.
          </p>
          <p>
            You are responsible for the activity under your login and for the people you invite. Give
            accurate names and emails. Do not share a password. You can change the name, the email, and the
            password from the account screen.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">
            Your payroll, taxes, wages, and worker classification
          </h2>
          <p className="mb-4">
            You are responsible for your own payroll, tax, wage, and worker-classification compliance,
            including whether each person is an employee or a contractor. My Guys Time records hours. It
            does not withhold taxes, file taxes, or produce a paycheck, and it does not decide how a worker
            is classified.
          </p>
          <p className="mb-4">
            The office board can show an hourly rate you entered and the hours past 40 in a week. The
            server also computes a rough pay figure from those hours and that rate and includes it in the
            timesheet data. The office screen shows the rate and those hours. It does not show that dollar
            figure. The figure is not a paycheck and it is not tax withholding.
          </p>
          <p>
            [JEFF: confirm whether the sentences above should instead say the app does not calculate pay or
            overtime. The code shows hours past 40 on the office board, and server/payroll.ts also computes
            a gross-pay estimate from the hours and the hourly rate.]
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Acceptable use</h2>
          <p className="mb-4">Use the app for your own crew's time cards. Do not:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>try to open another company's data</li>
            <li>upload a photo or note you do not have the right to store</li>
            <li>use the app to harass someone</li>
            <li>probe, disrupt, or overload the service</li>
            <li>use the app for anything unlawful</li>
          </ul>
          <p>We can suspend a login that does any of that.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Billing and cancellation</h2>
          <p className="mb-4">
            A new company gets 7 days in the app with no card. The trial is stored on the company as status
            trialing and an end date 7 days out. After that, an admin pays $12 per month for the whole
            company through Stripe Checkout. The charge is one subscription for the company, not a fee per
            person. Checkout sends the admin's email, the company name, and the company id to Stripe.
          </p>
          <p className="mb-4">
            An admin opens the Stripe billing portal from Account, Manage billing, to update the card or
            cancel. When Stripe tells us the subscription was deleted, the company status is set to
            canceled and that subscription no longer unlocks the app. If a payment fails, Stripe can mark
            the subscription past due, and the app asks the admin to update the card. The first time a
            subscription becomes paid, we email a receipt to the company admin through Resend.
          </p>
          <p className="mb-4">
            [JEFF: confirm whether cancellation in the Stripe customer portal ends access immediately or at
            the end of the paid month. This code marks the company canceled when Stripe sends
            customer.subscription.deleted. It does not set that portal option.]
          </p>
          <p>
            [JEFF: confirm the refund policy. The code does not describe refunds.]
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Disclaimers</h2>
          <p>
            The service is provided as it is available. Hours in the app are only as good as what the crew
            enters. We do not promise that the app is error-free, that it will be up all the time, or that
            it meets every labor-law recordkeeping rule in your state. Nothing in the app is legal advice,
            tax advice, or a payroll service.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Limitation of liability</h2>
          <p className="mb-4">
            To the extent the law allows, we are not liable for lost profits, missed payroll, wage claims,
            or other indirect damages that come from using the app or from not being able to use it.
          </p>
          <p>
            [JEFF: confirm the liability cap. The code does not set one.]
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Termination</h2>
          <p className="mb-4">
            You can stop using the app and cancel from the billing portal. We can suspend or close access
            if the subscription is canceled, a payment fails and is not fixed, or these terms are broken.
          </p>
          <p>
            [JEFF: confirm what happens to a company's data after the subscription is canceled or the
            account is closed. The code removes paid access. It does not delete the company.]
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Governing law</h2>
          <p>
            [JEFF: confirm the governing-law state.]
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-3">Changes</h2>
          <p>
            We may update these terms. The effective date at the top of this page will change when we do.
            The current page is the one at this URL.
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

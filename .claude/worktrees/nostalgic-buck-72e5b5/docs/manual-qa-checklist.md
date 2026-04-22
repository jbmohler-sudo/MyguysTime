# Manual QA Checklist

## Office Weekly Review

- Sign in as `admin@crewtime.local` and open the selected week in the main dashboard.
- Confirm the office summary cards render totals for gross, net estimate, reimbursements, missing confirmations, and locked weeks.
- Verify any employee week with missing daily confirmations shows a prominent warning chip.
- Verify any reopened week shows a reopened indicator and recent audit detail with actor, timestamp, and note.
- Confirm the largest monetary emphasis in each office row is the final check estimate.

## Adjustment Edit / Save / Cancel

- In the office dashboard, edit gas reimbursement, petty cash reimbursement, deduction, and note for one employee week.
- Change values without saving and confirm the card remains in a dirty state with `Save adjustments` and `Cancel` enabled.
- Click `Cancel` and confirm all edited fields return to the previously saved values.
- Edit the same fields again, click `Save adjustments`, and confirm the payroll estimate refreshes immediately.
- Verify the gross pay stays unchanged while reimbursements, deductions, and net check estimate update correctly.

## Employee Confirm Flow

- Sign in as `worker@crewtime.local`.
- Confirm only the signed-in employee's week is visible.
- Edit a daily start/end value and confirm the weekly total updates.
- Toggle daily confirmations until all days are confirmed, then use `Confirm week`.
- Verify the status changes to employee confirmed and the employee can no longer re-confirm a non-draft week.

## Foreman Approve Flow

- Sign in as `foreman@crewtime.local`.
- Confirm only assigned crew weeks are visible.
- Use `Apply to crew` on one day and confirm employee cards update for that crew only.
- Approve an employee-confirmed week with `Approve week`.
- Verify a foreman cannot approve an office-locked week and cannot access another crew's weeks.

## Reopen Flow

- Sign in as `admin@crewtime.local`.
- Lock a foreman-approved week with `Lock for payroll`.
- Confirm day edits and adjustment edits are rejected while the week is office locked.
- Reopen the locked week to `draft` and then to `foreman approved`, each time entering an audit note.
- Verify the dashboard shows who reopened the week, when it happened, and the reopen note.

## Export And Print

- From the office dashboard, use `Export payroll summary CSV` and verify the CSV values match the office dashboard row values.
- Use `Export time detail CSV` and verify each day entry matches the employee card values for start, end, lunch, hours, and job tag.
- Open `Printable weekly summary` and verify the print layout shows the same net check estimate, gross pay, withholding, reimbursements, and deductions as the dashboard.
- Print-preview the weekly summary and confirm cards break cleanly without overlapping content.

## Sentry Verification (Temporary)

- Set `SENTRY_DSN` and `VITE_SENTRY_DSN` to real project DSNs.
- Temporarily set `SENTRY_VERIFY_ENABLED=true`, `VITE_SENTRY_VERIFY_ENABLED=true`, and `VITE_SENTRY_BACKEND_VERIFY_ENABLED=true`.
- Sign in as `admin@crewtime.local` and open the office dashboard.
- Use `Send frontend test event` and confirm the event appears in Sentry.
- Use `Send backend test event` and confirm the event appears in Sentry.
- Turn all verification flags back to `false` after the test events are confirmed.

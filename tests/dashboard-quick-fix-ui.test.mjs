import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appShellSource = fs.readFileSync(path.join(root, "src/components/AppShell.tsx"), "utf8");
const bannerSource = fs.readFileSync(path.join(root, "src/components/MissingTimeAlertBanner.tsx"), "utf8");
const cardSource = fs.readFileSync(path.join(root, "src/components/EmployeeCard.tsx"), "utf8");

assert.match(
  bannerSource,
  /export function weekHasMissingWorkdayHours\(week: EmployeeWeek\): boolean/,
  "missing-hours helper must be reusable by the dashboard Fix now handler",
);

assert.match(
  bannerSource,
  /const handleQuickFix = \(\) => \{\s*onQuickFix\?\.\(\);\s*\}/,
  "FIX NOW must call the parent handler instead of only scrolling the banner into itself",
);

assert.doesNotMatch(
  bannerSource,
  /alertRef\.current\?\.scrollIntoView/,
  "FIX NOW must not no-op by scrolling the already-visible banner",
);

assert.match(
  cardSource,
  /data-timesheet-id=\{employeeWeek\.id\}/,
  "employee cards need a stable timesheet id so Fix now can scroll to a specific week",
);

assert.match(
  appShellSource,
  /const firstDraft = data\.employeeWeeks\.find\(\(week\) => week\.status === "draft"\)/,
  "timesheet Fix now must pick the first draft week from data, not a fragile DOM query",
);

assert.match(
  appShellSource,
  /const firstMissing = data\.employeeWeeks\.find\(weekHasMissingWorkdayHours\)/,
  "missing-hours FIX NOW must jump to an employee with missing workday hours",
);

assert.match(
  appShellSource,
  /setQuickFixTimesheetId\(timesheetId\)/,
  "Fix now must set a focus target so the matching card can be highlighted after render",
);

assert.match(
  appShellSource,
  /data-timesheet-id="\$\{CSS\.escape\(quickFixTimesheetId\)\}"/,
  "Fix now must scroll the focused employee card into view",
);

assert.match(
  appShellSource,
  /employee-card--quick-fix/,
  "Fix now must apply a visible highlight class on the target card",
);

assert.match(
  appShellSource,
  /if \(week && selectedCrewId !== "all" && week\.crewId !== selectedCrewId\) \{\s*setSelectedCrewId\("all"\);/,
  "Fix now must clear a crew filter that would hide the target timesheet",
);

console.log("dashboard quick-fix UI tests passed");

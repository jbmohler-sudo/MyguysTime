import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const employeesRouteSource = fs.readFileSync(path.join(process.cwd(), "server/routes/employees.ts"), "utf8");
const apiSource = fs.readFileSync(path.join(process.cwd(), "src/lib/api.ts"), "utf8");
const panelSource = fs.readFileSync(path.join(process.cwd(), "src/components/TeamManagementPanel.tsx"), "utf8");
const appShellSource = fs.readFileSync(path.join(process.cwd(), "src/components/AppShell.tsx"), "utf8");
const vercelEmployeesRouteSource = fs.readFileSync(
  path.join(process.cwd(), "api/employees/[...path].ts"),
  "utf8",
);
const vercelEmployeeRemoveRouteSource = fs.readFileSync(
  path.join(process.cwd(), "api/employees/[employeeId]/remove.ts"),
  "utf8",
);

assert.match(
  employeesRouteSource,
  /router\.post\("\/employees\/:employeeId\/remove"[\s\S]*req\.auth!\.role !== "ADMIN"/,
  "remove endpoint must be admin-only",
);

assert.match(
  employeesRouteSource,
  /findFirst\({[\s\S]*id: employeeId,[\s\S]*companyId: req\.auth!\.companyId/,
  "remove endpoint must verify the employee belongs to the current company",
);

assert.match(
  employeesRouteSource,
  /employee\.user\?\.role === "ADMIN"[\s\S]*Company owner\/admin accounts cannot be removed/,
  "remove endpoint must block owner/admin linked users",
);

assert.match(
  employeesRouteSource,
  /employmentStatus: "ARCHIVED"[\s\S]*archivedAt:/,
  "remove endpoint must soft-archive employees",
);

assert.match(
  employeesRouteSource,
  /linkedUserBelongsToEmployee[\s\S]*employee\.user\?\.companyId === req\.auth!\.companyId[\s\S]*employee\.user\.employeeId === employee\.id/,
  "remove endpoint must verify a linked user belongs to the same company and employee",
);

assert.match(
  employeesRouteSource,
  /tx\.user\.updateMany\({[\s\S]*companyId: req\.auth!\.companyId[\s\S]*employeeId: employee\.id[\s\S]*status: "INACTIVE"[\s\S]*deactivatedAt:/,
  "remove endpoint must disable linked app user access",
);

assert.match(
  employeesRouteSource,
  /tx\.userInvite\.deleteMany\({[\s\S]*acceptedAt: null[\s\S]*employeeId: employee\.id/,
  "remove endpoint must revoke pending invites for the employee",
);

assert.doesNotMatch(
  employeesRouteSource,
  /tx\.(timesheetWeek|payrollEstimate|timeEntryDay|weeklyAdjustment)\.(delete|deleteMany|updateMany)/,
  "remove endpoint must not delete or mutate timesheet/payroll records",
);

assert.doesNotMatch(
  employeesRouteSource,
  /\.auth\.admin\.deleteUser|deleteUser\(/,
  "remove endpoint must not delete Supabase Auth users",
);

assert.match(
  apiSource,
  /export async function removeEmployee\(token: string, employeeId: string\)[\s\S]*`\/employees\/\$\{employeeId\}\/remove`[\s\S]*method: "POST"/,
  "frontend API must call the soft-remove endpoint",
);

assert.match(
  panelSource,
  /Remove from active team\?/,
  "Team panel must show the required confirmation title",
);

assert.match(
  panelSource,
  /locallyRemovedEmployeeIds[\s\S]*setLocallyRemovedEmployeeIds[\s\S]*next\.add\(employeePendingRemoval\.id\)/,
  "Team panel must hide a successfully removed worker even before refreshed data arrives",
);

assert.match(
  panelSource,
  /onClick=\{\(event\) => \{[\s\S]*event\.stopPropagation\(\);[\s\S]*void handleConfirmRemove\(\);/,
  "confirm remove button must stop propagation and call the remove handler",
);

assert.match(
  panelSource,
  /disabled=\{removingEmployeeId === employeePendingRemoval\.id\}[\s\S]*Removing\.\.\./,
  "confirm remove button must show loading state and disable while removing",
);

for (const copy of [
  "will be removed from the active team list now",
  "Existing time cards stay on the dashboard when you view those weeks.",
  "This worker will not be added to new weekly boards after removal.",
  "Historical timesheets and office records stay intact.",
  "Login access may be disabled if they have a linked User account.",
]) {
  assert.match(panelSource, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.match(
  appShellSource,
  /onRemoveEmployee={async \(employeeId\) => {[\s\S]*await onRemoveEmployee\(employeeId\);[\s\S]*await onRefresh\(data\.weekStart\)\.catch/,
  "Team remove action must fire the API request, then refresh without masking a successful removal",
);

assert.match(
  vercelEmployeesRouteSource,
  /import \{ app \} from "\.\.\/\.\.\/server\/index\.js";[\s\S]*export default app;/,
  "Vercel must mount employees routes so POST /:employeeId/remove reaches Express in production",
);

assert.match(
  vercelEmployeeRemoveRouteSource,
  /import \{ app \} from "\.\.\/\.\.\/\.\.\/server\/index\.js";[\s\S]*export default app;/,
  "Vercel must mount the specific employee remove route so POST /:employeeId/remove reaches Express in production",
);

console.log("employee remove source tests passed");

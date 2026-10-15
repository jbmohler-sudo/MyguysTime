import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { assertSafeFixtureMutationContext } from "../dist-server/server/envSafety.js";

process.env.NODE_ENV = "test";
process.env.MYGUYS_FIXTURE_ENV = "test";
process.env.INVITE_EMAIL_TRANSPORT = "test";
process.env.SENTRY_UPLOAD_SOURCEMAPS = "false";

assertSafeFixtureMutationContext("tests/run-tests.mjs");

const [
  { startServer },
  { prisma },
  { seedDatabase },
  { sentInviteEmailEvents },
] = await Promise.all([
  import("../dist-server/server/index.js"),
  import("../dist-server/server/db.js"),
  import("../dist-server/prisma/seed.js"),
  import("../dist-server/server/email/inviteEmail.js"),
]);

const WEEK_START = "2026-04-13";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY before running tests.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function bootApp() {
  await prisma.$disconnect().catch(() => undefined);
  await seedDatabase();
  const server = startServer(0);
  await new Promise((resolve) => setTimeout(resolve, 200));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  async function api(path, init = {}) {
    return fetch(`http://127.0.0.1:${port}${path}`, init);
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    assert.equal(error, null);
    assert.ok(data.session?.access_token);
    return data.session.access_token;
  }

  async function signup(fullName, companyName, email, password) {
    const response = await api("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, companyName, email, password }),
    });
    assert.equal(response.status, 201);
    return login(email, password);
  }

  async function shutdown() {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve(undefined))));
    await prisma.$disconnect();
  }

  return { api, login, signup, shutdown };
}

async function runCase(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await runCase("employee cannot view private reports", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("marco@crewtime.local", "employee123");
    const response = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.privateReports.length, 0);
    assert.equal(payload.employeeWeeks.length, 1);
    const ownWeek = payload.employeeWeeks[0];
    assert.equal(ownWeek.grossPay, null);
    assert.equal("payrollEstimate" in ownWeek, false);
    assert.equal("grossPayments" in ownWeek.ytdSummary, false);
    assert.equal("netEstimate" in ownWeek.ytdSummary, false);
  } finally {
    await app.shutdown();
  }
});

await runCase("payroll export route stays removed", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("marco@crewtime.local", "employee123");
    const response = await app.api(`/api/exports/payroll-summary.csv?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // The payroll engine and its exports were removed; nobody can reach this route.
    assert.equal(response.status, 404);
  } finally {
    await app.shutdown();
  }
});

await runCase("foreman only accesses assigned crews", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("luis@crewtime.local", "foreman123");
    const response = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.crews.length, 1);
    assert.equal(payload.crews[0].name, "Masonry Crew");
    assert.ok(payload.employeeWeeks.every((week) => week.crewName === "Masonry Crew"));
    assert.ok(payload.employeeWeeks.every((week) => typeof week.grossPay === "number"));
    assert.ok(payload.employeeWeeks.every((week) => week.payrollEstimate && typeof week.payrollEstimate.grossPay === "number"));
  } finally {
    await app.shutdown();
  }
});

await runCase("admin bootstrap includes YTD reporting totals", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const response = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    const firstWeek = payload.employeeWeeks[0];

    assert.equal(response.status, 200);
    assert.equal(firstWeek.workerType, "employee");
    assert.equal(firstWeek.ytdSummary.calendarYear, 2026);
    assert.equal(typeof firstWeek.grossPay, "number");
    assert.ok(firstWeek.ytdSummary.grossPayments >= firstWeek.payrollEstimate.grossPay);
    assert.equal("netCheckEstimate" in firstWeek.payrollEstimate, false);
    assert.equal("reimbursements" in firstWeek.payrollEstimate, false);
    assert.equal("deductions" in firstWeek.payrollEstimate, false);
    assert.equal("netEstimate" in firstWeek.ytdSummary, false);
    assert.equal("reimbursements" in firstWeek.ytdSummary, false);
    assert.equal("deductions" in firstWeek.ytdSummary, false);
  } finally {
    await app.shutdown();
  }
});

await runCase("new admin signup returns a valid bootstrap with setup incomplete", async () => {
  const app = await bootApp();
  try {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const token = await app.signup(
      "Rosa Field",
      "Rosa Demo Contracting",
      `rosa+${uniqueSuffix}@crewtime.local`,
      "signup123",
    );
    const response = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.viewer.role, "admin");
    assert.equal(payload.companySettings.companyName, "Rosa Demo Contracting");
    assert.equal(payload.companySettings.ownerName, "Rosa Field");
    assert.equal(payload.companySettings.setupComplete, false);
  } finally {
    await app.shutdown();
  }
});

await runCase("signup cannot overwrite an existing auth user's password", async () => {
  const app = await bootApp();
  try {
    const takeover = await app.api("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Attacker",
        companyName: "Attack Co",
        email: "marco@crewtime.local",
        password: "hacked-password-99",
      }),
    });
    const payload = await takeover.json();

    assert.equal(takeover.status, 409);
    assert.match(payload.error, /already exists/i);

    const token = await app.login("marco@crewtime.local", "employee123");
    assert.ok(token);

    const stolen = await supabase.auth.signInWithPassword({
      email: "marco@crewtime.local",
      password: "hacked-password-99",
    });
    assert.ok(stolen.error);
  } finally {
    await app.shutdown();
  }
});

await runCase("new admin can complete onboarding after signup", async () => {
  const app = await bootApp();
  try {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const token = await app.signup(
      "Noah Builder",
      "Noah Demo Builders",
      `noah+${uniqueSuffix}@crewtime.local`,
      "signup123",
    );

    const setupResponse = await app.api("/api/company-setup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyName: "Noah Demo Builders",
        ownerName: "Noah Builder",
        weekStartDay: 1,
        employees: [{ displayName: "Crew One", hourlyRate: 28, workerType: "w2" }],
        timeTrackingStyle: "foreman",
        lunchDeductionMinutes: 30,
        payType: "hourly_overtime",
        payrollMethod: "manual",
        trackExpenses: true,
      }),
    });
    const setupPayload = await setupResponse.json();

    assert.equal(setupResponse.status, 200);
    assert.equal(setupPayload.companySettings.setupComplete, true);
    assert.equal(setupPayload.employeeWeeks.length, 1);
    assert.equal(setupPayload.employeeWeeks[0].employeeName, "Crew One");
  } finally {
    await app.shutdown();
  }
});

await runCase("admin can list active employees for own company", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const response = await app.api("/api/employees", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.ok(payload.employees.length >= 3);
    assert.ok(payload.employees.every((employee) => employee.active === true));
    assert.ok(payload.employees.some((employee) => employee.displayName === "Luis Ortega"));
    assert.ok(payload.employees.every((employee) => employee.displayName !== "Jake Martinez"));
  } finally {
    await app.shutdown();
  }
});

await runCase("foreman and employee cannot access employee management endpoints", async () => {
  const app = await bootApp();
  try {
    const foremanToken = await app.login("luis@crewtime.local", "foreman123");
    const employeeToken = await app.login("marco@crewtime.local", "employee123");

    const foremanResponse = await app.api("/api/employees", {
      headers: { Authorization: `Bearer ${foremanToken}` },
    });
    const employeeResponse = await app.api("/api/employees", {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });

    assert.equal(foremanResponse.status, 403);
    assert.equal(employeeResponse.status, 403);
  } finally {
    await app.shutdown();
  }
});

await runCase("admin can add employee without creating a user login", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const response = await app.api("/api/employees", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "Pedro",
        lastName: "Stone",
        displayName: "Pedro Stone",
        workerType: "employee",
        hourlyRate: 26.5,
        defaultCrewId: null,
        active: true,
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.employee.displayName, "Pedro Stone");
    assert.equal(payload.employee.hasLoginAccess, false);
    assert.equal(payload.employee.active, true);
  } finally {
    await app.shutdown();
  }
});

await runCase("admin can edit employee details", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const listResponse = await app.api("/api/employees", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listPayload = await listResponse.json();
    const employee = listPayload.employees.find((entry) => entry.displayName === "Troy Bennett");

    const updateResponse = await app.api(`/api/employees/${employee.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "Troy",
        lastName: "Bennett",
        displayName: "Troy Bennett Sr.",
        workerType: "contractor_1099",
        hourlyRate: 33,
        defaultCrewId: employee.defaultCrewId,
        active: true,
      }),
    });
    const updatePayload = await updateResponse.json();

    assert.equal(updateResponse.status, 200);
    assert.equal(updatePayload.employee.displayName, "Troy Bennett Sr.");
    assert.equal(updatePayload.employee.workerType, "contractor_1099");
    assert.equal(updatePayload.employee.hourlyRate, 33);
  } finally {
    await app.shutdown();
  }
});

await runCase("admin cannot edit employee records from another company", async () => {
  const app = await bootApp();
  try {
    const crewTimeAdminToken = await app.login("admin@crewtime.local", "admin123");
    const apexAdminToken = await app.login("admin@apexroofing.local", "apex_admin123");
    const apexListResponse = await app.api("/api/employees", {
      headers: { Authorization: `Bearer ${apexAdminToken}` },
    });
    const apexListPayload = await apexListResponse.json();
    const apexEmployee = apexListPayload.employees[0];

    const crossCompanyResponse = await app.api(`/api/employees/${apexEmployee.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${crewTimeAdminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: apexEmployee.firstName,
        lastName: apexEmployee.lastName,
        displayName: apexEmployee.displayName,
        workerType: apexEmployee.workerType,
        hourlyRate: apexEmployee.hourlyRate,
        defaultCrewId: apexEmployee.defaultCrewId,
        active: true,
      }),
    });

    assert.equal(crossCompanyResponse.status, 404);
  } finally {
    await app.shutdown();
  }
});

await runCase("admin can create and list invite for employee in same company", async () => {
  const app = await bootApp();
  try {
    sentInviteEmailEvents.length = 0;
    const token = await app.login("admin@crewtime.local", "admin123");
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const employeeCreateResponse = await app.api("/api/employees", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "Invite",
        lastName: "List",
        displayName: "Invite List",
        workerType: "employee",
        hourlyRate: 27,
        defaultCrewId: null,
        active: true,
      }),
    });
    const employeeCreatePayload = await employeeCreateResponse.json();
    const employee = employeeCreatePayload.employee;
    const inviteEmail = `invite-list-${uniqueSuffix}@crewtime.local`;

    const inviteResponse = await app.api("/api/company/invites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employeeId: employee.id,
        email: inviteEmail,
        role: "employee",
      }),
    });
    const invitePayload = await inviteResponse.json();

    assert.equal(inviteResponse.status, 201);
    assert.equal(invitePayload.invite.employeeId, employee.id);
    assert.equal(invitePayload.invite.email, inviteEmail);
    assert.equal(invitePayload.invite.status, "pending");
    assert.equal(invitePayload.deliveryMode, "test");
    assert.match(invitePayload.inviteUrl, /\?invite=/);
    assert.equal(sentInviteEmailEvents.length, 1);
    assert.equal(sentInviteEmailEvents[0].to, inviteEmail);
    assert.equal(sentInviteEmailEvents[0].role, "EMPLOYEE");
    assert.equal(sentInviteEmailEvents[0].inviteUrl, invitePayload.inviteUrl);

    const storedInvite = await prisma.userInvite.findUniqueOrThrow({
      where: { id: invitePayload.invite.id },
      select: { sendCount: true, lastSentAt: true },
    });
    assert.equal(storedInvite.sendCount, 1);
    assert.ok(storedInvite.lastSentAt instanceof Date);

    const listResponse = await app.api("/api/company/invites", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listPayload = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.ok(listPayload.invites.some((invite) => invite.email === inviteEmail));
  } finally {
    await app.shutdown();
  }
});

await runCase("invalid invite email cannot create invite or send email", async () => {
  const app = await bootApp();
  try {
    sentInviteEmailEvents.length = 0;
    const token = await app.login("admin@crewtime.local", "admin123");

    const inviteResponse = await app.api("/api/company/invites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "not-an-email",
        role: "employee",
      }),
    });

    assert.equal(inviteResponse.status, 400);
    assert.equal(sentInviteEmailEvents.length, 0);
  } finally {
    await app.shutdown();
  }
});

await runCase("valid invite form payload with crew and role can submit", async () => {
  const app = await bootApp();
  try {
    sentInviteEmailEvents.length = 0;
    const token = await app.login("admin@crewtime.local", "admin123");
    const bootstrapResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const bootstrapPayload = await bootstrapResponse.json();
    const crew = bootstrapPayload.crews[0];
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const inviteEmail = `invite-form-${uniqueSuffix}@crewtime.local`;

    const inviteResponse = await app.api("/api/company/invites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: inviteEmail,
        role: "foreman",
        crewId: crew.id,
        hourlyRate: 31,
      }),
    });
    const invitePayload = await inviteResponse.json();

    assert.equal(inviteResponse.status, 201);
    assert.equal(invitePayload.invite.email, inviteEmail);
    assert.equal(invitePayload.invite.role, "foreman");
    assert.equal(invitePayload.deliveryMode, "test");
    assert.equal(sentInviteEmailEvents.length, 1);
    assert.equal(sentInviteEmailEvents[0].to, inviteEmail);
    assert.equal(sentInviteEmailEvents[0].role, "FOREMAN");
  } finally {
    await app.shutdown();
  }
});

await runCase("admin can resend invite and trigger email path", async () => {
  const app = await bootApp();
  try {
    sentInviteEmailEvents.length = 0;
    const token = await app.login("admin@crewtime.local", "admin123");
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const inviteEmail = `invite-resend-${uniqueSuffix}@crewtime.local`;

    const inviteResponse = await app.api("/api/company/invites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: inviteEmail,
        role: "foreman",
      }),
    });
    const invitePayload = await inviteResponse.json();

    assert.equal(inviteResponse.status, 201);
    assert.equal(sentInviteEmailEvents.length, 1);

    const resendResponse = await app.api(`/api/company/invites/${invitePayload.invite.id}/resend`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const resendPayload = await resendResponse.json();

    assert.equal(resendResponse.status, 200);
    assert.equal(resendPayload.invite.email, inviteEmail);
    assert.equal(sentInviteEmailEvents.length, 2);
    assert.equal(sentInviteEmailEvents[1].to, inviteEmail);

    const storedInvite = await prisma.userInvite.findUniqueOrThrow({
      where: { id: invitePayload.invite.id },
      select: { sendCount: true, lastSentAt: true },
    });
    assert.equal(storedInvite.sendCount, 2);
    assert.ok(storedInvite.lastSentAt instanceof Date);
  } finally {
    await app.shutdown();
  }
});

await runCase("invite modal focus trap stays stable while typing", async () => {
  const modalSource = fs.readFileSync(path.join(process.cwd(), "src/components/InviteEmployeeModal.tsx"), "utf8");
  const focusTrapSource = fs.readFileSync(path.join(process.cwd(), "src/hooks/useFocusTrap.ts"), "utf8");

  assert.match(modalSource, /const handleClose = useCallback/);
  assert.match(modalSource, /const emailInputRef = useRef<HTMLInputElement>/);
  assert.match(modalSource, /useFocusTrap\(containerRef, isOpen, handleClose, emailInputRef\)/);
  assert.match(focusTrapSource, /initialFocusRef\?: \{ current: HTMLElement \| null \}/);
  assert.match(focusTrapSource, /initialFocusRef\?\.current \?\? first/);
  assert.match(focusTrapSource, /const onEscapeRef = useRef\(onEscape\)/);
  assert.match(focusTrapSource, /onEscapeRef\.current\?\.\(\)/);
  assert.doesNotMatch(focusTrapSource, /\[isActive, containerRef, onEscape, initialFocusRef\]/);
});

await runCase("cross-company employee invite by guessed id is blocked", async () => {
  const app = await bootApp();
  try {
    const crewTimeAdminToken = await app.login("admin@crewtime.local", "admin123");
    const apexAdminToken = await app.login("admin@apexroofing.local", "apex_admin123");
    const apexEmployeesResponse = await app.api("/api/employees", {
      headers: { Authorization: `Bearer ${apexAdminToken}` },
    });
    const apexEmployeesPayload = await apexEmployeesResponse.json();
    const apexEmployee = apexEmployeesPayload.employees[0];

    const inviteResponse = await app.api("/api/company/invites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${crewTimeAdminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employeeId: apexEmployee.id,
        email: "wrong-company@crewtime.local",
        role: "employee",
      }),
    });

    assert.equal(inviteResponse.status, 404);
  } finally {
    await app.shutdown();
  }
});

await runCase("foreman and employee cannot create or list invites", async () => {
  const app = await bootApp();
  try {
    const foremanToken = await app.login("luis@crewtime.local", "foreman123");
    const employeeToken = await app.login("marco@crewtime.local", "employee123");

    const foremanList = await app.api("/api/company/invites", {
      headers: { Authorization: `Bearer ${foremanToken}` },
    });
    const employeeList = await app.api("/api/company/invites", {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    const foremanCreate = await app.api("/api/company/invites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${foremanToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "blocked@crewtime.local",
        role: "employee",
      }),
    });

    assert.equal(foremanList.status, 403);
    assert.equal(employeeList.status, 403);
    assert.equal(foremanCreate.status, 403);
  } finally {
    await app.shutdown();
  }
});

await runCase("accepting invite creates linked login and bootstrap works", async () => {
  const app = await bootApp();
  try {
    const adminToken = await app.login("admin@crewtime.local", "admin123");
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const employeeCreateResponse = await app.api("/api/employees", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "Invite",
        lastName: "Target",
        displayName: "Invite Target",
        workerType: "employee",
        hourlyRate: 29,
        defaultCrewId: null,
        active: true,
      }),
    });
    const employeeCreatePayload = await employeeCreateResponse.json();
    const employee = employeeCreatePayload.employee;
    const inviteEmail = `invite-accepted-${uniqueSuffix}@crewtime.local`;

    const inviteResponse = await app.api("/api/company/invites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employeeId: employee.id,
        email: inviteEmail,
        role: "employee",
      }),
    });
    const invitePayload = await inviteResponse.json();
    assert.equal(inviteResponse.status, 201);
    const inviteToken = new URL(invitePayload.inviteUrl).searchParams.get("invite");

    const acceptResponse = await app.api("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: inviteToken,
        fullName: "Invite Target",
        password: "invitepass123",
      }),
    });
    const acceptPayload = await acceptResponse.json();

    assert.equal(acceptResponse.status, 201);
    assert.equal(acceptPayload.email, inviteEmail);

    const acceptedToken = await app.login(inviteEmail, "invitepass123");

    const bootstrapResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${acceptedToken}` },
    });
    const bootstrapPayload = await bootstrapResponse.json();

    assert.equal(bootstrapResponse.status, 200);
    assert.equal(bootstrapPayload.viewer.role, "employee");
    assert.equal(bootstrapPayload.viewer.employeeId, employee.id);

    const loginToken = await app.login(inviteEmail, "invitepass123");
    const reloginBootstrap = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${loginToken}` },
    });
    assert.equal(reloginBootstrap.status, 200);

    const refreshedEmployeesResponse = await app.api("/api/employees", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const refreshedEmployeesPayload = await refreshedEmployeesResponse.json();
    const refreshedEmployee = refreshedEmployeesPayload.employees.find((entry) => entry.id === employee.id);

    assert.equal(refreshedEmployee.hasLoginAccess, true);
    assert.equal(refreshedEmployee.displayName, "Invite Target");
  } finally {
    await app.shutdown();
  }
});

await runCase("office can lock a week", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mePayload = await meResponse.json();
    const timesheetId = mePayload.employeeWeeks[0].id;

    const lockResponse = await app.api(`/api/timesheets/${timesheetId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "office_locked" }),
    });
    const payload = await lockResponse.json();

    assert.equal(lockResponse.status, 200);
    assert.equal(payload.timesheet.status, "office_locked");
  } finally {
    await app.shutdown();
  }
});

await runCase("locked week rejects edits until reopened", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mePayload = await meResponse.json();
    const timesheet = mePayload.employeeWeeks[0];

    await app.api(`/api/timesheets/${timesheet.id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "office_locked" }),
    });

    const editResponse = await app.api(`/api/timesheets/${timesheet.id}/days/${timesheet.entries[0].id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lunchMinutes: 45 }),
    });

    assert.equal(editResponse.status, 409);
  } finally {
    await app.shutdown();
  }
});

await runCase("employee cannot confirm non-draft week", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("marco@crewtime.local", "employee123");
    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mePayload = await meResponse.json();
    const timesheetId = mePayload.employeeWeeks[0].id;

    const confirmResponse = await app.api(`/api/timesheets/${timesheetId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "employee_confirmed" }),
    });

    assert.equal(confirmResponse.status, 409);
  } finally {
    await app.shutdown();
  }
});

await runCase("foreman can flag assigned crew week as needs revision with audit note", async () => {
  const app = await bootApp();
  try {
    const foremanToken = await app.login("luis@crewtime.local", "foreman123");
    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${foremanToken}` },
    });
    const mePayload = await meResponse.json();
    const timesheetId = mePayload.employeeWeeks.find((week) => week.employeeId !== mePayload.viewer.employeeId).id;

    const revisionResponse = await app.api(`/api/timesheets/${timesheetId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${foremanToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "needs_revision", note: "Lunch break needs correction." }),
    });
    const payload = await revisionResponse.json();

    assert.equal(revisionResponse.status, 200);
    assert.equal(payload.timesheet.status, "needs_revision");
    assert.equal(payload.timesheet.statusAuditTrail[0].toStatus, "needs_revision");
    assert.equal(payload.timesheet.statusAuditTrail[0].note, "Lunch break needs correction.");
  } finally {
    await app.shutdown();
  }
});

await runCase("needs revision requires audit note", async () => {
  const app = await bootApp();
  try {
    const foremanToken = await app.login("luis@crewtime.local", "foreman123");
    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${foremanToken}` },
    });
    const mePayload = await meResponse.json();
    const timesheetId = mePayload.employeeWeeks.find((week) => week.employeeId !== mePayload.viewer.employeeId).id;

    const revisionResponse = await app.api(`/api/timesheets/${timesheetId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${foremanToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "needs_revision", note: "" }),
    });

    assert.equal(revisionResponse.status, 400);
  } finally {
    await app.shutdown();
  }
});

await runCase("employee can edit and reconfirm a needs revision week", async () => {
  const app = await bootApp();
  try {
    const foremanToken = await app.login("luis@crewtime.local", "foreman123");
    const employeeToken = await app.login("marco@crewtime.local", "employee123");

    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${foremanToken}` },
    });
    const mePayload = await meResponse.json();
    const marcoWeek = mePayload.employeeWeeks.find((week) => week.employeeName === "Marco Diaz");

    await app.api(`/api/timesheets/${marcoWeek.id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${foremanToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "needs_revision", note: "Please fix Tuesday end time." }),
    });

    const editResponse = await app.api(`/api/timesheets/${marcoWeek.id}/days/${marcoWeek.entries[0].id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${employeeToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lunchMinutes: 45 }),
    });
    const editPayload = await editResponse.json();

    assert.equal(editResponse.status, 200);
    assert.equal(editPayload.timesheet.status, "needs_revision");

    const confirmResponse = await app.api(`/api/timesheets/${marcoWeek.id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${employeeToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "employee_confirmed" }),
    });
    const confirmPayload = await confirmResponse.json();

    assert.equal(confirmResponse.status, 200);
    assert.equal(confirmPayload.timesheet.status, "employee_confirmed");
  } finally {
    await app.shutdown();
  }
});

await runCase("foreman cannot approve locked week", async () => {
  const app = await bootApp();
  try {
    const adminToken = await app.login("admin@crewtime.local", "admin123");
    const foremanToken = await app.login("luis@crewtime.local", "foreman123");
    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const mePayload = await meResponse.json();
    const timesheetId = mePayload.employeeWeeks.find((week) => week.employeeName === "Marco Diaz").id;

    await app.api(`/api/timesheets/${timesheetId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "office_locked" }),
    });

    const approveResponse = await app.api(`/api/timesheets/${timesheetId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${foremanToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "foreman_approved" }),
    });

    assert.equal(approveResponse.status, 409);
  } finally {
    await app.shutdown();
  }
});

await runCase("reopen only allowed from office locked", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mePayload = await meResponse.json();
    const timesheetId = mePayload.employeeWeeks[0].id;

    const reopenResponse = await app.api(`/api/timesheets/${timesheetId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "draft", reopenTo: "draft", note: "Trying early reopen." }),
    });

    assert.equal(reopenResponse.status, 409);
  } finally {
    await app.shutdown();
  }
});

await runCase("reopen requires admin audit note", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mePayload = await meResponse.json();
    const timesheetId = mePayload.employeeWeeks[0].id;

    await app.api(`/api/timesheets/${timesheetId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "office_locked" }),
    });

    const reopenResponse = await app.api(`/api/timesheets/${timesheetId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "draft", reopenTo: "draft", note: "" }),
    });

    assert.equal(reopenResponse.status, 400);
  } finally {
    await app.shutdown();
  }
});

await runCase("adjustment edits do not change the gross pay estimate", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mePayload = await meResponse.json();
    const timesheet = mePayload.employeeWeeks[0];
    const beforeGross = timesheet.payrollEstimate.grossPay;

    const adjustResponse = await app.api(`/api/timesheets/${timesheet.id}/adjustment`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gasReimbursement: 20,
        pettyCashReimbursement: 10,
        deductionAdvance: 5,
        notes: "Office adjustment test.",
      }),
    });
    const payload = await adjustResponse.json();

    assert.equal(adjustResponse.status, 200);
    assert.equal(payload.timesheet.payrollEstimate.grossPay, beforeGross);
    assert.equal("netCheckEstimate" in payload.timesheet.payrollEstimate, false);
    assert.equal("reimbursements" in payload.timesheet.payrollEstimate, false);
    assert.equal("deductions" in payload.timesheet.payrollEstimate, false);
    assert.equal("netEstimate" in payload.timesheet.ytdSummary, false);
    assert.equal(payload.timesheet.adjustment.notes, "Office adjustment test.");
    assert.equal(payload.timesheet.adjustment.gasReimbursement, 20);
  } finally {
    await app.shutdown();
  }
});

await runCase("employee can add a simple expense with receipt flag", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("marco@crewtime.local", "employee123");
    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mePayload = await meResponse.json();
    const timesheet = mePayload.employeeWeeks[0];

    const expenseResponse = await app.api(`/api/timesheets/${timesheet.id}/expenses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category: "gas",
        amount: 20,
        note: "Fuel for pickup run.",
        hasReceipt: true,
      }),
    });
    const expensePayload = await expenseResponse.json();

    assert.equal(expenseResponse.status, 201);
    assert.equal(expensePayload.timesheet.expenseSubmissions.length, 1);
    assert.equal(expensePayload.timesheet.expenseSubmissions[0].category, "gas");
    assert.equal(expensePayload.timesheet.expenseSubmissions[0].amount, 20);
    assert.equal(expensePayload.timesheet.expenseSubmissions[0].hasReceipt, true);
  } finally {
    await app.shutdown();
  }
});

await runCase("new admin sees onboarding until setup is completed", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const adminUser = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@crewtime.local" },
      select: { companyId: true },
    });
    await prisma.company.update({
      where: { id: adminUser.companyId },
      data: {
        onboardingCompletedAt: null,
        onboardingCompletedByUserId: null,
      },
    });

    const bootstrapResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await bootstrapResponse.json();

    assert.equal(bootstrapResponse.status, 200);
    assert.equal(payload.companySettings.setupComplete, false);
  } finally {
    await app.shutdown();
  }
});

await runCase("company setup creates a default crew and current-week timesheets", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const adminUser = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@crewtime.local" },
      select: { companyId: true },
    });
    await prisma.company.update({
      where: { id: adminUser.companyId },
      data: {
        onboardingCompletedAt: null,
        onboardingCompletedByUserId: null,
      },
    });

    const setupResponse = await app.api("/api/company-setup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyName: "Fieldstone Roofing",
        ownerName: "Jeff Mohler",
        weekStartDay: 1,
        employees: [
          { displayName: "Ana Torres", hourlyRate: 28, workerType: "w2" },
          { displayName: "Ben Cruz", hourlyRate: 24, workerType: "1099" },
        ],
        timeTrackingStyle: "mixed",
        lunchDeductionMinutes: 60,
        payType: "hourly",
        payrollMethod: "manual",
        trackExpenses: true,
      }),
    });
    const payload = await setupResponse.json();

    assert.equal(setupResponse.status, 200);
    assert.equal(payload.companySettings.companyName, "Fieldstone Roofing");
    assert.equal(payload.companySettings.ownerName, "Jeff Mohler");
    assert.equal(payload.companySettings.setupComplete, true);
    assert.equal(payload.companySettings.timeTrackingStyle, "mixed");
    assert.equal(payload.companySettings.defaultLunchMinutes, 60);
    assert.equal(payload.companySettings.payType, "hourly");
    assert.equal(payload.companySettings.trackExpenses, true);

    const refreshedAdminUser = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@crewtime.local" },
      select: { companyId: true },
    });
    const crew = await prisma.crew.findFirstOrThrow({
      where: {
        name: "Main Crew",
        companyId: refreshedAdminUser.companyId,
      },
    });
    const employees = await prisma.employee.findMany({
      where: { defaultCrewId: crew.id },
      orderBy: { displayName: "asc" },
    });

    assert.equal(employees.length, 2);
    assert.deepEqual(
      employees.map((employee) => employee.displayName),
      ["Ana Torres", "Ben Cruz"],
    );
    assert.deepEqual(
      employees.map((employee) => employee.workerType),
      ["EMPLOYEE", "CONTRACTOR_1099"],
    );

    const createdWeeks = payload.employeeWeeks.filter((week) => week.crewName === "Main Crew");
    assert.equal(createdWeeks.length, 2);
    assert.ok(createdWeeks.every((week) => week.entries.every((entry) => entry.lunchMinutes === 60)));
  } finally {
    await app.shutdown();
  }
});

await runCase("time card estimates do not expose withholding fields", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mePayload = await meResponse.json();
    const troyWeek = mePayload.employeeWeeks.find((week) => week.employeeName === "Troy Bennett");

    assert.equal(mePayload.companySettings.companyState, "MA");
    assert.ok(troyWeek.payrollEstimate.grossPay > 0);
    assert.equal(troyWeek.grossPay, troyWeek.payrollEstimate.grossPay);
    assert.equal("netCheckEstimate" in troyWeek.payrollEstimate, false);
    assert.equal("reimbursements" in troyWeek.payrollEstimate, false);
    assert.equal("deductions" in troyWeek.payrollEstimate, false);
    assert.equal("pfmlWithholding" in troyWeek.payrollEstimate, false);
    assert.equal("extraStateWithholdingLabel" in troyWeek.payrollEstimate, false);
  } finally {
    await app.shutdown();
  }
});

await runCase("company state update keeps the time card settings contract", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const updateResponse = await app.api("/api/company-settings", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyState: "CA",
      }),
    });

    assert.equal(updateResponse.status, 200);

    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mePayload = await meResponse.json();

    assert.equal(mePayload.companySettings.companyState, "CA");
    assert.equal(mePayload.companySettings.payrollMethod, "service");
    assert.equal("supportLevel" in mePayload.companySettings, false);
    assert.equal("stateDisclaimer" in mePayload.companySettings, false);
  } finally {
    await app.shutdown();
  }
});

await runCase("changing company state does not return state tax defaults", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const updateResponse = await app.api("/api/company-settings", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyState: "CA",
      }),
    });
    const payload = await updateResponse.json();

    assert.equal(updateResponse.status, 200);
    assert.equal(payload.companySettings.companyState, "CA");
    assert.equal(payload.companySettings.payrollMethod, "service");
    assert.equal("supportLevel" in payload.companySettings, false);
    assert.equal("defaultStateWithholdingMode" in payload.companySettings, false);
    assert.equal("defaultStateWithholdingValue" in payload.companySettings, false);
  } finally {
    await app.shutdown();
  }
});

// ---------------------------------------------------------------------------
// Crew management: office adds crews, picks crew chiefs, moves workers.
// ---------------------------------------------------------------------------

function jsonRequest(token, method, body) {
  return {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

async function employeeIdByName(companyEmail, displayName) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: companyEmail }, select: { companyId: true } });
  const employee = await prisma.employee.findFirstOrThrow({
    where: { companyId: user.companyId, displayName },
    select: { id: true },
  });
  return employee.id;
}

await runCase("office adds a crew, moves a worker onto it, and his open week follows him", async () => {
  const app = await bootApp();
  try {
    const adminToken = await app.login("admin@crewtime.local", "admin123");

    const created = await app.api("/api/crews", jsonRequest(adminToken, "POST", { name: "  Chimney   Crew " }));
    const createdPayload = await created.json();
    assert.equal(created.status, 201);
    const chimney = createdPayload.crews.find((crew) => crew.name === "Chimney Crew");
    assert.ok(chimney, "crew name is trimmed and collapsed");
    assert.equal(chimney.chiefEmployeeId, null);

    const duplicate = await app.api("/api/crews", jsonRequest(adminToken, "POST", { name: "chimney crew" }));
    assert.equal(duplicate.status, 409);

    // Load the current week so every active worker has a timesheet for it.
    const current = await app.api("/api/auth/me", { headers: { Authorization: `Bearer ${adminToken}` } });
    const currentPayload = await current.json();
    const currentWeekStart = new Date(`${currentPayload.weekStart}T00:00:00`);

    const marcoId = await employeeIdByName("admin@crewtime.local", "Marco Diaz");
    const masonry = currentPayload.crews.find((crew) => crew.name === "Masonry Crew");

    const moved = await app.api(`/api/crews/${chimney.id}/members/${marcoId}`, jsonRequest(adminToken, "PUT"));
    const movedPayload = await moved.json();
    assert.equal(moved.status, 200);
    assert.equal(movedPayload.workers.find((worker) => worker.employeeId === marcoId).crewId, chimney.id);
    assert.ok(movedPayload.crews.find((crew) => crew.id === chimney.id).memberIds.includes(marcoId));

    const marcoWeeks = await prisma.timesheetWeek.findMany({
      where: { employeeId: marcoId },
      select: { crewId: true, weekStartDate: true },
    });
    const thisWeek = marcoWeeks.find((week) => week.weekStartDate.getTime() === currentWeekStart.getTime());
    const seededWeek = marcoWeeks.find((week) => week.weekStartDate.getTime() === new Date(`${WEEK_START}T00:00:00`).getTime());
    assert.equal(thisWeek.crewId, chimney.id, "open week follows the worker to his new crew");
    assert.equal(seededWeek.crewId, masonry.id, "past weeks stay with the crew that worked them");

    const removed = await app.api(`/api/crews/${chimney.id}/members/${marcoId}`, jsonRequest(adminToken, "DELETE"));
    assert.equal(removed.status, 200);
    const marco = await prisma.employee.findUniqueOrThrow({ where: { id: marcoId }, select: { defaultCrewId: true } });
    assert.equal(marco.defaultCrewId, null);
  } finally {
    await app.shutdown();
  }
});

await runCase("office picks a crew chief: chief gets foreman access, sees his crew, and cannot approve himself", async () => {
  const app = await bootApp();
  try {
    const adminToken = await app.login("admin@crewtime.local", "admin123");
    const marcoToken = await app.login("marco@crewtime.local", "employee123");
    const marcoId = await employeeIdByName("admin@crewtime.local", "Marco Diaz");
    const troyId = await employeeIdByName("admin@crewtime.local", "Troy Bennett");

    const created = await app.api(
      "/api/crews",
      jsonRequest(adminToken, "POST", { name: "Stone Crew", chiefEmployeeId: marcoId }),
    );
    const createdPayload = await created.json();
    assert.equal(created.status, 201);
    const stone = createdPayload.crews.find((crew) => crew.name === "Stone Crew");
    assert.equal(stone.chiefEmployeeId, marcoId);
    assert.ok(stone.memberIds.includes(marcoId), "the chief works on the crew he runs");

    const marcoUser = await prisma.user.findUniqueOrThrow({ where: { email: "marco@crewtime.local" }, select: { role: true } });
    assert.equal(marcoUser.role, "FOREMAN");

    const addTroy = await app.api(`/api/crews/${stone.id}/members/${troyId}`, jsonRequest(adminToken, "PUT"));
    assert.equal(addTroy.status, 200);

    const board = await app.api("/api/auth/me", { headers: { Authorization: `Bearer ${marcoToken}` } });
    const boardPayload = await board.json();
    assert.equal(board.status, 200);
    assert.equal(boardPayload.viewer.role, "foreman");
    assert.deepEqual(boardPayload.crews.map((crew) => crew.name), ["Stone Crew"]);
    const ownWeek = boardPayload.employeeWeeks.find((week) => week.employeeId === marcoId);
    const troyWeek = boardPayload.employeeWeeks.find((week) => week.employeeId === troyId);
    assert.ok(ownWeek, "crew chief sees his own week");
    assert.ok(troyWeek, "crew chief sees his crew's weeks");

    const selfApprove = await app.api(
      `/api/timesheets/${ownWeek.id}/status`,
      jsonRequest(marcoToken, "PATCH", { status: "foreman_approved" }),
    );
    assert.equal(selfApprove.status, 403);

    const selfSubmit = await app.api(
      `/api/timesheets/${ownWeek.id}/status`,
      jsonRequest(marcoToken, "PATCH", { status: "employee_confirmed" }),
    );
    const selfSubmitPayload = await selfSubmit.json();
    assert.equal(selfSubmit.status, 200);
    assert.equal(selfSubmitPayload.timesheet.status, "employee_confirmed");

    const approveTroy = await app.api(
      `/api/timesheets/${troyWeek.id}/status`,
      jsonRequest(marcoToken, "PATCH", { status: "foreman_approved" }),
    );
    assert.equal(approveTroy.status, 200);

    // Old crew chief of Masonry (Luis) no longer sees Troy's moved week.
    const luisToken = await app.login("luis@crewtime.local", "foreman123");
    const luisBoard = await (await app.api("/api/auth/me", { headers: { Authorization: `Bearer ${luisToken}` } })).json();
    assert.equal(luisBoard.employeeWeeks.some((week) => week.id === troyWeek.id), false);

    const cleared = await app.api(`/api/crews/${stone.id}`, jsonRequest(adminToken, "PATCH", { chiefEmployeeId: null }));
    assert.equal(cleared.status, 200);
    const marcoAfter = await prisma.user.findUniqueOrThrow({ where: { email: "marco@crewtime.local" }, select: { role: true } });
    assert.equal(marcoAfter.role, "EMPLOYEE", "leading no crew puts the login back to worker");

    const renamed = await app.api(`/api/crews/${stone.id}`, jsonRequest(adminToken, "PATCH", { name: "Stone & Block" }));
    const renamedPayload = await renamed.json();
    assert.equal(renamed.status, 200);
    assert.ok(renamedPayload.crews.some((crew) => crew.name === "Stone & Block"));
  } finally {
    await app.shutdown();
  }
});

await runCase("crews can only be removed when empty and without history", async () => {
  const app = await bootApp();
  try {
    const adminToken = await app.login("admin@crewtime.local", "admin123");
    const roster = await (await app.api("/api/crews", { headers: { Authorization: `Bearer ${adminToken}` } })).json();
    const masonry = roster.crews.find((crew) => crew.name === "Masonry Crew");

    const busy = await app.api(`/api/crews/${masonry.id}`, jsonRequest(adminToken, "DELETE"));
    assert.equal(busy.status, 409);

    const created = await (await app.api("/api/crews", jsonRequest(adminToken, "POST", { name: "Temp Crew" }))).json();
    const temp = created.crews.find((crew) => crew.name === "Temp Crew");
    const deleted = await app.api(`/api/crews/${temp.id}`, jsonRequest(adminToken, "DELETE"));
    const deletedPayload = await deleted.json();
    assert.equal(deleted.status, 200);
    assert.equal(deletedPayload.crews.some((crew) => crew.id === temp.id), false);
  } finally {
    await app.shutdown();
  }
});

await runCase("only the office can manage crews", async () => {
  const app = await bootApp();
  try {
    const foremanToken = await app.login("luis@crewtime.local", "foreman123");
    const employeeToken = await app.login("marco@crewtime.local", "employee123");
    for (const token of [foremanToken, employeeToken]) {
      const list = await app.api("/api/crews", { headers: { Authorization: `Bearer ${token}` } });
      assert.equal(list.status, 403);
      const create = await app.api("/api/crews", jsonRequest(token, "POST", { name: "Sneaky Crew" }));
      assert.equal(create.status, 403);
    }
  } finally {
    await app.shutdown();
  }
});

await runCase("crews and timesheets are fenced to their own company", async () => {
  const app = await bootApp();
  try {
    const crewtimeAdmin = await app.login("admin@crewtime.local", "admin123");
    const apexAdmin = await app.login("admin@apexroofing.local", "apex_admin123");
    const crewtimeBoard = await (
      await app.api(`/api/auth/me?weekStart=${WEEK_START}`, { headers: { Authorization: `Bearer ${crewtimeAdmin}` } })
    ).json();
    const otherCrew = crewtimeBoard.crews[0];
    const otherWeek = crewtimeBoard.employeeWeeks[0];
    const marcoId = await employeeIdByName("admin@crewtime.local", "Marco Diaz");

    const rename = await app.api(`/api/crews/${otherCrew.id}`, jsonRequest(apexAdmin, "PATCH", { name: "Hijacked" }));
    assert.equal(rename.status, 404);
    const move = await app.api(`/api/crews/${otherCrew.id}/members/${marcoId}`, jsonRequest(apexAdmin, "PUT"));
    assert.equal(move.status, 404);
    const lock = await app.api(
      `/api/timesheets/${otherWeek.id}/status`,
      jsonRequest(apexAdmin, "PATCH", { status: "office_locked" }),
    );
    assert.equal(lock.status, 403);
    const edit = await app.api(
      `/api/timesheets/${otherWeek.id}/days/${otherWeek.entries[0].id}`,
      jsonRequest(apexAdmin, "PATCH", { lunchMinutes: 0 }),
    );
    assert.equal(edit.status, 403);
    const defaults = await app.api(
      `/api/crews/${otherCrew.id}/defaults`,
      jsonRequest(apexAdmin, "POST", { weekStart: WEEK_START, dayIndex: 0, start: "06:00", end: "18:00" }),
    );
    assert.equal(defaults.status, 403);
    const invite = await app.api(
      "/api/company/invites",
      jsonRequest(apexAdmin, "POST", { email: "fence-test@apexroofing.local", role: "employee", crewId: otherCrew.id }),
    );
    assert.equal(invite.status, 400);

    const untouched = await prisma.timesheetWeek.findUniqueOrThrow({ where: { id: otherWeek.id }, select: { status: true } });
    assert.notEqual(untouched.status, "OFFICE_LOCKED");
  } finally {
    await app.shutdown();
  }
});

await runCase("invited foreman becomes chief of his crew when it has none", async () => {
  const app = await bootApp();
  try {
    const adminToken = await app.login("admin@crewtime.local", "admin123");
    const created = await (await app.api("/api/crews", jsonRequest(adminToken, "POST", { name: "Patio Crew" }))).json();
    const patio = created.crews.find((crew) => crew.name === "Patio Crew");
    const inviteEmail = `chief-${Date.now()}@crewtime.local`;

    const inviteResponse = await app.api(
      "/api/company/invites",
      jsonRequest(adminToken, "POST", { email: inviteEmail, role: "foreman", crewId: patio.id, hourlyRate: 30 }),
    );
    const invitePayload = await inviteResponse.json();
    assert.equal(inviteResponse.status, 201);
    const inviteToken = new URL(invitePayload.inviteUrl).searchParams.get("invite");

    const accept = await app.api("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: inviteToken, fullName: "Pat Chief", password: "chiefpass123" }),
    });
    assert.equal(accept.status, 201);

    const chiefToken = await app.login(inviteEmail, "chiefpass123");
    const board = await (await app.api("/api/auth/me", { headers: { Authorization: `Bearer ${chiefToken}` } })).json();
    assert.equal(board.viewer.role, "foreman");
    assert.deepEqual(board.crews.map((crew) => crew.name), ["Patio Crew"]);
    assert.equal(board.crews[0].foremanEmployeeId, board.viewer.employeeId);
    assert.ok(board.employeeWeeks.some((week) => week.employeeId === board.viewer.employeeId), "chief sees his own week");
  } finally {
    await app.shutdown();
  }
});

await runCase("worker picked as crew chief before he had a login gets foreman access when he accepts any invite", async () => {
  const app = await bootApp();
  try {
    const adminToken = await app.login("admin@crewtime.local", "admin123");
    const troyId = await employeeIdByName("admin@crewtime.local", "Troy Bennett");
    const created = await (
      await app.api("/api/crews", jsonRequest(adminToken, "POST", { name: "Block Crew", chiefEmployeeId: troyId }))
    ).json();
    assert.equal(created.crews.find((crew) => crew.name === "Block Crew").chiefEmployeeId, troyId);

    const inviteEmail = `troy-${Date.now()}@crewtime.local`;
    const inviteResponse = await app.api(
      "/api/company/invites",
      jsonRequest(adminToken, "POST", { email: inviteEmail, role: "employee", employeeId: troyId }),
    );
    const invitePayload = await inviteResponse.json();
    assert.equal(inviteResponse.status, 201);
    const inviteToken = new URL(invitePayload.inviteUrl).searchParams.get("invite");
    const accept = await app.api("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: inviteToken, fullName: "Troy Bennett", password: "troypass123" }),
    });
    assert.equal(accept.status, 201);

    const troyToken = await app.login(inviteEmail, "troypass123");
    const board = await (await app.api("/api/auth/me", { headers: { Authorization: `Bearer ${troyToken}` } })).json();
    assert.equal(board.viewer.role, "foreman");
    assert.deepEqual(board.crews.map((crew) => crew.name), ["Block Crew"]);
  } finally {
    await app.shutdown();
  }
});

await seedDatabase();
console.log("All workflow tests passed.");

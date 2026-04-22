import assert from "node:assert/strict";
import { startServer } from "../dist-server/server/index.js";
import { prisma } from "../dist-server/server/db.js";
import { seedDatabase } from "../dist-server/prisma/seed.js";

const WEEK_START = "2026-04-13";

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
    const response = await api("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(response.status, 200);
    return (await response.json()).token;
  }

  async function signup(fullName, companyName, email, password) {
    const response = await api("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, companyName, email, password }),
    });
    assert.equal(response.status, 201);
    return (await response.json()).token;
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
  } finally {
    await app.shutdown();
  }
});

await runCase("employee cannot export payroll", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("marco@crewtime.local", "employee123");
    const response = await app.api(`/api/exports/payroll-summary.csv?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 403);
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
    assert.ok(firstWeek.ytdSummary.grossPayments >= firstWeek.payrollEstimate.grossPay);
    assert.ok(firstWeek.ytdSummary.netEstimate >= firstWeek.payrollEstimate.netCheckEstimate);
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
        employees: [{ displayName: "Crew One", hourlyRate: 28, workerType: "w2" }],
        timeTrackingStyle: "foreman",
        lunchDeductionMinutes: 30,
        payType: "hourly_overtime",
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
    assert.match(invitePayload.inviteUrl, /\?invite=/);

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
        password: "invitepass123",
      }),
    });
    const acceptPayload = await acceptResponse.json();

    assert.equal(acceptResponse.status, 200);
    assert.ok(acceptPayload.token);

    const bootstrapResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${acceptPayload.token}` },
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
    const timesheetId = mePayload.employeeWeeks[0].id;

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
    const timesheetId = mePayload.employeeWeeks[0].id;

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
    const timesheetId = mePayload.employeeWeeks[0].id;

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

await runCase("payroll estimate updates correctly after adjustment edits", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mePayload = await meResponse.json();
    const timesheet = mePayload.employeeWeeks[0];
    const beforeNet = timesheet.payrollEstimate.netCheckEstimate;

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
    assert.equal(payload.timesheet.payrollEstimate.netCheckEstimate, beforeNet + 25);
    assert.equal(payload.timesheet.adjustment.notes, "Office adjustment test.");
    assert.ok(payload.timesheet.ytdSummary.netEstimate >= payload.timesheet.payrollEstimate.netCheckEstimate);
  } finally {
    await app.shutdown();
  }
});

await runCase("new admin sees onboarding until setup is completed", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const company = await prisma.company.findFirstOrThrow();
    await prisma.company.update({
      where: { id: company.id },
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
    const company = await prisma.company.findFirstOrThrow();
    await prisma.company.update({
      where: { id: company.id },
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
        employees: [
          { displayName: "Ana Torres", hourlyRate: 28, workerType: "w2" },
          { displayName: "Ben Cruz", hourlyRate: 24, workerType: "1099" },
        ],
        timeTrackingStyle: "mixed",
        lunchDeductionMinutes: 60,
        payType: "hourly",
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

    const crew = await prisma.crew.findFirstOrThrow({ where: { name: "Main Crew" } });
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

await runCase("Massachusetts payroll estimate keeps PFML separate", async () => {
  const app = await bootApp();
  try {
    const token = await app.login("admin@crewtime.local", "admin123");
    const meResponse = await app.api(`/api/auth/me?weekStart=${WEEK_START}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mePayload = await meResponse.json();
    const troyWeek = mePayload.employeeWeeks.find((week) => week.employeeName === "Troy Bennett");

    assert.equal(mePayload.companySettings.companyState, "MA");
    assert.ok(troyWeek.payrollEstimate.pfmlWithholding > 0);
    assert.equal(troyWeek.payrollEstimate.extraStateWithholdingLabel, "PFML");
  } finally {
    await app.shutdown();
  }
});

await runCase("unsupported state switches payroll review to manual reminder", async () => {
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

    assert.equal(mePayload.companySettings.supportLevel, "unsupported");
    assert.match(mePayload.companySettings.stateDisclaimer, /do not yet support accurate state-specific withholding/i);
  } finally {
    await app.shutdown();
  }
});

await runCase("changing company state resets state defaults to the selected state's support profile", async () => {
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
    assert.equal(payload.companySettings.supportLevel, "unsupported");
    assert.equal(payload.companySettings.defaultStateWithholdingMode, "manual_override");
    assert.equal(payload.companySettings.defaultStateWithholdingValue, 0);
  } finally {
    await app.shutdown();
  }
});

await seedDatabase();
console.log("All workflow tests passed.");

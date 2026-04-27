import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../auth.js";
import { prisma } from "../db.js";
import { formatIsoDate, parseWeekStart } from "../utils.js";
import {
  asyncHandler,
  authorizeAdmin,
  buildBootstrap,
  createCsvRow,
  escapeHtml,
  EXPORT_REMINDER,
  markLockedWeeksExported,
} from "./helpers.js";

const router = Router();

router.get("/exports/payroll-summary.csv", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const weekStart = parseWeekStart(typeof req.query.weekStart === "string" ? req.query.weekStart : undefined);
  const payload = await buildBootstrap(req.auth!.userId, req.auth!.role, req.auth!.companyId, weekStart);
  await markLockedWeeksExported(weekStart, req.auth!.userId);
  const rows = [
    createCsvRow([
      "Employee",
      "Crew",
      "Status",
      "Regular Hours",
      "Overtime Hours",
      "Gross Pay",
      "Federal Withholding",
      "State Withholding",
      "PFML",
      "Reimbursements",
      "Deductions",
      "Net Check Estimate",
    ]),
    ...payload.employeeWeeks.map((week) =>
      createCsvRow([
        week.employeeName,
        week.crewName,
        week.status,
        week.payrollEstimate.regularHours.toFixed(2),
        week.payrollEstimate.overtimeHours.toFixed(2),
        week.payrollEstimate.grossPay.toFixed(2),
        week.payrollEstimate.federalWithholding.toFixed(2),
        week.payrollEstimate.stateWithholding.toFixed(2),
        week.payrollEstimate.pfmlWithholding.toFixed(2),
        week.payrollEstimate.reimbursements.toFixed(2),
        week.payrollEstimate.deductions.toFixed(2),
        week.payrollEstimate.netCheckEstimate.toFixed(2),
      ]),
    ),
  ];

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="payroll-summary-${payload.weekStart}.csv"`);
  res.send(rows.join("\n"));
}));

router.get("/exports/time-detail.csv", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const weekStart = parseWeekStart(typeof req.query.weekStart === "string" ? req.query.weekStart : undefined);
  const payload = await buildBootstrap(req.auth!.userId, req.auth!.role, req.auth!.companyId, weekStart);
  await markLockedWeeksExported(weekStart, req.auth!.userId);
  const rows = [
    createCsvRow(["Employee", "Crew", "Date", "Start", "End", "Lunch Minutes", "Hours", "Job Tag", "Daily Confirmed"]),
  ];

  for (const week of payload.employeeWeeks) {
    for (const entry of week.entries) {
      rows.push(
        createCsvRow([
          week.employeeName,
          week.crewName,
          entry.date,
          entry.start,
          entry.end,
          entry.lunchMinutes,
          entry.totalHours.toFixed(2),
          entry.jobTag ?? "",
          entry.employeeConfirmed ? "yes" : "no",
        ]),
      );
    }
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="time-detail-${payload.weekStart}.csv"`);
  res.send(rows.join("\n"));
}));

router.get("/exports/qbo-preview.json", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const weekStart = parseWeekStart(typeof req.query.weekStart === "string" ? req.query.weekStart : undefined);
  const companyId = req.auth!.companyId;

  const timesheets = await prisma.timesheetWeek.findMany({
    where: { weekStartDate: weekStart, employee: { companyId } },
    include: {
      employee: true,
      dayEntries: { orderBy: { dayIndex: "asc" } },
    },
  });

  const warnings: string[] = [];
  const errors: string[] = [];

  let totalMinutes = 0;
  const employeeSet = new Set<string>();

  for (const ts of timesheets) {
    if (ts.status !== "OFFICE_LOCKED") {
      warnings.push(`${ts.employee.displayName} — week not locked (status: ${ts.status})`);
    }
    for (const day of ts.dayEntries) {
      if (day.totalMinutes > 0) {
        totalMinutes += day.totalMinutes;
        employeeSet.add(ts.employeeId);
      }
    }
  }

  const totalHours = totalMinutes / 60;

  if (timesheets.length === 0) {
    errors.push("No timesheets found for this week.");
  }

  res.json({
    weekStart: formatIsoDate(weekStart),
    totalEmployees: employeeSet.size,
    totalHours: Math.round(totalHours * 100) / 100,
    warnings,
    errors,
    isReady: errors.length === 0,
  });
}));

router.get("/exports/qbo.csv", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const weekStart = parseWeekStart(typeof req.query.weekStart === "string" ? req.query.weekStart : undefined);
  const companyId = req.auth!.companyId;
  const exportedByUserId = req.auth!.userId;

  const timesheets = await prisma.timesheetWeek.findMany({
    where: { weekStartDate: weekStart, employee: { companyId } },
    include: {
      employee: true,
      crew: true,
      dayEntries: { orderBy: { dayIndex: "asc" } },
    },
    orderBy: [{ crew: { name: "asc" } }, { employee: { displayName: "asc" } }],
  });

  const rows = [createCsvRow(["NAME", "TXNDATE", "TIME", "CUSTOMER", "SERVICEITEM", "DESCRIPTION"])];
  let totalMinutes = 0;

  for (const ts of timesheets) {
    for (const day of ts.dayEntries) {
      if (day.totalMinutes <= 0) continue;
      const hours = day.totalMinutes / 60;
      const date = new Date(day.workDate);
      const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(date.getUTCDate()).padStart(2, "0");
      const yyyy = date.getUTCFullYear();
      const txnDate = `${dd}/${mm}/${yyyy}`;
      const customer = ts.crew.name;
      const serviceItem = "Services";
      const description = day.jobTag ?? "";
      rows.push(createCsvRow([ts.employee.displayName, txnDate, hours.toFixed(2), customer, serviceItem, description]));
      totalMinutes += day.totalMinutes;
    }
  }

  const totalHours = totalMinutes / 60;
  const fileName = `qbo-time-${formatIsoDate(weekStart)}.csv`;

  await prisma.payrollExport.create({
    data: {
      companyId,
      weekStart: formatIsoDate(weekStart),
      exportKind: "qbo",
      totalRows: rows.length - 1,
      totalHours: Math.round(totalHours * 100) / 100,
      fileName,
      exportedByUserId,
    },
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(rows.join("\n"));
}));

router.get("/exports/history", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const companyId = req.auth!.companyId;

  const exports = await prisma.payrollExport.findMany({
    where: { companyId },
    include: {
      exportedByUser: { select: { id: true, fullName: true } },
    },
    orderBy: { exportedAt: "desc" },
    take: 50,
  });

  res.json({
    exports: exports.map((e) => ({
      id: e.id,
      weekStart: e.weekStart,
      exportKind: e.exportKind,
      totalRows: e.totalRows,
      totalHours: e.totalHours,
      fileName: e.fileName,
      exportedAt: e.exportedAt.toISOString(),
      exportedBy: e.exportedByUser.fullName,
    })),
  });
}));

router.get("/exports/weekly-summary", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const weekStart = parseWeekStart(typeof req.query.weekStart === "string" ? req.query.weekStart : undefined);
  const payload = await buildBootstrap(req.auth!.userId, req.auth!.role, req.auth!.companyId, weekStart);
  await markLockedWeeksExported(weekStart, req.auth!.userId);
  const payrollReminder = payload.companySettings?.payrollReminder ?? EXPORT_REMINDER;
  const cards = payload.employeeWeeks
    .map(
      (week) => `
      <section class="card">
        <header>
          <div>
            <h2>${escapeHtml(week.employeeName)}</h2>
            <p>${escapeHtml(week.crewName)} - ${escapeHtml(week.status.replace(/_/g, " "))}</p>
          </div>
          <div class="check-estimate">
            <span>Final check estimate</span>
            <strong>$${week.payrollEstimate.netCheckEstimate.toFixed(2)}</strong>
          </div>
        </header>
        <table>
          <thead>
            <tr><th>Day</th><th>Start</th><th>End</th><th>Lunch</th><th>Hours</th><th>Tag</th></tr>
          </thead>
          <tbody>
            ${week.entries
              .map(
                (entry) => `
                  <tr>
                    <td>${escapeHtml(entry.dayLabel)}</td>
                    <td>${escapeHtml(entry.start || "--")}</td>
                    <td>${escapeHtml(entry.end || "--")}</td>
                    <td>${entry.lunchMinutes}</td>
                    <td>${entry.totalHours.toFixed(2)}</td>
                    <td>${escapeHtml(entry.jobTag ?? "")}</td>
                  </tr>`,
              )
              .join("")}
          </tbody>
        </table>
        <div class="summary-grid">
          <div><span>Regular hours</span><strong>${week.payrollEstimate.regularHours.toFixed(2)}</strong></div>
          <div><span>Overtime hours</span><strong>${week.payrollEstimate.overtimeHours.toFixed(2)}</strong></div>
          <div><span>Gross pay</span><strong>$${week.payrollEstimate.grossPay.toFixed(2)}</strong></div>
          <div><span>Federal withholding</span><strong>$${week.payrollEstimate.federalWithholding.toFixed(2)}</strong></div>
          <div><span>State withholding</span><strong>$${week.payrollEstimate.stateWithholding.toFixed(2)}</strong></div>
          ${
            week.payrollEstimate.pfmlWithholding > 0
              ? `<div><span>PFML</span><strong>$${week.payrollEstimate.pfmlWithholding.toFixed(2)}</strong></div>`
              : ""
          }
          <div><span>Reimbursements</span><strong>$${week.payrollEstimate.reimbursements.toFixed(2)}</strong></div>
          <div><span>Deductions</span><strong>$${week.payrollEstimate.deductions.toFixed(2)}</strong></div>
          <div class="summary-grid__main"><span>Net check estimate</span><strong>$${week.payrollEstimate.netCheckEstimate.toFixed(2)}</strong></div>
        </div>
      </section>`,
    )
    .join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Weekly Summary ${payload.weekStart}</title>
        <style>
          :root { color-scheme: light; }
          * { box-sizing: border-box; }
          body { font-family: Inter, Arial, sans-serif; margin: 28px; color: #1d2430; background: #f5f7fb; }
          h1 { margin: 0 0 8px; font-size: 32px; }
          .subhead { color: #5f6f86; margin-bottom: 24px; }
          .card { background: #fff; border: 1px solid #ccd5e4; border-radius: 18px; padding: 18px; margin-bottom: 18px; break-inside: avoid; box-shadow: 0 10px 24px rgba(18, 33, 58, 0.06); }
          header { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
          header p { color: #5f6f86; margin: 4px 0 0; text-transform: capitalize; }
          h2 { margin: 0; font-size: 22px; }
          .check-estimate { background: linear-gradient(180deg, #eaf4ff 0%, #f7fbff 100%); border: 1px solid #cfe0ff; border-radius: 16px; min-width: 220px; padding: 12px 14px; }
          .check-estimate span { color: #45628b; display: block; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
          .check-estimate strong { color: #163e84; display: block; font-size: 26px; margin-top: 6px; }
          table { border-collapse: collapse; width: 100%; margin-top: 14px; }
          th, td { border-bottom: 1px solid #e4e8f0; padding: 8px; text-align: left; font-size: 14px; }
          th { color: #5f6f86; font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; }
          .summary-grid { display: grid; gap: 10px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 14px; }
          .summary-grid div { background: #f8fafe; border: 1px solid #e4e8f0; border-radius: 14px; padding: 10px 12px; }
          .summary-grid span { color: #5f6f86; display: block; font-size: 12px; }
          .summary-grid strong { display: block; font-size: 18px; margin-top: 4px; }
          .summary-grid__main { background: #edf5ff !important; border-color: #cfe0ff !important; }
          .summary-grid__main strong { color: #163e84; font-size: 22px; }
          @media print { body { background: #fff; margin: 14px; } .card { box-shadow: none; } }
        </style>
      </head>
      <body>
        <h1>Weekly Summary - ${payload.weekStart}</h1>
        <p class="subhead">Printable office handoff with the same payroll-prep totals shown in the dashboard.</p>
        <p class="subhead"><strong>${escapeHtml(payrollReminder)}</strong></p>
        ${
          payload.companySettings && payload.companySettings.supportLevel !== "full"
            ? `<p class="subhead">${escapeHtml(payload.companySettings.stateDisclaimer)}</p>`
            : ""
        }
        ${cards}
      </body>
    </html>`);
}));

export { router as exportsRouter };

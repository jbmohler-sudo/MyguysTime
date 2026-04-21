import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { pathToFileURL } from "node:url";
import { calculateDayTotalMinutes, calculatePayrollEstimate } from "../server/payroll.js";
import { addDays } from "../server/utils.js";

const PAYROLL_DISCLAIMER_VERSION = "2026-04-20-v1";
export const PAYROLL_PREP_DISCLAIMER = `Important: Payroll Estimates

This app is designed to help you track hours and estimate pay and withholdings.
It is not a payroll service and does not guarantee full tax compliance.

While we strive to provide accurate calculations, tax rates and rules vary by state and may change.
Please review all numbers and confirm with your accountant or official state resources before issuing payments.

By continuing, you acknowledge that you are responsible for verifying payroll amounts.`;

const UNSUPPORTED_STATE_MESSAGE =
  "We do not yet support accurate state-specific withholding calculations for this state. You can still use the app for time tracking and payroll prep, but please confirm state-specific withholding with your accountant or official state resources.";

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function seedDatabase() {
  const prisma = new PrismaClient();

  try {
    await prisma.statePayrollRule.createMany({
      data: [
        {
          stateCode: "AK",
          stateName: "Alaska",
          supportLevel: "FULL",
          hasStateIncomeTax: false,
          hasExtraEmployeeWithholdings: false,
          defaultStateWithholdingMode: "PERCENTAGE",
          defaultStateWithholdingValue: 0,
          notes: "No state income tax withholding. Allow manual extra withholding entry if office needs it.",
          lastReviewedAt: new Date("2026-04-20T09:00:00"),
          sourceLabel: "Internal payroll-prep baseline",
          sourceUrl: "https://www.mass.gov/info-details/paid-family-and-medical-leave-employer-contribution-rates-and-calculator",
        },
        {
          stateCode: "FL",
          stateName: "Florida",
          supportLevel: "FULL",
          hasStateIncomeTax: false,
          hasExtraEmployeeWithholdings: false,
          defaultStateWithholdingMode: "PERCENTAGE",
          defaultStateWithholdingValue: 0,
          notes: "No state income tax withholding. Allow manual extra withholding entry if office needs it.",
          lastReviewedAt: new Date("2026-04-20T09:00:00"),
          sourceLabel: "Internal payroll-prep baseline",
          sourceUrl: "https://www.irs.gov/",
        },
        {
          stateCode: "NV",
          stateName: "Nevada",
          supportLevel: "FULL",
          hasStateIncomeTax: false,
          hasExtraEmployeeWithholdings: false,
          defaultStateWithholdingMode: "PERCENTAGE",
          defaultStateWithholdingValue: 0,
          notes: "No state income tax withholding. Allow manual extra withholding entry if office needs it.",
          lastReviewedAt: new Date("2026-04-20T09:00:00"),
          sourceLabel: "Internal payroll-prep baseline",
          sourceUrl: "https://www.irs.gov/",
        },
        {
          stateCode: "NH",
          stateName: "New Hampshire",
          supportLevel: "FULL",
          hasStateIncomeTax: false,
          hasExtraEmployeeWithholdings: false,
          defaultStateWithholdingMode: "PERCENTAGE",
          defaultStateWithholdingValue: 0,
          notes: "No state income tax withholding. Allow manual extra withholding entry if office needs it.",
          lastReviewedAt: new Date("2026-04-20T09:00:00"),
          sourceLabel: "Internal payroll-prep baseline",
          sourceUrl: "https://www.irs.gov/",
        },
        {
          stateCode: "SD",
          stateName: "South Dakota",
          supportLevel: "FULL",
          hasStateIncomeTax: false,
          hasExtraEmployeeWithholdings: false,
          defaultStateWithholdingMode: "PERCENTAGE",
          defaultStateWithholdingValue: 0,
          notes: "No state income tax withholding. Allow manual extra withholding entry if office needs it.",
          lastReviewedAt: new Date("2026-04-20T09:00:00"),
          sourceLabel: "Internal payroll-prep baseline",
          sourceUrl: "https://www.irs.gov/",
        },
        {
          stateCode: "TN",
          stateName: "Tennessee",
          supportLevel: "FULL",
          hasStateIncomeTax: false,
          hasExtraEmployeeWithholdings: false,
          defaultStateWithholdingMode: "PERCENTAGE",
          defaultStateWithholdingValue: 0,
          notes: "No state income tax withholding. Allow manual extra withholding entry if office needs it.",
          lastReviewedAt: new Date("2026-04-20T09:00:00"),
          sourceLabel: "Internal payroll-prep baseline",
          sourceUrl: "https://www.irs.gov/",
        },
        {
          stateCode: "TX",
          stateName: "Texas",
          supportLevel: "FULL",
          hasStateIncomeTax: false,
          hasExtraEmployeeWithholdings: false,
          defaultStateWithholdingMode: "PERCENTAGE",
          defaultStateWithholdingValue: 0,
          notes: "No state income tax withholding. Allow manual extra withholding entry if office needs it.",
          lastReviewedAt: new Date("2026-04-20T09:00:00"),
          sourceLabel: "Internal payroll-prep baseline",
          sourceUrl: "https://www.irs.gov/",
        },
        {
          stateCode: "WA",
          stateName: "Washington",
          supportLevel: "FULL",
          hasStateIncomeTax: false,
          hasExtraEmployeeWithholdings: false,
          defaultStateWithholdingMode: "PERCENTAGE",
          defaultStateWithholdingValue: 0,
          notes: "No state income tax withholding. Allow manual extra withholding entry if office needs it.",
          lastReviewedAt: new Date("2026-04-20T09:00:00"),
          sourceLabel: "Internal payroll-prep baseline",
          sourceUrl: "https://www.irs.gov/",
        },
        {
          stateCode: "WY",
          stateName: "Wyoming",
          supportLevel: "FULL",
          hasStateIncomeTax: false,
          hasExtraEmployeeWithholdings: false,
          defaultStateWithholdingMode: "PERCENTAGE",
          defaultStateWithholdingValue: 0,
          notes: "No state income tax withholding. Allow manual extra withholding entry if office needs it.",
          lastReviewedAt: new Date("2026-04-20T09:00:00"),
          sourceLabel: "Internal payroll-prep baseline",
          sourceUrl: "https://www.irs.gov/",
        },
        {
          stateCode: "MA",
          stateName: "Massachusetts",
          supportLevel: "FULL",
          hasStateIncomeTax: true,
          hasExtraEmployeeWithholdings: true,
          extraWithholdingTypes: "PFML",
          defaultStateWithholdingMode: "PERCENTAGE",
          defaultStateWithholdingValue: 0.05,
          defaultPfmlEnabled: true,
          defaultPfmlEmployeeRate: 0.0045,
          notes: "Massachusetts payroll-prep support includes state withholding estimate plus PFML shown as a separate line.",
          disclaimerText:
            "Massachusetts payroll-prep support includes separate PFML handling. Review all withholding amounts before issuing checks.",
          lastReviewedAt: new Date("2026-04-20T09:00:00"),
          sourceLabel: "Massachusetts payroll-prep review",
          sourceUrl: "https://www.mass.gov/info-details/paid-family-and-medical-leave-employer-contribution-rates-and-calculator",
        },
        {
          stateCode: "CA",
          stateName: "California",
          supportLevel: "UNSUPPORTED",
          hasStateIncomeTax: true,
          hasExtraEmployeeWithholdings: false,
          defaultStateWithholdingMode: "MANUAL_OVERRIDE",
          defaultStateWithholdingValue: 0,
          notes: UNSUPPORTED_STATE_MESSAGE,
          disclaimerText: UNSUPPORTED_STATE_MESSAGE,
          lastReviewedAt: new Date("2026-04-20T09:00:00"),
          sourceLabel: "Internal unsupported-state fallback",
          sourceUrl: "https://www.ftb.ca.gov/",
        },
      ],
    });

    const company = await prisma.company.create({
      data: {
        companyName: "Crew Time Masonry & Roofing",
        ownerName: "Dana Office",
        stateCode: "MA",
      },
    });

    const companyRule = await prisma.statePayrollRule.findUniqueOrThrow({
      where: { stateCode: company.stateCode },
    });

    await prisma.companyPayrollSettings.create({
      data: {
        companyId: company.id,
        defaultFederalWithholdingMode: "PERCENTAGE",
        defaultFederalWithholdingValue: 0.1,
        defaultStateWithholdingMode: companyRule.defaultStateWithholdingMode,
        defaultStateWithholdingValue: companyRule.defaultStateWithholdingValue,
        timeTrackingStyle: "FOREMAN",
        defaultLunchMinutes: 30,
        payType: "HOURLY_OVERTIME",
        trackExpenses: true,
        payrollPrepDisclaimer: PAYROLL_PREP_DISCLAIMER,
        pfmlEnabled: companyRule.defaultPfmlEnabled,
        pfmlEmployeeRate: companyRule.defaultPfmlEmployeeRate,
        extraWithholdingLabel: companyRule.extraWithholdingTypes === "PFML" ? "PFML" : "Manual state withholding",
        extraWithholdingRate: companyRule.extraWithholdingTypes === "PFML" ? companyRule.defaultPfmlEmployeeRate : null,
        supportLevelSnapshot: companyRule.supportLevel,
      },
    });

    const masonryCrew = await prisma.crew.create({
      data: { name: "Masonry Crew", companyId: company.id },
    });

    const roofingCrew = await prisma.crew.create({
      data: { name: "Roofing Crew", companyId: company.id },
    });

    const luis = await prisma.employee.create({
      data: {
        companyId: company.id,
        firstName: "Luis",
        lastName: "Ortega",
        displayName: "Luis Ortega",
        hourlyRateCents: 3400,
        defaultCrewId: masonryCrew.id,
        usesCompanyFederalDefault: false,
        usesCompanyStateDefault: false,
        federalWithholdingPercent: 0.11,
        stateWithholdingPercent: 0.04,
      },
    });

    const marco = await prisma.employee.create({
      data: {
        companyId: company.id,
        firstName: "Marco",
        lastName: "Diaz",
        displayName: "Marco Diaz",
        hourlyRateCents: 2900,
        defaultCrewId: masonryCrew.id,
        usesCompanyFederalDefault: false,
        usesCompanyStateDefault: false,
        federalWithholdingPercent: 0.11,
        stateWithholdingPercent: 0.04,
      },
    });

    const troy = await prisma.employee.create({
      data: {
        companyId: company.id,
        firstName: "Troy",
        lastName: "Bennett",
        displayName: "Troy Bennett",
        hourlyRateCents: 2300,
        defaultCrewId: masonryCrew.id,
        usesCompanyFederalDefault: true,
        usesCompanyStateDefault: true,
        federalWithholdingPercent: 0.1,
        stateWithholdingPercent: companyRule.defaultStateWithholdingValue,
      },
    });

    const evan = await prisma.employee.create({
      data: {
        companyId: company.id,
        firstName: "Evan",
        lastName: "Brooks",
        displayName: "Evan Brooks",
        hourlyRateCents: 3100,
        defaultCrewId: roofingCrew.id,
        employmentStatus: "ARCHIVED",
        archiveReason: "Seasonal layoff",
        archiveNotes: "Eligible for rehire when residential roofing volume returns.",
        archivedAt: new Date("2026-04-10T12:00:00"),
      },
    });

    await prisma.crew.update({
      where: { id: masonryCrew.id },
      data: { foremanId: luis.id },
    });

    await prisma.crewAssignment.createMany({
      data: [
        { crewId: masonryCrew.id, employeeId: luis.id, startsOn: new Date("2026-01-01T00:00:00") },
        { crewId: masonryCrew.id, employeeId: marco.id, startsOn: new Date("2026-01-01T00:00:00") },
        { crewId: masonryCrew.id, employeeId: troy.id, startsOn: new Date("2026-01-01T00:00:00") },
        { crewId: roofingCrew.id, employeeId: evan.id, startsOn: new Date("2025-11-01T00:00:00"), endsOn: new Date("2026-04-10T00:00:00") },
      ],
    });

    const adminUser = await prisma.user.create({
      data: {
        email: "admin@crewtime.local",
        fullName: "Dana Office",
        passwordHash: await hashPassword("admin123"),
        role: "ADMIN",
      },
    });

    const foremanUser = await prisma.user.create({
      data: {
        email: "luis@crewtime.local",
        fullName: "Luis Ortega",
        passwordHash: await hashPassword("foreman123"),
        role: "FOREMAN",
        employeeId: luis.id,
      },
    });

    const employeeUser = await prisma.user.create({
      data: {
        email: "marco@crewtime.local",
        fullName: "Marco Diaz",
        passwordHash: await hashPassword("employee123"),
        role: "EMPLOYEE",
        employeeId: marco.id,
      },
    });

    await prisma.company.update({
      where: { id: company.id },
      data: {
        onboardingCompletedAt: new Date("2026-04-20T09:00:00"),
        onboardingCompletedByUserId: adminUser.id,
        payrollDisclaimerAcceptedAt: new Date("2026-04-20T09:00:00"),
        payrollDisclaimerAcceptedByUserId: adminUser.id,
        payrollDisclaimerVersion: PAYROLL_DISCLAIMER_VERSION,
      },
    });

    const weekStart = new Date("2026-04-13T00:00:00");
    const entriesByEmployee: Record<string, Array<{ start: number | null; end: number | null; lunch: number; tag?: string; confirmed?: boolean }>> = {
      [luis.id]: [
        { start: 420, end: 935, lunch: 30, tag: "School wall", confirmed: true },
        { start: 420, end: 930, lunch: 30, tag: "School wall", confirmed: true },
        { start: 420, end: 940, lunch: 30, tag: "School wall" },
        { start: 420, end: 950, lunch: 30, tag: "Church steps" },
        { start: 420, end: 920, lunch: 25, tag: "Church steps" },
        { start: 420, end: 730, lunch: 0, tag: "Cleanup" },
        { start: null, end: null, lunch: 0 },
      ],
      [marco.id]: [
        { start: 420, end: 935, lunch: 30, tag: "School wall", confirmed: true },
        { start: 420, end: 930, lunch: 30, tag: "School wall", confirmed: true },
        { start: 415, end: 940, lunch: 30, tag: "School wall" },
        { start: 425, end: 970, lunch: 30, tag: "Church steps" },
        { start: 420, end: 920, lunch: 25, tag: "Church steps" },
        { start: 420, end: 730, lunch: 0, tag: "Cleanup" },
        { start: null, end: null, lunch: 0 },
      ],
      [troy.id]: [
        { start: 420, end: 930, lunch: 30, tag: "School wall", confirmed: true },
        { start: 425, end: 928, lunch: 30, tag: "School wall", confirmed: true },
        { start: 420, end: 935, lunch: 30, tag: "School wall", confirmed: true },
        { start: 422, end: 962, lunch: 30, tag: "Church steps" },
        { start: 430, end: 910, lunch: 30, tag: "Church steps" },
        { start: null, end: null, lunch: 0 },
        { start: null, end: null, lunch: 0 },
      ],
    };

    const payrollSettings = await prisma.companyPayrollSettings.findUniqueOrThrow({
      where: { companyId: company.id },
    });

    for (const employee of [luis, marco, troy]) {
      const createdTimesheet = await prisma.timesheetWeek.create({
        data: {
          employeeId: employee.id,
          crewId: masonryCrew.id,
          weekStartDate: weekStart,
          status: employee.id === marco.id ? "EMPLOYEE_CONFIRMED" : "DRAFT",
          submittedByEmployeeAt: employee.id === marco.id ? new Date("2026-04-17T16:00:00") : null,
          dayEntries: {
            create: entriesByEmployee[employee.id].map((entry, dayIndex) => ({
              dayIndex,
              workDate: addDays(weekStart, dayIndex),
              startTimeMinutes: entry.start,
              endTimeMinutes: entry.end,
              lunchMinutes: entry.lunch,
              totalMinutes: calculateDayTotalMinutes({
                startTimeMinutes: entry.start,
                endTimeMinutes: entry.end,
                lunchMinutes: entry.lunch,
              }),
              jobTag: entry.tag,
              employeeConfirmed: Boolean(entry.confirmed),
            })),
          },
          adjustment: {
            create: {
              employeeId: employee.id,
              gasReimbursementCents: employee.id === marco.id ? 4000 : 0,
              pettyCashCents: employee.id === marco.id ? 1500 : 0,
              deductionCents: employee.id === troy.id ? 5000 : 0,
              note:
                employee.id === marco.id
                  ? "Picked up anchors and mortar color sample."
                  : employee.id === troy.id
                    ? "Cash advance for gloves and rain gear."
                    : "No additional reimbursement.",
            },
          },
        },
        include: {
          employee: true,
          dayEntries: true,
          adjustment: true,
        },
      });

      const estimate = calculatePayrollEstimate({
        employee,
        company,
        companyPayrollSettings: payrollSettings,
        stateRule: companyRule,
        dayEntries: createdTimesheet.dayEntries,
        adjustment: createdTimesheet.adjustment,
        existingEstimate: null,
      });

      await prisma.payrollEstimate.create({
        data: {
          employeeId: employee.id,
          timesheetWeekId: createdTimesheet.id,
          ...estimate,
        },
      });
    }

    await prisma.crewDayDefault.createMany({
      data: [
        { crewId: masonryCrew.id, weekStartDate: weekStart, dayIndex: 0, startTimeMinutes: 420, endTimeMinutes: 930 },
        { crewId: masonryCrew.id, weekStartDate: weekStart, dayIndex: 1, startTimeMinutes: 420, endTimeMinutes: 930 },
        { crewId: masonryCrew.id, weekStartDate: weekStart, dayIndex: 2, startTimeMinutes: 420, endTimeMinutes: 930 },
        { crewId: masonryCrew.id, weekStartDate: weekStart, dayIndex: 3, startTimeMinutes: 420, endTimeMinutes: 960 },
        { crewId: masonryCrew.id, weekStartDate: weekStart, dayIndex: 4, startTimeMinutes: 420, endTimeMinutes: 915 },
      ],
    });

    await prisma.privateReport.createMany({
      data: [
        {
          employeeId: troy.id,
          crewId: masonryCrew.id,
          reportDate: new Date("2026-04-16T00:00:00"),
          jobTag: "Church steps",
          category: "tardiness",
          severity: "medium",
          factualDescription: "Arrived 22 minutes late after start time and did not call ahead.",
          createdByUserId: foremanUser.id,
        },
        {
          employeeId: marco.id,
          crewId: masonryCrew.id,
          reportDate: new Date("2026-04-18T00:00:00"),
          jobTag: "Cleanup",
          category: "safety issue",
          severity: "low",
          factualDescription: "Worked on cleanup without eye protection until corrected by foreman.",
          createdByUserId: adminUser.id,
        },
      ],
    });

    return {
      adminUser,
      foremanUser,
      employeeUser,
      archivedEmployee: evan,
      companyId: company.id,
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const result = await seedDatabase();
  console.log("Seed complete.");
  console.log("Admin login: admin@crewtime.local / admin123");
  console.log("Foreman login: luis@crewtime.local / foreman123");
  console.log("Employee login: marco@crewtime.local / employee123");
  console.log(`Created company id: ${result.companyId}`);
  console.log(`Created extra user ids: ${result.employeeUser.id}, ${result.archivedEmployee.id}`);
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entryUrl) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

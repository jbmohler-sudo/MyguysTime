import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";
import { calculateDayTotalMinutes, calculatePayrollEstimate } from "../server/payroll.js";
import { getSupabaseAuthClient } from "../server/supabase.js";
import { assertSafeFixtureMutationContext } from "../server/envSafety.js";
import { addDays } from "../server/utils.js";

const PAYROLL_DISCLAIMER_VERSION = "2026-04-20-v1";
export const PAYROLL_PREP_DISCLAIMER = `Important: Time Card Review

This app is designed to help you track hours, adjustments, and job notes.
It is not a payroll service.

Please review hours and totals before sending them to the office or saving them for records.

By continuing, you acknowledge that you are responsible for verifying time card totals.`;

async function createOrUpdateUserAccount(
  prisma: PrismaClient,
  input: {
    email: string;
    fullName: string;
    role: "ADMIN" | "FOREMAN" | "EMPLOYEE";
    companyId: string;
    employeeId: string;
  },
) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      companyId: input.companyId,
      fullName: input.fullName,
      role: input.role,
      employeeId: input.employeeId,
      status: "ACTIVE",
      acceptedAt: existingUser?.acceptedAt ?? existingUser?.createdAt ?? new Date(),
      deactivatedAt: null,
    },
    create: {
      companyId: input.companyId,
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      employeeId: input.employeeId,
      status: "ACTIVE",
      acceptedAt: new Date(),
    },
  });
}

async function findSupabaseAuthUserByEmail(email: string) {
  const supabase = getSupabaseAuthClient();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const users = (data?.users ?? []) as Array<{ id: string; email?: string | null }>;
    const matchedUser = users.find((candidate) => candidate.email?.trim().toLowerCase() === email);
    if (matchedUser) {
      return matchedUser;
    }

    if (users.length < 200) {
      break;
    }

    page += 1;
  }

  return null;
}

async function ensureSupabaseAuthUser(input: {
  email: string;
  password: string;
}) {
  const supabase = getSupabaseAuthClient();
  const normalizedEmail = input.email.trim().toLowerCase();
  const existingUser = await findSupabaseAuthUserByEmail(normalizedEmail);

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      email: normalizedEmail,
      password: input.password,
      email_confirm: true,
    });

    if (error) {
      throw error;
    }

    return existingUser.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: input.password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw error ?? new Error(`Could not create auth user for ${normalizedEmail}.`);
  }

  return data.user.id;
}

export async function seedDatabase() {
  assertSafeFixtureMutationContext("prisma/seed.ts");

  const prisma = new PrismaClient();

  try {
    // Find or create the test company
    let company = await prisma.company.findFirst({
      where: { companyName: "Crew Time Masonry & Roofing" },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          companyName: "Crew Time Masonry & Roofing",
          ownerName: "Dana Office",
          stateCode: "MA",
        },
      });
    }

    company = await prisma.company.update({
      where: { id: company.id },
      data: {
        companyName: "Crew Time Masonry & Roofing",
        ownerName: "Dana Office",
        stateCode: "MA",
      },
    });

    await prisma.companyPayrollSettings.upsert({
      where: { companyId: company.id },
      update: {
        timeTrackingStyle: "FOREMAN",
        weekStartDay: 1,
        defaultLunchMinutes: 30,
        payType: "HOURLY_OVERTIME",
        payrollMethod: "SERVICE",
        trackExpenses: true,
        payrollPrepDisclaimer: PAYROLL_PREP_DISCLAIMER,
      },
      create: {
        companyId: company.id,
        timeTrackingStyle: "FOREMAN",
        weekStartDay: 1,
        defaultLunchMinutes: 30,
        payType: "HOURLY_OVERTIME",
        payrollMethod: "SERVICE",
        trackExpenses: true,
        payrollPrepDisclaimer: PAYROLL_PREP_DISCLAIMER,
      },
    });

    // Find or create test crews
    let masonryCrew = await prisma.crew.findFirst({
      where: { name: "Masonry Crew", companyId: company.id },
    });

    if (!masonryCrew) {
      masonryCrew = await prisma.crew.create({
        data: { name: "Masonry Crew", companyId: company.id },
      });
    }

    let roofingCrew = await prisma.crew.findFirst({
      where: { name: "Roofing Crew", companyId: company.id },
    });

    if (!roofingCrew) {
      roofingCrew = await prisma.crew.create({
        data: { name: "Roofing Crew", companyId: company.id },
      });
    }

    // Find or create Luis
    let luis = await prisma.employee.findFirst({
      where: { displayName: "Luis Ortega", companyId: company.id },
    });

    if (!luis) {
      luis = await prisma.employee.create({
        data: {
          companyId: company.id,
          firstName: "Luis",
          lastName: "Ortega",
          displayName: "Luis Ortega",
          hourlyRateCents: 3400,
          defaultCrewId: masonryCrew.id,
        },
      });
    }

    // Find or create Marco
    let marco = await prisma.employee.findFirst({
      where: { displayName: "Marco Diaz", companyId: company.id },
    });

    if (!marco) {
      marco = await prisma.employee.create({
        data: {
          companyId: company.id,
          firstName: "Marco",
          lastName: "Diaz",
          displayName: "Marco Diaz",
          hourlyRateCents: 2900,
          defaultCrewId: masonryCrew.id,
        },
      });
    }

    // Find or create Troy
    let troy = await prisma.employee.findFirst({
      where: { displayName: "Troy Bennett", companyId: company.id },
    });

    if (!troy) {
      troy = await prisma.employee.create({
        data: {
          companyId: company.id,
          firstName: "Troy",
          lastName: "Bennett",
          displayName: "Troy Bennett",
          hourlyRateCents: 2300,
          defaultCrewId: masonryCrew.id,
        },
      });
    }

    // Find or create Evan
    let evan = await prisma.employee.findFirst({
      where: { displayName: "Evan Brooks", companyId: company.id },
    });

    if (!evan) {
      evan = await prisma.employee.create({
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
    }

    // Update crew foreman if not already set
    if (!masonryCrew.foremanId) {
      await prisma.crew.update({
        where: { id: masonryCrew.id },
        data: { foremanId: luis.id },
      });
    }

    // Create crew assignments if they don't exist
    const luisAssignment = await prisma.crewAssignment.findFirst({
      where: { crewId: masonryCrew.id, employeeId: luis.id },
    });
    if (!luisAssignment) {
      await prisma.crewAssignment.create({
        data: { crewId: masonryCrew.id, employeeId: luis.id, startsOn: new Date("2026-01-01T00:00:00") },
      });
    }

    const marcoAssignment = await prisma.crewAssignment.findFirst({
      where: { crewId: masonryCrew.id, employeeId: marco.id },
    });
    if (!marcoAssignment) {
      await prisma.crewAssignment.create({
        data: { crewId: masonryCrew.id, employeeId: marco.id, startsOn: new Date("2026-01-01T00:00:00") },
      });
    }

    const troyAssignment = await prisma.crewAssignment.findFirst({
      where: { crewId: masonryCrew.id, employeeId: troy.id },
    });
    if (!troyAssignment) {
      await prisma.crewAssignment.create({
        data: { crewId: masonryCrew.id, employeeId: troy.id, startsOn: new Date("2026-01-01T00:00:00") },
      });
    }

    const evanAssignment = await prisma.crewAssignment.findFirst({
      where: { crewId: roofingCrew.id, employeeId: evan.id },
    });
    if (!evanAssignment) {
      await prisma.crewAssignment.create({
        data: {
          crewId: roofingCrew.id,
          employeeId: evan.id,
          startsOn: new Date("2025-11-01T00:00:00"),
          endsOn: new Date("2026-04-10T00:00:00"),
        },
      });
    }

    // Create admin employee record if it doesn't exist
    let adminEmployee = await prisma.employee.findFirst({
      where: { displayName: "Dana Office", companyId: company.id },
    });

    if (!adminEmployee) {
      adminEmployee = await prisma.employee.create({
        data: {
          companyId: company.id,
          firstName: "Dana",
          lastName: "Office",
          displayName: "Dana Office",
          hourlyRateCents: 0,
        },
      });
    }

    const supabaseIdsByEmail = new Map<string, string>();
    for (const authUser of [
      { email: "admin@crewtime.local", password: "admin123" },
      { email: "luis@crewtime.local", password: "foreman123" },
      { email: "marco@crewtime.local", password: "employee123" },
      { email: "admin@apexroofing.local", password: "apex_admin123" },
      { email: "jake@apexroofing.local", password: "apex_foreman123" },
      { email: "sarah@apexroofing.local", password: "apex_employee123" },
    ]) {
      const supabaseId = await ensureSupabaseAuthUser(authUser);
      supabaseIdsByEmail.set(authUser.email, supabaseId);
    }

    // Find or create admin user
    const adminUser = await createOrUpdateUserAccount(prisma, {
      email: "admin@crewtime.local",
      fullName: "Dana Office",
      role: "ADMIN",
      companyId: company.id,
      employeeId: adminEmployee.id,
    });

    // Find or create foreman user
    const foremanUser = await createOrUpdateUserAccount(prisma, {
      email: "luis@crewtime.local",
      fullName: "Luis Ortega",
      role: "FOREMAN",
      companyId: company.id,
      employeeId: luis.id,
    });

    // Find or create employee user
    const employeeUser = await createOrUpdateUserAccount(prisma, {
      email: "marco@crewtime.local",
      fullName: "Marco Diaz",
      role: "EMPLOYEE",
      companyId: company.id,
      employeeId: marco.id,
    });

    await prisma.user.update({
      where: { email: "admin@crewtime.local" },
      data: { supabaseId: supabaseIdsByEmail.get("admin@crewtime.local") },
    });
    await prisma.user.update({
      where: { email: "luis@crewtime.local" },
      data: { supabaseId: supabaseIdsByEmail.get("luis@crewtime.local") },
    });
    await prisma.user.update({
      where: { email: "marco@crewtime.local" },
      data: { supabaseId: supabaseIdsByEmail.get("marco@crewtime.local") },
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
    const fixtureEmployeeIds = [luis.id, marco.id, troy.id];
    const existingFixtureTimesheets = await prisma.timesheetWeek.findMany({
      where: {
        employeeId: { in: fixtureEmployeeIds },
      },
      select: { id: true },
    });
    const existingFixtureTimesheetIds = existingFixtureTimesheets.map((timesheet) => timesheet.id);

    if (existingFixtureTimesheetIds.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.expenseSubmission.deleteMany({
          where: { timesheetWeekId: { in: existingFixtureTimesheetIds } },
        });
        await tx.timesheetStatusAudit.deleteMany({
          where: { timesheetWeekId: { in: existingFixtureTimesheetIds } },
        });
        await tx.payrollEstimate.deleteMany({
          where: { timesheetWeekId: { in: existingFixtureTimesheetIds } },
        });
        await tx.weeklyAdjustment.deleteMany({
          where: { timesheetWeekId: { in: existingFixtureTimesheetIds } },
        });
        await tx.timeEntryDay.deleteMany({
          where: { timesheetWeekId: { in: existingFixtureTimesheetIds } },
        });

        const remainingPayrollEstimates = await tx.payrollEstimate.count({
          where: { timesheetWeekId: { in: existingFixtureTimesheetIds } },
        });

        if (remainingPayrollEstimates > 0) {
          throw new Error(
            `Fixture timesheet cleanup left ${remainingPayrollEstimates} payroll estimate rows behind.`,
          );
        }

        await tx.timesheetWeek.deleteMany({
          where: { id: { in: existingFixtureTimesheetIds } },
        });
      });
    }

    await prisma.crewDayDefault.deleteMany({
      where: { crewId: masonryCrew.id, weekStartDate: weekStart },
    });
    await prisma.privateReport.deleteMany({
      where: { crewId: masonryCrew.id },
    });

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
        dayEntries: createdTimesheet.dayEntries,
        adjustment: createdTimesheet.adjustment,
      });

      await prisma.payrollEstimate.create({
        data: {
          employeeId: employee.id,
          timesheetWeekId: createdTimesheet.id,
          ...estimate,
        },
      });
    }

    // Create crew day defaults if they don't exist
    const existingDefaults = await prisma.crewDayDefault.findFirst({
      where: { crewId: masonryCrew.id, weekStartDate: weekStart },
    });

    if (!existingDefaults) {
      await prisma.crewDayDefault.createMany({
        data: [
          { crewId: masonryCrew.id, weekStartDate: weekStart, dayIndex: 0, startTimeMinutes: 420, endTimeMinutes: 930 },
          { crewId: masonryCrew.id, weekStartDate: weekStart, dayIndex: 1, startTimeMinutes: 420, endTimeMinutes: 930 },
          { crewId: masonryCrew.id, weekStartDate: weekStart, dayIndex: 2, startTimeMinutes: 420, endTimeMinutes: 930 },
          { crewId: masonryCrew.id, weekStartDate: weekStart, dayIndex: 3, startTimeMinutes: 420, endTimeMinutes: 960 },
          { crewId: masonryCrew.id, weekStartDate: weekStart, dayIndex: 4, startTimeMinutes: 420, endTimeMinutes: 915 },
        ],
      });
    }

    // Create private reports if they don't exist
    const existingReports = await prisma.privateReport.findFirst({
      where: { crewId: masonryCrew.id },
    });

    if (!existingReports) {
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
    }

    // ===== CREATE SECOND TEST COMPANY: ApexRoofing, Inc =====
    let apexCompany = await prisma.company.findFirst({
      where: { companyName: "ApexRoofing, Inc" },
    });

    if (!apexCompany) {
      apexCompany = await prisma.company.create({
        data: {
          companyName: "ApexRoofing, Inc",
          ownerName: "Jake Martinez",
          stateCode: "TX",
        },
      });

      await prisma.companyPayrollSettings.create({
        data: {
          companyId: apexCompany.id,
          timeTrackingStyle: "FOREMAN",
          weekStartDay: 1,
          defaultLunchMinutes: 30,
          payType: "HOURLY_OVERTIME",
          payrollMethod: "SERVICE",
          trackExpenses: true,
          payrollPrepDisclaimer: PAYROLL_PREP_DISCLAIMER,
        },
      });

      // Create ApexRoofing crews
      const apexRoofingCrew = await prisma.crew.create({
        data: { name: "Residential Roofing", companyId: apexCompany.id },
      });

      const apexCommercialCrew = await prisma.crew.create({
        data: { name: "Commercial Roofing", companyId: apexCompany.id },
      });

      // Create ApexRoofing employees
      const jakeEmployee = await prisma.employee.create({
        data: {
          companyId: apexCompany.id,
          firstName: "Jake",
          lastName: "Martinez",
          displayName: "Jake Martinez",
          hourlyRateCents: 4500,
          defaultCrewId: apexRoofingCrew.id,
        },
      });

      const sarahEmployee = await prisma.employee.create({
        data: {
          companyId: apexCompany.id,
          firstName: "Sarah",
          lastName: "Chen",
          displayName: "Sarah Chen",
          hourlyRateCents: 3800,
          defaultCrewId: apexCommercialCrew.id,
        },
      });

      const mikeEmployee = await prisma.employee.create({
        data: {
          companyId: apexCompany.id,
          firstName: "Mike",
          lastName: "Johnson",
          displayName: "Mike Johnson",
          hourlyRateCents: 3200,
          defaultCrewId: apexRoofingCrew.id,
        },
      });

      // Set foreman and create crew assignments
      await prisma.crew.update({
        where: { id: apexRoofingCrew.id },
        data: { foremanId: jakeEmployee.id },
      });

      await prisma.crewAssignment.createMany({
        data: [
          { crewId: apexRoofingCrew.id, employeeId: jakeEmployee.id, startsOn: new Date("2026-01-01T00:00:00") },
          { crewId: apexRoofingCrew.id, employeeId: mikeEmployee.id, startsOn: new Date("2026-02-01T00:00:00") },
          { crewId: apexCommercialCrew.id, employeeId: sarahEmployee.id, startsOn: new Date("2026-01-15T00:00:00") },
        ],
      });

      // Create ApexRoofing admin and foreman users
      const apexAdminEmployee = await prisma.employee.create({
        data: {
          companyId: apexCompany.id,
          firstName: "Jake",
          lastName: "Martinez (Admin)",
          displayName: "Jake Martinez (Admin)",
          hourlyRateCents: 0,
        },
      });

      await createOrUpdateUserAccount(prisma, {
        email: "admin@apexroofing.local",
        fullName: "Jake Martinez",
        role: "ADMIN",
        companyId: apexCompany.id,
        employeeId: apexAdminEmployee.id,
      });

      await createOrUpdateUserAccount(prisma, {
        email: "jake@apexroofing.local",
        fullName: "Jake Martinez",
        role: "FOREMAN",
        companyId: apexCompany.id,
        employeeId: jakeEmployee.id,
      });

      await createOrUpdateUserAccount(prisma, {
        email: "sarah@apexroofing.local",
        fullName: "Sarah Chen",
        role: "EMPLOYEE",
        companyId: apexCompany.id,
        employeeId: sarahEmployee.id,
      });

      await prisma.company.update({
        where: { id: apexCompany.id },
        data: {
          onboardingCompletedAt: new Date("2026-04-20T09:00:00"),
          onboardingCompletedByUserId: apexAdminEmployee.id,
          payrollDisclaimerAcceptedAt: new Date("2026-04-20T09:00:00"),
          payrollDisclaimerAcceptedByUserId: apexAdminEmployee.id,
          payrollDisclaimerVersion: PAYROLL_DISCLAIMER_VERSION,
        },
      });
    }

    await prisma.user.updateMany({
      where: { email: "admin@apexroofing.local" },
      data: { supabaseId: supabaseIdsByEmail.get("admin@apexroofing.local") },
    });
    await prisma.user.updateMany({
      where: { email: "jake@apexroofing.local" },
      data: { supabaseId: supabaseIdsByEmail.get("jake@apexroofing.local") },
    });
    await prisma.user.updateMany({
      where: { email: "sarah@apexroofing.local" },
      data: { supabaseId: supabaseIdsByEmail.get("sarah@apexroofing.local") },
    });

    return {
      adminUser,
      foremanUser,
      employeeUser,
      archivedEmployee: evan,
      companyId: company.id,
      apexCompanyId: apexCompany.id,
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const result = await seedDatabase();
  console.log("Seed complete.");
  console.log("\n=== COMPANY 1: Crew Time Masonry & Roofing (MA) ===");
  console.log("Admin login: admin@crewtime.local / admin123");
  console.log("Foreman login: luis@crewtime.local / foreman123");
  console.log("Employee login: marco@crewtime.local / employee123");
  console.log(`Company ID: ${result.companyId}`);
  console.log("\n=== COMPANY 2: ApexRoofing, Inc (TX) ===");
  console.log("Admin login: admin@apexroofing.local / apex_admin123");
  console.log("Foreman login: jake@apexroofing.local / apex_foreman123");
  console.log("Employee login: sarah@apexroofing.local / apex_employee123");
  console.log(`Company ID: ${result.apexCompanyId}`);
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entryUrl) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

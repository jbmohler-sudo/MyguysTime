import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../auth.js";
import { prisma } from "../db.js";
import {
  asyncHandler,
  getCompanyContextOrThrow,
  getCompanyCrewOrThrow,
  isFiniteNonNegativeNumber,
  normalizeFederalFilingStatus,
  normalizeManagedEmployeeWorkerType,
  getParam,
  refreshEmployeeCurrentWeek,
  serializeManagedEmployee,
} from "./helpers.js";

const router = Router();

router.get("/employees", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.auth!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admin can manage employees." });
    return;
  }

  const employees = await prisma.employee.findMany({
    where: {
      companyId: req.auth!.companyId,
      employmentStatus: "ACTIVE",
    },
    include: {
      defaultCrew: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true },
      },
    },
    orderBy: { displayName: "asc" },
  });

  res.json({
    employees: employees.map((employee) => serializeManagedEmployee(employee)),
  });
}));

router.post("/employees", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.auth!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admin can manage employees." });
    return;
  }

  const {
    firstName,
    lastName,
    displayName,
    workerType,
    hourlyRate,
    federalFilingStatus,
    w4Step3Amount,
    w4CollectedAt,
    defaultCrewId,
    active,
  } = req.body as {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    workerType?: string;
    hourlyRate?: number;
    federalFilingStatus?: string;
    w4Step3Amount?: number;
    w4CollectedAt?: string | null;
    defaultCrewId?: string | null;
    active?: boolean;
  };

  const cleanFirstName = firstName?.trim() ?? "";
  const cleanLastName = lastName?.trim() ?? "";
  const cleanDisplayName = displayName?.trim() ?? `${cleanFirstName} ${cleanLastName}`.trim();
  const normalizedWorkerType = normalizeManagedEmployeeWorkerType(workerType);

  if (!cleanFirstName || !cleanLastName || !cleanDisplayName) {
    res.status(400).json({ error: "First name, last name, and display name are required." });
    return;
  }

  if (!normalizedWorkerType) {
    res.status(400).json({ error: "Worker type must be employee or 1099 contractor." });
    return;
  }

  if (!isFiniteNonNegativeNumber(hourlyRate)) {
    res.status(400).json({ error: "Hourly rate must be a non-negative number." });
    return;
  }

  const nextFederalFilingStatus = normalizeFederalFilingStatus(federalFilingStatus ?? "single");
  if (!nextFederalFilingStatus) {
    res.status(400).json({ error: "Federal filing status must be single, married jointly, or head of household." });
    return;
  }

  if (w4Step3Amount !== undefined && !isFiniteNonNegativeNumber(w4Step3Amount)) {
    res.status(400).json({ error: "W-4 Step 3 amount must be a non-negative number." });
    return;
  }

  const parsedW4CollectedAt =
    w4CollectedAt === undefined
      ? null
      : w4CollectedAt === null
        ? null
        : new Date(w4CollectedAt);
  if (parsedW4CollectedAt && Number.isNaN(parsedW4CollectedAt.getTime())) {
    res.status(400).json({ error: "W-4 collected date is invalid." });
    return;
  }

  if (typeof active !== "boolean") {
    res.status(400).json({ error: "Active must be yes or no." });
    return;
  }

  const { payrollSettings } = await getCompanyContextOrThrow(req.auth!.companyId);
  const cleanDefaultCrewId = defaultCrewId?.trim() ? defaultCrewId.trim() : null;

  if (cleanDefaultCrewId) {
    try {
      await getCompanyCrewOrThrow(req.auth!.companyId, cleanDefaultCrewId);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Select a valid crew." });
      return;
    }
  }

  const isContractor = normalizedWorkerType === "CONTRACTOR_1099";
  const hourlyRateCents = Math.round(hourlyRate * 100);
  const createdEmployee = await prisma.employee.create({
    data: {
      companyId: req.auth!.companyId,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      displayName: cleanDisplayName,
      workerType: normalizedWorkerType,
      employmentStatus: active ? "ACTIVE" : "ARCHIVED",
      hourlyRateCents,
      overtimeRateCents: payrollSettings.payType === "HOURLY" ? hourlyRateCents : null,
      federalFilingStatus: nextFederalFilingStatus,
      w4Step3Amount: w4Step3Amount ?? 0,
      w4CollectedAt: parsedW4CollectedAt,
      defaultCrewId: cleanDefaultCrewId,
      usesCompanyFederalDefault: !isContractor,
      usesCompanyStateDefault: !isContractor,
      federalWithholdingPercent: isContractor ? 0 : payrollSettings.defaultFederalWithholdingValue,
      stateWithholdingPercent: isContractor ? 0 : payrollSettings.defaultStateWithholdingValue,
      archivedAt: active ? null : new Date(),
    },
    include: {
      defaultCrew: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true },
      },
    },
  });

  if (active) {
    await refreshEmployeeCurrentWeek(createdEmployee.id, req.auth!.companyId);
  }

  res.status(201).json({
    employee: serializeManagedEmployee(createdEmployee),
  });
}));

router.patch("/employees/:employeeId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.auth!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admin can manage employees." });
    return;
  }

  const employeeId = getParam(req.params.employeeId);
  const currentEmployee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      companyId: req.auth!.companyId,
    },
  });

  if (!currentEmployee) {
    res.status(404).json({ error: "Employee not found." });
    return;
  }

  const {
    firstName,
    lastName,
    displayName,
    workerType,
    hourlyRate,
    federalFilingStatus,
    w4Step3Amount,
    w4CollectedAt,
    defaultCrewId,
    active,
  } = req.body as {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    workerType?: string;
    hourlyRate?: number;
    federalFilingStatus?: string;
    w4Step3Amount?: number;
    w4CollectedAt?: string | null;
    defaultCrewId?: string | null;
    active?: boolean;
  };

  const cleanFirstName = firstName?.trim() ?? "";
  const cleanLastName = lastName?.trim() ?? "";
  const cleanDisplayName = displayName?.trim() ?? `${cleanFirstName} ${cleanLastName}`.trim();
  const normalizedWorkerType = normalizeManagedEmployeeWorkerType(workerType);

  if (!cleanFirstName || !cleanLastName || !cleanDisplayName) {
    res.status(400).json({ error: "First name, last name, and display name are required." });
    return;
  }

  if (!normalizedWorkerType) {
    res.status(400).json({ error: "Worker type must be employee or 1099 contractor." });
    return;
  }

  if (!isFiniteNonNegativeNumber(hourlyRate)) {
    res.status(400).json({ error: "Hourly rate must be a non-negative number." });
    return;
  }

  const nextFederalFilingStatus = normalizeFederalFilingStatus(federalFilingStatus ?? currentEmployee.federalFilingStatus);
  if (!nextFederalFilingStatus) {
    res.status(400).json({ error: "Federal filing status must be single, married jointly, or head of household." });
    return;
  }

  if (w4Step3Amount !== undefined && !isFiniteNonNegativeNumber(w4Step3Amount)) {
    res.status(400).json({ error: "W-4 Step 3 amount must be a non-negative number." });
    return;
  }

  const parsedW4CollectedAt =
    w4CollectedAt === undefined
      ? currentEmployee.w4CollectedAt
      : w4CollectedAt === null
        ? null
        : new Date(w4CollectedAt);
  if (parsedW4CollectedAt && Number.isNaN(parsedW4CollectedAt.getTime())) {
    res.status(400).json({ error: "W-4 collected date is invalid." });
    return;
  }

  if (typeof active !== "boolean") {
    res.status(400).json({ error: "Active must be yes or no." });
    return;
  }

  const { payrollSettings } = await getCompanyContextOrThrow(req.auth!.companyId);
  const cleanDefaultCrewId = defaultCrewId?.trim() ? defaultCrewId.trim() : null;

  if (cleanDefaultCrewId) {
    try {
      await getCompanyCrewOrThrow(req.auth!.companyId, cleanDefaultCrewId);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Select a valid crew." });
      return;
    }
  }

  const isContractor = normalizedWorkerType === "CONTRACTOR_1099";
  const hourlyRateCents = Math.round(hourlyRate * 100);
  const nextEmploymentStatus = active ? "ACTIVE" : "ARCHIVED";
  const reactivated = currentEmployee.employmentStatus !== "ACTIVE" && active;
  const archivedNow = currentEmployee.employmentStatus === "ACTIVE" && !active;

  const updatedEmployee = await prisma.employee.update({
    where: { id: currentEmployee.id },
    data: {
      firstName: cleanFirstName,
      lastName: cleanLastName,
      displayName: cleanDisplayName,
      workerType: normalizedWorkerType,
      employmentStatus: nextEmploymentStatus,
      hourlyRateCents,
      overtimeRateCents: payrollSettings.payType === "HOURLY" ? hourlyRateCents : null,
      federalFilingStatus: nextFederalFilingStatus,
      w4Step3Amount: w4Step3Amount ?? currentEmployee.w4Step3Amount,
      w4CollectedAt: parsedW4CollectedAt,
      defaultCrewId: cleanDefaultCrewId,
      usesCompanyFederalDefault: !isContractor,
      usesCompanyStateDefault: !isContractor,
      federalWithholdingPercent: isContractor ? 0 : payrollSettings.defaultFederalWithholdingValue,
      stateWithholdingPercent: isContractor ? 0 : payrollSettings.defaultStateWithholdingValue,
      archivedAt: active ? null : archivedNow ? new Date() : currentEmployee.archivedAt,
      rehiredAt: reactivated ? new Date() : currentEmployee.rehiredAt,
    },
    include: {
      defaultCrew: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true },
      },
    },
  });

  if (active) {
    await refreshEmployeeCurrentWeek(updatedEmployee.id, req.auth!.companyId);
  }

  res.json({
    employee: serializeManagedEmployee(updatedEmployee),
  });
}));

export { router as employeesRouter };

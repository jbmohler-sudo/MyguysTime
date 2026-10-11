import { Router, type Response } from "express";
import { authenticate, type AuthenticatedRequest } from "../auth.js";
import { prisma } from "../db.js";
import {
  asyncHandler,
  authorizeAdmin,
  getParam,
  moveEmployeeToCrew,
  syncCrewChiefRole,
} from "./helpers.js";

// Office-only crew management: add/rename/remove crews, pick each crew's chief,
// and move workers between crews. A worker's crew is Employee.defaultCrewId.

const router = Router();
const MAX_CREW_NAME_LENGTH = 60;

function cleanCrewName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const name = value.trim().replace(/\s+/g, " ");
  if (!name || name.length > MAX_CREW_NAME_LENGTH) {
    return null;
  }
  return name;
}

async function crewNameTaken(companyId: string, name: string, exceptCrewId?: string) {
  const match = await prisma.crew.findFirst({
    where: {
      companyId,
      name: { equals: name, mode: "insensitive" },
      ...(exceptCrewId ? { id: { not: exceptCrewId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(match);
}

async function findActiveEmployee(companyId: string, employeeId: string) {
  return prisma.employee.findFirst({
    where: { id: employeeId, companyId, employmentStatus: "ACTIVE" },
    select: { id: true, defaultCrewId: true },
  });
}

/** Everything the Crews screen needs, in one payload. */
export async function buildCrewRoster(companyId: string) {
  const [crews, employees] = await Promise.all([
    prisma.crew.findMany({
      where: { companyId },
      select: { id: true, name: true, foremanId: true },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { companyId, employmentStatus: "ACTIVE" },
      select: {
        id: true,
        displayName: true,
        workerType: true,
        defaultCrewId: true,
        user: { select: { role: true, status: true } },
      },
      orderBy: { displayName: "asc" },
    }),
  ]);

  const workers = employees.map((employee) => ({
    employeeId: employee.id,
    displayName: employee.displayName,
    workerType: employee.workerType === "CONTRACTOR_1099" ? "1099" : "employee",
    crewId: employee.defaultCrewId,
    hasLogin: Boolean(employee.user && employee.user.status === "ACTIVE"),
    loginRole: employee.user?.role?.toLowerCase() ?? null,
  }));
  const workersById = new Map(workers.map((worker) => [worker.employeeId, worker]));

  return {
    crews: crews.map((crew) => ({
      id: crew.id,
      name: crew.name,
      chiefEmployeeId: crew.foremanId,
      chiefName: crew.foremanId ? workersById.get(crew.foremanId)?.displayName ?? null : null,
      memberIds: workers.filter((worker) => worker.crewId === crew.id).map((worker) => worker.employeeId),
    })),
    workers,
  };
}

async function sendRoster(req: AuthenticatedRequest, res: Response, status = 200) {
  res.status(status).json(await buildCrewRoster(req.auth!.companyId));
}

router.get("/crews", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) return;
  await sendRoster(req, res);
}));

router.post("/crews", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) return;
  const companyId = req.auth!.companyId;
  const { name, chiefEmployeeId } = req.body as { name?: unknown; chiefEmployeeId?: unknown };

  const cleanName = cleanCrewName(name);
  if (!cleanName) {
    res.status(400).json({ error: `Crew name is required (up to ${MAX_CREW_NAME_LENGTH} characters).` });
    return;
  }
  if (await crewNameTaken(companyId, cleanName)) {
    res.status(409).json({ error: "You already have a crew with that name." });
    return;
  }

  let chief: { id: string } | null = null;
  if (typeof chiefEmployeeId === "string" && chiefEmployeeId.trim()) {
    chief = await findActiveEmployee(companyId, chiefEmployeeId.trim());
    if (!chief) {
      res.status(400).json({ error: "Pick an active worker as crew chief." });
      return;
    }
  }

  const crew = await prisma.crew.create({
    data: { companyId, name: cleanName, foremanId: chief?.id ?? null },
  });

  if (chief) {
    // The chief works on the crew he runs.
    await moveEmployeeToCrew(companyId, chief.id, crew.id);
    await syncCrewChiefRole(companyId, chief.id);
  }

  await sendRoster(req, res, 201);
}));

router.patch("/crews/:crewId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) return;
  const companyId = req.auth!.companyId;
  const crewId = getParam(req.params.crewId);
  const crew = await prisma.crew.findFirst({ where: { id: crewId, companyId } });
  if (!crew) {
    res.status(404).json({ error: "Crew not found." });
    return;
  }

  const body = req.body as { name?: unknown; chiefEmployeeId?: unknown };
  const data: { name?: string; foremanId?: string | null } = {};

  if (body.name !== undefined) {
    const cleanName = cleanCrewName(body.name);
    if (!cleanName) {
      res.status(400).json({ error: `Crew name is required (up to ${MAX_CREW_NAME_LENGTH} characters).` });
      return;
    }
    if (await crewNameTaken(companyId, cleanName, crew.id)) {
      res.status(409).json({ error: "You already have a crew with that name." });
      return;
    }
    data.name = cleanName;
  }

  let newChiefId: string | null | undefined;
  if (body.chiefEmployeeId !== undefined) {
    if (body.chiefEmployeeId === null || body.chiefEmployeeId === "") {
      newChiefId = null;
    } else if (typeof body.chiefEmployeeId === "string") {
      const chief = await findActiveEmployee(companyId, body.chiefEmployeeId.trim());
      if (!chief) {
        res.status(400).json({ error: "Pick an active worker as crew chief." });
        return;
      }
      newChiefId = chief.id;
    } else {
      res.status(400).json({ error: "Invalid crew chief." });
      return;
    }
    data.foremanId = newChiefId;
  }

  await prisma.crew.update({ where: { id: crew.id }, data });

  if (newChiefId !== undefined && newChiefId !== crew.foremanId) {
    if (newChiefId) {
      await moveEmployeeToCrew(companyId, newChiefId, crew.id);
    }
    await syncCrewChiefRole(companyId, newChiefId);
    await syncCrewChiefRole(companyId, crew.foremanId);
  }

  await sendRoster(req, res);
}));

router.delete("/crews/:crewId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) return;
  const companyId = req.auth!.companyId;
  const crewId = getParam(req.params.crewId);
  const crew = await prisma.crew.findFirst({ where: { id: crewId, companyId } });
  if (!crew) {
    res.status(404).json({ error: "Crew not found." });
    return;
  }

  const [crewCount, activeMembers, timesheetCount, reportCount, archivedMembers] = await Promise.all([
    prisma.crew.count({ where: { companyId } }),
    prisma.employee.count({ where: { companyId, defaultCrewId: crew.id, employmentStatus: "ACTIVE" } }),
    prisma.timesheetWeek.count({ where: { crewId: crew.id } }),
    prisma.privateReport.count({ where: { crewId: crew.id } }),
    prisma.employee.count({ where: { companyId, defaultCrewId: crew.id, employmentStatus: { not: "ACTIVE" } } }),
  ]);

  if (crewCount <= 1) {
    res.status(409).json({ error: "You need at least one crew. Rename this one instead." });
    return;
  }
  if (activeMembers > 0) {
    res.status(409).json({ error: "Move everyone off this crew before removing it." });
    return;
  }
  if (timesheetCount > 0 || reportCount > 0) {
    res.status(409).json({
      error: "This crew has timesheet history, so it can't be removed. Keep it and leave it empty.",
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (archivedMembers > 0) {
      await tx.employee.updateMany({
        where: { companyId, defaultCrewId: crew.id },
        data: { defaultCrewId: null },
      });
    }
    await tx.crewDayDefault.deleteMany({ where: { crewId: crew.id } });
    await tx.crewAssignment.deleteMany({ where: { crewId: crew.id } });
    await tx.crew.delete({ where: { id: crew.id } });
  });

  await syncCrewChiefRole(companyId, crew.foremanId);
  await sendRoster(req, res);
}));

// Move a worker onto this crew (from another crew or from unassigned).
router.put("/crews/:crewId/members/:employeeId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) return;
  const companyId = req.auth!.companyId;
  const result = await moveEmployeeToCrew(companyId, getParam(req.params.employeeId), getParam(req.params.crewId));
  if (!result) {
    res.status(404).json({ error: "Crew or active worker not found." });
    return;
  }
  await sendRoster(req, res);
}));

// Take a worker off this crew (he becomes unassigned and gets no new timesheets).
router.delete("/crews/:crewId/members/:employeeId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) return;
  const companyId = req.auth!.companyId;
  const crewId = getParam(req.params.crewId);
  const employee = await findActiveEmployee(companyId, getParam(req.params.employeeId));
  if (!employee || employee.defaultCrewId !== crewId) {
    res.status(404).json({ error: "That worker is not on this crew." });
    return;
  }
  await moveEmployeeToCrew(companyId, employee.id, null);
  await sendRoster(req, res);
}));

export { router as crewsRouter };

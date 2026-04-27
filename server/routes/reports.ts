import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../auth.js";
import { prisma } from "../db.js";
import {
  asyncHandler,
  authorizeAdmin,
  getAccessibleCrewIds,
} from "./helpers.js";

const router = Router();

router.post("/private-reports", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!["FOREMAN", "ADMIN"].includes(req.auth!.role)) {
    res.status(403).json({ error: "Only foremen and admin can submit private reports." });
    return;
  }

  const { employeeId, crewId, date, jobTag, category, severity, factualDescription } = req.body as {
    employeeId?: string;
    crewId?: string;
    date?: string;
    jobTag?: string;
    category?: string;
    severity?: string;
    factualDescription?: string;
  };

  if (!employeeId || !crewId || !date || !category || !severity || !factualDescription) {
    res.status(400).json({ error: "Missing required report fields." });
    return;
  }

  if (req.auth!.role === "FOREMAN") {
    const crewIds = await getAccessibleCrewIds(req.auth!.userId, req.auth!.role, req.auth!.companyId);
    if (!crewIds?.includes(crewId)) {
      res.status(403).json({ error: "You cannot submit reports for this crew." });
      return;
    }
  }

  await prisma.privateReport.create({
    data: {
      employeeId,
      crewId,
      reportDate: new Date(`${date}T00:00:00`),
      jobTag,
      category,
      severity,
      factualDescription,
      createdByUserId: req.auth!.userId,
    },
  });

  res.status(201).json({ ok: true });
}));

router.post("/reminders/send-sms", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }
  const body = req.body as { employeeIds?: unknown };
  const ids = Array.isArray(body.employeeIds) ? (body.employeeIds as string[]) : [];
  console.log(`[SMS stub] would send reminders to ${ids.length} employees:`, ids);
  res.json({ count: ids.length, sent: true });
}));

export { router as reportsRouter };

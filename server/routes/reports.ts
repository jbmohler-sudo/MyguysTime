import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../auth.js";
import { prisma } from "../db.js";
import {
  asyncHandler,
  getAccessibleCrewIds,
} from "./helpers.js";

const router = Router();

// Foreman notes about on-site issues, sent to the office.
router.post("/private-reports", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!["FOREMAN", "ADMIN"].includes(req.auth!.role)) {
    res.status(403).json({ error: "Only foremen and admin can submit notes." });
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
    res.status(400).json({ error: "Missing required note fields." });
    return;
  }

  if (req.auth!.role === "FOREMAN") {
    const crewIds = await getAccessibleCrewIds(req.auth!.userId, req.auth!.role, req.auth!.companyId);
    if (!crewIds?.includes(crewId)) {
      res.status(403).json({ error: "You cannot submit notes for this crew." });
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

export { router as reportsRouter };

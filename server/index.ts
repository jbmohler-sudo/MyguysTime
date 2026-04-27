import "dotenv/config";
import { Sentry, sentryEnabled } from "./sentry.js";
import express from "express";
import cors from "cors";
import { pathToFileURL } from "node:url";

import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { companyRouter } from "./routes/company.js";
import { employeesRouter } from "./routes/employees.js";
import { invitesRouter } from "./routes/invites.js";
import { timesheetsRouter } from "./routes/timesheets.js";
import { reportsRouter } from "./routes/reports.js";
import { exportsRouter } from "./routes/exports.js";

export const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", authRouter);
app.use("/api", companyRouter);
app.use("/api", employeesRouter);
app.use("/api", invitesRouter);
app.use("/api", timesheetsRouter);
app.use("/api", reportsRouter);
app.use("/api", exportsRouter);

if (sentryEnabled) {
  Sentry.setupExpressErrorHandler(app);
}

export function startServer(listenPort = port) {
  return app.listen(listenPort, () => {
    console.log(`Crew Timecard API listening on http://localhost:${listenPort}`);
  });
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entryUrl) {
  startServer();
}

import "dotenv/config";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = resolve(process.cwd(), "prisma", "dev.db");

const schemaSql = `
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS PrivateReport;
DROP TABLE IF EXISTS TimesheetStatusAudit;
DROP TABLE IF EXISTS PayrollEstimate;
DROP TABLE IF EXISTS WeeklyAdjustment;
DROP TABLE IF EXISTS TimeEntryDay;
DROP TABLE IF EXISTS TimesheetWeek;
DROP TABLE IF EXISTS CrewDayDefault;
DROP TABLE IF EXISTS CrewAssignment;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS CompanyPayrollSettings;
DROP TABLE IF EXISTS Company;
DROP TABLE IF EXISTS StatePayrollRule;
DROP TABLE IF EXISTS Employee;
DROP TABLE IF EXISTS Crew;

CREATE TABLE Crew (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  foremanId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE Employee (
  id TEXT PRIMARY KEY NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  displayName TEXT NOT NULL,
  employmentStatus TEXT NOT NULL DEFAULT 'ACTIVE',
  hourlyRateCents INTEGER NOT NULL,
  overtimeRateCents INTEGER,
  usesCompanyFederalDefault INTEGER NOT NULL DEFAULT 1,
  usesCompanyStateDefault INTEGER NOT NULL DEFAULT 1,
  federalWithholdingPercent REAL NOT NULL DEFAULT 0.10,
  stateWithholdingPercent REAL NOT NULL DEFAULT 0.03,
  defaultCrewId TEXT,
  archiveReason TEXT,
  archiveNotes TEXT,
  archivedAt DATETIME,
  rehiredAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (defaultCrewId) REFERENCES Crew(id)
);

CREATE TABLE User (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  fullName TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL,
  employeeId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (employeeId) REFERENCES Employee(id)
);

CREATE TABLE Company (
  id TEXT PRIMARY KEY NOT NULL,
  companyName TEXT NOT NULL,
  stateCode TEXT NOT NULL,
  payrollDisclaimerAcceptedAt DATETIME,
  payrollDisclaimerAcceptedByUserId TEXT,
  payrollDisclaimerVersion TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE CompanyPayrollSettings (
  id TEXT PRIMARY KEY NOT NULL,
  companyId TEXT NOT NULL,
  defaultFederalWithholdingMode TEXT NOT NULL DEFAULT 'PERCENTAGE',
  defaultFederalWithholdingValue REAL NOT NULL DEFAULT 0.10,
  defaultStateWithholdingMode TEXT NOT NULL DEFAULT 'PERCENTAGE',
  defaultStateWithholdingValue REAL NOT NULL DEFAULT 0.03,
  payrollPrepDisclaimer TEXT,
  pfmlEnabled INTEGER NOT NULL DEFAULT 0,
  pfmlEmployeeRate REAL NOT NULL DEFAULT 0,
  extraWithholdingLabel TEXT,
  extraWithholdingRate REAL,
  supportLevelSnapshot TEXT NOT NULL DEFAULT 'PARTIAL_MANUAL',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (companyId) REFERENCES Company(id)
);

CREATE TABLE StatePayrollRule (
  id TEXT PRIMARY KEY NOT NULL,
  stateCode TEXT NOT NULL,
  stateName TEXT NOT NULL,
  supportLevel TEXT NOT NULL,
  hasStateIncomeTax INTEGER NOT NULL DEFAULT 1,
  hasExtraEmployeeWithholdings INTEGER NOT NULL DEFAULT 0,
  extraWithholdingTypes TEXT,
  defaultStateWithholdingMode TEXT NOT NULL DEFAULT 'PERCENTAGE',
  defaultStateWithholdingValue REAL NOT NULL DEFAULT 0,
  defaultPfmlEnabled INTEGER NOT NULL DEFAULT 0,
  defaultPfmlEmployeeRate REAL NOT NULL DEFAULT 0,
  notes TEXT,
  disclaimerText TEXT,
  lastReviewedAt DATETIME,
  sourceLabel TEXT,
  sourceUrl TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE CrewAssignment (
  id TEXT PRIMARY KEY NOT NULL,
  crewId TEXT NOT NULL,
  employeeId TEXT NOT NULL,
  startsOn DATETIME NOT NULL,
  endsOn DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crewId) REFERENCES Crew(id),
  FOREIGN KEY (employeeId) REFERENCES Employee(id)
);

CREATE TABLE CrewDayDefault (
  id TEXT PRIMARY KEY NOT NULL,
  crewId TEXT NOT NULL,
  weekStartDate DATETIME NOT NULL,
  dayIndex INTEGER NOT NULL,
  startTimeMinutes INTEGER,
  endTimeMinutes INTEGER,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (crewId) REFERENCES Crew(id)
);

CREATE TABLE TimesheetWeek (
  id TEXT PRIMARY KEY NOT NULL,
  employeeId TEXT NOT NULL,
  crewId TEXT NOT NULL,
  weekStartDate DATETIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  submittedByEmployeeAt DATETIME,
  reviewedByForemanAt DATETIME,
  lockedAt DATETIME,
  exportedAt DATETIME,
  exportedByUserId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (employeeId) REFERENCES Employee(id),
  FOREIGN KEY (crewId) REFERENCES Crew(id)
);

CREATE TABLE TimesheetStatusAudit (
  id TEXT PRIMARY KEY NOT NULL,
  timesheetWeekId TEXT NOT NULL,
  fromStatus TEXT NOT NULL,
  toStatus TEXT NOT NULL,
  note TEXT,
  createdByUserId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (timesheetWeekId) REFERENCES TimesheetWeek(id),
  FOREIGN KEY (createdByUserId) REFERENCES User(id)
);

CREATE TABLE TimeEntryDay (
  id TEXT PRIMARY KEY NOT NULL,
  timesheetWeekId TEXT NOT NULL,
  dayIndex INTEGER NOT NULL,
  workDate DATETIME NOT NULL,
  startTimeMinutes INTEGER,
  endTimeMinutes INTEGER,
  lunchMinutes INTEGER NOT NULL DEFAULT 0,
  totalMinutes INTEGER NOT NULL DEFAULT 0,
  jobTag TEXT,
  employeeConfirmed INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (timesheetWeekId) REFERENCES TimesheetWeek(id)
);

CREATE TABLE WeeklyAdjustment (
  id TEXT PRIMARY KEY NOT NULL,
  employeeId TEXT NOT NULL,
  timesheetWeekId TEXT NOT NULL,
  gasReimbursementCents INTEGER NOT NULL DEFAULT 0,
  pettyCashCents INTEGER NOT NULL DEFAULT 0,
  deductionCents INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (employeeId) REFERENCES Employee(id),
  FOREIGN KEY (timesheetWeekId) REFERENCES TimesheetWeek(id)
);

CREATE TABLE PayrollEstimate (
  id TEXT PRIMARY KEY NOT NULL,
  employeeId TEXT NOT NULL,
  timesheetWeekId TEXT NOT NULL,
  regularMinutes INTEGER NOT NULL,
  overtimeMinutes INTEGER NOT NULL,
  grossPayCents INTEGER NOT NULL,
  federalWithholdingMode TEXT NOT NULL DEFAULT 'PERCENTAGE',
  federalWithholdingValue REAL NOT NULL,
  stateWithholdingMode TEXT NOT NULL DEFAULT 'PERCENTAGE',
  stateWithholdingValue REAL NOT NULL,
  federalWithholdingCents INTEGER NOT NULL,
  stateWithholdingCents INTEGER NOT NULL,
  pfmlWithholdingCents INTEGER NOT NULL DEFAULT 0,
  extraStateWithholdingLabel TEXT,
  extraStateWithholdingCents INTEGER NOT NULL DEFAULT 0,
  manualNetOverrideCents INTEGER,
  netCheckEstimateCents INTEGER NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (employeeId) REFERENCES Employee(id),
  FOREIGN KEY (timesheetWeekId) REFERENCES TimesheetWeek(id)
);

CREATE TABLE PrivateReport (
  id TEXT PRIMARY KEY NOT NULL,
  employeeId TEXT NOT NULL,
  crewId TEXT NOT NULL,
  reportDate DATETIME NOT NULL,
  jobTag TEXT,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  factualDescription TEXT NOT NULL,
  followUpStatus TEXT NOT NULL DEFAULT 'OPEN',
  createdByUserId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (employeeId) REFERENCES Employee(id),
  FOREIGN KEY (crewId) REFERENCES Crew(id),
  FOREIGN KEY (createdByUserId) REFERENCES User(id)
);

CREATE UNIQUE INDEX User_email_key ON User(email);
CREATE UNIQUE INDEX User_employeeId_key ON User(employeeId);
CREATE UNIQUE INDEX CompanyPayrollSettings_companyId_key ON CompanyPayrollSettings(companyId);
CREATE UNIQUE INDEX StatePayrollRule_stateCode_key ON StatePayrollRule(stateCode);
CREATE INDEX CrewAssignment_crewId_startsOn_idx ON CrewAssignment(crewId, startsOn);
CREATE INDEX CrewAssignment_employeeId_startsOn_idx ON CrewAssignment(employeeId, startsOn);
CREATE UNIQUE INDEX CrewDayDefault_crewId_weekStartDate_dayIndex_key ON CrewDayDefault(crewId, weekStartDate, dayIndex);
CREATE UNIQUE INDEX TimesheetWeek_employeeId_weekStartDate_key ON TimesheetWeek(employeeId, weekStartDate);
CREATE INDEX TimesheetWeek_crewId_weekStartDate_idx ON TimesheetWeek(crewId, weekStartDate);
CREATE UNIQUE INDEX TimeEntryDay_timesheetWeekId_dayIndex_key ON TimeEntryDay(timesheetWeekId, dayIndex);
CREATE UNIQUE INDEX WeeklyAdjustment_timesheetWeekId_key ON WeeklyAdjustment(timesheetWeekId);
CREATE UNIQUE INDEX PayrollEstimate_timesheetWeekId_key ON PayrollEstimate(timesheetWeekId);
CREATE INDEX TimesheetStatusAudit_timesheetWeekId_createdAt_idx ON TimesheetStatusAudit(timesheetWeekId, createdAt);
CREATE INDEX PrivateReport_employeeId_reportDate_idx ON PrivateReport(employeeId, reportDate);
CREATE INDEX PrivateReport_crewId_reportDate_idx ON PrivateReport(crewId, reportDate);

PRAGMA foreign_keys = ON;
`;

export function setupDatabase() {
  if (!existsSync(dirname(databasePath))) {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  const database = new DatabaseSync(databasePath);
  database.exec(schemaSql);
  database.close();
}

setupDatabase();
console.log(`SQLite schema initialized at ${databasePath}`);

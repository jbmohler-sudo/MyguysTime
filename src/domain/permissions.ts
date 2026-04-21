import type { EmployeeWeek, TimesheetStatus, UserRole } from "./models";

export function canViewRates(role: UserRole) {
  return role === "admin" || role === "foreman";
}

export function canEditTimesheet(role: UserRole, viewerEmployeeId: string | null, week: EmployeeWeek) {
  if (week.status === "office_locked") {
    return false;
  }

  if (role === "admin" || role === "foreman") {
    return true;
  }

  return (
    role === "employee" &&
    viewerEmployeeId === week.employeeId &&
    (week.status === "draft" || week.status === "needs_revision")
  );
}

export function canConfirmWeek(role: UserRole, viewerEmployeeId: string | null, week: EmployeeWeek) {
  return (
    role === "employee" &&
    viewerEmployeeId === week.employeeId &&
    (week.status === "draft" || week.status === "needs_revision")
  );
}

export function canApproveWeek(role: UserRole, week: EmployeeWeek) {
  return (role === "admin" || role === "foreman") && week.status !== "office_locked";
}

export function canOfficeLock(role: UserRole, week: EmployeeWeek) {
  return role === "admin" && week.status !== "office_locked";
}

export function prettyStatus(status: TimesheetStatus) {
  return status.replace(/_/g, " ");
}

export function needsEmployeeConfirmation(week: EmployeeWeek) {
  return week.missingConfirmationDays > 0 || week.status === "draft" || week.status === "needs_revision";
}

export function statusTone(status: TimesheetStatus) {
  switch (status) {
    case "office_locked":
      return "pill pill--locked";
    case "foreman_approved":
      return "pill pill--approved";
    case "employee_confirmed":
      return "pill pill--submitted";
    case "needs_revision":
      return "pill pill--revision";
    default:
      return "pill pill--draft";
  }
}

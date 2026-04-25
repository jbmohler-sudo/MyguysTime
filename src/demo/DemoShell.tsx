/**
 * DemoShell — wraps AppShell with fully static demo data.
 * Zero Supabase calls, zero network traffic, zero database bleed.
 * Safe to render from the public homepage for all three role previews.
 */

import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { OnboardingProvider } from "../hooks/useOnboarding";
import { ToastProvider } from "../hooks/useToast";
import { ViewProvider } from "../context/ViewContext";
import type { BootstrapPayload, TimesheetStatus } from "../domain/models";
import { getDemoPayload, type DemoRole } from "./demoData";

interface DemoShellProps {
  role: DemoRole;
}

export function DemoShell({ role }: DemoShellProps) {
  const [data, setData] = useState<BootstrapPayload>(() => getDemoPayload(role));

  // ─── Local-state mutators (no API calls) ─────────────────────────────────────

  async function handleUpdateDay(
    timesheetId: string,
    dayEntryId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    setData((curr) => ({
      ...curr,
      employeeWeeks: curr.employeeWeeks.map((week) => {
        if (week.id !== timesheetId) return week;
        const entries = week.entries.map((day) => {
          if (day.id !== dayEntryId) return day;
          const next = { ...day, ...payload };
          // Recompute totalHours if start/end changed
          if (next.start && next.end) {
            const [sh, sm] = String(next.start).split(":").map(Number);
            const [eh, em] = String(next.end).split(":").map(Number);
            next.totalHours = Math.max(0, (eh * 60 + em - (sh * 60 + sm) - 30) / 60);
          } else {
            next.totalHours = 0;
          }
          return next;
        });
        const weeklyTotalHours = entries.reduce((s, d) => s + d.totalHours, 0);
        return { ...week, entries, weeklyTotalHours };
      }),
    }));
  }

  async function handleApplyCrewDefaults(payload: {
    crewId: string;
    weekStart: string;
    dayIndex: number;
    start: string;
    end: string;
  }): Promise<void> {
    setData((curr) => ({
      ...curr,
      employeeWeeks: curr.employeeWeeks.map((week) => {
        if (week.crewId !== payload.crewId) return week;
        const entries = week.entries.map((day) => {
          if (day.dayIndex !== payload.dayIndex) return day;
          const [sh, sm] = payload.start.split(":").map(Number);
          const [eh, em] = payload.end.split(":").map(Number);
          const totalHours = Math.max(0, (eh * 60 + em - (sh * 60 + sm) - 30) / 60);
          return { ...day, start: payload.start, end: payload.end, totalHours };
        });
        const weeklyTotalHours = entries.reduce((s, d) => s + d.totalHours, 0);
        return { ...week, entries, weeklyTotalHours };
      }),
    }));
  }

  async function handleStatusChange(
    timesheetId: string,
    status: TimesheetStatus,
  ): Promise<void> {
    setData((curr) => ({
      ...curr,
      employeeWeeks: curr.employeeWeeks.map((week) =>
        week.id === timesheetId ? { ...week, status } : week,
      ),
    }));
  }

  async function handleReopenWeek(
    timesheetId: string,
    reopenTo: TimesheetStatus,
    _note: string,
  ): Promise<void> {
    setData((curr) => ({
      ...curr,
      employeeWeeks: curr.employeeWeeks.map((week) =>
        week.id === timesheetId ? { ...week, status: reopenTo } : week,
      ),
    }));
  }

  async function handleUpdateAdjustment(
    timesheetId: string,
    payload: {
      gasReimbursement?: number;
      pettyCashReimbursement?: number;
      deductionAdvance?: number;
      notes?: string;
    },
  ): Promise<void> {
    setData((curr) => ({
      ...curr,
      employeeWeeks: curr.employeeWeeks.map((week) => {
        if (week.id !== timesheetId) return week;
        const adjustment = { ...week.adjustment, ...payload };
        return { ...week, adjustment };
      }),
    }));
  }

  // ─── No-op stubs for features that don't apply in demo ───────────────────────

  async function noop(): Promise<void> {}

  async function noopList() {
    return [];
  }

  async function handleUpdateMe(): Promise<void> {}

  async function handleRefresh(): Promise<void> {}

  function handleLogout() {
    // Navigate back to the homepage from demo mode
    window.history.replaceState({}, "", "/");
    window.location.reload();
  }

  return (
    <ViewProvider>
      <ToastProvider>
        <OnboardingProvider>
          <AppShell
            data={data}
            onLogout={handleLogout}
            onRefresh={handleRefresh}
            onUpdateMe={handleUpdateMe}
            onUpdateDay={handleUpdateDay}
            onApplyCrewDefaults={handleApplyCrewDefaults}
            onStatusChange={handleStatusChange}
            onReopenWeek={handleReopenWeek}
            onUpdateAdjustment={handleUpdateAdjustment}
            onSubmitPrivateReport={noop}
            onExport={noop}
            onUpdateCompanySettings={noop}
            onListEmployees={noopList}
            onCreateEmployee={() => Promise.reject(new Error("Demo mode"))}
            onUpdateEmployee={() => Promise.reject(new Error("Demo mode"))}
            onListInvites={noopList}
            onCreateInvite={() => Promise.reject(new Error("Demo mode"))}
            onResendInvite={noop}
            onRevokeInvite={noop}
          />
        </OnboardingProvider>
      </ToastProvider>
    </ViewProvider>
  );
}

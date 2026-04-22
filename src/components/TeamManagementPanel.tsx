import { useEffect, useMemo, useState } from "react";
import type { CrewSummary, EmployeeInput, InviteInput, InviteSummary, ManagedEmployee } from "../domain/models";

interface TeamManagementPanelProps {
  crews: CrewSummary[];
  onLoadEmployees: () => Promise<ManagedEmployee[]>;
  onCreateEmployee: (payload: EmployeeInput) => Promise<ManagedEmployee>;
  onUpdateEmployee: (employeeId: string, payload: EmployeeInput) => Promise<ManagedEmployee>;
  onLoadInvites: () => Promise<InviteSummary[]>;
  onCreateInvite: (payload: InviteInput) => Promise<{ invite: InviteSummary; inviteUrl?: string }>;
}

interface EmployeeDraft {
  firstName: string;
  lastName: string;
  displayName: string;
  workerType: EmployeeInput["workerType"];
  hourlyRate: string;
  defaultCrewId: string;
  active: boolean;
}

interface InviteDraft {
  employeeId: string;
  email: string;
  role: InviteInput["role"];
}

function createEmptyDraft(): EmployeeDraft {
  return {
    firstName: "",
    lastName: "",
    displayName: "",
    workerType: "employee",
    hourlyRate: "",
    defaultCrewId: "",
    active: true,
  };
}

function createEmptyInviteDraft(): InviteDraft {
  return {
    employeeId: "",
    email: "",
    role: "employee",
  };
}

function createDraftFromEmployee(employee: ManagedEmployee): EmployeeDraft {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    displayName: employee.displayName,
    workerType: employee.workerType,
    hourlyRate: employee.hourlyRate.toString(),
    defaultCrewId: employee.defaultCrewId ?? "",
    active: employee.active,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function workerTypeLabel(value: EmployeeInput["workerType"]) {
  return value === "contractor_1099" ? "1099 contractor" : "Employee";
}

function inviteRoleLabel(value: InviteInput["role"]) {
  return value === "foreman" ? "Foreman" : "Employee";
}

function formatInviteDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function TeamManagementPanel({
  crews,
  onLoadEmployees,
  onCreateEmployee,
  onUpdateEmployee,
  onLoadInvites,
  onCreateInvite,
}: TeamManagementPanelProps) {
  const [employees, setEmployees] = useState<ManagedEmployee[]>([]);
  const [invites, setInvites] = useState<InviteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteSaving, setInviteSaving] = useState(false);
  const [error, setError] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [inviteEmployeeId, setInviteEmployeeId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EmployeeDraft>(createEmptyDraft);
  const [inviteDraft, setInviteDraft] = useState<InviteDraft>(createEmptyInviteDraft);
  const [latestInviteUrl, setLatestInviteUrl] = useState("");

  const crewOptions = useMemo(
    () => crews.map((crew) => ({ id: crew.id, name: crew.name })),
    [crews],
  );
  const activeEmployeeCount = employees.filter((employee) => employee.active).length;
  const pendingInvites = invites.filter((invite) => invite.status === "pending");
  const pendingInviteByEmployeeId = useMemo(
    () =>
      new Map(
        pendingInvites
          .filter((invite) => invite.employeeId)
          .map((invite) => [invite.employeeId!, invite]),
      ),
    [pendingInvites],
  );

  async function loadTeam() {
    setLoading(true);
    setError("");
    setInviteError("");

    try {
      const [nextEmployees, nextInvites] = await Promise.all([onLoadEmployees(), onLoadInvites()]);
      setEmployees(nextEmployees);
      setInvites(nextInvites);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load team.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTeam();
  }, []);

  function openCreateForm() {
    setEditorMode("create");
    setEditingEmployeeId(null);
    setDraft(createEmptyDraft());
    setError("");
  }

  function openEditForm(employee: ManagedEmployee) {
    setEditorMode("edit");
    setEditingEmployeeId(employee.id);
    setDraft(createDraftFromEmployee(employee));
    setError("");
  }

  function closeEditor() {
    setEditorMode(null);
    setEditingEmployeeId(null);
    setDraft(createEmptyDraft());
    setError("");
  }

  function openInviteForm(employee: ManagedEmployee) {
    setInviteEmployeeId(employee.id);
    setInviteDraft({
      employeeId: employee.id,
      email: "",
      role: employee.workerType === "contractor_1099" ? "employee" : "employee",
    });
    setLatestInviteUrl("");
    setInviteError("");
  }

  function closeInviteForm() {
    setInviteEmployeeId(null);
    setInviteDraft(createEmptyInviteDraft());
    setLatestInviteUrl("");
    setInviteError("");
  }

  async function handleSubmit() {
    const firstName = draft.firstName.trim();
    const lastName = draft.lastName.trim();
    const displayName = draft.displayName.trim() || `${firstName} ${lastName}`.trim();
    const hourlyRate = Number(draft.hourlyRate);

    if (!firstName || !lastName || !displayName) {
      setError("First name, last name, and display name are required.");
      return;
    }

    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      setError("Hourly rate must be a valid non-negative number.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload: EmployeeInput = {
        firstName,
        lastName,
        displayName,
        workerType: draft.workerType,
        hourlyRate,
        defaultCrewId: draft.defaultCrewId || null,
        active: draft.active,
      };

      if (editorMode === "edit" && editingEmployeeId) {
        await onUpdateEmployee(editingEmployeeId, payload);
      } else {
        await onCreateEmployee(payload);
      }

      await loadTeam();
      closeEditor();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save employee.");
    } finally {
      setSaving(false);
    }
  }

  async function handleInviteSubmit() {
    const email = inviteDraft.email.trim();

    if (!inviteDraft.employeeId || !email) {
      setInviteError("Employee and email are required for this invite.");
      return;
    }

    setInviteSaving(true);
    setInviteError("");
    setLatestInviteUrl("");

    try {
      const response = await onCreateInvite({
        employeeId: inviteDraft.employeeId,
        email,
        role: inviteDraft.role,
      });
      await loadTeam();
      setLatestInviteUrl(response.inviteUrl ?? "");
    } catch (saveError) {
      setInviteError(saveError instanceof Error ? saveError.message : "Unable to create invite.");
    } finally {
      setInviteSaving(false);
    }
  }

  return (
    <section className="panel compact-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Team</p>
          <h2>Manage active employees</h2>
          <p className="panel-subcopy">
            Keep employee records current without creating login access. Invite access stays separate and only applies when the worker accepts it.
          </p>
        </div>
        <div className="toolbar">
          <button className="button-strong" onClick={openCreateForm} type="button">
            Add employee
          </button>
        </div>
      </div>

      <div className="company-summary-grid team-summary-grid">
        <div>
          <span>Active employees</span>
          <strong>{activeEmployeeCount}</strong>
        </div>
        <div>
          <span>Crew options</span>
          <strong>{crewOptions.length}</strong>
        </div>
        <div>
          <span>Pending invites</span>
          <strong>{pendingInvites.length}</strong>
        </div>
        <div>
          <span>Default behavior</span>
          <strong>Employee records first</strong>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {editorMode ? (
        <section className="settings-section team-editor">
          <div className="settings-section__header">
            <div>
              <p className="eyebrow">{editorMode === "create" ? "Add Employee" : "Edit Employee"}</p>
              <h3>{editorMode === "create" ? "Create employee record" : "Update employee record"}</h3>
            </div>
            <span className="settings-meta">Login access is managed separately.</span>
          </div>

          <div className="settings-grid">
            <label>
              First name
              <input
                autoFocus
                type="text"
                value={draft.firstName}
                onChange={(event) => setDraft((current) => ({ ...current, firstName: event.target.value }))}
              />
            </label>
            <label>
              Last name
              <input
                type="text"
                value={draft.lastName}
                onChange={(event) => setDraft((current) => ({ ...current, lastName: event.target.value }))}
              />
            </label>
            <label className="settings-grid__full">
              Display name
              <input
                type="text"
                value={draft.displayName}
                onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))}
              />
            </label>
            <label>
              Worker type
              <select
                value={draft.workerType}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    workerType: event.target.value as EmployeeInput["workerType"],
                  }))
                }
              >
                <option value="employee">Employee</option>
                <option value="contractor_1099">1099 contractor</option>
              </select>
            </label>
            <label>
              Hourly rate
              <input
                type="number"
                step="0.01"
                min="0"
                value={draft.hourlyRate}
                onChange={(event) => setDraft((current) => ({ ...current, hourlyRate: event.target.value }))}
              />
            </label>
            <label>
              Default crew
              <select
                value={draft.defaultCrewId}
                onChange={(event) => setDraft((current) => ({ ...current, defaultCrewId: event.target.value }))}
              >
                <option value="">No default crew</option>
                {crewOptions.map((crew) => (
                  <option key={crew.id} value={crew.id}>
                    {crew.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Active
              <select
                value={draft.active ? "yes" : "no"}
                onChange={(event) => setDraft((current) => ({ ...current, active: event.target.value === "yes" }))}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>

          <div className="workflow-banner workflow-banner--soft">
            <strong>Employee record only</strong>
            <span>Saving here updates payroll and time-tracking worker info only. No login is created or removed in this form.</span>
          </div>

          <div className="adjustment-actions">
            <button className="button-strong" disabled={saving} onClick={() => void handleSubmit()} type="button">
              {saving ? "Saving..." : editorMode === "create" ? "Save employee" : "Update employee"}
            </button>
            <button className="button-muted" disabled={saving} onClick={closeEditor} type="button">
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {inviteEmployeeId ? (
        <section className="settings-section team-editor">
          <div className="settings-section__header">
            <div>
              <p className="eyebrow">Invite To App</p>
              <h3>Send login access</h3>
            </div>
            <span className="settings-meta">This keeps the employee record intact and adds login access only after acceptance.</span>
          </div>

          <div className="settings-grid">
            <label className="settings-grid__full">
              Email
              <input
                autoFocus
                type="email"
                value={inviteDraft.email}
                onChange={(event) => setInviteDraft((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label>
              Role
              <select
                value={inviteDraft.role}
                onChange={(event) =>
                  setInviteDraft((current) => ({
                    ...current,
                    role: event.target.value as InviteInput["role"],
                  }))
                }
              >
                <option value="employee">Employee</option>
                <option value="foreman">Foreman</option>
              </select>
            </label>
          </div>

          {inviteError ? <div className="error-banner">{inviteError}</div> : null}
          {latestInviteUrl ? (
            <div className="workflow-banner workflow-banner--soft invite-link-banner">
              <strong>Dev invite link ready</strong>
              <span>Copy this acceptance URL for now. It is the development fallback until real email delivery is wired in.</span>
              <input readOnly type="text" value={latestInviteUrl} />
              <a href={latestInviteUrl}>Open acceptance page</a>
            </div>
          ) : null}

          <div className="adjustment-actions">
            <button className="button-strong" disabled={inviteSaving} onClick={() => void handleInviteSubmit()} type="button">
              {inviteSaving ? "Creating invite..." : "Create invite"}
            </button>
            <button className="button-muted" disabled={inviteSaving} onClick={closeInviteForm} type="button">
              Close
            </button>
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="empty-state">Loading team...</div>
      ) : employees.length === 0 ? (
        <div className="empty-state">No active employees yet. Add the first worker to get them onto the board.</div>
      ) : (
        <div className="team-list">
          {employees.map((employee) => {
            const pendingInvite = pendingInviteByEmployeeId.get(employee.id);

            return (
              <article className="report-card team-card" key={employee.id}>
                <div className="report-card__header">
                  <div>
                    <strong>{employee.displayName}</strong>
                    <span>{employee.defaultCrewName ?? "No default crew"}</span>
                  </div>
                  <div className="team-card__actions">
                    <button className="button-muted" onClick={() => openEditForm(employee)} type="button">
                      Edit
                    </button>
                    {!employee.hasLoginAccess ? (
                      <button
                        className="button-strong"
                        disabled={Boolean(pendingInvite)}
                        onClick={() => openInviteForm(employee)}
                        type="button"
                      >
                        {pendingInvite ? "Invite pending" : "Invite to app"}
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="team-card__meta">
                  <span>{workerTypeLabel(employee.workerType)}</span>
                  <span>{formatCurrency(employee.hourlyRate)}/hr</span>
                  <span>{employee.active ? "Active" : "Inactive"}</span>
                </div>
                <div className="team-card__details">
                  <div>
                    <span>Worker record</span>
                    <strong>{employee.firstName} {employee.lastName}</strong>
                  </div>
                  <div>
                    <span>Login access</span>
                    <strong>
                      {employee.hasLoginAccess
                        ? "Linked login exists"
                        : pendingInvite
                          ? `Pending for ${pendingInvite.email}`
                          : "No login access yet"}
                    </strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="settings-section team-invites-section">
        <div className="settings-section__header">
          <div>
            <p className="eyebrow">Invites</p>
            <h3>Pending and recent invite activity</h3>
          </div>
          <span className="settings-meta">These stay company-scoped and expire automatically.</span>
        </div>
        {pendingInvites.length === 0 && invites.length === 0 ? (
          <div className="empty-state">No invites yet.</div>
        ) : (
          <div className="team-list">
            {invites.map((invite) => (
              <article className="report-card team-card" key={invite.id}>
                <div className="report-card__header">
                  <div>
                    <strong>{invite.employeeName ?? invite.email}</strong>
                    <span>{invite.email}</span>
                  </div>
                  <span className={`invite-status invite-status--${invite.status}`}>{invite.status}</span>
                </div>
                <div className="team-card__meta">
                  <span>{inviteRoleLabel(invite.role)}</span>
                  <span>Sent by {invite.invitedByFullName}</span>
                  <span>Expires {formatInviteDate(invite.expiresAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

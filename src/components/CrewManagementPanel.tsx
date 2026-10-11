import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { CrewOperation, CrewRoster, CrewRosterCrew, CrewRosterWorker } from "../domain/models";

// Office-only Crews section on the Team page: add crews, pick each crew's chief,
// and move workers between crews. Every change returns the full roster.

interface CrewManagementPanelProps {
  onManageCrews: (operation: CrewOperation) => Promise<CrewRoster>;
}

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1A";
const BRAND_LIGHT = "#F5F5F5";
const BORDER = "#E5E7EB";
const MUTED = "#6B7280";

const selectStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "6px",
  border: `1px solid ${BORDER}`,
  fontSize: "13px",
  background: "#fff",
  color: BRAND_DARK,
  boxSizing: "border-box",
};

const inputStyle: CSSProperties = { ...selectStyle, outline: "none" };

const primaryButton: CSSProperties = {
  padding: "8px 14px",
  borderRadius: "6px",
  border: "none",
  background: BRAND_ORANGE,
  color: "#fff",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const quietButton: CSSProperties = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: `1px solid ${BORDER}`,
  background: "#fff",
  color: BRAND_DARK,
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: MUTED,
  marginBottom: "6px",
};

function Badge({ children, tone = "gray" }: { children: string; tone?: "gray" | "orange" | "amber" }) {
  const colors = {
    gray: { background: BRAND_LIGHT, color: MUTED },
    orange: { background: "#FFF3E0", color: "#B45309" },
    amber: { background: "#FEF3C7", color: "#92400E" },
  }[tone];
  return (
    <span
      style={{
        ...colors,
        borderRadius: "999px",
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function CrewManagementPanel({ onManageCrews }: CrewManagementPanelProps) {
  const [roster, setRoster] = useState<CrewRoster | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showNewCrew, setShowNewCrew] = useState(false);
  const [newCrewName, setNewCrewName] = useState("");
  const [newCrewChiefId, setNewCrewChiefId] = useState("");
  const [renamingCrewId, setRenamingCrewId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmRemoveCrewId, setConfirmRemoveCrewId] = useState<string | null>(null);
  // The parent recreates its handler on every render; keep a stable reference so the
  // initial load runs once and doesn't wipe the last success message.
  const manageCrewsRef = useRef(onManageCrews);
  manageCrewsRef.current = onManageCrews;

  const run = useCallback(
    async (operation: CrewOperation, successMessage?: string) => {
      setBusy(true);
      setError("");
      setNotice("");
      try {
        const next = await manageCrewsRef.current(operation);
        setRoster(next);
        if (successMessage) setNotice(successMessage);
        return true;
      } catch (runError) {
        setError(runError instanceof Error ? runError.message : "That change did not save.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  useEffect(() => {
    void run({ type: "list" });
  }, [run]);

  const workersById = useMemo(
    () => new Map((roster?.workers ?? []).map((worker) => [worker.employeeId, worker])),
    [roster],
  );
  const crewsById = useMemo(() => new Map((roster?.crews ?? []).map((crew) => [crew.id, crew])), [roster]);
  // Office logins usually aren't field workers, so they don't belong in the "not on a crew" warning.
  const unassigned = useMemo(
    () => (roster?.workers ?? []).filter((worker) => !worker.crewId && worker.loginRole !== "admin"),
    [roster],
  );

  if (!roster) {
    return (
      <div style={panelStyle}>
        <h2 style={headingStyle}>Crews</h2>
        {error ? <Message tone="error">{error}</Message> : <p style={{ color: MUTED, fontSize: "13px" }}>Loading crews...</p>}
      </div>
    );
  }

  const workerLabel = (worker: CrewRosterWorker) => {
    const crewName = worker.crewId ? crewsById.get(worker.crewId)?.name : null;
    return crewName ? `${worker.displayName} (${crewName})` : `${worker.displayName} (no crew)`;
  };

  async function createCrew() {
    const name = newCrewName.trim();
    if (!name) {
      setError("Give the crew a name.");
      return;
    }
    const ok = await run(
      { type: "create", name, chiefEmployeeId: newCrewChiefId || null },
      `${name} added.`,
    );
    if (ok) {
      setShowNewCrew(false);
      setNewCrewName("");
      setNewCrewChiefId("");
    }
  }

  async function saveRename(crew: CrewRosterCrew) {
    const name = renameValue.trim();
    if (!name || name === crew.name) {
      setRenamingCrewId(null);
      return;
    }
    const ok = await run({ type: "update", crewId: crew.id, name }, `Renamed to ${name}.`);
    if (ok) setRenamingCrewId(null);
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
        <h2 style={headingStyle}>Crews ({roster.crews.length})</h2>
        <button
          type="button"
          style={{ ...primaryButton, opacity: busy ? 0.6 : 1 }}
          disabled={busy}
          onClick={() => {
            setShowNewCrew((open) => !open);
            setError("");
          }}
        >
          {showNewCrew ? "Cancel" : "+ New crew"}
        </button>
      </div>
      <p style={{ margin: "0 0 16px", fontSize: "13px", color: MUTED, lineHeight: 1.5 }}>
        Each crew chief reviews and approves his crew's weeks. The office approves the chief's own week.
      </p>

      {error ? <Message tone="error">{error}</Message> : null}
      {notice ? <Message tone="success">{notice}</Message> : null}

      {showNewCrew ? (
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderLeft: `4px solid ${BRAND_ORANGE}`,
            borderRadius: "8px",
            padding: "14px",
            marginBottom: "16px",
            display: "grid",
            gap: "12px",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            alignItems: "end",
          }}
        >
          <div>
            <label style={labelStyle} htmlFor="new-crew-name">Crew name</label>
            <input
              id="new-crew-name"
              style={inputStyle}
              value={newCrewName}
              maxLength={60}
              placeholder="e.g. Chimney Crew"
              onChange={(event) => setNewCrewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void createCrew();
              }}
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="new-crew-chief">Crew chief (optional)</label>
            <select
              id="new-crew-chief"
              style={selectStyle}
              value={newCrewChiefId}
              onChange={(event) => setNewCrewChiefId(event.target.value)}
            >
              <option value="">Pick later</option>
              {roster.workers.map((worker) => (
                <option key={worker.employeeId} value={worker.employeeId}>
                  {workerLabel(worker)}
                </option>
              ))}
            </select>
          </div>
          <button type="button" style={{ ...primaryButton, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => void createCrew()}>
            Add crew
          </button>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))" }}>
        {roster.crews.map((crew) => {
          const members = crew.memberIds
            .map((id) => workersById.get(id))
            .filter((worker): worker is CrewRosterWorker => Boolean(worker));
          const chief = crew.chiefEmployeeId ? workersById.get(crew.chiefEmployeeId) : undefined;
          const addable = roster.workers.filter((worker) => worker.crewId !== crew.id);
          const otherCrews = roster.crews.filter((other) => other.id !== crew.id);

          return (
            <section
              key={crew.id}
              style={{
                border: `1px solid ${BORDER}`,
                borderTop: `4px solid ${BRAND_ORANGE}`,
                borderRadius: "8px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                background: "#fff",
              }}
            >
              {/* Name row */}
              {renamingCrewId === crew.id ? (
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    style={inputStyle}
                    value={renameValue}
                    maxLength={60}
                    onChange={(event) => setRenameValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void saveRename(crew);
                      if (event.key === "Escape") setRenamingCrewId(null);
                    }}
                    aria-label="Crew name"
                    autoFocus
                  />
                  <button type="button" style={primaryButton} disabled={busy} onClick={() => void saveRename(crew)}>
                    Save
                  </button>
                  <button type="button" style={quietButton} onClick={() => setRenamingCrewId(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: BRAND_DARK, overflowWrap: "anywhere" }}>
                      {crew.name}
                    </h3>
                    <span style={{ fontSize: "12px", color: MUTED }}>
                      {members.length} {members.length === 1 ? "guy" : "guys"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button
                      type="button"
                      style={quietButton}
                      disabled={busy}
                      onClick={() => {
                        setRenamingCrewId(crew.id);
                        setRenameValue(crew.name);
                        setConfirmRemoveCrewId(null);
                      }}
                    >
                      Rename
                    </button>
                    {members.length === 0 && roster.crews.length > 1 ? (
                      <button
                        type="button"
                        style={{ ...quietButton, color: "#B42318" }}
                        disabled={busy}
                        onClick={() => setConfirmRemoveCrewId(crew.id)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {confirmRemoveCrewId === crew.id ? (
                <div
                  style={{
                    background: "#FDECEC",
                    borderRadius: "6px",
                    padding: "10px",
                    fontSize: "13px",
                    color: "#7A271A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>Remove {crew.name}?</span>
                  <span style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      style={{ ...primaryButton, background: "#B42318" }}
                      disabled={busy}
                      onClick={async () => {
                        const ok = await run({ type: "remove", crewId: crew.id }, `${crew.name} removed.`);
                        if (ok) setConfirmRemoveCrewId(null);
                      }}
                    >
                      Remove
                    </button>
                    <button type="button" style={quietButton} onClick={() => setConfirmRemoveCrewId(null)}>
                      Keep
                    </button>
                  </span>
                </div>
              ) : null}

              {/* Crew chief */}
              <div>
                <label style={labelStyle} htmlFor={`chief-${crew.id}`}>Crew chief</label>
                <select
                  id={`chief-${crew.id}`}
                  style={selectStyle}
                  value={crew.chiefEmployeeId ?? ""}
                  disabled={busy}
                  onChange={(event) => {
                    const chiefEmployeeId = event.target.value || null;
                    const chiefName = chiefEmployeeId ? workersById.get(chiefEmployeeId)?.displayName : null;
                    void run(
                      { type: "update", crewId: crew.id, chiefEmployeeId },
                      chiefName ? `${chiefName} now runs ${crew.name}.` : `${crew.name} has no crew chief.`,
                    );
                  }}
                >
                  <option value="">No crew chief</option>
                  {roster.workers.map((worker) => (
                    <option key={worker.employeeId} value={worker.employeeId}>
                      {workerLabel(worker)}
                    </option>
                  ))}
                </select>
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: MUTED, lineHeight: 1.4 }}>
                  {chief && !chief.hasLogin
                    ? `${chief.displayName} has no login yet. Invite him from the Team list so he can run the crew board.`
                    : crew.chiefEmployeeId
                      ? "Picking a chief also puts him on this crew."
                      : "Without a chief, the office approves this crew's weeks."}
                </p>
              </div>

              {/* Members */}
              <div>
                <span style={labelStyle}>On this crew</span>
                {members.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "13px", color: MUTED }}>Nobody yet.</p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                    {members.map((worker) => (
                      <li
                        key={worker.employeeId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                          padding: "8px 10px",
                          background: BRAND_LIGHT,
                          borderRadius: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", minWidth: 0, flex: "1 1 120px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: BRAND_DARK }}>{worker.displayName}</span>
                          {worker.employeeId === crew.chiefEmployeeId ? <Badge tone="orange">Chief</Badge> : null}
                          {worker.workerType === "1099" ? <Badge>1099</Badge> : null}
                          {!worker.hasLogin ? <Badge tone="amber">No login</Badge> : null}
                        </span>
                        <select
                          aria-label={`Move ${worker.displayName}`}
                          style={{ ...selectStyle, width: "auto", maxWidth: "100%", padding: "5px 8px", fontSize: "12px", flexShrink: 0 }}
                          value=""
                          disabled={busy}
                          onChange={(event) => {
                            const target = event.target.value;
                            if (!target) return;
                            if (target === "__off") {
                              void run(
                                { type: "unassignMember", crewId: crew.id, employeeId: worker.employeeId },
                                `${worker.displayName} is off ${crew.name}.`,
                              );
                            } else {
                              const targetName = crewsById.get(target)?.name ?? "the new crew";
                              void run(
                                { type: "moveMember", crewId: target, employeeId: worker.employeeId },
                                `${worker.displayName} moved to ${targetName}. His open week moved with him.`,
                              );
                            }
                          }}
                        >
                          <option value="">Move...</option>
                          {otherCrews.map((other) => (
                            <option key={other.id} value={other.id}>
                              To {other.name}
                            </option>
                          ))}
                          <option value="__off">Take off crew</option>
                        </select>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add worker */}
              {addable.length > 0 ? (
                <div>
                  <label style={labelStyle} htmlFor={`add-${crew.id}`}>Add a guy</label>
                  <select
                    id={`add-${crew.id}`}
                    style={selectStyle}
                    value=""
                    disabled={busy}
                    onChange={(event) => {
                      const employeeId = event.target.value;
                      if (!employeeId) return;
                      const name = workersById.get(employeeId)?.displayName ?? "Worker";
                      void run({ type: "moveMember", crewId: crew.id, employeeId }, `${name} is on ${crew.name}.`);
                    }}
                  >
                    <option value="">Pick a worker...</option>
                    {addable.map((worker) => (
                      <option key={worker.employeeId} value={worker.employeeId}>
                        {workerLabel(worker)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      {unassigned.length > 0 ? (
        <div
          style={{
            marginTop: "16px",
            border: "1px dashed #F59E0B",
            background: "#FFFBEB",
            borderRadius: "8px",
            padding: "14px",
          }}
        >
          <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#92400E" }}>
            Not on a crew ({unassigned.length})
          </h3>
          <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#92400E" }}>
            These guys don't get a timesheet until they're on a crew.
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
            {unassigned.map((worker) => (
              <li
                key={worker.employeeId}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}
              >
                <span style={{ fontSize: "13px", fontWeight: 600, color: BRAND_DARK }}>{worker.displayName}</span>
                <select
                  aria-label={`Put ${worker.displayName} on a crew`}
                  style={{ ...selectStyle, width: "auto", maxWidth: "100%", padding: "5px 8px", fontSize: "12px" }}
                  value=""
                  disabled={busy}
                  onChange={(event) => {
                    const crewId = event.target.value;
                    if (!crewId) return;
                    void run(
                      { type: "moveMember", crewId, employeeId: worker.employeeId },
                      `${worker.displayName} is on ${crewsById.get(crewId)?.name ?? "the crew"}.`,
                    );
                  }}
                >
                  <option value="">Put on crew...</option>
                  {roster.crews.map((crew) => (
                    <option key={crew.id} value={crew.id}>
                      {crew.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

const panelStyle: CSSProperties = {
  padding: "20px",
  backgroundColor: "white",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  marginBottom: "16px",
};

const headingStyle: CSSProperties = { margin: 0, fontSize: "18px", fontWeight: 600, color: BRAND_DARK };

function Message({ tone, children }: { tone: "error" | "success"; children: string }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      style={{
        marginBottom: "12px",
        padding: "10px 12px",
        borderRadius: "6px",
        backgroundColor: tone === "error" ? "#FDECEC" : "#E8F5E9",
        color: tone === "error" ? "#B42318" : "#2E7D32",
        fontSize: "13px",
      }}
    >
      {children}
    </div>
  );
}

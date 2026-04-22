import type { ArchivedEmployee } from "../domain/models";

interface ArchivePanelProps {
  archivedEmployees: ArchivedEmployee[];
}

export function ArchivePanel({ archivedEmployees }: ArchivePanelProps) {
  return (
    <section className="panel compact-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Archive / Rehire</p>
          <h2>Retain employee history instead of deleting records</h2>
        </div>
      </div>

      <div className="archive-list">
        {archivedEmployees.map((employee) => (
          <article className="report-card" key={employee.id}>
            <div className="report-card__header">
              <strong>{employee.displayName}</strong>
              <span>{employee.crewName}</span>
            </div>
            <p>{employee.archiveReason || "No archive reason recorded."}</p>
            <p>{employee.archiveNotes || "No archive notes."}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

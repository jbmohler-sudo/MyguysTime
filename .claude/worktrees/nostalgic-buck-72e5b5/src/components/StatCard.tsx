import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  helper?: ReactNode;
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <article className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {helper ? <span className="stat-helper">{helper}</span> : null}
    </article>
  );
}

import { useView, type ViewMode } from "../context/ViewContext";

const options: { label: string; value: ViewMode }[] = [
  { label: "Office", value: "OFFICE" },
  { label: "Truck", value: "TRUCK" },
];

export function ToggleView() {
  const { viewMode, setViewMode } = useView();

  return (
    <div style={styles.track} role="group" aria-label="View mode">
      {options.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          onClick={() => setViewMode(value)}
          aria-pressed={viewMode === value}
          style={viewMode === value ? { ...styles.tab, ...styles.active } : styles.tab}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const styles = {
  track: {
    display: "inline-flex",
    borderRadius: "6px",
    background: "#f1f1f1",
    padding: "2px",
    gap: "2px",
  } as React.CSSProperties,
  tab: {
    padding: "4px 14px",
    border: "none",
    borderRadius: "4px",
    background: "transparent",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    color: "#555",
    transition: "background 0.15s, color 0.15s",
  } as React.CSSProperties,
  active: {
    background: "#fff",
    color: "#111",
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
  } as React.CSSProperties,
};

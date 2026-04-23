import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

const BRAND_ORANGE = "#FF8C00";

type ToastType = "success" | "error";

interface ToastState {
  id: number;
  message: string;
  secondary?: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, secondary?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const DISMISS_MS = 3000;

const borderColor: Record<ToastType, string> = {
  success: BRAND_ORANGE,
  error: "#dc2626",
};

const iconBg: Record<ToastType, string> = {
  success: "rgba(255,140,0,0.1)",
  error: "rgba(220,38,38,0.1)",
};

const iconColor: Record<ToastType, string> = {
  success: BRAND_ORANGE,
  error: "#dc2626",
};

const iconLabel: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
};

function ToastBubble({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        maxWidth: "380px",
        width: "calc(100vw - 40px)",
        backgroundColor: "white",
        borderRadius: "8px",
        borderLeft: `4px solid ${borderColor[toast.type]}`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        animation: "toastSlideIn 0.25s ease",
      }}
    >
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="status"] { animation: none !important; }
        }
      `}</style>

      {/* Icon badge */}
      <div
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: "26px",
          height: "26px",
          borderRadius: "50%",
          backgroundColor: iconBg[toast.type],
          color: iconColor[toast.type],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "14px",
        }}
      >
        {iconLabel[toast.type]}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1A1A1B" }}>
          {toast.message}
        </div>
        {toast.secondary && (
          <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "3px" }}>
            {toast.secondary}
          </div>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#9ca3af",
          fontSize: "16px",
          lineHeight: 1,
          padding: "2px",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"; }}
        type="button"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = "success", secondary?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = ++idRef.current;
    setToast({ id, message, secondary, type });
    timerRef.current = setTimeout(() => setToast(null), DISMISS_MS);
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <ToastBubble key={toast.id} toast={toast} onDismiss={dismiss} />}
    </ToastContext.Provider>
  );
}

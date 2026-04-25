import { createContext, useContext, useState, type ReactNode } from "react";

export type ViewMode = "OFFICE" | "TRUCK";

const COOKIE_KEY = "view_mode";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readCookie(): ViewMode {
  const match = document.cookie.match(/(?:^|;\s*)view_mode=([^;]+)/);
  return match?.[1] === "TRUCK" ? "TRUCK" : "OFFICE";
}

function writeCookie(value: ViewMode) {
  document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

interface ViewContextValue {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewContext = createContext<ViewContextValue | null>(null);

export function useView(): ViewContextValue {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useView must be used inside ViewProvider");
  return ctx;
}

export function ViewProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => readCookie());

  function setViewMode(mode: ViewMode) {
    writeCookie(mode);
    setViewModeState(mode);
  }

  return (
    <ViewContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewContext.Provider>
  );
}

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { UserRole } from "../domain/models";

type PreviewRole = UserRole;

interface PreviewUserContextValue {
  previewRole: PreviewRole | null;
  isPreviewMode: boolean;
  setPreviewRole: (role: PreviewRole) => void;
  clearPreviewRole: () => void;
}

const PREVIEW_ROLE_STORAGE_KEY = "crew-timecard-preview-role";

const PreviewUserContext = createContext<PreviewUserContextValue | null>(null);

function getStoredPreviewRole(): PreviewRole | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedRole = window.localStorage.getItem(PREVIEW_ROLE_STORAGE_KEY);
  return storedRole === "admin" || storedRole === "foreman" || storedRole === "employee" ? storedRole : null;
}

export function PreviewUserProvider({ children }: { children: ReactNode }) {
  const [previewRole, setPreviewRoleState] = useState<PreviewRole | null>(getStoredPreviewRole);

  const value = useMemo<PreviewUserContextValue>(
    () => ({
      previewRole,
      isPreviewMode: previewRole !== null,
      setPreviewRole: (role) => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(PREVIEW_ROLE_STORAGE_KEY, role);
        }
        setPreviewRoleState(role);
      },
      clearPreviewRole: () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(PREVIEW_ROLE_STORAGE_KEY);
        }
        setPreviewRoleState(null);
      },
    }),
    [previewRole],
  );

  return <PreviewUserContext.Provider value={value}>{children}</PreviewUserContext.Provider>;
}

export function usePreviewUser() {
  const context = useContext(PreviewUserContext);
  if (!context) {
    throw new Error("usePreviewUser must be used inside PreviewUserProvider.");
  }
  return context;
}

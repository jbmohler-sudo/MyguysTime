import { useEffect } from "react";

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  containerRef: { current: HTMLElement | null },
  isActive: boolean,
  onEscape?: () => void,
) {
  useEffect(() => {
    if (!isActive) return;
    const container = containerRef.current;
    if (!container) return;

    const prevFocus = document.activeElement as HTMLElement | null;

    // Focus first focusable element when modal opens
    const first = container.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = Array.from(
        container!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
      );
      if (focusable.length === 0) return;

      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Return focus to the element that opened the modal
      prevFocus?.focus();
    };
  }, [isActive, containerRef, onEscape]);
}

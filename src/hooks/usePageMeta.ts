import { useEffect } from "react";

// Sets the page <title> and meta description for marketing pages.
// Pass undefined to leave the current values untouched.
export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", description);
    }
  }, [title, description]);
}

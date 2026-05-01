import posthog from "posthog-js";

type PostHogIdentifyInput = {
  id: string;
  role: string;
  companyId?: string | null;
  companyName?: string | null;
};

const projectApiKey = import.meta.env.VITE_POSTHOG_KEY?.trim();
const apiHost = import.meta.env.VITE_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

let initialized = false;

export const frontendPostHogEnabled = Boolean(projectApiKey);

export function initializePostHog() {
  if (!frontendPostHogEnabled || initialized || typeof window === "undefined") {
    return;
  }

  posthog.init(projectApiKey!, {
    api_host: apiHost,
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: "identified_only",
  });

  initialized = true;
}

export function identifyPostHogUser(input: PostHogIdentifyInput) {
  if (!frontendPostHogEnabled || !initialized) {
    return;
  }

  posthog.identify(input.id, {
    role: input.role,
    company_id: input.companyId ?? undefined,
    company_name: input.companyName ?? undefined,
  });

  if (input.companyId) {
    posthog.group("company", input.companyId, {
      company_name: input.companyName ?? undefined,
    });
  }
}

export function resetPostHogUser() {
  if (!frontendPostHogEnabled || !initialized) {
    return;
  }

  posthog.reset();
}

export function capturePostHogPageview(path: string) {
  if (!frontendPostHogEnabled || !initialized || typeof window === "undefined") {
    return;
  }

  posthog.capture("$pageview", {
    path,
    $current_url: window.location.href,
  });
}

export function capturePostHogEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
) {
  if (!frontendPostHogEnabled || !initialized) {
    return;
  }

  posthog.capture(event, properties);
}

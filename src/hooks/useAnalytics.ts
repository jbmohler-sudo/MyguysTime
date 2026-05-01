import { capturePostHogEvent } from "../lib/posthog";

/**
 * Analytics hook for tracking user interactions
 * Supports: page views, feature usage, errors, performance metrics
 *
 * Usage:
 *   const analytics = useAnalytics();
 *   analytics.trackEvent("add_employee_modal_opened", { crew: "Truck 1" });
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: number;
}

interface AnalyticsConfig {
  enabled: boolean;
  endpoint?: string;
  userId?: string;
  sessionId?: string;
}

let eventQueue: AnalyticsEvent[] = [];
let config: AnalyticsConfig = {
  enabled: true,
};

export const initializeAnalytics = (cfg: Partial<AnalyticsConfig>) => {
  config = { ...config, ...cfg };
  eventQueue = [];
};

export const useAnalytics = () => {
  const trackEvent = (name: string, properties?: Record<string, string | number | boolean>) => {
    if (!config.enabled) return;

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
    };

    eventQueue.push(event);
    capturePostHogEvent(name, properties);

    if (import.meta.env.DEV) {
      console.log("[analytics]", name, properties || "");
    }
  };

  const trackPageView = (page: string, properties?: Record<string, string | number | boolean>) => {
    trackEvent("page_view", {
      page,
      ...properties,
    });
  };

  const trackFeatureUsage = (feature: string, action: string, properties?: Record<string, string | number | boolean>) => {
    trackEvent("feature_usage", {
      feature,
      action,
      ...properties,
    });
  };

  const trackError = (error: Error | string, context?: Record<string, string | number | boolean>) => {
    const errorMessage = typeof error === "string" ? error : error.message;
    trackEvent("error", {
      message: errorMessage,
      ...context,
    });
  };

  const trackTiming = (name: string, duration: number, properties?: Record<string, string | number | boolean>) => {
    trackEvent("timing", {
      name,
      duration,
      ...properties,
    });
  };

  const getEventQueue = () => [...eventQueue];

  const clearEventQueue = () => {
    const count = eventQueue.length;
    eventQueue = [];
    return count;
  };

  return {
    trackEvent,
    trackPageView,
    trackFeatureUsage,
    trackError,
    trackTiming,
    getEventQueue,
    clearEventQueue,
  };
};

export const __TEST__ = {
  getConfig: () => config,
  getEventQueue: () => eventQueue,
  resetQueue: () => {
    eventQueue = [];
  },
};

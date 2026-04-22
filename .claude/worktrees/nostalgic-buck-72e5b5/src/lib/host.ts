const PUBLIC_HOSTS = new Set(["myguystime.com", "www.myguystime.com"]);
const APP_HOSTS = new Set(["app.myguystime.com", "myguystime.vercel.app", "localhost", "127.0.0.1"]);
const CURRENT_APP_ENTRY_URL = "https://app.myguystime.com";

export function getCurrentHostname() {
  if (typeof window === "undefined") {
    return "localhost";
  }

  return window.location.hostname.toLowerCase();
}

export function isPublicHomepageHost(hostname: string) {
  return PUBLIC_HOSTS.has(hostname);
}

export function isAppHost(hostname: string) {
  return APP_HOSTS.has(hostname) || hostname.endsWith(".vercel.app");
}

export function getPreferredAppUrl(hostname: string) {
  if (isPublicHomepageHost(hostname)) {
    return CURRENT_APP_ENTRY_URL;
  }

  if (typeof window === "undefined") {
    return "http://localhost:5173";
  }

  return window.location.origin;
}

import type { Request } from "express";

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

export function getAllowedOrigins() {
  const origins = new Set<string>();
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    origins.add(stripTrailingSlash(appUrl));
  }

  for (const origin of (process.env.CORS_ORIGINS ?? "").split(",")) {
    const trimmed = origin.trim();
    if (trimmed) {
      origins.add(stripTrailingSlash(trimmed));
    }
  }

  return [...origins];
}

export function isOriginAllowed(origin: string | undefined) {
  if (!origin) {
    return true;
  }

  const allowed = getAllowedOrigins();
  if (allowed.includes(stripTrailingSlash(origin))) {
    return true;
  }

  return process.env.NODE_ENV !== "production" && allowed.length === 0;
}

export function resolvePublicAppUrl(req: Pick<Request, "get" | "protocol">) {
  const allowed = getAllowedOrigins();
  const configured = process.env.APP_URL?.trim()
    ? stripTrailingSlash(process.env.APP_URL.trim())
    : "";
  const requestOrigin = req.get("origin")?.trim()
    ? stripTrailingSlash(req.get("origin")!.trim())
    : "";

  if (requestOrigin && allowed.includes(requestOrigin)) {
    return requestOrigin;
  }

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV !== "production") {
    const host = req.get("host")?.trim();
    if (host) {
      return `${req.protocol}://${host}`;
    }
  }

  throw new Error("APP_URL must be set so invite links cannot be minted from a spoofed Origin.");
}

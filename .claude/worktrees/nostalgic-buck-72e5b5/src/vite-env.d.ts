/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  readonly VITE_SENTRY_RELEASE?: string;
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
  readonly VITE_SENTRY_VERIFY_ENABLED?: string;
  readonly VITE_SENTRY_BACKEND_VERIFY_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

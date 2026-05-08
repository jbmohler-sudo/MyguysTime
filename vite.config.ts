import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const sentryOrg = env.SENTRY_ORG?.trim();
  const sentryProject = env.SENTRY_PROJECT?.trim();
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN?.trim();
  const sentryRelease = env.SENTRY_RELEASE?.trim() || env.VERCEL_GIT_COMMIT_SHA?.trim() || undefined;

  return {
    plugins: [
      react(),
      ...(sentryOrg && sentryProject && sentryAuthToken
        ? [
            sentryVitePlugin({
              org: sentryOrg,
              project: sentryProject,
              authToken: sentryAuthToken,
              telemetry: false,
              release: {
                name: sentryRelease,
              },
              sourcemaps: {
                filesToDeleteAfterUpload: ["dist/**/*.js.map", "dist/**/*.css.map"],
              },
            }),
          ]
        : []),
    ],
    build: {
      sourcemap: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

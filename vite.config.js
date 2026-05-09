var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
export default defineConfig(function (_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j;
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), "");
    var sentryOrg = (_b = env.SENTRY_ORG) === null || _b === void 0 ? void 0 : _b.trim();
    var sentryProject = (_c = env.SENTRY_PROJECT) === null || _c === void 0 ? void 0 : _c.trim();
    var sentryAuthToken = (_d = env.SENTRY_AUTH_TOKEN) === null || _d === void 0 ? void 0 : _d.trim();
    var sentryRelease = ((_e = env.SENTRY_RELEASE) === null || _e === void 0 ? void 0 : _e.trim()) || ((_f = env.VERCEL_GIT_COMMIT_SHA) === null || _f === void 0 ? void 0 : _f.trim()) || undefined;
    var sentryUploadMode = (_g = env.SENTRY_UPLOAD_SOURCEMAPS) === null || _g === void 0 ? void 0 : _g.trim().toLowerCase();
    var shouldUploadSentrySourcemaps = Boolean(sentryOrg && sentryProject && sentryAuthToken) &&
        sentryUploadMode !== "false" &&
        ((_h = env.MYGUYS_FIXTURE_ENV) === null || _h === void 0 ? void 0 : _h.trim().toLowerCase()) !== "test" &&
        (((_j = env.VERCEL_ENV) === null || _j === void 0 ? void 0 : _j.trim().toLowerCase()) === "production" || sentryUploadMode === "true");
    return {
        plugins: __spreadArray([
            react()
        ], (shouldUploadSentrySourcemaps
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
            : []), true),
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

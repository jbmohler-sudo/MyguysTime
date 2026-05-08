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
    var _b, _c, _d, _e, _f;
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), "");
    var sentryOrg = (_b = env.SENTRY_ORG) === null || _b === void 0 ? void 0 : _b.trim();
    var sentryProject = (_c = env.SENTRY_PROJECT) === null || _c === void 0 ? void 0 : _c.trim();
    var sentryAuthToken = (_d = env.SENTRY_AUTH_TOKEN) === null || _d === void 0 ? void 0 : _d.trim();
    var sentryRelease = ((_e = env.SENTRY_RELEASE) === null || _e === void 0 ? void 0 : _e.trim()) || ((_f = env.VERCEL_GIT_COMMIT_SHA) === null || _f === void 0 ? void 0 : _f.trim()) || undefined;
    return {
        plugins: __spreadArray([
            react()
        ], (sentryOrg && sentryProject && sentryAuthToken
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

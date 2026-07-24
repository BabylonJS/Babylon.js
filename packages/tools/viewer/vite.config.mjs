"use strict";

/* eslint-disable no-console */

import { defineConfig, loadEnv, transformWithEsbuild } from "vite";
import chalk from "chalk";
import { mkdirSync, createWriteStream } from "fs";
import { execSync } from "child_process";
import path from "path";

// TC39 decorators migration: the viewer's Lit elements use TC39 Stage 3 decorators plus the
// `accessor` keyword. Vite 8 transforms served source via Oxc (through Rolldown), but Oxc only
// lowers *legacy* (experimental) decorators — with TC39 Stage 3 decorators it leaves
// `@decorator`/`accessor` untransformed, which the browser cannot parse ("SyntaxError: Invalid or
// unexpected token"), so the `babylon-viewer` custom element is never defined. esbuild does lower
// TC39 decorators, so we disable Oxc (`oxc: false`) and run a `pre` plugin that transforms every
// TS/TSX source with esbuild before Rolldown processes it. `target`/`useDefineForClassFields` mirror
// tsconfig.build.json so the dev server matches how the published package is compiled by tsc.
const esbuildTransformOptions = {
    target: "es2021",
    tsconfigRaw: {
        compilerOptions: {
            useDefineForClassFields: false,
        },
    },
};

const esbuildDecoratorPlugin = {
    name: "babylon-esbuild-tc39-decorators",
    enforce: "pre",
    async transform(code, id) {
        const filePath = id.split("?")[0];
        if (!/\.tsx?$/.test(filePath) || filePath.includes("/node_modules/")) {
            return null;
        }
        const result = await transformWithEsbuild(code, id, esbuildTransformOptions);
        return { code: result.code, map: result.map };
    },
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    const source = env.source ?? "dev";
    const rawCoverageDirectory = process.env.COVERAGE_DIR;

    const port = env.VIEWER_PORT ?? 1342;
    console.log(`${chalk.bold(`Web Test App`)}: ${chalk.cyan(`http://localhost:${port}/packages/tools/viewer/test/apps/web/index.html`)}`);
    console.log(`${chalk.bold(`Analyze Verification App`)}: ${chalk.cyan(`http://localhost:${port}/packages/tools/viewer/test/apps/web/analyze.html`)}`);
    console.log(`${chalk.bold(`Coverage App`)}: ${chalk.cyan(`http://localhost:${port}/packages/tools/viewer/test/apps/web/coverage.html`)}`);

    // To develop @babylonjs/lite against a local checkout, set `liteRepoRoot` to the Babylon-Lite
    // repo root — either an absolute path, or a path relative to this package's directory (the
    // dev-server cwd), e.g. "../../../../Babylon-Lite" for a clone sitting next to this repo. When
    // set, @babylonjs/lite is aliased to that clone's build and served as source (instant edits, no
    // ~30s pre-bundle). Leave it null to resolve the published npm package as usual.
    const liteRepoRoot = null;
    const liteLocalBuild = liteRepoRoot ? path.resolve(liteRepoRoot, "packages/babylon-lite/build") : null;
    if (liteLocalBuild) {
        console.log(`${chalk.bold(`Local @babylonjs/lite build`)}: ${chalk.green(liteLocalBuild)}`);
    }

    return {
        root: "../../../",
        oxc: false,
        optimizeDeps: {
            // `root` is the repo root so the aliased dev-package dist stays inside the served tree,
            // but that also makes Vite's automatic dependency scan glob the entire monorepo for entry
            // HTML/TS and choke on unrelated apps (e.g. es6Vis) whose bare `@babylonjs/*` imports it
            // can't resolve in this context — the scan then aborts and pre-bundles nothing. Pointing
            // `entries` at just this app's HTML scopes the scan to what actually loads here, so it no
            // longer wastes startup crawling+failing on the rest of the monorepo.
            entries: ["packages/tools/viewer/test/apps/web/*.html"],
            // The Babylon dev packages resolve (via the aliases below) to packages/dev/*/dist, which
            // live inside `root`, so Vite treats them as project *source* and serves them as native
            // ESM (the browser then only fetches the modules the page actually reaches, with no
            // bundling bloat). The genuine npm dependencies, however, must be pre-bundled.
            //
            // Vite's automatic dependency scan can't do that here: with `root` at the repo root it
            // globs the whole monorepo for entry HTML and aborts on unrelated apps whose imports it
            // can't resolve in this context (e.g. es6Vis). When the scan aborts, nothing is
            // pre-bundled up front, so Vite instead discovers each npm dep (lit, tslib, ...) lazily
            // while the first page loads and re-optimizes + forces a full page reload for each one.
            // That storm of re-optimizations makes the initial load slow and erratic, and on Windows
            // the mid-load dependency-folder swap intermittently fails with EPERM.
            //
            // Listing every npm dependency the app touches lets the optimizer bundle them all in a
            // single pass before the first request, eliminating the on-demand re-optimize/reload
            // cycles entirely while leaving the dev-package source to be served directly.
            //
            // `@babylonjs/lite` is intentionally NOT listed here even though it is an npm dependency:
            // it is only reached by the Lite viewer test pages (lite/viewerElement / lite/index), not
            // the default web test app, and pre-bundling it costs ~30s on every dev-server start. It
            // is left to be discovered on demand the first time a Lite page is loaded, so the common
            // default-app workflow starts almost instantly. When `liteRepoRoot` is set (see above) it
            // is instead aliased to that local build and served as source (see the alias in `resolve`
            // below), which skips the pre-bundle entirely and picks up local rebuilds on refresh.
            include: ["lit", "lit/decorators.js", "lit/directives/ref.js", "tslib"],
        },
        server: {
            port,
            // A local `liteRepoRoot` build lives outside `root`, so it must be added to the dev
            // server's filesystem allow-list or Vite refuses to serve it. Only applied when
            // `liteRepoRoot` is set, leaving Vite's default (root-based) sandbox untouched otherwise.
            ...(liteRepoRoot ? { fs: { allow: [path.resolve("../../../"), path.resolve(liteRepoRoot)] } } : {}),
            hmr: process.env.ENABLE_HOT_RELOAD !== undefined ? process.env.ENABLE_HOT_RELOAD === "true" : true,
            https: process.env.ENABLE_HTTPS === "true",
        },
        plugins: [
            esbuildDecoratorPlugin,
            {
                name: "configure-server",
                configureServer(server) {
                    server.middlewares.use("/api", (req, res, next) => {
                        if (req.url === "/saveCoverage") {
                            mkdirSync(rawCoverageDirectory, { recursive: true });
                            const writeStream = createWriteStream(path.join(rawCoverageDirectory, "coverage.json"));
                            req.pipe(writeStream);
                            req.on("end", () => {
                                try {
                                    execSync(`npm run report-coverage`);
                                    res.statusCode = 200;
                                } catch (e) {
                                    res.statusCode = 500;
                                    console.error(e);
                                } finally {
                                    res.end();
                                }
                            });
                        } else {
                            next();
                        }
                    });
                },
            },
        ],
        resolve: {
            // The Babylon dev packages are compiled to .js in their dist folders and imported
            // extensionlessly (e.g. `export * from "./scene.pure"`). Vite resolves each such import by
            // probing candidate extensions in order, and every miss is a filesystem stat — which is
            // expensive on Windows (Defender) and, multiplied across ~250 modules each importing many
            // siblings, dominates the cold first-load cost. Vite's default list
            // ([".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"]) probes .mjs/.mts before the .js
            // these packages actually use. Narrowing and reordering the list so the common cases (.js
            // for dev-package dist, .ts/.tsx for this package's own source) are found on the first or
            // second probe removes the wasted stats and measurably speeds up the initial load.
            extensions: [".js", ".ts", ".tsx", ".json"],
            alias: {
                addons: `@${source}/addons/dist`,
                core: `@${source}/core/dist`,
                loaders: `@${source}/loaders/dist`,
                inspector: `@${source}/inspector/dist`,
                materials: `@${source}/materials/dist`,
                serializers: `@${source}/serializers/dist`,
                gui: `@${source}/gui/dist`,
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/dist"),
                "gui-editor": path.resolve("../../tools/guiEditor/dist"),
                // When `liteRepoRoot` is set (see above), serve @babylonjs/lite from that local build
                // as source (instant edits, no ~30s pre-bundle) instead of the published npm package.
                ...(liteLocalBuild ? { "@babylonjs/lite": liteLocalBuild } : {}),
            },
        },
    };
});

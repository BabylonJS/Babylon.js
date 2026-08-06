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

    return {
        root: "../../../",
        oxc: false,
        server: {
            port,
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
            },
        },
    };
});

"use strict";

/* eslint-disable no-console */

import { defineConfig, loadEnv } from "vite";
import chalk from "chalk";
import { mkdirSync, createWriteStream } from "fs";
import { execSync } from "child_process";
import path from "path";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    const source = env.source ?? "dev";
    const rawCoverageDirectory = process.env.COVERAGE_DIR;

    const port = env.VIEWER_PORT ?? 1342;
    console.log(`${chalk.bold(`Web Test App`)}: ${chalk.cyan(`http://localhost:${port}/packages/tools/viewer-alpha/test/apps/web/index.html`)}`);
    console.log(`${chalk.bold(`Analyze Verification App`)}: ${chalk.cyan(`http://localhost:${port}/packages/tools/viewer-alpha/test/apps/web/analyze.html`)}`);
    console.log(`${chalk.bold(`Coverage App`)}: ${chalk.cyan(`http://localhost:${port}/packages/tools/viewer-alpha/test/apps/web/coverage.html`)}`);

    return {
        root: "../../../",
        server: {
            port,
        },
        plugins: [
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
                core: `@${source}/core/dist`,
                loaders: `@${source}/loaders/dist`,
            },
        },
    };
});

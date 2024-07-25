import { defineConfig, loadEnv } from "vite";
import chalk from "chalk";
import { mkdirSync, createWriteStream } from "fs";
import { exec, execSync } from "child_process";
import path from "path";
import open from "open";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    const source = env.source ?? "dev";

    const port = env.VIEWER_PORT ?? 1342;
    console.log(`${chalk.bold(`Web Test App`)}: ${chalk.cyan(`http://localhost:${port}/packages/tools/viewer-alpha/test/apps/web/index.html`)}`);
    console.log(`${chalk.bold(`Bundle Test App`)}: ${chalk.cyan(`http://localhost:${port}/packages/tools/viewer-alpha/test/apps/web/bundle-test.html`)}`);
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
                            const coverageDirectory = "dist/coverage";
                            const rawDirectory = path.join(coverageDirectory, "raw");
                            const reportsDirectory = path.join(coverageDirectory, "reports");
                            mkdirSync(rawDirectory, { recursive: true });
                            const writeStream = createWriteStream(path.join(rawDirectory, "coverage.json"));
                            req.pipe(writeStream);
                            req.on("end", () => {
                                try {
                                    execSync(`npx nyc report --reporter html --reporter json-summary -t ${rawDirectory} --report-dir ${reportsDirectory}`);
                                    open(`${path.join(reportsDirectory, "index.html")}`);
                                } catch (e) {
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

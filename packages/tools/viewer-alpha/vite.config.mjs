import { defineConfig, loadEnv } from "vite";
import chalk from "chalk";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    const source = env.source ?? "dev";

    const port = env.VIEWER_PORT ?? 1342;
    console.log(`${chalk.bold(`Web Test App`)}: ${chalk.cyan(`http://localhost:${port}/packages/tools/viewer-alpha/test/apps/web/index.html`)}`);
    console.log(`${chalk.bold(`Bundle Test App`)}: ${chalk.cyan(`http://localhost:${port}/packages/tools/viewer-alpha/test/apps/web/bundle-test.html`)}`);

    return {
        root: "../../../",
        server: {
            port,
        },
        resolve: {
            alias: {
                core: `@${source}/core/dist`,
                loaders: `@${source}/loaders/dist`,
            },
        },
    };
});

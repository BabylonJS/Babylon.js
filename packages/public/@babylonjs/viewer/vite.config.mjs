"use strict";

/* eslint-disable no-console */

import { defineConfig, loadEnv } from "vite";
import chalk from "chalk";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());

    const port = env.VIEWER_PORT ?? 1343;
    console.log(`${chalk.bold(`Web Test App`)}: ${chalk.cyan(`http://localhost:${port}/test/apps/web/index.html`)}`);

    return {
        root: ".",
        server: {
            port,
        },
    };
});

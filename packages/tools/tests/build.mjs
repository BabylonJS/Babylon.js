// read all files in src, use the filenames without extension as environment variable to execute webpack command

import { readdirSync } from "fs";
import { join, basename, dirname } from "path";
import chalk from "chalk";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const files = readdirSync(join(__dirname, "src"));
files.forEach((file) => {
    // TODO: Figure out why WebPack uses so much memory when bundling sceneWithInspector.js
    if (file !== "sceneWithInspector.ts") {
        console.log();
        console.log(chalk.bold(chalk.blue(`===== Building ${file} =====`)));
        execSync(`webpack --env entry=${basename(file, ".ts")}`, { stdio: "inherit" });
    }
});

import { existsSync, mkdirSync, readFileSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import chalk from "chalk";
import { build } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, "..");
const outputRoot = join(packageRoot, "dist", "es6Smoke");
const require = createRequire(import.meta.url);

mkdirSync(outputRoot, { recursive: true });

const entries = [
    {
        name: "runtime",
        entryPoint: join(packageRoot, "src", "es6Smoke", "runtimeSmoke.ts"),
        outfile: join(outputRoot, "runtime.mjs"),
        platform: "node",
        format: "esm",
        execute: true,
    },
    {
        name: "packages",
        entryPoint: join(packageRoot, "src", "es6Smoke", "packageImportSmoke.ts"),
        outfile: join(outputRoot, "packages.mjs"),
        platform: "browser",
        format: "esm",
    },
];

const editorPackages = [
    "@babylonjs/gui-editor",
    "@babylonjs/inspector",
    "@babylonjs/inspector-legacy",
    "@babylonjs/node-editor",
    "@babylonjs/node-geometry-editor",
    "@babylonjs/node-particle-editor",
    "@babylonjs/node-render-graph-editor",
];

for (const entry of entries) {
    console.log(chalk.bold(chalk.blue(`===== Building ES6 smoke test: ${entry.name} =====`)));

    await build({
        entryPoints: [entry.entryPoint],
        bundle: true,
        sourcemap: true,
        platform: entry.platform,
        format: entry.format,
        outfile: entry.outfile,
        logLevel: "info",
        target: "es2022",
        loader: {
            ".gif": "dataurl",
            ".jpg": "dataurl",
            ".png": "dataurl",
            ".svg": "dataurl",
            ".wasm": "file",
        },
    });

    if (entry.execute) {
        console.log(chalk.bold(chalk.blue(`===== Running ES6 smoke test: ${entry.name} =====`)));
        await import(pathToFileURL(entry.outfile).href);
    }
}

console.log(chalk.bold(chalk.blue("===== Validating ES6 editor package entries =====")));

for (const packageName of editorPackages) {
    const packageJsonPath = require.resolve(`${packageName}/package.json`);
    const packageDirectory = dirname(packageJsonPath);
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    const runtimeEntry = packageJson.module ?? packageJson.main;
    const typesEntry = packageJson.types ?? packageJson.typings;

    if (!runtimeEntry || !existsSync(join(packageDirectory, runtimeEntry))) {
        throw new Error(`${packageName} does not have a generated runtime entry file.`);
    }

    if (!typesEntry || !existsSync(join(packageDirectory, typesEntry))) {
        throw new Error(`${packageName} does not have a generated declaration entry file.`);
    }

    console.log(`${packageName}: ${runtimeEntry}, ${typesEntry}`);
}

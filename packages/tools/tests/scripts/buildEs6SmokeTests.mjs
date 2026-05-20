import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import chalk from "chalk";
import { build } from "esbuild";
import webpack from "webpack";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, "..");
const outputRoot = join(packageRoot, "temp", "es6Smoke");
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

    if (packageName === "@babylonjs/node-particle-editor") {
        const runtimeCode = readFileSync(join(packageDirectory, runtimeEntry), "utf8");
        for (const forbiddenRequest of ["@babylonjs/core::BABYLON.Debug", "@fortawesome/fontawesome-svg-core/package.json"]) {
            if (runtimeCode.includes(forbiddenRequest)) {
                throw new Error(`${packageName} runtime entry still contains ${forbiddenRequest}.`);
            }
        }
        if (!runtimeCode.includes(".NodeParticleEditor") && !runtimeCode.includes('"NodeParticleEditor"')) {
            throw new Error(`${packageName} runtime entry does not expose NodeParticleEditor as a named export.`);
        }
    }

    console.log(`${packageName}: ${runtimeEntry}, ${typesEntry}`);
}

console.log(chalk.bold(chalk.blue("===== Building webpack smoke test: node-particle-editor =====")));

const webpackEntry = join(outputRoot, "nodeParticleEditorWebpackSmoke.ts");
const webpackOutput = join(outputRoot, "nodeParticleEditorWebpackSmoke.js");

writeFileSync(
    webpackEntry,
    `import { NodeParticleEditor } from "@babylonjs/node-particle-editor";\n` + `globalThis.__babylonNodeParticleEditorWebpackSmoke = NodeParticleEditor;\n`,
    "utf8"
);

const webpackStats = await new Promise((resolve, reject) => {
    webpack(
        {
            mode: "development",
            target: "web",
            devtool: false,
            context: outputRoot,
            entry: webpackEntry,
            output: {
                path: outputRoot,
                filename: "nodeParticleEditorWebpackSmoke.js",
            },
            resolve: {
                extensions: [".ts", ".js"],
            },
            optimization: {
                minimize: false,
            },
            performance: {
                hints: false,
            },
        },
        (error, stats) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stats);
        }
    );
});

const webpackInfo = webpackStats.toJson({ all: false, errors: true, warnings: true });
if (webpackStats.hasErrors()) {
    const errors = webpackInfo.errors.map((error) => error.message).join("\n\n");
    throw new Error(`The node-particle-editor webpack smoke test failed.\n${errors}`);
}

const webpackWarnings = webpackInfo.warnings.map((warning) => warning.message).join("\n\n");
for (const forbiddenRequest of ["@babylonjs/core::BABYLON.Debug", "@fortawesome/fontawesome-svg-core/package.json"]) {
    if (webpackWarnings.includes(forbiddenRequest)) {
        throw new Error(`The node-particle-editor webpack smoke test emitted a warning for ${forbiddenRequest}.`);
    }
}

const webpackBundle = readFileSync(webpackOutput, "utf8");
for (const forbiddenRequest of ["@babylonjs/core::BABYLON.Debug", "@fortawesome/fontawesome-svg-core/package.json"]) {
    if (webpackBundle.includes(forbiddenRequest)) {
        throw new Error(`The node-particle-editor webpack smoke test bundle still contains ${forbiddenRequest}.`);
    }
}

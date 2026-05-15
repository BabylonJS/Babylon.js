#!/usr/bin/env node
/* eslint-disable no-console */

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(SERVER_ROOT, "../../..");
const CONFIG_PATH = resolve(SERVER_ROOT, "declarationConfigDev.json");
const DRY_RUN = process.argv.includes("--dry-run");
const MIN_DECLARATION_SIZE_BYTES = 1024;

function camelize(value) {
    return value.replace(/-./g, (match) => match[1].toUpperCase());
}

function readDeclarationConfig() {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
}

const declarationConfig = readDeclarationConfig();
function declarationPath(entry) {
    return resolve(SERVER_ROOT, entry.outputDirectory, entry.filename);
}

function declarationSourceDirs(entry) {
    return entry.declarationLibs.map((lib) => resolve(REPO_ROOT, "packages", entry.sourceDirectoryOverrides?.[lib] ?? camelize(lib).replace(/@/g, ""), "dist"));
}

function hasDeclarationInputs(entry) {
    let hasInput = false;

    function visit(path) {
        if (hasInput || !existsSync(path)) {
            return;
        }

        const stat = statSync(path);
        if (stat.isDirectory()) {
            for (const child of readdirSync(path)) {
                visit(resolve(path, child));
                if (hasInput) {
                    return;
                }
            }
            return;
        }

        if (path.endsWith(".d.ts")) {
            hasInput = true;
        }
    }

    for (const sourceDir of declarationSourceDirs(entry)) {
        visit(sourceDir);
        if (hasInput) {
            return true;
        }
    }

    return hasInput;
}

function isDeclarationValid(entry) {
    const filename = declarationPath(entry);
    if (!existsSync(filename)) {
        return { valid: false, reason: "missing" };
    }

    const stat = statSync(filename);
    if (stat.size < MIN_DECLARATION_SIZE_BYTES) {
        return { valid: false, reason: `${stat.size} bytes` };
    }

    if (!hasDeclarationInputs(entry)) {
        return { valid: false, reason: "missing declaration inputs" };
    }

    return { valid: true, reason: "complete" };
}

function invalidDeclarations() {
    return declarationConfig.map((entry) => ({ entry, status: isDeclarationValid(entry) })).filter(({ status }) => !status.valid);
}

function run(command, args) {
    return new Promise((resolvePromise) => {
        const child = spawn(command, args, {
            cwd: REPO_ROOT,
            stdio: "inherit",
            shell: true,
        });

        child.on("close", (code) => {
            resolvePromise(code ?? 1);
        });
    });
}

const initialInvalidDeclarations = invalidDeclarations();

if (DRY_RUN) {
    if (initialInvalidDeclarations.length === 0) {
        console.log("✓ All Babylon server declaration files are complete.");
    } else {
        console.log(`⚡ Babylon server declaration files need rebuild (${initialInvalidDeclarations.length} missing or incomplete)...`);
        for (const { entry, status } of initialInvalidDeclarations) {
            console.log(`  → ${entry.filename} (${status.reason})`);
        }
        console.log("\nDry run only; declarations were not built.");
    }
    process.exit(0);
}

const declarationInputCode = await run("npx", [
    "tsc",
    "-b",
    "tsconfig.devpackages.json",
    "packages/tools/accessibility/tsconfig.build.json",
    "--emitDeclarationOnly",
    "--pretty",
    "false",
]);
if (declarationInputCode !== 0) {
    console.error(`\n✗ Babylon server declaration input build failed (exit ${declarationInputCode})`);
    process.exit(declarationInputCode);
}

const declarationsToBuild = invalidDeclarations();
if (declarationsToBuild.length > 0) {
    console.log(`⚡ Building Babylon server declaration files (${declarationsToBuild.length} missing or incomplete)...`);
    for (const { entry, status } of declarationsToBuild) {
        console.log(`  → ${entry.filename} (${status.reason})`);
    }
}

const buildCode = await run("npm", ["run", "build:declaration", "-w", "@tools/babylon-server"]);
if (buildCode !== 0) {
    console.error(`\n✗ Babylon server declaration build failed (exit ${buildCode})`);
    process.exit(buildCode);
}

const stillInvalid = invalidDeclarations();
if (stillInvalid.length > 0) {
    console.error("\n✗ Declaration build completed but some files are still missing or incomplete:");
    for (const { entry, status } of stillInvalid) {
        const filename = declarationPath(entry);
        const size = existsSync(filename) ? statSync(filename).size : 0;
        console.error(`  → ${entry.filename} (${status.reason}, ${size} bytes)`);
    }

    process.exit(1);
}

console.log("\n✓ Babylon server declaration files built successfully.");

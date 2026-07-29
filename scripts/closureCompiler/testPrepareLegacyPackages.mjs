import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const adapterPath = path.join(repoRoot, "scripts/closureCompiler/prepareLegacyPackages.mjs");
const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "bjs-legacy-closure-"));
const sourceDirectory = path.join(tempDirectory, "source");
const outputDirectory = path.join(tempDirectory, "prepared");
const externPath = path.join(tempDirectory, "babylon.externs.js");
const compiledPath = path.join(tempDirectory, "compiled.mjs");

function Run(command, args) {
    const result = spawnSync(command, args, {
        cwd: repoRoot,
        encoding: "utf8",
    });
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        process.stderr.write(result.stdout || "");
        process.stderr.write(result.stderr || "");
        throw new Error(`${command} exited with code ${result.status ?? 1}.`);
    }
    return result.stdout;
}

const legacySource = `
function __decorate(decorators, target, key, descriptor) {
    let result = descriptor === null ? Object.getOwnPropertyDescriptor(target, key) : descriptor;
    for (const decorator of decorators) {
        result = decorator(target, key, result) || result;
    }
    Object.defineProperty(target, key, result);
}

function requireDescriptor(_target, _key, descriptor) {
    if (!descriptor || typeof descriptor.value !== "function") {
        throw new Error("Closure removed a reflected method.");
    }
}

class LegacyClass {
    static reflectedMethod() {
        return 42;
    }
}
__decorate([requireDescriptor], LegacyClass, "reflectedMethod", null);

class SyntaxClass {
    constructor() {
        this._value = 7;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        this._value = value;
    }

    readOptional() {
        return this?.value;
    }
}

function defaultParameter(/** @type {number} */ value = 1) {
    return value;
}

let fallback;
({ fallback = 9 } = JSON.parse("{}"));
const syntax = new SyntaxClass();
syntax.value = 8;
const externalSchema = JSON.parse('{"version":2,"mipmaps":[1,2,3]}');
if (
    LegacyClass.reflectedMethod() !== 42 ||
    syntax.readOptional() !== 8 ||
    fallback !== 9 ||
    externalSchema.version !== 2 ||
    externalSchema.mipmaps.length !== 3 ||
    defaultParameter() !== 1
) {
    throw new Error("Prepared legacy package failed at runtime.");
}

if (typeof XRRay !== "undefined") {
    new XRRay();
}
`;
const privateFieldSource = `
export class PrivateFieldClass {
    #privateValue = 7;

    read() {
        return this.#privateValue;
    }
}
`;

try {
    fs.mkdirSync(sourceDirectory);
    fs.writeFileSync(path.join(sourceDirectory, "package.json"), '{"type":"module"}\n');
    fs.writeFileSync(path.join(sourceDirectory, "index.js"), legacySource);
    fs.writeFileSync(path.join(sourceDirectory, "private.js"), privateFieldSource);

    Run(process.execPath, [path.join(sourceDirectory, "index.js")]);
    Run(process.execPath, [adapterPath, "--source", sourceDirectory, "--output", outputDirectory, "--externs", externPath]);
    const preparedPrivateFieldSource = fs.readFileSync(path.join(outputDirectory, "private.js"), "utf8");
    if (!preparedPrivateFieldSource.includes("#privateValue") || preparedPrivateFieldSource.includes('["#privateValue"]')) {
        throw new Error("The legacy Closure adapter corrupted a private field.");
    }
    const secondRun = Run(process.execPath, [adapterPath, "--source", outputDirectory, "--in-place", "--externs", externPath]);
    if (!secondRun.includes("(0 patched)")) {
        throw new Error("The legacy Closure adapter is not idempotent.");
    }

    Run("npx", [
        "--yes",
        "google-closure-compiler@20240317.0.0",
        "--compilation_level",
        "ADVANCED",
        "--warning_level",
        "QUIET",
        "--language_in",
        "ECMASCRIPT_2021",
        "--language_out",
        "ECMASCRIPT_2021",
        "--externs",
        externPath,
        "--js",
        path.join(outputDirectory, "index.js"),
        "--js_output_file",
        compiledPath,
    ]);
    Run(process.execPath, [compiledPath]);
} finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
}

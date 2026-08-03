import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePackageRoot = path.join(repoRoot, "packages/public/@babylonjs");
const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "bjs-closure-packages-"));
const moduleRoot = tempDirectory;
const nodeModulesRoot = path.join(moduleRoot, "node_modules");
const entryName = `closurePackageTest-${process.pid}.mjs`;
const entryPath = path.join(moduleRoot, entryName);
const entryPoint = path.relative(moduleRoot, entryPath);
const typeEntryPath = path.join(moduleRoot, "closurePackageTypes.mts");
const outputPath = path.join(tempDirectory, "compiled.mjs");
const flagFilePath = path.join(tempDirectory, "compiler.flags");
const compilerPackage = "google-closure-compiler@20240317.0.0";
const typeScriptPath = path.join(repoRoot, "node_modules/typescript/bin/tsc");

const fixture = `
import "@babylonjs/core-closure/index.js";
import "@babylonjs/gui-closure/index.js";
import "@babylonjs/loaders-closure/index.js";
import "@babylonjs/serializers-closure/index.js";
import { Light } from "@babylonjs/core-closure/Lights/light.js";
import { GetEnvInfo } from "@babylonjs/core-closure/Misc/environmentTextureTools.pure.js";

let sortCount = 0;
const scene = {
    requireLightSorting: false,
    sortLightsByPriority() {
        sortCount++;
    },
};
const light = Object.create(Light.prototype);
light._scene = scene;
light.renderPriority = 1;

if (light.renderPriority !== 1 || sortCount !== 1 || !scene.requireLightSorting) {
    throw new Error("Babylon.js reflected properties failed after Closure Compiler property renaming.");
}

const manifest = JSON.stringify({
    version: 2,
    width: 16,
    irradiance: null,
    specular: {
        lodGenerationScale: 0.75,
        mipmaps: [],
    },
    imageType: "image/png",
});
const encodedManifest = new TextEncoder().encode(manifest);
const data = new Uint8Array(8 + encodedManifest.length + 1);
data.set([0x86, 0x16, 0x87, 0x96, 0xf6, 0xd6, 0x96, 0x36]);
data.set(encodedManifest, 8);
const info = GetEnvInfo(data);

if (
    !info ||
    info.version !== 2 ||
    info.width !== 16 ||
    info.imageType !== "image/png" ||
    info.specular.lodGenerationScale !== 0.75 ||
    info.binaryDataPosition !== data.length
) {
    throw new Error("Babylon.js external environment schema failed after Closure Compiler property renaming.");
}
`;

const typeFixture = `
import { Engine } from "@babylonjs/core-closure";
import { ThinEngine } from "@babylonjs/core-closure/Engines/thinEngine.js";
import { AdvancedDynamicTexture } from "@babylonjs/gui-closure";
import { GLTFFileLoader } from "@babylonjs/loaders-closure";
import { GLTF2Export } from "@babylonjs/serializers-closure";

export type ClosurePackageExports = [Engine, ThinEngine, AdvancedDynamicTexture, GLTFFileLoader, typeof GLTF2Export];
`;

function resolveImport(fromFile, specifier) {
    let resolvedPath;
    if (specifier.startsWith(".")) {
        resolvedPath = path.resolve(path.dirname(fromFile), specifier);
    } else if (specifier.startsWith("@babylonjs/")) {
        resolvedPath = path.join(nodeModulesRoot, specifier);
    } else {
        throw new Error(`Unsupported external module in Closure package test: ${specifier}`);
    }

    if (!path.extname(resolvedPath)) {
        resolvedPath = path.join(resolvedPath, "index.js");
    }
    return resolvedPath;
}

function collectDependencies(entryFile) {
    const files = new Set();

    function visit(filePath) {
        const resolvedFilePath = path.resolve(filePath);
        if (files.has(resolvedFilePath)) {
            return;
        }
        if (!fs.existsSync(resolvedFilePath)) {
            throw new Error(`Closure package test dependency does not exist: ${resolvedFilePath}`);
        }

        files.add(resolvedFilePath);
        const sourceText = fs.readFileSync(resolvedFilePath, "utf8");
        const sourceFile = ts.createSourceFile(resolvedFilePath, sourceText, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS);
        const specifiers = [];

        function collectSpecifiers(node) {
            if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                specifiers.push(node.moduleSpecifier.text);
            } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
                specifiers.push(node.arguments[0].text);
            }
            ts.forEachChild(node, collectSpecifiers);
        }

        collectSpecifiers(sourceFile);
        for (const specifier of specifiers) {
            visit(resolveImport(resolvedFilePath, specifier));
        }
    }

    visit(entryFile);
    return [...files];
}

function collectPackageJavaScriptFiles() {
    const files = [];

    function visit(packageDirectory, directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                visit(packageDirectory, entryPath);
            } else if (entry.name.endsWith(".js") && !path.relative(packageDirectory, entryPath).split(path.sep).includes("assets")) {
                files.push(entryPath);
            }
        }
    }

    for (const packageName of ["core", "gui", "loaders", "serializers"]) {
        const packageDirectory = path.join(nodeModulesRoot, "@babylonjs", `${packageName}-closure`);
        visit(packageDirectory, packageDirectory);
    }
    return files;
}

function run(command, args) {
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
}

try {
    const scopeDirectory = path.join(nodeModulesRoot, "@babylonjs");
    fs.mkdirSync(scopeDirectory, { recursive: true });
    for (const packageName of ["core", "gui", "loaders", "serializers"]) {
        fs.symlinkSync(path.join(sourcePackageRoot, `${packageName}-closure`), path.join(scopeDirectory, `${packageName}-closure`), "dir");
    }
    fs.writeFileSync(entryPath, fixture);
    fs.writeFileSync(typeEntryPath, typeFixture);
    run(process.execPath, [
        typeScriptPath,
        "--ignoreConfig",
        "--noEmit",
        "--skipLibCheck",
        "--module",
        "NodeNext",
        "--moduleResolution",
        "NodeNext",
        "--target",
        "ES2021",
        typeEntryPath,
    ]);
    const inputs = [...new Set([...collectDependencies(entryPath), ...collectPackageJavaScriptFiles()])];
    const compilerFlags = [
        "--compilation_level=ADVANCED",
        "--warning_level=QUIET",
        "--language_in=ECMASCRIPT_2021",
        "--language_out=ECMASCRIPT_2021",
        "--dependency_mode=PRUNE",
        `--entry_point=${entryPoint}`,
        "--module_resolution=NODE",
        `--js_module_root=${moduleRoot}`,
        ...inputs.map((filePath) => `--js=${filePath}`),
        `--js_output_file=${outputPath}`,
    ];
    fs.writeFileSync(flagFilePath, compilerFlags.join("\n"));

    if (process.env.CLOSURE_COMPILER_JAR) {
        run("java", ["-jar", process.env.CLOSURE_COMPILER_JAR, "--flagfile", flagFilePath]);
    } else {
        run("npx", ["--yes", compilerPackage, "--flagfile", flagFilePath]);
    }
    run(process.execPath, [outputPath]);

    process.stdout.write(`Closure Compiler validated ${inputs.length} inputs from all four Closure packages and executed the compiled bundle.\n`);
} finally {
    fs.rmSync(entryPath, { force: true });
    fs.rmSync(tempDirectory, { recursive: true, force: true });
}

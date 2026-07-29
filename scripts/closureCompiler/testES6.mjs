import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const packageRoot = path.join(repoRoot, "packages/public/@babylonjs");
const fixturePath = path.join(repoRoot, "scripts/closureCompiler/es6SmokeTest.js");
const entryName = `closureSmokeTest-${process.pid}.js`;
const entryPath = path.join(packageRoot, entryName);
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bjs-closure-compiler-"));
const outputPath = path.join(tempDir, "compiled.js");

function ResolveImport(fromFile, specifier) {
    let resolvedPath;
    if (specifier.startsWith(".")) {
        resolvedPath = path.resolve(path.dirname(fromFile), specifier);
    } else if (specifier.startsWith("core/")) {
        resolvedPath = path.join(packageRoot, specifier);
    } else {
        throw new Error(`Unsupported external module in Closure smoke test: ${specifier}`);
    }

    if (!path.extname(resolvedPath)) {
        resolvedPath += ".js";
    }
    return resolvedPath;
}

function CollectDependencies(entryFile) {
    const files = new Set();

    const visit = (filePath) => {
        const resolvedFilePath = path.resolve(filePath);
        if (files.has(resolvedFilePath)) {
            return;
        }
        if (!fs.existsSync(resolvedFilePath)) {
            throw new Error(`Closure smoke test dependency does not exist: ${resolvedFilePath}`);
        }

        files.add(resolvedFilePath);
        const sourceText = fs.readFileSync(resolvedFilePath, "utf8");
        const sourceFile = ts.createSourceFile(resolvedFilePath, sourceText, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS);
        const specifiers = [];

        const collectSpecifiers = (node) => {
            if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                specifiers.push(node.moduleSpecifier.text);
            } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
                specifiers.push(node.arguments[0].text);
            }

            ts.forEachChild(node, collectSpecifiers);
        };
        collectSpecifiers(sourceFile);

        for (const specifier of specifiers) {
            visit(ResolveImport(resolvedFilePath, specifier));
        }
    };

    visit(entryFile);
    return [...files];
}

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
}

try {
    fs.copyFileSync(fixturePath, entryPath);
    Run(process.execPath, [entryPath]);
    const inputs = CollectDependencies(entryPath);
    const compilerArguments = [
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
        "--dependency_mode",
        "PRUNE",
        "--entry_point",
        entryName,
        "--module_resolution",
        "NODE",
        "--js_module_root",
        packageRoot,
        ...inputs.flatMap((filePath) => ["--js", filePath]),
        "--js_output_file",
        outputPath,
    ];

    Run("npx", compilerArguments);
    Run(process.execPath, [outputPath]);
} finally {
    fs.rmSync(entryPath, { force: true });
    fs.rmSync(tempDir, { recursive: true, force: true });
}

#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Checks that side-effect-free core files do not statically pull in files with
 * module-level side effects.
 *
 * The side-effects manifest lists files that have module-level side effects.
 * Every other source file is part of the side-effect-free import surface used by
 * pure barrels and public package metadata, so value imports from manifest-listed
 * files would reintroduce side effects through a supposedly pure path.
 *
 * Current historical violations are tracked in a baseline. New violations fail
 * the check, and resolved baseline entries must be removed with
 * `--update-baseline`.
 */

import ts from "typescript";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { readSideEffectsManifest } from "./sideEffectsManifest.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");
const CORE_SRC = join(REPO_ROOT, "packages/dev/core/src");
const MANIFEST_PATH = join(__dirname, "side-effects-manifest/core");
const BASELINE_PATH = join(__dirname, "side-effect-import-closure-baseline.json");

const args = process.argv.slice(2);
const updateBaseline = args.includes("--update-baseline");
const verbose = args.includes("--verbose");

function toPosixPath(filePath) {
    return filePath.split(/[/\\]+/).join("/");
}

function compareCodePoint(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

function compareViolations(a, b) {
    return compareCodePoint(violationKey(a), violationKey(b));
}

function violationKey(violation) {
    return `${violation.importer}\0${violation.kind}\0${violation.source}\0${violation.target}`;
}

function formatViolation(violation) {
    return `${violation.importer}:${violation.line} ${violation.kind} ${JSON.stringify(violation.source)} -> ${violation.target}`;
}

function statSyncNoThrow(filePath) {
    try {
        return statSync(filePath);
    } catch {
        return undefined;
    }
}

function isGeneratedShaderPath(relPath) {
    return relPath.startsWith("Shaders/") || relPath.startsWith("ShadersWGSL/");
}

function isStaleGeneratedShader(filePath) {
    const relPath = toPosixPath(relative(CORE_SRC, filePath));
    if (!isGeneratedShaderPath(relPath)) {
        return false;
    }

    const sourcePath = filePath.replace(/\.ts$/, "");
    return !statSyncNoThrow(`${sourcePath}.fx`)?.isFile() && !statSyncNoThrow(`${sourcePath}.wgsl`)?.isFile();
}

function collectTsFiles(dir, results = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            collectTsFiles(fullPath, results);
        } else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts") && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".spec.ts")) {
            if (!isStaleGeneratedShader(fullPath)) {
                results.push(fullPath);
            }
        }
    }
    return results;
}

const allFiles = collectTsFiles(CORE_SRC).sort(compareCodePoint);
const allRelFiles = new Set(allFiles.map((filePath) => toPosixPath(relative(CORE_SRC, filePath))));
const manifestSideEffectFiles = readSideEffectsManifest(MANIFEST_PATH).manifest.map((entry) => toPosixPath(entry.file));
const sideEffectFiles = new Set(manifestSideEffectFiles);
for (const file of allRelFiles) {
    if (file.endsWith("/index.ts") || file === "index.ts") {
        sideEffectFiles.add(file);
    }
}

function resolveImport(importer, source) {
    let rel;
    if (source.startsWith(".")) {
        rel = toPosixPath(relative(CORE_SRC, resolve(dirname(join(CORE_SRC, importer)), source)));
    } else if (source === "core") {
        rel = "index";
    } else if (source.startsWith("core/")) {
        rel = source.substring("core/".length);
    } else {
        return null;
    }

    rel = rel.replace(/\.(?:js|mjs|ts|tsx)$/, "");
    for (const candidate of [`${rel}.ts`, `${rel}.tsx`, `${rel}/index.ts`]) {
        if (allRelFiles.has(candidate) || sideEffectFiles.has(candidate)) {
            return candidate;
        }
    }
    return null;
}

function hasValueImport(importDeclaration) {
    const importClause = importDeclaration.importClause;
    if (!importClause) {
        return true;
    }
    if (importClause.isTypeOnly) {
        return false;
    }
    if (importClause.name) {
        return true;
    }
    const namedBindings = importClause.namedBindings;
    if (!namedBindings) {
        return false;
    }
    if (ts.isNamespaceImport(namedBindings)) {
        return true;
    }
    return namedBindings.elements.some((element) => !element.isTypeOnly);
}

function hasValueExport(exportDeclaration) {
    if (exportDeclaration.isTypeOnly) {
        return false;
    }
    const exportClause = exportDeclaration.exportClause;
    if (!exportClause) {
        return true;
    }
    if (ts.isNamespaceExport(exportClause)) {
        return true;
    }
    return exportClause.elements.some((element) => !element.isTypeOnly);
}

function addViolation(violations, sourceFile, importer, kind, source, target, node) {
    violations.push({
        importer,
        kind,
        source,
        target,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
    });
}

function findViolations(filePath) {
    const importer = toPosixPath(relative(CORE_SRC, filePath));
    if (sideEffectFiles.has(importer)) {
        return [];
    }

    const sourceText = readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const violations = [];

    for (const statement of sourceFile.statements) {
        if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && hasValueImport(statement)) {
            const source = statement.moduleSpecifier.text;
            const target = resolveImport(importer, source);
            if (target && sideEffectFiles.has(target)) {
                addViolation(violations, sourceFile, importer, "imports", source, target, statement);
            }
        } else if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier) && hasValueExport(statement)) {
            const source = statement.moduleSpecifier.text;
            const target = resolveImport(importer, source);
            if (target && sideEffectFiles.has(target)) {
                addViolation(violations, sourceFile, importer, "exports", source, target, statement);
            }
        }
    }

    return violations;
}

function readBaseline() {
    if (!existsSync(BASELINE_PATH)) {
        return [];
    }
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
    return baseline.violations ?? [];
}

function writeBaseline(violations) {
    const baseline = {
        version: 1,
        description: "Known direct static imports/re-exports from manifest side-effect-free core files to manifest side-effectful core files.",
        violations: violations.map(({ importer, kind, source, target }) => ({ importer, kind, source, target })).sort(compareViolations),
    };
    writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 4)}\n`);
}

const actualViolations = allFiles.flatMap(findViolations).sort(compareViolations);

if (updateBaseline) {
    writeBaseline(actualViolations);
    console.log(`Updated ${toPosixPath(relative(REPO_ROOT, BASELINE_PATH))} with ${actualViolations.length} violation(s).`);
    process.exit(0);
}

const baselineViolations = readBaseline().sort(compareViolations);
const actualByKey = new Map(actualViolations.map((violation) => [violationKey(violation), violation]));
const baselineByKey = new Map(baselineViolations.map((violation) => [violationKey(violation), violation]));

const newViolations = actualViolations.filter((violation) => !baselineByKey.has(violationKey(violation)));
const resolvedBaselineViolations = baselineViolations.filter((violation) => !actualByKey.has(violationKey(violation)));

if (newViolations.length === 0 && resolvedBaselineViolations.length === 0) {
    console.log(`✅ Side-effect import closure matches baseline (${actualViolations.length} known violation(s)).`);
    process.exit(0);
}

if (newViolations.length > 0) {
    console.error(`❌ Found ${newViolations.length} new side-effect import closure violation(s):`);
    for (const violation of newViolations.slice(0, 50)) {
        console.error(`  ${formatViolation(violation)}`);
    }
    if (newViolations.length > 50) {
        console.error(`  ...and ${newViolations.length - 50} more.`);
    }
}

if (resolvedBaselineViolations.length > 0) {
    console.error(`❌ Found ${resolvedBaselineViolations.length} resolved baseline violation(s). Run with --update-baseline after reviewing the cleanup:`);
    for (const violation of resolvedBaselineViolations.slice(0, 50)) {
        console.error(`  ${violation.importer} ${violation.kind} ${JSON.stringify(violation.source)} -> ${violation.target}`);
    }
    if (resolvedBaselineViolations.length > 50) {
        console.error(`  ...and ${resolvedBaselineViolations.length - 50} more.`);
    }
}

if (verbose) {
    console.error(`Checked ${allFiles.length} core TypeScript source file(s).`);
}

console.error("\nTo accept the current reviewed state, run:");
console.error("  node scripts/treeshaking/checkSideEffectImportClosure.mjs --update-baseline");
process.exit(1);

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
 * Files whose only manifest side effect is a `declare module` augmentation are
 * excluded (commonly `.types.ts` files, but any module whose sole side effect is
 * a `declare module` block): such a block is a TypeScript type-level augmentation
 * that erases to an empty module, so importing or re-exporting it carries no
 * runtime cost and cannot reintroduce side effects.
 *
 * Any violation fails the check. There is intentionally no baseline/allow-list
 * mechanism: a side-effect-free file must never statically value-import or
 * re-export a side-effectful file. Fix violations by importing the dependency's
 * `.pure` module or by splitting the importer, never by suppressing the check.
 */

import ts from "typescript";
import { readFileSync, readdirSync, statSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { readSideEffectsManifest } from "./sideEffectsManifest.mjs";
import { getPackageConfig, resolvePackageFromArgv } from "./packageConfig.mjs";

const PACKAGE = resolvePackageFromArgv();
const PACKAGE_CONFIG = getPackageConfig(PACKAGE);
const CORE_SRC = PACKAGE_CONFIG.srcRoot;
const MANIFEST_PATH = PACKAGE_CONFIG.manifestDir;

const args = process.argv.slice(2);
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

function isPureBarrelPath(relPath) {
    return relPath === "pure.ts" || relPath.endsWith("/pure.ts");
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
// A `declare module` augmentation is type-only and erases at runtime, so files whose only
// side effect is `declare-module` are not real side-effect targets for the closure check.
const manifestSideEffectFiles = readSideEffectsManifest(MANIFEST_PATH)
    .manifest.filter((entry) => entry.sideEffects.some((sideEffect) => sideEffect.type !== "declare-module"))
    .map((entry) => toPosixPath(entry.file));
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
    if (namedBindings.elements.length === 0) {
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
    if (exportClause.elements.length === 0) {
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

const actualViolations = allFiles.flatMap(findViolations).sort(compareViolations);

const pureBarrelViolations = actualViolations.filter((violation) => isPureBarrelPath(violation.importer));
const otherViolations = actualViolations.filter((violation) => !isPureBarrelPath(violation.importer));

if (actualViolations.length === 0) {
    console.log("✅ Side-effect import closure clean (0 violations).");
    process.exit(0);
}

if (pureBarrelViolations.length > 0) {
    console.error(`❌ Found ${pureBarrelViolations.length} pure barrel side-effect import closure violation(s):`);
    console.error("  Pure barrels may never import or re-export side-effectful files.");
    for (const violation of pureBarrelViolations.slice(0, 50)) {
        console.error(`  ${formatViolation(violation)}`);
    }
    if (pureBarrelViolations.length > 50) {
        console.error(`  ...and ${pureBarrelViolations.length - 50} more.`);
    }
}

if (otherViolations.length > 0) {
    console.error(`❌ Found ${otherViolations.length} side-effect import closure violation(s):`);
    for (const violation of otherViolations.slice(0, 50)) {
        console.error(`  ${formatViolation(violation)}`);
    }
    if (otherViolations.length > 50) {
        console.error(`  ...and ${otherViolations.length - 50} more.`);
    }
}

if (verbose) {
    console.error(`Checked ${allFiles.length} core TypeScript source file(s).`);
}

console.error("\nA side-effect-free file must not statically value-import or re-export a side-effectful file.");
console.error("Fix each violation by importing the dependency's `.pure` module, or by splitting the importer.");
console.error("Suppressing the check with a baseline/allow-list is not permitted.");
process.exit(1);

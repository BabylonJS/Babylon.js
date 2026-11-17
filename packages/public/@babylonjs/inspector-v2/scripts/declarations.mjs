import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const sharedPackages = ["shared-ui-components", "@babylonjs/shared-ui-components"];

function declarationFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(directory, entry.name);
        return entry.isDirectory() ? declarationFiles(file) : entry.name.endsWith(".d.ts") ? [file] : [];
    });
}

function moduleSpecifiers(file, text) {
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const specifiers = [];
    function visit(node) {
        if (((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) || (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name))) {
            const specifier = ts.isModuleDeclaration(node) ? node.name : node.moduleSpecifier;
            if (ts.isStringLiteral(specifier)) {
                specifiers.push({ value: specifier.text, start: specifier.getStart(source) + 1, end: specifier.getEnd() - 1 });
            }
        } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
            const specifier = node.argument.literal;
            specifiers.push({ value: specifier.text, start: specifier.getStart(source) + 1, end: specifier.getEnd() - 1 });
        }
        ts.forEachChild(node, visit);
    }
    visit(source);
    return specifiers;
}

function sharedSubpath(specifier) {
    const prefix = sharedPackages.find((name) => specifier === name || specifier.startsWith(`${name}/`));
    return prefix === undefined ? undefined : specifier.slice(prefix.length + 1);
}

function resolveDeclaration(directory, specifier) {
    const target = path.resolve(directory, specifier.replace(/\.js$/, ""));
    const result = [`${target}.d.ts`, path.join(target, "index.d.ts")].find(existsSync);
    if (!result) {
        throw new Error(`Missing declaration for "${specifier}" from ${directory}`);
    }
    return result;
}

function relativeModule(file, target) {
    const relative = path
        .relative(path.dirname(file), target)
        .split(path.sep)
        .join("/")
        .replace(/\.d\.ts$/, ".js");
    return relative.startsWith(".") ? relative : `./${relative}`;
}

/**
 * Keep shared UI private without bundling declarations or duplicating full/Lite service identities.
 */
export function packageDeclarations(lib, shared) {
    const localShared = path.join(lib, "shared-ui-components");
    const pending = declarationFiles(lib)
        .filter((file) => !file.startsWith(`${localShared}${path.sep}`))
        .map((file) => ({ source: file, output: file }));
    const visited = new Set();
    for (const { source, output } of pending) {
        if (visited.has(output)) {
            continue;
        }
        visited.add(output);
        let text = readFileSync(source, "utf8");
        const inShared = source !== output;
        for (const specifier of moduleSpecifiers(source, text).reverse()) {
            const subpath = sharedSubpath(specifier.value);
            if (subpath === undefined && !(inShared && specifier.value.startsWith("."))) {
                continue;
            }
            const target = resolveDeclaration(subpath === undefined ? path.dirname(source) : shared, subpath === undefined ? specifier.value : subpath || ".");
            const sharedRelative = path.relative(shared, target);
            if (sharedRelative.startsWith(`..${path.sep}`) || path.isAbsolute(sharedRelative)) {
                throw new Error(`Shared UI declaration escapes its package: ${target}`);
            }
            const localTarget = path.join(localShared, sharedRelative);
            pending.push({ source: target, output: localTarget });
            text = text.slice(0, specifier.start) + relativeModule(output, localTarget) + text.slice(specifier.end);
        }
        mkdirSync(path.dirname(output), { recursive: true });
        writeFileSync(output, text);
    }
}

export function checkDeclarations(lib) {
    for (const entry of ["index", "lite/index"]) {
        resolveDeclaration(lib, entry);
    }
    for (const file of declarationFiles(lib)) {
        for (const { value } of moduleSpecifiers(file, readFileSync(file, "utf8"))) {
            if (sharedSubpath(value) !== undefined) {
                throw new Error(`Shared UI package reference "${value}" in ${file}`);
            }
            if (value.startsWith(".")) {
                resolveDeclaration(path.dirname(file), value);
            }
        }
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const packageRoot = fileURLToPath(new URL("../", import.meta.url));
    const lib = path.join(packageRoot, "lib");
    if (process.argv[2] === "--check") {
        checkDeclarations(lib);
    } else if (process.argv.length === 2) {
        packageDeclarations(lib, path.resolve(packageRoot, "../../../dev/sharedUiComponents/dist"));
    } else {
        throw new Error(`Unknown declaration command: ${process.argv.slice(2).join(" ")}`);
    }
}

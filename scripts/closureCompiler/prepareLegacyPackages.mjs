import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(path.join(process.cwd(), "package.json"));
let ts;
try {
    ts = require("typescript");
} catch {
    throw new Error("This script requires TypeScript. Install it with: npm install --no-save typescript");
}
const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function printUsage() {
    console.log(`Usage:
  node prepareLegacyPackages.mjs --source <package-root> (--output <directory> | --in-place) [--externs <file>]

Examples:
  node prepareLegacyPackages.mjs --source node_modules/@babylonjs --output .closure/node_modules/@babylonjs
  node prepareLegacyPackages.mjs --source node_modules/@babylonjs/core --in-place --externs babylon-closure.externs.js

The output directory must not already exist. In-place mode is idempotent but modifies installed package files.
Pass the generated extern file to Closure. Output mode also requires resolving @babylonjs imports from the output directory.
This compatibility mode intentionally disables property renaming and dead-property removal for Babylon.js.`);
}

function parseArguments(argv) {
    const options = {
        source: path.resolve("node_modules/@babylonjs"),
        externs: path.resolve("babylon-closure.externs.js"),
        inPlace: false,
    };

    for (let index = 0; index < argv.length; index++) {
        const argument = argv[index];
        if (argument === "--source") {
            options.source = path.resolve(argv[++index]);
        } else if (argument === "--output") {
            options.output = path.resolve(argv[++index]);
        } else if (argument === "--externs") {
            options.externs = path.resolve(argv[++index]);
        } else if (argument === "--in-place") {
            options.inPlace = true;
        } else if (argument === "--help" || argument === "-h") {
            printUsage();
            process.exit(0);
        } else {
            throw new Error(`Unknown argument: ${argument}`);
        }
    }

    if (!fs.existsSync(options.source) || !fs.statSync(options.source).isDirectory()) {
        throw new Error(`Package root does not exist: ${options.source}`);
    }
    if (options.inPlace === Boolean(options.output)) {
        throw new Error("Choose exactly one of --output or --in-place.");
    }
    if (options.output && fs.existsSync(options.output)) {
        throw new Error(`Output directory already exists: ${options.output}`);
    }
    if (options.output && (options.output === options.source || options.output.startsWith(`${options.source}${path.sep}`))) {
        throw new Error("The output directory must not be inside the source package root.");
    }

    return options;
}

function walkJavaScriptFiles(directory) {
    const files = [];
    const pendingDirectories = [directory];

    while (pendingDirectories.length > 0) {
        const currentDirectory = pendingDirectories.pop();
        for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
            const entryPath = path.join(currentDirectory, entry.name);
            if (entry.isDirectory() || (entry.isSymbolicLink() && fs.statSync(entryPath).isDirectory())) {
                pendingDirectories.push(entryPath);
            } else if (entry.isFile() && entry.name.endsWith(".js")) {
                files.push(entryPath);
            }
        }
    }

    return files.sort();
}

function getLiteralPropertyName(node) {
    if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node) || ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) {
        return node.text;
    }
    return undefined;
}

function collectPropertyNames(sourceFile, propertyNames) {
    function visit(node) {
        if (ts.isPropertyAccessExpression(node) && !ts.isPrivateIdentifier(node.name)) {
            propertyNames.add(node.name.text);
        } else if (ts.isElementAccessExpression(node) && node.argumentExpression && ts.isStringLiteralLike(node.argumentExpression)) {
            propertyNames.add(node.argumentExpression.text);
        } else if (
            ts.isPropertyAssignment(node) ||
            ts.isShorthandPropertyAssignment(node) ||
            ts.isMethodDeclaration(node) ||
            ts.isGetAccessorDeclaration(node) ||
            ts.isSetAccessorDeclaration(node) ||
            ts.isPropertyDeclaration(node) ||
            ts.isEnumMember(node)
        ) {
            const name = getLiteralPropertyName(node.name);
            if (name !== undefined) {
                propertyNames.add(name);
            }
        } else if (ts.isBindingElement(node) && node.propertyName) {
            const name = getLiteralPropertyName(node.propertyName);
            if (name !== undefined) {
                propertyNames.add(name);
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
}

function addEdit(edits, node, replacement) {
    const start = node.getStart();
    const end = node.getEnd();
    if (!edits.some((edit) => edit.start === start && edit.end === end)) {
        edits.push({ start, end, replacement });
    }
}

function collectClosureEdits(sourceFile, sourceText) {
    const edits = [];
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, sourceText);
    let token = scanner.scan();
    while (token !== ts.SyntaxKind.EndOfFileToken) {
        if (token === ts.SyntaxKind.MultiLineCommentTrivia) {
            const comment = scanner.getTokenText();
            if (comment.startsWith("/**") && !/@(?:license|preserve|copyright)\b/i.test(comment)) {
                edits.push({ start: scanner.getTokenPos(), end: scanner.getTextPos(), replacement: "" });
            }
        }
        token = scanner.scan();
    }

    function quotePropertyName(name) {
        if (ts.isIdentifier(name)) {
            addEdit(edits, name, JSON.stringify(name.text));
        }
    }

    function visit(node) {
        if (ts.isPropertyAccessExpression(node) && !ts.isPrivateIdentifier(node.name)) {
            const replacement = `${node.questionDotToken ? "?." : ""}[${JSON.stringify(node.name.text)}]`;
            addEdit(edits, { getStart: () => node.expression.end, getEnd: () => node.end }, replacement);
        } else if (ts.isShorthandPropertyAssignment(node)) {
            const initializer = node.objectAssignmentInitializer ? ` = ${node.objectAssignmentInitializer.getText(sourceFile)}` : "";
            addEdit(edits, node, `${JSON.stringify(node.name.text)}: ${node.name.text}${initializer}`);
        } else if (ts.isPropertyAssignment(node)) {
            quotePropertyName(node.name);
        } else if (ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node) || ts.isPropertyDeclaration(node)) {
            quotePropertyName(node.name);
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return edits.filter(
        (edit) => !edits.some((other) => other !== edit && other.start <= edit.start && other.end >= edit.end && (other.start < edit.start || other.end > edit.end))
    );
}

function patchFile(filePath, sourceText, edits) {
    if (edits.length === 0) {
        return false;
    }

    let output = sourceText;
    for (const edit of edits.sort((left, right) => right.start - left.start)) {
        output = output.slice(0, edit.start) + edit.replacement + output.slice(edit.end);
    }
    output = output.replace(/\n?\/\/# sourceMappingURL=.*?(?:\r?\n|$)/g, "\n");
    fs.writeFileSync(filePath, output);
    return true;
}

function isIdentifierReference(node) {
    const parent = node.parent;
    if (!parent) {
        return false;
    }
    if (
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyAssignment(parent) && parent.name === node) ||
        (ts.isMethodDeclaration(parent) && parent.name === node) ||
        (ts.isGetAccessorDeclaration(parent) && parent.name === node) ||
        (ts.isSetAccessorDeclaration(parent) && parent.name === node) ||
        (ts.isPropertyDeclaration(parent) && parent.name === node) ||
        (ts.isEnumMember(parent) && parent.name === node) ||
        (ts.isBindingElement(parent) && (parent.name === node || parent.propertyName === node)) ||
        (ts.isVariableDeclaration(parent) && parent.name === node) ||
        (ts.isParameter(parent) && parent.name === node) ||
        ((ts.isFunctionDeclaration(parent) || ts.isFunctionExpression(parent) || ts.isClassDeclaration(parent) || ts.isClassExpression(parent)) && parent.name === node) ||
        ts.isImportClause(parent) ||
        ts.isImportSpecifier(parent) ||
        ts.isNamespaceImport(parent) ||
        ts.isExportSpecifier(parent) ||
        ts.isLabeledStatement(parent) ||
        ((ts.isBreakStatement(parent) || ts.isContinueStatement(parent)) && parent.label === node)
    ) {
        return false;
    }
    return true;
}

function collectRuntimeGlobals(files, packageRoot) {
    const fileSet = new Set(files);
    const program = ts.createProgram({
        rootNames: files,
        options: {
            allowJs: true,
            checkJs: false,
            lib: ["lib.es2021.d.ts"],
            module: ts.ModuleKind.NodeNext,
            moduleResolution: ts.ModuleResolutionKind.NodeNext,
            noEmit: true,
            skipLibCheck: true,
            target: ts.ScriptTarget.ES2021,
            types: [],
        },
    });
    const checker = program.getTypeChecker();
    const globalNames = new Set();

    for (const sourceFile of program.getSourceFiles()) {
        if (!fileSet.has(sourceFile.fileName)) {
            continue;
        }

        function visit(node) {
            if (ts.isIdentifier(node) && identifierPattern.test(node.text) && isIdentifierReference(node)) {
                const symbol = checker.getSymbolAtLocation(node);
                const isPackageAmbient =
                    symbol?.declarations?.length > 0 &&
                    symbol.declarations.every((declaration) => {
                        const declarationFile = declaration.getSourceFile();
                        return declarationFile.isDeclarationFile && declarationFile.fileName.startsWith(packageRoot);
                    });
                if (!symbol || isPackageAmbient) {
                    globalNames.add(node.text);
                }
            }
            ts.forEachChild(node, visit);
        }
        visit(sourceFile);
    }

    globalNames.delete("undefined");
    return globalNames;
}

function writeExterns(externPath, propertyNames, globalNames) {
    const properties = [...propertyNames].filter((name) => identifierPattern.test(name)).sort();
    const globals = [...globalNames].filter((name) => identifierPattern.test(name)).sort();
    const lines = ["/** @externs */", "", ...globals.flatMap((name) => ["/** @type {?} */", `var ${name};`]), "", ...properties.map((name) => `Object.prototype.${name};`), ""];

    fs.mkdirSync(path.dirname(externPath), { recursive: true });
    fs.writeFileSync(externPath, lines.join("\n"));
    return { properties: properties.length, globals: globals.length };
}

function main() {
    const options = parseArguments(process.argv.slice(2));
    const packageRoot = options.inPlace ? options.source : options.output;
    if (!options.inPlace) {
        fs.mkdirSync(path.dirname(options.output), { recursive: true });
        fs.cpSync(options.source, options.output, { recursive: true, dereference: true });
    }

    const files = walkJavaScriptFiles(packageRoot);
    const propertyNames = new Set();
    let patchedFiles = 0;

    for (const filePath of files) {
        const sourceText = fs.readFileSync(filePath, "utf8");
        const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
        collectPropertyNames(sourceFile, propertyNames);
        const edits = collectClosureEdits(sourceFile, sourceText);
        if (patchFile(filePath, sourceText, edits)) {
            patchedFiles++;
        }
    }

    const allFiles = walkJavaScriptFiles(packageRoot);
    const runtimeGlobals = collectRuntimeGlobals(allFiles, packageRoot);
    const externCounts = writeExterns(options.externs, propertyNames, runtimeGlobals);

    console.log(`Prepared ${files.length} JavaScript files (${patchedFiles} patched).`);
    console.log(`Wrote ${externCounts.properties} property externs and ${externCounts.globals} runtime globals to ${options.externs}.`);
}

main();

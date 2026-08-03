import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const packageRoot = path.join(repoRoot, "packages/public/@babylonjs");
const externFileName = "closure.externs.js";
const supportedPackages = ["core", "gui", "loaders", "serializers"];
const packageAliases = new Map(supportedPackages.map((packageName) => [`@babylonjs/${packageName}`, `@babylonjs/${packageName}-closure`]));
const preservedFiles = new Set(["package.json", "readme.md", "license.md", "NOTICE.md"]);
const copiedFileSuffixes = [".js", ".d.ts", ".d.mts", ".wasm", ".license"];

function parseArguments(argv) {
    const options = {
        check: false,
        packages: [],
    };

    for (let index = 0; index < argv.length; index++) {
        const argument = argv[index];
        if (argument === "--check") {
            options.check = true;
        } else if (argument === "--package") {
            const packageName = argv[++index];
            if (!supportedPackages.includes(packageName)) {
                throw new Error(`Unsupported Closure package: ${packageName}`);
            }
            options.packages.push(packageName);
        } else {
            throw new Error(`Unknown argument: ${argument}`);
        }
    }

    if (options.packages.length === 0) {
        options.packages = [...supportedPackages];
    }
    return options;
}

function getSourceDirectory(packageName) {
    return path.join(packageRoot, packageName);
}

function getTargetDirectory(packageName) {
    return path.join(packageRoot, `${packageName}-closure`);
}

function rewritePackageSpecifier(specifier) {
    for (const [sourcePackage, closurePackage] of packageAliases) {
        if (specifier === sourcePackage || specifier.startsWith(`${sourcePackage}/`)) {
            return `${closurePackage}${specifier.slice(sourcePackage.length)}`;
        }
        if (specifier === closurePackage || specifier.startsWith(`${closurePackage}/`)) {
            return specifier;
        }
    }
    if (specifier.startsWith("@babylonjs/")) {
        throw new Error(`Unsupported Babylon.js dependency in Closure package: ${specifier}`);
    }
    return specifier;
}

function getExpectedManifest(packageName) {
    const sourceManifest = JSON.parse(fs.readFileSync(path.join(getSourceDirectory(packageName), "package.json"), "utf8"));
    const rewriteDependencies = (dependencies) =>
        dependencies && Object.fromEntries(Object.entries(dependencies).map(([dependency, version]) => [packageAliases.get(dependency) ?? dependency, version]));
    const sideEffects =
        sourceManifest.sideEffects === undefined
            ? undefined
            : sourceManifest.sideEffects === true
              ? true
              : [...new Set([...(sourceManifest.sideEffects === false ? [] : sourceManifest.sideEffects), externFileName])];

    return {
        name: `@babylonjs/${packageName}-closure`,
        version: sourceManifest.version,
        description: `Closure Compiler compatible build of @babylonjs/${packageName}`,
        main: sourceManifest.main,
        module: sourceManifest.module,
        types: sourceManifest.types,
        files: ["**/*.js", "**/*.d.ts", "**/*.d.mts", "**/*.wasm", "**/*.license", "readme.md", "license.md", "NOTICE.md"],
        scripts: {
            prepublishOnly: `node ../../../../scripts/closureCompiler/generateClosurePackages.mjs --check --package ${packageName}`,
        },
        dependencies: rewriteDependencies(sourceManifest.dependencies),
        peerDependencies: rewriteDependencies(sourceManifest.peerDependencies),
        peerDependenciesMeta: sourceManifest.peerDependenciesMeta,
        keywords: [...(sourceManifest.keywords ?? []), "closure-compiler"],
        license: sourceManifest.license,
        esnext: sourceManifest.esnext,
        type: sourceManifest.type,
        sideEffects,
        homepage: sourceManifest.homepage,
        repository: sourceManifest.repository,
        bugs: sourceManifest.bugs,
    };
}

function removeUndefinedProperties(value) {
    return Object.fromEntries(Object.entries(value).filter(([, propertyValue]) => propertyValue !== undefined));
}

function writeManifest(packageName) {
    const targetDirectory = getTargetDirectory(packageName);
    const manifest = removeUndefinedProperties(getExpectedManifest(packageName));
    fs.writeFileSync(path.join(targetDirectory, "package.json"), `${JSON.stringify(manifest, null, 4)}\n`);
}

function cleanGeneratedFiles(targetDirectory) {
    for (const entry of fs.readdirSync(targetDirectory, { withFileTypes: true })) {
        if (preservedFiles.has(entry.name)) {
            continue;
        }
        const entryPath = path.join(targetDirectory, entry.name);
        if (entry.isDirectory() || copiedFileSuffixes.some((suffix) => entry.name.endsWith(suffix))) {
            fs.rmSync(entryPath, { recursive: entry.isDirectory(), force: true });
        }
    }
}

function walkFiles(directory, predicate) {
    const files = [];
    const directories = [directory];
    while (directories.length > 0) {
        const currentDirectory = directories.pop();
        for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
            const entryPath = path.join(currentDirectory, entry.name);
            if (entry.isDirectory()) {
                if (entry.name !== "node_modules") {
                    directories.push(entryPath);
                }
            } else if (entry.isFile() && predicate(entryPath)) {
                files.push(entryPath);
            }
        }
    }
    return files.sort();
}

function isJavaScriptModule(packageDirectory, filePath) {
    return filePath.endsWith(".js") && !path.relative(packageDirectory, filePath).split(path.sep).includes("assets");
}

function copyPackageOutput(packageName) {
    const sourceDirectory = getSourceDirectory(packageName);
    const targetDirectory = getTargetDirectory(packageName);
    if (!fs.existsSync(path.join(sourceDirectory, "index.js"))) {
        throw new Error(`Build @babylonjs/${packageName} before generating its Closure package.`);
    }

    cleanGeneratedFiles(targetDirectory);
    const sourceFiles = walkFiles(sourceDirectory, (filePath) => copiedFileSuffixes.some((suffix) => filePath.endsWith(suffix)));
    for (const sourceFile of sourceFiles) {
        const relativePath = path.relative(sourceDirectory, sourceFile);
        const targetFile = path.join(targetDirectory, relativePath);
        fs.mkdirSync(path.dirname(targetFile), { recursive: true });
        fs.copyFileSync(sourceFile, targetFile);
    }
    for (const metadataFile of ["license.md", "NOTICE.md"]) {
        const sourceFile = path.join(sourceDirectory, metadataFile);
        if (fs.existsSync(sourceFile)) {
            fs.copyFileSync(sourceFile, path.join(targetDirectory, metadataFile));
        }
    }
    return sourceFiles.length;
}

function addEdit(edits, start, end, replacement) {
    if (!edits.some((edit) => edit.start === start && edit.end === end)) {
        edits.push({ start, end, replacement });
    }
}

function addNodeEdit(edits, node, replacement) {
    addEdit(edits, node.getStart(), node.getEnd(), replacement);
}

function applyEdits(sourceText, edits) {
    let output = sourceText;
    const nonOverlappingEdits = edits.filter(
        (edit) => !edits.some((other) => other !== edit && other.start <= edit.start && other.end >= edit.end && (other.start < edit.start || other.end > edit.end))
    );
    for (const edit of nonOverlappingEdits.sort((left, right) => right.start - left.start || right.end - left.end)) {
        output = output.slice(0, edit.start) + edit.replacement + output.slice(edit.end);
    }
    return output;
}

function collectJSDocEdits(sourceFile, sourceText) {
    const edits = [];

    function collectRanges(ranges) {
        for (const range of ranges ?? []) {
            const comment = sourceText.slice(range.pos, range.end);
            if (comment.startsWith("/**") && !/@(?:license|preserve|copyright)\b/i.test(comment)) {
                addEdit(edits, range.pos, range.end, "");
            }
        }
    }

    function visit(node) {
        collectRanges(ts.getLeadingCommentRanges(sourceText, node.getFullStart()));
        collectRanges(ts.getTrailingCommentRanges(sourceText, node.end));
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return edits;
}

function collectPropertyAndImportEdits(sourceFile, sourceText) {
    const edits = collectJSDocEdits(sourceFile, sourceText);

    function quotePropertyName(name) {
        if (ts.isIdentifier(name) && name.text !== "constructor") {
            addNodeEdit(edits, name, JSON.stringify(name.text));
        }
    }

    function rewriteModuleSpecifier(node) {
        if (!node || !ts.isStringLiteralLike(node)) {
            return;
        }
        const rewritten = rewritePackageSpecifier(node.text);
        if (rewritten !== node.text) {
            addNodeEdit(edits, node, JSON.stringify(rewritten));
        }
    }

    function visit(node) {
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
            rewriteModuleSpecifier(node.moduleSpecifier);
        } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1) {
            rewriteModuleSpecifier(node.arguments[0]);
        }

        if (ts.isPropertyAccessExpression(node) && !ts.isPrivateIdentifier(node.name)) {
            const replacement = `${node.questionDotToken ? "?." : ""}[${JSON.stringify(node.name.text)}]`;
            addEdit(edits, node.expression.end, node.end, replacement);
        } else if (ts.isShorthandPropertyAssignment(node)) {
            addEdit(edits, node.getStart(), node.getStart(), `${JSON.stringify(node.name.text)}: `);
        } else if (ts.isPropertyAssignment(node)) {
            quotePropertyName(node.name);
        } else if (ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node) || ts.isPropertyDeclaration(node)) {
            quotePropertyName(node.name);
        } else if (ts.isBindingElement(node) && ts.isObjectBindingPattern(node.parent) && !node.dotDotDotToken) {
            if (node.propertyName) {
                quotePropertyName(node.propertyName);
            } else if (ts.isIdentifier(node.name)) {
                addEdit(edits, node.name.getStart(), node.name.getStart(), `${JSON.stringify(node.name.text)}: `);
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return edits;
}

function collectExternProperties(sourceFile, properties) {
    function addPropertyName(name) {
        if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) {
            properties.add(name.text);
        }
    }

    function visit(node) {
        if (ts.isPropertyAccessExpression(node) && !ts.isPrivateIdentifier(node.name)) {
            addPropertyName(node.name);
        } else if (ts.isElementAccessExpression(node) && node.argumentExpression && ts.isStringLiteralLike(node.argumentExpression)) {
            properties.add(node.argumentExpression.text);
        } else if (
            ts.isPropertyAssignment(node) ||
            ts.isMethodDeclaration(node) ||
            ts.isGetAccessorDeclaration(node) ||
            ts.isSetAccessorDeclaration(node) ||
            ts.isPropertyDeclaration(node)
        ) {
            addPropertyName(node.name);
        } else if (ts.isShorthandPropertyAssignment(node)) {
            properties.add(node.name.text);
        } else if (ts.isBindingElement(node) && ts.isObjectBindingPattern(node.parent) && !node.dotDotDotToken) {
            addPropertyName(node.propertyName || node.name);
        } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.InKeyword && ts.isStringLiteralLike(node.left)) {
            properties.add(node.left.text);
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
}

function createExternSource(properties) {
    const propertyNames = [...properties].filter((property) => /^[$A-Z_a-z][$\w]*$/.test(property)).sort();
    return ["/** @externs */", ...propertyNames.map((property) => `Object.prototype.${property};`), ""].join("\n");
}

function writeAndImportExternFiles(packageNames) {
    for (const packageName of packageNames) {
        const targetDirectory = getTargetDirectory(packageName);
        const externFilePath = path.join(targetDirectory, externFileName);
        const jsFiles = walkFiles(targetDirectory, (filePath) => isJavaScriptModule(targetDirectory, filePath) && path.basename(filePath) !== externFileName);
        const properties = new Set();
        for (const jsFile of jsFiles) {
            const sourceText = fs.readFileSync(jsFile, "utf8");
            const sourceFile = ts.createSourceFile(jsFile, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
            collectExternProperties(sourceFile, properties);
        }
        fs.writeFileSync(externFilePath, createExternSource(properties));

        for (const jsFile of jsFiles) {
            let specifier = path.relative(path.dirname(jsFile), externFilePath).split(path.sep).join("/");
            if (!specifier.startsWith(".")) {
                specifier = `./${specifier}`;
            }
            const sourceText = fs.readFileSync(jsFile, "utf8");
            fs.writeFileSync(jsFile, `import ${JSON.stringify(specifier)};\n${sourceText}`);
        }
    }
}

function transformJavaScriptFiles(packageNames) {
    const transformedFiles = [];
    for (const packageName of packageNames) {
        const targetDirectory = getTargetDirectory(packageName);
        const files = walkFiles(targetDirectory, (filePath) => isJavaScriptModule(targetDirectory, filePath));
        for (const filePath of files) {
            const sourceText = fs.readFileSync(filePath, "utf8");
            const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
            let output = applyEdits(sourceText, collectPropertyAndImportEdits(sourceFile, sourceText));
            output = output.replace(/\n?\/\/# sourceMappingURL=.*?(?:\r?\n|$)/g, "\n");
            fs.writeFileSync(filePath, output);
            transformedFiles.push(filePath);
        }
    }
    return transformedFiles;
}

function transformDeclarationFiles(packageNames) {
    for (const packageName of packageNames) {
        const files = walkFiles(getTargetDirectory(packageName), (filePath) => filePath.endsWith(".d.ts") || filePath.endsWith(".d.mts"));
        for (const filePath of files) {
            const sourceText = fs.readFileSync(filePath, "utf8");
            const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
            const edits = [];

            function visit(node) {
                if (ts.isStringLiteralLike(node)) {
                    const rewritten = rewritePackageSpecifier(node.text);
                    if (rewritten !== node.text) {
                        addNodeEdit(edits, node, JSON.stringify(rewritten));
                    }
                }
                ts.forEachChild(node, visit);
            }

            visit(sourceFile);
            fs.writeFileSync(filePath, applyEdits(sourceText, edits));
        }
    }
}

function isIdentifierReference(node) {
    const parent = node.parent;
    if (!parent) {
        return false;
    }
    return !(
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyAssignment(parent) && parent.name === node) ||
        (ts.isMethodDeclaration(parent) && parent.name === node) ||
        (ts.isGetAccessorDeclaration(parent) && parent.name === node) ||
        (ts.isSetAccessorDeclaration(parent) && parent.name === node) ||
        (ts.isPropertyDeclaration(parent) && parent.name === node) ||
        (ts.isBindingElement(parent) && (parent.name === node || parent.propertyName === node)) ||
        (ts.isVariableDeclaration(parent) && parent.name === node) ||
        (ts.isParameter(parent) && parent.name === node) ||
        ((ts.isFunctionDeclaration(parent) || ts.isFunctionExpression(parent) || ts.isClassDeclaration(parent) || ts.isClassExpression(parent)) && parent.name === node) ||
        ts.isImportClause(parent) ||
        ts.isImportSpecifier(parent) ||
        ts.isNamespaceImport(parent) ||
        ts.isExportSpecifier(parent) ||
        ts.isLabeledStatement(parent) ||
        ts.isMetaProperty(parent) ||
        ((ts.isBreakStatement(parent) || ts.isContinueStatement(parent)) && parent.label === node)
    );
}

function createJavaScriptProgram(files) {
    return ts.createProgram({
        rootNames: files,
        options: {
            allowJs: true,
            checkJs: false,
            lib: ["lib.es2021.d.ts"],
            module: ts.ModuleKind.NodeNext,
            moduleResolution: ts.ModuleResolutionKind.NodeNext,
            noEmit: true,
            skipLibCheck: true,
            target: ts.ScriptTarget.Latest,
            types: [],
        },
    });
}

function collectRuntimeGlobalEdits(program, files) {
    const fileSet = new Set(files.map((filePath) => path.resolve(filePath)));
    const checker = program.getTypeChecker();
    const editsByFile = new Map();
    const globalNames = new Set();

    for (const sourceFile of program.getSourceFiles()) {
        if (!fileSet.has(path.resolve(sourceFile.fileName))) {
            continue;
        }
        const edits = [];

        function visit(node) {
            if (ts.isIdentifier(node) && node.text !== "globalThis" && node.text !== "arguments" && isIdentifierReference(node)) {
                const symbol = checker.getSymbolAtLocation(node);
                const hasRuntimeDeclaration = symbol?.declarations?.some(
                    (declaration) => !declaration.getSourceFile().isDeclarationFile && path.resolve(declaration.getSourceFile().fileName) === path.resolve(sourceFile.fileName)
                );
                if (!hasRuntimeDeclaration) {
                    addNodeEdit(edits, node, `globalThis[${JSON.stringify(node.text)}]`);
                    globalNames.add(node.text);
                }
            }
            ts.forEachChild(node, visit);
        }

        visit(sourceFile);
        if (edits.length > 0) {
            editsByFile.set(sourceFile.fileName, edits);
        }
    }
    return { editsByFile, globalNames };
}

function rewriteRuntimeGlobals(files) {
    const program = createJavaScriptProgram(files);
    const { editsByFile, globalNames } = collectRuntimeGlobalEdits(program, files);
    for (const [filePath, edits] of editsByFile) {
        const sourceText = fs.readFileSync(filePath, "utf8");
        fs.writeFileSync(filePath, applyEdits(sourceText, edits));
    }
    return globalNames;
}

function verifyPackage(packageName) {
    const sourceDirectory = getSourceDirectory(packageName);
    const targetDirectory = getTargetDirectory(packageName);
    const manifestPath = path.join(targetDirectory, "package.json");
    const expectedManifest = removeUndefinedProperties(getExpectedManifest(packageName));
    const actualManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (JSON.stringify(actualManifest) !== JSON.stringify(expectedManifest)) {
        throw new Error(`${actualManifest.name} package.json is out of sync. Run npm run build:closure.`);
    }
    if (!fs.existsSync(path.join(targetDirectory, "index.js")) || !fs.existsSync(path.join(targetDirectory, "index.d.ts"))) {
        throw new Error(`${actualManifest.name} has not been generated. Run npm run build:closure.`);
    }
    for (const metadataFile of ["license.md", "NOTICE.md"]) {
        const sourceFile = path.join(sourceDirectory, metadataFile);
        const targetFile = path.join(targetDirectory, metadataFile);
        if (fs.existsSync(sourceFile) && (!fs.existsSync(targetFile) || fs.readFileSync(targetFile, "utf8") !== fs.readFileSync(sourceFile, "utf8"))) {
            throw new Error(`${actualManifest.name} has a stale ${metadataFile}. Run npm run build:closure.`);
        }
    }

    const externFilePath = path.join(targetDirectory, externFileName);
    if (!fs.existsSync(externFilePath)) {
        throw new Error(`${actualManifest.name} is missing ${externFileName}. Run npm run build:closure.`);
    }
    const jsFiles = walkFiles(targetDirectory, (filePath) => isJavaScriptModule(targetDirectory, filePath) && path.basename(filePath) !== externFileName);
    const properties = new Set();
    for (const filePath of jsFiles) {
        const sourceText = fs.readFileSync(filePath, "utf8");
        const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
        collectExternProperties(sourceFile, properties);
        if (collectPropertyAndImportEdits(sourceFile, sourceText).length > 0 || sourceText.includes("//# sourceMappingURL=")) {
            throw new Error(`${path.relative(repoRoot, filePath)} is not Closure-ready. Run npm run build:closure.`);
        }
        if (!sourceText.includes(externFileName)) {
            throw new Error(`${path.relative(repoRoot, filePath)} does not import ${externFileName}. Run npm run build:closure.`);
        }
    }
    if (fs.readFileSync(externFilePath, "utf8") !== createExternSource(properties)) {
        throw new Error(`${actualManifest.name} has a stale ${externFileName}. Run npm run build:closure.`);
    }

    const program = createJavaScriptProgram(jsFiles);
    const { editsByFile } = collectRuntimeGlobalEdits(program, jsFiles);
    if (editsByFile.size > 0) {
        const unresolved = [...editsByFile]
            .flatMap(([fileName, edits]) => edits.map((edit) => `${path.relative(targetDirectory, fileName)}:${edit.replacement}`))
            .slice(0, 10)
            .join(", ");
        throw new Error(`${actualManifest.name} contains unresolved runtime globals (${unresolved}). Run npm run build:closure.`);
    }
}

function generatePackages(packageNames) {
    let copiedFiles = 0;
    for (const packageName of packageNames) {
        copiedFiles += copyPackageOutput(packageName);
        writeManifest(packageName);
    }
    const jsFiles = transformJavaScriptFiles(packageNames);
    transformDeclarationFiles(packageNames);
    const globalNames = new Set();
    for (const packageName of packageNames) {
        const targetDirectory = getTargetDirectory(packageName);
        const packageGlobals = rewriteRuntimeGlobals(jsFiles.filter((filePath) => filePath.startsWith(`${targetDirectory}${path.sep}`)));
        for (const globalName of packageGlobals) {
            globalNames.add(globalName);
        }
    }
    writeAndImportExternFiles(packageNames);
    for (const packageName of packageNames) {
        verifyPackage(packageName);
    }
    process.stdout.write(
        `Generated ${packageNames.length} Closure packages from ${copiedFiles} files; transformed ${jsFiles.length} JavaScript files and ${globalNames.size} runtime globals.\n`
    );
}

const options = parseArguments(process.argv.slice(2));
if (options.check) {
    for (const packageName of options.packages) {
        verifyPackage(packageName);
    }
    process.stdout.write(`Verified ${options.packages.length} Closure package${options.packages.length === 1 ? "" : "s"}.\n`);
} else {
    generatePackages(options.packages);
}

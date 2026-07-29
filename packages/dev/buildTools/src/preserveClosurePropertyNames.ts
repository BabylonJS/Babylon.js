/* eslint-disable no-console */
import * as fs from "fs";
import * as path from "path";
import ts from "typescript";

const DynamicPropertyDecorators = new Set(["addAccessorsForMaterialProperty", "expandToProperty"]);
const DecoratorHelperMarker = "var __closurePropertyName;";
const ClosureRenameHelperName = "JSCompiler_renameProperty";
const ReflectionMethods = new Set([
    "Object.defineProperty",
    "Object.getOwnPropertyDescriptor",
    "Object.hasOwn",
    "Reflect.defineProperty",
    "Reflect.deleteProperty",
    "Reflect.get",
    "Reflect.getOwnPropertyDescriptor",
    "Reflect.has",
    "Reflect.set",
]);
const ReflectionCallMethods = new Set(["Object.prototype.hasOwnProperty.call", "Object.prototype.propertyIsEnumerable.call"]);
const ClosureRenameHelperFileName = "closureTools.js";
const ClosureRenameHelperSource = [
    "/**",
    " * @param {string} propertyName",
    " * @param {?Object} _target",
    " * @return {string}",
    " * @noinline",
    " */",
    `export function ${ClosureRenameHelperName}(propertyName, _target) {`,
    "    return propertyName;",
    "}",
].join("\n");

interface ITextReplacement {
    start: number;
    end: number;
    text: string;
}

function GetStringPropertyName(node: ts.Node | undefined): string | undefined {
    if (!node || (!ts.isStringLiteral(node) && !ts.isNoSubstitutionTemplateLiteral(node)) || !node.text.startsWith("_")) {
        return undefined;
    }

    return node.text;
}

function GetCallName(expression: ts.LeftHandSideExpression): string | undefined {
    if (ts.isIdentifier(expression)) {
        return expression.text;
    }

    if (ts.isPropertyAccessExpression(expression)) {
        return expression.name.text;
    }

    return undefined;
}

function GetAccessPath(expression: ts.Expression): string | undefined {
    if (ts.isIdentifier(expression)) {
        return expression.text;
    }

    if (ts.isPropertyAccessExpression(expression)) {
        const parentPath = GetAccessPath(expression.expression);
        return parentPath ? `${parentPath}.${expression.name.text}` : undefined;
    }

    return undefined;
}

function CanRepeatExpression(expression: ts.Expression): boolean {
    return (
        ts.isIdentifier(expression) || expression.kind === ts.SyntaxKind.ThisKeyword || (ts.isPropertyAccessExpression(expression) && CanRepeatExpression(expression.expression))
    );
}

function AddDecoratedBackingProperty(propertyNames: Set<string>, propertyName: string | undefined): void {
    if (!propertyName) {
        return;
    }

    propertyNames.add(propertyName.startsWith("_") ? propertyName : `_${propertyName}`);
}

function CollectJavaScriptFiles(dir: string): string[] {
    const files: string[] = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules") {
            continue;
        }

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...CollectJavaScriptFiles(fullPath));
        } else if (entry.name.endsWith(".js")) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Collects internal property names that emitted Babylon.js code also accesses dynamically.
 * @param sourceText defines the emitted JavaScript source.
 * @param fileName defines the source filename used for parsing diagnostics.
 * @returns the property names that must use quoted access for Closure Compiler compatibility.
 */
export function CollectClosureSensitivePropertyNames(sourceText: string, fileName = "source.js"): Set<string> {
    const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const propertyNames = new Set<string>();
    const dynamicDecoratorCollections = new Set<string>();

    const isDynamicDecoratorExpression = (node: ts.Node | undefined): boolean => {
        if (!node) {
            return false;
        }
        if (ts.isIdentifier(node)) {
            return dynamicDecoratorCollections.has(node.text);
        }
        if (ts.isArrayLiteralExpression(node)) {
            return node.elements.some(isDynamicDecoratorExpression);
        }
        return ts.isCallExpression(node) && !!GetCallName(node.expression) && DynamicPropertyDecorators.has(GetCallName(node.expression)!);
    };

    const collectDecoratorCollections = (node: ts.Node): void => {
        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(node.left) && isDynamicDecoratorExpression(node.right)) {
            dynamicDecoratorCollections.add(node.left.text);
        } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && isDynamicDecoratorExpression(node.initializer)) {
            dynamicDecoratorCollections.add(node.name.text);
        }

        ts.forEachChild(node, collectDecoratorCollections);
    };
    collectDecoratorCollections(sourceFile);

    const visit = (node: ts.Node): void => {
        if (ts.isElementAccessExpression(node)) {
            const propertyName = GetStringPropertyName(node.argumentExpression);
            if (propertyName) {
                propertyNames.add(propertyName);
            }
        } else if (ts.isCallExpression(node)) {
            const callName = GetCallName(node.expression);

            if (callName === "__esDecorate" && isDynamicDecoratorExpression(node.arguments[2])) {
                const context = node.arguments[3];
                if (context && ts.isObjectLiteralExpression(context)) {
                    const nameProperty = context.properties.find(
                        (property): property is ts.PropertyAssignment => ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === "name"
                    );
                    const decoratedName =
                        nameProperty && (ts.isStringLiteral(nameProperty.initializer) || ts.isNoSubstitutionTemplateLiteral(nameProperty.initializer))
                            ? nameProperty.initializer.text
                            : undefined;
                    AddDecoratedBackingProperty(propertyNames, decoratedName);
                }
            } else if (callName === "__decorate" && isDynamicDecoratorExpression(node.arguments[0])) {
                const decoratedName = node.arguments[2];
                AddDecoratedBackingProperty(
                    propertyNames,
                    decoratedName && (ts.isStringLiteral(decoratedName) || ts.isNoSubstitutionTemplateLiteral(decoratedName)) ? decoratedName.text : undefined
                );
            } else if (callName && DynamicPropertyDecorators.has(callName)) {
                for (const argument of node.arguments) {
                    const propertyName = GetStringPropertyName(argument);
                    if (propertyName) {
                        propertyNames.add(propertyName);
                    }
                }
            }
        }

        ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return propertyNames;
}

function CollectPropertyReplacements(sourceFile: ts.SourceFile, propertyNames: ReadonlySet<string>): ITextReplacement[] {
    const replacements: ITextReplacement[] = [];

    const addNameReplacement = (name: ts.Identifier, replacement: string): void => {
        if (propertyNames.has(name.text)) {
            replacements.push({
                start: name.getStart(sourceFile),
                end: name.end,
                text: replacement,
            });
        }
    };

    const visit = (node: ts.Node): void => {
        if (ts.isPropertyAccessExpression(node) && propertyNames.has(node.name.text)) {
            replacements.push({
                start: node.expression.end,
                end: node.end,
                text: `${node.questionDotToken ? "?." : ""}["${node.name.text}"]`,
            });
        } else if (
            (ts.isMethodDeclaration(node) ||
                ts.isGetAccessorDeclaration(node) ||
                ts.isSetAccessorDeclaration(node) ||
                ts.isPropertyDeclaration(node) ||
                ts.isPropertyAssignment(node)) &&
            ts.isIdentifier(node.name)
        ) {
            addNameReplacement(node.name, `["${node.name.text}"]`);
        } else if (ts.isShorthandPropertyAssignment(node)) {
            addNameReplacement(node.name, `["${node.name.text}"]: ${node.name.text}`);
        } else if (ts.isBindingElement(node) && ts.isObjectBindingPattern(node.parent)) {
            if (node.propertyName && ts.isIdentifier(node.propertyName)) {
                addNameReplacement(node.propertyName, `["${node.propertyName.text}"]`);
            } else if (!node.propertyName && ts.isIdentifier(node.name)) {
                addNameReplacement(node.name, `["${node.name.text}"]: ${node.name.text}`);
            }
        }

        ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return replacements;
}

function CollectReflectionReplacements(sourceFile: ts.SourceFile, helperImportPath: string): ITextReplacement[] {
    const replacements: ITextReplacement[] = [];

    const addReplacement = (propertyName: ts.Expression | undefined, target: ts.Expression | undefined): void => {
        if (!propertyName || (!ts.isStringLiteral(propertyName) && !ts.isNoSubstitutionTemplateLiteral(propertyName))) {
            return;
        }

        const targetArgument = target && CanRepeatExpression(target) ? target.getText(sourceFile) : "null";
        replacements.push({
            start: propertyName.getStart(sourceFile),
            end: propertyName.end,
            text: `${ClosureRenameHelperName}(${JSON.stringify(propertyName.text)}, ${targetArgument})`,
        });
    };

    const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node)) {
            const accessPath = GetAccessPath(node.expression);
            if (accessPath && ReflectionMethods.has(accessPath)) {
                addReplacement(node.arguments[1], node.arguments[0]);
            } else if (accessPath && ReflectionCallMethods.has(accessPath)) {
                addReplacement(node.arguments[1], node.arguments[0]);
            }
        } else if (
            ts.isBinaryExpression(node) &&
            node.operatorToken.kind === ts.SyntaxKind.InKeyword &&
            (ts.isStringLiteral(node.left) || ts.isNoSubstitutionTemplateLiteral(node.left))
        ) {
            const propertyName = JSON.stringify(node.left.text);
            const target = node.right.getText(sourceFile);
            replacements.push({
                start: node.getStart(sourceFile),
                end: node.end,
                text: CanRepeatExpression(node.right)
                    ? `(${propertyName} in ${target} || ${ClosureRenameHelperName}(${propertyName}, ${target}) in ${target})`
                    : `((_closureTarget) => ${ClosureRenameHelperName}(${propertyName}, _closureTarget) in _closureTarget)(${target})`,
            });
            return;
        }

        ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    if (replacements.length === 0) {
        return replacements;
    }

    let insertionPoint = 0;
    for (const statement of sourceFile.statements) {
        if (ts.isImportDeclaration(statement)) {
            insertionPoint = statement.end;
        }
    }
    replacements.push({
        start: insertionPoint,
        end: insertionPoint,
        text: `${insertionPoint ? "\n" : ""}import { ${ClosureRenameHelperName} } from ${JSON.stringify(helperImportPath)};\n`,
    });
    return replacements;
}

function ApplyReplacements(sourceText: string, replacements: ITextReplacement[]): string {
    let output = sourceText;

    for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
        output = output.slice(0, replacement.start) + replacement.text + output.slice(replacement.end);
    }

    return output;
}

function PatchDecoratorHelper(outDir: string): void {
    const tslibPath = path.join(outDir, "tslib.es6.js");
    if (!fs.existsSync(tslibPath)) {
        return;
    }

    let sourceText = fs.readFileSync(tslibPath, "utf8");
    if (sourceText.includes(DecoratorHelperMarker)) {
        return;
    }

    const helperDeclaration = "export function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {";
    const descriptorLookup = "var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});";
    const propertyDefinition = "if (target) Object.defineProperty(target, contextIn.name, descriptor);";
    if (!sourceText.includes(helperDeclaration) || !sourceText.includes(descriptorLookup) || !sourceText.includes(propertyDefinition)) {
        throw new Error("Unable to patch tslib's __esDecorate helper for Closure Compiler property renaming.");
    }

    sourceText = sourceText
        .replace(
            helperDeclaration,
            `${DecoratorHelperMarker} var __closurePropertyProxy = typeof Proxy === "function" ? new Proxy({}, { get: function (_target, propertyName) { __closurePropertyName = propertyName; }, set: function (_target, propertyName) { __closurePropertyName = propertyName; return true; } }) : null; ${helperDeclaration}`
        )
        .replace(
            descriptorLookup,
            "var propertyName = contextIn.name; if (target && __closurePropertyProxy && !contextIn.private) { if (contextIn.access.get) { contextIn.access.get(__closurePropertyProxy); } else { contextIn.access.set(__closurePropertyProxy, void 0); } propertyName = __closurePropertyName; } var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, propertyName) : {});"
        )
        .replace(propertyDefinition, "if (target) Object.defineProperty(target, propertyName, descriptor);");

    fs.writeFileSync(tslibPath, sourceText, "utf8");
}

/**
 * Rewrites emitted Babylon.js ES6 property references so Closure can rename reflective and decorated members consistently.
 * @param outDir defines the package output directory containing emitted JavaScript.
 * @returns the number of JavaScript files rewritten.
 */
export function PreserveClosurePropertyNames(outDir: string): number {
    const resolvedDir = path.resolve(outDir);
    PatchDecoratorHelper(resolvedDir);
    const files = CollectJavaScriptFiles(resolvedDir);
    const closureRenameHelperPath = path.join(resolvedDir, ClosureRenameHelperFileName);
    const propertyNames = new Set<string>();

    for (const filePath of files) {
        const sourceText = fs.readFileSync(filePath, "utf8");
        for (const propertyName of CollectClosureSensitivePropertyNames(sourceText, filePath)) {
            propertyNames.add(propertyName);
        }
    }

    let transformedFiles = 0;
    let usesClosureRenameHelper = false;
    for (const filePath of files) {
        if (filePath === closureRenameHelperPath) {
            continue;
        }

        const sourceText = fs.readFileSync(filePath, "utf8");
        const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
        let helperImportPath = path.relative(path.dirname(filePath), closureRenameHelperPath).split(path.sep).join("/");
        if (!helperImportPath.startsWith(".")) {
            helperImportPath = `./${helperImportPath}`;
        }
        const reflectionReplacements = CollectReflectionReplacements(sourceFile, helperImportPath);
        usesClosureRenameHelper ||= reflectionReplacements.length > 0;
        const replacements = [...CollectPropertyReplacements(sourceFile, propertyNames), ...reflectionReplacements];
        if (replacements.length === 0) {
            continue;
        }

        fs.writeFileSync(filePath, ApplyReplacements(sourceText, replacements), "utf8");
        transformedFiles++;
    }

    if (usesClosureRenameHelper) {
        fs.writeFileSync(closureRenameHelperPath, `${ClosureRenameHelperSource}\n`, "utf8");
    }

    console.log(`closureProperties: preserved ${propertyNames.size} properties across ${transformedFiles} files in ${resolvedDir}`);
    return transformedFiles;
}

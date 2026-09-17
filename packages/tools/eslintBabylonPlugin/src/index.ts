/* eslint-disable @typescript-eslint/naming-convention */
import type * as eslint from "eslint";
import type * as ESTree from "estree";
import { type ParserContext, TSDocConfiguration, TSDocParser, TextRange } from "@microsoft/tsdoc";
import * as tsdoc from "@microsoft/tsdoc";
import { type TSDocConfigFile } from "@microsoft/tsdoc-config";
import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

// import { Debug } from "./Debug";
import { ConfigCache } from "./ConfigCache";
import { FindSideEffectsManifestRoot, SideEffectsManifestLoader, type SideEffectsPackageName } from "./SideEffectsManifest";

const tsdocMessageIds: { [x: string]: string } = {};

const defaultTSDocConfiguration: TSDocConfiguration = new TSDocConfiguration();
defaultTSDocConfiguration.allTsdocMessageIds.forEach((messageId: string) => {
    tsdocMessageIds[messageId] = `${messageId}: {{unformattedText}}`;
});

interface IPlugin {
    rules: { [x: string]: eslint.Rule.RuleModule };
}

const allowedTags: string[] = ["@internal", "@since"];

// const taskToMessageId = {
//     "param-tag-missing-hyphen": "tsdoc-param-tag-missing-hyphen",
// };

interface IFoundComment {
    compilerNode: ts.Node;
    name: string;
    textRange: tsdoc.TextRange;
}

type TypeScriptExpressionWrapper = ESTree.BaseExpression & {
    type: "TSAsExpression" | "TSTypeAssertion" | "TSSatisfiesExpression" | "TSNonNullExpression";
    expression: PureAnnotationNode;
};
type PureAnnotationNode = ESTree.Node | TypeScriptExpressionWrapper;
type PureAnnotationCallOrNewExpression = ESTree.SimpleCallExpression | ESTree.NewExpression;

function createPureAnnotationVisitors(context: eslint.Rule.RuleContext, mode: "direct" | "nested"): eslint.Rule.RuleListener {
    if (!context.filename.endsWith(".pure.ts")) {
        return {};
    }

    const sourceCode = context.sourceCode;

    function unwrapExpression(node: PureAnnotationNode | null | undefined): PureAnnotationNode | null | undefined {
        if (node?.type === "TSAsExpression" || node?.type === "TSTypeAssertion" || node?.type === "TSSatisfiesExpression" || node?.type === "TSNonNullExpression") {
            return unwrapExpression(node.expression);
        }
        return node;
    }

    function findDirectCallOrNew(node: PureAnnotationNode | null | undefined): PureAnnotationCallOrNewExpression | null {
        const unwrappedNode = unwrapExpression(node);
        return unwrappedNode?.type === "CallExpression" || unwrappedNode?.type === "NewExpression" ? unwrappedNode : null;
    }

    function hasPureAnnotation(node: PureAnnotationCallOrNewExpression): boolean {
        const comments = sourceCode.getCommentsBefore(node);
        if (comments.some((comment) => comment.type === "Block" && comment.value.trim() === "#__PURE__")) {
            return true;
        }
        const previousToken = sourceCode.getTokenBefore(node, { includeComments: true });
        return previousToken?.type === "Block" && previousToken.value?.trim() === "#__PURE__";
    }

    const safelyAutofixablePureConstructors = new Set([
        "Map",
        "Set",
        "WeakMap",
        "WeakSet",
        "Color3",
        "Color4",
        "Matrix",
        "Plane",
        "Quaternion",
        "Size",
        "Vector2",
        "Vector3",
        "Vector4",
        "Viewport",
    ]);

    function isSimplePureArgument(node: PureAnnotationNode | null | undefined): boolean {
        const unwrappedNode = unwrapExpression(node);
        if (!unwrappedNode) {
            return true;
        }
        switch (unwrappedNode.type) {
            case "Identifier":
            case "Literal":
            case "ThisExpression":
                return true;
            case "TemplateLiteral":
                return unwrappedNode.expressions.length === 0;
            case "UnaryExpression":
                return unwrappedNode.operator !== "delete" && isSimplePureArgument(unwrappedNode.argument as PureAnnotationNode);
            case "ArrayExpression":
                return unwrappedNode.elements.every((element) => element !== null && element.type !== "SpreadElement" && isSimplePureArgument(element as PureAnnotationNode));
            case "ObjectExpression":
                return unwrappedNode.properties.every(
                    (property) => property.type !== "SpreadElement" && !property.computed && isSimplePureArgument(property.value as PureAnnotationNode)
                );
            default:
                return false;
        }
    }

    function isSafelyAutofixablePureExpression(node: PureAnnotationCallOrNewExpression): boolean {
        if (!node.arguments.every((argument) => isSimplePureArgument(argument as PureAnnotationNode))) {
            return false;
        }
        if (node.type === "NewExpression") {
            const callee = unwrapExpression(node.callee as PureAnnotationNode);
            return callee?.type === "Identifier" && safelyAutofixablePureConstructors.has(callee.name);
        }
        const callee = unwrapExpression(node.callee as PureAnnotationNode);
        return (
            callee?.type === "MemberExpression" && !callee.computed && callee.object.type === "Identifier" && callee.object.name === "Math" && callee.property.type === "Identifier"
        );
    }

    function report(node: PureAnnotationCallOrNewExpression): void {
        if (hasPureAnnotation(node)) {
            return;
        }
        const expression = sourceCode.getText(node);
        const data = { expr: expression.length > 60 ? expression.slice(0, 57) + "..." : expression };
        if (mode === "nested") {
            context.report({ node, messageId: "nested-pure-review", data });
            return;
        }
        context.report({
            node,
            messageId: "missing-pure-annotation",
            data,
            fix: isSafelyAutofixablePureExpression(node) ? (fixer) => fixer.insertTextBefore(node, "/*#__PURE__*/ ") : undefined,
        });
    }

    function collectNestedExpressions(node: PureAnnotationNode | null | undefined): void {
        if (!node) {
            return;
        }
        if (node.type === "CallExpression" || node.type === "NewExpression") {
            report(node);
            // Keep this advisory bounded at the outermost call/new. Calls in its
            // arguments may still have effects and are not classified by this rule.
            return;
        }
        if (
            node.type === "FunctionDeclaration" ||
            node.type === "FunctionExpression" ||
            node.type === "ArrowFunctionExpression" ||
            node.type === "ClassDeclaration" ||
            node.type === "ClassExpression"
        ) {
            return;
        }
        for (const [key, value] of Object.entries(node as unknown as Record<string, unknown>)) {
            if (key === "parent" || key === "range" || key === "loc" || key === "tokens" || key === "comments") {
                continue;
            }
            for (const child of Array.isArray(value) ? value : [value]) {
                if (child && typeof child === "object" && "type" in child) {
                    collectNestedExpressions(child as PureAnnotationNode);
                }
            }
        }
    }

    function isExecutedAtModuleScope(node: ESTree.Node): boolean {
        const ancestors = sourceCode.getAncestors ? sourceCode.getAncestors(node) : (context as any).getAncestors();
        return !ancestors.some((ancestor: ESTree.Node & { static?: boolean }) => {
            return (
                ancestor.type === "FunctionDeclaration" ||
                ancestor.type === "FunctionExpression" ||
                ancestor.type === "ArrowFunctionExpression" ||
                ancestor.type === "MethodDefinition" ||
                (ancestor.type === "PropertyDefinition" && !ancestor.static)
            );
        });
    }

    function checkNestedRoot(node: PureAnnotationNode | null | undefined, coveredByDirectRule: boolean): void {
        if (coveredByDirectRule && findDirectCallOrNew(node)) {
            return;
        }
        collectNestedExpressions(node);
    }

    if (mode === "direct") {
        return {
            "PropertyDefinition[static=true]"(node: any) {
                const callOrNew = findDirectCallOrNew(node.value);
                if (callOrNew) {
                    report(callOrNew);
                }
            },
            "Program > VariableDeclaration > VariableDeclarator"(node: any) {
                const callOrNew = findDirectCallOrNew(node.init);
                if (callOrNew) {
                    report(callOrNew);
                }
            },
            "Program > ExpressionStatement"(node: any) {
                const callOrNew = findDirectCallOrNew(node.expression);
                if (callOrNew) {
                    report(callOrNew);
                }
            },
        };
    }

    return {
        "PropertyDefinition[static=true]"(node: any) {
            if (isExecutedAtModuleScope(node)) {
                checkNestedRoot(node.value, true);
            }
        },
        VariableDeclarator(node: any) {
            if (isExecutedAtModuleScope(node)) {
                const declaration = node.parent;
                checkNestedRoot(node.init, declaration?.type === "VariableDeclaration" && declaration.parent?.type === "Program");
            }
        },
        ExpressionStatement(node: any) {
            if (isExecutedAtModuleScope(node)) {
                checkNestedRoot(node.expression, node.parent?.type === "Program");
            }
        },
    };
}

function isDeclarationKind(kind: ts.SyntaxKind): boolean {
    return (
        kind === ts.SyntaxKind.ArrowFunction ||
        // kind === ts.SyntaxKind.BindingElement ||
        kind === ts.SyntaxKind.ClassDeclaration ||
        kind === ts.SyntaxKind.ClassExpression ||
        kind === ts.SyntaxKind.Constructor ||
        kind === ts.SyntaxKind.EnumDeclaration ||
        kind === ts.SyntaxKind.EnumMember ||
        kind === ts.SyntaxKind.ExportSpecifier ||
        kind === ts.SyntaxKind.FunctionDeclaration ||
        kind === ts.SyntaxKind.FunctionExpression ||
        kind === ts.SyntaxKind.GetAccessor ||
        // kind === ts.SyntaxKind.ImportClause ||
        // kind === ts.SyntaxKind.ImportEqualsDeclaration ||
        // kind === ts.SyntaxKind.ImportSpecifier ||
        kind === ts.SyntaxKind.InterfaceDeclaration ||
        kind === ts.SyntaxKind.JsxAttribute ||
        kind === ts.SyntaxKind.MethodDeclaration ||
        kind === ts.SyntaxKind.MethodSignature ||
        // kind === ts.SyntaxKind.ModuleDeclaration ||
        // kind === ts.SyntaxKind.NamespaceExportDeclaration ||
        // kind === ts.SyntaxKind.NamespaceImport ||
        // kind === ts.SyntaxKind.Parameter ||
        // kind === ts.SyntaxKind.PropertyAssignment ||
        kind === ts.SyntaxKind.PropertyDeclaration ||
        // kind === ts.SyntaxKind.PropertySignature ||
        kind === ts.SyntaxKind.SetAccessor // TODO - setters should technically be documented as well!
        // kind === ts.SyntaxKind.ShorthandPropertyAssignment ||
        // kind === ts.SyntaxKind.TypeAliasDeclaration
        // kind === ts.SyntaxKind.TypeParameter ||
        // kind === ts.SyntaxKind.VariableDeclaration
        // kind === ts.SyntaxKind.JSDocTypedefTag ||
        // kind === ts.SyntaxKind.JSDocCallbackTag ||
        // kind === ts.SyntaxKind.JSDocPropertyTag
    );
}

function getJSDocCommentRanges(node: ts.Node, text: string): ts.CommentRange[] {
    const commentRanges: ts.CommentRange[] = [];

    switch (node.kind) {
        case ts.SyntaxKind.Parameter:
        case ts.SyntaxKind.TypeParameter:
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.ParenthesizedExpression:
            commentRanges.push(...(ts.getTrailingCommentRanges(text, node.pos) || []));
            break;
    }
    commentRanges.push(...(ts.getLeadingCommentRanges(text, node.pos) || []));

    // True if the comment starts with '/**' but not if it is '/**/'
    return commentRanges.filter(
        (comment) =>
            text.charCodeAt(comment.pos + 1) === 0x2a /* ts.CharacterCodes.asterisk */ &&
            text.charCodeAt(comment.pos + 2) === 0x2a /* ts.CharacterCodes.asterisk */ &&
            text.charCodeAt(comment.pos + 3) !== 0x2f /* ts.CharacterCodes.slash */
    );
}

function walkCompilerAstAndFindComments(node: ts.Node, indent: string, notFoundComments: IFoundComment[], sourceText: string, getterSetterFound: string[]): void {
    const buffer: string = sourceText; // node.getSourceFile().getFullText(); // don't use getText() here!

    // Only consider nodes that are part of a declaration form.  Without this, we could discover
    // the same comment twice (e.g. for a MethodDeclaration and its PublicKeyword).
    if (isDeclarationKind(node.kind)) {
        let skip = false;
        ts.getModifiers(node as ts.HasModifiers)?.forEach((modifier) => {
            if (modifier.kind === ts.SyntaxKind.PrivateKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword) {
                skip = true;
            }
        });

        if (!skip) {
            // Find "/** */" style comments associated with this node.
            // Note that this reinvokes the compiler's scanner -- the result is not cached.
            const comments: ts.CommentRange[] = getJSDocCommentRanges(node, buffer);

            const identifier = (node as ts.ParameterDeclaration).name as ts.Identifier;
            if (comments.length === 0) {
                if (identifier) {
                    notFoundComments.push({
                        compilerNode: node,
                        name: identifier.escapedText && identifier.escapedText.toString(),
                        textRange: tsdoc.TextRange.fromStringRange(buffer, identifier ? identifier.pos + 1 : node.pos, identifier ? identifier.end : node.end),
                    });
                }
            } else {
                // if this is a getter or setter
                if (node.kind === ts.SyntaxKind.GetAccessor || node.kind === ts.SyntaxKind.SetAccessor) {
                    getterSetterFound.push(identifier.escapedText.toString());
                } else {
                    // stop iterating anything with @internal
                    const comment = comments[0];
                    // get the comment text
                    const commentTest = tsdoc.TextRange.fromStringRange(buffer, comment.pos, comment.end).toString();
                    if (commentTest.includes("@internal")) {
                        return;
                    }
                }
            }
        }
    }

    return node.forEachChild((child) => walkCompilerAstAndFindComments(child, indent + "  ", notFoundComments, sourceText, getterSetterFound));
}

type TsConfig = {
    compilerOptions: {
        baseUrl: string;
        paths: Record<string, string[]>;
    };
};

let tsConfig: TsConfig | null = null;
function loadTsConfig(projectRoot: string): TsConfig | null {
    if (tsConfig) {
        return tsConfig;
    }

    try {
        const tsconfigPath = path.join(projectRoot, "tsconfig.json");
        const tsconfigContent = fs.readFileSync(tsconfigPath, "utf8");
        // Remove comments and parse JSON
        const cleanJson = tsconfigContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
        tsConfig = JSON.parse(cleanJson);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`BabylonJS custom eslint plugin failed to load tsconfig.json: ${error.message}`);
    }

    return tsConfig;
}

function shouldUsePathMapping(projectRoot: string, importPath: string, filename: string, tsConfig: TsConfig) {
    if (!importPath.startsWith("../") || !tsConfig?.compilerOptions?.paths) {
        return null;
    }

    const { baseUrl = ".", paths } = tsConfig.compilerOptions;

    // Tries to match the file path against the path mappings from the tsconfig
    const findPathInfo = (filename: string) => {
        // Check if this resolved path matches any of the path mappings
        for (const [pathKey, pathValues] of Object.entries(paths)) {
            for (const pathValue of pathValues) {
                // Convert tsconfig path to absolute path
                const absolutePackageRoot = path.resolve(projectRoot, baseUrl, pathValue).replace("*", "");

                // Check if the resolved import matches this path mapping
                if (filename.startsWith(absolutePackageRoot)) {
                    return { pathKey, absolutePackageRoot } as const;
                }
            }
        }

        return null;
    };

    // Resolve the relative import to an absolute path
    const resolvedImportPath = path.resolve(path.dirname(filename), importPath);

    // Try to find a path mapping for the file in question
    const filePathInfo = findPathInfo(filename);

    // Try to find a path mapping for the import in question
    const importPathInfo = findPathInfo(resolvedImportPath);

    // If the pathKeys are the same, it means it is a relative import within the same project/package, which is ok.
    // Otherwise though, the relative path should be replaced with a mapped path.
    if (filePathInfo && importPathInfo && filePathInfo.pathKey !== importPathInfo.pathKey) {
        // Calculate what the import should be
        const relativePart = path.relative(importPathInfo.absolutePackageRoot, resolvedImportPath);

        const suggestedImport = importPathInfo.pathKey
            .replace("*", relativePart)
            .replace(/\\/g, "/") // Normalize to forward slashes
            .replace(/\.(ts|tsx)$/, ""); // Remove extension

        return suggestedImport;
    }

    return null;
}

const plugin: IPlugin = {
    rules: {
        // NOTE: The actual ESLint rule name will be "tsdoc/syntax".  It is calculated by deleting "eslint-plugin-"
        // from the NPM package name, and then appending this string.
        syntax: {
            meta: {
                messages: {
                    "error-loading-config-file": "Issue loading TSDoc config file:\n{{details}}",
                    "error-applying-config": "Issue applying TSDoc configuration: {{details}}",
                    ...tsdocMessageIds,
                },
                type: "problem",
                docs: {
                    description: "Validates that TypeScript documentation comments conform to the TSDoc standard",
                    // This package is experimental
                    recommended: false,
                    url: "https://tsdoc.org/pages/packages/eslint-plugin-tsdoc",
                },
            },
            create: (context: eslint.Rule.RuleContext) => {
                const sourceFilePath: string = context.filename;

                const tsdocConfiguration: TSDocConfiguration = new TSDocConfiguration();

                try {
                    const tsdocConfigFile: TSDocConfigFile = ConfigCache.GetForSourceFile(sourceFilePath);
                    if (!tsdocConfigFile.fileNotFound) {
                        if (tsdocConfigFile.hasErrors) {
                            context.report({
                                loc: { line: 1, column: 1 },
                                messageId: "error-loading-config-file",
                                data: {
                                    details: tsdocConfigFile.getErrorSummary(),
                                },
                            });
                        }

                        try {
                            tsdocConfigFile.configureParser(tsdocConfiguration);
                        } catch (e) {
                            context.report({
                                loc: { line: 1, column: 1 },
                                messageId: "error-applying-config",
                                data: {
                                    details: e.message,
                                },
                            });
                        }
                    }
                } catch (e) {
                    context.report({
                        loc: { line: 1, column: 1 },
                        messageId: "error-loading-config-file",
                        data: {
                            details: `Unexpected exception: ${e.message}`,
                        },
                    });
                }

                const tsdocParser: TSDocParser = new TSDocParser(tsdocConfiguration);

                const sourceCode: eslint.SourceCode = context.sourceCode;
                const checkCommentBlocks: (node: ESTree.Node) => void = function (_node: ESTree.Node) {
                    for (const comment of sourceCode.getAllComments()) {
                        if (comment.type !== "Block") {
                            continue;
                        }
                        if (!comment.range) {
                            continue;
                        }

                        const textRange: TextRange = TextRange.fromStringRange(sourceCode.text, comment.range[0], comment.range[1]);

                        // Smallest comment is "/***/"
                        if (textRange.length < 5) {
                            continue;
                        }
                        // Make sure it starts with "/**"
                        if (textRange.buffer[textRange.pos + 2] !== "*") {
                            continue;
                        }

                        const parserContext: ParserContext = tsdocParser.parseRange(textRange);
                        // if (parserContext.log.messages.length > 0) {
                        //     console.log(`Linting: "${sourceFilePath}"`);
                        // }
                        for (const message of parserContext.log.messages) {
                            if (message.messageId === "tsdoc-param-tag-missing-hyphen") {
                                continue;
                            }
                            // console.log(message.messageId, message.unformattedText);
                            if (message.messageId === "tsdoc-undefined-tag") {
                                if (allowedTags.some((tag) => message.unformattedText.includes(tag))) {
                                    continue;
                                }
                            }
                            context.report({
                                loc: {
                                    start: sourceCode.getLocFromIndex(message.textRange.pos),
                                    end: sourceCode.getLocFromIndex(message.textRange.end),
                                },
                                messageId: message.messageId,
                                data: {
                                    unformattedText: message.unformattedText,
                                },
                            });
                        }
                    }
                };

                return {
                    Program: checkCommentBlocks,
                };
            },
        },
        available: {
            meta: {
                messages: {
                    "error-no-doc-found": "Issue finding code doc for: {{name}}",
                    ...tsdocMessageIds,
                },
                type: "problem",
                docs: {
                    description: "Make sure documentation is available for public members",
                    // This package is experimental
                    recommended: false,
                    url: "https://tsdoc.org/pages/packages/eslint-plugin-tsdoc",
                },
                schema: [
                    {
                        type: "object",
                        properties: {
                            contexts: {
                                type: "array",
                                items: { type: "string" },
                            },
                        },
                        additionalProperties: false,
                    },
                ],
            },
            create: (context: eslint.Rule.RuleContext) => {
                const sourceCode: eslint.SourceCode = context.sourceCode;
                const checkCommentBlocks: (node: (ESTree.PropertyDefinition | ESTree.MethodDefinition) & eslint.Rule.NodeParentExtension) => void = function (
                    node: (ESTree.PropertyDefinition | ESTree.MethodDefinition) & eslint.Rule.NodeParentExtension
                ) {
                    const text = sourceCode.getText(node);
                    // avoid private, protected and hidden public
                    if (text.includes("private ") || text.includes("protected ") || text.includes("public _")) {
                        return;
                    }
                    if (sourceCode.getCommentsBefore(node).length === 0) {
                        // check if  another one with the same name has a comment (for example getter/setter)
                        const tokens = sourceCode.getTokensBefore(node, {
                            filter: (token) => token.value === (node.key as ESTree.Identifier).name,
                        });
                        if (tokens.length) {
                            const hasComment = tokens.some((token) => {
                                const node = sourceCode.getNodeByRangeIndex(token.range[0]);

                                return (
                                    node &&
                                    (node as any).parent &&
                                    (node as any).parent.type === "MethodDefinition" &&
                                    sourceCode.getCommentsBefore((node as any).parent).length > 0
                                );
                            });
                            if (hasComment) {
                                return;
                            }
                        }

                        // }
                        context.report({
                            loc: {
                                start: sourceCode.getLocFromIndex(node.key?.range![0]),
                                end: sourceCode.getLocFromIndex(node.key?.range![1]),
                            },
                            messageId: "error-no-doc-found",
                            data: {
                                name: (node.key as ESTree.Identifier).name,
                            },
                        });
                    }
                };

                return {
                    // Program: checkCommentBlocks,
                    MethodDefinition: checkCommentBlocks,
                    PropertyDefinition: checkCommentBlocks,
                };
            },
        },
        existing: {
            meta: {
                messages: {
                    "error-no-tsdoc-found": "No TSDoc Found for {{details}}",
                },
                type: "problem",
                docs: {
                    description: "Make sure a comment exists",
                    recommended: false,
                    url: "https://tsdoc.org/pages/packages/eslint-plugin-tsdoc",
                },
            },
            create: (context: eslint.Rule.RuleContext) => {
                const sourceFilePath: string = context.filename;
                const program: ts.Program = ts.createProgram([sourceFilePath], {
                    checkJs: false,
                    resolveJsonModule: false,
                    declaration: false,
                    noEmit: true,
                    stripInternal: true,
                    noLib: true,
                    noResolve: true,
                    strictNullChecks: false,
                    strictPropertyInitialization: false,
                    skipLibCheck: true,
                    skipDefaultLibCheck: true,
                    sourceMap: false,
                    inlineSourceMap: false,
                });

                const sourceCode: eslint.SourceCode = context.sourceCode;
                const sourceFile: ts.SourceFile | undefined = program.getSourceFile(sourceFilePath);
                if (!sourceFile) {
                    throw new Error("Error retrieving source file");
                }

                const checkCommentBlocks: (node: ESTree.Node) => void = function (_node: ESTree.Node) {
                    const foundComments: IFoundComment[] = [];
                    const gettersSetters: string[] = [];
                    walkCompilerAstAndFindComments(sourceFile, "", foundComments, sourceCode.getText(), gettersSetters);
                    for (const notFoundNode of foundComments) {
                        // check if it is a getter/setter
                        if (gettersSetters.includes(notFoundNode.name)) {
                            continue;
                        }
                        context.report({
                            loc: {
                                start: sourceCode.getLocFromIndex(notFoundNode.textRange.pos),
                                end: sourceCode.getLocFromIndex(notFoundNode.textRange.end),
                            },
                            messageId: "error-no-tsdoc-found",
                            data: {
                                details: (notFoundNode.compilerNode as any).name ? (notFoundNode.compilerNode as any).name.escapedText : "",
                            },
                        });
                    }
                };

                return {
                    Program: checkCommentBlocks,
                };
            },
        },
        "no-cross-package-relative-imports": {
            meta: {
                type: "problem",
                docs: {
                    description: "Prevent relative imports that should use TypeScript path mappings",
                },
                fixable: "code",
                messages: {
                    usePathMapping: 'Use path mapping "{{suggestion}}" instead of relative import "{{importPath}}".',
                },
            },
            create(context) {
                const filename = context.filename;
                const projectRoot = filename.split("packages")[0];
                return {
                    Program() {
                        // Load tsconfig (it will only be loaded upon first request).
                        tsConfig = loadTsConfig(projectRoot);
                    },

                    ImportDeclaration(node) {
                        const importPath = node.source.value as string;
                        const filename = context.filename;

                        const suggestion = shouldUsePathMapping(projectRoot, importPath, filename, tsConfig!);

                        if (suggestion) {
                            context.report({
                                node,
                                messageId: "usePathMapping",
                                data: {
                                    importPath,
                                    suggestion,
                                },
                                fix(fixer) {
                                    return fixer.replaceText(node.source, `"${suggestion}"`);
                                },
                            });
                        }
                    },
                };
            },
        },
        "no-directory-barrel-imports": {
            meta: {
                type: "problem",
                docs: {
                    description:
                        "Prevent imports from directories with index files (barrel imports) when using path mappings, as these cause issues with .js extension appending during build",
                },
                messages: {
                    noDirectoryBarrelImport:
                        'Import "{{importPath}}" resolves to a directory with an index file. Import directly from the specific file instead to avoid build issues with .js extension appending.',
                },
            },
            create(context) {
                const filename = context.filename;
                const projectRoot = filename.split("packages")[0];

                // Check if path is a directory with index.ts but no same-name .ts file
                function reportIfBarrel(targetPath: string, node: ESTree.Node, importPath: string): boolean {
                    try {
                        if (!fs.statSync(targetPath).isDirectory()) {
                            return false;
                        }
                        if (!fs.existsSync(path.join(targetPath, "index.ts"))) {
                            return false;
                        }
                        // Before flagging, check if a file with the same name exists.
                        // Module resolution prefers files over directories, so if i.e.
                        // abstractEngine.ts exists alongside AbstractEngine/, the import
                        // will correctly resolve to the file.
                        if (fs.existsSync(targetPath + ".ts") && fs.statSync(targetPath + ".ts").isFile()) {
                            return false;
                        }
                        context.report({ node, messageId: "noDirectoryBarrelImport", data: { importPath } });
                        return true;
                    } catch {
                        // Path doesn't exist, that's fine
                    }
                    return false;
                }

                return {
                    Program() {
                        // Load tsconfig (it will only be loaded upon first request).
                        tsConfig = loadTsConfig(projectRoot);
                    },

                    ImportDeclaration(node) {
                        // Skip type-only imports as they are erased during compilation
                        // The importKind property is added by TypeScript-ESLint parser
                        if ((node as any).importKind === "type") {
                            return;
                        }

                        // Skip imports where all specifiers are inline type imports (e.g. import { type Foo } from "...")
                        // These are also erased during compilation and won't cause .js extension issues
                        if (node.specifiers.length > 0 && node.specifiers.every((s) => s.type === "ImportSpecifier" && (s as any).importKind === "type")) {
                            return;
                        }

                        const importPath = node.source.value as string;

                        // Relative imports
                        if (importPath.startsWith(".")) {
                            reportIfBarrel(path.resolve(path.dirname(filename), importPath), node, importPath);
                            return;
                        }

                        // Path-mapped imports - if no mappings defined, remaining imports are bare node_modules
                        if (!tsConfig?.compilerOptions?.paths) {
                            return;
                        }
                        const { baseUrl = ".", paths } = tsConfig.compilerOptions;

                        for (const [pathKey, pathValues] of Object.entries(paths)) {
                            // Handle patterns like "core/*"
                            const pathPrefix = pathKey.replace("/*", "");
                            if (!importPath.startsWith(pathPrefix + "/")) {
                                continue;
                            }

                            // Get the rest of the path after the mapping prefix
                            const restOfPath = importPath.slice(pathPrefix.length + 1);

                            // Resolve the actual directory path(s)
                            // pathValues is an array, though generally of length 1 in BabylonJS
                            for (const pathValue of pathValues) {
                                const resolvedBase = path.resolve(projectRoot, baseUrl, pathValue.replace("/*", ""));
                                if (reportIfBarrel(path.join(resolvedBase, restOfPath), node, importPath)) {
                                    return;
                                }
                            }
                        }
                    },
                };
            },
        },
        "no-super-in-accessor": {
            meta: {
                type: "problem",
                docs: {
                    description:
                        "Disallow super.<member> property access inside a get/set accessor. Babylon Native downlevels the UMD bundle to ES5, where TypeScript can mis-compile `super` access inside a decorated accessor to `undefined`. Use a private backing field instead.",
                },
                messages: {
                    superInAccessor:
                        "super.{{member}} inside a get/set accessor can mis-compile to `undefined` when the UMD bundle is downleveled to ES5 for Babylon Native, even though it works in dev/ESM. Use a private backing field instead (see TargetCamera._targetInertia).",
                },
            },
            create(context: eslint.Rule.RuleContext) {
                const sourceCode = context.sourceCode;

                function isAccessorValue(fnNode: ESTree.Node, parent: ESTree.Node | undefined): boolean {
                    return (
                        !!parent &&
                        (parent.type === "MethodDefinition" || parent.type === "Property") &&
                        ((parent as any).kind === "get" || (parent as any).kind === "set") &&
                        (parent as any).value === fnNode
                    );
                }

                return {
                    MemberExpression(node: ESTree.MemberExpression & eslint.Rule.NodeParentExtension) {
                        if (node.object.type !== "Super") {
                            return;
                        }
                        // Allow super method calls: `super.foo(...)` are emitted differently and are not affected.
                        const parent = (node as any).parent as ESTree.Node | undefined;
                        if (parent && parent.type === "CallExpression" && (parent as ESTree.CallExpression).callee === (node as ESTree.Node)) {
                            return;
                        }

                        const ancestors = sourceCode.getAncestors ? sourceCode.getAncestors(node) : (context as any).getAncestors();
                        // Walk nearest -> farthest. Arrow functions are transparent to `super`, so skip them
                        // and stop at the first `super`-binding (non-arrow) function: if that function is the
                        // value of a get/set accessor, this `super` access is the risky pattern.
                        for (let i = ancestors.length - 1; i >= 0; i--) {
                            const a = ancestors[i] as ESTree.Node;
                            if (a.type === "ArrowFunctionExpression") {
                                continue;
                            }
                            if (a.type === "FunctionExpression" || a.type === "FunctionDeclaration") {
                                if (isAccessorValue(a, ancestors[i - 1] as ESTree.Node | undefined)) {
                                    context.report({
                                        node,
                                        messageId: "superInAccessor",
                                        data: { member: node.computed ? "[…]" : ((node.property as ESTree.Identifier).name ?? "<member>") },
                                    });
                                }
                                return;
                            }
                        }
                    },
                };
            },
        },
        "require-context-save-before-apply-states": {
            meta: {
                type: "problem",
                docs: {
                    description: "Require context.save() and context.restore() to be called around this._applyStates(context) calls",
                },
                messages: {
                    missingSave:
                        "Unless this is a temporary context, context.save() must be called before this._applyStates(context). Remember to also call context.restore() at the appropriate location to restore the canvas state.",
                },
            },
            create(context: eslint.Rule.RuleContext) {
                type BalanceSet = Set<number>;

                const isFunctionNode = (node: ESTree.Node): node is ESTree.FunctionDeclaration | ESTree.FunctionExpression | ESTree.ArrowFunctionExpression =>
                    node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression";

                const containsNode = (container: ESTree.Node, target: ESTree.Node): boolean =>
                    !!container.range && !!target.range && container.range[0] <= target.range[0] && container.range[1] >= target.range[1];

                function getContextOperation(node: ESTree.Node | null | undefined, contextName: string): "save" | "restore" | null {
                    if (
                        node?.type !== "CallExpression" ||
                        node.callee.type !== "MemberExpression" ||
                        node.callee.computed ||
                        node.callee.object.type !== "Identifier" ||
                        node.callee.object.name !== contextName ||
                        node.callee.property.type !== "Identifier"
                    ) {
                        return null;
                    }
                    return node.callee.property.name === "save" || node.callee.property.name === "restore" ? node.callee.property.name : null;
                }

                function applyOperation(balances: BalanceSet, operation: "save" | "restore"): BalanceSet {
                    return new Set(
                        [...balances].map((balance) => {
                            if (operation === "save") {
                                return Math.min(balance + 1, 32);
                            }
                            return Math.max(balance - 1, 0);
                        })
                    );
                }

                function transferExpression(expression: ESTree.Expression, contextName: string, balances: BalanceSet): BalanceSet {
                    const operation = getContextOperation(expression, contextName);
                    if (operation) {
                        return applyOperation(balances, operation);
                    }
                    if (expression.type === "SequenceExpression") {
                        return expression.expressions.reduce((current, child) => transferExpression(child, contextName, current), balances);
                    }
                    if (expression.type === "LogicalExpression") {
                        const afterLeft = transferExpression(expression.left, contextName, balances);
                        return new Set([...afterLeft, ...transferExpression(expression.right, contextName, new Set(afterLeft))]);
                    }
                    if (expression.type === "ConditionalExpression") {
                        const afterTest = transferExpression(expression.test, contextName, balances);
                        return new Set([
                            ...transferExpression(expression.consequent, contextName, new Set(afterTest)),
                            ...transferExpression(expression.alternate, contextName, new Set(afterTest)),
                        ]);
                    }
                    return containsContextRestore(expression, contextName) ? new Set([...balances, 0]) : balances;
                }

                function containsContextRestore(node: ESTree.Node, contextName: string): boolean {
                    if (getContextOperation(node, contextName) === "restore") {
                        return true;
                    }
                    if (isFunctionNode(node)) {
                        return false;
                    }
                    for (const [key, value] of Object.entries(node as unknown as Record<string, unknown>)) {
                        if (key === "parent" || key === "range" || key === "loc") {
                            continue;
                        }
                        for (const child of Array.isArray(value) ? value : [value]) {
                            if (child && typeof child === "object" && "type" in child && containsContextRestore(child as ESTree.Node, contextName)) {
                                return true;
                            }
                        }
                    }
                    return false;
                }

                function transferStatement(statement: ESTree.Statement, contextName: string, balances: BalanceSet): BalanceSet {
                    switch (statement.type) {
                        case "ExpressionStatement":
                            return transferExpression(statement.expression, contextName, balances);
                        case "BlockStatement":
                            return statement.body.reduce((current, child) => transferStatement(child, contextName, current), balances);
                        case "IfStatement": {
                            const afterTest = transferExpression(statement.test, contextName, balances);
                            const consequent = transferStatement(statement.consequent, contextName, new Set(afterTest));
                            const alternate = statement.alternate ? transferStatement(statement.alternate, contextName, new Set(afterTest)) : new Set(afterTest);
                            return new Set([...consequent, ...alternate]);
                        }
                        case "TryStatement": {
                            const successful = transferStatement(statement.block, contextName, new Set(balances));
                            const attempted = statement.handler ? transferStatement(statement.handler.body, contextName, new Set(balances)) : new Set<never>();
                            const combined = new Set([...successful, ...attempted]);
                            if (statement.handler && containsContextRestore(statement.block, contextName)) {
                                combined.add(0);
                            }
                            return statement.finalizer ? transferStatement(statement.finalizer, contextName, combined) : combined;
                        }
                        case "DoWhileStatement":
                        case "ForStatement":
                        case "ForInStatement":
                        case "ForOfStatement":
                        case "WhileStatement": {
                            // Repeated restores can exhaust any finite number of saves.
                            return containsContextRestore(statement, contextName) ? new Set([...balances, 0]) : balances;
                        }
                        case "SwitchStatement": {
                            const outcomes = new Set(balances);
                            for (const switchCase of statement.cases) {
                                const caseOutcome = switchCase.consequent.reduce((current, child) => transferStatement(child, contextName, current), new Set(balances));
                                caseOutcome.forEach((balance) => outcomes.add(balance));
                            }
                            return outcomes;
                        }
                        case "ReturnStatement":
                        case "ThrowStatement":
                            return new Set();
                        case "FunctionDeclaration":
                            return balances;
                        default:
                            return balances;
                    }
                }

                function balancesBeforeTarget(container: ESTree.Node, target: ESTree.Node, contextName: string, balances: BalanceSet): BalanceSet {
                    if (container === target) {
                        return balances;
                    }
                    if (container.type === "BlockStatement") {
                        let current = balances;
                        for (const statement of container.body) {
                            if (containsNode(statement, target)) {
                                return balancesBeforeTarget(statement, target, contextName, current);
                            }
                            current = transferStatement(statement, contextName, current);
                        }
                        return current;
                    }
                    if (container.type === "IfStatement") {
                        const afterTest = transferExpression(container.test, contextName, balances);
                        if (containsNode(container.consequent, target)) {
                            return balancesBeforeTarget(container.consequent, target, contextName, afterTest);
                        }
                        if (container.alternate && containsNode(container.alternate, target)) {
                            return balancesBeforeTarget(container.alternate, target, contextName, afterTest);
                        }
                    }
                    if (
                        container.type === "ForStatement" ||
                        container.type === "ForInStatement" ||
                        container.type === "ForOfStatement" ||
                        container.type === "WhileStatement" ||
                        container.type === "DoWhileStatement"
                    ) {
                        if (containsNode(container.body, target)) {
                            const loopEntryBalances = containsContextRestore(container.body, contextName) ? new Set([...balances, 0]) : balances;
                            return balancesBeforeTarget(container.body, target, contextName, loopEntryBalances);
                        }
                    }
                    if (container.type === "SequenceExpression") {
                        let current = balances;
                        for (const expression of container.expressions) {
                            if (containsNode(expression, target)) {
                                return balancesBeforeTarget(expression, target, contextName, current);
                            }
                            current = transferExpression(expression, contextName, current);
                        }
                        return current;
                    }
                    if (container.type === "TryStatement") {
                        if (containsNode(container.block, target)) {
                            return balancesBeforeTarget(container.block, target, contextName, balances);
                        }
                        if (container.handler && containsNode(container.handler.body, target)) {
                            return balancesBeforeTarget(container.handler.body, target, contextName, balances);
                        }
                        if (container.finalizer && containsNode(container.finalizer, target)) {
                            return balancesBeforeTarget(container.finalizer, target, contextName, balances);
                        }
                    }

                    for (const [key, value] of Object.entries(container as unknown as Record<string, unknown>)) {
                        if (key === "parent" || key === "range" || key === "loc" || key === "tokens" || key === "comments") {
                            continue;
                        }
                        const children = Array.isArray(value) ? value : [value];
                        for (const child of children) {
                            if (!child || typeof child !== "object" || !("type" in child)) {
                                continue;
                            }
                            const childNode = child as ESTree.Node;
                            if (!isFunctionNode(childNode) && containsNode(childNode, target)) {
                                return balancesBeforeTarget(childNode, target, contextName, balances);
                            }
                        }
                    }
                    return balances;
                }

                return {
                    CallExpression(node: ESTree.CallExpression & eslint.Rule.NodeParentExtension) {
                        // Check if this is a call to this._applyStates(context)
                        if (
                            node.callee.type === "MemberExpression" &&
                            node.callee.object.type === "ThisExpression" &&
                            node.callee.property.type === "Identifier" &&
                            node.callee.property.name === "_applyStates" &&
                            node.arguments.length > 0 &&
                            node.arguments[0].type === "Identifier"
                        ) {
                            const contextParam = (node.arguments[0] as ESTree.Identifier).name;

                            // Find the containing function/method
                            let currentNode: ESTree.Node | undefined = node.parent;
                            let functionBody: ESTree.BlockStatement | null = null;

                            while (currentNode) {
                                if (isFunctionNode(currentNode)) {
                                    const body = currentNode.body;
                                    functionBody = body.type === "BlockStatement" ? body : null;
                                    break;
                                }
                                currentNode = (currentNode as ESTree.Node & eslint.Rule.NodeParentExtension).parent;
                            }

                            if (!functionBody || !node.range) {
                                return;
                            }

                            const balances = balancesBeforeTarget(functionBody, node, contextParam, new Set([0]));
                            if (balances.size === 0 || [...balances].some((balance) => balance === 0)) {
                                context.report({
                                    node,
                                    messageId: "missingSave",
                                });
                            }
                        }
                    },
                };
            },
        },

        /**
         * Require `#__PURE__` annotations on top-level call / new expressions
         * and static field initializers inside `.pure.ts` files.
         *
         * These annotations tell bundlers (Rollup, Webpack) that the call has no
         * side effects and can be tree-shaken when the result is unused.
         */
        "require-pure-annotation": {
            meta: {
                type: "problem",
                fixable: "code",
                docs: {
                    description: "Require /*#__PURE__*/ on call/new expressions at module scope in .pure.ts files",
                },
                messages: {
                    "missing-pure-annotation":
                        "Call/new expression in a .pure.ts file must be annotated with /*#__PURE__*/. " + "Without it, bundlers cannot tree-shake this code. Expression: {{expr}}",
                },
            },
            create(context: eslint.Rule.RuleContext) {
                return createPureAnnotationVisitors(context, "direct");
            },
        },
        "require-nested-pure-annotation": {
            meta: {
                type: "suggestion",
                docs: {
                    description: "Review nested call/new expressions executed during module initialization in .pure.ts files",
                },
                messages: {
                    "nested-pure-review":
                        "Nested module-initializer expression requires review for side effects. Add /*#__PURE__*/ only when the call/constructor and its evaluated inputs are known to be side-effect-free. Expression: {{expr}}",
                },
            },
            create(context: eslint.Rule.RuleContext) {
                return createPureAnnotationVisitors(context, "nested");
            },
        },

        /**
         * Disallow side-effect (bare) imports in `.pure.ts` files and ensure
         * barrel `pure.ts` files only re-export from safe (pure) sources.
         *
         * `.pure.ts` files should be completely free of runtime side effects.
         * Bare imports like `import "some/module"` exist solely for their side
         * effects (prototype augmentation, shader registration, etc.) and defeat
         * the purpose of the pure split.
         *
         * Barrel `pure.ts` files should only re-export from modules that are
         * side-effect-free according to the manifest (or by naming convention).
         */
        "no-side-effect-imports-in-pure": {
            meta: {
                type: "problem",
                docs: {
                    description: "Disallow side-effect imports in .pure.ts files",
                    recommended: false,
                },
                messages: {
                    bareImport:
                        'Bare import "{{source}}" introduces side effects in a .pure.ts file. ' + "Move it to the non-pure counterpart or guard with an eslint-disable comment.",
                    unsafeBarrelReExport: 'Import or re-export from "{{source}}" in a pure file pulls in a module with side effects. ' + "Only reference side-effect-free modules.",
                    unsafeDynamicImport: 'Dynamic import from "{{source}}" in a .pure.ts file selects a side-effect wrapper. ' + "Import from the .pure counterpart instead.",
                    unsafeValueImport:
                        'Import from "{{source}}" in a .pure.ts file pulls in a module with side effects. ' +
                        "Import from the .pure counterpart instead, or use a type-only import.",
                },
                schema: [],
            },
            create(context: eslint.Rule.RuleContext) {
                const filename = (context as unknown as any).filename ?? (context as unknown as any).getFilename?.() ?? "";

                // Only applies to files ending in .pure.ts or named pure.ts
                const isPureFile = /\.pure\.[tj]sx?$/.test(filename) || /[/\\]pure\.[tj]sx?$/.test(filename);
                if (!isPureFile) {
                    return {};
                }

                const isBarrelPure = /[/\\]pure\.[tj]sx?$/.test(filename);

                type BabylonPackageName = "core" | "gui" | "loaders" | "serializers";
                type ResolvedImport = {
                    packageName: BabylonPackageName;
                    relativePath: string;
                };

                const packageNames = new Set<BabylonPackageName>(["core", "gui", "loaders", "serializers"]);

                /**
                 * Resolve an import source to its package and manifest-relative path.
                 * @param source - The import specifier to resolve.
                 * @returns The resolved package/path, or null for external imports.
                 */
                function resolveImport(source: string): ResolvedImport | null {
                    let packageName: BabylonPackageName;
                    let relativePath: string;
                    if (source.startsWith(".")) {
                        const resolved = path.resolve(path.dirname(filename), source).replace(/\\/g, "/");
                        const match = /\/packages\/dev\/(core|gui|loaders|serializers)\/src\/(.+)$/.exec(resolved);
                        if (!match || !packageNames.has(match[1] as BabylonPackageName)) {
                            return null;
                        }
                        packageName = match[1] as BabylonPackageName;
                        relativePath = match[2];
                    } else {
                        const match = /^(?:@babylonjs\/)?(core|gui|loaders|serializers)(?:\/(.*))?$/.exec(source);
                        if (!match || !packageNames.has(match[1] as BabylonPackageName)) {
                            return null;
                        }
                        packageName = match[1] as BabylonPackageName;
                        relativePath = match[2] || "index";
                    }

                    relativePath = relativePath.replace(/\\/g, "/").replace(/\.(?:js|mjs|ts|tsx)$/, "");
                    return { packageName, relativePath };
                }

                function isManifestSideEffect(resolvedImport: ResolvedImport): boolean | null {
                    const manifest = loadSideEffectsSet(resolvedImport.packageName);
                    if (!manifest.available) {
                        return null;
                    }
                    return [".ts", ".tsx", "/index.ts"].some((extension) => manifest.files.has(resolvedImport.relativePath + extension));
                }

                /**
                 * Check whether an import source is known to have side effects
                 * according to the manifest.  Falls back to naming-convention
                 * heuristics when the manifest is unavailable.
                 * @param source - The import specifier to check.
                 * @returns True if the source has side effects.
                 */
                function hasSideEffects(source: string): boolean {
                    const resolvedImport = resolveImport(source);
                    if (!resolvedImport) {
                        return false;
                    }
                    const manifestResult = isManifestSideEffect(resolvedImport);
                    if (manifestResult !== null) {
                        return manifestResult;
                    }
                    // Fallback: naming-convention check (inverse — safe sources)
                    return !isSafeSourceByName(source);
                }

                function isSafeSourceByName(source: string): boolean {
                    return (
                        /\.pure$/.test(source) ||
                        /\.functions$/.test(source) ||
                        /[/\\]pure$/.test(source) ||
                        /ThinMaths[/\\]/.test(source) ||
                        /math\.constants$/.test(source) ||
                        /math\.like$/.test(source) ||
                        /[/\\]types$/.test(source) ||
                        /arrayTools$/.test(source) ||
                        /[/\\]tensor$/.test(source)
                    );
                }

                function hasPureCounterpart(source: string): boolean {
                    const normalizedSource = source.replace(/\.(?:js|mjs|ts|tsx)$/, "");
                    if (normalizedSource.endsWith(".pure")) {
                        return false;
                    }

                    let resolved: string;
                    if (normalizedSource.startsWith(".")) {
                        resolved = path.resolve(path.dirname(filename), normalizedSource);
                    } else {
                        const packageImport = /^(?:@babylonjs\/)?(core|gui|loaders|serializers)(?:\/(.*))?$/.exec(normalizedSource);
                        if (!packageImport) {
                            return false;
                        }

                        const packagesMatch = /[/\\]packages[/\\]dev[/\\]/.exec(filename);
                        if (!packagesMatch) {
                            return false;
                        }

                        const repoRoot = filename.substring(0, packagesMatch.index);
                        resolved = path.join(repoRoot, "packages", "dev", packageImport[1], "src", packageImport[2] || "index");
                    }

                    return fs.existsSync(`${resolved}.pure.ts`) || fs.existsSync(`${resolved}.pure.tsx`);
                }

                return {
                    // Bare imports: import "foo"
                    ImportDeclaration(node: any) {
                        // import type { ... } from "..." — always safe
                        if (node.importKind === "type") {
                            return;
                        }

                        const source: string = node.source?.value ?? "";

                        // Bare import (no specifiers) — always a side-effect import
                        if (node.specifiers.length === 0) {
                            context.report({
                                node,
                                messageId: "bareImport",
                                data: { source },
                            });
                            return;
                        }

                        // Check that value imports come from side-effect-free sources
                        if (hasSideEffects(source)) {
                            // Check if ALL specifiers are type-only
                            const allTypeOnly = node.specifiers.every((s: any) => s.importKind === "type");
                            if (!allTypeOnly) {
                                context.report({
                                    node,
                                    messageId: isBarrelPure ? "unsafeBarrelReExport" : "unsafeValueImport",
                                    data: { source },
                                });
                            }
                        }
                    },

                    // Re-exports: export * from "foo", export { x } from "foo"
                    ExportNamedDeclaration(node: any) {
                        if (!node.source) {
                            return;
                        }
                        // export type { ... } from "..." — always safe
                        if (node.exportKind === "type") {
                            return;
                        }
                        const source: string = node.source.value ?? "";
                        if (hasSideEffects(source)) {
                            const allTypeOnly = node.specifiers.length > 0 && node.specifiers.every((s: any) => s.exportKind === "type");
                            if (!allTypeOnly) {
                                context.report({
                                    node,
                                    messageId: "unsafeBarrelReExport",
                                    data: { source },
                                });
                            }
                        }
                    },

                    ExportAllDeclaration(node: any) {
                        if (!node.source) {
                            return;
                        }
                        if (node.exportKind === "type") {
                            return;
                        }
                        const source: string = node.source.value ?? "";
                        if (hasSideEffects(source)) {
                            context.report({
                                node,
                                messageId: "unsafeBarrelReExport",
                                data: { source },
                            });
                        }
                    },

                    ImportExpression(node: any) {
                        const source = typeof node.source?.value === "string" ? node.source.value : undefined;
                        if (source && hasPureCounterpart(source)) {
                            context.report({
                                node,
                                messageId: "unsafeDynamicImport",
                                data: { source },
                            });
                        }
                    },
                };
            },
        },
    },
};

let sideEffectsManifestRoot: string | null | undefined;
let sideEffectsManifestLoader: SideEffectsManifestLoader | undefined;

/**
 * Load one package's manifest shards. Cache validation is throttled so a
 * manifest edit is observed by a long-lived editor process without doing
 * filesystem work for every import.
 * @param packageName - Package whose side-effect manifest should be loaded.
 * @returns The package's side-effect files and whether its manifest was available.
 */
function loadSideEffectsSet(packageName: SideEffectsPackageName) {
    if (sideEffectsManifestRoot === undefined) {
        sideEffectsManifestRoot = FindSideEffectsManifestRoot(__dirname);
    }
    if (!sideEffectsManifestRoot) {
        return { available: false, files: new Set() };
    }
    sideEffectsManifestLoader ??= new SideEffectsManifestLoader(sideEffectsManifestRoot);
    return sideEffectsManifestLoader.load(packageName);
}

export = plugin;

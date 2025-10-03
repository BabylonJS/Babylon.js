/* eslint-disable @typescript-eslint/naming-convention */
import type * as eslint from "eslint";
import type * as ESTree from "estree";
import type { ParserContext } from "@microsoft/tsdoc";
import { TSDocConfiguration, TSDocParser, TextRange } from "@microsoft/tsdoc";
import * as tsdoc from "@microsoft/tsdoc";
import type { TSDocConfigFile } from "@microsoft/tsdoc-config";
import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

// import { Debug } from "./Debug";
import { ConfigCache } from "./ConfigCache";

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
                    category: "Stylistic Issues",
                    // This package is experimental
                    recommended: false,
                    url: "https://tsdoc.org/pages/packages/eslint-plugin-tsdoc",
                },
            },
            create: (context: eslint.Rule.RuleContext) => {
                const sourceFilePath: string = context.getFilename();

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

                const sourceCode: eslint.SourceCode = context.getSourceCode();
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
                    category: "Stylistic Issues",
                    // This package is experimental
                    recommended: false,
                    url: "https://tsdoc.org/pages/packages/eslint-plugin-tsdoc",
                },
            },
            create: (context: eslint.Rule.RuleContext) => {
                const sourceCode: eslint.SourceCode = context.getSourceCode();
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
                    category: "Stylistic Issues",
                    recommended: false,
                    url: "https://tsdoc.org/pages/packages/eslint-plugin-tsdoc",
                },
            },
            create: (context: eslint.Rule.RuleContext) => {
                const sourceFilePath: string = context.getFilename();
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

                const sourceCode: eslint.SourceCode = context.getSourceCode();
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
            create(context) {
                return {
                    CallExpression(node) {
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
                            let currentNode: any = node.parent;
                            let functionNode: ESTree.Node | null = null;

                            while (currentNode) {
                                if (
                                    currentNode.type === "FunctionDeclaration" ||
                                    currentNode.type === "FunctionExpression" ||
                                    currentNode.type === "ArrowFunctionExpression" ||
                                    currentNode.type === "MethodDefinition"
                                ) {
                                    functionNode = currentNode;
                                    break;
                                }
                                currentNode = currentNode.parent;
                            }

                            if (!functionNode) {
                                return;
                            }

                            // Get the function body
                            let functionBody: ESTree.BlockStatement | null = null;
                            if (functionNode.type === "MethodDefinition") {
                                const methodDef = functionNode as ESTree.MethodDefinition;
                                if (methodDef.value.type === "FunctionExpression") {
                                    functionBody = methodDef.value.body;
                                }
                            } else if (functionNode.type === "ArrowFunctionExpression") {
                                const arrowFunc = functionNode as ESTree.ArrowFunctionExpression;
                                functionBody = arrowFunc.body.type === "BlockStatement" ? arrowFunc.body : null;
                            } else if (functionNode.type === "FunctionDeclaration" || functionNode.type === "FunctionExpression") {
                                const func = functionNode as ESTree.FunctionDeclaration | ESTree.FunctionExpression;
                                functionBody = func.body;
                            }

                            if (!functionBody || functionBody.type !== "BlockStatement" || !node.range) {
                                return;
                            }

                            // Look for context.save() call before this._applyStates call
                            const applyStatesPosition = node.range[0];
                            let contextSaveFound = false;

                            // Check all statements in the function body
                            const checkForContextSave = (statements: ESTree.Statement[]): void => {
                                for (const statement of statements) {
                                    if (statement.range && statement.range[1] >= applyStatesPosition) {
                                        // We've reached or passed the _applyStates call
                                        break;
                                    }

                                    // Check if this statement contains context.save()
                                    if (hasContextSaveCall(statement, contextParam)) {
                                        contextSaveFound = true;
                                        break;
                                    }
                                }
                            };

                            const hasContextSaveCall = (node: any, contextParam: string): boolean => {
                                if (!node) {
                                    return false;
                                }

                                if (node.type === "ExpressionStatement" && node.expression.type === "CallExpression") {
                                    const callExpr = node.expression;
                                    if (
                                        callExpr.callee.type === "MemberExpression" &&
                                        callExpr.callee.object.type === "Identifier" &&
                                        callExpr.callee.object.name === contextParam &&
                                        callExpr.callee.property.type === "Identifier" &&
                                        callExpr.callee.property.name === "save"
                                    ) {
                                        return true;
                                    }
                                }

                                // Recursively check child nodes
                                for (const key in node) {
                                    if (key === "parent" || key === "range" || key === "loc") {
                                        continue;
                                    }
                                    const child = node[key];
                                    if (Array.isArray(child)) {
                                        for (const item of child) {
                                            if (item && typeof item === "object" && hasContextSaveCall(item, contextParam)) {
                                                return true;
                                            }
                                        }
                                    } else if (child && typeof child === "object" && hasContextSaveCall(child, contextParam)) {
                                        return true;
                                    }
                                }

                                return false;
                            };

                            checkForContextSave(functionBody.body);

                            if (!contextSaveFound) {
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
    },
};

export = plugin;

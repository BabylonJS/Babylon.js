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
        "no-downlevel-iteration": {
            meta: {
                type: "problem",
                docs: {
                    description: "Disallow for...of loops and spread syntax on non-array iterables that break in the UMD build (ES5 target) without --downlevelIteration",
                },
                messages: {
                    forOfNonArray:
                        'for...of over a non-array iterable ({{typeName}}) will not work in the UMD build (ES5 target) without --downlevelIteration. Convert to an array first, e.g. "for (const x of Array.from(iterable))".',
                    spreadNonArray:
                        'Spreading a non-array iterable ({{typeName}}) will not work in the UMD build (ES5 target) without --downlevelIteration. Convert to an array first, e.g. "[...Array.from(iterable)]".',
                },
            },
            create(context: eslint.Rule.RuleContext) {
                // Access type-checker from typescript-eslint parser services
                const parserServices = (context.sourceCode as any).parserServices;
                if (!parserServices?.esTreeNodeToTSNodeMap || !parserServices?.program) {
                    return {};
                }

                const checker: ts.TypeChecker = parserServices.program.getTypeChecker();

                function isSafeForDownlevelIteration(type: ts.Type): boolean {
                    // any/unknown - can't determine, assume safe
                    if (type.getFlags() & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
                        return true;
                    }

                    // String types - downlevel for-of uses index access which works (surrogate pairs aside)
                    if (type.getFlags() & ts.TypeFlags.StringLike) {
                        return true;
                    }

                    // Array types (Array<T>, T[], ReadonlyArray<T>)
                    if (checker.isArrayType(type)) {
                        return true;
                    }

                    // Tuple types ([T, U, ...])
                    if (checker.isTupleType(type)) {
                        return true;
                    }

                    // Union types - all members must be safe
                    if (type.isUnion()) {
                        return type.types.every((t) => isSafeForDownlevelIteration(t));
                    }

                    // Intersection types - if any member is safe, the whole type is safe
                    if (type.isIntersection()) {
                        return type.types.some((t) => isSafeForDownlevelIteration(t));
                    }

                    // Types with numeric index signature + length (covers TypedArrays, NodeList, HTMLCollection, arguments)
                    // The downlevel for-of emit uses .length and [i] which works for these
                    const numberIndexType = type.getNumberIndexType();
                    if (numberIndexType && type.getProperty("length")) {
                        return true;
                    }

                    return false;
                }

                function checkExpression(esTreeNode: ESTree.Expression, messageId: string) {
                    try {
                        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(esTreeNode);
                        if (!tsNode) {
                            return;
                        }

                        const type = checker.getTypeAtLocation(tsNode);
                        if (!isSafeForDownlevelIteration(type)) {
                            context.report({
                                node: esTreeNode,
                                messageId,
                                data: {
                                    typeName: checker.typeToString(type),
                                },
                            });
                        }
                    } catch {
                        // If type checking fails for any reason, don't report
                    }
                }

                return {
                    ForOfStatement(node: ESTree.ForOfStatement & eslint.Rule.NodeParentExtension) {
                        checkExpression(node.right, "forOfNonArray");
                    },
                    SpreadElement(node: ESTree.SpreadElement & eslint.Rule.NodeParentExtension) {
                        const parent = (node as any).parent;
                        if (parent?.type === "ArrayExpression" || parent?.type === "CallExpression" || parent?.type === "NewExpression") {
                            checkExpression(node.argument, "spreadNonArray");
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
                const filename = context.filename;
                if (!filename.endsWith(".pure.ts")) {
                    return {};
                }

                const sourceCode = context.sourceCode;

                type TypeScriptExpressionWrapper = ESTree.BaseExpression & {
                    type: "TSAsExpression" | "TSTypeAssertion" | "TSSatisfiesExpression" | "TSNonNullExpression";
                    expression: PureAnnotationNode;
                };

                type PureAnnotationNode = ESTree.Node | TypeScriptExpressionWrapper;
                type PureAnnotationCallOrNewExpression = ESTree.SimpleCallExpression | ESTree.NewExpression;

                /**
                 * Unwrap TS type assertions (e.g. `new Foo() as Bar`) to find the
                 * underlying CallExpression or NewExpression.
                 * @param node - The AST node to unwrap.
                 * @returns The unwrapped CallExpression/NewExpression, or null.
                 */
                function findCallOrNew(node: PureAnnotationNode | null | undefined): PureAnnotationCallOrNewExpression | null {
                    if (!node) {
                        return null;
                    }
                    if (node.type === "NewExpression" || node.type === "CallExpression") {
                        return node;
                    }
                    if (node.type === "TSAsExpression" || node.type === "TSTypeAssertion" || node.type === "TSSatisfiesExpression" || node.type === "TSNonNullExpression") {
                        return findCallOrNew(node.expression);
                    }
                    return null;
                }

                /**
                 * Check whether the node is preceded by a PURE block comment.
                 * @param node - The AST node to check.
                 * @returns True if a #__PURE__ annotation precedes the node.
                 */
                function hasPureAnnotation(node: PureAnnotationCallOrNewExpression): boolean {
                    // getCommentsBefore returns leading comments attached to the node
                    const comments = sourceCode.getCommentsBefore(node);
                    for (const c of comments) {
                        if (c.type === "Block" && c.value.trim() === "#__PURE__") {
                            return true;
                        }
                    }
                    // Also check the immediately preceding token (comment) in case
                    // ESLint attached it differently
                    const prev = sourceCode.getTokenBefore(node, { includeComments: true });
                    if (prev && prev.type === "Block" && prev.value?.trim() === "#__PURE__") {
                        return true;
                    }
                    return false;
                }

                const safelyAutofixablePureConstructors = new Set<string>([
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

                function unwrapExpression(node: PureAnnotationNode | null | undefined): PureAnnotationNode | null | undefined {
                    if (!node) {
                        return node;
                    }
                    if (node.type === "TSAsExpression" || node.type === "TSTypeAssertion" || node.type === "TSSatisfiesExpression" || node.type === "TSNonNullExpression") {
                        return unwrapExpression(node.expression);
                    }
                    return node;
                }

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
                            // Reject side-effecting unary operators; allow safe ones.
                            if (unwrappedNode.operator === "delete") {
                                return false;
                            }
                            return isSimplePureArgument(unwrappedNode.argument);
                        case "ArrayExpression":
                            return unwrappedNode.elements.every((element) => element !== null && element.type !== "SpreadElement" && isSimplePureArgument(element));
                        case "ObjectExpression":
                            return unwrappedNode.properties.every((property) => {
                                if (property.type === "SpreadElement" || property.computed) {
                                    return false;
                                }
                                return isSimplePureArgument(property.value);
                            });
                        default:
                            return false;
                    }
                }

                function hasOnlySimplePureArguments(node: PureAnnotationCallOrNewExpression): boolean {
                    // Keep autofix limited to arguments that are already values or literal containers.
                    // For example, `new Vector3(GetXValue(), 0, 0)` still needs manual review because
                    // the argument call may have side effects even though `Vector3` itself is safe.
                    return node.arguments.every((argument) => isSimplePureArgument(argument));
                }

                function isSafelyAutofixablePureExpression(node: PureAnnotationCallOrNewExpression): boolean {
                    if (node.type === "NewExpression") {
                        // Only accept a plain Identifier callee (e.g. `new Vector3()`).
                        // Member-expression callees like `new SomeNamespace.Vector3()` are
                        // rejected because the trailing name alone cannot confirm the type.
                        const calleeNode = unwrapExpression(node.callee);
                        if (!calleeNode || calleeNode.type !== "Identifier") {
                            return false;
                        }
                        return safelyAutofixablePureConstructors.has(calleeNode.name) && hasOnlySimplePureArguments(node);
                    }

                    if (node.type === "CallExpression") {
                        // Only accept a direct `Math.<identifier>(...)` call —
                        // not chains like `Math.abs.call(...)` / `Math.max.bind(...)`.
                        const calleeNode = unwrapExpression(node.callee);
                        if (
                            !calleeNode ||
                            calleeNode.type !== "MemberExpression" ||
                            calleeNode.computed ||
                            calleeNode.object?.type !== "Identifier" ||
                            calleeNode.object.name !== "Math" ||
                            calleeNode.property?.type !== "Identifier"
                        ) {
                            return false;
                        }
                        return hasOnlySimplePureArguments(node);
                    }

                    return false;
                }

                function reportMissing(callOrNew: PureAnnotationCallOrNewExpression) {
                    const text = sourceCode.getText(callOrNew);
                    const canAutofix = isSafelyAutofixablePureExpression(callOrNew);
                    context.report({
                        node: callOrNew,
                        messageId: "missing-pure-annotation",
                        data: { expr: text.length > 60 ? text.slice(0, 57) + "..." : text },
                        fix: canAutofix ? (fixer: eslint.Rule.RuleFixer) => fixer.insertTextBefore(callOrNew, "/*#__PURE__*/ ") : undefined,
                    });
                }

                return {
                    // Static class field initializers:  static foo = new Bar() / Bar.Create()
                    "PropertyDefinition[static=true]"(node: any) {
                        const callOrNew = findCallOrNew(node.value);
                        if (callOrNew && !hasPureAnnotation(callOrNew)) {
                            reportMissing(callOrNew);
                        }
                    },

                    // Top-level variable initializers:  const x = new Foo()
                    "Program > VariableDeclaration > VariableDeclarator"(node: any) {
                        const callOrNew = findCallOrNew(node.init);
                        if (callOrNew && !hasPureAnnotation(callOrNew)) {
                            reportMissing(callOrNew);
                        }
                    },

                    // Top-level expression statements:  Object.defineProperties(...)
                    "Program > ExpressionStatement"(node: any) {
                        const callOrNew = findCallOrNew(node.expression);
                        if (callOrNew && !hasPureAnnotation(callOrNew)) {
                            reportMissing(callOrNew);
                        }
                    },
                };
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

                // ── Manifest-based side-effect lookup (cached across files) ──
                // The manifest lists files WITH side effects.  If a resolved
                // import target is NOT in the set, it's safe.

                // Static cache shared across all files in this ESLint run
                const sideEffectFiles = loadSideEffectsSet();

                /**
                 * Resolve an import source relative to the current file and
                 * return the manifest-style path (relative to packages/dev/core/src/).
                 * Returns null if the file is outside core/src.
                 * @param source - The import specifier to resolve.
                 * @returns The manifest-relative path if the source has side effects, or null.
                 */
                function resolveToManifestPath(source: string): string | null {
                    let rel: string;
                    if (source.startsWith(".")) {
                        const dir = path.dirname(filename);
                        const resolved = path.resolve(dir, source);

                        // Find core/src/ anchor
                        const anchor = path.sep + path.join("packages", "dev", "core", "src") + path.sep;
                        const idx = resolved.indexOf(anchor);
                        if (idx === -1) {
                            return null;
                        }
                        rel = resolved.substring(idx + anchor.length);
                    } else if (source === "core") {
                        rel = "index";
                    } else if (source.startsWith("core/")) {
                        rel = source.substring("core/".length);
                    } else {
                        return null; // external / absolute — skip
                    }

                    // Normalise to forward-slashes (Windows)
                    rel = rel.replace(/\\/g, "/");
                    rel = rel.replace(/\.(?:js|mjs|ts|tsx)$/, "");

                    // Try common extensions
                    for (const ext of [".ts", ".tsx", "/index.ts"]) {
                        const candidate = rel + ext;
                        if (sideEffectFiles.has(candidate)) {
                            return candidate; // it HAS side effects
                        }
                    }
                    // Not in the side-effects set → pure (or unknown)
                    return null;
                }

                /**
                 * Check whether an import source is known to have side effects
                 * according to the manifest.  Falls back to naming-convention
                 * heuristics when the manifest is unavailable.
                 * @param source - The import specifier to check.
                 * @returns True if the source has side effects.
                 */
                function hasSideEffects(source: string): boolean {
                    if (sideEffectFiles.size > 0) {
                        return resolveToManifestPath(source) !== null;
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
                };
            },
        },
    },
};

/**
 * Load the side-effects manifest and return a Set of file paths that HAVE
 * side effects.  Cached across the entire ESLint process.
 */
let _sideEffectFilesCache: Set<string> | undefined;
function loadSideEffectsSet(): Set<string> {
    if (_sideEffectFilesCache) {
        return _sideEffectFilesCache;
    }
    _sideEffectFilesCache = new Set<string>();
    try {
        // Walk up from this compiled plugin file to the repo root
        // Plugin is at packages/tools/eslintBabylonPlugin/dist/index.js
        // Manifest is at scripts/treeshaking/side-effects-manifest/core/*.json
        // or, for older branches, scripts/treeshaking/side-effects-manifest.json
        let dir = __dirname;
        for (let i = 0; i < 10; i++) {
            const candidate = [
                path.join(dir, "scripts", "treeshaking", "side-effects-manifest", "core"),
                path.join(dir, "scripts", "treeshaking", "side-effects-manifest.json"),
            ].find((candidatePath) => fs.existsSync(candidatePath));
            if (candidate) {
                loadSideEffectsManifest(candidate, _sideEffectFilesCache);
                break;
            }
            const parent = path.dirname(dir);
            if (parent === dir) {
                break;
            }
            dir = parent;
        }
    } catch {
        // Manifest not available — fall back to naming conventions
    }
    return _sideEffectFilesCache;
}

function loadSideEffectsManifest(manifestPath: string, sideEffectFiles: Set<string>): void {
    const stat = fs.statSync(manifestPath);
    if (stat.isDirectory()) {
        for (const entry of fs.readdirSync(manifestPath, { withFileTypes: true })) {
            if (entry.isFile() && path.extname(entry.name) === ".json") {
                loadSideEffectsManifest(path.join(manifestPath, entry.name), sideEffectFiles);
            }
        }
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    if (Array.isArray(manifest.manifest)) {
        for (const entry of manifest.manifest) {
            if (entry.file) {
                sideEffectFiles.add(entry.file);
            }
        }
        return;
    }

    if (manifest.files && !Array.isArray(manifest.files)) {
        for (const file of Object.keys(manifest.files)) {
            sideEffectFiles.add(file);
        }
        return;
    }

    if (Array.isArray(manifest.files)) {
        for (const file of manifest.files) {
            sideEffectFiles.add(file);
        }
    }
}

export = plugin;

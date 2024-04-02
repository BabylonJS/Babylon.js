/* eslint-disable @typescript-eslint/naming-convention */
import type * as eslint from "eslint";
import type * as ESTree from "estree";
import type { ParserContext } from "@microsoft/tsdoc";
import { TSDocConfiguration, TSDocParser, TextRange } from "@microsoft/tsdoc";
import * as tsdoc from "@microsoft/tsdoc";
import type { TSDocConfigFile } from "@microsoft/tsdoc-config";
import * as ts from "typescript";

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
    },
};

export = plugin;

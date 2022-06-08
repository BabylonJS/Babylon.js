import * as eslint from "eslint";
import * as ESTree from "estree";
import { TSDocParser, TextRange, TSDocConfiguration, ParserContext } from "@microsoft/tsdoc";
import { TSDocConfigFile } from "@microsoft/tsdoc-config";

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

const allowedTags: string[] = ["@hidden", "@since"];

// const taskToMessageId = {
//     "param-tag-missing-hyphen": "tsdoc-param-tag-missing-hyphen",
// };

const plugin: IPlugin = {
    rules: {
        // NOTE: The actual ESLint rule name will be "tsdoc/syntax".  It is calculated by deleting "eslint-plugin-"
        // from the NPM package name, and then appending this string.
        syntax: {
            meta: {
                messages: {
                    "error-loading-config-file": "Error loading TSDoc config file:\n{{details}}",
                    "error-applying-config": "Error applying TSDoc configuration: {{details}}",
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
                    const tsdocConfigFile: TSDocConfigFile = ConfigCache.getForSourceFile(sourceFilePath);
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
                const checkCommentBlocks: (node: ESTree.Node) => void = function (node: ESTree.Node) {
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
                        if (parserContext.log.messages.length > 0) {
                            console.log(`Linting: "${sourceFilePath}"`);
                        }
                        for (const message of parserContext.log.messages) {
                            if (message.messageId === "tsdoc-param-tag-missing-hyphen") {
                                continue;
                            }
                            console.log(message.messageId, message.unformattedText);
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
                    "error-loading-config-file": "Error loading TSDoc config file:\n{{details}}",
                    "error-applying-config": "Error applying TSDoc configuration: {{details}}",
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
                // const sourceFilePath: string = context.getFilename();
                // const sourceCode: eslint.SourceCode = context.getSourceCode();

                const checkCommentBlocks: (node: ESTree.MethodDefinition) => void = function (node: ESTree.MethodDefinition) {
                    const sourceCode: eslint.SourceCode = context.getSourceCode();
                    // for (const comment of sourceCode.getAllComments()) {
                    //     console.log(comment);
                    // }
                    // const text = sourceCode.getText(node);
                    const comments = sourceCode.getComments(node).leading;
                    console.log((node.key as ESTree.Identifier).name);
                    if (comments.length && node.value.body) {
                        console.log(sourceCode.getTokensBefore(node));
                    }
                    // console.log(text);
                    // console.log(sourceCode.getComments(node).leading);
                };

                return {
                    // Program: checkCommentBlocks,
                    MethodDefinition: checkCommentBlocks,
                    PropertyDefinition: checkCommentBlocks,
                };
            },
        },
    },
};

export = plugin;

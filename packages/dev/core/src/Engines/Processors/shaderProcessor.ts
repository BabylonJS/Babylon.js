/* eslint-disable @typescript-eslint/no-unused-vars */
import { ShaderCodeNode } from "./shaderCodeNode";
import { ShaderCodeCursor } from "./shaderCodeCursor";
import { ShaderCodeConditionNode } from "./shaderCodeConditionNode";
import { ShaderCodeTestNode } from "./shaderCodeTestNode";
import { ShaderDefineIsDefinedOperator } from "./Expressions/Operators/shaderDefineIsDefinedOperator";
import { ShaderDefineOrOperator } from "./Expressions/Operators/shaderDefineOrOperator";
import { ShaderDefineAndOperator } from "./Expressions/Operators/shaderDefineAndOperator";
import { ShaderDefineExpression } from "./Expressions/shaderDefineExpression";
import { ShaderDefineArithmeticOperator } from "./Expressions/Operators/shaderDefineArithmeticOperator";
import type { ProcessingOptions } from "./shaderProcessingOptions";
import { _WarnImport } from "../../Misc/devTools";
import { ShaderLanguage } from "../../Materials/shaderLanguage";

declare type WebRequest = import("../../Misc/webRequest").WebRequest;
declare type LoadFileError = import("../../Misc/fileTools").LoadFileError;
declare type IOfflineProvider = import("../../Offline/IOfflineProvider").IOfflineProvider;
declare type IFileRequest = import("../../Misc/fileRequest").IFileRequest;
declare type ThinEngine = import("../thinEngine").ThinEngine;

const regexSE = /defined\s*?\((.+?)\)/g;
const regexSERevert = /defined\s*?\[(.+?)\]/g;
const regexShaderInclude = /#include\s?<(.+)>(\((.*)\))*(\[(.*)\])*/g;

/** @internal */
export class ShaderProcessor {
    public static Initialize(options: ProcessingOptions): void {
        if (options.processor && options.processor.initializeShaders) {
            options.processor.initializeShaders(options.processingContext);
        }
    }

    public static Process(sourceCode: string, options: ProcessingOptions, callback: (migratedCode: string) => void, engine: ThinEngine) {
        if (options.processor?.preProcessShaderCode) {
            sourceCode = options.processor.preProcessShaderCode(sourceCode, options.isFragment);
        }
        this._ProcessIncludes(sourceCode, options, (codeWithIncludes) => {
            if (options.processCodeAfterIncludes) {
                codeWithIncludes = options.processCodeAfterIncludes(options.isFragment ? "fragment" : "vertex", codeWithIncludes);
            }
            const migratedCode = this._ProcessShaderConversion(codeWithIncludes, options, engine);
            callback(migratedCode);
        });
    }

    public static PreProcess(sourceCode: string, options: ProcessingOptions, callback: (migratedCode: string) => void, engine: ThinEngine) {
        if (options.processor?.preProcessShaderCode) {
            sourceCode = options.processor.preProcessShaderCode(sourceCode, options.isFragment);
        }
        this._ProcessIncludes(sourceCode, options, (codeWithIncludes) => {
            if (options.processCodeAfterIncludes) {
                codeWithIncludes = options.processCodeAfterIncludes(options.isFragment ? "fragment" : "vertex", codeWithIncludes);
            }
            const migratedCode = this._ApplyPreProcessing(codeWithIncludes, options, engine);
            callback(migratedCode);
        });
    }

    public static Finalize(vertexCode: string, fragmentCode: string, options: ProcessingOptions): { vertexCode: string; fragmentCode: string } {
        if (!options.processor || !options.processor.finalizeShaders) {
            return { vertexCode, fragmentCode };
        }

        return options.processor.finalizeShaders(vertexCode, fragmentCode, options.processingContext);
    }

    private static _ProcessPrecision(source: string, options: ProcessingOptions): string {
        if (options.processor?.noPrecision) {
            return source;
        }

        const shouldUseHighPrecisionShader = options.shouldUseHighPrecisionShader;

        if (source.indexOf("precision highp float") === -1) {
            if (!shouldUseHighPrecisionShader) {
                source = "precision mediump float;\n" + source;
            } else {
                source = "precision highp float;\n" + source;
            }
        } else {
            if (!shouldUseHighPrecisionShader) {
                // Moving highp to mediump
                source = source.replace("precision highp float", "precision mediump float");
            }
        }

        return source;
    }

    private static _ExtractOperation(expression: string) {
        const regex = /defined\((.+)\)/;

        const match = regex.exec(expression);

        if (match && match.length) {
            return new ShaderDefineIsDefinedOperator(match[1].trim(), expression[0] === "!");
        }

        const operators = ["==", ">=", "<=", "<", ">"];
        let operator = "";
        let indexOperator = 0;

        for (operator of operators) {
            indexOperator = expression.indexOf(operator);

            if (indexOperator > -1) {
                break;
            }
        }

        if (indexOperator === -1) {
            return new ShaderDefineIsDefinedOperator(expression);
        }

        const define = expression.substring(0, indexOperator).trim();
        const value = expression.substring(indexOperator + operator.length).trim();

        return new ShaderDefineArithmeticOperator(define, operator, value);
    }

    private static _BuildSubExpression(expression: string): ShaderDefineExpression {
        expression = expression.replace(regexSE, "defined[$1]");

        const postfix = ShaderDefineExpression.infixToPostfix(expression);

        const stack: (string | ShaderDefineExpression)[] = [];

        for (const c of postfix) {
            if (c !== "||" && c !== "&&") {
                stack.push(c);
            } else if (stack.length >= 2) {
                let v1 = stack[stack.length - 1],
                    v2 = stack[stack.length - 2];

                stack.length -= 2;

                const operator = c == "&&" ? new ShaderDefineAndOperator() : new ShaderDefineOrOperator();

                if (typeof v1 === "string") {
                    v1 = v1.replace(regexSERevert, "defined($1)");
                }

                if (typeof v2 === "string") {
                    v2 = v2.replace(regexSERevert, "defined($1)");
                }

                operator.leftOperand = typeof v2 === "string" ? this._ExtractOperation(v2) : v2;
                operator.rightOperand = typeof v1 === "string" ? this._ExtractOperation(v1) : v1;

                stack.push(operator);
            }
        }

        let result = stack[stack.length - 1];

        if (typeof result === "string") {
            result = result.replace(regexSERevert, "defined($1)");
        }

        // note: stack.length !== 1 if there was an error in the parsing

        return typeof result === "string" ? this._ExtractOperation(result) : result;
    }

    private static _BuildExpression(line: string, start: number): ShaderCodeTestNode {
        const node = new ShaderCodeTestNode();
        const command = line.substring(0, start);
        let expression = line.substring(start);

        expression = expression.substring(0, (expression.indexOf("//") + 1 || expression.length + 1) - 1).trim();

        if (command === "#ifdef") {
            node.testExpression = new ShaderDefineIsDefinedOperator(expression);
        } else if (command === "#ifndef") {
            node.testExpression = new ShaderDefineIsDefinedOperator(expression, true);
        } else {
            node.testExpression = this._BuildSubExpression(expression);
        }

        return node;
    }

    private static _MoveCursorWithinIf(cursor: ShaderCodeCursor, rootNode: ShaderCodeConditionNode, ifNode: ShaderCodeNode) {
        let line = cursor.currentLine;
        while (this._MoveCursor(cursor, ifNode)) {
            line = cursor.currentLine;
            const first5 = line.substring(0, 5).toLowerCase();

            if (first5 === "#else") {
                const elseNode = new ShaderCodeNode();
                rootNode.children.push(elseNode);
                this._MoveCursor(cursor, elseNode);
                return;
            } else if (first5 === "#elif") {
                const elifNode = this._BuildExpression(line, 5);

                rootNode.children.push(elifNode);
                ifNode = elifNode;
            }
        }
    }

    private static _MoveCursor(cursor: ShaderCodeCursor, rootNode: ShaderCodeNode): boolean {
        while (cursor.canRead) {
            cursor.lineIndex++;
            const line = cursor.currentLine;
            const keywords = /(#ifdef)|(#else)|(#elif)|(#endif)|(#ifndef)|(#if)/;
            const matches = keywords.exec(line);

            if (matches && matches.length) {
                const keyword = matches[0];

                switch (keyword) {
                    case "#ifdef": {
                        const newRootNode = new ShaderCodeConditionNode();
                        rootNode.children.push(newRootNode);

                        const ifNode = this._BuildExpression(line, 6);
                        newRootNode.children.push(ifNode);
                        this._MoveCursorWithinIf(cursor, newRootNode, ifNode);
                        break;
                    }
                    case "#else":
                    case "#elif":
                        return true;
                    case "#endif":
                        return false;
                    case "#ifndef": {
                        const newRootNode = new ShaderCodeConditionNode();
                        rootNode.children.push(newRootNode);

                        const ifNode = this._BuildExpression(line, 7);
                        newRootNode.children.push(ifNode);
                        this._MoveCursorWithinIf(cursor, newRootNode, ifNode);
                        break;
                    }
                    case "#if": {
                        const newRootNode = new ShaderCodeConditionNode();
                        const ifNode = this._BuildExpression(line, 3);
                        rootNode.children.push(newRootNode);

                        newRootNode.children.push(ifNode);
                        this._MoveCursorWithinIf(cursor, newRootNode, ifNode);
                        break;
                    }
                }
            } else {
                const newNode = new ShaderCodeNode();
                newNode.line = line;
                rootNode.children.push(newNode);

                // Detect additional defines
                if (line[0] === "#" && line[1] === "d") {
                    const split = line.replace(";", "").split(" ");
                    newNode.additionalDefineKey = split[1];

                    if (split.length === 3) {
                        newNode.additionalDefineValue = split[2];
                    }
                }
            }
        }
        return false;
    }

    private static _EvaluatePreProcessors(sourceCode: string, preprocessors: { [key: string]: string }, options: ProcessingOptions): string {
        const rootNode = new ShaderCodeNode();
        const cursor = new ShaderCodeCursor();

        cursor.lineIndex = -1;
        cursor.lines = sourceCode.split("\n");

        // Decompose (We keep it in 2 steps so it is easier to maintain and perf hit is insignificant)
        this._MoveCursor(cursor, rootNode);

        // Recompose
        return rootNode.process(preprocessors, options);
    }

    private static _PreparePreProcessors(options: ProcessingOptions, engine: ThinEngine): { [key: string]: string } {
        const defines = options.defines;
        const preprocessors: { [key: string]: string } = {};

        for (const define of defines) {
            const keyValue = define.replace("#define", "").replace(";", "").trim();
            const split = keyValue.split(" ");
            preprocessors[split[0]] = split.length > 1 ? split[1] : "";
        }

        if (options.processor?.shaderLanguage === ShaderLanguage.GLSL) {
            preprocessors["GL_ES"] = "true";
        }
        preprocessors["__VERSION__"] = options.version;
        preprocessors[options.platformName] = "true";

        engine._getGlobalDefines(preprocessors);

        return preprocessors;
    }

    private static _ProcessShaderConversion(sourceCode: string, options: ProcessingOptions, engine: ThinEngine): string {
        let preparedSourceCode = this._ProcessPrecision(sourceCode, options);

        if (!options.processor) {
            return preparedSourceCode;
        }

        // Already converted
        if (options.processor.shaderLanguage === ShaderLanguage.GLSL && preparedSourceCode.indexOf("#version 3") !== -1) {
            return preparedSourceCode.replace("#version 300 es", "");
        }

        const defines = options.defines;

        const preprocessors = this._PreparePreProcessors(options, engine);

        // General pre processing
        if (options.processor.preProcessor) {
            preparedSourceCode = options.processor.preProcessor(preparedSourceCode, defines, options.isFragment, options.processingContext);
        }

        preparedSourceCode = this._EvaluatePreProcessors(preparedSourceCode, preprocessors, options);

        // Post processing
        if (options.processor.postProcessor) {
            preparedSourceCode = options.processor.postProcessor(preparedSourceCode, defines, options.isFragment, options.processingContext, engine);
        }

        // Inline functions tagged with #define inline
        if (engine._features.needShaderCodeInlining) {
            preparedSourceCode = engine.inlineShaderCode(preparedSourceCode);
        }

        return preparedSourceCode;
    }

    private static _ApplyPreProcessing(sourceCode: string, options: ProcessingOptions, engine: ThinEngine): string {
        let preparedSourceCode = sourceCode;

        const defines = options.defines;

        const preprocessors = this._PreparePreProcessors(options, engine);

        // General pre processing
        if (options.processor?.preProcessor) {
            preparedSourceCode = options.processor.preProcessor(preparedSourceCode, defines, options.isFragment, options.processingContext);
        }

        preparedSourceCode = this._EvaluatePreProcessors(preparedSourceCode, preprocessors, options);

        // Post processing
        if (options.processor?.postProcessor) {
            preparedSourceCode = options.processor.postProcessor(preparedSourceCode, defines, options.isFragment, options.processingContext, engine);
        }

        // Inline functions tagged with #define inline
        if (engine._features.needShaderCodeInlining) {
            preparedSourceCode = engine.inlineShaderCode(preparedSourceCode);
        }

        return preparedSourceCode;
    }

    private static _ProcessIncludes(sourceCode: string, options: ProcessingOptions, callback: (data: any) => void): void {
        let match = regexShaderInclude.exec(sourceCode);

        let returnValue = new String(sourceCode);
        let keepProcessing = false;

        while (match != null) {
            let includeFile = match[1];

            // Uniform declaration
            if (includeFile.indexOf("__decl__") !== -1) {
                includeFile = includeFile.replace(/__decl__/, "");
                if (options.supportsUniformBuffers) {
                    includeFile = includeFile.replace(/Vertex/, "Ubo");
                    includeFile = includeFile.replace(/Fragment/, "Ubo");
                }
                includeFile = includeFile + "Declaration";
            }

            if (options.includesShadersStore[includeFile]) {
                // Substitution
                let includeContent = options.includesShadersStore[includeFile];
                if (match[2]) {
                    const splits = match[3].split(",");

                    for (let index = 0; index < splits.length; index += 2) {
                        const source = new RegExp(splits[index], "g");
                        const dest = splits[index + 1];

                        includeContent = includeContent.replace(source, dest);
                    }
                }

                if (match[4]) {
                    const indexString = match[5];

                    if (indexString.indexOf("..") !== -1) {
                        const indexSplits = indexString.split("..");
                        const minIndex = parseInt(indexSplits[0]);
                        let maxIndex = parseInt(indexSplits[1]);
                        let sourceIncludeContent = includeContent.slice(0);
                        includeContent = "";

                        if (isNaN(maxIndex)) {
                            maxIndex = options.indexParameters[indexSplits[1]];
                        }

                        for (let i = minIndex; i < maxIndex; i++) {
                            if (!options.supportsUniformBuffers) {
                                // Ubo replacement
                                sourceIncludeContent = sourceIncludeContent.replace(/light\{X\}.(\w*)/g, (str: string, p1: string) => {
                                    return p1 + "{X}";
                                });
                            }
                            includeContent += sourceIncludeContent.replace(/\{X\}/g, i.toString()) + "\n";
                        }
                    } else {
                        if (!options.supportsUniformBuffers) {
                            // Ubo replacement
                            includeContent = includeContent.replace(/light\{X\}.(\w*)/g, (str: string, p1: string) => {
                                return p1 + "{X}";
                            });
                        }
                        includeContent = includeContent.replace(/\{X\}/g, indexString);
                    }
                }

                // Replace
                returnValue = returnValue.replace(match[0], includeContent);

                keepProcessing = keepProcessing || includeContent.indexOf("#include<") >= 0 || includeContent.indexOf("#include <") >= 0;
            } else {
                const includeShaderUrl = options.shadersRepository + "ShadersInclude/" + includeFile + ".fx";

                ShaderProcessor._FileToolsLoadFile(includeShaderUrl, (fileContent) => {
                    options.includesShadersStore[includeFile] = fileContent as string;
                    this._ProcessIncludes(<string>returnValue, options, callback);
                });
                return;
            }

            match = regexShaderInclude.exec(sourceCode);
        }

        if (keepProcessing) {
            this._ProcessIncludes(returnValue.toString(), options, callback);
        } else {
            callback(returnValue);
        }
    }

    /**
     * Loads a file from a url
     * @param url url to load
     * @param onSuccess callback called when the file successfully loads
     * @param onProgress callback called while file is loading (if the server supports this mode)
     * @param offlineProvider defines the offline provider for caching
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @param onError callback called when the file fails to load
     * @returns a file request object
     * @internal
     */
    public static _FileToolsLoadFile(
        url: string,
        onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void,
        onProgress?: (ev: ProgressEvent) => void,
        offlineProvider?: IOfflineProvider,
        useArrayBuffer?: boolean,
        onError?: (request?: WebRequest, exception?: LoadFileError) => void
    ): IFileRequest {
        throw _WarnImport("FileTools");
    }
}

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
import type { _IProcessingOptions } from "./shaderProcessingOptions";
import { _WarnImport } from "../../Misc/devTools";
import { ShaderLanguage } from "../../Materials/shaderLanguage";

import type { WebRequest } from "../../Misc/webRequest";
import type { LoadFileError } from "../../Misc/fileTools";
import type { IOfflineProvider } from "../../Offline/IOfflineProvider";
import type { IFileRequest } from "../../Misc/fileRequest";
import { _GetGlobalDefines } from "../abstractEngine.functions";
import type { AbstractEngine } from "../abstractEngine";

const regexSe = /defined\s*?\((.+?)\)/g;
const regexSeRevert = /defined\s*?\[(.+?)\]/g;
const regexShaderInclude = /#include\s?<(.+)>(\((.*)\))*(\[(.*)\])*/g;
const regexShaderDecl = /__decl__/;
const regexLightX = /light\{X\}.(\w*)/g;
const regexX = /\{X\}/g;
const reusableMatches: RegExpMatchArray[] = [];

const _moveCursorRegex = /(#ifdef)|(#else)|(#elif)|(#endif)|(#ifndef)|(#if)/;

/** @internal */
export function Initialize(options: _IProcessingOptions): void {
    if (options.processor && options.processor.initializeShaders) {
        options.processor.initializeShaders(options.processingContext);
    }
}

/** @internal */
export function Process(sourceCode: string, options: _IProcessingOptions, callback: (migratedCode: string, codeBeforeMigration: string) => void, engine?: AbstractEngine) {
    if (options.processor?.preProcessShaderCode) {
        sourceCode = options.processor.preProcessShaderCode(sourceCode, options.isFragment);
    }
    _ProcessIncludes(sourceCode, options, (codeWithIncludes) => {
        if (options.processCodeAfterIncludes) {
            codeWithIncludes = options.processCodeAfterIncludes(options.isFragment ? "fragment" : "vertex", codeWithIncludes, options.defines);
        }
        const migratedCode = _ProcessShaderConversion(codeWithIncludes, options, engine);
        callback(migratedCode, codeWithIncludes);
    });
}

/** @internal */
export function PreProcess(sourceCode: string, options: _IProcessingOptions, callback: (migratedCode: string, codeBeforeMigration: string) => void, engine: AbstractEngine) {
    if (options.processor?.preProcessShaderCode) {
        sourceCode = options.processor.preProcessShaderCode(sourceCode, options.isFragment);
    }
    _ProcessIncludes(sourceCode, options, (codeWithIncludes) => {
        if (options.processCodeAfterIncludes) {
            codeWithIncludes = options.processCodeAfterIncludes(options.isFragment ? "fragment" : "vertex", codeWithIncludes, options.defines);
        }
        const migratedCode = _ApplyPreProcessing(codeWithIncludes, options, engine);
        callback(migratedCode, codeWithIncludes);
    });
}

/** @internal */
export function Finalize(vertexCode: string, fragmentCode: string, options: _IProcessingOptions): { vertexCode: string; fragmentCode: string } {
    if (!options.processor || !options.processor.finalizeShaders) {
        return { vertexCode, fragmentCode };
    }

    return options.processor.finalizeShaders(vertexCode, fragmentCode, options.processingContext);
}

function _ProcessPrecision(source: string, options: _IProcessingOptions): string {
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

function _ExtractOperation(expression: string) {
    const regex = /defined\((.+)\)/;

    const match = regex.exec(expression);

    if (match && match.length) {
        return new ShaderDefineIsDefinedOperator(match[1].trim(), expression[0] === "!");
    }

    const operators = ["==", "!=", ">=", "<=", "<", ">"];
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

function _BuildSubExpression(expression: string): ShaderDefineExpression {
    expression = expression.replace(regexSe, "defined[$1]");

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
                v1 = v1.replace(regexSeRevert, "defined($1)");
            }

            if (typeof v2 === "string") {
                v2 = v2.replace(regexSeRevert, "defined($1)");
            }

            operator.leftOperand = typeof v2 === "string" ? _ExtractOperation(v2) : v2;
            operator.rightOperand = typeof v1 === "string" ? _ExtractOperation(v1) : v1;

            stack.push(operator);
        }
    }

    let result = stack[stack.length - 1];

    if (typeof result === "string") {
        result = result.replace(regexSeRevert, "defined($1)");
    }

    // note: stack.length !== 1 if there was an error in the parsing

    return typeof result === "string" ? _ExtractOperation(result) : result;
}

function _BuildExpression(line: string, start: number): ShaderCodeTestNode {
    const node = new ShaderCodeTestNode();
    const command = line.substring(0, start);
    let expression = line.substring(start);

    expression = expression.substring(0, (expression.indexOf("//") + 1 || expression.length + 1) - 1).trim();

    if (command === "#ifdef") {
        node.testExpression = new ShaderDefineIsDefinedOperator(expression);
    } else if (command === "#ifndef") {
        node.testExpression = new ShaderDefineIsDefinedOperator(expression, true);
    } else {
        node.testExpression = _BuildSubExpression(expression);
    }

    return node;
}

function _MoveCursorWithinIf(cursor: ShaderCodeCursor, rootNode: ShaderCodeConditionNode, ifNode: ShaderCodeNode) {
    let line = cursor.currentLine;
    while (_MoveCursor(cursor, ifNode)) {
        line = cursor.currentLine;
        const first5 = line.substring(0, 5).toLowerCase();

        if (first5 === "#else") {
            const elseNode = new ShaderCodeNode();
            rootNode.children.push(elseNode);
            _MoveCursor(cursor, elseNode);
            return;
        } else if (first5 === "#elif") {
            const elifNode = _BuildExpression(line, 5);

            rootNode.children.push(elifNode);
            ifNode = elifNode;
        }
    }
}

function _MoveCursor(cursor: ShaderCodeCursor, rootNode: ShaderCodeNode): boolean {
    while (cursor.canRead) {
        cursor.lineIndex++;
        const line = cursor.currentLine;

        if (line.indexOf("#") >= 0) {
            const matches = _moveCursorRegex.exec(line);

            if (matches && matches.length) {
                const keyword = matches[0];

                switch (keyword) {
                    case "#ifdef": {
                        const newRootNode = new ShaderCodeConditionNode();
                        rootNode.children.push(newRootNode);

                        const ifNode = _BuildExpression(line, 6);
                        newRootNode.children.push(ifNode);
                        _MoveCursorWithinIf(cursor, newRootNode, ifNode);
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

                        const ifNode = _BuildExpression(line, 7);
                        newRootNode.children.push(ifNode);
                        _MoveCursorWithinIf(cursor, newRootNode, ifNode);
                        break;
                    }
                    case "#if": {
                        const newRootNode = new ShaderCodeConditionNode();
                        const ifNode = _BuildExpression(line, 3);
                        rootNode.children.push(newRootNode);

                        newRootNode.children.push(ifNode);
                        _MoveCursorWithinIf(cursor, newRootNode, ifNode);
                        break;
                    }
                }
                continue;
            }
        }

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
    return false;
}

function _EvaluatePreProcessors(sourceCode: string, preprocessors: { [key: string]: string }, options: _IProcessingOptions): string {
    const rootNode = new ShaderCodeNode();
    const cursor = new ShaderCodeCursor();

    cursor.lineIndex = -1;
    cursor.lines = sourceCode.split("\n");

    // Decompose (We keep it in 2 steps so it is easier to maintain and perf hit is insignificant)
    _MoveCursor(cursor, rootNode);

    // Recompose
    return rootNode.process(preprocessors, options);
}

function _PreparePreProcessors(options: _IProcessingOptions, engine?: AbstractEngine): { [key: string]: string } {
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

    _GetGlobalDefines(preprocessors, engine?.isNDCHalfZRange, engine?.useReverseDepthBuffer, engine?.useExactSrgbConversions);

    return preprocessors;
}

function _ProcessShaderConversion(sourceCode: string, options: _IProcessingOptions, engine?: AbstractEngine): string {
    let preparedSourceCode = _ProcessPrecision(sourceCode, options);

    if (!options.processor) {
        return preparedSourceCode;
    }

    // Already converted
    if (options.processor.shaderLanguage === ShaderLanguage.GLSL && preparedSourceCode.indexOf("#version 3") !== -1) {
        preparedSourceCode = preparedSourceCode.replace("#version 300 es", "");
        if (!options.processor.parseGLES3) {
            return preparedSourceCode;
        }
    }

    const defines = options.defines;

    const preprocessors = _PreparePreProcessors(options, engine);

    // General pre processing
    if (options.processor.preProcessor) {
        preparedSourceCode = options.processor.preProcessor(preparedSourceCode, defines, preprocessors, options.isFragment, options.processingContext);
    }

    preparedSourceCode = _EvaluatePreProcessors(preparedSourceCode, preprocessors, options);

    // Post processing
    if (options.processor.postProcessor) {
        preparedSourceCode = options.processor.postProcessor(
            preparedSourceCode,
            defines,
            options.isFragment,
            options.processingContext,
            engine
                ? {
                      drawBuffersExtensionDisabled: engine.getCaps().drawBuffersExtension ? false : true,
                  }
                : {}
        );
    }

    // Inline functions tagged with #define inline
    if (engine?._features.needShaderCodeInlining) {
        preparedSourceCode = engine.inlineShaderCode(preparedSourceCode);
    }

    return preparedSourceCode;
}

function _ApplyPreProcessing(sourceCode: string, options: _IProcessingOptions, engine: AbstractEngine): string {
    let preparedSourceCode = sourceCode;

    const defines = options.defines;

    const preprocessors = _PreparePreProcessors(options, engine);

    // General pre processing
    if (options.processor?.preProcessor) {
        preparedSourceCode = options.processor.preProcessor(preparedSourceCode, defines, preprocessors, options.isFragment, options.processingContext);
    }

    preparedSourceCode = _EvaluatePreProcessors(preparedSourceCode, preprocessors, options);

    // Post processing
    if (options.processor?.postProcessor) {
        preparedSourceCode = options.processor.postProcessor(
            preparedSourceCode,
            defines,
            options.isFragment,
            options.processingContext,
            engine
                ? {
                      drawBuffersExtensionDisabled: engine.getCaps().drawBuffersExtension ? false : true,
                  }
                : {}
        );
    }

    // Inline functions tagged with #define inline
    if (engine._features.needShaderCodeInlining) {
        preparedSourceCode = engine.inlineShaderCode(preparedSourceCode);
    }

    return preparedSourceCode;
}

/** @internal */
export function _ProcessIncludes(sourceCode: string, options: _IProcessingOptions, callback: (data: any) => void): void {
    reusableMatches.length = 0;
    let match: RegExpMatchArray | null;
    // stay back-compat to the old matchAll syntax
    while ((match = regexShaderInclude.exec(sourceCode)) !== null) {
        reusableMatches.push(match);
    }

    let returnValue = String(sourceCode);
    let parts = [sourceCode];

    let keepProcessing = false;

    for (const match of reusableMatches) {
        let includeFile = match[1];

        // Uniform declaration
        if (includeFile.indexOf("__decl__") !== -1) {
            includeFile = includeFile.replace(regexShaderDecl, "");
            if (options.supportsUniformBuffers) {
                includeFile = includeFile.replace("Vertex", "Ubo").replace("Fragment", "Ubo");
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
                            sourceIncludeContent = sourceIncludeContent.replace(regexLightX, (str: string, p1: string) => {
                                return p1 + "{X}";
                            });
                        }
                        includeContent += sourceIncludeContent.replace(regexX, i.toString()) + "\n";
                    }
                } else {
                    if (!options.supportsUniformBuffers) {
                        // Ubo replacement
                        includeContent = includeContent.replace(regexLightX, (str: string, p1: string) => {
                            return p1 + "{X}";
                        });
                    }
                    includeContent = includeContent.replace(regexX, indexString);
                }
            }

            // Replace
            // Split all parts on match[0] and intersperse the parts with the include content
            const newParts = [];
            for (const part of parts) {
                const splitPart = part.split(match[0]);
                for (let i = 0; i < splitPart.length - 1; i++) {
                    newParts.push(splitPart[i]);
                    newParts.push(includeContent);
                }
                newParts.push(splitPart[splitPart.length - 1]);
            }
            parts = newParts;

            keepProcessing = keepProcessing || includeContent.indexOf("#include<") >= 0 || includeContent.indexOf("#include <") >= 0;
        } else {
            const includeShaderUrl = options.shadersRepository + "ShadersInclude/" + includeFile + ".fx";

            _FunctionContainer.loadFile(includeShaderUrl, (fileContent) => {
                options.includesShadersStore[includeFile] = fileContent as string;
                _ProcessIncludes(parts.join(""), options, callback);
            });
            return;
        }
    }
    reusableMatches.length = 0;

    returnValue = parts.join("");

    if (keepProcessing) {
        _ProcessIncludes(returnValue.toString(), options, callback);
    } else {
        callback(returnValue);
    }
}

/** @internal */
export const _FunctionContainer = {
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
    loadFile: (
        url: string,
        onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void,
        onProgress?: (ev: ProgressEvent) => void,
        offlineProvider?: IOfflineProvider,
        useArrayBuffer?: boolean,
        onError?: (request?: WebRequest, exception?: LoadFileError) => void
    ): IFileRequest => {
        throw _WarnImport("FileTools");
    },
};

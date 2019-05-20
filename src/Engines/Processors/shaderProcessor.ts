import { Tools } from '../../Misc/tools';
import { ShaderCodeNode } from './shaderCodeNode';
import { ShaderCodeCursor } from './shaderCodeCursor';
import { ShaderCodeConditionNode } from './shaderCodeConditionNode';
import { ShaderCodeTestNode } from './shaderCodeTestNode';
import { ShaderDefineIsDefinedOperator } from './Expressions/Operators/shaderDefineIsDefinedOperator';
import { ShaderDefineOrOperator } from './Expressions/Operators/shaderDefineOrOperator';
import { ShaderDefineAndOperator } from './Expressions/Operators/shaderDefineAndOperator';
import { ShaderDefineExpression } from './Expressions/shaderDefineExpression';
import { ShaderDefineArithmeticOperator } from './Expressions/Operators/shaderDefineArithmeticOperator';

/** @hidden */
interface ProcessingOptions {
    defines: string;
    indexParameters: any;
    isFragment: boolean;
    shouldUseHighPrecisionShader: boolean;
    needProcessing: boolean;
    supportsUniformBuffers: boolean;
    shadersRepository: string;
    includesShadersStore: { [key: string]: string };
}

/** @hidden */
export class ShaderProcessor {
    public static Process(sourceCode: string, options: ProcessingOptions, callback: (migratedCode: string) => void) {
        this._ProcessIncludes(sourceCode, options, (codeWithIncludes) => {
            let migratedCode = this._ProcessShaderConversion(codeWithIncludes, options);
            callback(migratedCode);
        });
    }

    private static _ProcessPrecision(source: string, options: ProcessingOptions): string {
        const shouldUseHighPrecisionShader = options.shouldUseHighPrecisionShader;

        if (source.indexOf("precision highp float") === -1) {
            if (!shouldUseHighPrecisionShader) {
                source = "precision mediump float;\n" + source;
            } else {
                source = "precision highp float;\n" + source;
            }
        } else {
            if (!shouldUseHighPrecisionShader) { // Moving highp to mediump
                source = source.replace("precision highp float", "precision mediump float");
            }
        }

        return source;
    }

    private static _ExtractOperation(expression: string) {
        let regex = /defined\((.+)\)/;

        let match = regex.exec(expression);

        if (match && match.length) {
            return new ShaderDefineIsDefinedOperator(match[1], expression[0] === "!");
        }

        let indexOperator = expression.indexOf("==");
        let operator = "";

        if (indexOperator === -1) {
            indexOperator = expression.indexOf(">");

            if (indexOperator === -1) {
                indexOperator = expression.indexOf("<");

                if (indexOperator !== -1) {
                    operator = "<";
                }
            } else {
                operator = ">";
            }
        } else {
            operator = "==";
        }

        let define = expression.substring(0, indexOperator);
        let value = expression.substring(indexOperator + operator.length);

        return new ShaderDefineArithmeticOperator(define, operator, value);
    }

    private static _BuildSubExpression(expression: string): ShaderDefineExpression {
        let indexOr = expression.indexOf("||");
        if (indexOr === -1) {
            let indexAnd = expression.indexOf("&&");
            if (indexAnd > -1) {
                let andOperator = new ShaderDefineAndOperator();
                let leftPart = expression.substring(0, indexAnd);
                let rightPart = expression.substring(indexAnd);

                andOperator.leftOperand = this._BuildSubExpression(leftPart);
                andOperator.rightOperand = this._BuildSubExpression(rightPart);

                return andOperator;
            } else {
                return this._ExtractOperation(expression);
            }
        } else {
            let orOperator = new ShaderDefineOrOperator();
            let leftPart = expression.substring(0, indexOr);
            let rightPart = expression.substring(indexOr);

            orOperator.leftOperand = this._BuildSubExpression(leftPart);
            orOperator.rightOperand = this._BuildSubExpression(rightPart);

            return orOperator;
        }
    }

    private static _BuildExpression(line: string, start: number): ShaderCodeTestNode {
        let node = new ShaderCodeTestNode();
        let command = line.substring(0, start);
        let expression = line.substring(start).trim();

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
            let first5 = line.substring(0, 5).toLowerCase();

            if (first5 === "#else") {
                let elseNode = new ShaderCodeNode();
                rootNode.children.push(ifNode);
                this._MoveCursor(cursor, elseNode);
                return;
            } else if (first5 === "#elif") {
                console.log(line);
                let elifNode = this._BuildExpression(line, 5);

                rootNode.children.push(elifNode);
                ifNode = elifNode;
            }
        }
    }

    private static _MoveCursor(cursor: ShaderCodeCursor, rootNode: ShaderCodeNode): boolean {
        while (cursor.canRead) {
            cursor.lineIndex++;
            let line = cursor.currentLine;
            if (line[0] === "#" && line[1] !== "d") {
                let first6 = line.substring(0, 6).toLowerCase();
                let first5 = line.substring(0, 5).toLowerCase();
                if (first6 === "#ifdef") {
                    let newRootNode = new ShaderCodeConditionNode();
                    rootNode.children.push(newRootNode);

                    let ifNode = this._BuildExpression(line, 6);
                    newRootNode.children.push(ifNode);
                    this._MoveCursorWithinIf(cursor, newRootNode, ifNode);
                } else if (first5 === "#else") {
                    return true;
                } else if (first5 === "#elif") {
                    return true;
                } else if (first6 === "#endif") {
                    return false;
                } else if (line.substring(0, 3).toLowerCase() === "#if") {
                    let newRootNode = new ShaderCodeConditionNode();
                    let ifNode = this._BuildExpression(line, 3);
                    rootNode.children.push(newRootNode);

                    newRootNode.children.push(ifNode);
                    this._MoveCursorWithinIf(cursor, newRootNode, ifNode);
                } else if (line.substring(0, 7).toLowerCase() === "#ifndef") {
                    let newRootNode = new ShaderCodeConditionNode();
                    rootNode.children.push(newRootNode);

                    let ifNode = this._BuildExpression(line, 7);
                    newRootNode.children.push(ifNode);
                    this._MoveCursorWithinIf(cursor, newRootNode, ifNode);
                }
            } else {
                let newNode = new ShaderCodeNode();
                newNode.line = line;
                rootNode.children.push(newNode);
            }
        }
        return false;
    }

    private static _EvaluatePreProcessors(sourceCode: string, preprocessors: { [key: string]: string }): string {
        const rootNode = new ShaderCodeNode();
        let cursor = new ShaderCodeCursor();

        cursor.lineIndex = -1;
        cursor.lines = sourceCode.split("\n");

        // Decompose
        this._MoveCursor(cursor, rootNode);

        // Recompose
        return rootNode.process(preprocessors);
    }

    private static _ProcessShaderConversion(sourceCode: string, options: ProcessingOptions): string {

        var preparedSourceCode = this._ProcessPrecision(sourceCode, options);

        if (!options.needProcessing) {
            return preparedSourceCode;
        }

        // Already converted
        if (preparedSourceCode.indexOf("#version 3") !== -1) {
            return preparedSourceCode.replace("#version 300 es", "");
        }

        let defines = options.defines.split("\n");

        let preprocessors: { [key: string]: string } = {};

        for (var define of defines) {
            let keyValue = define.replace("#define", "").trim();
            let split = keyValue.split(" ");
            preprocessors[split[0]] = split.length > 1 ? split[1] : "";
        }

        preparedSourceCode = this._EvaluatePreProcessors(preparedSourceCode, preprocessors);

        var hasDrawBuffersExtension = preparedSourceCode.search(/#extension.+GL_EXT_draw_buffers.+require/) !== -1;

        // Remove extensions
        // #extension GL_OES_standard_derivatives : enable
        // #extension GL_EXT_shader_texture_lod : enable
        // #extension GL_EXT_frag_depth : enable
        // #extension GL_EXT_draw_buffers : require
        var regex = /#extension.+(GL_OVR_multiview2|GL_OES_standard_derivatives|GL_EXT_shader_texture_lod|GL_EXT_frag_depth|GL_EXT_draw_buffers).+(enable|require)/g;
        var result = preparedSourceCode.replace(regex, "");

        // Migrate to GLSL v300
        let isFragment = options.isFragment;
        result = result.replace(/varying(?![\n\r])\s/g, isFragment ? "in " : "out ");
        result = result.replace(/attribute[ \t]/g, "in ");
        result = result.replace(/[ \t]attribute/g, " in");

        result = result.replace(/texture2D\s*\(/g, "texture(");
        if (isFragment) {
            result = result.replace(/texture2DLodEXT\s*\(/g, "textureLod(");
            result = result.replace(/textureCubeLodEXT\s*\(/g, "textureLod(");
            result = result.replace(/textureCube\s*\(/g, "texture(");
            result = result.replace(/gl_FragDepthEXT/g, "gl_FragDepth");
            result = result.replace(/gl_FragColor/g, "glFragColor");
            result = result.replace(/gl_FragData/g, "glFragData");
            result = result.replace(/void\s+?main\s*\(/g, (hasDrawBuffersExtension ? "" : "out vec4 glFragColor;\n") + "void main(");
        }

        // Add multiview setup to top of file when defined
        var hasMultiviewExtension = defines.indexOf("#define MULTIVIEW") !== -1;
        if (hasMultiviewExtension && !isFragment) {
            result = "#extension GL_OVR_multiview2 : require\nlayout (num_views = 2) in;\n" + result;
        }

        return result;
    }

    private static _ProcessIncludes(sourceCode: string, options: ProcessingOptions, callback: (data: any) => void): void {
        var regex = /#include<(.+)>(\((.*)\))*(\[(.*)\])*/g;
        var match = regex.exec(sourceCode);

        var returnValue = new String(sourceCode);

        while (match != null) {
            var includeFile = match[1];

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
                var includeContent = options.includesShadersStore[includeFile];
                if (match[2]) {
                    var splits = match[3].split(",");

                    for (var index = 0; index < splits.length; index += 2) {
                        var source = new RegExp(splits[index], "g");
                        var dest = splits[index + 1];

                        includeContent = includeContent.replace(source, dest);
                    }
                }

                if (match[4]) {
                    var indexString = match[5];

                    if (indexString.indexOf("..") !== -1) {
                        var indexSplits = indexString.split("..");
                        var minIndex = parseInt(indexSplits[0]);
                        var maxIndex = parseInt(indexSplits[1]);
                        var sourceIncludeContent = includeContent.slice(0);
                        includeContent = "";

                        if (isNaN(maxIndex)) {
                            maxIndex = options.indexParameters[indexSplits[1]];
                        }

                        for (var i = minIndex; i < maxIndex; i++) {
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
            } else {
                var includeShaderUrl = options.shadersRepository + "ShadersInclude/" + includeFile + ".fx";

                Tools.LoadFile(includeShaderUrl, (fileContent) => {
                    options.includesShadersStore[includeFile] = fileContent as string;
                    this._ProcessIncludes(<string>returnValue, options, callback);
                });
                return;
            }

            match = regex.exec(sourceCode);
        }

        callback(returnValue);
    }
}
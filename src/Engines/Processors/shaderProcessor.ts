import { Tools } from '../../Misc/tools';
import { ShaderCodeNode } from './shaderCodeNode';
import { ShaderCodeCursor } from './shaderCodeCursor';
import { ShaderCodeArithmeticTestNode } from './shaderCodeArithmeticTestNode';
import { ShaderCodeDefineTestNode } from './shaderCodeDefineTestNode';

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

    private static _EvaluatePreProcessors(sourceCode: string, preprocessors: {[key: string]: string}): string {
        const rootNode = new ShaderCodeNode();
        let cursor = new ShaderCodeCursor();

        cursor.lineIndex = 0;
        cursor.currentNode = rootNode;
        cursor.lines = sourceCode.split("\n");

        // Decompose
        while (!cursor.eof) {
            let line = cursor.currentLine;
            if (line[0] === "#") {
                let first6 = line.substring(0, 6).toLowerCase();
                if (first6 === "#ifdef") {
                    let newNode = new ShaderCodeDefineTestNode();
                    newNode.define = line.substring(6).trim();
                    newNode.parent = cursor.parentNode;
                    newNode.child = new ShaderCodeNode();

                    cursor.parentNode = newNode;
                    if (cursor.currentNode) {
                        cursor.currentNode.next = newNode;
                    }
                    cursor.currentNode = newNode.child;
                } else if (first6 === "#endif") {
                    cursor.currentNode = cursor.parentNode;
                    cursor.parentNode = cursor.parentNode!.parent;
                }else if (line.substring(0, 3).toLowerCase() === "#if") {
                    let newNode = new ShaderCodeArithmeticTestNode();
                    let regex = /(.+)(.)(.+)/;
                    let matches = regex.exec(line.substring(3).trim())!;
                    newNode.define = matches[1];
                    newNode.operand = matches[2];
                    newNode.testValue = matches[3];
                    newNode.parent = cursor.parentNode;
                    newNode.child = new ShaderCodeNode();

                    cursor.parentNode = newNode;
                    if (cursor.currentNode) {
                        cursor.currentNode.next = newNode;
                    }
                    cursor.currentNode = newNode.child;
                }
            } else {
                let newNode = new ShaderCodeNode();
                newNode.line = line;
                newNode.parent = cursor.parentNode;

                if (cursor.currentNode) {
                    cursor.currentNode.next = newNode;
                }
                cursor.currentNode = newNode;
            }

            cursor.lineIndex++;
        }

        // Recompose

        let currentNode = rootNode;
        let processedCode = "";

        while (currentNode) {
            if (currentNode.line) {
                processedCode += currentNode.line + "\r\n";
            }

            currentNode = currentNode.getNextNode(preprocessors);
        }

        return processedCode;
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

        let preprocessors: {[key: string]: string} = {};
        
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
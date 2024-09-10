/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
import type { Nullable } from "../../types";
import type { ShaderProcessingContext } from "../Processors/shaderProcessingOptions";
import type { WebGPUBufferDescription } from "./webgpuShaderProcessingContext";
import { WebGPUShaderProcessingContext } from "./webgpuShaderProcessingContext";
import * as WebGPUConstants from "./webgpuConstants";
import { Logger } from "../../Misc/logger";
import { WebGPUShaderProcessor } from "./webgpuShaderProcessor";
import { ShaderLanguage } from "../../Materials/shaderLanguage";
import { InjectStartingAndEndingCode } from "../../Misc/codeStringParsingTools";
import { Constants } from "../constants";

/** @internal */
export class WebGPUShaderProcessorGLSL extends WebGPUShaderProcessor {
    protected _missingVaryings: Array<string> = [];
    protected _textureArrayProcessing: Array<string> = [];
    protected _preProcessors: { [key: string]: string };
    protected _vertexIsGLES3: boolean = false;
    protected _fragmentIsGLES3: boolean = false;

    public override shaderLanguage = ShaderLanguage.GLSL;
    public parseGLES3 = true;
    public attributeKeywordName: string | undefined;
    public varyingVertexKeywordName: string | undefined;
    public varyingFragmentKeywordName: string | undefined;

    protected _getArraySize(name: string, type: string, preProcessors: { [key: string]: string }): [string, string, number] {
        let length = 0;
        const startArray = name.indexOf("[");
        const endArray = name.indexOf("]");
        if (startArray > 0 && endArray > 0) {
            const lengthInString = name.substring(startArray + 1, endArray);
            length = +lengthInString;
            if (isNaN(length)) {
                length = +preProcessors[lengthInString.trim()];
            }
            name = name.substring(0, startArray);
        }
        return [name, type, length];
    }

    public initializeShaders(processingContext: Nullable<ShaderProcessingContext>): void {
        this._webgpuProcessingContext = processingContext as WebGPUShaderProcessingContext;

        this._missingVaryings.length = 0;
        this._textureArrayProcessing.length = 0;
        this.attributeKeywordName = undefined;
        this.varyingVertexKeywordName = undefined;
        this.varyingFragmentKeywordName = undefined;
    }

    public preProcessShaderCode(code: string, isFragment: boolean): string {
        const ubDeclaration = `// Internals UBO\nuniform ${WebGPUShaderProcessor.InternalsUBOName} {\nfloat yFactor_;\nfloat textureOutputHeight_;\n};\n`;
        const alreadyInjected = code.indexOf("// Internals UBO") !== -1;

        if (isFragment) {
            this._fragmentIsGLES3 = code.indexOf("#version 3") !== -1;
            if (this._fragmentIsGLES3) {
                this.varyingFragmentKeywordName = "in";
            }
            return alreadyInjected ? code : ubDeclaration + "##INJECTCODE##\n" + code;
        }

        this._vertexIsGLES3 = code.indexOf("#version 3") !== -1;
        if (this._vertexIsGLES3) {
            this.attributeKeywordName = "in";
            this.varyingVertexKeywordName = "out";
        }
        return alreadyInjected ? code : ubDeclaration + code;
    }

    public varyingCheck(varying: string, isFragment: boolean) {
        const outRegex = /(flat\s)?\s*\bout\b/;
        const inRegex = /(flat\s)?\s*\bin\b/;
        const varyingRegex = /(flat\s)?\s*\bvarying\b/;

        const regex = isFragment && this._fragmentIsGLES3 ? inRegex : !isFragment && this._vertexIsGLES3 ? outRegex : varyingRegex;

        return regex.test(varying);
    }

    public varyingProcessor(varying: string, isFragment: boolean, preProcessors: { [key: string]: string }) {
        this._preProcessors = preProcessors;

        const outRegex = /\s*(flat)?\s*out\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s+(\S+)\s*;/gm;
        const inRegex = /\s*(flat)?\s*in\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s+(\S+)\s*;/gm;
        const varyingRegex = /\s*(flat)?\s*varying\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s+(\S+)\s*;/gm;

        const regex = isFragment && this._fragmentIsGLES3 ? inRegex : !isFragment && this._vertexIsGLES3 ? outRegex : varyingRegex;
        const match = regex.exec(varying);
        if (match !== null) {
            const interpolationQualifier = match[1] ?? "";
            const varyingType = match[2];
            const name = match[3];
            let location: number;
            if (isFragment) {
                location = this._webgpuProcessingContext.availableVaryings[name];
                this._missingVaryings[location] = "";
                if (location === undefined) {
                    Logger.Warn(`Invalid fragment shader: The varying named "${name}" is not declared in the vertex shader! This declaration will be ignored.`);
                }
            } else {
                location = this._webgpuProcessingContext.getVaryingNextLocation(varyingType, this._getArraySize(name, varyingType, preProcessors)[2]);
                this._webgpuProcessingContext.availableVaryings[name] = location;
                this._missingVaryings[location] = `layout(location = ${location}) ${interpolationQualifier} in ${varyingType} ${name};`;
            }

            varying = varying.replace(
                match[0],
                location === undefined ? "" : `layout(location = ${location}) ${interpolationQualifier} ${isFragment ? "in" : "out"} ${varyingType} ${name};`
            );
        }
        return varying;
    }

    public attributeProcessor(attribute: string, preProcessors: { [key: string]: string }) {
        this._preProcessors = preProcessors;

        const inRegex = /\s*in\s+(\S+)\s+(\S+)\s*;/gm;
        const attribRegex = /\s*attribute\s+(\S+)\s+(\S+)\s*;/gm;

        const regex = this._vertexIsGLES3 ? inRegex : attribRegex;
        const match = regex.exec(attribute);
        if (match !== null) {
            const attributeType = match[1];
            const name = match[2];
            const location = this._webgpuProcessingContext.getAttributeNextLocation(attributeType, this._getArraySize(name, attributeType, preProcessors)[2]);

            this._webgpuProcessingContext.availableAttributes[name] = location;
            this._webgpuProcessingContext.orderedAttributes[location] = name;

            const numComponents = this._webgpuProcessingContext.vertexBufferKindToNumberOfComponents[name];
            if (numComponents !== undefined) {
                // Special case for an int/ivecX vertex buffer that is used as a float/vecX attribute in the shader.
                const newType = numComponents < 0 ? (numComponents === -1 ? "int" : "ivec" + -numComponents) : numComponents === 1 ? "uint" : "uvec" + numComponents;
                const newName = `_int_${name}_`;

                attribute = attribute.replace(match[0], `layout(location = ${location}) in ${newType} ${newName}; ${attributeType} ${name} = ${attributeType}(${newName});`);
            } else {
                attribute = attribute.replace(match[0], `layout(location = ${location}) in ${attributeType} ${name};`);
            }
        }
        return attribute;
    }

    public uniformProcessor(uniform: string, isFragment: boolean, preProcessors: { [key: string]: string }): string {
        this._preProcessors = preProcessors;

        const uniformRegex = /\s*uniform\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s+(\S+)\s*;/gm;

        const match = uniformRegex.exec(uniform);
        if (match !== null) {
            let uniformType = match[1];
            let name = match[2];

            if (uniformType.indexOf("sampler") === 0 || uniformType.indexOf("sampler") === 1) {
                let arraySize = 0; // 0 means the texture is not declared as an array

                [name, uniformType, arraySize] = this._getArraySize(name, uniformType, preProcessors);

                let textureInfo = this._webgpuProcessingContext.availableTextures[name];
                if (!textureInfo) {
                    textureInfo = {
                        autoBindSampler: true,
                        isTextureArray: arraySize > 0,
                        isStorageTexture: false,
                        textures: [],
                        sampleType: WebGPUConstants.TextureSampleType.Float,
                    };
                    for (let i = 0; i < (arraySize || 1); ++i) {
                        textureInfo.textures.push(this._webgpuProcessingContext.getNextFreeUBOBinding());
                    }
                }

                const samplerType = WebGPUShaderProcessor._SamplerTypeByWebGLSamplerType[uniformType] ?? "sampler";
                const isComparisonSampler = !!WebGPUShaderProcessor._IsComparisonSamplerByWebGPUSamplerType[samplerType];
                const samplerBindingType = isComparisonSampler ? WebGPUConstants.SamplerBindingType.Comparison : WebGPUConstants.SamplerBindingType.Filtering;
                const samplerName = name + Constants.AUTOSAMPLERSUFFIX;

                let samplerInfo = this._webgpuProcessingContext.availableSamplers[samplerName];
                if (!samplerInfo) {
                    samplerInfo = {
                        binding: this._webgpuProcessingContext.getNextFreeUBOBinding(),
                        type: samplerBindingType,
                    };
                }

                const componentType = uniformType.charAt(0) === "u" ? "u" : uniformType.charAt(0) === "i" ? "i" : "";

                if (componentType) {
                    uniformType = uniformType.substring(1);
                }

                const sampleType = isComparisonSampler
                    ? WebGPUConstants.TextureSampleType.Depth
                    : componentType === "u"
                      ? WebGPUConstants.TextureSampleType.Uint
                      : componentType === "i"
                        ? WebGPUConstants.TextureSampleType.Sint
                        : WebGPUConstants.TextureSampleType.Float;

                textureInfo.sampleType = sampleType;

                const isTextureArray = arraySize > 0;
                const samplerGroupIndex = samplerInfo.binding.groupIndex;
                const samplerBindingIndex = samplerInfo.binding.bindingIndex;
                const samplerFunction = WebGPUShaderProcessor._SamplerFunctionByWebGLSamplerType[uniformType];
                const textureType = WebGPUShaderProcessor._TextureTypeByWebGLSamplerType[uniformType];
                const textureDimension = WebGPUShaderProcessor._GpuTextureViewDimensionByWebGPUTextureType[textureType];

                // Manage textures and samplers.
                if (!isTextureArray) {
                    arraySize = 1;
                    uniform = `layout(set = ${samplerGroupIndex}, binding = ${samplerBindingIndex}) uniform ${samplerType} ${samplerName};
                        layout(set = ${textureInfo.textures[0].groupIndex}, binding = ${textureInfo.textures[0].bindingIndex}) uniform ${componentType}${textureType} ${name}Texture;
                        #define ${name} ${componentType}${samplerFunction}(${name}Texture, ${samplerName})`;
                } else {
                    const layouts = [];
                    layouts.push(`layout(set = ${samplerGroupIndex}, binding = ${samplerBindingIndex}) uniform ${componentType}${samplerType} ${samplerName};`);
                    uniform = `\n`;
                    for (let i = 0; i < arraySize; ++i) {
                        const textureSetIndex = textureInfo.textures[i].groupIndex;
                        const textureBindingIndex = textureInfo.textures[i].bindingIndex;

                        layouts.push(`layout(set = ${textureSetIndex}, binding = ${textureBindingIndex}) uniform ${textureType} ${name}Texture${i};`);

                        uniform += `${i > 0 ? "\n" : ""}#define ${name}${i} ${componentType}${samplerFunction}(${name}Texture${i}, ${samplerName})`;
                    }
                    uniform = layouts.join("\n") + uniform;
                    this._textureArrayProcessing.push(name);
                }

                this._webgpuProcessingContext.availableTextures[name] = textureInfo;
                this._webgpuProcessingContext.availableSamplers[samplerName] = samplerInfo;

                this._addSamplerBindingDescription(samplerName, samplerInfo, !isFragment);

                for (let i = 0; i < arraySize; ++i) {
                    this._addTextureBindingDescription(name, textureInfo, i, textureDimension, null, !isFragment);
                }
            } else {
                this._addUniformToLeftOverUBO(name, uniformType, preProcessors);
                uniform = "";
            }
        }
        return uniform;
    }

    public uniformBufferProcessor(uniformBuffer: string, isFragment: boolean): string {
        const uboRegex = /uniform\s+(\w+)/gm;

        const match = uboRegex.exec(uniformBuffer);
        if (match !== null) {
            const name = match[1];

            let uniformBufferInfo = this._webgpuProcessingContext.availableBuffers[name];
            if (!uniformBufferInfo) {
                const knownUBO = WebGPUShaderProcessingContext.KnownUBOs[name];

                let binding;
                if (knownUBO && knownUBO.binding.groupIndex !== -1) {
                    binding = knownUBO.binding;
                } else {
                    binding = this._webgpuProcessingContext.getNextFreeUBOBinding();
                }

                uniformBufferInfo = { binding };
                this._webgpuProcessingContext.availableBuffers[name] = uniformBufferInfo;
            }

            this._addBufferBindingDescription(name, uniformBufferInfo, WebGPUConstants.BufferBindingType.Uniform, !isFragment);

            uniformBuffer = uniformBuffer.replace("uniform", `layout(set = ${uniformBufferInfo.binding.groupIndex}, binding = ${uniformBufferInfo.binding.bindingIndex}) uniform`);
        }
        return uniformBuffer;
    }

    public postProcessor(
        code: string,
        defines: string[],
        isFragment: boolean,
        _processingContext: Nullable<ShaderProcessingContext>,
        _parameters?: { [key: string]: number | string | boolean | undefined }
    ): string {
        const hasDrawBuffersExtension = code.search(/#extension.+GL_EXT_draw_buffers.+require/) !== -1;

        // Remove extensions
        const regex = /#extension.+(GL_OVR_multiview2|GL_OES_standard_derivatives|GL_EXT_shader_texture_lod|GL_EXT_frag_depth|GL_EXT_draw_buffers).+(enable|require)/g;
        code = code.replace(regex, "");

        // Replace instructions
        code = code.replace(/texture2D\s*\(/g, "texture(");
        if (isFragment) {
            const hasFragCoord = code.indexOf("gl_FragCoord") >= 0;
            const fragCoordCode = `
                glFragCoord_ = gl_FragCoord;
                if (yFactor_ == 1.) {
                    glFragCoord_.y = textureOutputHeight_ - glFragCoord_.y;
                }
            `;

            const injectCode = hasFragCoord ? "vec4 glFragCoord_;\n" : "";
            const hasOutput = code.search(/layout *\(location *= *0\) *out/g) !== -1;

            code = code.replace(/texture2DLodEXT\s*\(/g, "textureLod(");
            code = code.replace(/textureCubeLodEXT\s*\(/g, "textureLod(");
            code = code.replace(/textureCube\s*\(/g, "texture(");
            code = code.replace(/gl_FragDepthEXT/g, "gl_FragDepth");
            code = code.replace(/gl_FragColor/g, "glFragColor");
            code = code.replace(/gl_FragData/g, "glFragData");
            code = code.replace(/gl_FragCoord/g, "glFragCoord_");
            if (!this._fragmentIsGLES3) {
                code = code.replace(/void\s+?main\s*\(/g, (hasDrawBuffersExtension || hasOutput ? "" : "layout(location = 0) out vec4 glFragColor;\n") + "void main(");
            } else {
                const match = /^\s*out\s+\S+\s+\S+\s*;/gm.exec(code);
                if (match !== null) {
                    code = code.substring(0, match.index) + "layout(location = 0) " + code.substring(match.index);
                }
            }
            code = code.replace(/dFdy/g, "(-yFactor_)*dFdy"); // will also handle dFdyCoarse and dFdyFine
            code = code.replace("##INJECTCODE##", injectCode);

            if (hasFragCoord) {
                code = InjectStartingAndEndingCode(code, "void main", fragCoordCode);
            }
        } else {
            code = code.replace(/gl_InstanceID/g, "gl_InstanceIndex");
            code = code.replace(/gl_VertexID/g, "gl_VertexIndex");
            const hasMultiviewExtension = defines.indexOf("#define MULTIVIEW") !== -1;
            if (hasMultiviewExtension) {
                return "#extension GL_OVR_multiview2 : require\nlayout (num_views = 2) in;\n" + code;
            }
        }

        // Flip Y + convert z range from [-1,1] to [0,1]
        if (!isFragment) {
            const lastClosingCurly = code.lastIndexOf("}");
            code = code.substring(0, lastClosingCurly);
            code += "gl_Position.y *= yFactor_;\n";
            // isNDCHalfZRange is always true in WebGPU
            code += "}";
        }

        return code;
    }

    private _applyTextureArrayProcessing(code: string, name: string): string {
        // Replaces the occurrences of name[XX] by nameXX
        const regex = new RegExp(name + "\\s*\\[(.+)?\\]", "gm");
        let match = regex.exec(code);

        while (match !== null) {
            const index = match[1];
            let iindex = +index;
            if (this._preProcessors && isNaN(iindex)) {
                iindex = +this._preProcessors[index.trim()];
            }
            code = code.replace(match[0], name + iindex);
            match = regex.exec(code);
        }

        return code;
    }

    protected _generateLeftOverUBOCode(name: string, uniformBufferDescription: WebGPUBufferDescription): string {
        let ubo = `layout(set = ${uniformBufferDescription.binding.groupIndex}, binding = ${uniformBufferDescription.binding.bindingIndex}) uniform ${name} {\n    `;
        for (const leftOverUniform of this._webgpuProcessingContext.leftOverUniforms) {
            if (leftOverUniform.length > 0) {
                ubo += `    ${leftOverUniform.type} ${leftOverUniform.name}[${leftOverUniform.length}];\n`;
            } else {
                ubo += `    ${leftOverUniform.type} ${leftOverUniform.name};\n`;
            }
        }
        ubo += "};\n\n";

        return ubo;
    }

    public finalizeShaders(vertexCode: string, fragmentCode: string): { vertexCode: string; fragmentCode: string } {
        // make replacements for texture names in the texture array case
        for (let i = 0; i < this._textureArrayProcessing.length; ++i) {
            const name = this._textureArrayProcessing[i];
            vertexCode = this._applyTextureArrayProcessing(vertexCode, name);
            fragmentCode = this._applyTextureArrayProcessing(fragmentCode, name);
        }

        // inject the missing varying in the fragment shader
        for (let i = 0; i < this._missingVaryings.length; ++i) {
            const decl = this._missingVaryings[i];
            if (decl && decl.length > 0) {
                fragmentCode = decl + "\n" + fragmentCode;
            }
        }

        // Builds the leftover UBOs.
        const leftOverUBO = this._buildLeftOverUBO();

        vertexCode = leftOverUBO + vertexCode;
        fragmentCode = leftOverUBO + fragmentCode;

        this._collectBindingNames();
        this._preCreateBindGroupEntries();

        this._preProcessors = null as any;
        this._webgpuProcessingContext.vertexBufferKindToNumberOfComponents = {};

        return { vertexCode, fragmentCode };
    }
}

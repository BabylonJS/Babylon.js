import { Nullable } from '../../types';
import { IShaderProcessor } from '../Processors/iShaderProcessor';
import { ShaderProcessingContext } from "../Processors/shaderProcessingOptions";
import { WebGPUTextureSamplerBindingDescription, WebGPUShaderProcessingContext } from './webgpuShaderProcessingContext';
import * as WebGPUConstants from './webgpuConstants';
import { Logger } from '../../Misc/logger';
import { ThinEngine } from "../thinEngine";

const _knownUBOs: { [key: string]: { setIndex: number, bindingIndex: number} } = {
    "Scene": { setIndex: 0, bindingIndex: 0 },
    "Light0": { setIndex: 0, bindingIndex: 5 },
    "Light1": { setIndex: 0, bindingIndex: 6 },
    "Light2": { setIndex: 0, bindingIndex: 7 },
    "Light3": { setIndex: 0, bindingIndex: 8 },
    "Light4": { setIndex: 0, bindingIndex: 9 },
    "Light5": { setIndex: 0, bindingIndex: 10 },
    "Light6": { setIndex: 0, bindingIndex: 11 },
    "Light7": { setIndex: 0, bindingIndex: 12 },
    "Light8": { setIndex: 0, bindingIndex: 13 },
    "Material": { setIndex: 1, bindingIndex: 0 },
    "Mesh": { setIndex: 1, bindingIndex: 1 },
};

const _knownSamplers: { [key: string]: WebGPUTextureSamplerBindingDescription } = {
    "environmentBrdfSampler": { sampler: { setIndex: 0, bindingIndex: 1 }, isTextureArray: false, textures: [{ setIndex: 0, bindingIndex: 2 }] },
    // "reflectionSampler": { setIndex: 0, bindingIndex: 3 },
};

// TODO WEBGPU. sampler3D
const _samplerFunctionByWebGLSamplerType: { [key: string]: string } = {
    "sampler2D": "sampler2D",
    "sampler2DArray": "sampler2DArray",
    "sampler2DShadow": "sampler2DShadow",
    "sampler2DArrayShadow": "sampler2DArrayShadow",
    "samplerCube": "samplerCube"
};

const _textureTypeByWebGLSamplerType: { [key: string]: string } = {
    "sampler2D": "texture2D",
    "sampler2DArray": "texture2DArray",
    "sampler2DShadow": "texture2D",
    "sampler2DArrayShadow": "texture2DArray",
    "samplerCube": "textureCube",
    "samplerCubeArray": "textureCubeArray"
};

const _gpuTextureViewDimensionByWebGPUTextureType: { [key: string]: GPUTextureViewDimension } = {
    "textureCube": WebGPUConstants.TextureViewDimension.Cube,
    "textureCubeArray": WebGPUConstants.TextureViewDimension.CubeArray,
    "texture2D": WebGPUConstants.TextureViewDimension.E2d,
    "texture2DArray": WebGPUConstants.TextureViewDimension.E2dArray,
};

// if the webgl sampler type is not listed in this array, "sampler" is taken by default
const _samplerTypeByWebGLSamplerType: { [key: string]: string } = {
    "sampler2DShadow": "samplerShadow",
    "sampler2DArrayShadow": "samplerShadow",
};

const _isComparisonSamplerByWebGPUSamplerType: { [key: string]: boolean } = {
    "samplerShadow": true,
    "samplerArrayShadow": true,
    "sampler": false,
};

/** @hidden */
export class WebGPUShaderProcessor implements IShaderProcessor {

    protected _missingVaryings: Array<string> = [];
    protected _textureArrayProcessing: Array<string> = [];
    protected _preProcessors: { [key: string]: string };

    private _getArraySize(name: string, preProcessors: { [key: string]: string }): [string, number] {
        let length = 0;
        const startArray = name.indexOf("[");
        const endArray = name.indexOf("]");
        if (startArray > 0 && endArray > 0) {
            const lengthInString = name.substring(startArray + 1, endArray);
            length = +(lengthInString);
            if (isNaN(length)) {
                length = +(preProcessors[lengthInString.trim()]);
            }
            name = name.substr(0, startArray);
        }
        return [name, length];
    }

    public initializeShaders(processingContext: Nullable<ShaderProcessingContext>): void {
        this._missingVaryings.length = 0;
        this._textureArrayProcessing.length = 0;
    }

    public varyingProcessor(varying: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) {
        this._preProcessors = preProcessors;

        const webgpuProcessingContext = processingContext! as WebGPUShaderProcessingContext;

        const varyingRegex = new RegExp(/\s*varying\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s+(\S+)\s*;/gm);
        const match = varyingRegex.exec(varying);
        if (match != null) {
            const varyingType = match[1];
            const name = match[2];
            let location: number;
            if (isFragment) {
                location = webgpuProcessingContext.availableVaryings[name];
                this._missingVaryings[location] = "";
                if (location === undefined) {
                    Logger.Warn(`Invalid fragment shader: The varying named "${name}" is not declared in the vertex shader! This declaration will be ignored.`);
                }
            }
            else {
                location = webgpuProcessingContext.getVaryingNextLocation(varyingType, this._getArraySize(name, preProcessors)[1]);
                webgpuProcessingContext.availableVaryings[name] = location;
                this._missingVaryings[location] = `layout(location = ${location}) in ${varyingType} ${name};`;
            }

            varying = varying.replace(match[0], location === undefined ? "" : `layout(location = ${location}) ${isFragment ? "in" : "out"} ${varyingType} ${name};`);
        }
        return varying;
    }

    public attributeProcessor(attribute: string, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) {
        this._preProcessors = preProcessors;

        const webgpuProcessingContext = processingContext! as WebGPUShaderProcessingContext;

        const attribRegex = new RegExp(/\s*attribute\s+(\S+)\s+(\S+)\s*;/gm);
        const match = attribRegex.exec(attribute);
        if (match != null) {
            const varyingType = match[1];
            const name = match[2];
            const location = webgpuProcessingContext.getAttributeNextLocation(varyingType, this._getArraySize(name, preProcessors)[1]);

            webgpuProcessingContext.availableAttributes[name] = location;
            webgpuProcessingContext.orderedAttributes[location] = name;

            attribute = attribute.replace(match[0], `layout(location = ${location}) in ${varyingType} ${name};`);
        }
        return attribute;
    }

    public uniformProcessor(uniform: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>): string {
        this._preProcessors = preProcessors;

        const webgpuProcessingContext = processingContext! as WebGPUShaderProcessingContext;

        const uniformRegex = new RegExp(/\s*uniform\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s+(\S+)\s*;/gm);

        const match = uniformRegex.exec(uniform);
        if (match != null) {
            let uniformType = match[1];
            let name = match[2];

            if (uniformType.indexOf("sampler") === 0 || uniformType.indexOf("sampler") === 1) {
                let samplerInfo = _knownSamplers[name];
                let arraySize = 0; // 0 means the sampler/texture is not declared as an array
                if (!samplerInfo) {
                    [name, arraySize] = this._getArraySize(name, preProcessors);
                    samplerInfo = webgpuProcessingContext.availableSamplers[name];
                    if (!samplerInfo) {
                        samplerInfo = {
                            sampler: webgpuProcessingContext.getNextFreeUBOBinding(),
                            isTextureArray: arraySize > 0,
                            textures: [],
                        };
                        for (let i = 0; i < (arraySize || 1); ++i) {
                            samplerInfo.textures.push(webgpuProcessingContext.getNextFreeUBOBinding());
                        }
                    } else {
                        arraySize = samplerInfo.isTextureArray ? samplerInfo.textures.length : 0;
                    }
                }

                const componentType = uniformType.charAt(0) === 'u' ? 'u' : uniformType.charAt(0) === 'i' ? 'i' : '';

                if (componentType) {
                    uniformType = uniformType.substr(1);
                }

                const isTextureArray = arraySize > 0;
                const samplerSetIndex = samplerInfo.sampler.setIndex;
                const samplerBindingIndex = samplerInfo.sampler.bindingIndex;
                const samplerFunction = _samplerFunctionByWebGLSamplerType[uniformType];
                const samplerType = _samplerTypeByWebGLSamplerType[uniformType] ?? "sampler";
                const textureType = _textureTypeByWebGLSamplerType[uniformType];
                const textureDimension = _gpuTextureViewDimensionByWebGPUTextureType[textureType];
                const isComparisonSampler = !!_isComparisonSamplerByWebGPUSamplerType[samplerType];

                // Manage textures and samplers.
                if (!isTextureArray) {
                    arraySize = 1;
                    uniform = `layout(set = ${samplerSetIndex}, binding = ${samplerBindingIndex}) uniform ${componentType}${samplerType} ${name}Sampler;
                        layout(set = ${samplerInfo.textures[0].setIndex}, binding = ${samplerInfo.textures[0].bindingIndex}) uniform ${textureType} ${name}Texture;
                        #define ${name} ${componentType}${samplerFunction}(${name}Texture, ${name}Sampler)`;
                } else {
                    let layouts = [];
                    layouts.push(`layout(set = ${samplerSetIndex}, binding = ${samplerBindingIndex}) uniform ${componentType}${samplerType} ${name}Sampler;`);
                    uniform = `\r\n`;
                    for (let i = 0; i < arraySize; ++i) {
                        const textureSetIndex = samplerInfo.textures[i].setIndex;
                        const textureBindingIndex = samplerInfo.textures[i].bindingIndex;

                        layouts.push(`layout(set = ${textureSetIndex}, binding = ${textureBindingIndex}) uniform ${textureType} ${name}Texture${i};`);

                        uniform += `${i > 0 ? '\r\n' : ''}#define ${name}${i} ${componentType}${samplerFunction}(${name}Texture${i}, ${name}Sampler)`;
                    }
                    uniform = layouts.join('\r\n') + uniform;
                    this._textureArrayProcessing.push(name);
                }

                webgpuProcessingContext.availableSamplers[name] = samplerInfo;

                if (!webgpuProcessingContext.orderedUBOsAndSamplers[samplerSetIndex]) {
                    webgpuProcessingContext.orderedUBOsAndSamplers[samplerSetIndex] = [];
                }
                if (!webgpuProcessingContext.orderedUBOsAndSamplers[samplerSetIndex][samplerBindingIndex]) {
                    webgpuProcessingContext.orderedUBOsAndSamplers[samplerSetIndex][samplerBindingIndex] = {
                        isSampler: true,
                        isTexture: false,
                        isComparisonSampler,
                        usedInVertex: false,
                        usedInFragment: false,
                        name,
                    };
                }

                if (isFragment) {
                    webgpuProcessingContext.orderedUBOsAndSamplers[samplerSetIndex][samplerBindingIndex].usedInFragment = true;
                } else {
                    webgpuProcessingContext.orderedUBOsAndSamplers[samplerSetIndex][samplerBindingIndex].usedInVertex = true;
                }

                for (let i = 0; i < arraySize; ++i) {
                    const textureSetIndex = samplerInfo.textures[i].setIndex;
                    const textureBindingIndex = samplerInfo.textures[i].bindingIndex;

                    if (!webgpuProcessingContext.orderedUBOsAndSamplers[textureSetIndex]) {
                        webgpuProcessingContext.orderedUBOsAndSamplers[textureSetIndex] = [];
                    }
                    if (!webgpuProcessingContext.orderedUBOsAndSamplers[textureSetIndex][textureBindingIndex]) {
                        webgpuProcessingContext.orderedUBOsAndSamplers[textureSetIndex][textureBindingIndex] = {
                            isSampler: false,
                            isTexture: true,
                            sampleType: isComparisonSampler ? WebGPUConstants.TextureSampleType.Depth :
                                        componentType === 'u' ? WebGPUConstants.TextureSampleType.Uint :
                                        componentType === 'i' ? WebGPUConstants.TextureSampleType.Sint : WebGPUConstants.TextureSampleType.Float,
                            textureDimension,
                            usedInVertex: false,
                            usedInFragment: false,
                            name: isTextureArray ? name + i.toString() : name,
                        };
                    }
                    if (isFragment) {
                        webgpuProcessingContext.orderedUBOsAndSamplers[textureSetIndex][textureBindingIndex].usedInFragment = true;
                    } else {
                        webgpuProcessingContext.orderedUBOsAndSamplers[textureSetIndex][textureBindingIndex].usedInVertex = true;
                    }
                }
            }
            else {
                // Check the size of the uniform array in case of array.
                let length = 0;

                [name, length] = this._getArraySize(name, preProcessors);

                for (let i = 0; i < webgpuProcessingContext.leftOverUniforms.length; i++) {
                    if (webgpuProcessingContext.leftOverUniforms[i].name === name) {
                        return "";
                    }
                }

                webgpuProcessingContext.leftOverUniforms.push({
                    name,
                    type: uniformType,
                    length
                });
                uniform = "";
            }
        }
        return uniform;
    }

    public uniformBufferProcessor(uniformBuffer: string, isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>): string {
        const webgpuProcessingContext = processingContext! as WebGPUShaderProcessingContext;
        const uboRegex = new RegExp(/uniform\s+(\w+)/gm);

        const match = uboRegex.exec(uniformBuffer);
        if (match != null) {
            const name = match[1];
            let setIndex: number;
            let bindingIndex: number;
            const knownUBO = _knownUBOs[name];
            if (knownUBO) {
                setIndex = knownUBO.setIndex;
                bindingIndex = knownUBO.bindingIndex;
            }
            else {
                if (isFragment) {
                    const availableUBO = webgpuProcessingContext.availableUBOs[name];
                    if (availableUBO) {
                        setIndex = availableUBO.setIndex;
                        bindingIndex = availableUBO.bindingIndex;
                    }
                    else {
                        const nextBinding = webgpuProcessingContext.getNextFreeUBOBinding();
                        setIndex = nextBinding.setIndex;
                        bindingIndex = nextBinding.bindingIndex;
                    }
                }
                else {
                    const nextBinding = webgpuProcessingContext.getNextFreeUBOBinding();
                    setIndex = nextBinding.setIndex;
                    bindingIndex = nextBinding.bindingIndex;
                }
            }

            webgpuProcessingContext.availableUBOs[name] = { setIndex, bindingIndex };
            if (!webgpuProcessingContext.orderedUBOsAndSamplers[setIndex]) {
                webgpuProcessingContext.orderedUBOsAndSamplers[setIndex] = [];
            }
            if (!webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex]) {
                webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex] = { isSampler: false, isTexture: false, name, usedInVertex: false, usedInFragment: false };
            }
            if (isFragment) {
                webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex].usedInFragment = true;
            } else {
                webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex].usedInVertex = true;
            }

            uniformBuffer = uniformBuffer.replace("uniform", `layout(set = ${setIndex}, binding = ${bindingIndex}) uniform`);
        }
        return uniformBuffer;
    }

    // public endOfUniformBufferProcessor(closingBracketLine: string, isFragment: boolean): string {
    //     console.log("uniformBuffer closingBracketLine ", closingBracketLine);
    //     return closingBracketLine;
    // }

    public postProcessor(code: string, defines: string[], isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>, engine: ThinEngine) {
        const hasDrawBuffersExtension = code.search(/#extension.+GL_EXT_draw_buffers.+require/) !== -1;

        // Remove extensions
        var regex = /#extension.+(GL_OVR_multiview2|GL_OES_standard_derivatives|GL_EXT_shader_texture_lod|GL_EXT_frag_depth|GL_EXT_draw_buffers).+(enable|require)/g;
        code = code.replace(regex, "");

        // Replace instructions
        code = code.replace(/texture2D\s*\(/g, "texture(");
        if (isFragment) {
            code = code.replace(/texture2DLodEXT\s*\(/g, "textureLod(");
            code = code.replace(/textureCubeLodEXT\s*\(/g, "textureLod(");
            code = code.replace(/textureCube\s*\(/g, "texture(");
            code = code.replace(/gl_FragDepthEXT/g, "gl_FragDepth");
            code = code.replace(/gl_FragColor/g, "glFragColor");
            code = code.replace(/gl_FragData/g, "glFragData");
            code = code.replace(/void\s+?main\s*\(/g, (hasDrawBuffersExtension ? "" : "layout(location = 0) out vec4 glFragColor;\n") + "void main(");
        } else {
            code = code.replace(/gl_InstanceID/g, "gl_InstanceIndex");
            code = code.replace(/gl_VertexID/g, "gl_VertexIndex");
            var hasMultiviewExtension = defines.indexOf("#define MULTIVIEW") !== -1;
            if (hasMultiviewExtension) {
                return "#extension GL_OVR_multiview2 : require\nlayout (num_views = 2) in;\n" + code;
            }
        }

        // Flip Y + convert z range from [-1,1] to [0,1]
        if (!isFragment) {
            const lastClosingCurly = code.lastIndexOf("}");
            code = code.substring(0, lastClosingCurly);
            code += "gl_Position.y *= -1.;\n";
            if (!engine.isNDCHalfZRange) {
                code += "gl_Position.z = (gl_Position.z + gl_Position.w) / 2.0;\n";
            }
            code += "}";
        }

        return code;
    }

    private _applyTextureArrayProcessing(code: string, name: string): string {
        // Replaces the occurrences of name[XX] by nameXX
        const regex = new RegExp(name + "\\s*\\[(.+)?\\]", "gm");
        let match = regex.exec(code);

        while (match != null) {
            let index = match[1];
            let iindex = +(index);
            if (this._preProcessors && isNaN(iindex)) {
                iindex = +(this._preProcessors[index.trim()]);
            }
            code = code.replace(match[0], name + iindex);
            match = regex.exec(code);
        }

        return code;
    }

    public finalizeShaders(vertexCode: string, fragmentCode: string, processingContext: Nullable<ShaderProcessingContext>): { vertexCode: string, fragmentCode: string } {
        const webgpuProcessingContext = processingContext! as WebGPUShaderProcessingContext;

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
        if (webgpuProcessingContext.leftOverUniforms.length) {
            const name = "LeftOver";
            let availableUBO = webgpuProcessingContext.availableUBOs[name];
            if (!availableUBO) {
                availableUBO = webgpuProcessingContext.getNextFreeUBOBinding();
                webgpuProcessingContext.availableUBOs[name] = availableUBO;
                if (!webgpuProcessingContext.orderedUBOsAndSamplers[availableUBO.setIndex]) {
                    webgpuProcessingContext.orderedUBOsAndSamplers[availableUBO.setIndex] = [];
                }
                webgpuProcessingContext.orderedUBOsAndSamplers[availableUBO.setIndex][availableUBO.bindingIndex] = { isSampler: false, isTexture: false, usedInVertex: true, usedInFragment: true, name };
            }

            let ubo = `layout(set = ${availableUBO.setIndex}, binding = ${availableUBO.bindingIndex}) uniform ${name} {\n    `;
            for (let leftOverUniform of webgpuProcessingContext.leftOverUniforms) {
                if (leftOverUniform.length > 0) {
                    ubo += `    ${leftOverUniform.type} ${leftOverUniform.name}[${leftOverUniform.length}];\n`;
                }
                else {
                    ubo += `    ${leftOverUniform.type} ${leftOverUniform.name};\n`;
                }
            }
            ubo += "};\n\n";

            // Currently set in both vert and frag but could be optim away if necessary.
            vertexCode = ubo + vertexCode;
            fragmentCode = ubo + fragmentCode;
        }

        // collect all the buffer names for faster processing later in _getBindGroupsToRender
        for (let i = 0; i < webgpuProcessingContext.orderedUBOsAndSamplers.length; i++) {
            const setDefinition = webgpuProcessingContext.orderedUBOsAndSamplers[i];
            if (setDefinition === undefined) {
                continue;
            }
            for (let j = 0; j < setDefinition.length; j++) {
                const bindingDefinition = webgpuProcessingContext.orderedUBOsAndSamplers[i][j];
                if (bindingDefinition && !bindingDefinition.isSampler && !bindingDefinition.isTexture) {
                    webgpuProcessingContext.uniformBufferNames.push(bindingDefinition.name);
                }
            }
        }

        this._preProcessors = null as any;

        return { vertexCode, fragmentCode };
    }
}
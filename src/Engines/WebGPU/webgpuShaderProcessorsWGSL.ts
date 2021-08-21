import { Nullable } from '../../types';
import { IShaderProcessor, ShaderLanguage } from '../Processors/iShaderProcessor';
import { ShaderProcessingContext } from "../Processors/shaderProcessingOptions";
import { WebGPUTextureSamplerBindingDescription, WebGPUShaderProcessingContext } from './webgpuShaderProcessingContext';
import * as WebGPUConstants from './webgpuConstants';
import { Logger } from '../../Misc/logger';
import { ThinEngine } from "../thinEngine";

const _knownUBOs: { [key: string]: { setIndex: number, bindingIndex: number, varName: string } } = {
    "Scene": { setIndex: 0, bindingIndex: 0, varName: "scene" },
    "Light0": { setIndex: 0, bindingIndex: 5, varName: "light0" },
    "Light1": { setIndex: 0, bindingIndex: 6, varName: "light1" },
    "Light2": { setIndex: 0, bindingIndex: 7, varName: "light2" },
    "Light3": { setIndex: 0, bindingIndex: 8, varName: "light3" },
    "Light4": { setIndex: 0, bindingIndex: 9, varName: "light4" },
    "Light5": { setIndex: 0, bindingIndex: 10, varName: "light5" },
    "Light6": { setIndex: 0, bindingIndex: 11, varName: "light6" },
    "Light7": { setIndex: 0, bindingIndex: 12, varName: "light7" },
    "Light8": { setIndex: 0, bindingIndex: 13, varName: "light8" },
    "Material": { setIndex: 1, bindingIndex: 0, varName: "material" },
    "Mesh": { setIndex: 1, bindingIndex: 1, varName: "mesh" },
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
    "samplerCube": "samplerCube",
    "sampler3D": "sampler3D",
};

const _textureTypeByWebGLSamplerType: { [key: string]: string } = {
    "sampler2D": "texture2D",
    "sampler2DArray": "texture2DArray",
    "sampler2DShadow": "texture2D",
    "sampler2DArrayShadow": "texture2DArray",
    "samplerCube": "textureCube",
    "samplerCubeArray": "textureCubeArray",
    "sampler3D": "texture3D",
};

const _gpuTextureViewDimensionByWebGPUTextureType: { [key: string]: GPUTextureViewDimension } = {
    "textureCube": WebGPUConstants.TextureViewDimension.Cube,
    "textureCubeArray": WebGPUConstants.TextureViewDimension.CubeArray,
    "texture2D": WebGPUConstants.TextureViewDimension.E2d,
    "texture2DArray": WebGPUConstants.TextureViewDimension.E2dArray,
    "texture3D": WebGPUConstants.TextureViewDimension.E3d,
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
export class WebGPUShaderProcessorWGSL implements IShaderProcessor {

    protected _missingVaryings: Array<string> = [];
    protected _textureArrayProcessing: Array<string> = [];
    protected _preProcessors: { [key: string]: string };
    protected _attributesWGSL: string[];
    protected _attributesDeclWGSL: string[];
    protected _attributeNamesWGSL: string[];
    protected _varyingsWGSL: string[];
    protected _varyingsDeclWGSL: string[];
    protected _varyingNamesWGSL: string[];

    public shaderLanguage = ShaderLanguage.WGSL;
    public uniformRegexp = /\s*uniform\s+(\S+)\s*:\s*(.+)\s*;/;
    public uniformBufferRegexp = /\s*uniform\s+(\S+)\s*\{/;
    public noPrecision = true;

    private _getArraySize(name: string, preProcessors: { [key: string]: string }): [string, number] {
        let length = 0;

        const endArray = name.lastIndexOf(">");
        if (name.indexOf("array") >= 0 && endArray > 0) {
            let startArray = endArray;
            while (startArray > 0 && name.charAt(startArray) !== ' ' && name.charAt(startArray) !== ',') {
                startArray--;
            }
            const lengthInString = name.substring(startArray + 1, endArray);
            length = +(lengthInString);
            if (isNaN(length)) {
                length = +(preProcessors[lengthInString.trim()]);
            }
            while (startArray > 0 && (name.charAt(startArray) === ' ' || name.charAt(startArray) === ',')) {
                startArray--;
            }
            name = name.substring(name.indexOf("<") + 1, startArray + 1);
        }

        return [name, length];
    }

    public initializeShaders(processingContext: Nullable<ShaderProcessingContext>): void {
        this._missingVaryings.length = 0;
        this._textureArrayProcessing.length = 0;

        this._attributesWGSL = [];
        this._attributesDeclWGSL = [];
        this._attributeNamesWGSL = [];
        this._varyingsWGSL = [];
        this._varyingsDeclWGSL = [];
        this._varyingNamesWGSL = [];
    }

    public varyingProcessor(varying: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) {
        this._preProcessors = preProcessors;

        const webgpuProcessingContext = processingContext! as WebGPUShaderProcessingContext;

        const varyingRegex = new RegExp(/\s*varying\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s*:\s*(.+)\s*;/gm);
        const match = varyingRegex.exec(varying);
        if (match != null) {
            const varyingType = match[2];
            const name = match[1];
            let location: number;
            if (isFragment) {
                location = webgpuProcessingContext.availableVaryings[name];
                this._missingVaryings[location] = "";
                if (location === undefined) {
                    Logger.Warn(`Invalid fragment shader: The varying named "${name}" is not declared in the vertex shader! This declaration will be ignored.`);
                }
            }
            else {
                location = webgpuProcessingContext.getVaryingNextLocation(varyingType, this._getArraySize(varyingType, preProcessors)[1]);
                webgpuProcessingContext.availableVaryings[name] = location;
                this._varyingsWGSL.push(`[[location(${location})]] ${name} : ${varyingType};`);
                this._varyingsDeclWGSL.push(`var<private> ${name} : ${varyingType};`);
                this._varyingNamesWGSL.push(name);
            }

            varying = "";
        }
        return varying;
    }

    public attributeProcessor(attribute: string, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) {
        this._preProcessors = preProcessors;

        const webgpuProcessingContext = processingContext! as WebGPUShaderProcessingContext;

        const attribRegex = new RegExp(/\s*attribute\s+(\S+)\s*:\s*(.+)\s*;/gm);
        const match = attribRegex.exec(attribute);
        if (match != null) {
            const attributeType = match[2];
            const name = match[1];
            const location = webgpuProcessingContext.getAttributeNextLocation(attributeType, this._getArraySize(attributeType, preProcessors)[1]);

            webgpuProcessingContext.availableAttributes[name] = location;
            webgpuProcessingContext.orderedAttributes[location] = name;

            this._attributesWGSL.push(`[[location(${location})]] ${name} : ${attributeType};`);
            this._attributesDeclWGSL.push(`var<private> ${name} : ${attributeType};`);
            this._attributeNamesWGSL.push(name);
            attribute = "";
        }
        return attribute;
    }

    public uniformProcessor(uniform: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>): string {
        this._preProcessors = preProcessors;

        const webgpuProcessingContext = processingContext! as WebGPUShaderProcessingContext;

        const uniformRegex = new RegExp(/\s*uniform\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s*:\s*(.+)\s*;/gm);

        const match = uniformRegex.exec(uniform);
        if (match != null) {
            let uniformType = match[2];
            let name = match[1];

            if (uniformType.indexOf("sampler") === 0 || uniformType.indexOf("sampler") === 1) {
                let samplerInfo = _knownSamplers[name];
                let arraySize = 0; // 0 means the sampler/texture is not declared as an array
                if (!samplerInfo) {
                    [uniformType, arraySize] = this._getArraySize(uniformType, preProcessors);
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

                const samplerBindingType = isComparisonSampler ? WebGPUConstants.SamplerBindingType.Comparison : WebGPUConstants.SamplerBindingType.Filtering;

                if (!webgpuProcessingContext.orderedUBOsAndSamplers[samplerSetIndex]) {
                    webgpuProcessingContext.orderedUBOsAndSamplers[samplerSetIndex] = [];
                }
                if (!webgpuProcessingContext.orderedUBOsAndSamplers[samplerSetIndex][samplerBindingIndex]) {
                    webgpuProcessingContext.orderedUBOsAndSamplers[samplerSetIndex][samplerBindingIndex] = {
                        isSampler: true,
                        isTexture: false,
                        samplerBindingType,
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
                        const sampleType =
                            isComparisonSampler ? WebGPUConstants.TextureSampleType.Depth :
                                componentType === 'u' ? WebGPUConstants.TextureSampleType.Uint :
                                    componentType === 'i' ? WebGPUConstants.TextureSampleType.Sint : WebGPUConstants.TextureSampleType.Float;

                        webgpuProcessingContext.orderedUBOsAndSamplers[textureSetIndex][textureBindingIndex] = {
                            isSampler: false,
                            isTexture: true,
                            sampleType,
                            textureDimension,
                            usedInVertex: false,
                            usedInFragment: false,
                            name: isTextureArray ? name + i.toString() : name,
                            origName: name,
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

                [uniformType, length] = this._getArraySize(uniformType, preProcessors);

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
            const curVisibility = webgpuProcessingContext.availableUBONames[name] ?? 0;

            webgpuProcessingContext.availableUBONames[name] = curVisibility + (isFragment ? 2 : 1);

            uniformBuffer = uniformBuffer.replace("uniform", "[[block]]\nstruct");
        }
        return uniformBuffer;
    }

    public postProcessor(code: string, defines: string[], isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>, engine: ThinEngine) {
        return code;
    }

    public finalizeShaders(vertexCode: string, fragmentCode: string, processingContext: Nullable<ShaderProcessingContext>): { vertexCode: string, fragmentCode: string } {
        const webgpuProcessingContext = processingContext! as WebGPUShaderProcessingContext;

        // TODO WEBGPU. From the shader code:
        //  * extract the ubos
        //  * extract the samplers
        webgpuProcessingContext.samplerNames = [];

        let vertexUniformBuffersDecl = "";
        let fragmentUniformBuffersDecl = "";
        for (const name in webgpuProcessingContext.availableUBONames) {
            const visibility = webgpuProcessingContext.availableUBONames[name];
            const visibleFromVertex = visibility & 1;
            const visibleFromFragment = visibility & 2;
            const knownUBO = _knownUBOs[name];

            let setIndex: number;
            let bindingIndex: number;
            let varName: string;

            if (knownUBO) {
                setIndex = knownUBO.setIndex;
                bindingIndex = knownUBO.bindingIndex;
                varName = knownUBO.varName;
                if (visibleFromVertex) {
                    vertexUniformBuffersDecl += `[[group(${setIndex}), binding(${bindingIndex})]] var<uniform> ${varName} : ${name};\n`;
                }
                if (visibleFromFragment) {
                    fragmentUniformBuffersDecl += `[[group(${setIndex}), binding(${bindingIndex})]] var<uniform> ${varName} : ${name};\n`;
                }
            }
            else {
                const nextBinding = webgpuProcessingContext.getNextFreeUBOBinding();
                setIndex = nextBinding.setIndex;
                bindingIndex = nextBinding.bindingIndex;
                varName = name; // TODO WEBGPU: find all vars that are using this UBO
            }

            webgpuProcessingContext.availableUBOs[varName] = { setIndex, bindingIndex };
            if (!webgpuProcessingContext.orderedUBOsAndSamplers[setIndex]) {
                webgpuProcessingContext.orderedUBOsAndSamplers[setIndex] = [];
            }
            if (!webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex]) {
                webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex] = { isSampler: false, isTexture: false, name, usedInVertex: false, usedInFragment: false };
            }
            if (visibleFromVertex) {
                webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex].usedInVertex = true;
            }
            if (visibleFromFragment) {
                webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex].usedInFragment = true;
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

            let ubo = `[[block]] struct ${name} {\n`;
            for (let leftOverUniform of webgpuProcessingContext.leftOverUniforms) {
                if (leftOverUniform.length > 0) {
                    ubo += `  ${leftOverUniform.name} : array<${leftOverUniform.type}, ${leftOverUniform.length}>;\n`;
                }
                else {
                    ubo += `  ${leftOverUniform.name} : ${leftOverUniform.type};\n`;
                }
            }
            ubo += "};\n";

            ubo += `[[group(${availableUBO.setIndex}), binding(${availableUBO.bindingIndex})]] var<uniform> uniforms : ${name};\n`;

            // Currently set in both vert and frag but could be optim away if necessary.
            vertexCode = ubo + vertexCode;
            fragmentCode = ubo + fragmentCode;
        }

        const injectDeclarationCode = (code: string, injectionCode: string) => {
            let idx = code.indexOf("fn main");

            while (idx > 0 && !(code.charAt(idx) === '[' && code.charAt(idx - 1) === '[')) {
                idx--;
            }
            while (idx >= 0 && code.charAt(idx) !== '\n') {
                idx--;
            }
            if (idx >= 0) {
                const part1 = code.substring(0, idx + 1);
                const part2 = code.substring(idx + 1);
                code = part1 + injectionCode + part2;
            }

            return code;
        };

        const injectStartingAndEndingCode = (code: string, startingCode?: string, endingCode?: string) => {
            if (startingCode) {
                let idx = code.indexOf("fn main");
                if (idx >= 0) {
                    while (idx++ < code.length && code.charAt(idx) != '{') ;
                    if (idx < code.length) {
                        while (idx++ < code.length && code.charAt(idx) != '\n') ;
                        if (idx < code.length) {
                            const part1 = code.substring(0, idx + 1);
                            const part2 = code.substring(idx + 1);
                            code = part1 + startingCode + part2;
                        }
                    }
                }
            }

            if (endingCode) {
                const lastClosingCurly = code.lastIndexOf("}");
                code = code.substring(0, lastClosingCurly);
                code += endingCode + "\n}";
            }

            return code;
        };

        // Vertex code
        vertexCode = vertexCode.replace("#define ", "//#define ");

        let varyingsDecl = this._varyingsDeclWGSL.join("\n") + "\n";

        let vertexBuiltinDecl = "var<private> gl_VertexID : u32;\nvar<private> gl_InstanceID : u32;\nvar<private> gl_Position : vec4<f32>;\n";

        let vertexAttributesDecl = this._attributesDeclWGSL.join("\n") + "\n";

        let vertexInputs = "struct VertexInputs {\n  [[builtin(vertex_index)]] vertexIndex : u32;\n  [[builtin(instance_index)]] instanceIndex : u32;\n";
        if (this._attributesWGSL.length > 0) {
            vertexInputs += this._attributesWGSL.join("\n");
        }
        vertexInputs += "\n};\n";

        let vertexFragmentInputs = "struct FragmentInputs {\n  [[builtin(position)]] position : vec4<f32>;\n";
        if (this._varyingsWGSL.length > 0) {
            vertexFragmentInputs += this._varyingsWGSL.join("\n");
        }
        vertexFragmentInputs += "\n};\n";

        vertexCode = vertexBuiltinDecl + vertexInputs + vertexAttributesDecl + vertexFragmentInputs + varyingsDecl + vertexCode;

        let vertexStartingCode = "  var output : FragmentInputs;\n  gl_VertexID = input.vertexIndex;\n  gl_InstanceID = input.instanceIndex;\n";

        for (let i = 0; i < this._attributeNamesWGSL.length; ++i) {
            const name = this._attributeNamesWGSL[i];
            vertexStartingCode += `  ${name} = input.${name};\n`;
        }

        let vertexEndingCode = "  output.position = gl_Position;\n  output.position.y = -output.position.y;\n";

        for (let i = 0; i < this._varyingNamesWGSL.length; ++i) {
            const name = this._varyingNamesWGSL[i];
            vertexEndingCode += `  output.${name} = ${name};\n`;
        }

        vertexEndingCode += "  return output;";

        vertexCode = injectStartingAndEndingCode(vertexCode, vertexStartingCode, vertexEndingCode);
        vertexCode = injectDeclarationCode(vertexCode, vertexUniformBuffersDecl);

        console.log(vertexCode);
        //vertexCode = "[[group(1), binding(1)]] var<uniform> mesh : Mesh;\n" + vertexCode;

        // fragment code
        fragmentCode = fragmentCode.replace("#define ", "//#define ");

        let fragmentBuiltinDecl = "var<private> gl_FragCoord : vec4<f32>;\nvar<private> gl_FrontFacing : bool;\nvar<private> gl_FragColor : vec4<f32>;\nvar<private> gl_FragDepth : f32;\n";

        let fragmentFragmentInputs = "struct FragmentInputs {\n  [[builtin(position)]] position : vec4<f32>;\n  [[builtin(front_facing)]] frontFacing : bool;\n";
        if (this._varyingsWGSL.length > 0) {
            fragmentFragmentInputs += this._varyingsWGSL.join("\n");
        }
        fragmentFragmentInputs += "\n};\n";

        let fragmentOutputs = "struct FragmentOutputs {\n  [[location(0)]] color : vec4<f32>;\n";
        
        let hasFragDepth = false;
        let idx = 0;
        while (!hasFragDepth) {
            idx = fragmentCode.indexOf("gl_FragDepth", idx);
            if (idx < 0) {
                break;
            }
            const saveIndex = idx;
            hasFragDepth = true;
            while (idx > 1 && fragmentCode.charAt(idx) !== '\n') {
                if (fragmentCode.charAt(idx) === '/' && fragmentCode.charAt(idx - 1) === '/') {
                    hasFragDepth = false;
                    break;
                }
                idx--;
            }
            idx = saveIndex + 12;
        }

        if (hasFragDepth) {
            fragmentOutputs += "  [[builtin(frag_depth)]] fragDepth: f32;\n";
        }

        fragmentOutputs += "};\n";

        fragmentCode = fragmentBuiltinDecl + fragmentFragmentInputs + varyingsDecl + fragmentOutputs + fragmentCode;

        let fragmentStartingCode = "  var output : FragmentOutputs;\n  gl_FragCoord = input.position;\n  gl_FrontFacing = input.frontFacing;\n";

        for (let i = 0; i < this._varyingNamesWGSL.length; ++i) {
            const name = this._varyingNamesWGSL[i];
            fragmentStartingCode += `  ${name} = input.${name};\n`;
        }

        let fragmentEndingCode = "  output.color = gl_FragColor;\n";

        if (hasFragDepth) {
            fragmentEndingCode += "  output.fragDepth = gl_FragDepth;\n";
        }

        fragmentEndingCode += "  return output;";

        fragmentCode = injectStartingAndEndingCode(fragmentCode, fragmentStartingCode, fragmentEndingCode);
        fragmentCode = injectDeclarationCode(fragmentCode, fragmentUniformBuffersDecl);

        console.log(fragmentCode);
        //fragmentCode = "[[group(1), binding(1)]] var<uniform> mesh : Mesh;\n" + fragmentCode;

        return { vertexCode, fragmentCode };
    }
}
import { Nullable } from '../../types';
import { IShaderProcessor, ShaderLanguage } from '../Processors/iShaderProcessor';
import { ShaderProcessingContext } from "../Processors/shaderProcessingOptions";
import { WebGPUShaderProcessingContext } from './webgpuShaderProcessingContext';
import * as WebGPUConstants from './webgpuConstants';
import { Logger } from '../../Misc/logger';
import { ThinEngine } from "../thinEngine";
import { WebGPUShaderProcessor } from "./webgpuShaderProcessor";

const builtInName_vertex_index = "gl_VertexID";
const builtInName_instance_index = "gl_InstanceID";
const builtInName_position = "gl_Position";

const builtInName_position_frag = "gl_FragCoord";
const builtInName_front_facing = "gl_FrontFacing";
const builtInName_frag_depth = "gl_FragDepth";
const builtInName_FragColor = "gl_FragColor";

const leftOverVarName = "uniforms";

 /** @hidden */
export class WebGPUShaderProcessorWGSL extends WebGPUShaderProcessor implements IShaderProcessor {

    protected _textureArrayProcessing: Array<string> = [];
    protected _preProcessors: { [key: string]: string };
    protected _attributesWGSL: string[];
    protected _attributesDeclWGSL: string[];
    protected _attributeNamesWGSL: string[];
    protected _varyingsWGSL: string[];
    protected _varyingsDeclWGSL: string[];
    protected _varyingNamesWGSL: string[];

    public shaderLanguage = ShaderLanguage.WGSL;
    public uniformRegexp = /uniform\s+(\S+)\s*:\s*(.+)\s*;/;
    public uniformBufferRegexp = /uniform\s+(\S+)\s*\{/;
    public noPrecision = true;
    public removeCommentsBeforeProcessing = true;

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

        const match = this.uniformRegexp.exec(uniform);
        if (match != null) {
            let uniformType = match[2];
            let name = match[1];

            if (uniformType.indexOf("sampler") === 0 || uniformType.indexOf("sampler") === 1) {
                let samplerInfo = WebGPUShaderProcessor._KnownSamplers[name];
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
                const samplerFunction = WebGPUShaderProcessor._SamplerFunctionByWebGLSamplerType[uniformType];
                const samplerType = WebGPUShaderProcessor._SamplerTypeByWebGLSamplerType[uniformType] ?? "sampler";
                const textureType = WebGPUShaderProcessor._TextureTypeByWebGLSamplerType[uniformType];
                const textureDimension = WebGPUShaderProcessor._GpuTextureViewDimensionByWebGPUTextureType[textureType];
                const isComparisonSampler = !!WebGPUShaderProcessor._IsComparisonSamplerByWebGPUSamplerType[samplerType];

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
            const visibleFromVertex = (visibility & 1) !== 0;
            const visibleFromFragment = (visibility & 2) !== 0;
            const knownUBO = WebGPUShaderProcessor._KnownUBOs[name];

            let setIndex: number;
            let bindingIndex: number;

            if (knownUBO) {
                setIndex = knownUBO.setIndex;
                bindingIndex = knownUBO.bindingIndex;
                if (visibleFromVertex) {
                    vertexUniformBuffersDecl += `[[group(${setIndex}), binding(${bindingIndex})]] var<uniform> ${knownUBO.varName} : ${name};\n`;
                }
                if (visibleFromFragment) {
                    fragmentUniformBuffersDecl += `[[group(${setIndex}), binding(${bindingIndex})]] var<uniform> ${knownUBO.varName} : ${name};\n`;
                }

                webgpuProcessingContext.availableUBOs[name] = { setIndex, bindingIndex };
                if (!webgpuProcessingContext.orderedUBOsAndSamplers[setIndex]) {
                    webgpuProcessingContext.orderedUBOsAndSamplers[setIndex] = [];
                }
                if (!webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex]) {
                    webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex] = { isSampler: false, isTexture: false, name, usedInVertex: visibleFromVertex, usedInFragment: visibleFromFragment };
                }
            }
        }

        vertexCode = this._processCustomUniformBuffers(webgpuProcessingContext, vertexCode, true);
        fragmentCode = this._processCustomUniformBuffers(webgpuProcessingContext, fragmentCode, false);

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

            ubo += `[[group(${availableUBO.setIndex}), binding(${availableUBO.bindingIndex})]] var<uniform> ${leftOverVarName} : ${name};\n`;

            // Currently set in both vert and frag but could be optim away if necessary.
            vertexCode = ubo + vertexCode;
            fragmentCode = ubo + fragmentCode;
        }

        // Vertex code
        vertexCode = vertexCode.replace("#define ", "//#define ");

        let varyingsDecl = this._varyingsDeclWGSL.join("\n") + "\n";

        let vertexBuiltinDecl = `var<private> ${builtInName_vertex_index} : u32;\nvar<private> ${builtInName_instance_index} : u32;\nvar<private> ${builtInName_position} : vec4<f32>;\n`;

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

        let vertexStartingCode = `  var output : FragmentInputs;\n  ${builtInName_vertex_index} = input.vertexIndex;\n  ${builtInName_instance_index} = input.instanceIndex;\n`;

        for (let i = 0; i < this._attributeNamesWGSL.length; ++i) {
            const name = this._attributeNamesWGSL[i];
            vertexStartingCode += `  ${name} = input.${name};\n`;
        }

        let vertexEndingCode = `  output.position = ${builtInName_position};\n  output.position.y = -output.position.y;\n`;

        for (let i = 0; i < this._varyingNamesWGSL.length; ++i) {
            const name = this._varyingNamesWGSL[i];
            vertexEndingCode += `  output.${name} = ${name};\n`;
        }

        vertexEndingCode += "  return output;";

        vertexCode = this._injectStartingAndEndingCode(vertexCode, vertexStartingCode, vertexEndingCode);
        vertexCode = this._injectDeclarationCode(vertexCode, vertexUniformBuffersDecl);

        console.log(vertexCode);

        // fragment code
        fragmentCode = fragmentCode.replace("#define ", "//#define ");

        let fragmentBuiltinDecl = `var<private> ${builtInName_position_frag} : vec4<f32>;\nvar<private> ${builtInName_front_facing} : bool;\nvar<private> ${builtInName_FragColor} : vec4<f32>;\nvar<private> ${builtInName_frag_depth} : f32;\n`;

        let fragmentFragmentInputs = "struct FragmentInputs {\n  [[builtin(position)]] position : vec4<f32>;\n  [[builtin(front_facing)]] frontFacing : bool;\n";
        if (this._varyingsWGSL.length > 0) {
            fragmentFragmentInputs += this._varyingsWGSL.join("\n");
        }
        fragmentFragmentInputs += "\n};\n";

        let fragmentOutputs = "struct FragmentOutputs {\n  [[location(0)]] color : vec4<f32>;\n";
        
        let hasFragDepth = false;
        let idx = 0;
        while (!hasFragDepth) {
            idx = fragmentCode.indexOf(builtInName_frag_depth, idx);
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

        let fragmentStartingCode = `  var output : FragmentOutputs;\n  ${builtInName_position_frag} = input.position;\n  ${builtInName_front_facing} = input.frontFacing;\n`;

        for (let i = 0; i < this._varyingNamesWGSL.length; ++i) {
            const name = this._varyingNamesWGSL[i];
            fragmentStartingCode += `  ${name} = input.${name};\n`;
        }

        let fragmentEndingCode = `  output.color = ${builtInName_FragColor};\n`;

        if (hasFragDepth) {
            fragmentEndingCode += `  output.fragDepth = ${builtInName_frag_depth};\n`;
        }

        fragmentEndingCode += "  return output;";

        fragmentCode = this._injectStartingAndEndingCode(fragmentCode, fragmentStartingCode, fragmentEndingCode);
        fragmentCode = this._injectDeclarationCode(fragmentCode, fragmentUniformBuffersDecl);

        console.log(fragmentCode);

        return { vertexCode, fragmentCode };
    }

    private _injectDeclarationCode(code: string, injectionCode: string): string {
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
    }

    private _injectStartingAndEndingCode(code: string, startingCode?: string, endingCode?: string): string {
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
    }

    private _processCustomUniformBuffers(webgpuProcessingContext: WebGPUShaderProcessingContext, code: string, isVertex: boolean): string {
        const instantiateUniformBufferRegexp = new RegExp(/var<\s*uniform\s*>\s+(\S+)\s*:\s*(\S+)\s*;/gm);

        while (true) {
            const match = instantiateUniformBufferRegexp.exec(code);
            if (match === null) {
                break;
            }
            const name = match[1];

            let setIndex: number, bindingIndex: number;
            if (webgpuProcessingContext.availableUBOs[name]) {
                setIndex = webgpuProcessingContext.availableUBOs[name].setIndex;
                bindingIndex = webgpuProcessingContext.availableUBOs[name].bindingIndex;
            } else {
                const nextBinding = webgpuProcessingContext.getNextFreeUBOBinding();
                webgpuProcessingContext.availableUBOs[name] = nextBinding;
                setIndex = nextBinding.setIndex;
                bindingIndex = nextBinding.bindingIndex;
                if (!webgpuProcessingContext.orderedUBOsAndSamplers[setIndex]) {
                    webgpuProcessingContext.orderedUBOsAndSamplers[setIndex] = [];
                }
                if (!webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex]) {
                    webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex] = { isSampler: false, isTexture: false, name, usedInVertex: false, usedInFragment: false };
                }
            }

            if (isVertex) {
                webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex].usedInVertex = true;
            } else {
                webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex].usedInFragment = true;
            }

            const part1 = code.substring(0, match.index);
            const insertPart = `[[group(${setIndex}), binding(${bindingIndex})]] `;
            const part2 = code.substring(match.index);

            code = part1 + insertPart + part2;

            instantiateUniformBufferRegexp.lastIndex += insertPart.length;
        }

        return code;
    }

}
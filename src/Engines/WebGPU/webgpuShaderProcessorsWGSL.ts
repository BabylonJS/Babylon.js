import { Nullable } from '../../types';
import { IShaderProcessor } from '../Processors/iShaderProcessor';
import { ShaderProcessingContext } from "../Processors/shaderProcessingOptions";
import { WebGPUShaderProcessingContext, WebGPUBufferDescription } from './webgpuShaderProcessingContext';
import * as WebGPUConstants from './webgpuConstants';
import { Logger } from '../../Misc/logger';
import { ThinEngine } from "../thinEngine";
import { WebGPUShaderProcessor } from "./webgpuShaderProcessor";

import "../../ShadersWGSL/ShadersInclude/bonesDeclaration";
import "../../ShadersWGSL/ShadersInclude/bonesVertex";
import "../../ShadersWGSL/ShadersInclude/instancesDeclaration";
import "../../ShadersWGSL/ShadersInclude/instancesVertex";
import "../../ShadersWGSL/ShadersInclude/meshUboDeclaration";
import "../../ShadersWGSL/ShadersInclude/morphTargetsVertex";
import "../../ShadersWGSL/ShadersInclude/morphTargetsVertexDeclaration";
import "../../ShadersWGSL/ShadersInclude/morphTargetsVertexGlobal";
import "../../ShadersWGSL/ShadersInclude/morphTargetsVertexGlobalDeclaration";
import "../../ShadersWGSL/ShadersInclude/sceneUboDeclaration";
import { ShaderLanguage } from "../../Materials/shaderLanguage";

const builtInName_vertex_index = "gl_VertexID";
const builtInName_instance_index = "gl_InstanceID";
const builtInName_position = "gl_Position";

const builtInName_position_frag = "gl_FragCoord";
const builtInName_front_facing = "gl_FrontFacing";
const builtInName_frag_depth = "gl_FragDepth";
const builtInName_FragColor = "gl_FragColor";

const leftOverVarName = "uniforms";

const gpuTextureViewDimensionByWebGPUTextureFunction: { [key: string]: Nullable<GPUTextureViewDimension> } = {
    "texture_1d": WebGPUConstants.TextureViewDimension.E1d,
    "texture_2d": WebGPUConstants.TextureViewDimension.E2d,
    "texture_2d_array": WebGPUConstants.TextureViewDimension.E2dArray,
    "texture_3d": WebGPUConstants.TextureViewDimension.E3d,
    "texture_cube": WebGPUConstants.TextureViewDimension.Cube,
    "texture_cube_array": WebGPUConstants.TextureViewDimension.CubeArray,
    "texture_multisampled_2d": WebGPUConstants.TextureViewDimension.E2d,
    "texture_depth_2d": WebGPUConstants.TextureViewDimension.E2d,
    "texture_depth_2d_array": WebGPUConstants.TextureViewDimension.E2dArray,
    "texture_depth_cube": WebGPUConstants.TextureViewDimension.Cube,
    "texture_depth_cube_array": WebGPUConstants.TextureViewDimension.CubeArray,
    "texture_depth_multisampled_2d": WebGPUConstants.TextureViewDimension.E2d,
    "texture_storage_1d": WebGPUConstants.TextureViewDimension.E1d,
    "texture_storage_2d": WebGPUConstants.TextureViewDimension.E2d,
    "texture_storage_2d_array": WebGPUConstants.TextureViewDimension.E2dArray,
    "texture_storage_3d": WebGPUConstants.TextureViewDimension.E3d,
    "texture_external": null
};

 /** @hidden */
export class WebGPUShaderProcessorWGSL extends WebGPUShaderProcessor implements IShaderProcessor {

    protected _attributesWGSL: string[];
    protected _attributesDeclWGSL: string[];
    protected _attributeNamesWGSL: string[];
    protected _varyingsWGSL: string[];
    protected _varyingsDeclWGSL: string[];
    protected _varyingNamesWGSL: string[];

    public shaderLanguage = ShaderLanguage.WGSL;
    public uniformRegexp = /uniform\s+(\w+)\s*:\s*(.+)\s*;/;
    public textureRegexp = /var\s+(\w+)\s*:\s*((array<\s*)?(texture_\w+)\s*(<\s*(.+)\s*>)?\s*(,\s*\w+\s*>\s*)?);/;
    public noPrecision = true;
    public removeCommentsBeforeProcessing = true;

    protected _getArraySize(name: string, uniformType: string, preProcessors: { [key: string]: string }): [string, string, number] {
        let length = 0;

        const endArray = uniformType.lastIndexOf(">");
        if (uniformType.indexOf("array") >= 0 && endArray > 0) {
            let startArray = endArray;
            while (startArray > 0 && uniformType.charAt(startArray) !== ' ' && uniformType.charAt(startArray) !== ',') {
                startArray--;
            }
            const lengthInString = uniformType.substring(startArray + 1, endArray);
            length = +(lengthInString);
            if (isNaN(length)) {
                length = +(preProcessors[lengthInString.trim()]);
            }
            while (startArray > 0 && (uniformType.charAt(startArray) === ' ' || uniformType.charAt(startArray) === ',')) {
                startArray--;
            }
            uniformType = uniformType.substring(uniformType.indexOf("<") + 1, startArray + 1);
        }

        return [name, uniformType, length];
    }

    public initializeShaders(processingContext: Nullable<ShaderProcessingContext>): void {
        this.webgpuProcessingContext = processingContext as WebGPUShaderProcessingContext;

        this._attributesWGSL = [];
        this._attributesDeclWGSL = [];
        this._attributeNamesWGSL = [];
        this._varyingsWGSL = [];
        this._varyingsDeclWGSL = [];
        this._varyingNamesWGSL = [];
    }

    public varyingProcessor(varying: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) {
        const varyingRegex = new RegExp(/\s*varying\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s*:\s*(.+)\s*;/gm);
        const match = varyingRegex.exec(varying);
        if (match !== null) {
            const varyingType = match[2];
            const name = match[1];
            let location: number;
            if (isFragment) {
                location = this.webgpuProcessingContext.availableVaryings[name];
                if (location === undefined) {
                    Logger.Warn(`Invalid fragment shader: The varying named "${name}" is not declared in the vertex shader! This declaration will be ignored.`);
                }
            }
            else {
                location = this.webgpuProcessingContext.getVaryingNextLocation(varyingType, this._getArraySize(name, varyingType, preProcessors)[2]);
                this.webgpuProcessingContext.availableVaryings[name] = location;
                this._varyingsWGSL.push(`[[location(${location})]] ${name} : ${varyingType};`);
                this._varyingsDeclWGSL.push(`var<private> ${name} : ${varyingType};`);
                this._varyingNamesWGSL.push(name);
            }

            varying = "";
        }
        return varying;
    }

    public attributeProcessor(attribute: string, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) {
        const attribRegex = new RegExp(/\s*attribute\s+(\S+)\s*:\s*(.+)\s*;/gm);
        const match = attribRegex.exec(attribute);
        if (match !== null) {
            const attributeType = match[2];
            const name = match[1];
            const location = this.webgpuProcessingContext.getAttributeNextLocation(attributeType, this._getArraySize(name, attributeType, preProcessors)[2]);

            this.webgpuProcessingContext.availableAttributes[name] = location;
            this.webgpuProcessingContext.orderedAttributes[location] = name;

            this._attributesWGSL.push(`[[location(${location})]] ${name} : ${attributeType};`);
            this._attributesDeclWGSL.push(`var<private> ${name} : ${attributeType};`);
            this._attributeNamesWGSL.push(name);
            attribute = "";
        }
        return attribute;
    }

    public uniformProcessor(uniform: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>): string {
        const match = this.uniformRegexp.exec(uniform);
        if (match !== null) {
            let uniformType = match[2];
            let name = match[1];

            this._addUniformToLeftOverUBO(name, uniformType, preProcessors);

            uniform = "";
        }
        return uniform;
    }

    public textureProcessor(texture: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>): string {
        const match = this.textureRegexp.exec(texture);
        if (match !== null) {
            const name = match[1]; // name of the variable
            const type = match[2]; // texture_2d<f32> or array<texture_2d_array<f32>, 5> for eg
            const isArrayOfTexture = !!match[3];
            const textureFunc = match[4]; // texture_2d, texture_depth_2d, etc
            const isStorageTexture = textureFunc.indexOf("storage") > 0;
            const componentType = match[6]; // f32 or i32 or u32 or undefined
            const storageTextureFormat = isStorageTexture ? componentType.substring(0, componentType.indexOf(",")).trim() as GPUTextureFormat : null;

            let arraySize = isArrayOfTexture ? this._getArraySize(name, type, preProcessors)[2] : 0;
            let textureInfo = this.webgpuProcessingContext.availableTextures[name];
            if (!textureInfo) {
                textureInfo = {
                    isTextureArray: arraySize > 0,
                    isStorageTexture,
                    textures: [],
                    sampleType: WebGPUConstants.TextureSampleType.Float,
                };
                arraySize = arraySize || 1;
                for (let i = 0; i < arraySize; ++i) {
                    textureInfo.textures.push(this.webgpuProcessingContext.getNextFreeUBOBinding());
                }
            } else {
                arraySize = textureInfo.textures.length;
            }

            this.webgpuProcessingContext.availableTextures[name] = textureInfo;

            const isDepthTexture = textureFunc.indexOf("depth") > 0;
            const textureDimension = gpuTextureViewDimensionByWebGPUTextureFunction[textureFunc];
            const sampleType =
                isDepthTexture ? WebGPUConstants.TextureSampleType.Depth :
                componentType === 'u32' ? WebGPUConstants.TextureSampleType.Uint :
                componentType === 'i32' ? WebGPUConstants.TextureSampleType.Sint : WebGPUConstants.TextureSampleType.Float;

            textureInfo.sampleType = sampleType;

            if (textureDimension === undefined) {
                throw `Can't get the texture dimension corresponding to the texture function "${textureFunc}"!`;
            }

            for (let i = 0; i < arraySize; ++i) {
                const { groupIndex, bindingIndex } = textureInfo.textures[i];

                if (i === 0) {
                    texture = `[[group(${groupIndex}), binding(${bindingIndex})]] ${texture}`;
                }

                this._addTextureBindingDescription(name, textureInfo, i, textureDimension, storageTextureFormat, !isFragment);
            }
        }

        return texture;
    }

    public postProcessor(code: string, defines: string[], isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>, engine: ThinEngine) {
        return code;
    }

    public finalizeShaders(vertexCode: string, fragmentCode: string, processingContext: Nullable<ShaderProcessingContext>): { vertexCode: string, fragmentCode: string } {
        // Add the group/binding info to the sampler declaration (var xxx: sampler|sampler_comparison)
        vertexCode = this._processSamplers(vertexCode, true);
        fragmentCode = this._processSamplers(fragmentCode, false);

        // Add the group/binding info to the uniform/storage buffer declarations (var<uniform> XXX:YYY or var<storage(,read_write|read)> XXX:YYY)
        vertexCode = this._processCustomBuffers(vertexCode, true);
        fragmentCode = this._processCustomBuffers(fragmentCode, false);

        // Builds the leftover UBOs.
        const leftOverUBO = this._buildLeftOverUBO();

        vertexCode = leftOverUBO + vertexCode;
        fragmentCode = leftOverUBO + fragmentCode;

        // Vertex code
        vertexCode = vertexCode.replace(/#define /g, "//#define ");

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

        // fragment code
        fragmentCode = fragmentCode.replace(/#define /g, "//#define ");

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

        this._collectBindingNames();
        this._preCreateBindGroupEntries();

        return { vertexCode, fragmentCode };
    }

    protected _generateLeftOverUBOCode(name: string, uniformBufferDescription: WebGPUBufferDescription): string {
        let ubo = `[[block]] struct ${name} {\n`;
        for (let leftOverUniform of this.webgpuProcessingContext.leftOverUniforms) {
            const type = leftOverUniform.type.replace(/^(.*?)(<.*>)?$/, "$1");
            const size = WebGPUShaderProcessor.UniformSizes[type];

            if (leftOverUniform.length > 0) {
                if (size <= 2) {
                    ubo += ` [[align(16)]] ${leftOverUniform.name} : [[stride(16)]] array<${leftOverUniform.type}, ${leftOverUniform.length}>;\n`;
                } else {
                    ubo += ` ${leftOverUniform.name} : array<${leftOverUniform.type}, ${leftOverUniform.length}>;\n`;
                }
            }
            else {
                ubo += `  ${leftOverUniform.name} : ${leftOverUniform.type};\n`;
            }
        }
        ubo += "};\n";

        ubo += `[[group(${uniformBufferDescription.binding.groupIndex}), binding(${uniformBufferDescription.binding.bindingIndex})]] var<uniform> ${leftOverVarName} : ${name};\n`;

        return ubo;
    }

    private _injectStartingAndEndingCode(code: string, startingCode?: string, endingCode?: string): string {
        if (startingCode) {
            let idx = code.indexOf("fn main");
            if (idx >= 0) {
                while (idx++ < code.length && code.charAt(idx) != '{') { }
                if (idx < code.length) {
                    while (idx++ < code.length && code.charAt(idx) != '\n') { }
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

    private _processSamplers(code: string, isVertex: boolean): string {
        const samplerRegexp = new RegExp(/var\s+(\w+Sampler)\s*:\s*(sampler|sampler_comparison)\s*;/gm);

        while (true) {
            const match = samplerRegexp.exec(code);
            if (match === null) {
                break;
            }

            const name = match[1]; // name of the variable
            const samplerType = match[2]; // sampler or sampler_comparison
            const textureName = name.indexOf(WebGPUShaderProcessor.AutoSamplerSuffix) === name.length - WebGPUShaderProcessor.AutoSamplerSuffix.length ? name.substring(0, name.indexOf(WebGPUShaderProcessor.AutoSamplerSuffix)) : null;
            const samplerBindingType = samplerType === "sampler_comparison" ? WebGPUConstants.SamplerBindingType.Comparison : WebGPUConstants.SamplerBindingType.Filtering;

            if (textureName) {
                const textureInfo = this.webgpuProcessingContext.availableTextures[textureName];
                if (textureInfo) {
                    textureInfo.autoBindSampler = true;
                }
            }

            let samplerInfo = this.webgpuProcessingContext.availableSamplers[name];
            if (!samplerInfo) {
                samplerInfo = {
                    binding: this.webgpuProcessingContext.getNextFreeUBOBinding(),
                    type: samplerBindingType,
                };
                this.webgpuProcessingContext.availableSamplers[name] = samplerInfo;
            }

            this._addSamplerBindingDescription(name, samplerInfo, isVertex);

            const part1 = code.substring(0, match.index);
            const insertPart = `[[group(${samplerInfo.binding.groupIndex}), binding(${samplerInfo.binding.bindingIndex})]] `;
            const part2 = code.substring(match.index);

            code = part1 + insertPart + part2;

            samplerRegexp.lastIndex += insertPart.length;
        }

        return code;
    }

    private _processCustomBuffers(code: string, isVertex: boolean): string {
        const instantiateBufferRegexp = new RegExp(/var<\s*(uniform|storage)\s*(,\s*(read|read_write)\s*)?>\s+(\S+)\s*:\s*(\S+)\s*;/gm);

        while (true) {
            const match = instantiateBufferRegexp.exec(code);
            if (match === null) {
                break;
            }

            let type = match[1];
            let decoration = match[3];
            let name = match[4];
            const structName = match[5];

            let bufferInfo = this.webgpuProcessingContext.availableBuffers[name];
            if (!bufferInfo) {
                const knownUBO = type === "uniform" ? WebGPUShaderProcessingContext.KnownUBOs[structName] : null;

                let binding;
                if (knownUBO) {
                    name = structName;
                    binding = knownUBO.binding;
                    if (binding.groupIndex === -1) {
                        binding = this.webgpuProcessingContext.getNextFreeUBOBinding();
                    }
                } else {
                    binding = this.webgpuProcessingContext.getNextFreeUBOBinding();
                }

                bufferInfo = { binding };
                this.webgpuProcessingContext.availableBuffers[name] = bufferInfo;
            }

            this._addBufferBindingDescription(name, this.webgpuProcessingContext.availableBuffers[name], decoration === "read_write" ? WebGPUConstants.BufferBindingType.Storage : type === "storage" ? WebGPUConstants.BufferBindingType.ReadOnlyStorage : WebGPUConstants.BufferBindingType.Uniform, isVertex);

            const groupIndex = bufferInfo.binding.groupIndex;
            const bindingIndex = bufferInfo.binding.bindingIndex;

            const part1 = code.substring(0, match.index);
            const insertPart = `[[group(${groupIndex}), binding(${bindingIndex})]] `;
            const part2 = code.substring(match.index);

            code = part1 + insertPart + part2;

            instantiateBufferRegexp.lastIndex += insertPart.length;
        }

        return code;
    }

}
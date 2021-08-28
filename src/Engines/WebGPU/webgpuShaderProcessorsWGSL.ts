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

const gpuTextureViewDimensionByWebGPUTextureFunction: { [key: string]: GPUTextureViewDimension } = {
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
    public textureRegexp = /var\s+(\w+)\s*:\s*((array<\s*)?(texture_\w+)\s*(<\s*(f32|i32|u32)\s*>)?\s*(,\s*\w+\s*>\s*)?);/;
    public noPrecision = true;
    public removeCommentsBeforeProcessing = true;

    protected _getArraySize(name: string, preProcessors: { [key: string]: string }): [string, number] {
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
                location = this.webgpuProcessingContext.getVaryingNextLocation(varyingType, this._getArraySize(varyingType, preProcessors)[1]);
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
            const location = this.webgpuProcessingContext.getAttributeNextLocation(attributeType, this._getArraySize(attributeType, preProcessors)[1]);

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
            const full = match[2]; // texture_2d<f32> or array<texture_2d_array<f32>, 5> for eg
            const isArrayOfTexture = !!match[3];
            const textureFunc = match[4]; // texture_2d, texture_depth_2d, etc
            const componentType = match[6]; // f32 or i32 or u32 or undefined

            let samplerInfo = WebGPUShaderProcessor._KnownSamplers[name];
            let arraySize = 0;
            if (!samplerInfo) {
                arraySize = isArrayOfTexture ? this._getArraySize(full, preProcessors)[1] : 0;
                samplerInfo = this.webgpuProcessingContext.availableSamplers[name];
                if (!samplerInfo) {
                    samplerInfo = {
                        sampler: null,
                        isTextureArray: arraySize > 0,
                        textures: [],
                    };
                    arraySize = arraySize || 1;
                    for (let i = 0; i < arraySize; ++i) {
                        samplerInfo.textures.push(this.webgpuProcessingContext.getNextFreeUBOBinding());
                    }
                } else {
                    arraySize = samplerInfo.textures.length;
                }
            }

            this.webgpuProcessingContext.availableSamplers[name] = samplerInfo;

            const isDepthTexture = textureFunc.indexOf("depth") > 0;
            const textureDimension = gpuTextureViewDimensionByWebGPUTextureFunction[textureFunc];
            const sampleType =
                isDepthTexture ? WebGPUConstants.TextureSampleType.Depth :
                componentType === 'u32' ? WebGPUConstants.TextureSampleType.Uint :
                componentType === 'i32' ? WebGPUConstants.TextureSampleType.Sint : WebGPUConstants.TextureSampleType.Float;

            if (textureDimension === undefined) {
                throw `Can't get the texture dimension corresponding to the texture function "${textureFunc}"!`;
            }

            for (let i = 0; i < arraySize; ++i) {
                const textureSetIndex = samplerInfo.textures[i].setIndex;
                const textureBindingIndex = samplerInfo.textures[i].bindingIndex;

                if (i === 0) {
                    texture = `[[group(${textureSetIndex}), binding(${textureBindingIndex})]] ${texture}`;
                }

                this._addTextureBindingDescription(isArrayOfTexture ? name + i.toString() : name, name, textureSetIndex, textureBindingIndex, sampleType, textureDimension, !isFragment);
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

        // Add the group/binding info to the uniform buffer declarations (var<uniform> XXX:YYY)
        vertexCode = this._processCustomUniformBuffers(vertexCode, true);
        fragmentCode = this._processCustomUniformBuffers(fragmentCode, false);

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

        console.log(vertexCode);

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

        console.log(fragmentCode);

        this._collectSamplerAndUBONames();

        return { vertexCode, fragmentCode };
    }

    protected _generateLeftOverUBOCode(name: string, setIndex: number, bindingIndex: number): string {
        let ubo = `[[block]] struct ${name} {\n`;
        for (let leftOverUniform of this.webgpuProcessingContext.leftOverUniforms) {
            if (leftOverUniform.length > 0) {
                ubo += `  ${leftOverUniform.name} : array<${leftOverUniform.type}, ${leftOverUniform.length}>;\n`;
            }
            else {
                ubo += `  ${leftOverUniform.name} : ${leftOverUniform.type};\n`;
            }
        }
        ubo += "};\n";

        ubo += `[[group(${setIndex}), binding(${bindingIndex})]] var<uniform> ${leftOverVarName} : ${name};\n`;

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
            const textureName = name.replace("Sampler", "");

            const samplerInfo = this.webgpuProcessingContext.availableSamplers[textureName];

            if (!samplerInfo) {
                Logger.Error(`Invalid sampler declaration "${match[0]}": there's not texture declared with name "${textureName}"!`);
                continue;
            }

            if (!samplerInfo.sampler) {
                samplerInfo.sampler = this.webgpuProcessingContext.getNextFreeUBOBinding();
            }

            const { setIndex, bindingIndex } = samplerInfo.sampler!;
            const samplerBindingType = samplerType === "sampler_comparison" ? WebGPUConstants.SamplerBindingType.Comparison : WebGPUConstants.SamplerBindingType.Filtering;

            this._addSamplerBindingDescription(textureName, setIndex, bindingIndex, samplerBindingType, isVertex);

            const part1 = code.substring(0, match.index);
            const insertPart = `[[group(${setIndex}), binding(${bindingIndex})]] `;
            const part2 = code.substring(match.index);

            code = part1 + insertPart + part2;

            samplerRegexp.lastIndex += insertPart.length;
        }

        return code;
    }

    private _processCustomUniformBuffers(code: string, isVertex: boolean): string {
        const instantiateUniformBufferRegexp = new RegExp(/var<\s*uniform\s*>\s+(\S+)\s*:\s*(\S+)\s*;/gm);

        while (true) {
            const match = instantiateUniformBufferRegexp.exec(code);
            if (match === null) {
                break;
            }
            let name = match[1];
            const structName = match[2];
            const knownUBO = WebGPUShaderProcessor._KnownUBOs[structName];

            if (knownUBO) {
                name = structName; 
                this.webgpuProcessingContext.availableUBOs[name] = { setIndex: knownUBO.setIndex, bindingIndex: knownUBO. bindingIndex };
            }

            let setIndex: number, bindingIndex: number;
            if (this.webgpuProcessingContext.availableUBOs[name]) {
                setIndex = this.webgpuProcessingContext.availableUBOs[name].setIndex;
                bindingIndex = this.webgpuProcessingContext.availableUBOs[name].bindingIndex;
            } else {
                const binding = this.webgpuProcessingContext.getNextFreeUBOBinding();
                this.webgpuProcessingContext.availableUBOs[name] = binding;
                setIndex = binding.setIndex;
                bindingIndex = binding.bindingIndex;
            }

            this._addUniformBufferBindingDescription(name, setIndex, bindingIndex, isVertex);

            const part1 = code.substring(0, match.index);
            const insertPart = `[[group(${setIndex}), binding(${bindingIndex})]] `;
            const part2 = code.substring(match.index);

            code = part1 + insertPart + part2;

            instantiateUniformBufferRegexp.lastIndex += insertPart.length;
        }

        return code;
    }

}
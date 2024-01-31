/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
import type { Nullable } from "../../types";
import type { ShaderProcessingContext } from "../Processors/shaderProcessingOptions";
import type { WebGPUBufferDescription } from "./webgpuShaderProcessingContext";
import { WebGPUShaderProcessingContext } from "./webgpuShaderProcessingContext";
import * as WebGPUConstants from "./webgpuConstants";
import { Logger } from "../../Misc/logger";
import { WebGPUShaderProcessor } from "./webgpuShaderProcessor";
import { RemoveComments } from "../../Misc/codeStringParsingTools";

import "../../ShadersWGSL/ShadersInclude/bonesDeclaration";
import "../../ShadersWGSL/ShadersInclude/bonesVertex";
import "../../ShadersWGSL/ShadersInclude/bakedVertexAnimationDeclaration";
import "../../ShadersWGSL/ShadersInclude/bakedVertexAnimation";
import "../../ShadersWGSL/ShadersInclude/clipPlaneFragment";
import "../../ShadersWGSL/ShadersInclude/clipPlaneFragmentDeclaration";
import "../../ShadersWGSL/ShadersInclude/clipPlaneVertex";
import "../../ShadersWGSL/ShadersInclude/clipPlaneVertexDeclaration";
import "../../ShadersWGSL/ShadersInclude/instancesDeclaration";
import "../../ShadersWGSL/ShadersInclude/instancesVertex";
import "../../ShadersWGSL/ShadersInclude/meshUboDeclaration";
import "../../ShadersWGSL/ShadersInclude/morphTargetsVertex";
import "../../ShadersWGSL/ShadersInclude/morphTargetsVertexDeclaration";
import "../../ShadersWGSL/ShadersInclude/morphTargetsVertexGlobal";
import "../../ShadersWGSL/ShadersInclude/morphTargetsVertexGlobalDeclaration";
import "../../ShadersWGSL/ShadersInclude/sceneUboDeclaration";
import { ShaderLanguage } from "../../Materials/shaderLanguage";

const builtInName_frag_depth = "fragmentOutputs.fragDepth";

const leftOverVarName = "uniforms";
const internalsVarName = "internals";

const gpuTextureViewDimensionByWebGPUTextureFunction: { [key: string]: Nullable<GPUTextureViewDimension> } = {
    texture_1d: WebGPUConstants.TextureViewDimension.E1d,
    texture_2d: WebGPUConstants.TextureViewDimension.E2d,
    texture_2d_array: WebGPUConstants.TextureViewDimension.E2dArray,
    texture_3d: WebGPUConstants.TextureViewDimension.E3d,
    texture_cube: WebGPUConstants.TextureViewDimension.Cube,
    texture_cube_array: WebGPUConstants.TextureViewDimension.CubeArray,
    texture_multisampled_2d: WebGPUConstants.TextureViewDimension.E2d,
    texture_depth_2d: WebGPUConstants.TextureViewDimension.E2d,
    texture_depth_2d_array: WebGPUConstants.TextureViewDimension.E2dArray,
    texture_depth_cube: WebGPUConstants.TextureViewDimension.Cube,
    texture_depth_cube_array: WebGPUConstants.TextureViewDimension.CubeArray,
    texture_depth_multisampled_2d: WebGPUConstants.TextureViewDimension.E2d,
    texture_storage_1d: WebGPUConstants.TextureViewDimension.E1d,
    texture_storage_2d: WebGPUConstants.TextureViewDimension.E2d,
    texture_storage_2d_array: WebGPUConstants.TextureViewDimension.E2dArray,
    texture_storage_3d: WebGPUConstants.TextureViewDimension.E3d,
    texture_external: null,
};

/** @internal */
export class WebGPUShaderProcessorWGSL extends WebGPUShaderProcessor {
    protected _attributesInputWGSL: string[];
    protected _attributesWGSL: string[];
    protected _attributesConversionCodeWGSL: string[];
    protected _hasNonFloatAttribute: boolean;
    protected _varyingsWGSL: string[];
    protected _varyingNamesWGSL: string[];
    protected _stridedUniformArrays: string[];

    public shaderLanguage = ShaderLanguage.WGSL;
    public uniformRegexp = /uniform\s+(\w+)\s*:\s*(.+)\s*;/;
    public textureRegexp = /var\s+(\w+)\s*:\s*((array<\s*)?(texture_\w+)\s*(<\s*(.+)\s*>)?\s*(,\s*\w+\s*>\s*)?);/;
    public noPrecision = true;

    protected _getArraySize(name: string, uniformType: string, preProcessors: { [key: string]: string }): [string, string, number] {
        let length = 0;

        const endArray = uniformType.lastIndexOf(">");
        if (uniformType.indexOf("array") >= 0 && endArray > 0) {
            let startArray = endArray;
            while (startArray > 0 && uniformType.charAt(startArray) !== " " && uniformType.charAt(startArray) !== ",") {
                startArray--;
            }
            const lengthInString = uniformType.substring(startArray + 1, endArray);
            length = +lengthInString;
            if (isNaN(length)) {
                length = +preProcessors[lengthInString.trim()];
            }
            while (startArray > 0 && (uniformType.charAt(startArray) === " " || uniformType.charAt(startArray) === ",")) {
                startArray--;
            }
            uniformType = uniformType.substring(uniformType.indexOf("<") + 1, startArray + 1);
        }

        return [name, uniformType, length];
    }

    public initializeShaders(processingContext: Nullable<ShaderProcessingContext>): void {
        this._webgpuProcessingContext = processingContext as WebGPUShaderProcessingContext;

        this._attributesInputWGSL = [];
        this._attributesWGSL = [];
        this._attributesConversionCodeWGSL = [];
        this._hasNonFloatAttribute = false;
        this._varyingsWGSL = [];
        this._varyingNamesWGSL = [];
        this._stridedUniformArrays = [];
    }

    public preProcessShaderCode(code: string): string {
        const ubDeclaration = `struct ${WebGPUShaderProcessor.InternalsUBOName} {\n  yFactor_: f32,\n  textureOutputHeight_: f32,\n};\nvar<uniform> ${internalsVarName} : ${WebGPUShaderProcessor.InternalsUBOName};\n`;
        const alreadyInjected = code.indexOf(ubDeclaration) !== -1;
        return alreadyInjected ? code : ubDeclaration + RemoveComments(code);
    }

    public varyingProcessor(varying: string, isFragment: boolean, preProcessors: { [key: string]: string }) {
        const varyingRegex = /\s*varying\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s*:\s*(.+)\s*;/gm;
        const match = varyingRegex.exec(varying);
        if (match !== null) {
            const varyingType = match[2];
            const name = match[1];
            let location: number;
            if (isFragment) {
                location = this._webgpuProcessingContext.availableVaryings[name];
                if (location === undefined) {
                    Logger.Warn(`Invalid fragment shader: The varying named "${name}" is not declared in the vertex shader! This declaration will be ignored.`);
                }
            } else {
                location = this._webgpuProcessingContext.getVaryingNextLocation(varyingType, this._getArraySize(name, varyingType, preProcessors)[2]);
                this._webgpuProcessingContext.availableVaryings[name] = location;
                this._varyingsWGSL.push(`  @location(${location}) ${name} : ${varyingType},`);
                this._varyingNamesWGSL.push(name);
            }

            varying = "";
        }
        return varying;
    }

    public attributeProcessor(attribute: string, preProcessors: { [key: string]: string }) {
        const attribRegex = /\s*attribute\s+(\S+)\s*:\s*(.+)\s*;/gm;
        const match = attribRegex.exec(attribute);
        if (match !== null) {
            const attributeType = match[2];
            const name = match[1];
            const location = this._webgpuProcessingContext.getAttributeNextLocation(attributeType, this._getArraySize(name, attributeType, preProcessors)[2]);

            this._webgpuProcessingContext.availableAttributes[name] = location;
            this._webgpuProcessingContext.orderedAttributes[location] = name;

            const numComponents = this.vertexBufferKindToNumberOfComponents[name];
            if (numComponents !== undefined) {
                // Special case for an int/ivecX vertex buffer that is used as a float/vecX attribute in the shader.
                const newType =
                    numComponents < 0 ? (numComponents === -1 ? "i32" : "vec" + -numComponents + "<i32>") : numComponents === 1 ? "u32" : "vec" + numComponents + "<u32>";
                const newName = `_int_${name}_`;

                this._attributesInputWGSL.push(`@location(${location}) ${newName} : ${newType},`);
                this._attributesWGSL.push(`${name} : ${attributeType},`);
                this._attributesConversionCodeWGSL.push(`vertexInputs.${name} = ${attributeType}(vertexInputs_.${newName});`);
                this._hasNonFloatAttribute = true;
            } else {
                this._attributesInputWGSL.push(`@location(${location}) ${name} : ${attributeType},`);
                this._attributesWGSL.push(`${name} : ${attributeType},`);
                this._attributesConversionCodeWGSL.push(`vertexInputs.${name} = vertexInputs_.${name};`);
            }
            attribute = "";
        }
        return attribute;
    }

    public uniformProcessor(uniform: string, isFragment: boolean, preProcessors: { [key: string]: string }): string {
        const match = this.uniformRegexp.exec(uniform);
        if (match !== null) {
            const uniformType = match[2];
            const name = match[1];

            this._addUniformToLeftOverUBO(name, uniformType, preProcessors);

            uniform = "";
        }
        return uniform;
    }

    public textureProcessor(texture: string, isFragment: boolean, preProcessors: { [key: string]: string }): string {
        const match = this.textureRegexp.exec(texture);
        if (match !== null) {
            const name = match[1]; // name of the variable
            const type = match[2]; // texture_2d<f32> or array<texture_2d_array<f32>, 5> for eg
            const isArrayOfTexture = !!match[3];
            const textureFunc = match[4]; // texture_2d, texture_depth_2d, etc
            const isStorageTexture = textureFunc.indexOf("storage") > 0;
            const componentType = match[6]; // f32 or i32 or u32 or undefined
            const storageTextureFormat = isStorageTexture ? (componentType.substring(0, componentType.indexOf(",")).trim() as GPUTextureFormat) : null;

            let arraySize = isArrayOfTexture ? this._getArraySize(name, type, preProcessors)[2] : 0;
            let textureInfo = this._webgpuProcessingContext.availableTextures[name];
            if (!textureInfo) {
                textureInfo = {
                    isTextureArray: arraySize > 0,
                    isStorageTexture,
                    textures: [],
                    sampleType: WebGPUConstants.TextureSampleType.Float,
                };
                arraySize = arraySize || 1;
                for (let i = 0; i < arraySize; ++i) {
                    textureInfo.textures.push(this._webgpuProcessingContext.getNextFreeUBOBinding());
                }
            } else {
                arraySize = textureInfo.textures.length;
            }

            this._webgpuProcessingContext.availableTextures[name] = textureInfo;

            const isDepthTexture = textureFunc.indexOf("depth") > 0;
            const textureDimension = gpuTextureViewDimensionByWebGPUTextureFunction[textureFunc];
            const sampleType = isDepthTexture
                ? WebGPUConstants.TextureSampleType.Depth
                : componentType === "u32"
                  ? WebGPUConstants.TextureSampleType.Uint
                  : componentType === "i32"
                    ? WebGPUConstants.TextureSampleType.Sint
                    : WebGPUConstants.TextureSampleType.Float;

            textureInfo.sampleType = sampleType;

            if (textureDimension === undefined) {
                // eslint-disable-next-line no-throw-literal
                throw `Can't get the texture dimension corresponding to the texture function "${textureFunc}"!`;
            }

            for (let i = 0; i < arraySize; ++i) {
                const { groupIndex, bindingIndex } = textureInfo.textures[i];

                if (i === 0) {
                    texture = `@group(${groupIndex}) @binding(${bindingIndex}) ${texture}`;
                }

                this._addTextureBindingDescription(name, textureInfo, i, textureDimension, storageTextureFormat, !isFragment);
            }
        }

        return texture;
    }

    public postProcessor(code: string, defines: string[]) {
        const defineToValue: { [key: string]: string } = {};
        for (const define of defines) {
            const parts = define.split(/ +/);
            defineToValue[parts[1]] = parts.length > 2 ? parts[2] : "";
        }
        return code.replace(/\$(\w+)\$/g, (_, p1) => {
            return defineToValue[p1] ?? p1;
        });
    }

    public finalizeShaders(vertexCode: string, fragmentCode: string): { vertexCode: string; fragmentCode: string } {
        const fragCoordCode =
            fragmentCode.indexOf("fragmentInputs.position") >= 0
                ? `
            if (internals.yFactor_ == 1.) {
                fragmentInputs.position.y = internals.textureOutputHeight_ - fragmentInputs.position.y;
            }
        `
                : "";

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
        vertexCode = this._processStridedUniformArrays(vertexCode);

        let vertexInputs = "struct VertexInputs {\n  @builtin(vertex_index) vertexIndex : u32,\n  @builtin(instance_index) instanceIndex : u32,\n";
        if (this._attributesInputWGSL.length > 0) {
            vertexInputs += this._attributesInputWGSL.join("\n");
        }
        vertexInputs += "\n};\nvar<private> vertexInputs" + (this._hasNonFloatAttribute ? "_" : "") + " : VertexInputs;\n";
        if (this._hasNonFloatAttribute) {
            vertexInputs += "struct VertexInputs_ {\n  vertexIndex : u32, instanceIndex : u32,\n";
            vertexInputs += this._attributesWGSL.join("\n");
            vertexInputs += "\n};\nvar<private> vertexInputs : VertexInputs_;\n";
        }

        let vertexOutputs = "struct FragmentInputs {\n  @builtin(position) position : vec4<f32>,\n";
        if (this._varyingsWGSL.length > 0) {
            vertexOutputs += this._varyingsWGSL.join("\n");
        }
        vertexOutputs += "\n};\nvar<private> vertexOutputs : FragmentInputs;\n";

        vertexCode = vertexInputs + vertexOutputs + vertexCode;

        let vertexMainStartingCode = `\n  vertexInputs${this._hasNonFloatAttribute ? "_" : ""} = input;\n`;
        if (this._hasNonFloatAttribute) {
            vertexMainStartingCode += "vertexInputs.vertexIndex = vertexInputs_.vertexIndex;\nvertexInputs.instanceIndex = vertexInputs_.instanceIndex;\n";
            vertexMainStartingCode += this._attributesConversionCodeWGSL.join("\n");
            vertexMainStartingCode += "\n";
        }
        const vertexMainEndingCode = `  vertexOutputs.position.y = vertexOutputs.position.y * internals.yFactor_;\n  return vertexOutputs;`;

        vertexCode = this._injectStartingAndEndingCode(vertexCode, "fn main", vertexMainStartingCode, vertexMainEndingCode);

        // fragment code
        fragmentCode = fragmentCode.replace(/#define /g, "//#define ");
        fragmentCode = this._processStridedUniformArrays(fragmentCode);
        fragmentCode = fragmentCode.replace(/dpdy/g, "(-internals.yFactor_)*dpdy"); // will also handle dpdyCoarse and dpdyFine

        let fragmentInputs = "struct FragmentInputs {\n  @builtin(position) position : vec4<f32>,\n  @builtin(front_facing) frontFacing : bool,\n";
        if (this._varyingsWGSL.length > 0) {
            fragmentInputs += this._varyingsWGSL.join("\n");
        }
        fragmentInputs += "\n};\nvar<private> fragmentInputs : FragmentInputs;\n";

        let fragmentOutputs = "struct FragmentOutputs {\n  @location(0) color : vec4<f32>,\n";

        let hasFragDepth = false;
        let idx = 0;
        while (!hasFragDepth) {
            idx = fragmentCode.indexOf(builtInName_frag_depth, idx);
            if (idx < 0) {
                break;
            }
            const saveIndex = idx;
            hasFragDepth = true;
            while (idx > 1 && fragmentCode.charAt(idx) !== "\n") {
                if (fragmentCode.charAt(idx) === "/" && fragmentCode.charAt(idx - 1) === "/") {
                    hasFragDepth = false;
                    break;
                }
                idx--;
            }
            idx = saveIndex + builtInName_frag_depth.length;
        }

        if (hasFragDepth) {
            fragmentOutputs += "  @builtin(frag_depth) fragDepth: f32,\n";
        }

        fragmentOutputs += "};\nvar<private> fragmentOutputs : FragmentOutputs;\n";

        fragmentCode = fragmentInputs + fragmentOutputs + fragmentCode;

        const fragmentStartingCode = "  fragmentInputs = input;\n  " + fragCoordCode;
        const fragmentEndingCode = "  return fragmentOutputs;";

        fragmentCode = this._injectStartingAndEndingCode(fragmentCode, "fn main", fragmentStartingCode, fragmentEndingCode);

        this._collectBindingNames();
        this._preCreateBindGroupEntries();

        this.vertexBufferKindToNumberOfComponents = {};

        return { vertexCode, fragmentCode };
    }

    protected _generateLeftOverUBOCode(name: string, uniformBufferDescription: WebGPUBufferDescription): string {
        let stridedArrays = "";
        let ubo = `struct ${name} {\n`;
        for (const leftOverUniform of this._webgpuProcessingContext.leftOverUniforms) {
            const type = leftOverUniform.type.replace(/^(.*?)(<.*>)?$/, "$1");
            const size = WebGPUShaderProcessor.UniformSizes[type];

            if (leftOverUniform.length > 0) {
                if (size <= 2) {
                    const stridedArrayType = `${name}_${this._stridedUniformArrays.length}_strided_arr`;
                    stridedArrays += `struct ${stridedArrayType} {
                        @size(16)
                        el: ${type},
                    }`;
                    this._stridedUniformArrays.push(leftOverUniform.name);

                    ubo += ` @align(16) ${leftOverUniform.name} : array<${stridedArrayType}, ${leftOverUniform.length}>,\n`;
                } else {
                    ubo += ` ${leftOverUniform.name} : array<${leftOverUniform.type}, ${leftOverUniform.length}>,\n`;
                }
            } else {
                ubo += `  ${leftOverUniform.name} : ${leftOverUniform.type},\n`;
            }
        }
        ubo += "};\n";
        ubo = `${stridedArrays}\n${ubo}`;
        ubo += `@group(${uniformBufferDescription.binding.groupIndex}) @binding(${uniformBufferDescription.binding.bindingIndex}) var<uniform> ${leftOverVarName} : ${name};\n`;

        return ubo;
    }

    private _processSamplers(code: string, isVertex: boolean): string {
        const samplerRegexp = /var\s+(\w+Sampler)\s*:\s*(sampler|sampler_comparison)\s*;/gm;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const match = samplerRegexp.exec(code);
            if (match === null) {
                break;
            }

            const name = match[1]; // name of the variable
            const samplerType = match[2]; // sampler or sampler_comparison
            const textureName =
                name.indexOf(WebGPUShaderProcessor.AutoSamplerSuffix) === name.length - WebGPUShaderProcessor.AutoSamplerSuffix.length
                    ? name.substring(0, name.indexOf(WebGPUShaderProcessor.AutoSamplerSuffix))
                    : null;
            const samplerBindingType = samplerType === "sampler_comparison" ? WebGPUConstants.SamplerBindingType.Comparison : WebGPUConstants.SamplerBindingType.Filtering;

            if (textureName) {
                const textureInfo = this._webgpuProcessingContext.availableTextures[textureName];
                if (textureInfo) {
                    textureInfo.autoBindSampler = true;
                }
            }

            let samplerInfo = this._webgpuProcessingContext.availableSamplers[name];
            if (!samplerInfo) {
                samplerInfo = {
                    binding: this._webgpuProcessingContext.getNextFreeUBOBinding(),
                    type: samplerBindingType,
                };
                this._webgpuProcessingContext.availableSamplers[name] = samplerInfo;
            }

            this._addSamplerBindingDescription(name, samplerInfo, isVertex);

            const part1 = code.substring(0, match.index);
            const insertPart = `@group(${samplerInfo.binding.groupIndex}) @binding(${samplerInfo.binding.bindingIndex}) `;
            const part2 = code.substring(match.index);

            code = part1 + insertPart + part2;

            samplerRegexp.lastIndex += insertPart.length;
        }

        return code;
    }

    private _processCustomBuffers(code: string, isVertex: boolean): string {
        const instantiateBufferRegexp = /var<\s*(uniform|storage)\s*(,\s*(read|read_write)\s*)?>\s+(\S+)\s*:\s*(\S+)\s*;/gm;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const match = instantiateBufferRegexp.exec(code);
            if (match === null) {
                break;
            }

            const type = match[1];
            const decoration = match[3];
            let name = match[4];
            const structName = match[5];

            let bufferInfo = this._webgpuProcessingContext.availableBuffers[name];
            if (!bufferInfo) {
                const knownUBO = type === "uniform" ? WebGPUShaderProcessingContext.KnownUBOs[structName] : null;

                let binding;
                if (knownUBO) {
                    name = structName;
                    binding = knownUBO.binding;
                    if (binding.groupIndex === -1) {
                        binding = this._webgpuProcessingContext.getNextFreeUBOBinding();
                    }
                } else {
                    binding = this._webgpuProcessingContext.getNextFreeUBOBinding();
                }

                bufferInfo = { binding };
                this._webgpuProcessingContext.availableBuffers[name] = bufferInfo;
            }

            this._addBufferBindingDescription(
                name,
                this._webgpuProcessingContext.availableBuffers[name],
                decoration === "read_write"
                    ? WebGPUConstants.BufferBindingType.Storage
                    : type === "storage"
                      ? WebGPUConstants.BufferBindingType.ReadOnlyStorage
                      : WebGPUConstants.BufferBindingType.Uniform,
                isVertex
            );

            const groupIndex = bufferInfo.binding.groupIndex;
            const bindingIndex = bufferInfo.binding.bindingIndex;

            const part1 = code.substring(0, match.index);
            const insertPart = `@group(${groupIndex}) @binding(${bindingIndex}) `;
            const part2 = code.substring(match.index);

            code = part1 + insertPart + part2;

            instantiateBufferRegexp.lastIndex += insertPart.length;
        }

        return code;
    }

    private _processStridedUniformArrays(code: string): string {
        for (const uniformArrayName of this._stridedUniformArrays) {
            code = code.replace(new RegExp(`${uniformArrayName}\\s*\\[(.*)\\]`, "g"), `${uniformArrayName}[$1].el`);
        }
        return code;
    }
}

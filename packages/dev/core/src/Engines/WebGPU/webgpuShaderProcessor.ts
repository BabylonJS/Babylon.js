/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
import { Logger } from "core/Misc/logger";
import { ShaderLanguage } from "../../Materials/shaderLanguage";
import type { Nullable } from "../../types";
import type { IShaderProcessor } from "../Processors/iShaderProcessor";
import * as WebGPUConstants from "./webgpuConstants";
import type { WebGPUSamplerDescription, WebGPUShaderProcessingContext, WebGPUTextureDescription, WebGPUBufferDescription } from "./webgpuShaderProcessingContext";

/** @internal */
export abstract class WebGPUShaderProcessor implements IShaderProcessor {
    public static readonly AutoSamplerSuffix = "Sampler";
    public static readonly LeftOvertUBOName = "LeftOver";
    public static readonly InternalsUBOName = "Internals";

    public static UniformSizes: { [type: string]: number } = {
        // GLSL types
        bool: 1,
        int: 1,
        float: 1,
        vec2: 2,
        ivec2: 2,
        uvec2: 2,
        vec3: 3,
        ivec3: 3,
        uvec3: 3,
        vec4: 4,
        ivec4: 4,
        uvec4: 4,
        mat2: 4,
        mat3: 12,
        mat4: 16,

        // WGSL types
        i32: 1,
        u32: 1,
        f32: 1,
        mat2x2: 4,
        mat3x3: 12,
        mat4x4: 16,
    };

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected static _SamplerFunctionByWebGLSamplerType: { [key: string]: string } = {
        sampler2D: "sampler2D",
        sampler2DArray: "sampler2DArray",
        sampler2DShadow: "sampler2DShadow",
        sampler2DArrayShadow: "sampler2DArrayShadow",
        samplerCube: "samplerCube",
        sampler3D: "sampler3D",
    };

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected static _TextureTypeByWebGLSamplerType: { [key: string]: string } = {
        sampler2D: "texture2D",
        sampler2DArray: "texture2DArray",
        sampler2DShadow: "texture2D",
        sampler2DArrayShadow: "texture2DArray",
        samplerCube: "textureCube",
        samplerCubeArray: "textureCubeArray",
        sampler3D: "texture3D",
    };

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected static _GpuTextureViewDimensionByWebGPUTextureType: { [key: string]: GPUTextureViewDimension } = {
        textureCube: WebGPUConstants.TextureViewDimension.Cube,
        textureCubeArray: WebGPUConstants.TextureViewDimension.CubeArray,
        texture2D: WebGPUConstants.TextureViewDimension.E2d,
        texture2DArray: WebGPUConstants.TextureViewDimension.E2dArray,
        texture3D: WebGPUConstants.TextureViewDimension.E3d,
    };

    // if the webgl sampler type is not listed in this array, "sampler" is taken by default
    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected static _SamplerTypeByWebGLSamplerType: { [key: string]: string } = {
        sampler2DShadow: "samplerShadow",
        sampler2DArrayShadow: "samplerShadow",
    };

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected static _IsComparisonSamplerByWebGPUSamplerType: { [key: string]: boolean } = {
        samplerShadow: true,
        samplerArrayShadow: true,
        sampler: false,
    };

    public shaderLanguage = ShaderLanguage.GLSL;

    // this object is populated only with vertex kinds known by the engine (position, uv, ...) and only if the type of the corresponding vertex buffer is an integer type)
    // if the type is a signed type, the value is negated
    public vertexBufferKindToNumberOfComponents: { [kind: string]: number } = {};

    protected _webgpuProcessingContext: WebGPUShaderProcessingContext;

    protected abstract _getArraySize(name: string, type: string, preProcessors: { [key: string]: string }): [string, string, number];
    protected abstract _generateLeftOverUBOCode(name: string, uniformBufferDescription: WebGPUBufferDescription): string;

    protected _addUniformToLeftOverUBO(name: string, uniformType: string, preProcessors: { [key: string]: string }): void {
        let length = 0;

        [name, uniformType, length] = this._getArraySize(name, uniformType, preProcessors);

        for (let i = 0; i < this._webgpuProcessingContext.leftOverUniforms.length; i++) {
            if (this._webgpuProcessingContext.leftOverUniforms[i].name === name) {
                return;
            }
        }

        this._webgpuProcessingContext.leftOverUniforms.push({
            name,
            type: uniformType,
            length,
        });
    }

    protected _buildLeftOverUBO(): string {
        if (!this._webgpuProcessingContext.leftOverUniforms.length) {
            return "";
        }
        const name = WebGPUShaderProcessor.LeftOvertUBOName;
        let availableUBO = this._webgpuProcessingContext.availableBuffers[name];
        if (!availableUBO) {
            availableUBO = {
                binding: this._webgpuProcessingContext.getNextFreeUBOBinding(),
            };
            this._webgpuProcessingContext.availableBuffers[name] = availableUBO;
            this._addBufferBindingDescription(name, availableUBO, WebGPUConstants.BufferBindingType.Uniform, true);
            this._addBufferBindingDescription(name, availableUBO, WebGPUConstants.BufferBindingType.Uniform, false);
        }

        return this._generateLeftOverUBOCode(name, availableUBO);
    }

    protected _collectBindingNames(): void {
        // collect all the binding names for faster processing in WebGPUCacheBindGroup
        for (let i = 0; i < this._webgpuProcessingContext.bindGroupLayoutEntries.length; i++) {
            const setDefinition = this._webgpuProcessingContext.bindGroupLayoutEntries[i];
            if (setDefinition === undefined) {
                this._webgpuProcessingContext.bindGroupLayoutEntries[i] = [];
                continue;
            }
            for (let j = 0; j < setDefinition.length; j++) {
                const entry = this._webgpuProcessingContext.bindGroupLayoutEntries[i][j];
                const name = this._webgpuProcessingContext.bindGroupLayoutEntryInfo[i][entry.binding].name;
                const nameInArrayOfTexture = this._webgpuProcessingContext.bindGroupLayoutEntryInfo[i][entry.binding].nameInArrayOfTexture;
                if (entry) {
                    if (entry.texture || entry.externalTexture || entry.storageTexture) {
                        this._webgpuProcessingContext.textureNames.push(nameInArrayOfTexture!);
                    } else if (entry.sampler) {
                        this._webgpuProcessingContext.samplerNames.push(name);
                    } else if (entry.buffer) {
                        this._webgpuProcessingContext.bufferNames.push(name);
                    }
                }
            }
        }
    }

    protected _preCreateBindGroupEntries(): void {
        const bindGroupEntries = this._webgpuProcessingContext.bindGroupEntries;

        for (let i = 0; i < this._webgpuProcessingContext.bindGroupLayoutEntries.length; i++) {
            const setDefinition = this._webgpuProcessingContext.bindGroupLayoutEntries[i];

            const entries: GPUBindGroupEntry[] = [];
            for (let j = 0; j < setDefinition.length; j++) {
                const entry = this._webgpuProcessingContext.bindGroupLayoutEntries[i][j];

                if (entry.sampler || entry.texture || entry.storageTexture || entry.externalTexture) {
                    entries.push({
                        binding: entry.binding,
                        resource: undefined as any,
                    });
                } else if (entry.buffer) {
                    entries.push({
                        binding: entry.binding,
                        resource: {
                            buffer: undefined as any,
                            offset: 0,
                            size: 0,
                        },
                    });
                }
            }

            bindGroupEntries[i] = entries;
        }
    }

    protected _addTextureBindingDescription(
        name: string,
        textureInfo: WebGPUTextureDescription,
        textureIndex: number,
        dimension: Nullable<GPUTextureViewDimension>,
        format: Nullable<GPUTextureFormat>,
        isVertex: boolean
    ): void {
        // eslint-disable-next-line prefer-const
        let { groupIndex, bindingIndex } = textureInfo.textures[textureIndex];
        if (!this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex]) {
            this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex] = [];
            this._webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex] = [];
        }
        if (!this._webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex]) {
            let len;
            if (dimension === null) {
                len = this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex].push({
                    binding: bindingIndex,
                    visibility: 0,
                    externalTexture: {},
                });
            } else if (format) {
                len = this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex].push({
                    binding: bindingIndex,
                    visibility: 0,
                    storageTexture: {
                        access: WebGPUConstants.StorageTextureAccess.WriteOnly,
                        format,
                        viewDimension: dimension,
                    },
                });
            } else {
                len = this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex].push({
                    binding: bindingIndex,
                    visibility: 0,
                    texture: {
                        sampleType: textureInfo.sampleType,
                        viewDimension: dimension,
                        multisampled: false,
                    },
                });
            }
            const textureName = textureInfo.isTextureArray ? name + textureIndex : name;
            this._webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex] = { name, index: len - 1, nameInArrayOfTexture: textureName };
        }

        bindingIndex = this._webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex].index;
        if (isVertex) {
            this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex][bindingIndex].visibility |= WebGPUConstants.ShaderStage.Vertex;
        } else {
            this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex][bindingIndex].visibility |= WebGPUConstants.ShaderStage.Fragment;
        }
    }

    protected _addSamplerBindingDescription(name: string, samplerInfo: WebGPUSamplerDescription, isVertex: boolean): void {
        // eslint-disable-next-line prefer-const
        let { groupIndex, bindingIndex } = samplerInfo.binding;
        if (!this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex]) {
            this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex] = [];
            this._webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex] = [];
        }
        if (!this._webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex]) {
            const len = this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex].push({
                binding: bindingIndex,
                visibility: 0,
                sampler: {
                    type: samplerInfo.type,
                },
            });
            this._webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex] = { name, index: len - 1 };
        }

        bindingIndex = this._webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex].index;
        if (isVertex) {
            this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex][bindingIndex].visibility |= WebGPUConstants.ShaderStage.Vertex;
        } else {
            this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex][bindingIndex].visibility |= WebGPUConstants.ShaderStage.Fragment;
        }
    }

    protected _addBufferBindingDescription(name: string, uniformBufferInfo: WebGPUBufferDescription, bufferType: GPUBufferBindingType, isVertex: boolean): void {
        // eslint-disable-next-line prefer-const
        let { groupIndex, bindingIndex } = uniformBufferInfo.binding;
        if (!this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex]) {
            this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex] = [];
            this._webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex] = [];
        }
        if (!this._webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex]) {
            const len = this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex].push({
                binding: bindingIndex,
                visibility: 0,
                buffer: {
                    type: bufferType,
                },
            });
            this._webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex] = { name, index: len - 1 };
        }

        bindingIndex = this._webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex].index;
        if (isVertex) {
            this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex][bindingIndex].visibility |= WebGPUConstants.ShaderStage.Vertex;
        } else {
            this._webgpuProcessingContext.bindGroupLayoutEntries[groupIndex][bindingIndex].visibility |= WebGPUConstants.ShaderStage.Fragment;
        }
    }

    protected _injectStartingAndEndingCode(code: string, mainFuncDecl: string, startingCode?: string, endingCode?: string): string {
        let idx = code.indexOf(mainFuncDecl);
        if (idx < 0) {
            Logger.Error(`No "main" function found in shader code! Processing aborted.`);
            return code;
        }
        if (startingCode) {
            // eslint-disable-next-line no-empty
            while (idx++ < code.length && code.charAt(idx) != "{") {}
            if (idx < code.length) {
                const part1 = code.substring(0, idx + 1);
                const part2 = code.substring(idx + 1);
                code = part1 + startingCode + part2;
            }
        }

        if (endingCode) {
            const lastClosingCurly = code.lastIndexOf("}");
            code = code.substring(0, lastClosingCurly);
            code += endingCode + "\n}";
        }

        return code;
    }
}

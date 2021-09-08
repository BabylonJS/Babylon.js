import { Nullable } from "../../types";
import * as WebGPUConstants from './webgpuConstants';
import { WebGPUSamplerDescription, WebGPUShaderProcessingContext, WebGPUTextureDescription, WebGPUUniformBufferDescription } from "./webgpuShaderProcessingContext";

/** @hidden */
export abstract class WebGPUShaderProcessor {

    public static readonly AutoSamplerSuffix = "Sampler";

    public static UniformSizes: { [type: string]: number } = {
        // GLSL types
        "bool": 1,
        "int": 1,
        "float": 1,
        "vec2": 2,
        "ivec2": 2,
        "vec3": 3,
        "ivec3": 3,
        "vec4": 4,
        "ivec4": 4,
        "mat2": 4,
        "mat3": 12,
        "mat4": 16,
    
        // WGSL types
        "i32": 1,
        "u32": 1,
        "f32": 1,
        "mat2x2": 4,
        "mat3x3": 12,
        "mat4x4": 16
    };

    protected static _KnownUBOs: { [key: string]: WebGPUUniformBufferDescription } = {
        "Scene":   { binding: { groupIndex: 0, bindingIndex: 0 } },

        "Light0":  { binding: { groupIndex: 1, bindingIndex: 0 } },
        "Light1":  { binding: { groupIndex: 1, bindingIndex: 1 } },
        "Light2":  { binding: { groupIndex: 1, bindingIndex: 2 } },
        "Light3":  { binding: { groupIndex: 1, bindingIndex: 3 } },
        "Light4":  { binding: { groupIndex: 1, bindingIndex: 4 } },
        "Light5":  { binding: { groupIndex: 1, bindingIndex: 5 } },
        "Light6":  { binding: { groupIndex: 1, bindingIndex: 6 } },
        "Light7":  { binding: { groupIndex: 1, bindingIndex: 7 } },
        "Light8":  { binding: { groupIndex: 1, bindingIndex: 8 } },
        "Light9":  { binding: { groupIndex: 1, bindingIndex: 9 } },
        "Light10": { binding: { groupIndex: 1, bindingIndex: 10 } },
        "Light11": { binding: { groupIndex: 1, bindingIndex: 11 } },
        "Light12": { binding: { groupIndex: 1, bindingIndex: 12 } },
        "Light13": { binding: { groupIndex: 1, bindingIndex: 13 } },
        "Light14": { binding: { groupIndex: 1, bindingIndex: 14 } },
        "Light15": { binding: { groupIndex: 1, bindingIndex: 15 } },
        "Light16": { binding: { groupIndex: 1, bindingIndex: 16 } },
        "Light17": { binding: { groupIndex: 1, bindingIndex: 17 } },
        "Light18": { binding: { groupIndex: 1, bindingIndex: 18 } },
        "Light19": { binding: { groupIndex: 1, bindingIndex: 19 } },
        "Light20": { binding: { groupIndex: 1, bindingIndex: 20 } },
        "Light21": { binding: { groupIndex: 1, bindingIndex: 21 } },
        "Light22": { binding: { groupIndex: 1, bindingIndex: 22 } },
        "Light23": { binding: { groupIndex: 1, bindingIndex: 23 } },
        "Light24": { binding: { groupIndex: 1, bindingIndex: 24 } },
        "Light25": { binding: { groupIndex: 1, bindingIndex: 25 } },
        "Light26": { binding: { groupIndex: 1, bindingIndex: 26 } },
        "Light27": { binding: { groupIndex: 1, bindingIndex: 27 } },
        "Light28": { binding: { groupIndex: 1, bindingIndex: 28 } },
        "Light29": { binding: { groupIndex: 1, bindingIndex: 29 } },
        "Light30": { binding: { groupIndex: 1, bindingIndex: 30 } },
        "Light31": { binding: { groupIndex: 1, bindingIndex: 31 } },

        "Material": { binding: { groupIndex: 2, bindingIndex: 0 } },
        "Mesh":     { binding: { groupIndex: 2, bindingIndex: 1 } },
    };

    protected static _SamplerFunctionByWebGLSamplerType: { [key: string]: string } = {
        "sampler2D": "sampler2D",
        "sampler2DArray": "sampler2DArray",
        "sampler2DShadow": "sampler2DShadow",
        "sampler2DArrayShadow": "sampler2DArrayShadow",
        "samplerCube": "samplerCube",
        "sampler3D": "sampler3D",
    };

    protected static _TextureTypeByWebGLSamplerType: { [key: string]: string } = {
        "sampler2D": "texture2D",
        "sampler2DArray": "texture2DArray",
        "sampler2DShadow": "texture2D",
        "sampler2DArrayShadow": "texture2DArray",
        "samplerCube": "textureCube",
        "samplerCubeArray": "textureCubeArray",
        "sampler3D": "texture3D",
    };

    protected static _GpuTextureViewDimensionByWebGPUTextureType: { [key: string]: GPUTextureViewDimension } = {
        "textureCube": WebGPUConstants.TextureViewDimension.Cube,
        "textureCubeArray": WebGPUConstants.TextureViewDimension.CubeArray,
        "texture2D": WebGPUConstants.TextureViewDimension.E2d,
        "texture2DArray": WebGPUConstants.TextureViewDimension.E2dArray,
        "texture3D": WebGPUConstants.TextureViewDimension.E3d,
    };

    // if the webgl sampler type is not listed in this array, "sampler" is taken by default
    protected static _SamplerTypeByWebGLSamplerType: { [key: string]: string } = {
        "sampler2DShadow": "samplerShadow",
        "sampler2DArrayShadow": "samplerShadow",
    };

    protected static _IsComparisonSamplerByWebGPUSamplerType: { [key: string]: boolean } = {
        "samplerShadow": true,
        "samplerArrayShadow": true,
        "sampler": false,
    };

    protected webgpuProcessingContext: WebGPUShaderProcessingContext;

    protected abstract _getArraySize(name: string, type: string, preProcessors: { [key: string]: string }): [string, string, number];
    protected abstract _generateLeftOverUBOCode(name: string, uniformBufferDescription: WebGPUUniformBufferDescription): string;

    protected _addUniformToLeftOverUBO(name: string, uniformType: string, preProcessors: { [key: string]: string }): void {
        let length = 0;

        [name, uniformType, length] = this._getArraySize(name, uniformType, preProcessors);

        for (let i = 0; i < this.webgpuProcessingContext.leftOverUniforms.length; i++) {
            if (this.webgpuProcessingContext.leftOverUniforms[i].name === name) {
                return;
            }
        }

        this.webgpuProcessingContext.leftOverUniforms.push({
            name,
            type: uniformType,
            length
        });
    }

    protected _buildLeftOverUBO(): string {
        if (!this.webgpuProcessingContext.leftOverUniforms.length) {
            return "";
        }
        const name = "LeftOver";
        let availableUBO = this.webgpuProcessingContext.availableUBOs[name];
        if (!availableUBO) {
            availableUBO = {
                binding: this.webgpuProcessingContext.getNextFreeUBOBinding(),
            };
            this.webgpuProcessingContext.availableUBOs[name] = availableUBO;
            this._addUniformBufferBindingDescription(name, availableUBO, true);
            this._addUniformBufferBindingDescription(name, availableUBO, false);
        }

        return this._generateLeftOverUBOCode(name, availableUBO);
    }

    protected _collectBindingNames(): void {
        // collect all the binding names for faster processing in WebGPUCacheBindGroup
        for (let i = 0; i < this.webgpuProcessingContext.bindGroupLayoutEntries.length; i++) {
            const setDefinition = this.webgpuProcessingContext.bindGroupLayoutEntries[i];
            if (setDefinition === undefined) {
                this.webgpuProcessingContext.bindGroupLayoutEntries[i] = [];
                continue;
            }
            for (let j = 0; j < setDefinition.length; j++) {
                const entry = this.webgpuProcessingContext.bindGroupLayoutEntries[i][j];
                const name = this.webgpuProcessingContext.bindGroupLayoutEntryInfo[i][entry.binding].name;
                const nameInArrayOfTexture = this.webgpuProcessingContext.bindGroupLayoutEntryInfo[i][entry.binding].nameInArrayOfTexture;
                if (entry) {
                    if (entry.texture || entry.externalTexture) {
                        this.webgpuProcessingContext.textureNames.push(nameInArrayOfTexture!);
                    } else if (entry.sampler) {
                        this.webgpuProcessingContext.samplerNames.push(name);
                    } else  if (entry.buffer) {
                        this.webgpuProcessingContext.uniformBufferNames.push(name);
                    }
                }
            }
        }
    }

    protected _preCreateBindGroups(): void {
        const bindGroupEntries = this.webgpuProcessingContext.bindGroupEntries;

        for (let i = 0; i < this.webgpuProcessingContext.bindGroupLayoutEntries.length; i++) {
            const setDefinition = this.webgpuProcessingContext.bindGroupLayoutEntries[i];

            const entries: GPUBindGroupEntry[] = [];
            for (let j = 0; j < setDefinition.length; j++) {
                const entry = this.webgpuProcessingContext.bindGroupLayoutEntries[i][j];

                if (entry.sampler) {
                    entries.push({
                        binding: entry.binding,
                        resource: undefined as any,
                    });
                } else if (entry.texture) {
                    entries.push({
                        binding: entry.binding,
                        resource: undefined as any,
                    });
                } else if (entry.externalTexture) {
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

    protected _addTextureBindingDescription(name: string, textureInfo: WebGPUTextureDescription, textureIndex: number, dimension: Nullable<GPUTextureViewDimension>, isVertex: boolean): void {
        let { groupIndex, bindingIndex } = textureInfo.textures[textureIndex];
        if (!this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex]) {
            this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex] = [];
            this.webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex] = [];
        }
        if (!this.webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex]) {
            let len;
            if (dimension === null) {
                len = this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex].push({
                    binding: bindingIndex,
                    visibility: 0,
                    externalTexture: {},
                });
            } else {
                len = this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex].push({
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
            this.webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex] = { name, index: len - 1, nameInArrayOfTexture: textureName };
        }

        bindingIndex = this.webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex].index;
        if (isVertex) {
            this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex][bindingIndex].visibility |= WebGPUConstants.ShaderStage.Vertex;
        } else {
            this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex][bindingIndex].visibility |= WebGPUConstants.ShaderStage.Fragment
        }
    }

    protected _addSamplerBindingDescription(name: string, samplerInfo: WebGPUSamplerDescription, isVertex: boolean): void {
        let { groupIndex, bindingIndex } = samplerInfo.binding;
        if (!this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex]) {
            this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex] = [];
            this.webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex] = [];
        }
        if (!this.webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex]) {
            const len = this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex].push({
                binding: bindingIndex,
                visibility: 0,
                sampler: {
                    type: samplerInfo.type,
                },
            });
            this.webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex] = { name, index: len - 1 };
        }

        bindingIndex = this.webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex].index;
        if (isVertex) {
            this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex][bindingIndex].visibility |= WebGPUConstants.ShaderStage.Vertex;
        } else {
            this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex][bindingIndex].visibility |= WebGPUConstants.ShaderStage.Fragment
        }
    }

    protected _addUniformBufferBindingDescription(name: string, uniformBufferInfo: WebGPUUniformBufferDescription, isVertex: boolean): void {
        let { groupIndex, bindingIndex } = uniformBufferInfo.binding;
        if (!this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex]) {
            this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex] = [];
            this.webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex] = [];
        }
        if (!this.webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex]) {
            const len = this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex].push({
                binding: bindingIndex,
                visibility: 0,
                buffer: {
                    type: WebGPUConstants.BufferBindingType.Uniform,
                },
            });
            this.webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex] = { name, index: len - 1 };
        }

        bindingIndex = this.webgpuProcessingContext.bindGroupLayoutEntryInfo[groupIndex][bindingIndex].index;
        if (isVertex) {
            this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex][bindingIndex].visibility |= WebGPUConstants.ShaderStage.Vertex;
        } else {
            this.webgpuProcessingContext.bindGroupLayoutEntries[groupIndex][bindingIndex].visibility |= WebGPUConstants.ShaderStage.Fragment
        }
    }
}

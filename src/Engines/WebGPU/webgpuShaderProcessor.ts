import * as WebGPUConstants from './webgpuConstants';
import { WebGPUShaderProcessingContext, WebGPUTextureSamplerBindingDescription } from "./webgpuShaderProcessingContext";

/** @hidden */
export abstract class WebGPUShaderProcessor {

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

    protected static _KnownUBOs: { [key: string]: { setIndex: number, bindingIndex: number, varName: string } } = {
        "Scene": { setIndex: 0, bindingIndex: 0, varName: "scene" },
        "Light0": { setIndex: 0, bindingIndex: 1, varName: "light0" },
        "Light1": { setIndex: 0, bindingIndex: 2, varName: "light1" },
        "Light2": { setIndex: 0, bindingIndex: 3, varName: "light2" },
        "Light3": { setIndex: 0, bindingIndex: 4, varName: "light3" },
        "Light4": { setIndex: 0, bindingIndex: 5, varName: "light4" },
        "Light5": { setIndex: 0, bindingIndex: 6, varName: "light5" },
        "Light6": { setIndex: 0, bindingIndex: 7, varName: "light6" },
        "Light7": { setIndex: 0, bindingIndex: 8, varName: "light7" },
        "Light8": { setIndex: 0, bindingIndex: 9, varName: "light8" },
        "Light9": { setIndex: 0, bindingIndex: 10, varName: "light9" },
        "Light10": { setIndex: 0, bindingIndex: 11, varName: "light10" },
        "Light11": { setIndex: 0, bindingIndex: 12, varName: "light11" },
        "Light12": { setIndex: 0, bindingIndex: 13, varName: "light12" },
        "Light13": { setIndex: 0, bindingIndex: 14, varName: "light13" },
        "Light14": { setIndex: 0, bindingIndex: 15, varName: "light14" },
        "Material": { setIndex: 1, bindingIndex: 0, varName: "material" },
        "Mesh": { setIndex: 1, bindingIndex: 1, varName: "mesh" },
    };

    protected static _KnownSamplers: { [key: string]: WebGPUTextureSamplerBindingDescription } = {
        "environmentBrdfSampler": { sampler: { setIndex: 1, bindingIndex: 2 }, isTextureArray: false, textures: [{ setIndex: 1, bindingIndex: 3 }] },
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
    protected abstract _generateLeftOverUBOCode(name: string, setIndex: number, bindingIndex: number): string;

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
            availableUBO = this.webgpuProcessingContext.getNextFreeUBOBinding();
            this.webgpuProcessingContext.availableUBOs[name] = availableUBO;
            if (!this.webgpuProcessingContext.orderedUBOsAndSamplers[availableUBO.setIndex]) {
                this.webgpuProcessingContext.orderedUBOsAndSamplers[availableUBO.setIndex] = [];
            }
            this.webgpuProcessingContext.orderedUBOsAndSamplers[availableUBO.setIndex][availableUBO.bindingIndex] = { isSampler: false, isTexture: false, usedInVertex: true, usedInFragment: true, name };
        }

        return this._generateLeftOverUBOCode(name, availableUBO.setIndex, availableUBO.bindingIndex);
    }

    protected _collectSamplerAndUBONames(): void {
        // collect all the buffer names for faster processing later in _getBindGroupsToRender
        // also collect all the sampler names
        this.webgpuProcessingContext.samplerNames = [];
        for (let i = 0; i < this.webgpuProcessingContext.orderedUBOsAndSamplers.length; i++) {
            const setDefinition = this.webgpuProcessingContext.orderedUBOsAndSamplers[i];
            if (setDefinition === undefined) {
                continue;
            }
            for (let j = 0; j < setDefinition.length; j++) {
                const bindingDefinition = this.webgpuProcessingContext.orderedUBOsAndSamplers[i][j];
                if (bindingDefinition) {
                    if (bindingDefinition.isTexture) {
                        this.webgpuProcessingContext.samplerNames.push(bindingDefinition.name);
                    }
                    if (!bindingDefinition.isSampler && !bindingDefinition.isTexture) {
                        this.webgpuProcessingContext.uniformBufferNames.push(bindingDefinition.name);
                    }
                }
            }
        }
    }

    protected _addTextureBindingDescription(name: string, origName: string, setIndex: number, bindingIndex: number, sampleType: GPUTextureSampleType, dimension: GPUTextureViewDimension, isVertex: boolean): void {
        if (!this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex]) {
            this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex] = [];
        }
        if (!this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex]) {
            this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex] = {
                isSampler: false,
                isTexture: true,
                sampleType,
                textureDimension: dimension,
                usedInVertex: false,
                usedInFragment: false,
                name,
                origName,
            };
        }
        if (isVertex) {
            this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex].usedInVertex = true;
        } else {
            this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex].usedInFragment = true;
        }
    }

    protected _addSamplerBindingDescription(name: string, setIndex: number, bindingIndex: number, samplerBindingType: GPUSamplerBindingType, isVertex: boolean): void {
        if (!this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex]) {
            this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex] = [];
        }
        if (!this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex]) {
            this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex] = {
                isSampler: true,
                isTexture: false,
                samplerBindingType,
                usedInVertex: false,
                usedInFragment: false,
                name,
            };
        }

        if (isVertex) {
            this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex].usedInVertex = true;
        } else {
            this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex].usedInFragment = true;
        }
    }

    protected _addUniformBufferBindingDescription(name: string, setIndex: number, bindingIndex: number, isVertex: boolean): void {
        if (!this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex]) {
            this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex] = [];
        }
        if (!this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex]) {
            this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex] = {
                isSampler: false,
                isTexture: false,
                name,
                usedInVertex: false,
                usedInFragment: false
            };
        }

        if (isVertex) {
            this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex].usedInVertex = true;
        } else {
            this.webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex].usedInFragment = true;
        }
    }
}

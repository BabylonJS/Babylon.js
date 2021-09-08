import { ShaderLanguage } from "../Processors/iShaderProcessor";
import { ShaderProcessingContext } from "../Processors/shaderProcessingOptions";

const _maxGroups = 4;
const _maxBindingsPerGroup = 1 << 16;

// all types not listed are assumed to consume 1 location
const _typeToLocationSize: { [key: string]: number } = {
    // GLSL types
    "mat2": 2,
    "mat3": 3,
    "mat4": 4,

    // WGSL types
    "mat2x2": 2,
    "mat3x3": 3,
    "mat4x4": 4,
};

/** @hidden */
export interface WebGPUBindingInfo {
    groupIndex: number;
    bindingIndex: number;
}

/** @hidden */
export interface WebGPUTextureDescription {
    autoBindSampler?: boolean;
    isTextureArray: boolean;
    textures: Array<WebGPUBindingInfo>;
    sampleType: GPUTextureSampleType;
}

/** @hidden */
export interface WebGPUSamplerDescription {
    binding: WebGPUBindingInfo;
    type: GPUSamplerBindingType;
}

/** @hidden */
export interface WebGPUUniformBufferDescription {
    binding: WebGPUBindingInfo;
}

/** @hidden */
export interface WebGPUBindGroupLayoutEntryInfo {
    name: string;
    index: number; // index of the entry (GPUBindGroupLayoutEntry) in the bindGroupLayoutEntries[group] array
    nameInArrayOfTexture?: string; // something like texture0, texture1, ... if texture is an array, else same thing as "name"
}

/**
 * @hidden
 */
export class WebGPUShaderProcessingContext implements ShaderProcessingContext {
    public shaderLanguage: ShaderLanguage;

    public uboNextBindingIndex: number;
    public freeGroupIndex: number;
    public freeBindingIndex: number;

    public availableVaryings: { [key: string]: number };
    public availableAttributes: { [key: string]: number };
    public availableUBOs: { [key: string]: WebGPUUniformBufferDescription };
    public availableTextures: { [key: string]: WebGPUTextureDescription };
    public availableSamplers: { [key: string]: WebGPUSamplerDescription };

    public leftOverUniforms: { name: string, type: string, length: number }[];

    public orderedAttributes: string[];
    public bindGroupLayoutEntries: GPUBindGroupLayoutEntry[][];
    public bindGroupLayoutEntryInfo: WebGPUBindGroupLayoutEntryInfo[][];
    public uniformBufferNames: string[]; // list of all uniform buffer names used in the shader
    public textureNames: string[]; // list of all texture names used in the shader
    public samplerNames: string[]; // list of all sampler names used in the shader
    public attributeNamesFromEffect: string[];
    public attributeLocationsFromEffect: number[];

    private _attributeNextLocation: number;
    private _varyingNextLocation: number;

    constructor(shaderLanguage: ShaderLanguage) {
        this.shaderLanguage = shaderLanguage;

        this._attributeNextLocation = 0;
        this._varyingNextLocation = 0;
        this.freeGroupIndex = 2;
        this.freeBindingIndex = 2;

        this.availableVaryings = {};
        this.availableAttributes = {};
        this.availableUBOs = {};
        this.availableTextures = {};
        this.availableSamplers = {};

        this.orderedAttributes = [];
        this.bindGroupLayoutEntries = [];
        this.bindGroupLayoutEntryInfo = [];
        this.uniformBufferNames = [];
        this.textureNames = [];
        this.samplerNames = [];

        this.leftOverUniforms = [];
    }

    public getAttributeNextLocation(dataType: string, arrayLength: number = 0): number {
        const index = this._attributeNextLocation;

        this._attributeNextLocation += (_typeToLocationSize[dataType] ?? 1) * (arrayLength || 1);

        return index;
    }

    public getVaryingNextLocation(dataType: string, arrayLength: number = 0): number {
        const index = this._varyingNextLocation;

        this._varyingNextLocation += (_typeToLocationSize[dataType] ?? 1) * (arrayLength || 1);

        return index;
    }

    public getNextFreeUBOBinding() {
        return this._getNextFreeBinding(1);
    }

    private _getNextFreeBinding(bindingCount: number) {
        if (this.freeBindingIndex > _maxBindingsPerGroup - bindingCount) {
            this.freeGroupIndex++;
            this.freeBindingIndex = 0;
        }

        if (this.freeGroupIndex === _maxGroups) {
            throw "Too many textures or UBOs have been declared and it is not supported in WebGPU.";
        }

        const returnValue = {
            groupIndex: this.freeGroupIndex,
            bindingIndex: this.freeBindingIndex
        };

        this.freeBindingIndex += bindingCount;

        return returnValue;
    }
}
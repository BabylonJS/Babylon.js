import { ShaderProcessingContext } from "../Processors/shaderProcessingOptions";

const _maxSets = 4;
const _maxBindingsPerSet = 16;

// all types not listed are assumed to consume 1 location
const _webGLTypeToLocationSize: { [key: string]: number } = {
    "mat2": 2,
    "mat3": 3,
    "mat4": 4,
};

/** @hidden */
export interface WebGPUBindingInfo {
    setIndex: number;
    bindingIndex: number;
}

/** @hidden */
export interface WebGPUTextureSamplerBindingDescription {
    sampler: WebGPUBindingInfo;
    isTextureArray: boolean;
    textures: Array<WebGPUBindingInfo>;
}

/** @hidden
 *  If the binding is a UBO, isSampler=isTexture=false
*/
export interface WebGPUBindingDescription {
    name: string;
    usedInVertex: boolean;
    usedInFragment: boolean;

    isSampler: boolean;
    isComparisonSampler?: boolean;

    isTexture: boolean;
    sampleType?: GPUTextureSampleType;
    textureDimension?: GPUTextureViewDimension;
}

/**
 * @hidden
 */
export class WebGPUShaderProcessingContext implements ShaderProcessingContext {
    public uboNextBindingIndex: number;
    public freeSetIndex: number;
    public freeBindingIndex: number;

    public availableVaryings: { [key: string]: number };
    public availableAttributes: { [key: string]: number };
    public availableUBOs: { [key: string]: { setIndex: number, bindingIndex: number} };
    public availableSamplers: { [key: string]: WebGPUTextureSamplerBindingDescription };

    public leftOverUniforms: { name: string, type: string, length: number }[];

    public orderedAttributes: string[];
    public orderedUBOsAndSamplers: WebGPUBindingDescription[][];
    public uniformBufferNames: string[];
    public samplerNames: string[]; // list of all sampler names used in the shader
    public attributeNamesFromEffect: string[];
    public attributeLocationsFromEffect: number[];

    private _attributeNextLocation: number;
    private _varyingNextLocation: number;

    constructor() {
        this._attributeNextLocation = 0;
        this._varyingNextLocation = 0;
        this.freeSetIndex = 2;
        this.freeBindingIndex = 0;

        this.availableVaryings = { };
        this.availableAttributes = { };
        this.availableUBOs = { };
        this.availableSamplers = { };

        this.orderedAttributes = [];
        this.orderedUBOsAndSamplers = [];
        this.uniformBufferNames = [];

        this.leftOverUniforms = [];
    }

    public getAttributeNextLocation(dataType: string, arrayLength: number = 0): number {
        const index = this._attributeNextLocation;

        this._attributeNextLocation += (_webGLTypeToLocationSize[dataType] ?? 1) * (arrayLength || 1);

        return index;
    }

    public getVaryingNextLocation(dataType: string, arrayLength: number = 0): number {
        const index = this._varyingNextLocation;

        this._varyingNextLocation += (_webGLTypeToLocationSize[dataType] ?? 1) * (arrayLength || 1);

        return index;
    }

    public getNextFreeUBOBinding() {
        return this._getNextFreeBinding(1);
    }

    private _getNextFreeBinding(bindingCount: number) {
        if (this.freeBindingIndex > _maxBindingsPerSet - bindingCount) {
            this.freeSetIndex++;
            this.freeBindingIndex = 0;
        }

        if (this.freeSetIndex === _maxSets) {
            throw "Too many textures or UBOs have been declared and it is not supported in WebGPU.";
        }

        const returnValue = {
            setIndex: this.freeSetIndex,
            bindingIndex: this.freeBindingIndex
        };

        this.freeBindingIndex += bindingCount;

        return returnValue;
    }
}
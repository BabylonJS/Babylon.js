import { ShaderProcessingContext } from "../Processors/shaderProcessingOptions";

const _maxSets = 4;
const _maxBindingsPerSet = 16;

/**
 * @hidden
 */
export class WebGPUShaderProcessingContext implements ShaderProcessingContext {
    public attributeNextLocation: number;
    public varyingNextLocation: number;
    public uboNextBindingIndex: number;
    public freeSetIndex: number;
    public freeBindingIndex: number;

    public availableVaryings: { [key: string]: number };
    public availableAttributes: { [key: string]: number };
    public availableUBOs: { [key: string]: { setIndex: number, bindingIndex: number} };
    public availableSamplers: { [key: string]: { setIndex: number, bindingIndex: number} };

    public leftOverUniforms: { name: string, type: string, length: number }[];

    public orderedAttributes: string[];
    public orderedUBOsAndSamplers: { name: string, isSampler: boolean, textureDimension?: GPUTextureViewDimension }[][];

    constructor() {
        this.attributeNextLocation = 0;
        this.varyingNextLocation = 0;
        this.freeSetIndex = 2;
        this.freeBindingIndex = 0;

        this.availableVaryings = { };
        this.availableAttributes = { };
        this.availableUBOs = { };
        this.availableSamplers = { };

        this.orderedAttributes = [];
        this.orderedUBOsAndSamplers = [];

        this.leftOverUniforms = [];
    }

    public getNextFreeUBOBinding() {
        return this._getNextFreeBinding(1);
    }

    public getNextFreeTextureBinding() {
        return this._getNextFreeBinding(2);
    }

    private _getNextFreeBinding(bindingCount: number) {
        if (this.freeBindingIndex > _maxBindingsPerSet - bindingCount) {
            this.freeSetIndex++;
            this.freeBindingIndex = 0;
        }

        if (this.freeSetIndex === _maxSets) {
            throw "Too many textures or UBOs have been declared and it is not supprted in WebGPU.";
        }

        const returnValue = {
            setIndex: this.freeSetIndex,
            bindingIndex: this.freeBindingIndex
        };

        this.freeBindingIndex += bindingCount;

        return returnValue;
    }
}
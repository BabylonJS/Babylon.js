import { ShaderProcessingContext } from "../processors/shaderProcessingOptions";

/**
 * @hidden
 */
export class WebGPUShaderProcessingContext implements ShaderProcessingContext {
    public attributeNextLocation: number;
    public varyingNextLocation: number;
    public uboNextBindingIndex: number;

    public availableAttributes: { [key: string]: number };
    public availableVaryings: { [key: string]: number };
    public availableUBOs: { [key: string]: { setIndex: number, bindingIndex: number} };

    constructor() {
        this.attributeNextLocation = 0;
        this.varyingNextLocation = 0;

        this.availableAttributes = { };
        this.availableVaryings = { };
        this.availableUBOs = { };
    }
}
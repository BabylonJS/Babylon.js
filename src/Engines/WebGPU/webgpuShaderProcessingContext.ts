import { ShaderProcessingContext } from "../processors/shaderProcessingOptions";

/**
 * @hidden
 */
export class WebGPUShaderProcessingContext implements ShaderProcessingContext {
    public attributeNextLocation: number;

    public availableAttributes: { [key: string]: number };

    constructor() {
        this.attributeNextLocation = 0;
        this.availableAttributes = { };
    }
}
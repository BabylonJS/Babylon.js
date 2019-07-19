import { ShaderProcessingContext } from "../processors/shaderProcessingOptions";

/**
 * @hidden
 */
export class WebGPUShaderProcessingContext implements ShaderProcessingContext {
    public attributeNextLocation: number;
    public varyingNextLocation: number;

    public availableAttributes: { [key: string]: number };
    public availableVaryings: { [key: string]: number };

    constructor() {
        this.attributeNextLocation = 0;
        this.varyingNextLocation = 0;

        this.availableAttributes = { };
        this.availableVaryings = { };
    }
}
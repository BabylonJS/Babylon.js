import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * Defines a block used to generate a null geometry data
 */
export class NullBlock extends NodeGeometryBlock {
    /**
     * Create a new NullBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "NullBlock";
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock() {
        this.geometry._storedValue = null;
    }
}

RegisterClass("BABYLON.NullBlock", NullBlock);

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
        this.registerOutput("vector", NodeGeometryBlockConnectionPointTypes.Vector3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NullBlock";
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the vector output component
     */
    public get vector(): NodeGeometryConnectionPoint {
        return this._outputs[1];
    }

    protected override _buildBlock() {
        this.geometry._storedValue = null;
        this.vector._storedValue = null;
    }
}

RegisterClass("BABYLON.NullBlock", NullBlock);

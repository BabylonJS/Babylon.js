import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
/**
 * Block used to compute arc tangent of 2 values
 */
export class GeometryArcTan2Block extends NodeGeometryBlock {
    /**
     * Creates a new GeometryArcTan2Block
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("x", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerInput("y", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "GeometryArcTan2Block";
    }

    /**
     * Gets the x operand input component
     */
    public get x(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the y operand input component
     */
    public get y(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock() {

        if (!this.x.isConnected || !this.y.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        this.output._storedFunction = (state) => {
            const x = this.x.getConnectedValue(state);
            const y = this.y.getConnectedValue(state);


            return Math.atan2(x, y);
        };
    }
}

RegisterClass("BABYLON.GeometryArcTan2Block", GeometryArcTan2Block);

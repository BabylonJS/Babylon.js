import { Vector2 } from "core/Maths/math.vector";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";

/**
 * Block used to rotate a 2d vector by a given angle
 */
export class GeometryRotate2dBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryRotate2dBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.Vector2);
        this.registerInput("angle", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Vector2);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GeometryRotate2dBlock";
    }

    /**
     * Gets the input vector
     */
    public get input(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the input angle
     */
    public get angle(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock() {
        if (!this.input.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        this.output._storedFunction = (state) => {
            const input = this.input.getConnectedValue(state) as Vector2;
            const angle = this.angle.getConnectedValue(state);
            return new Vector2(Math.cos(angle) * input.x - Math.sin(angle) * input.y, Math.sin(angle) * input.x + Math.cos(angle) * input.y);
        };

        return this;
    }
}

RegisterClass("BABYLON.GeometryRotate2dBlock", GeometryRotate2dBlock);

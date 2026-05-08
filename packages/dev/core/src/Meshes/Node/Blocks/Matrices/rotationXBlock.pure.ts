/** This file must only contain pure code and pure imports */

import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import { type NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { type NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { Matrix } from "../../../../Maths/math.vector.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * Block used to get a rotation matrix on X Axis
 */
export class RotationXBlock extends NodeGeometryBlock {
    /**
     * Create a new RotationXBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("angle", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerOutput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "RotationXBlock";
    }

    /**
     * Gets the angle input component
     */
    public get angle(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the matrix output component
     */
    public get matrix(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        super._buildBlock(state);

        this.matrix._storedFunction = (state) => {
            return Matrix.RotationX(this.angle.getConnectedValue(state));
        };
    }
}

let _Registered = false;
/**
 * Register side effects for rotationXBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterRotationXBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass("BABYLON.RotationXBlock", RotationXBlock);
}

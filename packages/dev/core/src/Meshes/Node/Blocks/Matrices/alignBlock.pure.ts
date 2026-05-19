/** This file must only contain pure code and pure imports */

import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import { type NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { type NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { Matrix, Vector3 } from "../../../../Maths/math.vector.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * Block used to get a align matrix
 */
export class AlignBlock extends NodeGeometryBlock {
    /**
     * Create a new AlignBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("source", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Up());
        this.registerInput("target", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Left());
        this.registerOutput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "AlignBlock";
    }

    /**
     * Gets the source input component
     */
    public get source(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the target input component
     */
    public get target(): NodeGeometryConnectionPoint {
        return this._inputs[1];
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
            const source = (this.source.getConnectedValue(state) as Vector3).clone();
            const target = (this.target.getConnectedValue(state) as Vector3).clone();
            const result = new Matrix();

            source.normalize();
            target.normalize();

            Matrix.RotationAlignToRef(source, target, result, true);

            return result;
        };
    }
}

let _Registered = false;
/**
 * Register side effects for alignBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterAlignBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass("BABYLON.AlignBlock", AlignBlock);
}

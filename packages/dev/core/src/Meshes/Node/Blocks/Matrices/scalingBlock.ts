import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { Matrix, Vector3 } from "../../../../Maths/math.vector";

/**
 * Block used to get a scaling matrix
 */
export class ScalingBlock extends NodeGeometryBlock {
    /**
     * Create a new ScalingBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("scale", NodeGeometryBlockConnectionPointTypes.Vector3, false, Vector3.One());
        this.registerOutput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ScalingBlock";
    }

    /**
     * Gets the scale input component
     */
    public get scale(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the matrix output component
     */
    public get matrix(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    /** @internal */
    public override autoConfigure() {
        if (!this.scale.isConnected) {
            const scaleInput = new GeometryInputBlock("Scale");
            scaleInput.value = new Vector3(1, 1, 1);
            scaleInput.output.connectTo(this.scale);
        }
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        super._buildBlock(state);

        this.matrix._storedFunction = (state) => {
            const value = this.scale.getConnectedValue(state) as Vector3;
            return Matrix.Scaling(value.x, value.y, value.z);
        };
    }
}

RegisterClass("BABYLON.ScalingBlock", ScalingBlock);

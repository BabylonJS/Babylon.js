import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { Matrix } from "../../../../Maths/math.vector";

/**
 * Block used to get a rotation matrix on Y Axis
 */
export class RotationYBlock extends NodeGeometryBlock {
    /**
     * Create a new RotationYBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("angle", NodeGeometryBlockConnectionPointTypes.Float, false, 0);
        this.registerOutput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "RotationYBlock";
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

    public override autoConfigure() {
        if (!this.angle.isConnected) {
            const angleInput = new GeometryInputBlock("Angle");
            angleInput.value = 0;
            angleInput.output.connectTo(this.angle);
        }
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        super._buildBlock(state);

        this.matrix._storedFunction = (state) => {
            return Matrix.RotationY(this.angle.getConnectedValue(state));
        };
    }
}

import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import type { Matrix } from "core/Maths/math.vector";

/**
 * Block used to compose two matrices
 */
export class MatrixComposeBlock extends NodeGeometryBlock {
    /**
     * Create a new MatrixComposeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("matrix0", NodeGeometryBlockConnectionPointTypes.Matrix);
        this.registerInput("matrix1", NodeGeometryBlockConnectionPointTypes.Matrix);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "MatrixComposeBlock";
    }

    /**
     * Gets the matrix0 input component
     */
    public get matrix0(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the matrix1 input component
     */
    public get matrix1(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock() {
        this.output._storedFunction = (state: NodeGeometryBuildState) => {
            if (!this.matrix0.isConnected || !this.matrix1.isConnected) {
                return null;
            }

            const matrix0 = this.matrix0.getConnectedValue(state) as Matrix;
            const matrix1 = this.matrix1.getConnectedValue(state) as Matrix;

            if (!matrix0 || !matrix1) {
                return null;
            }
            return matrix0.multiply(matrix1);
        };
    }
}

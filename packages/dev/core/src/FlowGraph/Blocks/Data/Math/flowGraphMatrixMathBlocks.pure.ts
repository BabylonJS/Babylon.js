/** This file must only contain pure code and pure imports */

import { type IFlowGraphBlockConfiguration, FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import {
    FlowGraphTypes,
    getRichTypeByFlowGraphType,
    RichTypeBoolean,
    RichTypeMatrix,
    RichTypeNumber,
    RichTypeQuaternion,
    RichTypeVector3,
} from "core/FlowGraph/flowGraphRichTypes.pure";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import { FlowGraphCachedOperationBlock } from "../flowGraphCachedOperationBlock";
import { type FlowGraphMatrix2D } from "core/FlowGraph/CustomTypes/flowGraphMatrix";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { type FlowGraphMatrix } from "core/FlowGraph/utils";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * Threshold below which the determinant of the normalized 3x3 of a matrix is treated as zero, indicating a
 * degenerate (non-decomposable) matrix whose columns are linearly dependent.
 */
const MatrixDecomposeDegenerateEpsilon = 1e-6;

/**
 * Configuration for the matrix blocks.
 */
export interface IFlowGraphMatrixBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The type of the matrix. Default is Matrix (which is 4x4)
     */
    matrixType: FlowGraphTypes;
}
/**
 * Transposes a matrix.
 */
export class FlowGraphTransposeBlock extends FlowGraphUnaryOperationBlock<FlowGraphMatrix, FlowGraphMatrix> {
    /**
     * Creates a new instance of the block.
     * @param config the configuration of the block
     */
    constructor(config?: IFlowGraphMatrixBlockConfiguration) {
        super(
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            (a) => (a.transpose ? a.transpose() : Matrix.Transpose(a as Matrix)),
            FlowGraphBlockNames.Transpose,
            config
        );
    }
}

/**
 * Gets the determinant of a matrix.
 */
export class FlowGraphDeterminantBlock extends FlowGraphUnaryOperationBlock<FlowGraphMatrix, number> {
    /**
     * Creates a new instance of the block.
     * @param config the configuration of the block
     */
    constructor(config?: IFlowGraphMatrixBlockConfiguration) {
        super(getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix), RichTypeNumber, (a) => a.determinant(), FlowGraphBlockNames.Determinant, config);
    }
}

/**
 * Inverts a matrix.
 */
export class FlowGraphInvertMatrixBlock extends FlowGraphCachedOperationBlock<FlowGraphMatrix> {
    /**
     * The matrix to invert.
     */
    public readonly a: FlowGraphDataConnection<FlowGraphMatrix>;

    /**
     * Creates a new instance of the inverse block.
     * @param config the configuration of the block
     */
    constructor(config?: IFlowGraphMatrixBlockConfiguration) {
        super(getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix), config);
        this.a = this.registerDataInput("a", getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix));
    }

    public override _doOperation(context: FlowGraphContext): FlowGraphMatrix | undefined {
        const a = this.a.getValue(context);
        // Per the KHR_interactivity spec, math/inverse is only valid when the determinant is a finite, non-zero
        // number. For a zero, NaN, or infinite determinant the matrix is not invertible: returning undefined makes
        // the cached base report isValid = false.
        const determinant = a.determinant();
        if (determinant === 0 || !Number.isFinite(determinant)) {
            return undefined;
        }
        return (a as FlowGraphMatrix2D).inverse ? (a as FlowGraphMatrix2D).inverse() : Matrix.Invert(a as Matrix);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.InvertMatrix;
    }
}

/**
 * Multiplies two matrices.
 */
export class FlowGraphMatrixMultiplicationBlock extends FlowGraphBinaryOperationBlock<FlowGraphMatrix, FlowGraphMatrix, FlowGraphMatrix> {
    /**
     * Creates a new instance of the multiplication block.
     * Note - this is similar to the math multiplication if not using matrix per-component multiplication.
     * @param config the configuration of the block
     */
    constructor(config?: IFlowGraphMatrixBlockConfiguration) {
        super(
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            (a, b) => b.multiply(a as any),
            FlowGraphBlockNames.MatrixMultiplication,
            config
        );
    }
}

/**
 * Matrix decompose block
 */
export class FlowGraphMatrixDecomposeBlock extends FlowGraphBlock {
    /**
     * The input of this block
     */
    public readonly input: FlowGraphDataConnection<Matrix>;

    /**
     * The position output of this block
     */
    public readonly position: FlowGraphDataConnection<Vector3>;
    /**
     * The rotation output of this block
     */
    public readonly rotationQuaternion: FlowGraphDataConnection<Quaternion>;
    /**
     * The scaling output of this block
     */
    public readonly scaling: FlowGraphDataConnection<Vector3>;

    /**
     * Is the matrix valid
     */
    public readonly isValid: FlowGraphDataConnection<boolean>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.input = this.registerDataInput("input", RichTypeMatrix);
        this.position = this.registerDataOutput("position", RichTypeVector3);
        this.rotationQuaternion = this.registerDataOutput("rotationQuaternion", RichTypeQuaternion);
        this.scaling = this.registerDataOutput("scaling", RichTypeVector3);
        this.isValid = this.registerDataOutput("isValid", RichTypeBoolean, false);
    }

    public override _updateOutputs(context: FlowGraphContext) {
        const matrix = this.input.getValue(context);
        const m = matrix.m;

        // Per the KHR_interactivity matDecompose algorithm the fourth row of the matrix is ignored: the translation
        // comes from the first three elements of the fourth column, the scale from the lengths of the first three
        // columns of the upper-left 3x3, and the rotation from that 3x3 once normalized.
        const translationX = m[12];
        const translationY = m[13];
        const translationZ = m[14];
        let scaleX = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]);
        const scaleY = Math.sqrt(m[4] * m[4] + m[5] * m[5] + m[6] * m[6]);
        const scaleZ = Math.sqrt(m[8] * m[8] + m[9] * m[9] + m[10] * m[10]);

        const allFinite =
            Number.isFinite(translationX) &&
            Number.isFinite(translationY) &&
            Number.isFinite(translationZ) &&
            Number.isFinite(scaleX) &&
            Number.isFinite(scaleY) &&
            Number.isFinite(scaleZ);

        // A non-finite matrix (NaN/Infinity propagated from the input) is not decomposable: emit the type-default TRS.
        if (!allFinite) {
            this.isValid.setValue(false, context);
            this.position.setValue(Vector3.Zero(), context);
            this.rotationQuaternion.setValue(Quaternion.Identity(), context);
            this.scaling.setValue(Vector3.One(), context);
            return;
        }

        if (scaleX === 0 || scaleY === 0 || scaleZ === 0) {
            // A zero scale component leaves the rotation undefined and the matrix non-decomposable, but the
            // translation and (degenerate) scale are still well-defined, so they are reported as-is.
            this.isValid.setValue(false, context);
            this.position.setValue(new Vector3(translationX, translationY, translationZ), context);
            this.rotationQuaternion.setValue(Quaternion.Identity(), context);
            this.scaling.setValue(new Vector3(scaleX, scaleY, scaleZ), context);
            return;
        }

        // The determinant of the upper-left 3x3 (the fourth row is ignored) gives the handedness; dividing by the
        // product of the scales yields the determinant of the normalized 3x3, which is (close to) zero only when the
        // columns are linearly dependent — a degenerate matrix that cannot represent a rotation.
        const determinant = m[0] * (m[5] * m[10] - m[6] * m[9]) - m[4] * (m[1] * m[10] - m[2] * m[9]) + m[8] * (m[1] * m[6] - m[2] * m[5]);
        const normalizedDeterminant = determinant / (scaleX * scaleY * scaleZ);
        if (Math.abs(normalizedDeterminant) < MatrixDecomposeDegenerateEpsilon) {
            this.isValid.setValue(false, context);
            this.position.setValue(Vector3.Zero(), context);
            this.rotationQuaternion.setValue(Quaternion.Identity(), context);
            this.scaling.setValue(Vector3.One(), context);
            return;
        }

        // Negate the first scale component for a left-handed matrix so the rotation stays right-handed, mirroring
        // the normalized first column.
        if (determinant < 0) {
            scaleX = -scaleX;
        }
        const invScaleX = 1 / scaleX;
        const invScaleY = 1 / scaleY;
        const invScaleZ = 1 / scaleZ;
        const rotationMatrix = Matrix.FromValues(
            m[0] * invScaleX,
            m[1] * invScaleX,
            m[2] * invScaleX,
            0,
            m[4] * invScaleY,
            m[5] * invScaleY,
            m[6] * invScaleY,
            0,
            m[8] * invScaleZ,
            m[9] * invScaleZ,
            m[10] * invScaleZ,
            0,
            0,
            0,
            0,
            1
        );

        this.isValid.setValue(true, context);
        this.position.setValue(new Vector3(translationX, translationY, translationZ), context);
        this.rotationQuaternion.setValue(Quaternion.FromRotationMatrix(rotationMatrix), context);
        this.scaling.setValue(new Vector3(scaleX, scaleY, scaleZ), context);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.MatrixDecompose;
    }
}

/**
 * Matrix compose block
 */
export class FlowGraphMatrixComposeBlock extends FlowGraphBlock {
    /**
     * The position input of this block
     */
    public readonly position: FlowGraphDataConnection<Vector3>;
    /**
     * The rotation input of this block
     */
    public readonly rotationQuaternion: FlowGraphDataConnection<Quaternion>;
    /**
     * The scaling input of this block
     */
    public readonly scaling: FlowGraphDataConnection<Vector3>;
    /**
     * The output of this block
     */
    public readonly value: FlowGraphDataConnection<Matrix>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.position = this.registerDataInput("position", RichTypeVector3);
        this.rotationQuaternion = this.registerDataInput("rotationQuaternion", RichTypeQuaternion);
        this.scaling = this.registerDataInput("scaling", RichTypeVector3);
        this.value = this.registerDataOutput("value", RichTypeMatrix);
    }

    public override _updateOutputs(context: FlowGraphContext) {
        const cachedExecutionId = context._getExecutionVariable(this, "executionId", -1);
        const cachedMatrix = context._getExecutionVariable(this, "cachedMatrix", null);
        if (cachedExecutionId === context.executionId && cachedMatrix) {
            this.value.setValue(cachedMatrix, context);
        } else {
            const matrix = Matrix.Compose(this.scaling.getValue(context), this.rotationQuaternion.getValue(context), this.position.getValue(context));
            this.value.setValue(matrix, context);
            context._setExecutionVariable(this, "cachedMatrix", matrix);
            context._setExecutionVariable(this, "executionId", context.executionId);
        }
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.MatrixCompose;
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphMatrixMathBlocks.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphMatrixMathBlocks(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.Transpose, FlowGraphTransposeBlock);
    RegisterClass(FlowGraphBlockNames.Determinant, FlowGraphDeterminantBlock);
    RegisterClass(FlowGraphBlockNames.InvertMatrix, FlowGraphInvertMatrixBlock);
    RegisterClass(FlowGraphBlockNames.MatrixMultiplication, FlowGraphMatrixMultiplicationBlock);
    RegisterClass(FlowGraphBlockNames.MatrixDecompose, FlowGraphMatrixDecomposeBlock);
    RegisterClass(FlowGraphBlockNames.MatrixCompose, FlowGraphMatrixComposeBlock);
}

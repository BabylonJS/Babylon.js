import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import {
    FlowGraphTypes,
    getRichTypeByFlowGraphType,
    RichTypeBoolean,
    RichTypeMatrix,
    RichTypeNumber,
    RichTypeQuaternion,
    RichTypeVector3,
} from "core/FlowGraph/flowGraphRichTypes";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import type { FlowGraphMatrix2D } from "core/FlowGraph/CustomTypes/flowGraphMatrix";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import type { FlowGraphMatrix } from "core/FlowGraph/utils";

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
RegisterClass(FlowGraphBlockNames.Transpose, FlowGraphTransposeBlock);

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
RegisterClass(FlowGraphBlockNames.Determinant, FlowGraphDeterminantBlock);

/**
 * Inverts a matrix.
 */
export class FlowGraphInvertMatrixBlock extends FlowGraphUnaryOperationBlock<FlowGraphMatrix, FlowGraphMatrix> {
    /**
     * Creates a new instance of the inverse block.
     * @param config the configuration of the block
     */
    constructor(config?: IFlowGraphMatrixBlockConfiguration) {
        super(
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            (a) => ((a as FlowGraphMatrix2D).inverse ? (a as FlowGraphMatrix2D).inverse() : Matrix.Invert(a as Matrix)),
            FlowGraphBlockNames.InvertMatrix,
            config
        );
    }
}
RegisterClass(FlowGraphBlockNames.InvertMatrix, FlowGraphInvertMatrixBlock);

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
RegisterClass(FlowGraphBlockNames.MatrixMultiplication, FlowGraphMatrixMultiplicationBlock);

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
        const cachedExecutionId = context._getExecutionVariable(this, "executionId", -1);
        const cachedPosition = context._getExecutionVariable(this, "cachedPosition", null);
        const cachedRotation = context._getExecutionVariable(this, "cachedRotation", null);
        const cachedScaling = context._getExecutionVariable(this, "cachedScaling", null);
        if (cachedExecutionId === context.executionId && cachedPosition && cachedRotation && cachedScaling) {
            this.position.setValue(cachedPosition, context);
            this.rotationQuaternion.setValue(cachedRotation, context);
            this.scaling.setValue(cachedScaling, context);
        } else {
            const matrix = this.input.getValue(context);
            const position = cachedPosition || new Vector3();
            const rotation = cachedRotation || new Quaternion();
            const scaling = cachedScaling || new Vector3();
            // check matrix last column components should be 0,0,0,1
            // round them to 4 decimal places
            const m3 = Math.round(matrix.m[3] * 10000) / 10000;
            const m7 = Math.round(matrix.m[7] * 10000) / 10000;
            const m11 = Math.round(matrix.m[11] * 10000) / 10000;
            const m15 = Math.round(matrix.m[15] * 10000) / 10000;
            if (m3 !== 0 || m7 !== 0 || m11 !== 0 || m15 !== 1) {
                this.isValid.setValue(false, context);
                this.position.setValue(Vector3.Zero(), context);
                this.rotationQuaternion.setValue(Quaternion.Identity(), context);
                this.scaling.setValue(Vector3.One(), context);
                return;
            }
            // make the checks for validity
            const valid = matrix.decompose(scaling, rotation, position);
            this.isValid.setValue(valid, context);
            this.position.setValue(position, context);
            this.rotationQuaternion.setValue(rotation, context);
            this.scaling.setValue(scaling, context);
            context._setExecutionVariable(this, "cachedPosition", position);
            context._setExecutionVariable(this, "cachedRotation", rotation);
            context._setExecutionVariable(this, "cachedScaling", scaling);
            context._setExecutionVariable(this, "executionId", context.executionId);
        }
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.MatrixDecompose;
    }
}

RegisterClass(FlowGraphBlockNames.MatrixDecompose, FlowGraphMatrixDecomposeBlock);

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

RegisterClass(FlowGraphBlockNames.MatrixCompose, FlowGraphMatrixComposeBlock);

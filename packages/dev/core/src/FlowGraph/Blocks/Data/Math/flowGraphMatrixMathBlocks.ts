import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeMatrix, RichTypeQuaternion, RichTypeVector3 } from "core/FlowGraph/flowGraphRichTypes";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

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

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.input = this.registerDataInput("input", RichTypeMatrix);
        this.position = this.registerDataOutput("position", RichTypeVector3);
        this.rotationQuaternion = this.registerDataOutput("rotationQuaternion", RichTypeQuaternion);
        this.scaling = this.registerDataOutput("scaling", RichTypeVector3);
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
            matrix.decompose(scaling, rotation, position);
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
    public readonly output: FlowGraphDataConnection<Matrix>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.position = this.registerDataInput("position", RichTypeVector3);
        this.rotationQuaternion = this.registerDataInput("rotationQuaternion", RichTypeQuaternion);
        this.scaling = this.registerDataInput("scaling", RichTypeVector3);
        this.output = this.registerDataOutput("output", RichTypeMatrix);
    }

    public override _updateOutputs(context: FlowGraphContext) {
        const cachedExecutionId = context._getExecutionVariable(this, "executionId", -1);
        const cachedMatrix = context._getExecutionVariable(this, "cachedMatrix", null);
        if (cachedExecutionId === context.executionId && cachedMatrix) {
            this.output.setValue(cachedMatrix, context);
        } else {
            const matrix = Matrix.Compose(this.scaling.getValue(context), this.rotationQuaternion.getValue(context), this.position.getValue(context));
            this.output.setValue(matrix, context);
            context._setExecutionVariable(this, "cachedMatrix", matrix);
            context._setExecutionVariable(this, "executionId", context.executionId);
        }
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.MatrixCompose;
    }
}

RegisterClass(FlowGraphBlockNames.MatrixCompose, FlowGraphMatrixComposeBlock);

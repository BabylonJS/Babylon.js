import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { FlowGraphCachedOperationBlock } from "../flowGraphCachedOperationBlock";
import {
    RichTypeMatrix,
    RichTypeMatrix2D,
    RichTypeMatrix3D,
    RichTypeNumber,
    RichTypeVector2,
    RichTypeVector3,
    RichTypeVector4,
    type RichType,
} from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { Matrix, Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import type { Nullable } from "core/types";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphMatrix2D, FlowGraphMatrix3D } from "core/FlowGraph/CustomTypes/flowGraphMatrix";

abstract class FlowGraphMathCombineBlock<ResultT> extends FlowGraphCachedOperationBlock<ResultT> {
    /**
     * Base class for blocks that combine multiple numeric inputs into a single result.
     * Handles registering data inputs and managing cached outputs.
     * @param numberOfInputs The number of input values to combine.
     * @param type The type of the result.
     * @param config The block configuration.
     */
    constructor(numberOfInputs: number, type: RichType<ResultT>, config?: IFlowGraphBlockConfiguration) {
        super(type, config);
        for (let i = 0; i < numberOfInputs; i++) {
            this.registerDataInput(`input_${i}`, RichTypeNumber, 0);
        }
    }
}

/**
 * Abstract class representing a flow graph block that extracts multiple outputs from a single input.
 */
abstract class FlowGraphMathExtractBlock<InputT> extends FlowGraphBlock {
    /**
     * Creates an instance of FlowGraphMathExtractBlock.
     *
     * @param numberOfOutputs - The number of outputs to be extracted from the input.
     * @param type - The type of the input data.
     * @param config - Optional configuration for the flow graph block.
     */
    constructor(numberOfOutputs: number, type: RichType<InputT>, config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.registerDataInput("input", type);
        for (let i = 0; i < numberOfOutputs; i++) {
            this.registerDataOutput(`output_${i}`, RichTypeNumber, 0);
        }
    }
}
/**
 * Combines two floats into a new Vector2
 */
export class FlowGraphCombineVector2Block extends FlowGraphMathCombineBlock<Vector2> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(2, RichTypeVector2, config);
    }

    /**
     * @internal
     * Combines two floats into a new Vector2
     */
    public override _doOperation(context: FlowGraphContext): Vector2 {
        if (!context._hasExecutionVariable(this, "cachedVector")) {
            context._setExecutionVariable(this, "cachedVector", new Vector2());
        }
        const vector = context._getExecutionVariable<Nullable<Vector2>>(this, "cachedVector", null) as Vector2;
        vector.set(this.getDataInput("input_0")!.getValue(context), this.getDataInput("input_1")!.getValue(context));
        return vector;
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.CombineVector2;
    }
}

RegisterClass(FlowGraphBlockNames.CombineVector2, FlowGraphCombineVector2Block);

/**
 * Combines three floats into a new Vector3
 */
export class FlowGraphCombineVector3Block extends FlowGraphMathCombineBlock<Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(3, RichTypeVector3, config);
    }

    public override _doOperation(context: FlowGraphContext): Vector3 {
        if (!context._hasExecutionVariable(this, "cachedVector")) {
            context._setExecutionVariable(this, "cachedVector", new Vector3());
        }
        const vector = context._getExecutionVariable<Nullable<Vector3>>(this, "cachedVector", null) as Vector3;
        vector.set(this.getDataInput("input_0")!.getValue(context), this.getDataInput("input_1")!.getValue(context), this.getDataInput("input_2")!.getValue(context));
        return vector;
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.CombineVector3;
    }
}

RegisterClass(FlowGraphBlockNames.CombineVector3, FlowGraphCombineVector3Block);

/**
 * Combines four floats into a new Vector4
 */
export class FlowGraphCombineVector4Block extends FlowGraphMathCombineBlock<Vector4> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(4, RichTypeVector4, config);
    }

    public override _doOperation(context: FlowGraphContext): Vector4 {
        if (!context._hasExecutionVariable(this, "cachedVector")) {
            context._setExecutionVariable(this, "cachedVector", new Vector4());
        }
        const vector = context._getExecutionVariable<Nullable<Vector4>>(this, "cachedVector", null) as Vector4;
        vector.set(
            this.getDataInput("input_0")!.getValue(context),
            this.getDataInput("input_1")!.getValue(context),
            this.getDataInput("input_2")!.getValue(context),
            this.getDataInput("input_3")!.getValue(context)
        );
        return vector;
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.CombineVector4;
    }
}

RegisterClass(FlowGraphBlockNames.CombineVector4, FlowGraphCombineVector4Block);

/**
 * Configuration for the matrix combine blocks.
 */
export interface IFlowGraphCombineMatrixBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * Whether the input is in column-major order. Default is false.
     * Note - Babylon's matrix is the same as WebGL's. So unless your matrix requires transformation, you should leave this as false.
     */
    inputIsColumnMajor?: boolean;
}

/**
 * Combines 16 floats into a new Matrix
 *
 * Note that glTF interactivity's combine4x4 uses column-major order, while Babylon.js uses row-major order.
 */
export class FlowGraphCombineMatrixBlock extends FlowGraphMathCombineBlock<Matrix> {
    constructor(config?: IFlowGraphCombineMatrixBlockConfiguration) {
        super(16, RichTypeMatrix, config);
    }

    public override _doOperation(context: FlowGraphContext): Matrix {
        if (!context._hasExecutionVariable(this, "cachedMatrix")) {
            context._setExecutionVariable(this, "cachedMatrix", new Matrix());
        }
        const matrix = context._getExecutionVariable<Nullable<Matrix>>(this, "cachedMatrix", null) as Matrix;
        if (this.config?.inputIsColumnMajor) {
            matrix.set(
                this.getDataInput("input_0")!.getValue(context),
                this.getDataInput("input_4")!.getValue(context),
                this.getDataInput("input_8")!.getValue(context),
                this.getDataInput("input_12")!.getValue(context),
                this.getDataInput("input_1")!.getValue(context),
                this.getDataInput("input_5")!.getValue(context),
                this.getDataInput("input_9")!.getValue(context),
                this.getDataInput("input_13")!.getValue(context),
                this.getDataInput("input_2")!.getValue(context),
                this.getDataInput("input_6")!.getValue(context),
                this.getDataInput("input_10")!.getValue(context),
                this.getDataInput("input_14")!.getValue(context),
                this.getDataInput("input_3")!.getValue(context),
                this.getDataInput("input_7")!.getValue(context),
                this.getDataInput("input_11")!.getValue(context),
                this.getDataInput("input_15")!.getValue(context)
            );
        } else {
            matrix.set(
                this.getDataInput("input_0")!.getValue(context),
                this.getDataInput("input_1")!.getValue(context),
                this.getDataInput("input_2")!.getValue(context),
                this.getDataInput("input_3")!.getValue(context),
                this.getDataInput("input_4")!.getValue(context),
                this.getDataInput("input_5")!.getValue(context),
                this.getDataInput("input_6")!.getValue(context),
                this.getDataInput("input_7")!.getValue(context),
                this.getDataInput("input_8")!.getValue(context),
                this.getDataInput("input_9")!.getValue(context),
                this.getDataInput("input_10")!.getValue(context),
                this.getDataInput("input_11")!.getValue(context),
                this.getDataInput("input_12")!.getValue(context),
                this.getDataInput("input_13")!.getValue(context),
                this.getDataInput("input_14")!.getValue(context),
                this.getDataInput("input_15")!.getValue(context)
            );
        }
        return matrix;
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.CombineMatrix;
    }
}

RegisterClass(FlowGraphBlockNames.CombineMatrix, FlowGraphCombineMatrixBlock);

/**
 * Combines 4 floats into a new Matrix
 */
export class FlowGraphCombineMatrix2DBlock extends FlowGraphMathCombineBlock<FlowGraphMatrix2D> {
    constructor(config?: IFlowGraphCombineMatrixBlockConfiguration) {
        super(4, RichTypeMatrix2D, config);
    }

    public override _doOperation(context: FlowGraphContext): FlowGraphMatrix2D {
        if (!context._hasExecutionVariable(this, "cachedMatrix")) {
            context._setExecutionVariable(this, "cachedMatrix", new FlowGraphMatrix2D());
        }
        const matrix = context._getExecutionVariable<Nullable<FlowGraphMatrix2D>>(this, "cachedMatrix", null) as FlowGraphMatrix2D;
        const array = this.config?.inputIsColumnMajor
            ? [
                  // column to row-major
                  this.getDataInput("input_0")!.getValue(context),
                  this.getDataInput("input_2")!.getValue(context),
                  this.getDataInput("input_1")!.getValue(context),
                  this.getDataInput("input_3")!.getValue(context),
              ]
            : [
                  this.getDataInput("input_0")!.getValue(context),
                  this.getDataInput("input_1")!.getValue(context),
                  this.getDataInput("input_2")!.getValue(context),
                  this.getDataInput("input_3")!.getValue(context),
              ];
        matrix.fromArray(array);
        return matrix;
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.CombineMatrix2D;
    }
}

RegisterClass(FlowGraphBlockNames.CombineMatrix2D, FlowGraphCombineMatrix2DBlock);

/**
 * Combines 9 floats into a new Matrix3D
 */
export class FlowGraphCombineMatrix3DBlock extends FlowGraphMathCombineBlock<FlowGraphMatrix3D> {
    constructor(config?: IFlowGraphCombineMatrixBlockConfiguration) {
        super(9, RichTypeMatrix3D, config);
    }

    public override _doOperation(context: FlowGraphContext): FlowGraphMatrix3D {
        if (!context._hasExecutionVariable(this, "cachedMatrix")) {
            context._setExecutionVariable(this, "cachedMatrix", new FlowGraphMatrix3D());
        }
        const matrix = context._getExecutionVariable<Nullable<FlowGraphMatrix3D>>(this, "cachedMatrix", null) as FlowGraphMatrix3D;
        const array = this.config?.inputIsColumnMajor
            ? [
                  // column to row major
                  this.getDataInput("input_0")!.getValue(context),
                  this.getDataInput("input_3")!.getValue(context),
                  this.getDataInput("input_6")!.getValue(context),
                  this.getDataInput("input_1")!.getValue(context),
                  this.getDataInput("input_4")!.getValue(context),
                  this.getDataInput("input_7")!.getValue(context),
                  this.getDataInput("input_2")!.getValue(context),
                  this.getDataInput("input_5")!.getValue(context),
                  this.getDataInput("input_8")!.getValue(context),
              ]
            : [
                  this.getDataInput("input_0")!.getValue(context),
                  this.getDataInput("input_1")!.getValue(context),
                  this.getDataInput("input_2")!.getValue(context),
                  this.getDataInput("input_3")!.getValue(context),
                  this.getDataInput("input_4")!.getValue(context),
                  this.getDataInput("input_5")!.getValue(context),
                  this.getDataInput("input_6")!.getValue(context),
                  this.getDataInput("input_7")!.getValue(context),
                  this.getDataInput("input_8")!.getValue(context),
              ];
        matrix.fromArray(array);
        return matrix;
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.CombineMatrix3D;
    }
}

RegisterClass(FlowGraphBlockNames.CombineMatrix3D, FlowGraphCombineMatrix3DBlock);

/**
 * Extracts two floats from a Vector2
 */
export class FlowGraphExtractVector2Block extends FlowGraphMathExtractBlock<Vector2> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(2, RichTypeVector2, config);
    }

    public override _updateOutputs(context: FlowGraphContext): void {
        let input = this.getDataInput("input")?.getValue(context) as Vector2;
        if (!input) {
            input = Vector2.Zero();
            this.getDataInput("input")!.setValue(input, context);
        }
        this.getDataOutput("output_0")!.setValue(input.x, context);
        this.getDataOutput("output_1")!.setValue(input.y, context);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.ExtractVector2;
    }
}

RegisterClass(FlowGraphBlockNames.ExtractVector2, FlowGraphExtractVector2Block);

/**
 * Extracts three floats from a Vector3
 */
export class FlowGraphExtractVector3Block extends FlowGraphMathExtractBlock<Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(3, RichTypeVector3, config);
    }
    public override _updateOutputs(context: FlowGraphContext): void {
        let input = this.getDataInput("input")?.getValue(context) as Vector3;
        if (!input) {
            input = Vector3.Zero();
            this.getDataInput("input")!.setValue(input, context);
        }
        this.getDataOutput("output_0")!.setValue(input.x, context);
        this.getDataOutput("output_1")!.setValue(input.y, context);
        this.getDataOutput("output_2")!.setValue(input.z, context);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.ExtractVector3;
    }
}

RegisterClass(FlowGraphBlockNames.ExtractVector3, FlowGraphExtractVector3Block);

/**
 * Extracts four floats from a Vector4
 */
export class FlowGraphExtractVector4Block extends FlowGraphMathExtractBlock<Vector4> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(4, RichTypeVector4, config);
    }
    public override _updateOutputs(context: FlowGraphContext): void {
        let input = this.getDataInput("input")?.getValue(context) as Vector4;
        if (!input) {
            input = Vector4.Zero();
            this.getDataInput("input")!.setValue(input, context);
        }
        this.getDataOutput("output_0")!.setValue(input.x, context);
        this.getDataOutput("output_1")!.setValue(input.y, context);
        this.getDataOutput("output_2")!.setValue(input.z, context);
        this.getDataOutput("output_3")!.setValue(input.w, context);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.ExtractVector4;
    }
}

RegisterClass(FlowGraphBlockNames.ExtractVector4, FlowGraphExtractVector4Block);

/**
 * Extracts 16 floats from a Matrix
 */
export class FlowGraphExtractMatrixBlock extends FlowGraphMathExtractBlock<Matrix> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(16, RichTypeMatrix, config);
    }
    public override _updateOutputs(context: FlowGraphContext): void {
        let input = this.getDataInput("input")?.getValue(context) as Matrix;
        if (!input) {
            input = Matrix.Identity();
            this.getDataInput("input")!.setValue(input, context);
        }
        for (let i = 0; i < 16; i++) {
            this.getDataOutput(`output_${i}`)!.setValue(input.m[i], context);
        }
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.ExtractMatrix;
    }
}

RegisterClass(FlowGraphBlockNames.ExtractMatrix, FlowGraphExtractMatrixBlock);

/**
 * Extracts 4 floats from a Matrix2D
 */
export class FlowGraphExtractMatrix2DBlock extends FlowGraphMathExtractBlock<FlowGraphMatrix2D> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(4, RichTypeMatrix2D, config);
    }
    public override _updateOutputs(context: FlowGraphContext): void {
        let input = this.getDataInput("input")?.getValue(context) as FlowGraphMatrix2D;
        if (!input) {
            input = new FlowGraphMatrix2D();
            this.getDataInput("input")!.setValue(input, context);
        }
        for (let i = 0; i < 4; i++) {
            this.getDataOutput(`output_${i}`)!.setValue(input.m[i], context);
        }
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.ExtractMatrix2D;
    }
}

RegisterClass(FlowGraphBlockNames.ExtractMatrix2D, FlowGraphExtractMatrix2DBlock);

/**
 * Extracts 4 floats from a Matrix2D
 */
export class FlowGraphExtractMatrix3DBlock extends FlowGraphMathExtractBlock<FlowGraphMatrix3D> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(9, RichTypeMatrix3D, config);
    }
    public override _updateOutputs(context: FlowGraphContext): void {
        let input = this.getDataInput("input")?.getValue(context) as FlowGraphMatrix3D;
        if (!input) {
            input = new FlowGraphMatrix3D();
            this.getDataInput("input")!.setValue(input, context);
        }
        for (let i = 0; i < 9; i++) {
            this.getDataOutput(`output_${i}`)!.setValue(input.m[i], context);
        }
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.ExtractMatrix3D;
    }
}

RegisterClass(FlowGraphBlockNames.ExtractMatrix3D, FlowGraphExtractMatrix3DBlock);

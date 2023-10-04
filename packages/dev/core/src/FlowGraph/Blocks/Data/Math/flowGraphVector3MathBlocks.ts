import { RichTypeMatrix, RichTypeNumber, RichTypeVector3 } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import type { Matrix } from "../../../../Maths/math.vector";
import { Quaternion, Vector3 } from "../../../../Maths/math.vector";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";

/**
 * Add two vectors together.
 * @experimental
 */
export class FlowGraphAddVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphAddVector3Block" }) {
        super(config, RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => left.add(right), "FlowGraphAddVector3Block");
    }
}
RegisterClass("FlowGraphAddVector3Block", FlowGraphAddVector3Block);

/**
 * Subtract two vectors.
 * @experimental
 */
export class FlowGraphSubtractVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphSubtractVector3Block" }) {
        super(config, RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => left.subtract(right), "FlowGraphSubtractVector3Block");
    }
}
RegisterClass("FlowGraphSubtractVector3Block", FlowGraphSubtractVector3Block);

/**
 * Multiply two vectors together.
 * @experimental
 */
export class FlowGraphMultiplyVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphMultiplyVector3Block" }) {
        super(config, RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => left.multiply(right), "FlowGraphMultiplyVector3Block");
    }
}
RegisterClass("FlowGraphMultiplyVector3Block", FlowGraphMultiplyVector3Block);
/**
 * Divide two vectors.
 * @experimental
 */
export class FlowGraphDivideVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphDivideVector3Block" }) {
        super(config, RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => left.divide(right), "FlowGraphDivideVector3Block");
    }
}
RegisterClass("FlowGraphDivideVector3Block", FlowGraphDivideVector3Block);
/**
 * Scale a vector by a number.
 * @experimental
 */
export class FlowGraphScaleVector3Block extends FlowGraphBinaryOperationBlock<Vector3, number, Vector3> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphScaleVector3Block" }) {
        super(config, RichTypeVector3, RichTypeNumber, RichTypeVector3, (left, right) => left.scale(right), "FlowGraphScaleVector3Block");
    }
}
RegisterClass("FlowGraphScaleVector3Block", FlowGraphScaleVector3Block);
/**
 * Get the length of a vector.
 * @experimental
 */
export class FlowGraphLengthVector3Block extends FlowGraphUnaryOperationBlock<Vector3, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphLengthVector3Block" }) {
        super(config, RichTypeVector3, RichTypeNumber, (value) => value.length(), "FlowGraphLengthVector3Block");
    }
}
RegisterClass("FlowGraphLengthVector3Block", FlowGraphLengthVector3Block);
/**
 * Normalize a vector.
 * @experimental
 */
export class FlowGraphNormalizeVector3Block extends FlowGraphUnaryOperationBlock<Vector3, Vector3> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphNormalizeVector3Block" }) {
        super(config, RichTypeVector3, RichTypeVector3, (value) => value.normalizeToNew(), "FlowGraphNormalizeVector3Block");
    }
}
RegisterClass("FlowGraphNormalizeVector3Block", FlowGraphNormalizeVector3Block);

/**
 * Get the dot product of two vectors.
 * @experimental
 */
export class FlowGraphDotVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphDotVector3Block" }) {
        super(config, RichTypeVector3, RichTypeVector3, RichTypeNumber, (left, right) => Vector3.Dot(left, right), "FlowGraphDotVector3Block");
    }
}
RegisterClass("FlowGraphDotVector3Block", FlowGraphDotVector3Block);
/**
 * Get the cross product of two vectors.
 * @experimental
 */
export class FlowGraphCrossVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphCrossVector3Block" }) {
        super(config, RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => Vector3.Cross(left, right), "FlowGraphCrossVector3Block");
    }
}
RegisterClass("FlowGraphCrossVector3Block", FlowGraphCrossVector3Block);

/**
 * Create a vector from its components.
 * @experimental
 */
export class FlowGraphCreateVector3Block extends FlowGraphBlock {
    /**
     * Input connection: The x component of the vector.
     */
    public readonly x: FlowGraphDataConnection<number>;
    /**
     * Input connection: The y component of the vector.
     */
    public readonly y: FlowGraphDataConnection<number>;
    /**
     * Input connection: The z component of the vector.
     */
    public readonly z: FlowGraphDataConnection<number>;
    /**
     * Output connection: The created vector.
     */
    public readonly vector: FlowGraphDataConnection<Vector3>;

    private _cachedVector: Vector3 = Vector3.Zero();

    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphCreateVector3Block" }) {
        super(config);

        this.x = this._registerDataInput("x", RichTypeNumber);
        this.y = this._registerDataInput("y", RichTypeNumber);
        this.z = this._registerDataInput("y", RichTypeNumber);
        this.vector = this._registerDataOutput("vector", RichTypeVector3);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        this._cachedVector.x = this.x.getValue(_context);
        this._cachedVector.y = this.y.getValue(_context);
        this._cachedVector.z = this.z.getValue(_context);
        this.vector.setValue(this._cachedVector, _context);
    }

    public getClassName(): string {
        return "FlowGraphCreateVector3Block";
    }
}
RegisterClass("FlowGraphCreateVector3Block", FlowGraphCreateVector3Block);

/**
 * Split a vector into its components.
 * @experimental
 */
export class FlowGraphSplitVector3Block extends FlowGraphBlock {
    /**
     * Input connection: The vector to split.
     */
    public readonly vector: FlowGraphDataConnection<Vector3>;
    /**
     * Output connection: The x component of the vector.
     */
    public readonly x: FlowGraphDataConnection<number>;
    /**
     * Output connection: The y component of the vector.
     */
    public readonly y: FlowGraphDataConnection<number>;
    /**
     * Input connection: The z component of the vector.
     */
    public readonly z: FlowGraphDataConnection<number>;

    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphSplitVector3Block" }) {
        super(config);

        this.vector = this._registerDataInput("vector", RichTypeVector3);
        this.x = this._registerDataOutput("x", RichTypeNumber);
        this.y = this._registerDataOutput("y", RichTypeNumber);
        this.z = this._registerDataOutput("z", RichTypeNumber);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        const vector = this.vector.getValue(_context);
        this.x.setValue(vector.x, _context);
        this.y.setValue(vector.y, _context);
        this.z.setValue(vector.z, _context);
    }

    public getClassName(): string {
        return "FlowGraphSplitVector3Block";
    }
}
RegisterClass("FlowGraphSplitVector3Block", FlowGraphSplitVector3Block);

/**
 * Rotates a vector by a given angle.
 */
export class FlowGraphRotate3dVector3Block extends FlowGraphBlock {
    /**
     * Input connection: The vector to rotate.
     */
    public readonly input: FlowGraphDataConnection<Vector3>;
    /**
     * Input connection: The axis to rotate around.
     */
    public readonly axis: FlowGraphDataConnection<Vector3>;
    /**
     * Input connection: The angle to rotate by.
     */
    public readonly angle: FlowGraphDataConnection<number>;
    /**
     * Output connection: The rotated vector.
     */
    public readonly output: FlowGraphDataConnection<Vector3>;

    private _cachedQuaternion = new Quaternion();

    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphRotate3dVector3Block" }) {
        super(config);
        this.input = this._registerDataInput("input", RichTypeVector3);
        this.angle = this._registerDataInput("angle", RichTypeNumber);
        this.output = this._registerDataOutput("output", RichTypeVector3);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        const rot = Quaternion.RotationAxisToRef(this.axis.getValue(_context), this.angle.getValue(_context), this._cachedQuaternion);
        const input = this.input.getValue(_context);
        const output = this.output.getValue(_context);
        input.applyRotationQuaternionToRef(rot, output);
    }

    public getClassName(): string {
        return "FlowGraphRotate3dVector3Block";
    }
}
RegisterClass("FlowGraphRotate3dVector3Block", FlowGraphRotate3dVector3Block);

/**
 * Transforms a vector by a given matrix.
 * @experimental
 */
export class FlowGraphTransformVector3Block extends FlowGraphBinaryOperationBlock<Matrix, Vector3, Vector3> {
    private _cachedResult: Vector3 = Vector3.Zero();
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphTransformVector3Block" }) {
        super(
            config,
            RichTypeMatrix,
            RichTypeVector3,
            RichTypeVector3,
            (left, right) => Vector3.TransformCoordinatesToRef(right, left, this._cachedResult),
            "FlowGraphTransformVector3Block"
        );
    }
}
RegisterClass("FlowGraphTransformVector3Block", FlowGraphTransformVector3Block);

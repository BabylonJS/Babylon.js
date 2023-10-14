import { RichTypeMatrix, RichTypeNumber, RichTypeVector3 } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import type { Matrix } from "../../../../Maths/math.vector";
import { Quaternion, Vector3 } from "../../../../Maths/math.vector";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";

const ADDNAME = "FGAddVector3Block";
/**
 * Add two vectors together.
 * @experimental
 */
export class FlowGraphAddVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => left.add(right), ADDNAME, config);
    }
}
RegisterClass(ADDNAME, FlowGraphAddVector3Block);

const SUBNAME = "FGSubtractVector3Block";
/**
 * Subtract two vectors.
 * @experimental
 */
export class FlowGraphSubtractVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => left.subtract(right), SUBNAME, config);
    }
}
RegisterClass(SUBNAME, FlowGraphSubtractVector3Block);

const MULNAME = "FGMultiplyVector3Block";
/**
 * Multiply two vectors together.
 * @experimental
 */
export class FlowGraphMultiplyVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => left.multiply(right), MULNAME, config);
    }
}
RegisterClass(MULNAME, FlowGraphMultiplyVector3Block);

const DIVNAME = "FGDivideVector3Block";
/**
 * Divide two vectors.
 * @experimental
 */
export class FlowGraphDivideVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => left.divide(right), DIVNAME, config);
    }
}
RegisterClass(DIVNAME, FlowGraphDivideVector3Block);

const SCALNAME = "FGScaleVector3Block";
/**
 * Scale a vector by a number.
 * @experimental
 */
export class FlowGraphScaleVector3Block extends FlowGraphBinaryOperationBlock<Vector3, number, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeNumber, RichTypeVector3, (left, right) => left.scale(right), SCALNAME, config);
    }
}
RegisterClass(SCALNAME, FlowGraphScaleVector3Block);

const LENNAME = "FGLengthVector3Block";
/**
 * Get the length of a vector.
 * @experimental
 */
export class FlowGraphLengthVector3Block extends FlowGraphUnaryOperationBlock<Vector3, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeNumber, (value) => value.length(), LENNAME, config);
    }
}
RegisterClass(LENNAME, FlowGraphLengthVector3Block);

const NORMNAME = "FGNormalizeVector3Block";
/**
 * Normalize a vector.
 * @experimental
 */
export class FlowGraphNormalizeVector3Block extends FlowGraphUnaryOperationBlock<Vector3, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, (value) => value.normalizeToNew(), NORMNAME, config);
    }
}
RegisterClass(NORMNAME, FlowGraphNormalizeVector3Block);

const DOTNAME = "FGDotVector3Block";
/**
 * Get the dot product of two vectors.
 * @experimental
 */
export class FlowGraphDotVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeNumber, (left, right) => Vector3.Dot(left, right), DOTNAME, config);
    }
}
RegisterClass(DOTNAME, FlowGraphDotVector3Block);

const CROSSNAME = "FGCrossVector3Block";
/**
 * Get the cross product of two vectors.
 * @experimental
 */
export class FlowGraphCrossVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => Vector3.Cross(left, right), CROSSNAME, config);
    }
}
RegisterClass(CROSSNAME, FlowGraphCrossVector3Block);

const CREATENAME = "FGCreateVector3Block";
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

    constructor(config?: IFlowGraphBlockConfiguration) {
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
        return CREATENAME;
    }
}
RegisterClass(CREATENAME, FlowGraphCreateVector3Block);

const SPLITNAME = "FGSplitVector3Block";
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

    constructor(config?: IFlowGraphBlockConfiguration) {
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
        return SPLITNAME;
    }
}
RegisterClass(SPLITNAME, FlowGraphSplitVector3Block);

const ROTATENAME = "FGRotateVector3Block";
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

    constructor(config?: IFlowGraphBlockConfiguration) {
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
        return ROTATENAME;
    }
}
RegisterClass(ROTATENAME, FlowGraphRotate3dVector3Block);

const TRANSFORMNAME = "FGTransformVector3Block";
/**
 * Transforms a vector by a given matrix.
 * @experimental
 */
export class FlowGraphTransformVector3Block extends FlowGraphBinaryOperationBlock<Matrix, Vector3, Vector3> {
    private _cachedResult: Vector3 = Vector3.Zero();
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeMatrix, RichTypeVector3, RichTypeVector3, (left, right) => Vector3.TransformCoordinatesToRef(right, left, this._cachedResult), TRANSFORMNAME, config);
    }
}
RegisterClass(TRANSFORMNAME, FlowGraphTransformVector3Block);

import { RichTypeNumber, RichTypeVector3 } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { Quaternion, Vector3 } from "../../../../Maths/math.vector";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import { FlowGraphBlock } from "../../../flowGraphBlock";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";

/**
 * Add two vectors together.
 * @experimental
 */
export class FlowGraphAddVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor() {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => left.add(right));
    }
}

/**
 * Subtract two vectors.
 * @experimental
 */
export class FlowGraphSubtractVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor() {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => left.subtract(right));
    }
}

/**
 * Multiply two vectors together.
 * @experimental
 */
export class FlowGraphMultiplyVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor() {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => left.multiply(right));
    }
}

/**
 * Divide two vectors.
 * @experimental
 */
export class FlowGraphDivideVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor() {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => left.divide(right));
    }
}

/**
 * Scale a vector by a number.
 * @experimental
 */
export class FlowGraphScaleVector3Block extends FlowGraphBinaryOperationBlock<Vector3, number, Vector3> {
    constructor() {
        super(RichTypeVector3, RichTypeNumber, RichTypeVector3, (left, right) => left.scale(right));
    }
}

/**
 * Get the length of a vector.
 * @experimental
 */
export class FlowGraphLengthVector3Block extends FlowGraphUnaryOperationBlock<Vector3, number> {
    constructor() {
        super(RichTypeVector3, RichTypeNumber, (value) => value.length());
    }
}

/**
 * Normalize a vector.
 * @experimental
 */
export class FlowGraphNormalizeVector3Block extends FlowGraphUnaryOperationBlock<Vector3, Vector3> {
    constructor() {
        super(RichTypeVector3, RichTypeVector3, (value) => value.normalizeToNew());
    }
}

/**
 * Get the dot product of two vectors.
 * @experimental
 */
export class FlowGraphDotVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, number> {
    constructor() {
        super(RichTypeVector3, RichTypeVector3, RichTypeNumber, (left, right) => Vector3.Dot(left, right));
    }
}

/**
 * Get the cross product of two vectors.
 * @experimental
 */
export class FlowGraphCrossVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor() {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => Vector3.Cross(left, right));
    }
}

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

    constructor() {
        super();

        this.x = this._registerDataInput("x", RichTypeNumber);
        this.y = this._registerDataInput("y", RichTypeNumber);
        this.z = this._registerDataInput("y", RichTypeNumber);
        this.vector = this._registerDataOutput("vector", RichTypeVector3);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        const x = this.x.getValue(_context);
        const y = this.y.getValue(_context);
        const z = this.z.getValue(_context);
        this.vector.setValue(new Vector3(x, y, z), _context);
    }
}

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

    constructor() {
        super();

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
}

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

    constructor() {
        super();
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
}

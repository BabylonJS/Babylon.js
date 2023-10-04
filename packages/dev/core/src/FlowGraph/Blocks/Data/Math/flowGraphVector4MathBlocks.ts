import { RichTypeNumber, RichTypeVector4 } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { Vector4 } from "../../../../Maths/math.vector";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import { FlowGraphBlock } from "../../../flowGraphBlock";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";

/**
 * Add two vectors together.
 * @experimental
 */
export class FlowGraphAddVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor() {
        super(RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.add(right));
    }
}

/**
 * Subtract two vectors.
 * @experimental
 */
export class FlowGraphSubtractVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor() {
        super(RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.subtract(right));
    }
}

/**
 * Multiply two vectors together.
 * @experimental
 */
export class FlowGraphMultiplyVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor() {
        super(RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.multiply(right));
    }
}

/**
 * Divide two vectors.
 * @experimental
 */
export class FlowGraphDivideVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor() {
        super(RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.divide(right));
    }
}

/**
 * Scale a vector by a number.
 * @experimental
 */
export class FlowGraphScaleVector4Block extends FlowGraphBinaryOperationBlock<Vector4, number, Vector4> {
    constructor() {
        super(RichTypeVector4, RichTypeNumber, RichTypeVector4, (left, right) => left.scale(right));
    }
}

/**
 * Get the length of a vector.
 * @experimental
 */
export class FlowGraphLengthVector4Block extends FlowGraphUnaryOperationBlock<Vector4, number> {
    constructor() {
        super(RichTypeVector4, RichTypeNumber, (value) => value.length());
    }
}

/**
 * Normalize a vector.
 * @experimental
 */
export class FlowGraphNormalizeVector4Block extends FlowGraphUnaryOperationBlock<Vector4, Vector4> {
    constructor() {
        super(RichTypeVector4, RichTypeVector4, (value: Vector4) => {
            const clone = value.clone();
            clone.normalize();
            return clone;
        });
    }
}

/**
 * Create a vector from its components.
 * @experimental
 */
export class FlowGraphCreateVector4Block extends FlowGraphBlock {
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
     * Input connection: The w component of the vector.
     */
    public readonly w: FlowGraphDataConnection<number>;
    /**
     * Output connection: The created vector.
     */
    public readonly vector: FlowGraphDataConnection<Vector4>;

    private _cachedVector: Vector4 = Vector4.Zero();

    constructor() {
        super();

        this.x = this._registerDataInput("x", RichTypeNumber);
        this.y = this._registerDataInput("y", RichTypeNumber);
        this.z = this._registerDataInput("y", RichTypeNumber);
        this.w = this._registerDataInput("w", RichTypeNumber);
        this.vector = this._registerDataOutput("vector", RichTypeVector4);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        this._cachedVector.x = this.x.getValue(_context);
        this._cachedVector.y = this.y.getValue(_context);
        this._cachedVector.z = this.z.getValue(_context);
        this._cachedVector.w = this.w.getValue(_context);
        this.vector.setValue(this._cachedVector, _context);
    }
}

/**
 * Split a vector into its components.
 * @experimental
 */
export class FlowGraphSplitVector4Block extends FlowGraphBlock {
    /**
     * Input connection: The vector to split.
     */
    public readonly vector: FlowGraphDataConnection<Vector4>;
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
    /**
     * Input connection: The w component of the vector.
     */
    public readonly w: FlowGraphDataConnection<number>;

    constructor() {
        super();

        this.vector = this._registerDataInput("vector", RichTypeVector4);
        this.x = this._registerDataOutput("x", RichTypeNumber);
        this.y = this._registerDataOutput("y", RichTypeNumber);
        this.z = this._registerDataOutput("z", RichTypeNumber);
        this.w = this._registerDataOutput("w", RichTypeNumber);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        const vector = this.vector.getValue(_context);
        this.x.setValue(vector.x, _context);
        this.y.setValue(vector.y, _context);
        this.z.setValue(vector.z, _context);
        this.w.setValue(vector.w, _context);
    }
}

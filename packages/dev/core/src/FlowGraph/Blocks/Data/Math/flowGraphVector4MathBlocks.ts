import { RichTypeNumber, RichTypeVector4 } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { Vector4 } from "../../../../Maths/math.vector";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { FlowGraphBlock } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";

const ADDNAME = "FGAddVector4Block";
/**
 * Add two vectors together.
 * @experimental
 */
export class FlowGraphAddVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.add(right), ADDNAME, config);
    }
}
RegisterClass(ADDNAME, FlowGraphAddVector4Block);

const SUBNAME = "FGSubtractVector4Block";
/**
 * Subtract two vectors.
 * @experimental
 */
export class FlowGraphSubtractVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.subtract(right), SUBNAME, config);
    }
}
RegisterClass(SUBNAME, FlowGraphSubtractVector4Block);

const MULNAME = "FGMultiplyVector4Block";
/**
 * Multiply two vectors together.
 * @experimental
 */
export class FlowGraphMultiplyVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.multiply(right), MULNAME, config);
    }
}
RegisterClass(MULNAME, FlowGraphMultiplyVector4Block);

const DIVNAME = "FGDivideVector4Block";
/**
 * Divide two vectors.
 * @experimental
 */
export class FlowGraphDivideVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.divide(right), DIVNAME, config);
    }
}
RegisterClass(DIVNAME, FlowGraphDivideVector4Block);

const SCALNAME = "FGScaleVector4Block";
/**
 * Scale a vector by a number.
 * @experimental
 */
export class FlowGraphScaleVector4Block extends FlowGraphBinaryOperationBlock<Vector4, number, Vector4> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector4, RichTypeNumber, RichTypeVector4, (left, right) => left.scale(right), SCALNAME, config);
    }
}
RegisterClass(SCALNAME, FlowGraphScaleVector4Block);

const LENGTHNAME = "FGLengthVector4Block";
/**
 * Get the length of a vector.
 * @experimental
 */
export class FlowGraphLengthVector4Block extends FlowGraphUnaryOperationBlock<Vector4, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector4, RichTypeNumber, (value) => value.length(), LENGTHNAME, config);
    }
}
RegisterClass(LENGTHNAME, FlowGraphLengthVector4Block);

const NORMALIZENAME = "FGNormalizeVector4Block";
/**
 * Normalize a vector.
 * @experimental
 */
export class FlowGraphNormalizeVector4Block extends FlowGraphUnaryOperationBlock<Vector4, Vector4> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(
            RichTypeVector4,
            RichTypeVector4,
            (value: Vector4) => {
                const clone = value.clone();
                clone.normalize();
                return clone;
            },
            NORMALIZENAME,
            config
        );
    }

    public getClassName(): string {
        return NORMALIZENAME;
    }
}
RegisterClass(NORMALIZENAME, FlowGraphNormalizeVector4Block);

const CREATENAME = "FGCreateVector4Block";
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

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

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

    public getClassName(): string {
        return CREATENAME;
    }
}
RegisterClass(CREATENAME, FlowGraphCreateVector4Block);

const SPLITNAME = "FGSplitVector4Block";
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

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

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

    public getClassName(): string {
        return SPLITNAME;
    }
}
RegisterClass(SPLITNAME, FlowGraphSplitVector4Block);

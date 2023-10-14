import { RichTypeNumber, RichTypeVector2 } from "core/FlowGraph/flowGraphRichTypes";
import { Vector2 } from "../../../../Maths/math.vector";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import type { FlowGraphContext } from "../../../flowGraphContext";

const ADDNAME = "FGAddVector2Block";
/**
 * Adds two vectors together.
 * @experimental
 */
export class FlowGraphAddVector2Block extends FlowGraphBinaryOperationBlock<Vector2, Vector2, Vector2> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(RichTypeVector2, RichTypeVector2, RichTypeVector2, (left, right) => left.add(right), ADDNAME, config);
    }
}
RegisterClass(ADDNAME, FlowGraphAddVector2Block);

const SUBNAME = "FGSubtractVector2Block";
/**
 * Subtracts two vectors.
 * @experimental
 */
export class FlowGraphSubtractVector2Block extends FlowGraphBinaryOperationBlock<Vector2, Vector2, Vector2> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(RichTypeVector2, RichTypeVector2, RichTypeVector2, (left, right) => left.subtract(right), SUBNAME, config);
    }
}
RegisterClass(SUBNAME, FlowGraphSubtractVector2Block);

const MULNAME = "FGMultiplyVector2Block";
/**
 * Multiplies two vectors together.
 * @experimental
 */
export class FlowGraphMultiplyVector2Block extends FlowGraphBinaryOperationBlock<Vector2, Vector2, Vector2> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(RichTypeVector2, RichTypeVector2, RichTypeVector2, (left, right) => left.multiply(right), MULNAME, config);
    }
}
RegisterClass(MULNAME, FlowGraphMultiplyVector2Block);

const DIVNAME = "FGDivideVector2Block";
/**
 * Divides two vectors.
 * @experimental
 */
export class FlowGraphDivideVector2Block extends FlowGraphBinaryOperationBlock<Vector2, Vector2, Vector2> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(RichTypeVector2, RichTypeVector2, RichTypeVector2, (left, right) => left.divide(right), DIVNAME, config);
    }
}
RegisterClass(DIVNAME, FlowGraphDivideVector2Block);

const SCALENAME = "FGScaleVector2Block";
/**
 * Scales a vector by a given factor.
 * @experimental
 */
export class FlowGraphScaleVector2Block extends FlowGraphBinaryOperationBlock<Vector2, number, Vector2> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector2, RichTypeNumber, RichTypeVector2, (left, right) => left.scale(right), SCALENAME, config);
    }
}
RegisterClass(SCALENAME, FlowGraphScaleVector2Block);

const LENNAME = "FGLengthVector2Block";
/**
 * Gets the length of a vector.
 * @experimental
 */
export class FlowGraphLengthVector2Block extends FlowGraphUnaryOperationBlock<Vector2, number> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(RichTypeVector2, RichTypeNumber, (value) => value.length(), LENNAME, config);
    }
}
RegisterClass(LENNAME, FlowGraphLengthVector2Block);

const NORMALIZENAME = "FGNormalizeVector2Block";
/**
 * Normalizes a vector.
 * @experimental
 */
export class FlowGraphNormalizeVector2Block extends FlowGraphUnaryOperationBlock<Vector2, Vector2> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(
            RichTypeVector2,
            RichTypeVector2,
            (value: Vector2) => {
                const copy: Vector2 = value.clone();
                copy.normalize();
                return copy;
            },
            NORMALIZENAME,
            config
        );
    }
}
RegisterClass(NORMALIZENAME, FlowGraphNormalizeVector2Block);

const CREATENAME = "FGCreateVector2Block";
/**
 * Creates a vector from two components.
 */
export class FlowGraphCreateVector2Block extends FlowGraphBlock {
    /**
     * Input connection: The x component of the vector.
     */
    public readonly x: FlowGraphDataConnection<number>;
    /**
     * Input connection: The y component of the vector.
     */
    public readonly y: FlowGraphDataConnection<number>;
    /**
     * Output connection: The created vector.
     */
    public readonly vector: FlowGraphDataConnection<Vector2>;

    private _cachedVector: Vector2 = Vector2.Zero();

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.x = this._registerDataInput("x", RichTypeNumber);
        this.y = this._registerDataInput("y", RichTypeNumber);
        this.vector = this._registerDataOutput("vector", RichTypeVector2);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        this._cachedVector.x = this.x.getValue(_context);
        this._cachedVector.y = this.y.getValue(_context);
        this.vector.setValue(this._cachedVector, _context);
    }
}
RegisterClass(CREATENAME, FlowGraphCreateVector2Block);

const SPLITNAME = "FGSplitVector2Block";
/**
 * Split a vector into its components.
 */
export class FlowGraphSplitVector2Block extends FlowGraphBlock {
    /**
     * Input connection: The vector to split.
     */
    public readonly vector: FlowGraphDataConnection<Vector2>;
    /**
     * Output connection: The x component of the vector.
     */
    public readonly x: FlowGraphDataConnection<number>;
    /**
     * Output connection: The y component of the vector.
     */
    public readonly y: FlowGraphDataConnection<number>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.vector = this._registerDataInput("vector", RichTypeVector2);
        this.x = this._registerDataOutput("x", RichTypeNumber);
        this.y = this._registerDataOutput("y", RichTypeNumber);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        const vector = this.vector.getValue(_context);
        this.x.setValue(vector.x, _context);
        this.y.setValue(vector.y, _context);
    }
}
RegisterClass(SPLITNAME, FlowGraphSplitVector2Block);

const ROTATENAME = "FGRotate2dVector2Block";
/**
 * Rotates a vector by a given angle.
 */
export class FlowGraphRotate2dVector2Block extends FlowGraphBlock {
    /**
     * Input connection: The vector to rotate.
     */
    public readonly input: FlowGraphDataConnection<Vector2>;
    /**
     * Input connection: The angle to rotate by.
     */
    public readonly angle: FlowGraphDataConnection<number>;
    /**
     * Output connection: The rotated vector.
     */
    public readonly output: FlowGraphDataConnection<Vector2>;

    private _cachedVector: Vector2 = Vector2.Zero();

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.input = this._registerDataInput("input", RichTypeVector2);
        this.angle = this._registerDataInput("angle", RichTypeNumber);
        this.output = this._registerDataOutput("output", RichTypeVector2);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        const input = this.input.getValue(_context);
        const angle = this.angle.getValue(_context);
        this._cachedVector.x = input.x * Math.cos(angle) - input.y * Math.sin(angle);
        this._cachedVector.y = input.x * Math.sin(angle) + input.y * Math.cos(angle);
        this.output.setValue(this._cachedVector, _context);
    }
}
RegisterClass(ROTATENAME, FlowGraphRotate2dVector2Block);

import { RichTypeNumber, RichTypeVector4 } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { Vector4 } from "../../../../Maths/math.vector";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";

/**
 * Add two vectors together.
 * @experimental
 */
export class FlowGraphAddVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphAddVector4Block" }) {
        super(config, RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.add(right), "FlowGraphAddVector4Block");
    }
}
RegisterClass("FlowGraphAddVector4Block", FlowGraphAddVector4Block);

/**
 * Subtract two vectors.
 * @experimental
 */
export class FlowGraphSubtractVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphSubtractVector4Block" }) {
        super(config, RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.subtract(right), "FlowGraphSubtractVector4Block");
    }
}
RegisterClass("FlowGraphSubtractVector4Block", FlowGraphSubtractVector4Block);
/**
 * Multiply two vectors together.
 * @experimental
 */
export class FlowGraphMultiplyVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphMultiplyVector4Block" }) {
        super(config, RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.multiply(right), "FlowGraphMultiplyVector4Block");
    }
}
RegisterClass("FlowGraphMultiplyVector4Block", FlowGraphMultiplyVector4Block);
/**
 * Divide two vectors.
 * @experimental
 */
export class FlowGraphDivideVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphDivideVector4Block" }) {
        super(config, RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.divide(right), "FlowGraphDivideVector4Block");
    }
}
RegisterClass("FlowGraphDivideVector4Block", FlowGraphDivideVector4Block);

/**
 * Scale a vector by a number.
 * @experimental
 */
export class FlowGraphScaleVector4Block extends FlowGraphBinaryOperationBlock<Vector4, number, Vector4> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphScaleVector4Block" }) {
        super(config, RichTypeVector4, RichTypeNumber, RichTypeVector4, (left, right) => left.scale(right), "FlowGraphScaleVector4Block");
    }
}
RegisterClass("FlowGraphScaleVector4Block", FlowGraphScaleVector4Block);

/**
 * Get the length of a vector.
 * @experimental
 */
export class FlowGraphLengthVector4Block extends FlowGraphUnaryOperationBlock<Vector4, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphLengthVector4Block" }) {
        super(config, RichTypeVector4, RichTypeNumber, (value) => value.length(), "FlowGraphLengthVector4Block");
    }
}
RegisterClass("FlowGraphLengthVector4Block", FlowGraphLengthVector4Block);

/**
 * Normalize a vector.
 * @experimental
 */
export class FlowGraphNormalizeVector4Block extends FlowGraphUnaryOperationBlock<Vector4, Vector4> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphNormalizeVector4Block" }) {
        super(
            config,
            RichTypeVector4,
            RichTypeVector4,
            (value: Vector4) => {
                const clone = value.clone();
                clone.normalize();
                return clone;
            },
            "FlowGraphNormalizeVector4Block"
        );
    }

    public getClassName(): string {
        return "FlowGraphNormalizeVector4Block";
    }
}
RegisterClass("FlowGraphNormalizeVector4Block", FlowGraphNormalizeVector4Block);

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

    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphCreateVector4Block" }) {
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
        return "FlowGraphCreateVector4Block";
    }
}
RegisterClass("FlowGraphCreateVector4Block", FlowGraphCreateVector4Block);

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

    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphSplitVector4Block" }) {
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
        return "FlowGraphSplitVector4Block";
    }
}
RegisterClass("FlowGraphSplitVector4Block", FlowGraphSplitVector4Block);

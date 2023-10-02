import { RichTypeNumber, RichTypeVector4 } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import type { Vector4 } from "../../../../Maths/math.vector";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * Add two vectors together.
 * @experimental
 */
export class FlowGraphAddVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphAddVector4Block" }) {
        super(config, RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.add(right), "FlowGraphAddVector4Block");
    }

    public getClassName(): string {
        return "FlowGraphAddVector4Block";
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

    public getClassName(): string {
        return "FlowGraphSubtractVector4Block";
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

    public getClassName(): string {
        return "FlowGraphMultiplyVector4Block";
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

    public getClassName(): string {
        return "FlowGraphDivideVector4Block";
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

    public getClassName(): string {
        return "FlowGraphScaleVector4Block";
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

    public getClassName(): string {
        return "FlowGraphLengthVector4Block";
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

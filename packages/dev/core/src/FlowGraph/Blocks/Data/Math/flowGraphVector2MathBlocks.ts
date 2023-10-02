import { RichTypeNumber, RichTypeVector2 } from "core/FlowGraph/flowGraphRichTypes";
import type { Vector2 } from "../../../../Maths/math.vector";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * Adds two vectors together.
 * @experimental
 */
export class FlowGraphAddVector2Block extends FlowGraphBinaryOperationBlock<Vector2, Vector2, Vector2> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphAddVector2Block" }) {
        super(config, RichTypeVector2, RichTypeVector2, RichTypeVector2, (left, right) => left.add(right), "FlowGraphAddVector2Block");
    }

    public getClassName(): string {
        return "FlowGraphAddVector2Block";
    }
}
RegisterClass("FlowGraphAddVector2Block", FlowGraphAddVector2Block);

/**
 * Subtracts two vectors.
 * @experimental
 */
export class FlowGraphSubtractVector2Block extends FlowGraphBinaryOperationBlock<Vector2, Vector2, Vector2> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphSubtractVector2Block" }) {
        super(config, RichTypeVector2, RichTypeVector2, RichTypeVector2, (left, right) => left.subtract(right), "FlowGraphSubtractVector2Block");
    }

    public getClassName(): string {
        return "FlowGraphSubtractVector2Block";
    }
}
RegisterClass("FlowGraphSubtractVector2Block", FlowGraphSubtractVector2Block);
/**
 * Multiplies two vectors together.
 * @experimental
 */
export class FlowGraphMultiplyVector2Block extends FlowGraphBinaryOperationBlock<Vector2, Vector2, Vector2> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphMultiplyVector2Block" }) {
        super(config, RichTypeVector2, RichTypeVector2, RichTypeVector2, (left, right) => left.multiply(right), "FlowGraphMultiplyVector2Block");
    }

    public getClassName(): string {
        return "FlowGraphMultiplyVector2Block";
    }
}
RegisterClass("FlowGraphMultiplyVector2Block", FlowGraphMultiplyVector2Block);
/**
 * Divides two vectors.
 * @experimental
 */
export class FlowGraphDivideVector2Block extends FlowGraphBinaryOperationBlock<Vector2, Vector2, Vector2> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphDivideVector2Block" }) {
        super(config, RichTypeVector2, RichTypeVector2, RichTypeVector2, (left, right) => left.divide(right), "FlowGraphDivideVector2Block");
    }

    public getClassName(): string {
        return "FlowGraphDivideVector2Block";
    }
}
RegisterClass("FlowGraphDivideVector2Block", FlowGraphDivideVector2Block);
/**
 * Scales a vector by a number.
 * @experimental
 */
export class FlowGraphScaleVector2Block extends FlowGraphBinaryOperationBlock<Vector2, number, Vector2> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphScaleVector2Block" }) {
        super(config, RichTypeVector2, RichTypeNumber, RichTypeVector2, (left, right) => left.scale(right), "FlowGraphScaleVector2Block");
    }

    public getClassName(): string {
        return "FlowGraphScaleVector2Block";
    }
}
RegisterClass("FlowGraphScaleVector2Block", FlowGraphScaleVector2Block);
/**
 * Gets the length of a vector.
 * @experimental
 */
export class FlowGraphLengthVector2Block extends FlowGraphUnaryOperationBlock<Vector2, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphLengthVector2Block" }) {
        super(config, RichTypeVector2, RichTypeNumber, (value) => value.length(), "FlowGraphLengthVector2Block");
    }

    public getClassName(): string {
        return "FlowGraphLengthVector2Block";
    }
}
RegisterClass("FlowGraphLengthVector2Block", FlowGraphLengthVector2Block);

/**
 * Normalizes a vector.
 * @experimental
 */
export class FlowGraphNormalizeVector2Block extends FlowGraphUnaryOperationBlock<Vector2, Vector2> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphNormalizeVector2Block" }) {
        super(
            config,
            RichTypeVector2,
            RichTypeVector2,
            (value: Vector2) => {
                const copy: Vector2 = value.clone();
                copy.normalize();
                return copy;
            },
            "FlowGraphNormalizeVector2Block"
        );
    }

    public getClassName(): string {
        return "FlowGraphNormalizeVector2Block";
    }
}
RegisterClass("FlowGraphNormalizeVector2Block", FlowGraphNormalizeVector2Block);

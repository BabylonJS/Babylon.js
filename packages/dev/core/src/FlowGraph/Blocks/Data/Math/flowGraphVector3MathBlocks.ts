import { RichTypeNumber, RichTypeVector3 } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { Vector3 } from "../../../../Maths/math.vector";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * Add two vectors together.
 * @experimental
 */
export class FlowGraphAddVector3Block extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphAddVector3Block" }) {
        super(config, RichTypeVector3, RichTypeVector3, RichTypeVector3, (left, right) => left.add(right), "FlowGraphAddVector3Block");
    }

    public getClassName(): string {
        return "FlowGraphAddVector3Block";
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

    public getClassName(): string {
        return "FlowGraphSubtractVector3Block";
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

    public getClassName(): string {
        return "FlowGraphMultiplyVector3Block";
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

    public getClassName(): string {
        return "FlowGraphDivideVector3Block";
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

    public getClassName(): string {
        return "FlowGraphScaleVector3Block";
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

    public getClassName(): string {
        return "FlowGraphLengthVector3Block";
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

    public getClassName(): string {
        return "FlowGraphNormalizeVector3Block";
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

    public getClassName(): string {
        return "FlowGraphDotVector3Block";
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
    public getClassName(): string {
        return "FlowGraphCrossVector3Block";
    }
}
RegisterClass("FlowGraphCrossVector3Block", FlowGraphCrossVector3Block);

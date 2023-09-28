import { RichTypeNumber, RichTypeVector4 } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import type { Vector4 } from "../../../../Maths/math.vector";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";

/**
 * Add two vectors together.
 * @experimental
 */
export class FlowGraphAddVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor() {
        super(RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.add(right), "FlowGraphAddVector4Block");
    }
}

/**
 * Subtract two vectors.
 * @experimental
 */
export class FlowGraphSubtractVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor() {
        super(RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.subtract(right), "FlowGraphSubtractVector4Block");
    }
}

/**
 * Multiply two vectors together.
 * @experimental
 */
export class FlowGraphMultiplyVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor() {
        super(RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.multiply(right), "FlowGraphMultiplyVector4Block");
    }
}

/**
 * Divide two vectors.
 * @experimental
 */
export class FlowGraphDivideVector4Block extends FlowGraphBinaryOperationBlock<Vector4, Vector4, Vector4> {
    constructor() {
        super(RichTypeVector4, RichTypeVector4, RichTypeVector4, (left, right) => left.divide(right), "FlowGraphDivideVector4Block");
    }
}

/**
 * Scale a vector by a number.
 * @experimental
 */
export class FlowGraphScaleVector4Block extends FlowGraphBinaryOperationBlock<Vector4, number, Vector4> {
    constructor() {
        super(RichTypeVector4, RichTypeNumber, RichTypeVector4, (left, right) => left.scale(right), "FlowGraphScaleVector4Block");
    }
}

/**
 * Get the length of a vector.
 * @experimental
 */
export class FlowGraphLengthVector4Block extends FlowGraphUnaryOperationBlock<Vector4, number> {
    constructor() {
        super(RichTypeVector4, RichTypeNumber, (value) => value.length(), "FlowGraphLengthVector4Block");
    }
}

/**
 * Normalize a vector.
 * @experimental
 */
export class FlowGraphNormalizeVector4Block extends FlowGraphUnaryOperationBlock<Vector4, Vector4> {
    constructor() {
        super(
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
}

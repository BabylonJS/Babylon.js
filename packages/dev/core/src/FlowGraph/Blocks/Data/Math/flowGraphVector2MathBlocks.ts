import { RichTypeNumber, RichTypeVector2 } from "core/FlowGraph/flowGraphRichTypes";
import type { Vector2 } from "../../../../Maths/math.vector";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";

/**
 * Adds two vectors together.
 * @experimental
 */
export class FlowGraphAddVector2Block extends FlowGraphBinaryOperationBlock<Vector2, Vector2, Vector2> {
    constructor() {
        super(RichTypeVector2, RichTypeVector2, RichTypeVector2, (left, right) => left.add(right));
    }
}

/**
 * Subtracts two vectors.
 * @experimental
 */
export class FlowGraphSubtractVector2Block extends FlowGraphBinaryOperationBlock<Vector2, Vector2, Vector2> {
    constructor() {
        super(RichTypeVector2, RichTypeVector2, RichTypeVector2, (left, right) => left.subtract(right));
    }
}

/**
 * Multiplies two vectors together.
 * @experimental
 */
export class FlowGraphMultiplyVector2Block extends FlowGraphBinaryOperationBlock<Vector2, Vector2, Vector2> {
    constructor() {
        super(RichTypeVector2, RichTypeVector2, RichTypeVector2, (left, right) => left.multiply(right));
    }
}

/**
 * Divides two vectors.
 * @experimental
 */
export class FlowGraphDivideVector2Block extends FlowGraphBinaryOperationBlock<Vector2, Vector2, Vector2> {
    constructor() {
        super(RichTypeVector2, RichTypeVector2, RichTypeVector2, (left, right) => left.divide(right));
    }
}

/**
 * Scales a vector by a number.
 * @experimental
 */
export class FlowGraphScaleVector2Block extends FlowGraphBinaryOperationBlock<Vector2, number, Vector2> {
    constructor() {
        super(RichTypeVector2, RichTypeNumber, RichTypeVector2, (left, right) => left.scale(right));
    }
}

/**
 * Gets the length of a vector.
 * @experimental
 */
export class FlowGraphLengthVector2Block extends FlowGraphUnaryOperationBlock<Vector2, number> {
    constructor() {
        super(RichTypeVector2, RichTypeNumber, (value) => value.length());
    }
}

/**
 * Normalizes a vector.
 * @experimental
 */
export class FlowGraphNormalizeVector2Block extends FlowGraphUnaryOperationBlock<Vector2, Vector2> {
    constructor() {
        super(RichTypeVector2, RichTypeVector2, (value: Vector2) => {
            const copy: Vector2 = value.clone();
            copy.normalize();
            return copy;
        });
    }
}

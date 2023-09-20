import { RichTypeNumber, RichTypeVector3 } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { Vector3 } from "../../../../Maths/math.vector";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";

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

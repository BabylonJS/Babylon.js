import { RichTypeBoolean } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";

/**
 * Performs an AND operation on two boolean values.
 * @experimental
 */
export class FlowGraphLogicAndBlock extends FlowGraphBinaryOperationBlock<boolean, boolean, boolean> {
    constructor() {
        super(RichTypeBoolean, RichTypeBoolean, RichTypeBoolean, (left, right) => left && right);
    }
}

/**
 * Performs an OR operation on two boolean values.
 * @experimental
 */
export class FlowGraphLogicOrBlock extends FlowGraphBinaryOperationBlock<boolean, boolean, boolean> {
    constructor() {
        super(RichTypeBoolean, RichTypeBoolean, RichTypeBoolean, (left, right) => left || right);
    }
}

/**
 * Performs a NOT operation on a boolean value
 * @experimental
 */
export class FlowGraphLogicNotBlock extends FlowGraphUnaryOperationBlock<boolean, boolean> {
    constructor() {
        super(RichTypeBoolean, RichTypeBoolean, (value) => !value);
    }
}

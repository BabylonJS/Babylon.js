import { RichTypeBoolean } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";

export class FlowGraphAndBlock extends FlowGraphBinaryOperationBlock<boolean, boolean, boolean> {
    constructor() {
        super(RichTypeBoolean, RichTypeBoolean, RichTypeBoolean, (left, right) => left && right);
    }
}

export class FlowGraphOrBlock extends FlowGraphBinaryOperationBlock<boolean, boolean, boolean> {
    constructor() {
        super(RichTypeBoolean, RichTypeBoolean, RichTypeBoolean, (left, right) => left || right);
    }
}

export class FlowGraphNotBlock extends FlowGraphUnaryOperationBlock<boolean, boolean> {
    constructor() {
        super(RichTypeBoolean, RichTypeBoolean, (value) => !value);
    }
}

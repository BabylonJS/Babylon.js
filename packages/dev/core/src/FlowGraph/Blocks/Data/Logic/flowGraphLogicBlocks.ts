import { RichTypeBoolean } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * Performs an AND operation on two boolean values.
 * @experimental
 */
export class FlowGraphLogicAndBlock extends FlowGraphBinaryOperationBlock<boolean, boolean, boolean> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(RichTypeBoolean, RichTypeBoolean, RichTypeBoolean, (left, right) => left && right, "FlowGraphLogicAndBlock", config);
    }

    public getClassName(): string {
        return "FlowGraphLogicAndBlock";
    }
}
RegisterClass("FlowGraphLogicAndBlock", FlowGraphLogicAndBlock);

/**
 * Performs an OR operation on two boolean values.
 * @experimental
 */
export class FlowGraphLogicOrBlock extends FlowGraphBinaryOperationBlock<boolean, boolean, boolean> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(RichTypeBoolean, RichTypeBoolean, RichTypeBoolean, (left, right) => left || right, "FlowGraphLogicOrBlock", config);
    }

    public getClassName(): string {
        return "FlowGraphLogicOrBlock";
    }
}
RegisterClass("FlowGraphLogicOrBlock", FlowGraphLogicOrBlock);

/**
 * Performs a NOT operation on a boolean value
 * @experimental
 */
export class FlowGraphLogicNotBlock extends FlowGraphUnaryOperationBlock<boolean, boolean> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(RichTypeBoolean, RichTypeBoolean, (value) => !value, "FlowGraphLogicNotBlock", config);
    }

    public getClassName(): string {
        return "FlowGraphLogicNotBlock";
    }
}
RegisterClass("FlowGraphLogicNotBlock", FlowGraphLogicNotBlock);

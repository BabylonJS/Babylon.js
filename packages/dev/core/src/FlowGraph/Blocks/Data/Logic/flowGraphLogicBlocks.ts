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
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphLogicAndBlock" }) {
        super(config, RichTypeBoolean, RichTypeBoolean, RichTypeBoolean, (left, right) => left && right, "FlowGraphLogicAndBlock");
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
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphLogicOrBlock" }) {
        super(config, RichTypeBoolean, RichTypeBoolean, RichTypeBoolean, (left, right) => left || right, "FlowGraphLogicOrBlock");
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
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphLogicNotBlock" }) {
        super(config, RichTypeBoolean, RichTypeBoolean, (value) => !value, "FlowGraphLogicNotBlock");
    }

    public getClassName(): string {
        return "FlowGraphLogicNotBlock";
    }
}
RegisterClass("FlowGraphLogicNotBlock", FlowGraphLogicNotBlock);

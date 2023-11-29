import { RichTypeBoolean } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";

const PREFIX = "FGLogic";
const AND = "AndBlock";
const OR = "OrBlock";
const NOT = "NotBlock";

/**
 * Performs an AND operation on two boolean values.
 * @experimental
 */
export class FlowGraphLogicAndBlock extends FlowGraphBinaryOperationBlock<boolean, boolean, boolean> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(RichTypeBoolean, RichTypeBoolean, RichTypeBoolean, (left, right) => left && right, `${PREFIX}${AND}`, config);
    }
}
RegisterClass(`${PREFIX}${AND}`, FlowGraphLogicAndBlock);

/**
 * Performs an OR operation on two boolean values.
 * @experimental
 */
export class FlowGraphLogicOrBlock extends FlowGraphBinaryOperationBlock<boolean, boolean, boolean> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(RichTypeBoolean, RichTypeBoolean, RichTypeBoolean, (left, right) => left || right, `${PREFIX}${OR}`, config);
    }
}
RegisterClass(`${PREFIX}${OR}`, FlowGraphLogicOrBlock);

/**
 * Performs a NOT operation on a boolean value
 * @experimental
 */
export class FlowGraphLogicNotBlock extends FlowGraphUnaryOperationBlock<boolean, boolean> {
    constructor(config: IFlowGraphBlockConfiguration) {
        super(RichTypeBoolean, RichTypeBoolean, (value) => !value, `${PREFIX}${NOT}`, config);
    }
}
RegisterClass(`${PREFIX}${NOT}`, FlowGraphLogicNotBlock);

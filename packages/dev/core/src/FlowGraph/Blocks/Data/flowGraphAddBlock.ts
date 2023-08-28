import { FlowGraphBinaryOpBaseBlock } from "./flowGraphBinaryOpBlock";

/**
 * @experimental
 */
export class FlowGraphAddNumbersBlock extends FlowGraphBinaryOpBaseBlock<number, number, number> {
    constructor() {
        super({
            defaultLeftValue: 0,
            defaultRightValue: 0,
            binOp: (left, right) => left + right,
        });
    }
}

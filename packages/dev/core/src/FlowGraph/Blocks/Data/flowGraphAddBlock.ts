import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBinaryOpBaseBlock } from "./flowGraphBinaryOpBlock";

/**
 * @experimental
 */
export class FlowGraphAddNumbersBlock extends FlowGraphBinaryOpBaseBlock<number, number, number> {
    constructor(graph: FlowGraph) {
        super(graph, {
            defaultLeftValue: 0,
            defaultRightValue: 0,
            binOp: (left, right) => left + right,
        });
    }
}

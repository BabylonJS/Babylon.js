import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBinaryOpBaseBlock } from "./flowGraphBinaryOpBlock";

/**
 * @experimental
 */
export interface IFlowGraphAddNumbersBlockParams {
    graph: FlowGraph;
}
/**
 * @experimental
 */
export class FlowGraphAddNumbersBlock extends FlowGraphBinaryOpBaseBlock<number, number, number> {
    constructor(params: IFlowGraphAddNumbersBlockParams) {
        super({
            defaultLeftValue: 0,
            defaultRightValue: 0,
            binOp: (left, right) => left + right,
            graph: params.graph,
        });
    }
}

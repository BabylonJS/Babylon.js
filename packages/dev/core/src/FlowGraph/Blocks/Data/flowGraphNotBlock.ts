import type { FlowGraph } from "../../flowGraph";
import { FlowGraphUnaryOpBaseBlock } from "./flowGraphUnaryOpBaseBlock";

/**
 * @experimental
 */
export interface IFlowGraphNotBlockParams<T> {
    graph: FlowGraph;
    defaultInputValue: T;
}

/**
 * @experimental
 */
export class FlowGraphNotBlock<T> extends FlowGraphUnaryOpBaseBlock<T, boolean> {
    constructor(params: IFlowGraphNotBlockParams<T>) {
        super({
            graph: params.graph,
            defaultInputValue: params.defaultInputValue,
            op: (value) => !value,
        });
    }
}

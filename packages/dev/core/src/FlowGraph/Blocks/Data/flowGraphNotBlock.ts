import type { FlowGraph } from "../../flowGraph";
import { FlowGraphUnaryOpBaseBlock } from "./flowGraphUnaryOpBaseBlock";

/**
 * @experimental
 */
export interface IFlowGraphNotBlockParams<T> {
    defaultInputValue: T;
}

/**
 * @experimental
 */
export class FlowGraphNotBlock<T> extends FlowGraphUnaryOpBaseBlock<T, boolean> {
    constructor(graph: FlowGraph, params: IFlowGraphNotBlockParams<T>) {
        super(graph, {
            defaultInputValue: params.defaultInputValue,
            op: (value) => !value,
        });
    }
}

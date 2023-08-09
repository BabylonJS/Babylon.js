import type { FlowGraph } from "../../flowGraph";
import { FlowGraphUnaryOpBaseBlock } from "./flowGraphUnaryOpBaseBlock";

export class FlowGraphNotBlock<T> extends FlowGraphUnaryOpBaseBlock<T, boolean> {
    constructor(graph: FlowGraph, defaultValue: T) {
        super(graph, defaultValue, (v) => !v);
    }
}

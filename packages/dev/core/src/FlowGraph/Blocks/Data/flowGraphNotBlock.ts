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
    constructor(params: IFlowGraphNotBlockParams<T>) {
        super({
            defaultInputValue: params.defaultInputValue,
            op: (value) => !value,
        });
    }
}

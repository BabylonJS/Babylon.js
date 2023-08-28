import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";

export interface IFlowGraphSetVariableBlockParams<T> {
    variableName: string;
}
/**
 * @experimental
 */
export class FlowGraphSetVariableBlock<T> extends FlowGraphWithOnDoneExecutionBlock {
    /**
     *
     */
    public readonly input: FlowGraphDataConnection<T>;

    private _variableName: string;

    constructor(graph: FlowGraph, params: IFlowGraphSetVariableBlockParams<T>) {
        super(graph);

        this._variableName = params.variableName;
        this.input = this._registerDataInput<T>("input", undefined);
    }

    public _execute(context: FlowGraphContext): void {
        context.setVariable(this._variableName, this.input.getValue(context));
        this.onDone._activateSignal(context);
    }
}

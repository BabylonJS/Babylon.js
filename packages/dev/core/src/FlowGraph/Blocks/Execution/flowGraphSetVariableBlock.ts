import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";

export interface IFlowGraphSetVariableBlockParams<T> {
    graph: FlowGraph;
    variableName: string;
    defaultValue: T;
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

    constructor(params: IFlowGraphSetVariableBlockParams<T>) {
        super(params.graph);

        this._variableName = params.variableName;
        this.input = this._registerDataInput("input", params.defaultValue);
    }

    public _execute(): void {
        this._graph.setVariable(this._variableName, this.input.value);
        this.onDone._activateSignal();
    }
}

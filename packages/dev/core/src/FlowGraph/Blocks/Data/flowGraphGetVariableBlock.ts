import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";

/**
 * @experimental
 */
export interface IFlowGraphGetVariableBlockParams<T> {
    graph: FlowGraph;
    variableName: string;
    defaultValue: T;
}
/**
 * @experimental
 */
export class FlowGraphGetVariableBlock<T> extends FlowGraphBlock {
    public readonly output: FlowGraphDataConnection<T>;

    private _variableName: string;
    private _defaultValue: T;

    constructor(params: IFlowGraphGetVariableBlockParams<T>) {
        super(params.graph);

        this._variableName = params.variableName;
        this._defaultValue = params.defaultValue;

        this.output = this._registerDataOutput("output", params.defaultValue);
    }

    /**
     * @internal
     */
    public _updateOutputs(): void {
        this.output.value = this._graph.getVariable(this._variableName) ?? this._defaultValue;
    }
}

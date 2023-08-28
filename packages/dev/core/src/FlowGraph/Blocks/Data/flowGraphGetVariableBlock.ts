import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";

/**
 * @experimental
 */
export interface IFlowGraphGetVariableBlockParams<T> {
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

    constructor(graph: FlowGraph, params: IFlowGraphGetVariableBlockParams<T>) {
        super(graph);

        this._variableName = params.variableName;
        this._defaultValue = params.defaultValue;

        this.output = this._registerDataOutput("output", params.defaultValue);
    }

    /**
     * @internal
     */
    public _updateOutputs(context: FlowGraphContext): void {
        this.output.value = context.getVariable(this._variableName) ?? this._defaultValue;
    }
}

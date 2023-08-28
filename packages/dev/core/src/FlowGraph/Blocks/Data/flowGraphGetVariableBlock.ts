import type { FlowGraphContext } from "../../flowGraphContext";
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

    constructor(params: IFlowGraphGetVariableBlockParams<T>) {
        super();

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

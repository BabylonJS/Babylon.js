import type { FlowGraphContext } from "../../flowGraphContext";
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

    constructor(params: IFlowGraphSetVariableBlockParams<T>) {
        super();

        this._variableName = params.variableName;
        this.input = this._registerDataInput<T>("input", undefined);
    }

    public _execute(context: FlowGraphContext): void {
        context.setVariable(this._variableName, this.input.getValue(context));
        this.onDone._activateSignal(context);
    }
}

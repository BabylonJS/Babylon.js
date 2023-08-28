import { FlowGraphValueType } from "core/FlowGraph/flowGraphTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 */
export class FlowGraphSetVariableBlock<T> extends FlowGraphWithOnDoneExecutionBlock {
    public readonly variableName: FlowGraphDataConnection;
    public readonly input: FlowGraphDataConnection;

    constructor() {
        super();

        this.variableName = this._registerDataInput("variableName", FlowGraphValueType.String);
        this.input = this._registerDataInput("input", FlowGraphValueType.Any);
    }

    public _execute(context: FlowGraphContext): void {
        const variableNameValue = this.variableName.getValue(context);
        context.setVariable(variableNameValue, this.input.getValue(context));
        this.onDone._activateSignal(context);
    }
}

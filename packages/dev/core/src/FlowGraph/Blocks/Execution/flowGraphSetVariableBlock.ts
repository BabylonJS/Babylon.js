import { RichTypeString, RichTypeAny } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";

export interface IFlowGraphSetVariableBlockParameter<T> {
    variableName?: string;
    input?: T;
}
/**
 * Block to set a variable.
 * @experimental
 */
export class FlowGraphSetVariableBlock<T> extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: The name of the variable to set.
     */
    public readonly variableName: FlowGraphDataConnection<string>;
    /**
     * Input connection: The value to set on the variable.
     */
    public readonly input: FlowGraphDataConnection<T>;

    constructor(params?: IFlowGraphSetVariableBlockParameter<T>) {
        super();

        this.variableName = this._registerDataInput("variableName", RichTypeString);
        if (params?.variableName !== undefined) {
            this.variableName.value = params.variableName;
        }
        this.input = this._registerDataInput("input", RichTypeAny);
        if (params?.input !== undefined) {
            this.input.value = params.input;
        }
    }

    public _execute(context: FlowGraphContext): void {
        const variableNameValue = this.variableName.getValue(context);
        context.setVariable(variableNameValue, this.input.getValue(context));
        this.onDone._activateSignal(context);
    }
}

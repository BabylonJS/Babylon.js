import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import { RichTypeAny } from "../../flowGraphRichTypes";
/**
 * Configuration for a custom function block.
 * @experimental
 */
export interface IFlowGraphCustomFunctionBlockConfiguration {
    /**
     * The function to run.
     */
    customFunction: (value: any) => void;
}
/**
 * Block that executes a user-defined function.
 * @experimental
 */
export class FlowGraphCustomFunctionBlock extends FlowGraphWithOnDoneExecutionBlock {
    public readonly input: FlowGraphDataConnection<any>;

    constructor(private _config: IFlowGraphCustomFunctionBlockConfiguration) {
        super();

        this.input = this._registerDataInput("input", RichTypeAny);
    }
    public _execute(context: FlowGraphContext): void {
        this._config.customFunction(this.input.getValue(context));
        this.onDone._activateSignal(context);
    }
}

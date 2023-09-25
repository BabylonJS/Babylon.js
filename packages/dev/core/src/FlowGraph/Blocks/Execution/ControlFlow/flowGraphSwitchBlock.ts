import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";

/**
 * @experimental
 * Configuration for a switch block.
 */
export interface IFlowGraphSwitchBlockConfiguration<T> {
    /**
     * The possible values for the selection.
     */
    cases: T[];
}

/**
 * @experimental
 * A block that executes a branch based on a selection.
 */
export class FlowGraphSwitchBlock<T> extends FlowGraphExecutionBlock {
    /**
     * Input connection: The value of the selection.
     */
    public readonly selection: FlowGraphDataConnection<T>;
    /**
     * Output connection: The output flows.
     */
    public readonly outputFlows: FlowGraphSignalConnection[] = [];

    constructor(private _config: IFlowGraphSwitchBlockConfiguration<T>) {
        super();

        this.selection = this._registerDataInput("selection", RichTypeAny);

        for (let i = 0; i <= this._config.cases.length; i++) {
            this.outputFlows.push(this._registerSignalOutput(`out${i}`));
        }
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        const selectionValue = this.selection.getValue(context);

        for (let i = 0; i < this._config.cases.length; i++) {
            if (selectionValue === this._config.cases[i]) {
                this.outputFlows[i]._activateSignal(context);
                return;
            }
        }

        // default case
        this.outputFlows[this.outputFlows.length - 1]._activateSignal(context);
    }
}

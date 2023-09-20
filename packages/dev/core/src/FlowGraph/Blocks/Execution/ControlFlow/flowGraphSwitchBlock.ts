import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";

export interface IFlowGraphSwitchBlockConfiguration<T> {
    cases: T[];
}

export class FlowGraphSwitchBlock<T> extends FlowGraphExecutionBlock {
    public readonly selection: FlowGraphDataConnection<T>;
    public readonly outputFlows: FlowGraphSignalConnection[] = [];

    constructor(private _config: IFlowGraphSwitchBlockConfiguration<T>) {
        super();

        this.selection = this._registerDataInput("selection", RichTypeAny);

        for (let i = 0; i <= this._config.cases.length; i++) {
            this.outputFlows.push(this._registerSignalOutput(`out${i}`));
        }
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
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

import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeBoolean } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../../flowGraphWithOnDoneExecutionBlock";

export interface IFlowGraphWhileLoopBlockConfiguration {
    isDo?: boolean;
}

export class FlowGraphWhileLoopBlock extends FlowGraphWithOnDoneExecutionBlock {
    public readonly condition: FlowGraphDataConnection<boolean>;
    public readonly loopBody: FlowGraphSignalConnection;

    constructor(private _config: IFlowGraphWhileLoopBlockConfiguration) {
        super();

        this.condition = this._registerDataInput("condition", RichTypeBoolean);
        this.loopBody = this._registerSignalOutput("loopBody");
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        let lastEvaluated = context._getExecutionVariable(this, "lastEvaluated") ?? true;
        if (this._config.isDo && lastEvaluated) {
            this.loopBody._activateSignal(context);
        } else {
            this.onDone._activateSignal(context);
        }
        lastEvaluated = this.condition.getValue(context);
        if (!this._config.isDo && lastEvaluated) {
            this.loopBody._activateSignal(context);
        } else {
            this.onDone._activateSignal(context);
        }

        context._setExecutionVariable(this, "lastEvaluated", lastEvaluated);
    }
}

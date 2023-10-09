import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeBoolean } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../../flowGraphWithOnDoneExecutionBlock";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * @experimental
 * Configuration for the while loop block.
 */
export interface IFlowGraphWhileLoopBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * If true, the loop body will be executed at least once.
     */
    isDo?: boolean;
}

/**
 * @experimental
 * A block that executes a branch while a condition is true.
 */
export class FlowGraphWhileLoopBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: The condition to evaluate.
     */
    public readonly condition: FlowGraphDataConnection<boolean>;
    /**
     * Output connection: The loop body.
     */
    public readonly loopBody: FlowGraphSignalConnection;

    constructor(public config?: IFlowGraphWhileLoopBlockConfiguration) {
        super(config);

        this.condition = this._registerDataInput("condition", RichTypeBoolean);
        this.loopBody = this._registerSignalOutput("loopBody");
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        let conditionValue = this.condition.getValue(context);
        if (this.config?.isDo && !conditionValue) {
            this.loopBody._activateSignal(context);
        }
        while (conditionValue) {
            this.loopBody._activateSignal(context);
            conditionValue = this.condition.getValue(context);
        }
        this.onDone._activateSignal(context);
    }

    public getClassName(): string {
        return "FGWhileLoopBlock";
    }
}
RegisterClass("FGWhileLoopBlock", FlowGraphWhileLoopBlock);

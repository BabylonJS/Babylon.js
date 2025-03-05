import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeBoolean } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { Logger } from "core/Misc/logger";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
/**
 * Configuration for the while loop block.
 */
export interface IFlowGraphWhileLoopBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * If true, the loop body will be executed at least once.
     */
    doWhile?: boolean;
}

/**
 * A block that executes a branch while a condition is true.
 */
export class FlowGraphWhileLoopBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * The maximum number of iterations allowed in a loop.
     * This can be set to avoid an infinite loop.
     */
    public static MaxLoopCount = 1000;

    /**
     * Input connection: The condition to evaluate.
     */
    public readonly condition: FlowGraphDataConnection<boolean>;
    /**
     * Output connection: The loop body.
     */
    public readonly executionFlow: FlowGraphSignalConnection;

    /**
     * Output connection: The completed signal. Triggered when condition is false.
     * No out signal is available.
     */
    public readonly completed: FlowGraphSignalConnection;

    constructor(
        /**
         * the configuration of the block
         */
        public override config?: IFlowGraphWhileLoopBlockConfiguration
    ) {
        super(config);

        this.condition = this.registerDataInput("condition", RichTypeBoolean);
        this.executionFlow = this._registerSignalOutput("executionFlow");
        this.completed = this._registerSignalOutput("completed");
        // unregister "out" signal
        this._unregisterSignalOutput("out");
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        let conditionValue = this.condition.getValue(context);
        if (this.config?.doWhile && !conditionValue) {
            this.executionFlow._activateSignal(context);
        }
        let i = 0;
        while (conditionValue) {
            this.executionFlow._activateSignal(context);
            ++i;
            if (i >= FlowGraphWhileLoopBlock.MaxLoopCount) {
                Logger.Warn("FlowGraphWhileLoopBlock: Max loop count reached. Breaking.");
                break;
            }
            conditionValue = this.condition.getValue(context);
        }
        // out is not triggered - completed is triggered
        this.completed._activateSignal(context);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.WhileLoop;
    }
}

RegisterClass(FlowGraphBlockNames.WhileLoop, FlowGraphWhileLoopBlock);

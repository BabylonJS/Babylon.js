/** This file must only contain pure code and pure imports */

import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { RichTypeBoolean } from "../../../flowGraphRichTypes.pure";
import { type FlowGraphSignalConnection } from "../../../flowGraphSignalConnection.pure";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { Logger } from "core/Misc/logger";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";
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

let _Registered = false;
/**
 * Register side effects for flowGraphWhileLoopBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphWhileLoopBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.WhileLoop, FlowGraphWhileLoopBlock);
}

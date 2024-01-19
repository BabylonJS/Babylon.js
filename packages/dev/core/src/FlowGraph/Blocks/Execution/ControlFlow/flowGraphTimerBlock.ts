import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { AdvancedTimer } from "../../../../Misc/timer";
import type { FlowGraphContext } from "../../../flowGraphContext";
import { FlowGraphAsyncExecutionBlock } from "../../../flowGraphAsyncExecutionBlock";
import { RichTypeNumber } from "../../../flowGraphRichTypes";
import { Tools } from "../../../../Misc/tools";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * @experimental
 * Block that provides two different output flows. One is started immediately once the block is executed,
 * and the other is executed after a set time. The timer for this block runs based on the scene's render loop.
 */
export class FlowGraphTimerBlock extends FlowGraphAsyncExecutionBlock {
    /**
     * Input connection: The timeout of the timer.
     */
    public readonly timeout: FlowGraphDataConnection<number>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.timeout = this.registerDataInput("timeout", RichTypeNumber);
    }

    public _preparePendingTasks(context: FlowGraphContext): void {
        const currentTimeout = this.timeout.getValue(context);

        if (currentTimeout !== undefined && currentTimeout >= 0) {
            const timers = context._getExecutionVariable(this, "runningTimers") || [];
            const scene = context.configuration.scene;
            const timer: AdvancedTimer = new AdvancedTimer({
                timeout: currentTimeout,
                contextObservable: scene.onBeforeRenderObservable,
                onEnded: () => this._onEnded(timer, context),
            });
            timer.start();

            timers.push(timer);
            context._setExecutionVariable(this, "runningTimers", timers);
        }
    }

    /**
     * @internal
     */
    public _execute(context: FlowGraphContext) {
        this._startPendingTasks(context);
        this.out._activateSignal(context);
    }

    private _onEnded(timer: AdvancedTimer, context: FlowGraphContext) {
        const timers = context._getExecutionVariable(this, "runningTimers") || [];
        const index = timers.indexOf(timer);
        if (index !== -1) {
            timers.splice(index, 1);
        } else {
            Tools.Warn("FlowGraphTimerBlock: Timer ended but was not found in the running timers list");
        }
        context._removePendingBlock(this);
        this.done._activateSignal(context);
    }

    public _cancelPendingTasks(context: FlowGraphContext): void {
        const timers = context._getExecutionVariable(this, "runningTimers") || [];
        for (const timer of timers) {
            timer.dispose();
        }
        context._deleteExecutionVariable(this, "runningTimers");
    }

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return FlowGraphTimerBlock.ClassName;
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGTimerBlock";
}
RegisterClass("FGTimerBlock", FlowGraphTimerBlock);

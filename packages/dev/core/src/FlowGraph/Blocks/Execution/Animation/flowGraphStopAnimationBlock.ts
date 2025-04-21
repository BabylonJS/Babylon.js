import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeAny, RichTypeNumber } from "../../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { AnimationGroup } from "core/Animations/animationGroup";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { Logger } from "core/Misc/logger";
import { FlowGraphAsyncExecutionBlock } from "core/FlowGraph/flowGraphAsyncExecutionBlock";
/**
 * @experimental
 * Block that stops a running animation
 */
export class FlowGraphStopAnimationBlock extends FlowGraphAsyncExecutionBlock {
    /**
     * Input connection: The animation to stop.
     */
    public readonly animationGroup: FlowGraphDataConnection<AnimationGroup>;

    /**
     * Input connection - if defined (positive integer) the animation will stop at this frame.
     */
    public readonly stopAtFrame: FlowGraphDataConnection<number>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.animationGroup = this.registerDataInput("animationGroup", RichTypeAny);
        this.stopAtFrame = this.registerDataInput("stopAtFrame", RichTypeNumber, -1);
    }

    public override _preparePendingTasks(context: FlowGraphContext): void {
        const animationToStopValue = this.animationGroup.getValue(context);
        const stopAtFrame = this.stopAtFrame.getValue(context) ?? -1;
        // get the context variable
        const pendingStopAnimations = context._getGlobalContextVariable(
            "pendingStopAnimations",
            [] as {
                uniqueId: number;
                stopAtFrame: number;
            }[]
        );
        // add the animation to the list
        pendingStopAnimations.push({ uniqueId: animationToStopValue.uniqueId, stopAtFrame });
        // set the global context variable
        context._setGlobalContextVariable("pendingStopAnimations", pendingStopAnimations);
    }
    public override _cancelPendingTasks(context: FlowGraphContext): void {
        // remove the animation from the list
        const animationToStopValue = this.animationGroup.getValue(context);
        const pendingStopAnimations = context._getGlobalContextVariable(
            "pendingStopAnimations",
            [] as {
                uniqueId: number;
                stopAtFrame: number;
            }[]
        );
        for (let i = 0; i < pendingStopAnimations.length; i++) {
            if (pendingStopAnimations[i].uniqueId === animationToStopValue.uniqueId) {
                pendingStopAnimations.splice(i, 1);
                // set the global context variable
                context._setGlobalContextVariable("pendingStopAnimations", pendingStopAnimations);
                break;
            }
        }
    }

    public _execute(context: FlowGraphContext): void {
        const animationToStopValue = this.animationGroup.getValue(context);
        const stopTime = this.stopAtFrame.getValue(context) ?? -1;
        // check the values
        if (!animationToStopValue) {
            Logger.Warn("No animation group provided to stop.");
            return this._reportError(context, "No animation group provided to stop.");
        }
        if (isNaN(stopTime)) {
            return this._reportError(context, "Invalid stop time.");
        }
        if (stopTime > 0) {
            this._startPendingTasks(context);
        } else {
            this._stopAnimation(animationToStopValue, context);
        }
        // note that out will not be triggered in case of an error
        this.out._activateSignal(context);
    }

    public override _executeOnTick(context: FlowGraphContext): void {
        const animationToStopValue = this.animationGroup.getValue(context);
        // check each frame if any animation should be stopped
        const pendingStopAnimations = context._getGlobalContextVariable("pendingStopAnimations", [] as { uniqueId: number; stopAtFrame: number }[]);
        for (let i = 0; i < pendingStopAnimations.length; i++) {
            // compare the uniqueId to the animation to stop
            if (pendingStopAnimations[i].uniqueId === animationToStopValue.uniqueId) {
                // check if the current frame is AFTER the stopAtFrame
                if (animationToStopValue.getCurrentFrame() >= pendingStopAnimations[i].stopAtFrame) {
                    // stop the animation
                    this._stopAnimation(animationToStopValue, context);
                    // remove the animation from the list
                    pendingStopAnimations.splice(i, 1);
                    // set the global context variable
                    context._setGlobalContextVariable("pendingStopAnimations", pendingStopAnimations);
                    this.done._activateSignal(context);
                    context._removePendingBlock(this);
                    break;
                }
            }
        }
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.StopAnimation;
    }

    private _stopAnimation(animationGroup: AnimationGroup, context: FlowGraphContext): void {
        const currentlyRunning = context._getGlobalContextVariable("currentlyRunningAnimationGroups", []) as number[];
        const index = currentlyRunning.indexOf(animationGroup.uniqueId);
        if (index !== -1) {
            animationGroup.stop();
            currentlyRunning.splice(index, 1);
            // update the global context variable
            context._setGlobalContextVariable("currentlyRunningAnimationGroups", currentlyRunning);
        } else {
            // Logger.Warn("Trying to stop an animation that is not running.");
            // no-op for now. Probably no need to log anything here.
        }
    }
}
RegisterClass(FlowGraphBlockNames.StopAnimation, FlowGraphStopAnimationBlock);

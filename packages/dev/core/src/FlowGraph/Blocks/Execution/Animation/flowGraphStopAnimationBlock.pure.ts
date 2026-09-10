/** This file must only contain pure code and pure imports */

import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { RichTypeAny, RichTypeNumber } from "../../../flowGraphRichTypes.pure";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type AnimationGroup } from "core/Animations/animationGroup.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { Logger } from "core/Misc/logger";
import { FlowGraphAsyncExecutionBlock } from "core/FlowGraph/flowGraphAsyncExecutionBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { RemoveFlowGraphAnimationGroupObservers } from "./flowGraphPlayAnimationBlock.pure";

/**
 * Configuration for stopping an animation.
 */
export interface IFlowGraphStopAnimationBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * Whether stopAtFrame uses the unbounded KHR_interactivity timeline.
     * When false, the block retains its legacy positive-frame scheduling behavior.
     */
    useVirtualStopAt?: boolean;

    /**
     * Whether stopping suppresses the animation-group end notification.
     */
    skipOnAnimationEnd?: boolean;
}

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

    constructor(config?: IFlowGraphStopAnimationBlockConfiguration) {
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
                block: FlowGraphStopAnimationBlock;
                useVirtualStopAt: boolean;
            }[]
        );
        if (this.config?.useVirtualStopAt) {
            const existing = pendingStopAnimations.find((entry) => entry.uniqueId === animationToStopValue.uniqueId && entry.useVirtualStopAt);
            if (existing) {
                if (existing.block !== this) {
                    context._removePendingBlock(existing.block);
                }
                existing.stopAtFrame = stopAtFrame;
                existing.block = this;
            } else {
                pendingStopAnimations.push({ uniqueId: animationToStopValue.uniqueId, stopAtFrame, block: this, useVirtualStopAt: true });
            }
        } else {
            pendingStopAnimations.push({ uniqueId: animationToStopValue.uniqueId, stopAtFrame, block: this, useVirtualStopAt: false });
        }
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
                block: FlowGraphStopAnimationBlock;
                useVirtualStopAt: boolean;
            }[]
        );
        for (let i = 0; i < pendingStopAnimations.length; i++) {
            if (pendingStopAnimations[i].uniqueId === animationToStopValue.uniqueId && pendingStopAnimations[i].block === this) {
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
        const useVirtualStopAt = !!this.config?.useVirtualStopAt;
        const hasScheduledStop = useVirtualStopAt ? this.stopAtFrame.isConnected() || context._hasConnectionValue(this.stopAtFrame) : stopTime > 0;
        let activateDone = false;
        if (hasScheduledStop) {
            if (useVirtualStopAt && animationToStopValue.isValidVirtualStopFrame(stopTime) && animationToStopValue.isVirtualFrameReached(stopTime)) {
                this._stopAnimation(animationToStopValue, context, stopTime);
                activateDone = true;
            } else {
                this._startPendingTasks(context);
            }
        } else {
            this._stopAnimation(animationToStopValue, context);
        }
        // note that out will not be triggered in case of an error
        this.out._activateSignal(context);
        if (activateDone) {
            this.done._activateSignal(context);
        }
    }

    public override _executeOnTick(context: FlowGraphContext): void {
        const animationToStopValue = this.animationGroup.getValue(context);
        // check each frame if any animation should be stopped
        const pendingStopAnimations = context._getGlobalContextVariable(
            "pendingStopAnimations",
            [] as { uniqueId: number; stopAtFrame: number; block: FlowGraphStopAnimationBlock; useVirtualStopAt: boolean }[]
        );
        for (let i = 0; i < pendingStopAnimations.length; i++) {
            // compare the uniqueId to the animation to stop
            if (pendingStopAnimations[i].uniqueId === animationToStopValue.uniqueId && pendingStopAnimations[i].block === this) {
                const useVirtualStopAt = pendingStopAnimations[i].useVirtualStopAt;
                const shouldStop = useVirtualStopAt
                    ? animationToStopValue.isValidVirtualStopFrame(pendingStopAnimations[i].stopAtFrame) &&
                      animationToStopValue.isVirtualFrameReached(pendingStopAnimations[i].stopAtFrame)
                    : animationToStopValue.getCurrentFrame() >= pendingStopAnimations[i].stopAtFrame;
                if (shouldStop) {
                    // stop the animation
                    this._stopAnimation(animationToStopValue, context, useVirtualStopAt ? pendingStopAnimations[i].stopAtFrame : undefined);
                    // remove the animation from the list
                    pendingStopAnimations.splice(i, 1);
                    // set the global context variable
                    context._setGlobalContextVariable("pendingStopAnimations", pendingStopAnimations);
                    this.done._activateSignal(context);
                    context._removePendingBlock(this);
                    break;
                } else if (!animationToStopValue.isPlaying) {
                    pendingStopAnimations.splice(i, 1);
                    context._setGlobalContextVariable("pendingStopAnimations", pendingStopAnimations);
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

    private _stopAnimation(animationGroup: AnimationGroup, context: FlowGraphContext, virtualStopFrame?: number): void {
        const currentlyRunning = context._getGlobalContextVariable("currentlyRunningAnimationGroups", []) as number[];
        const index = currentlyRunning.indexOf(animationGroup.uniqueId);
        if (index !== -1) {
            const suppressAnimationEnd = !!this.config?.skipOnAnimationEnd;
            const owner = suppressAnimationEnd ? RemoveFlowGraphAnimationGroupObservers(context, animationGroup) : undefined;
            owner?._cleanupAfterExternalStop(context, animationGroup);
            if (virtualStopFrame !== undefined) {
                animationGroup.setVirtualCurrentFrame(virtualStopFrame);
            }
            // Skip the animation-end observable so that stopping does not activate the originating
            // starting block's `done` flow. When an animation is
            // stopped (animation/stop or animation/stopAt) the previously associated `done` flows MUST NOT be
            // activated; only animation/stopAt's own `done` flow (fired from _executeOnTick) should run.
            if (suppressAnimationEnd) {
                animationGroup.stop(true);
            } else {
                animationGroup.stop();
            }
            const remainingIndex = currentlyRunning.indexOf(animationGroup.uniqueId);
            if (remainingIndex !== -1) {
                currentlyRunning.splice(remainingIndex, 1);
                context._setGlobalContextVariable("currentlyRunningAnimationGroups", currentlyRunning);
            }
        } else {
            // Logger.Warn("Trying to stop an animation that is not running.");
            // no-op for now. Probably no need to log anything here.
        }
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphStopAnimationBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphStopAnimationBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.StopAnimation, FlowGraphStopAnimationBlock);
}

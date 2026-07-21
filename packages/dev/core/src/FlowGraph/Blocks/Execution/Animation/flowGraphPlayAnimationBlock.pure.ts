/** This file must only contain pure code and pure imports */

import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { FlowGraphAsyncExecutionBlock } from "../../../flowGraphAsyncExecutionBlock";
import { RichTypeAny, RichTypeNumber, RichTypeBoolean } from "../../../flowGraphRichTypes.pure";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { AnimationGroup } from "core/Animations/animationGroup.pure";
import { type Animation } from "core/Animations/animation.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * @experimental
 * A block that plays an animation on an animatable object.
 */
export class FlowGraphPlayAnimationBlock extends FlowGraphAsyncExecutionBlock {
    /**
     * Input connection: The speed of the animation.
     */
    public readonly speed: FlowGraphDataConnection<number>;
    /**
     * Input connection: Should the animation loop?
     * Not in glTF specs, but useful for the engine.
     */
    public readonly loop: FlowGraphDataConnection<boolean>;
    /**
     * Input connection: The starting frame of the animation.
     */
    public readonly from: FlowGraphDataConnection<number>;
    /**
     * Input connection: The ending frame of the animation.
     */
    public readonly to: FlowGraphDataConnection<number>;

    /**
     * Output connection: The current frame of the animation.
     */
    public readonly currentFrame: FlowGraphDataConnection<number>;

    /**
     * Output connection: The current time of the animation.
     */
    public readonly currentTime: FlowGraphDataConnection<number>;

    /**
     * Output connection: The animatable that is currently running.
     */
    public readonly currentAnimationGroup: FlowGraphDataConnection<AnimationGroup>;

    /**
     * Input: Will be initialized if no animation group was provided in the configuration.
     */
    public readonly animationGroup: FlowGraphDataConnection<AnimationGroup>;

    /**
     * Input: If provided this animation will be used. Priority will be given to the animation group input.
     */
    public readonly animation: FlowGraphDataConnection<Animation | Animation[]>;

    /**
     * Input connection: The target object that will be animated. If animation group is provided this input will be ignored.
     */
    public readonly object: FlowGraphDataConnection<any>;

    public constructor(
        /**
         * the configuration of the block
         */
        public override config?: IFlowGraphBlockConfiguration
    ) {
        super(config, ["animationLoop", "animationEnd", "animationGroupLoop"]);

        this.speed = this.registerDataInput("speed", RichTypeNumber);
        this.loop = this.registerDataInput("loop", RichTypeBoolean);
        this.from = this.registerDataInput("from", RichTypeNumber, 0);
        this.to = this.registerDataInput("to", RichTypeNumber);

        this.currentFrame = this.registerDataOutput("currentFrame", RichTypeNumber);
        this.currentTime = this.registerDataOutput("currentTime", RichTypeNumber);

        this.currentAnimationGroup = this.registerDataOutput("currentAnimationGroup", RichTypeAny);
        this.animationGroup = this.registerDataInput("animationGroup", RichTypeAny, config?.animationGroup);
        this.animation = this.registerDataInput("animation", RichTypeAny);
        this.object = this.registerDataInput("object", RichTypeAny);
    }

    /**
     * @internal
     * @param context
     */
    public override _startPendingTasks(context: FlowGraphContext): void {
        if (context._getExecutionVariable(this, "_initialized", false)) {
            this._cancelPendingTasks(context);
            this._resetAfterCanceled(context);
        }

        if (!this._preparePendingTasks(context)) {
            return;
        }
        context._addPendingBlock(this);
        this.out._activateSignal(context);
        context._setExecutionVariable(this, "_initialized", true);
    }

    /**
     * @internal
     * @param context
     * @returns whether the animation was prepared and started successfully
     */
    public override _preparePendingTasks(context: FlowGraphContext): boolean {
        const ag = this.animationGroup.getValue(context);
        const animation = this.animation.getValue(context);
        if (!ag && !animation) {
            this._reportError(context, "No animation or animation group provided");
            return false;
        } else {
            // if an animation group was already created, dispose it and create a new one
            const currentAnimationGroup = this.currentAnimationGroup.getValue(context);
            if (currentAnimationGroup && currentAnimationGroup !== ag) {
                currentAnimationGroup.dispose();
            }
            let animationGroupToUse = ag;
            let isInterpolation = false;
            let interpolationAnimationsArray: Animation[] | undefined;
            let interpolationTarget: any;
            // check which animation to use. If no animationGroup was defined and an animation was provided, use the animation
            if (animation && !animationGroupToUse) {
                const target = this.object.getValue(context);
                if (!target) {
                    this._reportError(context, "No target object provided");
                    return false;
                }
                const animationsArray = Array.isArray(animation) ? animation : [animation];
                const name = animationsArray[0].name;
                animationGroupToUse = new AnimationGroup("flowGraphAnimationGroup-" + name + "-" + target.name, context.configuration.scene);
                const interpolationAnimations = context._getGlobalContextVariable("interpolationAnimations", []) as number[];
                for (const anim of animationsArray) {
                    animationGroupToUse.addTargetedAnimation(anim, target);
                    if (interpolationAnimations.indexOf(anim.uniqueId) !== -1) {
                        isInterpolation = true;
                    }
                }
                interpolationAnimationsArray = animationsArray;
                interpolationTarget = target;
            }
            // not accepting 0
            const speed = this.speed.getValue(context) || 1;
            const from = this.from.getValue(context) ?? 0;
            // Read the raw end time before it is defaulted to the animation group's natural end, so that an
            // explicitly provided NaN end time can still be detected by the animation/start validation below.
            const rawTo = this.to.getValue(context);
            // not accepting 0
            const to = rawTo || animationGroupToUse.to;

            // KHR_interactivity animation/start validation. Only applies to animation-group playback
            // (animation/start); interpolation uses the `animation` input and has its own validation below.
            // Per the spec the operation activates its `err` flow when the speed is NaN, infinite, or <= 0, or
            // when the end time is NaN. A NaN or infinite start time is caught by the finite check on `from`.
            if (!animation) {
                if (isNaN(rawTo)) {
                    this._reportError(context, "Invalid animation end time");
                    return false;
                }
                // Only validate a speed that was explicitly provided; an unconnected speed keeps the engine
                // default of 1 (matching the historical Babylon behavior for animation/start without a speed).
                if (this.speed.isConnected() || context._hasConnectionValue(this.speed)) {
                    const providedSpeed = this.speed.getValue(context);
                    if (!isFinite(providedSpeed) || providedSpeed <= 0) {
                        this._reportError(context, "Invalid animation speed");
                        return false;
                    }
                }
            }

            // The start value (interpolation start frame / animation start time) must always be finite. For
            // animation/start this also satisfies the spec requirement that a NaN or infinite start time
            // activates the err flow.
            if (!isFinite(from)) {
                this._reportError(context, "Invalid animation duration");
                return false;
            }
            // For interpolation the end value is the animation duration and must be a finite, non-negative number.
            // Animation-group playback (animation/start) instead allows an infinite end time — it means "play to
            // the natural end / loop" (see the `loop` computation below) — and its NaN end time was already
            // rejected above, so the end value is only range-checked here for the interpolation case.
            if (animation && (!isFinite(to) || to < 0)) {
                this._reportError(context, "Invalid animation duration");
                return false;
            }

            // CSS cubic-bezier control points must be finite, and the X components must be in [0, 1].
            if (animation) {
                const animationsArray = Array.isArray(animation) ? animation : [animation];
                for (const anim of animationsArray) {
                    const easing = anim.getEasingFunction?.();
                    if (easing && "x1" in easing) {
                        const bezier = easing as unknown as { x1: number; y1: number; x2: number; y2: number };
                        if (
                            !Number.isFinite(bezier.x1) ||
                            !Number.isFinite(bezier.y1) ||
                            !Number.isFinite(bezier.x2) ||
                            !Number.isFinite(bezier.y2) ||
                            bezier.x1 < 0 ||
                            bezier.x1 > 1 ||
                            bezier.x2 < 0 ||
                            bezier.x2 > 1
                        ) {
                            this._reportError(context, "Invalid bezier curve control points");
                            return false;
                        }
                    }
                }
            }

            // Stop any interpolation already running on the same target/property, but only after validation has
            // passed. An invalid interpolation (bad duration or NaN control points) must report [err] without
            // disturbing an interpolation that is already running on the same target.
            if (isInterpolation && interpolationAnimationsArray && interpolationTarget !== undefined) {
                this._checkInterpolationDuplications(context, interpolationAnimationsArray, interpolationTarget);
            }

            const loop = !isFinite(to) || this.loop.getValue(context);
            this.currentAnimationGroup.setValue(animationGroupToUse, context);

            const currentlyRunningAnimationGroups = context._getGlobalContextVariable("currentlyRunningAnimationGroups", []) as number[];
            // check if it already running
            if (currentlyRunningAnimationGroups.indexOf(animationGroupToUse.uniqueId) !== -1) {
                animationGroupToUse.stop();
            }
            try {
                animationGroupToUse.start(loop, speed, from, to);
                animationGroupToUse.onAnimationGroupEndObservable.add(() => this._onAnimationGroupEnd(context));
                animationGroupToUse.onAnimationEndObservable.add(() => this._eventsSignalOutputs["animationEnd"]._activateSignal(context));
                animationGroupToUse.onAnimationLoopObservable.add(() => this._eventsSignalOutputs["animationLoop"]._activateSignal(context));
                animationGroupToUse.onAnimationGroupLoopObservable.add(() => this._eventsSignalOutputs["animationGroupLoop"]._activateSignal(context));
                currentlyRunningAnimationGroups.push(animationGroupToUse.uniqueId);
                context._setGlobalContextVariable("currentlyRunningAnimationGroups", currentlyRunningAnimationGroups);
            } catch (e) {
                this._reportError(context, e);
                return false;
            }
            return true;
        }
    }

    protected override _reportError(context: FlowGraphContext, error: string | Error): void {
        super._reportError(context, error);
        this.currentFrame.setValue(-1, context);
        this.currentTime.setValue(-1, context);
    }

    /**
     * @internal
     */
    public override _executeOnTick(_context: FlowGraphContext): void {
        const ag = this.currentAnimationGroup.getValue(_context);
        if (ag) {
            this.currentFrame.setValue(ag.getCurrentFrame(), _context);
            this.currentTime.setValue(ag.animatables[0]?.elapsedTime ?? 0, _context);
        }
    }

    public _execute(context: FlowGraphContext): void {
        this._startPendingTasks(context);
    }

    private _onAnimationGroupEnd(context: FlowGraphContext) {
        this._removeFromCurrentlyRunning(context, this.currentAnimationGroup.getValue(context));
        this._resetAfterCanceled(context);
        this.done._activateSignal(context);
    }

    /**
     * The idea behind this function is to check every running animation group and check if the targeted animations it uses are interpolation animations.
     * If they are, we want to see that they don't collide with the current interpolation animations that are starting to play.
     * If they do, we want to stop the already-running animation group.
     * @internal
     */
    private _checkInterpolationDuplications(context: FlowGraphContext, animation: Animation[], target: any) {
        const currentlyRunningAnimationGroups = context._getGlobalContextVariable("currentlyRunningAnimationGroups", []) as number[];
        for (const uniqueId of currentlyRunningAnimationGroups) {
            const ag = context.assetsContext.animationGroups.find((ag) => ag.uniqueId === uniqueId);
            if (ag) {
                for (const anim of ag.targetedAnimations) {
                    for (const animToCheck of animation) {
                        if (anim.animation.targetProperty === animToCheck.targetProperty && anim.target === target) {
                            this._stopAnimationGroup(context, ag);
                        }
                    }
                }
            }
        }
    }

    private _stopAnimationGroup(context: FlowGraphContext, animationGroup: AnimationGroup) {
        // stop, while skipping the on AnimationEndObservable to avoid the "done" signal
        animationGroup.stop(true);
        // Only dispose animation groups that were internally created by this block
        // (i.e. built from individual animations). Scene-provided animation groups
        // must not be disposed as that removes them from the scene catalog and
        // breaks the editor dropdown / re-use on replay.
        if (animationGroup.name.startsWith("flowGraphAnimationGroup-")) {
            animationGroup.dispose();
        }
        this._removeFromCurrentlyRunning(context, animationGroup);
    }

    private _removeFromCurrentlyRunning(context: FlowGraphContext, animationGroup: AnimationGroup) {
        const currentlyRunningAnimationGroups = context._getGlobalContextVariable("currentlyRunningAnimationGroups", []) as number[];
        const idx = currentlyRunningAnimationGroups.indexOf(animationGroup.uniqueId);
        if (idx !== -1) {
            currentlyRunningAnimationGroups.splice(idx, 1);
            context._setGlobalContextVariable("currentlyRunningAnimationGroups", currentlyRunningAnimationGroups);
        }
    }

    /**
     * @internal
     * Stop any currently running animations.
     */
    public override _cancelPendingTasks(context: FlowGraphContext): void {
        const ag = this.currentAnimationGroup.getValue(context);
        if (ag) {
            this._stopAnimationGroup(context, ag);
        }
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.PlayAnimation;
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphPlayAnimationBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphPlayAnimationBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.PlayAnimation, FlowGraphPlayAnimationBlock);
}

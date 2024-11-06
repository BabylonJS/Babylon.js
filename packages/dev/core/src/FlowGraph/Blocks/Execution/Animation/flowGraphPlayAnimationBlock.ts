import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphAsyncExecutionBlock } from "../../../flowGraphAsyncExecutionBlock";
import { RichTypeAny, RichTypeNumber, RichTypeBoolean } from "../../../flowGraphRichTypes";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { AnimationGroup } from "core/Animations/animationGroup";
import type { Animation } from "core/Animations/animation";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

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
     * Will be initialized if no animation group was provided in the configuration.
     */
    public readonly animationGroup: FlowGraphDataConnection<AnimationGroup>;

    /**
     * If provided this animation will be used. Priority will be given to the animation group input.
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
        this.from = this.registerDataInput("from", RichTypeNumber);
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
    public _preparePendingTasks(context: FlowGraphContext): void {
        const ag = this.animationGroup.getValue(context);
        const animation = this.animation.getValue(context);
        if (!ag && !animation) {
            this.error.payload = "No animation group or animation provided";
            this.error._activateSignal(context);
            return;
        } else {
            // if an animation group was created, dispose it and create a new one
            // TODO - is it possible to be sure this aniamtionGroup can be reused?
            const currentAnimationGroup = this.currentAnimationGroup.getValue(context);
            if (currentAnimationGroup && currentAnimationGroup !== ag) {
                currentAnimationGroup.dispose();
            }
            let animationGroupToUse = ag;
            // check which animation to use
            if (animation && !animationGroupToUse) {
                const target = this.object.getValue(context);
                if (!target) {
                    this.error._activateSignal(context);
                    return;
                }
                const name = Array.isArray(animation) ? animation[0].name : animation.name;
                animationGroupToUse = new AnimationGroup("flowGraphAnimationGroup-" + name + "-" + target.name, context.configuration.scene);
                if (Array.isArray(animation)) {
                    for (const anim of animation) {
                        animationGroupToUse.addTargetedAnimation(anim, target);
                    }
                } else {
                    animationGroupToUse.addTargetedAnimation(animation, target);
                }
            }
            // not accepting 0
            const speed = this.speed.getValue(context) || 1;
            const from = this.from.getValue(context) ?? 0;
            // not accepting 0
            const to = this.to.getValue(context) || animationGroupToUse.to;
            const loop = this.loop.getValue(context);
            this.currentAnimationGroup.setValue(animationGroupToUse, context);

            const currentlyRunningAnimationGroups = context._getGlobalContextVariable("currentlyRunningAnimationGroups", []) as number[];
            // check if it already running
            if (currentlyRunningAnimationGroups.indexOf(animationGroupToUse.uniqueId) !== -1) {
                animationGroupToUse.stop();
            }

            animationGroupToUse.start(loop, speed, from, to);
            animationGroupToUse.onAnimationGroupEndObservable.add(() => this._onAnimationGroupEnd(context));
            animationGroupToUse.onAnimationEndObservable.add(() => this._eventsSignalOutputs["animationEnd"]._activateSignal(context));
            animationGroupToUse.onAnimationLoopObservable.add(() => this._eventsSignalOutputs["animationLoop"]._activateSignal(context));
            animationGroupToUse.onAnimationGroupLoopObservable.add(() => this._eventsSignalOutputs["animationGroupLoop"]._activateSignal(context));
            currentlyRunningAnimationGroups.push(animationGroupToUse.uniqueId);
            context._setGlobalContextVariable("currentlyRunningAnimationGroups", currentlyRunningAnimationGroups);
        }
    }

    /**
     * @internal
     */
    public override _executeOnFrame(_context: FlowGraphContext): void {
        const ag = this.currentAnimationGroup.getValue(_context);
        if (ag) {
            this.currentFrame.setValue(ag.getCurrentFrame(), _context);
            this.currentTime.setValue(ag.animatables[0]?.elapsedTime ?? 0, _context);
        }
    }

    public _execute(context: FlowGraphContext): void {
        this._startPendingTasks(context);
        this.out._activateSignal(context);
    }

    private _onAnimationGroupEnd(context: FlowGraphContext) {
        context._removePendingBlock(this);
        this.done._activateSignal(context);
    }

    /**
     * @internal
     * Stop any currently running animations.
     */
    public _cancelPendingTasks(context: FlowGraphContext): void {
        const ag = this.currentAnimationGroup.getValue(context);
        if (ag) {
            ag.stop();
            const currentlyRunningAnimationGroups = context._getGlobalContextVariable("currentlyRunningAnimationGroups", []) as number[];
            // check if it already running
            if (currentlyRunningAnimationGroups.indexOf(ag.uniqueId) !== -1) {
                currentlyRunningAnimationGroups.splice(currentlyRunningAnimationGroups.indexOf(ag.uniqueId), 1);
                context._setGlobalContextVariable("currentlyRunningAnimationGroups", currentlyRunningAnimationGroups);
            }
        }
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.PlayAnimation;
    }
}

RegisterClass(FlowGraphBlockNames.PlayAnimation, FlowGraphPlayAnimationBlock);

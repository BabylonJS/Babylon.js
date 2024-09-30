import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphAsyncExecutionBlock } from "../../../flowGraphAsyncExecutionBlock";
import { RichTypeAny, RichTypeNumber, RichTypeBoolean } from "../../../flowGraphRichTypes";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { AnimationGroup } from "core/Animations/animationGroup";
import type { Animation } from "core/Animations/animation";

/**
 * @experimental
 */
export interface IFlowGraphPlayAnimationBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The animation group that will be played.
     * If not provided an input connection will be available where you can connect (for example) a GetProperty block that returns an AnimationGroup.
     */
    animationGroup?: AnimationGroup;
}
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
    public readonly animationGroupInput: FlowGraphDataConnection<AnimationGroup>;

    /**
     * If provided this animation will be used. Priority will be given to the animation group input.
     */
    public readonly animationInput: FlowGraphDataConnection<Animation>;

    /**
     * Input connection: The target object that will be animated. If animation group is provided this input will be ignored.
     */
    public readonly targetInput: FlowGraphDataConnection<any>;

    public constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphPlayAnimationBlockConfiguration
    ) {
        super(config, ["animationLoop", "animationEnd", "animationGroupLoop"]);

        this.speed = this.registerDataInput("speed", RichTypeNumber);
        this.loop = this.registerDataInput("loop", RichTypeBoolean);
        this.from = this.registerDataInput("from", RichTypeNumber);
        this.to = this.registerDataInput("to", RichTypeNumber);

        this.currentFrame = this.registerDataOutput("currentFrame", RichTypeNumber);
        this.currentTime = this.registerDataOutput("currentTime", RichTypeNumber);

        this.currentAnimationGroup = this.registerDataOutput("currentAnimationGroup", RichTypeAny);
        this.animationGroupInput = this.registerDataInput("animationGroupInput", RichTypeAny, config.animationGroup);
        this.animationInput = this.registerDataInput("animationInput", RichTypeAny);
    }

    /**
     * @internal
     * @param context
     */
    public _preparePendingTasks(context: FlowGraphContext): void {
        const ag = this.animationGroupInput.getValue(context);
        const animation = this.animationInput.getValue(context);
        if (!ag && !animation) {
            throw new Error("No animation provided.");
        } else {
            // if an animation group was created, dispose it and create a new one
            // TODO - is it possible to be sure this aniamtionGroup can be reused?
            const currentAnimationGroup = this.currentAnimationGroup.getValue(context);
            if (currentAnimationGroup) {
                currentAnimationGroup.dispose();
            }
            let animationGroupToUse = ag;
            // check which animation to use
            if (animation && !animationGroupToUse) {
                const target = this.targetInput.getValue(context);
                if (!target) {
                    this.err._activateSignal(context);
                    return;
                }
                animationGroupToUse = new AnimationGroup("flowGraphAnimationGroup-" + animation.name + "-" + target.name, context.configuration.scene);
                animationGroupToUse.addTargetedAnimation(animation, target);
            }
            // not accepting 0
            const speed = this.speed.getValue(context) || 1;
            const from = this.from.getValue(context) ?? 0;
            // not accepting 0
            const to = this.to.getValue(context) || ag.to;
            const loop = this.loop.getValue(context);
            this.currentAnimationGroup.setValue(animationGroupToUse, context);
            animationGroupToUse.start(loop, speed, from, to);
            animationGroupToUse.onAnimationGroupEndObservable.add(() => this._onAnimationGroupEnd(context));
            animationGroupToUse.onAnimationEndObservable.add(() => this._eventsSignalOutputs["animationEnd"]._activateSignal(context));
            animationGroupToUse.onAnimationLoopObservable.add(() => this._eventsSignalOutputs["animationLoop"]._activateSignal(context));
            animationGroupToUse.onAnimationGroupLoopObservable.add(() => this._eventsSignalOutputs["animationGroupLoop"]._activateSignal(context));
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
        }
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphPlayAnimationBlock.ClassName;
    }

    /**
     * Serializes the block to a JSON object.
     * @param serializationObject the object to serialize to.
     */
    public override serialize(serializationObject: any = {}) {
        super.serialize(serializationObject);
        serializationObject.config.targetPath = this.config.targetPath;
        serializationObject.config.animationPath = this.config.animationPath;
    }

    /**
     * Class name of the block.
     */
    public static ClassName = "FGPlayAnimationBlock";
}

RegisterClass(FlowGraphPlayAnimationBlock.ClassName, FlowGraphPlayAnimationBlock);

import type { FlowGraphContext } from "../../../flowGraphContext";
import type { Animatable, Animation, IAnimatable } from "../../../../Animations";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphAsyncExecutionBlock } from "../../../flowGraphAsyncExecutionBlock";
import { RichTypeAny, RichTypeNumber, RichTypeBoolean } from "../../../flowGraphRichTypes";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
/**
 * @experimental
 * A block that plays an animation on an animatable object.
 */
export class FlowGraphPlayAnimationBlock extends FlowGraphAsyncExecutionBlock {
    /**
     * Input connection: The target to play the animation on.
     */
    public readonly target: FlowGraphDataConnection<IAnimatable>;
    /**
     * Input connection: The animation to play.
     */
    public readonly animation: FlowGraphDataConnection<Animation>;
    /**
     * Input connection: The speed of the animation.
     */
    public readonly speed: FlowGraphDataConnection<number>;
    /**
     * Input connection: Should the animation loop?
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
     * Output connection: The signal that is triggered when the animation ends.
     */
    public readonly onAnimationEnd: FlowGraphSignalConnection;

    /**
     * Output connection: The animatable that is currently running.
     */
    public readonly runningAnimatable: FlowGraphDataConnection<Animatable>;

    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.target = this._registerDataInput("target", RichTypeAny);
        this.animation = this._registerDataInput("animation", RichTypeAny);
        this.speed = this._registerDataInput("speed", RichTypeNumber);
        this.loop = this._registerDataInput("loop", RichTypeBoolean);
        this.from = this._registerDataInput("from", RichTypeNumber);
        this.to = this._registerDataInput("to", RichTypeNumber);

        this.onAnimationEnd = this._registerSignalOutput("onAnimationEnd");
        this.runningAnimatable = this._registerDataOutput("runningAnimatable", RichTypeAny);
    }

    /**
     * @internal
     * @param context
     */
    public _preparePendingTasks(context: FlowGraphContext): void {
        const targetValue = this.target.getValue(context);
        const animationValue = this.animation.getValue(context) as Animation;

        if (!targetValue || !animationValue) {
            throw new Error("Cannot play animation without target or animation");
        }

        const contextAnimatables = (context._getExecutionVariable(this, "runningAnimatables") as Animatable[]) ?? [];

        // was an animation started on this target already and was just paused? if so, we can unpause it.
        const existingAnimatable = this.runningAnimatable.getValue(context);
        if (existingAnimatable && existingAnimatable.paused) {
            existingAnimatable.restart();
        } else {
            const scene = context.configuration.scene;
            const animatable = scene.beginDirectAnimation(
                targetValue,
                [animationValue],
                this.from.getValue(context),
                this.to.getValue(context),
                this.loop.getValue(context),
                this.speed.getValue(context),
                () => this._onAnimationEnd(animatable, context)
            );
            this.runningAnimatable.setValue(animatable, context);
            contextAnimatables.push(animatable);
        }

        context._setExecutionVariable(this, "runningAnimatables", contextAnimatables);
    }

    public _execute(context: FlowGraphContext): void {
        this._startPendingTasks(context);

        this.onDone._activateSignal(context);
    }

    private _onAnimationEnd(animatable: Animatable, context: FlowGraphContext) {
        const contextAnims = (context._getExecutionVariable(this, "runningAnimatables") as Animatable[]) ?? [];
        const index = contextAnims.indexOf(animatable);
        if (index !== -1) {
            contextAnims.splice(index, 1);
        }
        context._removePendingBlock(this);
        this.onAnimationEnd._activateSignal(context);
    }

    /**
     * @internal
     * Stop any currently running animations.
     */
    public _cancelPendingTasks(context: FlowGraphContext): void {
        const contextAnims = (context._getExecutionVariable(this, "runningAnimatables") as Animatable[]) ?? [];
        for (const anim of contextAnims) {
            anim.stop();
        }
        context._deleteExecutionVariable(this, "runningAnimatables");
    }

    public getClassName(): string {
        return "FGPlayAnimationBlock";
    }
}

RegisterClass("FGPlayAnimationBlock", FlowGraphPlayAnimationBlock);

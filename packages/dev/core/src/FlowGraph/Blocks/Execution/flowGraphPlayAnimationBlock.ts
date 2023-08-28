import type { FlowGraphContext } from "../../flowGraphContext";
import type { Animatable, Animation } from "../../../Animations";
import { FlowGraphConnectionType } from "../../flowGraphConnection";
import { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphSignalConnection } from "../../flowGraphSignalConnection";
import type { Scene } from "../../../scene";
import { FlowGraphAsyncExecutionBlock } from "../../flowGraphAsyncExecutionBlock";
import { FlowGraphValueType } from "core/FlowGraph/flowGraphTypes";

/**
 * @experimental
 * A block that plays an animation on an animatable object.
 */
export class FlowGraphPlayAnimationBlock extends FlowGraphAsyncExecutionBlock {
    /**
     * The target to play the animation on.
     */
    public readonly target: FlowGraphDataConnection;
    /**
     * The animation to play.
     */
    public readonly animation: FlowGraphDataConnection;
    /**
     * The speed of the animation.
     */
    public readonly speed: FlowGraphDataConnection;
    /**
     * Should the animation loop?
     */
    public readonly loop: FlowGraphDataConnection;
    /**
     * The starting frame of the animation.
     */
    public readonly from: FlowGraphDataConnection;
    /**
     * The ending frame of the animation.
     */
    public readonly to: FlowGraphDataConnection;

    /**
     * The signal that is triggered when the animation ends.
     */
    public readonly onAnimationEnd: FlowGraphSignalConnection;

    public constructor() {
        super();

        this.target = new FlowGraphDataConnection("target", FlowGraphConnectionType.Input, this, FlowGraphValueType.Any);
        this.animation = new FlowGraphDataConnection("animation", FlowGraphConnectionType.Input, this, FlowGraphValueType.Any);
        this.speed = new FlowGraphDataConnection("speed", FlowGraphConnectionType.Input, this, FlowGraphValueType.Float);
        this.speed.value = 1;
        this.loop = new FlowGraphDataConnection("loop", FlowGraphConnectionType.Input, this, FlowGraphValueType.Boolean);
        this.from = new FlowGraphDataConnection("from", FlowGraphConnectionType.Input, this, FlowGraphValueType.Float);
        this.to = new FlowGraphDataConnection("to", FlowGraphConnectionType.Input, this, FlowGraphValueType.Float);
        this.to.value = 100;

        this.onAnimationEnd = new FlowGraphSignalConnection("onAnimationEnd", FlowGraphConnectionType.Output, this);
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

        const contextAnims = (context._getExecutionVariable(this, "runningAnimatables") as Animatable[] | undefined) ?? [];

        const scene = context._getGraphVariable("scene") as Scene;
        const animatable = scene.beginDirectAnimation(
            targetValue,
            [animationValue],
            this.from.getValue(context)!,
            this.to.getValue(context)!,
            this.loop.getValue(context),
            this.speed.getValue(context),
            () => this._onAnimationEnd(animatable, context)
        );
        contextAnims.push(animatable);

        context._setExecutionVariable(this, "runningAnimatables", contextAnims);
    }

    public _execute(context: FlowGraphContext): void {
        this._startPendingTasks(context);

        this.onDone._activateSignal(context);
    }

    private _onAnimationEnd(animatable: Animatable, context: FlowGraphContext) {
        const contextAnims = (context._getExecutionVariable(this, "runningAnimatables") as Animatable[] | undefined) ?? [];
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
        const contextAnims = (context._getExecutionVariable(this, "runningAnimatables") as Animatable[] | undefined) ?? [];
        for (const anim of contextAnims) {
            anim.stop();
        }
        context._deleteExecutionVariable(this, "runningAnimatables");
    }
}

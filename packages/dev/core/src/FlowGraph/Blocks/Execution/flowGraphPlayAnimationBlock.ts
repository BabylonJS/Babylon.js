import type { IAnimatable, Animatable } from "../../../Animations";
import type { Animation } from "../../../Animations/animation";
import type { FlowGraph } from "../../../FlowGraph/flowGraph";
import { FlowGraphConnectionType } from "../../flowGraphConnection";
import { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphSignalConnection } from "../../flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 */
export interface IFlowGraphPlayAnimationBlockParams {
    defaultTarget: IAnimatable;
    defaultAnimation: Animation;
}
/**
 * @experimental
 * A block that plays an animation on an animatable object.
 */
export class FlowGraphPlayAnimationBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * The target to play the animation on.
     */
    public readonly target: FlowGraphDataConnection<IAnimatable>;
    /**
     * The animation to play.
     */
    public readonly animation: FlowGraphDataConnection<Animation>;
    /**
     * The speed of the animation.
     */
    public readonly speed: FlowGraphDataConnection<number>;
    /**
     * Should the animation loop?
     */
    public readonly loop: FlowGraphDataConnection<boolean>;
    /**
     * The starting frame of the animation.
     */
    public readonly from: FlowGraphDataConnection<number>;
    /**
     * The ending frame of the animation.
     */
    public readonly to: FlowGraphDataConnection<number>;

    /**
     * The signal that is triggered when the animation ends.
     */
    public readonly onAnimationEnd: FlowGraphSignalConnection;

    private _runningAnimatables: Array<Animatable> = [];

    public constructor(graph: FlowGraph, params: IFlowGraphPlayAnimationBlockParams) {
        super(graph);

        this.target = new FlowGraphDataConnection<IAnimatable>("target", FlowGraphConnectionType.Input, this, params.defaultTarget);
        this.animation = new FlowGraphDataConnection<Animation>("animation", FlowGraphConnectionType.Input, this, params.defaultAnimation);
        this.speed = new FlowGraphDataConnection<number>("speed", FlowGraphConnectionType.Input, this, 1);
        this.loop = new FlowGraphDataConnection<boolean>("loop", FlowGraphConnectionType.Input, this, false);
        this.from = new FlowGraphDataConnection<number>("from", FlowGraphConnectionType.Input, this, 0);
        this.to = new FlowGraphDataConnection<number>("to", FlowGraphConnectionType.Input, this, 100);

        this.onAnimationEnd = new FlowGraphSignalConnection("onAnimationEnd", FlowGraphConnectionType.Output, this);
    }

    public _execute(): void {
        const targetValue = this.target.value;
        const animationValue = this.animation.value;

        const animatable = this._graph.scene.beginDirectAnimation(targetValue, [animationValue], this.from.value, this.to.value, this.loop.value, this.speed.value, () =>
            this._onAnimationEnd(animatable)
        );
        this._runningAnimatables.push(animatable);

        this.onDone._activateSignal();
    }

    private _onAnimationEnd(animatable: Animatable) {
        const index = this._runningAnimatables.indexOf(animatable);
        if (index !== -1) {
            this._runningAnimatables.splice(index, 1);
        }
        this.onAnimationEnd._activateSignal();
    }

    /**
     * @internal
     * Stop any currently running animations.
     */
    public _cancelPendingTasks(): void {
        for (const anim of this._runningAnimatables) {
            anim.stop();
        }
        this._runningAnimatables.length = 0;
    }
}

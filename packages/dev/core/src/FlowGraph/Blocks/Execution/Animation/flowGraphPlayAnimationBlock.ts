import type { FlowGraphContext } from "../../../flowGraphContext";
import type { Animatable } from "../../../../Animations/animatable";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphAsyncExecutionBlock } from "../../../flowGraphAsyncExecutionBlock";
import { RichTypeAny, RichTypeNumber, RichTypeBoolean } from "../../../flowGraphRichTypes";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import type { IPathToObjectConverter } from "../../../../ObjectModel/objectModelInterfaces";
import { FlowGraphPathConverterComponent } from "../../../flowGraphPathConverterComponent";
import type { IObjectAccessor } from "../../../typeDefinitions";

/**
 * @experimental
 */
export interface IFlowGraphPlayAnimationBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The path to the target object that will be animated.
     */
    targetPath: string;
    /**
     * The path to the animation that will be played.
     */
    animationPath: string;
    /**
     * The path converter to use to convert the path to an object accessor.
     */
    pathConverter: IPathToObjectConverter<IObjectAccessor>;
}
/**
 * @experimental
 * A block that plays an animation on an animatable object.
 */
export class FlowGraphPlayAnimationBlock extends FlowGraphAsyncExecutionBlock {
    /**
     * The substitution inputs for template strings in the target
     */
    public readonly templateTargetComponent: FlowGraphPathConverterComponent;
    /**
     * The substitution inputs for template strings in the animation
     */
    public readonly templateAnimationComponent: FlowGraphPathConverterComponent;
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
     * Output connection: The animatable that is currently running.
     */
    public readonly runningAnimatable: FlowGraphDataConnection<Animatable>;

    public constructor(
        /**
         * the configuration of the block
         */
        public config: IFlowGraphPlayAnimationBlockConfiguration
    ) {
        super(config);

        this.templateTargetComponent = new FlowGraphPathConverterComponent(config.targetPath, this);
        this.templateAnimationComponent = new FlowGraphPathConverterComponent(config.animationPath, this);

        this.speed = this.registerDataInput("speed", RichTypeNumber);
        this.loop = this.registerDataInput("loop", RichTypeBoolean);
        this.from = this.registerDataInput("from", RichTypeNumber);
        this.to = this.registerDataInput("to", RichTypeNumber);

        this.runningAnimatable = this.registerDataOutput("runningAnimatable", RichTypeAny);
    }

    /**
     * @internal
     * @param context
     */
    public _preparePendingTasks(context: FlowGraphContext): void {
        const targetAccessor = this.templateTargetComponent.getAccessor(this.config.pathConverter, context);
        const targetValue = targetAccessor.info.getObject(targetAccessor.object);
        const animationAccessor = this.templateAnimationComponent.getAccessor(this.config.pathConverter, context);
        const animationValue = animationAccessor.info.get(animationAccessor.object);

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

        this.out._activateSignal(context);
    }

    private _onAnimationEnd(animatable: Animatable, context: FlowGraphContext) {
        const contextAnims = (context._getExecutionVariable(this, "runningAnimatables") as Animatable[]) ?? [];
        const index = contextAnims.indexOf(animatable);
        if (index !== -1) {
            contextAnims.splice(index, 1);
        }
        context._removePendingBlock(this);
        this.done._activateSignal(context);
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

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return FlowGraphPlayAnimationBlock.ClassName;
    }

    /**
     * Serializes the block to a JSON object.
     * @param serializationObject the object to serialize to.
     */
    public serialize(serializationObject: any = {}) {
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

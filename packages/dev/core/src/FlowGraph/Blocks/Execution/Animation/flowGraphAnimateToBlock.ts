import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import { RegisterClass } from "../../../../Misc";
import { Animation, CircleEase } from "../../../../Animations";
import { FlowGraphAsyncExecutionBlock } from "../../../flowGraphAsyncExecutionBlock";
import { FlowGraphPathComponent } from "../../../flowGraphPathComponent";
import type { FlowGraphPath } from "../../../flowGraphPath";

export interface IFlowGraphAnimateToBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The variable path of the entity whose property will be set. Needs a corresponding
     * entity on the context variables with that variable name.
     */
    path: FlowGraphPath;
    easingType: string;
    easingDuration: number;
}

export class FlowGraphAnimateToBlock<ValueT> extends FlowGraphAsyncExecutionBlock {
    /**
     * The value to animate to
     */
    public readonly a: FlowGraphDataConnection<ValueT>;
    /**
     * The component with the templated inputs for the provided path.
     */
    public readonly templateComponent: FlowGraphPathComponent;

    public constructor(public config: IFlowGraphAnimateToBlockConfiguration) {
        super(config);
        this.templateComponent = new FlowGraphPathComponent(config.path, this);
        this.a = this.registerDataInput("a", RichTypeAny);
    }

    public getEasingFunctionFromEasingType(easingType: string) {
        // todo fill the function when we have the definition of this block
        return new CircleEase();
    }

    public _preparePendingTasks(context: FlowGraphContext): void {
        let runningAnimatable = context._getExecutionVariable(this, "runningAnimatable");
        if (!runningAnimatable) {
            const target = this.templateComponent.getTarget(context);
            const property = this.templateComponent.getPropertyPath(context);
            const a = this.a.getValue(context);
            const easingType = this.config.easingType;
            const easingDuration = this.config.easingDuration;
            const fps = 60;
            const numFrames = easingDuration * fps;
            const easing = this.getEasingFunctionFromEasingType(easingType);

            if (target !== undefined && property !== undefined) {
                runningAnimatable = Animation.CreateAndStartAnimation("flowGraphAnimateToBlock", target, property, fps, numFrames, target[property], a, 0, easing, () =>
                    this._onAnimationDone(context)
                );
            } else {
                throw new Error("Invalid target or property.");
            }
            if (runningAnimatable) {
                context._setExecutionVariable(this, "runningAnimatable", runningAnimatable);
            } else {
                throw new Error("Invalid animatable.");
            }
        }
    }

    public _execute(context: FlowGraphContext): void {
        this._preparePendingTasks(context);
        this.out._activateSignal(context);
    }

    public _cancelPendingTasks(context: FlowGraphContext): void {
        const runningAnimatable = context._getExecutionVariable(this, "runningAnimatable");
        if (runningAnimatable) {
            runningAnimatable.stop();
            context._setExecutionVariable(this, "runningAnimatable", undefined);
        }
    }

    private _onAnimationDone(context: FlowGraphContext) {
        this.done._activateSignal(context);
    }

    public getClassName(): string {
        return FlowGraphAnimateToBlock.ClassName;
    }

    public static ClassName = "FGAnimateToBlock";
}
RegisterClass(FlowGraphAnimateToBlock.ClassName, FlowGraphAnimateToBlock);

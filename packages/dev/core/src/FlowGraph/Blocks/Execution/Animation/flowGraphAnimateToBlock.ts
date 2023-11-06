import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import { RegisterClass } from "../../../../Misc";
import { Animation, CircleEase } from "../../../../Animations";
import { FlowGraphAsyncExecutionBlock } from "../../../flowGraphAsyncExecutionBlock";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";

export interface IFlowGraphAnimateToBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The path of the entity whose property will be set. Needs a corresponding
     * entity on the context.pathMap variable.
     */
    path: string;
    /**
     * The property to set on the target object.
     */
    property: string;
    /**
     * A string that will be substituted by a node with the same name if involved in curly braces.
     */
    subString: string;
    easingType: string;
    easingDuration: number;
}

export class FlowGraphAnimateToBlock<ValueT> extends FlowGraphAsyncExecutionBlock {
    /**
     * The value to animate to
     */
    public readonly a: FlowGraphDataConnection<ValueT>;
    /**
     * The signal that will be activated when the animation is done.
     */
    public readonly out: FlowGraphSignalConnection;

    public constructor(public config: IFlowGraphAnimateToBlockConfiguration) {
        super(config);

        this.a = this._registerDataInput("a", RichTypeAny);
        if (config.subString) {
            this._registerDataInput(config.subString, RichTypeAny);
        }
        this.out = this._registerSignalOutput("out");
    }

    public getEasingFunctionFromEasingType(easingType: string) {
        // todo fill the function
        return new CircleEase();
    }

    public _preparePendingTasks(context: FlowGraphContext): void {
        let runningAnimatable = context._getExecutionVariable(this, "runningAnimatable");
        if (!runningAnimatable) {
            const target = context._getTargetFromPath(this.config.path, this.config.subString, this);
            const property = this.config.property;
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
    }

    public _cancelPendingTasks(context: FlowGraphContext): void {
        const runningAnimatable = context._getExecutionVariable(this, "runningAnimatable");
        if (runningAnimatable) {
            runningAnimatable.stop();
            context._setExecutionVariable(this, "runningAnimatable", undefined);
        }
    }

    private _onAnimationDone(context: FlowGraphContext) {
        this.out._activateSignal(context);
    }

    public getClassName(): string {
        return FlowGraphAnimateToBlock.ClassName;
    }

    public static ClassName = "FGAnimateToBlock";
}
RegisterClass(FlowGraphAnimateToBlock.ClassName, FlowGraphAnimateToBlock);

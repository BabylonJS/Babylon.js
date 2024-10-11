import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { AnimationGroup } from "core/Animations/animationGroup";
/**
 * @experimental
 * Block that stops a running animation
 */
export class FlowGraphStopAnimationBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * The name of the block.
     */
    public static readonly ClassName = "FGStopAnimationBlock";
    /**
     * Input connection: The animation to stop.
     */
    public readonly animationGroup: FlowGraphDataConnection<AnimationGroup>;

    /**
     * Input connection - if defined (positive integer) the animation will stop at this frame.
     */
    public readonly stopAtFrame: FlowGraphDataConnection<number>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.animationGroup = this.registerDataInput("animationGroup", RichTypeAny);
        this.stopAtFrame = this.registerDataInput("stopAtFrame", RichTypeAny, -1);
    }

    public _execute(context: FlowGraphContext): void {
        const animationToStopValue = this.animationGroup.getValue(context);
        const currentlyRunning = context._getGlobalContextVariable("currentlyRunningAnimationGroups", []) as number[];
        const index = currentlyRunning.indexOf(animationToStopValue.uniqueId);
        if (index !== -1) {
            animationToStopValue.stop();
            currentlyRunning.splice(index, 1);
        }
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphStopAnimationBlock.ClassName;
    }
}
RegisterClass(FlowGraphStopAnimationBlock.ClassName, FlowGraphStopAnimationBlock);

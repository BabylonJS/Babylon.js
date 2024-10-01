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
     * Input connection: The animation to stop.
     */
    public readonly animationToStop: FlowGraphDataConnection<AnimationGroup>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.animationToStop = this.registerDataInput("animationToStop", RichTypeAny);
    }

    public _execute(context: FlowGraphContext): void {
        const animationToStopValue = this.animationToStop.getValue(context);
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
        return "FGStopAnimationBlock";
    }
}
RegisterClass("FGStopAnimationBlock", FlowGraphStopAnimationBlock);

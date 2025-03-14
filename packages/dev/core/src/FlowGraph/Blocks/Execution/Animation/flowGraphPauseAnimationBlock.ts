import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { AnimationGroup } from "core/Animations/animationGroup";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
/**
 * @experimental
 * Block that pauses a running animation
 */
export class FlowGraphPauseAnimationBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The animation to pause.
     */
    public readonly animationToPause: FlowGraphDataConnection<AnimationGroup>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.animationToPause = this.registerDataInput("animationToPause", RichTypeAny);
    }

    public _execute(context: FlowGraphContext): void {
        const animationToPauseValue = this.animationToPause.getValue(context);
        animationToPauseValue.pause();
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.PauseAnimation;
    }
}
RegisterClass(FlowGraphBlockNames.PauseAnimation, FlowGraphPauseAnimationBlock);

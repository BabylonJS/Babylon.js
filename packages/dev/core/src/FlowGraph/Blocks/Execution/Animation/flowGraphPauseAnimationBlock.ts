import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import type { Animatable } from "../../../../Animations";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * @experimental
 * Block that pauses a running animation
 */
export class FlowGraphPauseAnimationBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The animation to pause.
     */
    public readonly animationToPause: FlowGraphDataConnection<Animatable>;

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
    public getClassName(): string {
        return "FGPauseAnimationBlock";
    }
}
RegisterClass("FGPauseAnimationBlock", FlowGraphPauseAnimationBlock);

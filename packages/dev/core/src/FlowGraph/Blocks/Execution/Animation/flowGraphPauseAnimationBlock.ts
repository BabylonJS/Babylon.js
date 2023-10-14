import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../../flowGraphWithOnDoneExecutionBlock";
import type { Animatable } from "../../../../Animations";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * @experimental
 * Block that stops a running animation
 */
export class FlowGraphPauseAnimationBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     *
     */
    public readonly animationToPause: FlowGraphDataConnection<Animatable>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.animationToPause = this._registerDataInput("animationToPause", RichTypeAny);
    }

    public _execute(context: FlowGraphContext): void {
        const animationToPauseValue = this.animationToPause.getValue(context);
        animationToPauseValue.pause();
        this.onDone._activateSignal(context);
    }

    public getClassName(): string {
        return "FGPauseAnimationBlock";
    }
}
RegisterClass("FGPauseAnimationBlock", FlowGraphPauseAnimationBlock);

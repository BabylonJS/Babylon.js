import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../../flowGraphWithOnDoneExecutionBlock";
import type { Animatable } from "../../../../Animations";
import { RichTypeAny } from "../../../flowGraphRichTypes";

/**
 * @experimental
 * Block that stops a running animation
 */
export class FlowGraphPauseAnimationBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     *
     */
    public readonly animationToPause: FlowGraphDataConnection<Animatable>;

    constructor() {
        super();
        this.animationToPause = this._registerDataInput("animationToPause", RichTypeAny);
    }

    public _execute(context: FlowGraphContext): void {
        const animationToPauseValue = this.animationToPause.getValue(context);
        animationToPauseValue.pause();
        this.onDone._activateSignal(context);
    }
}

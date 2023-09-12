import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import type { Animatable } from "../../../Animations";
import { RichTypeAny } from "../../flowGraphRichTypes";

/**
 * @experimental
 * Block that stops a running animation
 */
export class FlowGraphStopAnimationBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     *
     */
    public readonly animationToStop: FlowGraphDataConnection<Animatable>;

    constructor() {
        super();
        this.animationToStop = this._registerDataInput("animationToStop", RichTypeAny);
    }

    public _execute(context: FlowGraphContext): void {
        const animationToStopValue = this.animationToStop.getValue(context);
        animationToStopValue.stop();
        this.onDone._activateSignal(context);
    }
}

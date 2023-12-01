import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphWithOnDoneExecutionBlock";
import type { Animatable } from "../../../../Animations";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * @experimental
 * Block that stops a running animation
 */
export class FlowGraphStopAnimationBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     *
     */
    public readonly animationToStop: FlowGraphDataConnection<Animatable>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.animationToStop = this.registerDataInput("animationToStop", RichTypeAny);
    }

    public _execute(context: FlowGraphContext): void {
        const animationToStopValue = this.animationToStop.getValue(context);
        animationToStopValue.stop();
        this.out._activateSignal(context);
    }

    public getClassName(): string {
        return "FGStopAnimationBlock";
    }
}
RegisterClass("FGStopAnimationBlock", FlowGraphStopAnimationBlock);

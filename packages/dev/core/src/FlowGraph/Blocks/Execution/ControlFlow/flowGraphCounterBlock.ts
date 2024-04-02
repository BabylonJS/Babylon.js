import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeNumber } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
/**
 * @experimental
 * A block that counts the number of times it has been called.
 */
export class FlowGraphCounterBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Output connection: The number of times the block has been called.
     */
    public readonly count: FlowGraphDataConnection<number>;
    /**
     * Input connection: Resets the counter.
     */
    public readonly reset: FlowGraphSignalConnection;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.count = this.registerDataOutput("count", RichTypeNumber);
        this.reset = this._registerSignalInput("reset");
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        if (callingSignal === this.reset) {
            context._setExecutionVariable(this, "count", 0);
            this.count.setValue(0, context);
            return;
        }
        const countValue = (context._getExecutionVariable(this, "count") ?? 0) + 1;

        context._setExecutionVariable(this, "count", countValue);
        this.count.setValue(countValue, context);
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return "FGCounterBlock";
    }
}
RegisterClass("FGCounterBlock", FlowGraphCounterBlock);

import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeNumber } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";

/**
 * @experimental
 */
export interface IFlowGraphDoNBlockConfiguration extends IFlowGraphBlockConfiguration {
    startIndex: number;
}
/**
 * A block that executes a branch a set number of times.
 * @experimental
 */
export class FlowGraphDoNBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: Resets the counter
     */
    public readonly reset: FlowGraphSignalConnection;
    /**
     * Input connection: The maximum number of times the block can be executed.
     */
    public readonly n: FlowGraphDataConnection<number>;
    /**
     * Output connection: The number of times the block has been executed.
     */
    public readonly value: FlowGraphDataConnection<number>;

    constructor(public config: IFlowGraphDoNBlockConfiguration = { startIndex: 0 }) {
        super(config);
        this.reset = this._registerSignalInput("reset");
        this.n = this.registerDataInput("n", RichTypeNumber);
        this.value = this.registerDataOutput("value", RichTypeNumber);
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        if (callingSignal === this.reset) {
            this.value.setValue(this.config.startIndex, context);
        } else {
            const currentCountValue = this.value.getValue(context);
            if (currentCountValue < this.n.getValue(context)) {
                this.value.setValue(currentCountValue + 1, context);
                this.out._activateSignal(context);
            }
        }
    }

    public getClassName(): string {
        return FlowGraphDoNBlock.ClassName;
    }

    public static ClassName = "FGDoNBlock";
}
RegisterClass(FlowGraphDoNBlock.ClassName, FlowGraphDoNBlock);

/** This file must only contain pure code and pure imports */

import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { RichTypeNumber } from "../../../flowGraphRichTypes.pure";
import { type FlowGraphSignalConnection } from "../../../flowGraphSignalConnection.pure";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * A block that counts the number of times it has been called.
 * Afterwards it activates its out signal.
 */
export class FlowGraphCallCounterBlock extends FlowGraphExecutionBlockWithOutSignal {
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
        const countValue = context._getExecutionVariable(this, "count", 0) + 1;

        context._setExecutionVariable(this, "count", countValue);
        this.count.setValue(countValue, context);
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.CallCounter;
    }
}


let _registered = false;
export function registerFlowGraphCounterBlock(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    RegisterClass(FlowGraphBlockNames.CallCounter, FlowGraphCallCounterBlock);
}

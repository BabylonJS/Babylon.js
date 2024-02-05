import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock";
import { RichTypeAny } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * @experimental
 * Configuration for a switch block.
 */
export interface IFlowGraphSwitchBlockConfiguration<T> extends IFlowGraphBlockConfiguration {
    /**
     * The possible values for the selection.
     */
    cases: T[];
}

/**
 * @experimental
 * A block that executes a branch based on a selection.
 */
export class FlowGraphSwitchBlock<T> extends FlowGraphExecutionBlock {
    /**
     * Input connection: The value of the selection.
     */
    public readonly selection: FlowGraphDataConnection<T>;
    /**
     * Output connection: The output flows.
     */
    public outputFlows: FlowGraphSignalConnection[];

    constructor(
        /**
         * the configuration of the block
         */
        public config: IFlowGraphSwitchBlockConfiguration<T>
    ) {
        super(config);

        this.selection = this.registerDataInput("selection", RichTypeAny);
        this.outputFlows = [];
        for (let i = 0; i <= this.config.cases.length; i++) {
            this.outputFlows.push(this._registerSignalOutput(`out${i}`));
        }
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        const selectionValue = this.selection.getValue(context);

        for (let i = 0; i < this.config.cases.length; i++) {
            if (selectionValue === this.config.cases[i]) {
                this.outputFlows[i]._activateSignal(context);
                return;
            }
        }

        // default case
        this.outputFlows[this.outputFlows.length - 1]._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return "FGSwitchBlock";
    }

    /**
     * Serialize the block to a JSON representation.
     * @param serializationObject the object to serialize to.
     */
    public serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.cases = this.config.cases;
    }
}
RegisterClass("FGSwitchBlock", FlowGraphSwitchBlock);

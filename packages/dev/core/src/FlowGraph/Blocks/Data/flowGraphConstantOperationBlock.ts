import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { RichType } from "../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
/**
 * @experimental
 * Block that outputs a value of type ResultT, resulting of an operation with no inputs.
 */
export class FlowGraphConstantOperationBlock<ResultT> extends FlowGraphBlock {
    public output: FlowGraphDataConnection<ResultT>;

    constructor(config: IFlowGraphBlockConfiguration, richType: RichType<ResultT>, private _operation: () => ResultT) {
        super(config);
        this.output = this._registerDataOutput("output", richType);
    }

    public _updateOutputs(context: FlowGraphContext): void {
        this.output.setValue(this._operation(), context);
    }
}

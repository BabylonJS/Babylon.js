import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { RichType } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";

/**
 * @experimental
 * The base block for all unary operation blocks. Receives an input of type InputT, and outputs a value of type ResultT.
 */
export class FlowGraphUnaryOperationBlock<InputT, ResultT> extends FlowGraphBlock {
    input: FlowGraphDataConnection<InputT>;
    output: FlowGraphDataConnection<ResultT>;

    constructor(
        inputRichType: RichType<InputT>,
        resultRichType: RichType<ResultT>,
        private _operation: (input: InputT) => ResultT,
        private _className: string,
        config?: IFlowGraphBlockConfiguration
    ) {
        super(config);
        this.input = this._registerDataInput("input", inputRichType);
        this.output = this._registerDataOutput("resultOutput", resultRichType);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        this.output.setValue(this._operation(this.input.getValue(_context)), _context);
    }

    public getClassName(): string {
        return this._className;
    }
}

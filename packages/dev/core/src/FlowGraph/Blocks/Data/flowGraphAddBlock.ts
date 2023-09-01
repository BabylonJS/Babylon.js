import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeNumber } from "../../flowGraphRichTypes";

/**
 * @experimental
 */
export class FlowGraphAddNumbersBlock extends FlowGraphBlock {
    public readonly numberLeft: FlowGraphDataConnection<number>;
    public readonly numberRight: FlowGraphDataConnection<number>;
    public readonly output: FlowGraphDataConnection<number>;

    constructor() {
        super();
        this.numberLeft = this._registerDataInput("numberLeft", RichTypeNumber);
        this.numberRight = this._registerDataInput("numberRight", RichTypeNumber);
        this.output = this._registerDataOutput("output", RichTypeNumber);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        this.output.value = this.numberLeft.getValue(_context) + this.numberRight.getValue(_context);
    }
}

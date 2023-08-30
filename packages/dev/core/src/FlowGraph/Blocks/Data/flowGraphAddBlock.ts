import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypes } from "../../flowGraphRichTypes";

/**
 * @experimental
 */
export class FlowGraphAddNumbersBlock extends FlowGraphBlock {
    public readonly numberLeft: FlowGraphDataConnection<number>;
    public readonly numberRight: FlowGraphDataConnection<number>;
    public readonly output: FlowGraphDataConnection<number>;

    constructor() {
        super();
        this.numberLeft = this._registerDataInput("numberLeft", RichTypes.Number);
        this.numberRight = this._registerDataInput("numberRight", RichTypes.Number);
        this.output = this._registerDataOutput("output", RichTypes.Number);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        this.output.value = this.numberLeft.getValue(_context) + this.numberRight.getValue(_context);
    }
}

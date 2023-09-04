import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeNumber } from "../../flowGraphRichTypes";

/**
 * A block that adds two numbers.
 * @experimental
 */
export class FlowGraphAddNumbersBlock extends FlowGraphBlock {
    /**
     * Input connection: The first number to add.
     */
    public readonly numberLeft: FlowGraphDataConnection<number>;
    /**
     * Input connection: The second number to add.
     */
    public readonly numberRight: FlowGraphDataConnection<number>;
    /**
     * Output connection: The sum of the two numbers.
     */
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

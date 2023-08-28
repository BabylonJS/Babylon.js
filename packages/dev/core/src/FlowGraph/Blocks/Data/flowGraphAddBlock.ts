import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import { FlowGraphValueType } from "../../flowGraphTypes";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";

/**
 * @experimental
 */
export class FlowGraphAddNumbersBlock extends FlowGraphBlock {
    public readonly numberLeft: FlowGraphDataConnection;
    public readonly numberRight: FlowGraphDataConnection;
    public readonly output: FlowGraphDataConnection;

    constructor() {
        super();
        this.numberLeft = this._registerDataInput("numberLeft", FlowGraphValueType.Float);
        this.numberRight = this._registerDataInput("numberRight", FlowGraphValueType.Float);
        this.output = this._registerDataOutput("output", FlowGraphValueType.Float);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        this.output.value = this.numberLeft.getValue(_context) + this.numberRight.getValue(_context);
    }
}

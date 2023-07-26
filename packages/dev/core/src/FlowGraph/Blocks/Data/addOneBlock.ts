import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnectionPoint } from "../../flowGraphConnectionPoint";
import type { DataUpdater } from "../../iDataUpdater";

export class AddOneBlock extends FlowGraphBlock implements DataUpdater {
    public input: FlowGraphDataConnectionPoint<number>;
    public output: FlowGraphDataConnectionPoint<number>;

    constructor(graph: FlowGraph) {
        super(graph);

        this.input = this._registerDataInput("input", 0);
        this.output = this._registerDataOutput("output", 0);
    }

    public updateOutputs(): void {
        this.output.value = this.input.value + 1;
    }
}

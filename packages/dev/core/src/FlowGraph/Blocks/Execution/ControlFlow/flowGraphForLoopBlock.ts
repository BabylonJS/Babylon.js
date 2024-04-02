import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "core/FlowGraph/flowGraphExecutionBlockWithOutSignal";
import type { FlowGraphContext } from "../../../flowGraphContext";
import { RichTypeNumber } from "../../../flowGraphRichTypes";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
/**
 * @experimental
 * Block that executes an action in a loop.
 */
export class FlowGraphForLoopBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The start index of the loop.
     */
    public readonly startIndex: FlowGraphDataConnection<number>;
    /**
     * Input connection: The end index of the loop.
     */
    public readonly endIndex: FlowGraphDataConnection<number>;
    /**
     * Input connection: The step of the loop.
     */
    public readonly step: FlowGraphDataConnection<number>;
    /**
     * Output connection: The current index of the loop.
     */
    public readonly index: FlowGraphDataConnection<number>;
    /**
     * Output connection: The signal that is activated when the loop body is executed.
     */
    public readonly onLoop: FlowGraphSignalConnection;

    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.startIndex = this.registerDataInput("startIndex", RichTypeNumber);
        this.endIndex = this.registerDataInput("endIndex", RichTypeNumber);
        this.step = this.registerDataInput("step", RichTypeNumber);

        this.index = this.registerDataOutput("index", RichTypeNumber);
        this.onLoop = this._registerSignalOutput("onLoop");
    }

    private _executeLoop(context: FlowGraphContext) {
        let index = context._getExecutionVariable(this, "index");
        const endIndex = context._getExecutionVariable(this, "endIndex");
        if (index < endIndex) {
            this.index.setValue(index, context);
            this.onLoop._activateSignal(context);
            const step = context._getExecutionVariable(this, "step", 1);
            index += step;
            context._setExecutionVariable(this, "index", index);
            this._executeLoop(context);
        } else {
            this.out._activateSignal(context);
        }
    }

    /**
     * @internal
     */
    public _execute(context: FlowGraphContext): void {
        const index = this.startIndex.getValue(context);
        const endIndex = this.endIndex.getValue(context);
        const step = this.step.getValue(context);
        context._setExecutionVariable(this, "index", index);
        context._setExecutionVariable(this, "endIndex", endIndex);
        context._setExecutionVariable(this, "step", step);
        this._executeLoop(context);
    }

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return "FGForLoopBlock";
    }
}
RegisterClass("FGForLoopBlock", FlowGraphForLoopBlock);

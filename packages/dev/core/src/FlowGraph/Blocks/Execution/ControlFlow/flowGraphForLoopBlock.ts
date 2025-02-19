import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "core/FlowGraph/flowGraphExecutionBlockWithOutSignal";
import type { FlowGraphContext } from "../../../flowGraphContext";
import { RichTypeAny, RichTypeFlowGraphInteger, RichTypeNumber } from "../../../flowGraphRichTypes";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import type { FlowGraphNumber } from "core/FlowGraph/utils";
import { getNumericValue } from "core/FlowGraph/utils";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";

export interface IFlowGraphForLoopBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The initial index of the loop.
     * if not set will default to 0
     */
    initialIndex?: FlowGraphNumber;
}
/**
 * Block that executes an action in a loop.
 */
export class FlowGraphForLoopBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The start index of the loop.
     */
    public readonly startIndex: FlowGraphDataConnection<FlowGraphNumber>;
    /**
     * Input connection: The end index of the loop.
     */
    public readonly endIndex: FlowGraphDataConnection<FlowGraphNumber>;
    /**
     * Input connection: The step of the loop.
     */
    public readonly step: FlowGraphDataConnection<number>;
    /**
     * Output connection: The current index of the loop.
     */
    public readonly index: FlowGraphDataConnection<FlowGraphInteger>;
    /**
     * Output connection: The signal that is activated when the loop body is executed.
     */
    public readonly executionFlow: FlowGraphSignalConnection;

    /**
     * Output connection: The completed signal. Triggered when condition is false.
     * No out signal is available.
     */
    public readonly completed: FlowGraphSignalConnection;

    public constructor(config?: IFlowGraphForLoopBlockConfiguration) {
        super(config);

        this.startIndex = this.registerDataInput("startIndex", RichTypeAny, 0);
        this.endIndex = this.registerDataInput("endIndex", RichTypeAny);
        this.step = this.registerDataInput("step", RichTypeNumber, 1);

        this.index = this.registerDataOutput("index", RichTypeFlowGraphInteger, new FlowGraphInteger(getNumericValue(config?.initialIndex ?? 0)));
        this.executionFlow = this._registerSignalOutput("executionFlow");
        this.completed = this._registerSignalOutput("completed");

        this._unregisterSignalOutput("out");
    }

    /**
     * @internal
     */
    public _execute(context: FlowGraphContext): void {
        const index = getNumericValue(this.startIndex.getValue(context));
        const step = this.step.getValue(context);
        let endIndex = getNumericValue(this.endIndex.getValue(context));
        for (let i = index; i < endIndex; i += step) {
            this.index.setValue(new FlowGraphInteger(i), context);
            this.executionFlow._activateSignal(context);
            endIndex = getNumericValue(this.endIndex.getValue(context));
        }

        this.completed._activateSignal(context);
        // TODO - this is an actual for loop. If the loop is long, we should break it and continue in the next frame.
        // To do that we should probably re-execute the block in the next frame, maintaining the state.
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.ForLoop;
    }
}
RegisterClass(FlowGraphBlockNames.ForLoop, FlowGraphForLoopBlock);

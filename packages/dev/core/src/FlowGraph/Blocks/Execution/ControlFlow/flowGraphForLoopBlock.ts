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

/**
 * Configuration for the For Loop block.
 */
export interface IFlowGraphForLoopBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The initial index of the loop.
     * if not set will default to 0
     */
    initialIndex?: FlowGraphNumber;

    /**
     * If set to true, the index of the case will be incremented when the loop is done.
     * This will result that the index will equal endIndex when the loop finished its work.
     * This is the default behavior in glTF interactivity
     */
    incrementIndexWhenLoopDone?: boolean;
}
/**
 * Block that executes an action in a loop.
 */
export class FlowGraphForLoopBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * The maximum number of iterations allowed for the loop.
     * If the loop exceeds this number, it will stop. This number is configurable to avoid infinite loops.
     */
    public static MaxLoopIterations = 1000;
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
            if (i > FlowGraphForLoopBlock.MaxLoopIterations * step) {
                break;
            }
        }

        if (this.config?.incrementIndexWhenLoopDone) {
            this.index.setValue(new FlowGraphInteger(getNumericValue(this.index.getValue(context)) + step), context);
        }

        this.completed._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.ForLoop;
    }
}
RegisterClass(FlowGraphBlockNames.ForLoop, FlowGraphForLoopBlock);

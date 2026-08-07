/** This file must only contain pure code and pure imports */

import { type FlowGraphSignalConnection } from "../../../flowGraphSignalConnection.pure";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { FlowGraphExecutionBlockWithOutSignal } from "core/FlowGraph/flowGraphExecutionBlockWithOutSignal";
import { type FlowGraphContext } from "../../../flowGraphContext";
import { RichTypeAny, RichTypeFlowGraphInteger, RichTypeNumber } from "../../../flowGraphRichTypes.pure";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { type FlowGraphNumber, getNumericValue } from "core/FlowGraph/utils";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger.pure";
import { Logger } from "core/Misc/logger";
import { RegisterClass } from "../../../../Misc/typeStore";

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

    /**
     * Overrides {@link FlowGraphForLoopBlock.MaxLoopIterations} for this block only.
     * Lets a single graph opt into a higher (or lower) runaway-loop guard without changing the
     * process-wide default that every other FlowGraph relies on.
     */
    maxLoopIterations?: number;
}
/**
 * Block that executes an action in a loop.
 */
export class FlowGraphForLoopBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * The default maximum number of iterations allowed for the loop, used as a safety net against
     * runaway loops. Kept conservative so a runaway loop is caught before it can freeze the tab.
     * A single graph that legitimately needs more iterations should set the per-block
     * {@link IFlowGraphForLoopBlockConfiguration.maxLoopIterations} rather than raising this
     * process-wide default that every other FlowGraph relies on.
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
        // Per-block override of the runaway-loop guard, falling back to the process-wide default.
        const maxIterations = (this.config as IFlowGraphForLoopBlockConfiguration | undefined)?.maxLoopIterations ?? FlowGraphForLoopBlock.MaxLoopIterations;
        let iterations = 0;
        let truncated = false;
        for (let i = index; i < endIndex; i += step) {
            this.index.setValue(new FlowGraphInteger(i), context);
            this.executionFlow._activateSignal(context);
            endIndex = getNumericValue(this.endIndex.getValue(context));
            // Safety net against runaway loops. The cap counts iterations (not the index value) so it
            // behaves correctly regardless of startIndex/step.
            if (++iterations >= maxIterations) {
                truncated = true;
                break;
            }
        }

        if (truncated) {
            // The loop hit its safety cap before its range completed, so the outputs below are for a
            // truncated run, not a natural finish. Warn so a genuinely runaway asset is diagnosable
            // rather than silently producing wrong numbers (the completed signal still fires, and
            // incrementIndexWhenLoopDone will not land on endIndex).
            Logger.Warn(`FlowGraphForLoopBlock: loop stopped after reaching the ${maxIterations}-iteration safety cap before its range completed.`);
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

let _Registered = false;
/**
 * Register side effects for flowGraphForLoopBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphForLoopBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.ForLoop, FlowGraphForLoopBlock);
}

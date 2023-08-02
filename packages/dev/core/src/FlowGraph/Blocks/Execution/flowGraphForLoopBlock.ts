import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphSignalConnectionPoint } from "../../flowGraphSignalConnectionPoint";
import type { FlowGraphDataConnectionPoint } from "../../flowGraphDataConnectionPoint";
import type { ValueSetter } from "../../valueContainer";
import { FlowGraphWithOnDoneExecutionBlock } from "core/FlowGraph/flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 * Block that executes a loop.
 */
export class FlowGraphForLoopBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * The start index of the loop.
     */
    public readonly startIndex: FlowGraphDataConnectionPoint<number>;

    /**
     * The end index of the loop.
     */
    public readonly endIndex: FlowGraphDataConnectionPoint<number>;

    /**
     * The step of the loop.
     */
    public readonly step: FlowGraphDataConnectionPoint<number>;

    /**
     * @experimental
     * The current index of the loop.
     */
    public readonly index: FlowGraphDataConnectionPoint<number>;

    /**
     * The signal that is activated when the loop body is executed.
     */
    public readonly onLoop: FlowGraphSignalConnectionPoint;

    /**
     * The signal that is activated when the loop is done.
     */
    public readonly onDone: FlowGraphSignalConnectionPoint;

    private _currentIndex: number = 0;
    private _cachedEndIndex: number = 0;
    private _cachedStep: number = 0;

    public setStartIndex: ValueSetter<number>;
    public setEndIndex: ValueSetter<number>;
    public setStep: ValueSetter<number>;

    private _setIndex: ValueSetter<number>;

    constructor(graph: FlowGraph) {
        super(graph);

        const startRegister = this._registerDataInput("startIndex", 0);
        this.startIndex = startRegister.connectionPoint;
        this.setStartIndex = startRegister.valueSetter;

        const endRegister = this._registerDataInput("endIndex", 0);
        this.endIndex = endRegister.connectionPoint;
        this.setEndIndex = endRegister.valueSetter;

        const stepRegister = this._registerDataInput("step", 1);
        this.step = stepRegister.connectionPoint;
        this.setStep = stepRegister.valueSetter;

        const indexOut = this._registerDataOutput("index", 0);
        this.index = indexOut.connectionPoint;
        this._setIndex = indexOut.valueSetter;

        this.onLoop = this._registerSignalOutput("loopBody");
    }

    private _executeLoop() {
        if (this._currentIndex < this._cachedEndIndex) {
            this._setIndex(this._currentIndex);
            this.onLoop._activateSignal();
            this._currentIndex += this._cachedStep;
            this._executeLoop();
        } else {
            this.onDone._activateSignal();
        }
    }

    public _execute(): void {
        this._currentIndex = this.startIndex.value;
        this._cachedEndIndex = this.endIndex.value;
        this._cachedStep = this.step.value;
        this._executeLoop();
    }
}

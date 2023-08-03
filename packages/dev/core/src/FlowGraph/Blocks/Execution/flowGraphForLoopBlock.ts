import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphSignalConnection } from "../../flowGraphSignalConnection";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "core/FlowGraph/flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 * Block that executes a loop.
 */
export class FlowGraphForLoopBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * The start index of the loop.
     */
    public readonly startIndex: FlowGraphDataConnection<number>;
    /**
     * The end index of the loop.
     */
    public readonly endIndex: FlowGraphDataConnection<number>;
    /**
     * The step of the loop.
     */
    public readonly step: FlowGraphDataConnection<number>;
    /**
     * The current index of the loop.
     */
    public readonly index: FlowGraphDataConnection<number>;
    /**
     * The signal that is activated when the loop body is executed.
     */
    public readonly onLoop: FlowGraphSignalConnection;
    /**
     * The signal that is activated when the loop is done.
     */
    public readonly onDone: FlowGraphSignalConnection;

    public readonly setStartIndex: (value: number) => void;
    public readonly setEndIndex: (value: number) => void;
    public readonly setStep: (value: number) => void;

    private _currentIndex: number = 0;
    private _cachedEndIndex: number = 0;
    private _cachedStep: number = 0;
    private readonly _setIndex: (value: number) => void;

    public constructor(graph: FlowGraph) {
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

        this.onLoop = this._registerSignalOutput("onLoop");
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

    /**
     * @internal
     */
    public _execute(): void {
        this._currentIndex = this.startIndex.value;
        this._cachedEndIndex = this.endIndex.value;
        this._cachedStep = this.step.value;
        this._executeLoop();
    }
}

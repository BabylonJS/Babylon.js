import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnectionPoint, FlowGraphSignalConnectionPoint } from "../../flowGraphConnectionPoint";
import { FlowGraphExecutionBlock } from "../../flowGraphExecutionBlock";

/**
 * @experimental
 * Block that executes a loop.
 */
export class FlowGraphForLoopBlock extends FlowGraphExecutionBlock {
    /**
     * @experimental
     * The start index of the loop.
     */
    public readonly startIndex: FlowGraphDataConnectionPoint<number>;
    /**
     * @experimental
     * The end index of the loop.
     */
    public readonly endIndex: FlowGraphDataConnectionPoint<number>;
    /**
     * @experimental
     * The step of the loop.
     */
    public readonly step: FlowGraphDataConnectionPoint<number>;

    /**
     * @experimental
     * The current index of the loop.
     */
    public readonly index: FlowGraphDataConnectionPoint<number>;

    /**
     * @experimental
     * The signal that is activated when the loop body is executed.
     */
    public readonly onLoop: FlowGraphSignalConnectionPoint;

    /**
     * @experimental
     * The signal that is activated when the loop is done.
     */
    public readonly onDone: FlowGraphSignalConnectionPoint;

    private _currentIndex: number = 0;
    private _cachedEndIndex: number = 0;
    private _cachedStep: number = 0;

    constructor(graph: FlowGraph) {
        super(graph);

        this.startIndex = this._registerDataInput("startIndex", 0);
        this.endIndex = this._registerDataInput("endIndex", 0);
        this.step = this._registerDataInput("step", 1);

        this.index = this._registerDataOutput("index", 0);
        this.onLoop = this._registerSignalOutput("loopBody");
        this.onDone = this._registerSignalOutput("loopDone");
    }

    private _executeLoop() {
        if (this._currentIndex < this._cachedEndIndex) {
            this.index.value = this._currentIndex;
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

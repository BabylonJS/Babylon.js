import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnectionPoint, FlowGraphSignalConnectionPoint } from "../../flowGraphConnectionPoint";
import { FlowGraphExecutionBlock } from "../../flowGraphExecutionBlock";

/**
 * @experimental
 * Block that executes a loop.
 */
export class ForLoopExecutionBlock extends FlowGraphExecutionBlock {
    /**
     * @experimental
     * The start index of the loop.
     */
    public startIndex: FlowGraphDataConnectionPoint<number>;
    /**
     * @experimental
     * The end index of the loop.
     */
    public endIndex: FlowGraphDataConnectionPoint<number>;
    /**
     * @experimental
     * The step of the loop.
     */
    public step: FlowGraphDataConnectionPoint<number>;

    /**
     * @experimental
     * The current index of the loop.
     */
    public index: FlowGraphDataConnectionPoint<number>;

    /**
     * @experimental
     * The signal that is activated when the loop body is executed.
     */
    public onLoop: FlowGraphSignalConnectionPoint;

    /**
     * @experimental
     * The signal that is activated when the loop is done.
     */
    public onDone: FlowGraphSignalConnectionPoint;

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

    public _executeLoop() {
        if (this._currentIndex < this._cachedEndIndex) {
            this.index.value = this._currentIndex;
            this.onLoop.activateSignal();
            this._currentIndex += this._cachedStep;
            this.index.value = this._currentIndex;
            this._executeLoop();
        } else {
            this.onDone.activateSignal();
        }
    }

    public execute(): void {
        this._currentIndex = this.startIndex.value;
        this._cachedEndIndex = this.endIndex.value;
        this._cachedStep = this.step.value;
        this._executeLoop();
    }
}

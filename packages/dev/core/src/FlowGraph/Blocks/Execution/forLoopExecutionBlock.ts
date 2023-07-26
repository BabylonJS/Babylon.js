import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnectionPoint, FlowGraphSignalConnectionPoint } from "../../flowGraphConnectionPoint";
import { FlowGraphExecutionBlock } from "../../flowGraphExecutionBlock";

export class ForLoopExecutionBlock extends FlowGraphExecutionBlock {
    public startIndex: FlowGraphDataConnectionPoint<number>;
    public endIndex: FlowGraphDataConnectionPoint<number>;
    public step: FlowGraphDataConnectionPoint<number>;

    public index: FlowGraphDataConnectionPoint<number>;
    public loopBody: FlowGraphSignalConnectionPoint;
    public loopDone: FlowGraphSignalConnectionPoint;

    private _currentIndex: number = 0;
    private _cachedEndIndex: number = 0;
    private _cachedStep: number = 0;

    constructor(graph: FlowGraph) {
        super(graph);

        this.startIndex = this._registerDataInput("startIndex", 0);
        this.endIndex = this._registerDataInput("endIndex", 0);
        this.step = this._registerDataInput("step", 1);

        this.index = this._registerDataOutput("index", 0);
        this.loopBody = this._registerSignalOutput("loopBody");
        this.loopDone = this._registerSignalOutput("loopDone");
    }

    public _executeLoop() {
        if (this._currentIndex < this._cachedEndIndex) {
            this.index.value = this._currentIndex;
            this.loopBody.activateSignal();
            this._currentIndex += this._cachedStep;
            this.index.value = this._currentIndex;
            this._executeLoop();
        } else {
            this.loopDone.activateSignal();
        }
    }

    public execute(): void {
        this._currentIndex = this.startIndex.value;
        this._cachedEndIndex = this.endIndex.value;
        this._cachedStep = this.step.value;
        this._executeLoop();
    }
}

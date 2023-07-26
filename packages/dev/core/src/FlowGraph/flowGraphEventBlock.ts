import type { Observable } from "../Misc/observable";
import type { FlowGraph } from "./flowGraph";
import type { FlowGraphSignalConnectionPoint } from "./flowGraphConnectionPoint";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";

export abstract class FlowGraphEventBlock extends FlowGraphExecutionBlock {
    public readonly flowOut: FlowGraphSignalConnectionPoint;
    private _eventObservable: Observable<any>;

    constructor(graph: FlowGraph) {
        super(graph);

        this.flowOut = this._registerSignalOutput("flowOut");
    }

    public init() {
        this._eventObservable = this.createEventObservable();
    }

    abstract createEventObservable(): Observable<any>;

    public execute(): void {
        this.flowOut.activateSignal();
    }

    public start(): void {
        this._eventObservable.add(() => {
            this.execute();
        });
    }
}

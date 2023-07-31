import type { Observable } from "../Misc/observable";
import type { FlowGraph } from "./flowGraph";
import type { FlowGraphSignalConnectionPoint } from "./flowGraphConnectionPoint";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";

/**
 * @experimental
 * A type of block that listens to an event observable and activates
 * its output signal ("onTriggered"), when the event is triggered.
 */
export abstract class FlowGraphEventBlock extends FlowGraphExecutionBlock {
    public readonly onTriggered: FlowGraphSignalConnectionPoint;
    private _eventObservable: Observable<any>;

    constructor(graph: FlowGraph) {
        super(graph);

        this.onTriggered = this._registerSignalOutput("flowOut");
    }

    public init() {
        this._eventObservable = this.createEventObservable();
    }

    abstract createEventObservable(): Observable<any>;

    public execute(): void {
        this.onTriggered.activateSignal();
    }

    public start(): void {
        this._eventObservable.add(() => {
            this.execute();
        });
    }
}

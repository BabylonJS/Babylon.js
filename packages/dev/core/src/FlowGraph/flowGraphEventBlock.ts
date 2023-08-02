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
    /**
     * The output signal of the block that is activated whenever this block's event is triggered.
     */
    public readonly onTriggered: FlowGraphSignalConnectionPoint;
    private _eventObservable: Observable<any>;

    constructor(graph: FlowGraph) {
        super(graph);

        this.onTriggered = this._registerSignalOutput("flowOut");
    }

    protected abstract _getEventObservable(): Observable<any>;

    /**
     * @internal
     */
    public _execute(): void {
        this.onTriggered._activateSignal();
    }

    /**
     * @internal
     */
    public _start(): void {
        this._eventObservable = this._getEventObservable();
        this._eventObservable.add(() => {
            this._execute();
        });
    }
}

import type { Nullable } from "../types";
import type { Observable, Observer } from "../Misc/observable";
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

    constructor(graph: FlowGraph) {
        super(graph);

        this.onTriggered = this._registerSignalOutput("flowOut");
    }

    protected abstract _startListening(resolve: () => void): void;
    protected abstract _stopListening(): void;

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
        this._startListening(() => {
            this._execute();
        });
    }

    /**
     * @internal
     */
    public _stop(): void {
        this._stopListening();
    }
}

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

    /**
     * @internal
     */
    public abstract _start(): void;
    /**
     * @internal
     */
    public abstract _stop(): void;

    /**
     * @internal
     */
    public _execute(): void {
        this.onTriggered._activateSignal();
    }
}

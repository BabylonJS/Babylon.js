import { Tools } from "../Misc/tools";
import type { FlowGraphContext } from "./flowGraphContext";

/**
 * @experimental
 * This class is a decorator for the context which logs the nodes that were executed.
 */
export class FlowGraphContextLogger {
    constructor(private _context: FlowGraphContext) {
        this._context.onNodeExecutedObservable.add((node) => {
            Tools.Log(`Node executed: ${node.getClassName()}`);
        });
    }
}

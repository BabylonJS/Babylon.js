import { AbstractTool } from "./AbstractTool";
import { Inspector } from "../Inspector";

/**
 * Removes the inspector panel
 */
export class DisposeTool extends AbstractTool {

    constructor(parent: HTMLElement, inspector: Inspector) {
        super('fa', 'fa-times', parent, inspector, 'Close the inspector panel');
    }

    // Action : refresh the whole panel
    public action() {
        this._inspector.dispose();
    }
}

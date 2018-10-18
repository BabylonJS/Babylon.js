import { Inspector } from "../Inspector";
import { AbstractTool } from "./AbstractTool";

export class RefreshTool extends AbstractTool {

    constructor(parent: HTMLElement, inspector: Inspector) {
        super('fa', 'fa-sync', parent, inspector, 'Refresh the current tab');
    }

    // Action : refresh the whole panel
    public action() {
        this._inspector.refresh();
    }
}

import { AbstractTool } from "./AbstractTool";
import { Inspector } from "../Inspector";


export class RefreshTool extends AbstractTool {

    constructor(parent: HTMLElement, inspector: Inspector) {
        super('fa', 'fa-sync', parent, inspector, 'Refresh the current tab');
    }

    // Action : refresh the whole panel
    public action() {
        this._inspector.refresh();
    }
}

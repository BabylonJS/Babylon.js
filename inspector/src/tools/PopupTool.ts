import { AbstractTool } from "./AbstractTool";
import { Inspector } from "../Inspector";


export class PopupTool extends AbstractTool {

    constructor(parent: HTMLElement, inspector: Inspector) {
        super('fas', 'fa-external-link-alt', parent, inspector, 'Open the inspector in a popup');
    }

    // Action : refresh the whole panel
    public action() {
        this._inspector.openPopup();
    }
}

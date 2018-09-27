import { Inspector } from "../Inspector";
import { AbstractTool } from "./AbstractTool";

export class PopupTool extends AbstractTool {

    constructor(parent: HTMLElement, inspector: Inspector) {
        super('fas', 'fa-external-link-alt', parent, inspector, 'Open the inspector in a popup');
    }

    // Action : refresh the whole panel
    public action() {
        this._inspector.openPopup();
    }
}

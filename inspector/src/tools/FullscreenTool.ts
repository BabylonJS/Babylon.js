import { AbstractTool } from "./AbstractTool";
import { Inspector } from "../Inspector";

export class FullscreenTool extends AbstractTool {

    constructor(parent: HTMLElement, inspector: Inspector) {
        super('fa', 'fa-expand', parent, inspector, 'Open the scene in fullscreen, press Esc to exit');
    }

    // Action : refresh the whole panel
    public action() {

        var elem = document.body;

        function requestFullScreen(element: HTMLElement) {
            // Supports most browsers and their versions.
            var requestMethod = element.requestFullscreen || (<any>element).webkitRequestFullScreen;
            requestMethod.call(element);
        }

        requestFullScreen(elem);
    }
}

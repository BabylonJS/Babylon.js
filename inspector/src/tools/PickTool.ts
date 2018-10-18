import { AbstractMesh } from "babylonjs";
import { Inspector } from "../Inspector";
import { AbstractTool } from "./AbstractTool";

export class PickTool extends AbstractTool {

    private _isActive: boolean = false;
    private _pickHandler: (evt: Event) => void;

    constructor(parent: HTMLElement, inspector: Inspector) {
        super('fa', 'fa-mouse-pointer', parent, inspector, 'Select a mesh in the scene');

        // Create handler
        this._pickHandler = this._pickMesh.bind(this);
    }

    // Action : find the corresponding tree item in the correct tab and display it
    public action() {
        if (this._isActive) {
            this._deactivate();
        } else {
            this.toHtml().classList.add('active');
            // Add event handler : pick on a mesh in the scene
            let canvas = <HTMLElement>this._inspector.scene.getEngine().getRenderingCanvas();
            canvas.addEventListener('click', this._pickHandler);
            this._isActive = true;
        }
    }

    /** Deactivate this tool */
    private _deactivate() {
        this.toHtml().classList.remove('active');
        // Remove event handler
        let canvas = <HTMLElement>this._inspector.scene.getEngine().getRenderingCanvas();
        canvas.removeEventListener('click', this._pickHandler);
        this._isActive = false;
    }

    /** Pick a mesh in the scene */
    private _pickMesh(evt: PointerEvent) {
        let pos = this._updatePointerPosition(evt);
        let pi = this._inspector.scene.pick(pos.x, pos.y, (mesh: AbstractMesh) => { return true; });

        if (pi && pi.pickedMesh) {
            this._inspector.displayObjectDetails(pi.pickedMesh);
        }
        this._deactivate();
    }

    private _updatePointerPosition(evt: PointerEvent): { x: number, y: number } {
        let canvasRect = <ClientRect>this._inspector.scene.getEngine().getRenderingCanvasClientRect();
        let pointerX = evt.clientX - canvasRect.left;
        let pointerY = evt.clientY - canvasRect.top;
        return { x: pointerX, y: pointerY };
    }
}

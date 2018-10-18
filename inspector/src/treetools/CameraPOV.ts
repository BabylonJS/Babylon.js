import { AbstractTreeTool } from "./AbstractTreeTool";
import { Inspector } from "../Inspector";

export interface ICameraPOV {
    setPOV: () => void;
    getCurrentActiveCamera: () => string;
    id: () => string;
}

/**
 *
 */
export class CameraPOV extends AbstractTreeTool {
    private cameraPOV: ICameraPOV;

    constructor(camera: ICameraPOV) {
        super();
        this.cameraPOV = camera;

        // Setting the id of the line with the name of the camera
        this._elem.id = this.cameraPOV.id();

        // Put the right icon
        if (this._elem.id == this.cameraPOV.getCurrentActiveCamera()) {
            this._elem.classList.add('fa-check-circle');
        } else {
            this._elem.classList.add('fa-circle');
        }
    }

    protected action() {
        super.action();
        this._gotoPOV();
    }

    private _gotoPOV() {
        // Uncheck all the radio buttons
        let actives = Inspector.DOCUMENT.querySelectorAll(".fa-check-circle");
        for (let i = 0; i < actives.length; i++) {
            actives[i].classList.remove('fa-check-circle');
            actives[i].classList.add('fa-circle');
        }

        // setting the point off view to the right camera
        this.cameraPOV.setPOV();

        // Check the right radio button
        if (this._elem.id == this.cameraPOV.getCurrentActiveCamera()) {
            this._elem.classList.remove('fa-circle');
            this._elem.classList.add('fa-check-circle');
        }

    }
}

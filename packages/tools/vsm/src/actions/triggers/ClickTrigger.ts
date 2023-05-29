import { PointerEventTypes } from "core/Events/pointerEvents";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { BaseTrigger } from "./BaseTrigger";

/**
 * This action fires the triggerOn when the defined mesh is clicked.
 */
export class ClickTrigger extends BaseTrigger {
    private _object: AbstractMesh;

    constructor(object: AbstractMesh) {
        super();
        this._object = object;
        this._object.getScene().onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh === this._object) {
                this._triggerOn();
            }
        }, PointerEventTypes.POINTERDOWN);
    }
}

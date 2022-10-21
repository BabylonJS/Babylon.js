import { PointerEventTypes } from "core/Events/pointerEvents";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Scene } from "core/scene";
import { BaseTrigger } from "./BaseTrigger";

export class ClickTrigger extends BaseTrigger {
    private _object: AbstractMesh;
    private _clicked = false;

    constructor(object: AbstractMesh) {
        super();
        this._object = object;
        this._object.getScene().onPointerObservable.add((pointerInfo) => {
            if (pointerInfo && pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh === this._object) {
                    this._clicked = true;
                    setTimeout(() => {
                        this._clicked = false;
                    });
                } else {
                    this._clicked = false;
                }
            }
        });
    }

    public condition(scene: Scene): boolean {
        return this._clicked;
    }
}

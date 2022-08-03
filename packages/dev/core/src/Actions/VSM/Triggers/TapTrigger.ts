import type { Nullable } from "../../../types";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import { BaseTrigger } from "./BaseTrigger";
import type { Observer } from "../../../Misc/observable";
import type { PointerInfo } from "../../../Events/pointerEvents";
import { PointerEventTypes } from "../../../Events/pointerEvents";

export interface ITapTriggerOptions {
    subject: AbstractMesh; // Could be node?
}

export class TapTrigger extends BaseTrigger<ITapTriggerOptions> {
    private _observer: Nullable<Observer<PointerInfo>> = null;
    private _tapped = false;
    constructor(options: ITapTriggerOptions) {
        super(options);
        // subject must be pickable
        options.subject.isPickable = true;
        this._observer = this._options.subject.getScene().onPointerObservable.add((pointerInfo) => {
            // no hit? return!
            if (
                !pointerInfo.pickInfo?.hit ||
                (pointerInfo.pickInfo.pickedMesh !== this._options.subject && !pointerInfo.pickInfo.pickedMesh?.isDescendantOf(this._options.subject))
            ) {
                if (this._tapped) {
                    this._checkTriggeredState(false);
                }
                this._tapped = false;
                return;
            }
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                this._tapped = true;
            } else if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                this._tapped = false;
            }
            this._checkTriggeredState(this._tapped);
        }, PointerEventTypes.POINTERUP | PointerEventTypes.POINTERDOWN);
    }

    public dispose() {
        this._options.subject.getScene().onPointerObservable.remove(this._observer);
        this._observer = null;
        super.dispose();
    }
}

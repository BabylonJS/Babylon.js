import { BaseTrigger } from "./BaseTrigger";
import { Scene } from "../../../scene";
import { AbstractMesh } from "../../../Meshes/abstractMesh";

// Hover trigger is basically OnPointerOver trigger (and OnPointerOut trigger)

export interface IHoverTriggerOptions {
    subject: AbstractMesh; // Could be node?
}

export class HoverTrigger extends BaseTrigger<IHoverTriggerOptions> {

    protected _checkConditions(scene: Scene): boolean {
        // this does not take pointerId under consideration.
        return scene._inputManager.meshUnderPointer === this._options.subject;
    }
}

import { BaseTrigger } from "./BaseTrigger";
import type { Scene } from "../../../scene";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { Camera } from "../../../Cameras/camera";

export interface IInFrustumTriggerOptions {
    subject: AbstractMesh; // Could be node?
    camera?: Camera;
}

export class InViewFrustumTrigger extends BaseTrigger<IInFrustumTriggerOptions> {
    protected _checkConditions(scene: Scene): boolean {
        const camera = this._options.camera || scene.activeCamera;
        return !!camera?.isInFrustum(this._options.subject);
    }
}

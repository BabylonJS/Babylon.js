import { BaseTrigger } from "./BaseTrigger";
import { Scene } from "../../../scene";
import { AbstractMesh } from "../../../Meshes/abstractMesh";
import { Camera } from "../../../Cameras/camera";

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

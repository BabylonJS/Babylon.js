import { BaseTrigger } from "./BaseTrigger";
import { TransformNode } from "../../../Meshes/transformNode";
import { Scene } from "../../../scene";
import { Vector3, TmpVectors } from "../../../Maths/math.vector";
import { AbstractMesh } from "../../../Meshes/abstractMesh";

export interface IProximityTriggerOptions {
    subject: TransformNode; // Could be node?
    target: TransformNode; // Could be node?
    distance: number;
    isSquareDistance?: boolean;
    ignoreIfTargetHidden?: boolean;
}

export class ProximityTrigger extends BaseTrigger<IProximityTriggerOptions> {

    protected _checkConditions(_scene: Scene): boolean {
        if (this._options.ignoreIfTargetHidden) {
            // only AbstractMesh and up have an "isVisible" property
            if (!this._options.target.isEnabled() || !(this._options.target as AbstractMesh).isVisible) {
                return false;
            }
        }
        const subjectWorldMatrix = this._options.subject.getWorldMatrix();
        const targetWorldMatrix = this._options.target.getWorldMatrix();
        const subjectGlobalPosition = TmpVectors.Vector3[0];
        subjectWorldMatrix.getTranslationToRef(subjectGlobalPosition);
        const targetGlobalPosition = TmpVectors.Vector3[1];
        targetWorldMatrix.getTranslationToRef(targetGlobalPosition);
        const distance = this._options.isSquareDistance
            ? Vector3.DistanceSquared(subjectGlobalPosition, targetGlobalPosition)
            : Vector3.Distance(subjectGlobalPosition, targetGlobalPosition);

        const toTrigger = distance <= this._options.distance;
        return toTrigger;
    }
}

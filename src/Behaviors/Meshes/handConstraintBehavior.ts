import { TransformNode } from "../../Meshes/transformNode";
import { Nullable } from "../../types";
import { WebXRFeatureName } from "../../XR/webXRFeaturesManager";
import { HandPart, WebXRHandTracking } from "../../XR/features/WebXRHandTracking";
import { WebXRExperienceHelper } from "../../XR/webXRExperienceHelper";
import { Behavior } from "../behavior";
import { Observer } from "../../Misc/observable";
import { Scene } from "../../scene";
import { Quaternion, TmpVectors, Vector3 } from "../../Maths/math.vector";

/**
 * Hand constraint behavior that makes the attached `TransformNode` follow hands in XR experiences.
 */
export class HandConstraintBehavior implements Behavior<TransformNode> {
    private _xr: Nullable<WebXRExperienceHelper>;
    private _scene: Scene;
    private _node: TransformNode;
    private _handTracking: WebXRHandTracking;
    private _sceneRenderObserver: Nullable<Observer<Scene>> = null;

    /** gets or sets behavior's name */
    public get name() {
        return "HandConstraint";
    }

    private _getHandPose() {
        // Retrieve any available hand, starting by the right
        let hand = this._handTracking.getHandByHandedness("right") || this._handTracking.getHandByHandedness("left");

        if (hand) {
            const pinkyMetacarpal = hand.trackedMeshes.get("pinky-finger-metacarpal");
            const middleMetacarpal = hand.trackedMeshes.get("middle-finger-metacarpal");
            const wrist = hand.trackedMeshes.get("wrist");

            if (wrist && middleMetacarpal && pinkyMetacarpal) {
                // palm forward
                const up = TmpVectors.Vector3[0];
                up.copyFrom(middleMetacarpal.absolutePosition).subtractInPlace(wrist.absolutePosition).normalize();
                const forward = TmpVectors.Vector3[1];
                pinkyMetacarpal.absolutePosition.subtractToRef(middleMetacarpal.absolutePosition, forward);
                forward.normalize();
                Vector3.CrossToRef(up, forward, forward);

                const right = TmpVectors.Vector3[2];
                Vector3.CrossToRef(forward, up, right);

                const quaternion = Quaternion.FromLookDirectionLH(forward, up);

                return {
                    quaternion,
                    position: middleMetacarpal.absolutePosition,
                };
            }
        }

        return null;
    }

    /**
     * Initializes the hand constraint behavior
     */
    public init() {}

    /**
     * Attaches the hand constraint to a `TransformNode`
     * @param target defines the target where the behavior is attached to
     */
    public attach(node: TransformNode): void {
        this._node = node;
        this._scene = node.getScene();

        if (!this._node.rotationQuaternion) {
            this._node.rotationQuaternion = Quaternion.RotationYawPitchRoll(this._node.rotation.y, this._node.rotation.x, this._node.rotation.z);
        }

        this._scene.onBeforeRenderObservable.add(() => {
            const pose = this._getHandPose();

            if (pose) {
                this._node.position.copyFrom(pose.position);
                this._node.position.z += 2;
                this._node.rotationQuaternion!.copyFrom(pose.quaternion);
            }
        });
    }

    /**
     * Detaches the behavior from the `TransformNode`
     */
    public detach(): void {
        this._scene.onBeforeRenderObservable.remove(this._sceneRenderObserver);
    }

    /**
     * Links the behavior to the XR experience in which to retrieve hand transform information.
     * @param xr xr experience
     */
    public linkToXRExperience(xr: WebXRExperienceHelper) {
        this._xr = xr;
        this._handTracking = xr.featuresManager.getEnabledFeature(WebXRFeatureName.HAND_TRACKING) as WebXRHandTracking;
        console.log(this._handTracking);
    }
}

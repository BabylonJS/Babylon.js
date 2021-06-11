import { TransformNode } from "../../Meshes/transformNode";
import { Nullable } from "../../types";
import { WebXRFeatureName } from "../../XR/webXRFeaturesManager";
import { WebXRHandTracking } from "../../XR/features/WebXRHandTracking";
import { WebXRExperienceHelper } from "../../XR/webXRExperienceHelper";
import { Behavior } from "../behavior";
import { Observer } from "../../Misc/observable";
import { Scene } from "../../scene";
import { Quaternion, TmpVectors, Vector3 } from "../../Maths/math.vector";

/**
 * Zones around the hand
 */
export enum HandConstraintZone {
    /**
     * Above finger tips
     */
    ABOVE_FINGER_TIPS,
    /**
     * Next to the thumb
     */
    RADIAL_SIDE,
    /**
     * Next to the pinky finger
     */
    ULNAR_SIDE,
    /**
     * Below the wrist
     */
    BELOW_WRIST,
}

/**
 * Orientations for the hand zones and for the attached node
 */
export enum HandConstraintOrientation {
    /**
     * Orientation is towards the camera
     */
    LOOK_AT_CAMERA,
    /**
     * Orientation is determined by the rotation of the palm
     */
    HAND_ROTATION,
}

/**
 * Hand constraint behavior that makes the attached `TransformNode` follow hands in XR experiences.
 */
export class HandConstraintBehavior implements Behavior<TransformNode> {
    private _scene: Scene;
    private _node: TransformNode;
    private _handTracking: Nullable<WebXRHandTracking>;
    private _sceneRenderObserver: Nullable<Observer<Scene>> = null;
    private _zoneAxis: { [id: number]: Vector3 } = {};

    /**
     * Offset distance from the hand in meters
     */
    public targetOffset: number = 0.1;

    /**
     * Where to place the node regarding the center of the hand.
     */
    public targetZone: HandConstraintZone = HandConstraintZone.RADIAL_SIDE;

    /**
     * Orientation mode of the 4 zones around the hand
     */
    public zoneOrientationMode: HandConstraintOrientation = HandConstraintOrientation.HAND_ROTATION;
    /**
     * Orientation mode of the node attached to this behavior
     */
    public nodeOrientationMode: HandConstraintOrientation = HandConstraintOrientation.HAND_ROTATION;

    /**
     * Set the hand this behavior should follow. If set to "none", it will follow any visible hand (prioritising the right one).
     */
    public handedness: XRHandedness = "right";

    /**
     * Rate of interpolation of position and rotation of the attached node.
     * Higher values will give a slower interpolation.
     */
    public lerpTime = 100;

    /**
     * Builds a hand constraint behavior
     */
    constructor() {
        // For a right hand
        this._zoneAxis[HandConstraintZone.ABOVE_FINGER_TIPS] = new Vector3(0, 1, 0);
        this._zoneAxis[HandConstraintZone.RADIAL_SIDE] = new Vector3(1, 0, 0);
        this._zoneAxis[HandConstraintZone.ULNAR_SIDE] = new Vector3(-1, 0, 0);
        this._zoneAxis[HandConstraintZone.BELOW_WRIST] = new Vector3(0, -1, 0);
    }

    /** gets or sets behavior's name */
    public get name() {
        return "HandConstraint";
    }

    private _getHandPose() {
        if (!this._handTracking) {
            return null;
        }

        // Retrieve any available hand, starting by the right
        let hand;
        if (this.handedness === "none") {
            hand = this._handTracking.getHandByHandedness("right") || this._handTracking.getHandByHandedness("left");
        } else {
            hand = this._handTracking.getHandByHandedness(this.handedness);
        }

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
                Vector3.CrossToRef(forward, up, forward);

                const left = TmpVectors.Vector3[2];
                Vector3.CrossToRef(forward, up, left);

                const quaternion = Quaternion.FromLookDirectionLH(forward, up);

                return {
                    quaternion,
                    position: middleMetacarpal.absolutePosition,
                    controllerId: hand.xrController.uniqueId
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
     * @param node defines the node to attach the behavior to
     */
    public attach(node: TransformNode): void {
        this._node = node;
        this._scene = node.getScene();

        if (!this._node.rotationQuaternion) {
            this._node.rotationQuaternion = Quaternion.RotationYawPitchRoll(this._node.rotation.y, this._node.rotation.x, this._node.rotation.z);
        }

        let lastTick = Date.now();
        this._scene.onBeforeRenderObservable.add(() => {
            const pose = this._getHandPose();

            this._node.reservedDataStore = this._node.reservedDataStore || {};
            this._node.reservedDataStore.nearInteraction = this._node.reservedDataStore.nearInteraction || {};
            this._node.reservedDataStore.nearInteraction.excludedControllerId = null;

            if (pose) {
                const zoneOffset = TmpVectors.Vector3[0];
                const camera = this._scene.activeCamera;

                zoneOffset.copyFrom(this._zoneAxis[this.targetZone]);

                const cameraLookAtQuaternion = TmpVectors.Quaternion[0];
                if (camera && (this.zoneOrientationMode === HandConstraintOrientation.LOOK_AT_CAMERA || this.nodeOrientationMode === HandConstraintOrientation.LOOK_AT_CAMERA)) {
                    const toCamera = TmpVectors.Vector3[1];
                    toCamera.copyFrom(camera.position);
                    toCamera.subtractInPlace(pose.position).normalize();
                    if (this._scene.useRightHandedSystem) {
                        Quaternion.FromLookDirectionRHToRef(toCamera, Vector3.UpReadOnly, cameraLookAtQuaternion);
                    } else {
                        Quaternion.FromLookDirectionLHToRef(toCamera, Vector3.UpReadOnly, cameraLookAtQuaternion);
                    }
                }

                if (this.zoneOrientationMode === HandConstraintOrientation.HAND_ROTATION) {
                    pose.quaternion.toRotationMatrix(TmpVectors.Matrix[0]);
                } else {
                    cameraLookAtQuaternion.toRotationMatrix(TmpVectors.Matrix[0]);
                }

                Vector3.TransformNormalToRef(zoneOffset, TmpVectors.Matrix[0], zoneOffset);
                zoneOffset.scaleInPlace(this.targetOffset);

                const targetPosition = TmpVectors.Vector3[2];
                const targetRotation = TmpVectors.Quaternion[1];
                targetPosition.copyFrom(pose.position).addInPlace(zoneOffset);

                if (this.nodeOrientationMode === HandConstraintOrientation.HAND_ROTATION) {
                    targetRotation.copyFrom(pose.quaternion);
                } else {
                    targetRotation.copyFrom(cameraLookAtQuaternion);
                }

                const elapsed = Date.now() - lastTick;

                Vector3.SmoothToRef(this._node.position, targetPosition, elapsed, this.lerpTime, this._node.position);
                Quaternion.SmoothToRef(this._node.rotationQuaternion!, targetRotation, elapsed, this.lerpTime, this._node.rotationQuaternion!);

                this._node.reservedDataStore.nearInteraction.excludedControllerId = pose.controllerId;
            }

            lastTick = Date.now();
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
        this._handTracking = xr.featuresManager.getEnabledFeature(WebXRFeatureName.HAND_TRACKING) as WebXRHandTracking;
    }
}

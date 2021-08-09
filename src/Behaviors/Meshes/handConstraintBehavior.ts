import { TransformNode } from "../../Meshes/transformNode";
import { Nullable } from "../../types";
import { WebXRFeatureName } from "../../XR/webXRFeaturesManager";
import { WebXREyeTracking } from "../../XR/features/WebXREyeTracking";
import { WebXRHandTracking, XRHandJoint } from "../../XR/features/WebXRHandTracking";
import { WebXRExperienceHelper } from "../../XR/webXRExperienceHelper";
import { Behavior } from "../behavior";
import { Observer } from "../../Misc/observable";
import { Scene } from "../../scene";
import { Quaternion, TmpVectors, Vector3 } from "../../Maths/math.vector";
import { Ray } from "../../Culling/ray";

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
 * Orientations for the hand zones and for the attached node
 */
export enum HandConstraintVisibility {
    /**
     * Constraint is always visible
     */
    ALWAYS_VISIBLE,
    /**
     * Constraint is only visible when the palm is up
     */
    PALM_UP,
    /**
     * Constraint is only visible when the user is looking at the constraint.
     * Uses XR Eye Tracking if enabled/available, otherwise uses camera direction
     */
    GAZE_FOCUS,
    /**
     * Constraint is only visible when the palm is up and the user is looking at it
     */
    PALM_AND_GAZE,
}

/**
 * Hand constraint behavior that makes the attached `TransformNode` follow hands in XR experiences.
 * @since 5.0.0
 */
export class HandConstraintBehavior implements Behavior<TransformNode> {
    private _scene: Scene;
    private _node: TransformNode;
    private _eyeTracking: Nullable<WebXREyeTracking>;
    private _handTracking: Nullable<WebXRHandTracking>;
    private _sceneRenderObserver: Nullable<Observer<Scene>> = null;
    private _zoneAxis: { [id: number]: Vector3 } = {};

    /**
     * Sets the HandConstraintVisibility level for the hand constraint
     */
    public handConstraintVisibility: HandConstraintVisibility = HandConstraintVisibility.ALWAYS_VISIBLE;

    /**
     * A number from -1 to 1 that determines how 'upright' the palm must be before the attached node is enabled.
     * Used with HandConstraintVisibility.PALM_UP
     */
    public palmUpStrictness: number = 0.9;

    /**
     * The radius around the TransformNode the user must look wiithin for the attached node to be enabled.
     * Used with HandConstraintVisibility.GAZE_FOCUS
     */
    public gazeProximity: number = 1;

    /**
     * Offset distance from the hand in meters
     */
    public targetOffset: number = 0.1;

    /**
     * Where to place the node regarding the center of the hand.
     */
    public targetZone: HandConstraintZone = HandConstraintZone.ULNAR_SIDE;

    /**
     * Orientation mode of the 4 zones around the hand
     */
    public zoneOrientationMode: HandConstraintOrientation = HandConstraintOrientation.HAND_ROTATION;
    /**
     * Orientation mode of the node attached to this behavior
     */
    public nodeOrientationMode: HandConstraintOrientation = HandConstraintOrientation.HAND_ROTATION;

    /**
     * Set the hand this behavior should follow. If set to "none", it will follow any visible hand (prioritising the left one).
     */
    public handedness: XRHandedness = "left";

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

    /** Enable the behavior */
    public enable() {
        this._node.setEnabled(true);
    }

    /** Disable the behavior */
    public disable() {
        this._node.setEnabled(false);
    }

    private _getHandPose() {
        if (!this._handTracking) {
            return null;
        }

        // Retrieve any available hand, starting by the left
        let hand;
        if (this.handedness === "none") {
            hand = this._handTracking.getHandByHandedness("left") || this._handTracking.getHandByHandedness("right");
        } else {
            hand = this._handTracking.getHandByHandedness(this.handedness);
        }

        if (hand) {
            const pinkyMetacarpal = hand.getJointMesh(XRHandJoint.PINKY_FINGER_METACARPAL);
            const middleMetacarpal = hand.getJointMesh(XRHandJoint.MIDDLE_FINGER_METACARPAL);
            const wrist = hand.getJointMesh(XRHandJoint.WRIST);

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
    public init() { }

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
        this._sceneRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
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

            this._setVisibility();

            lastTick = Date.now();
        });
    }

    private _setVisibility() {
        let palmVisible = true;
        let gazeVisible = true;

        if (this.handConstraintVisibility === HandConstraintVisibility.GAZE_FOCUS ||
            this.handConstraintVisibility === HandConstraintVisibility.PALM_AND_GAZE) {
            gazeVisible = false;
            let gaze: Ray | undefined;
            if (this._eyeTracking) {
                gaze = this._eyeTracking.getEyeGaze()!;
            }
            if (!gaze) {
                const camera = this._scene.activeCamera;
                gaze = camera?.getForwardRay();
            }

            if (gaze) {
                const behaviorPosition = this._node.position;
                const rayPos = gaze.origin;
                const rayPos2 = gaze.origin.add(gaze.direction);
                const rayPosToPoint = rayPos.subtract(behaviorPosition);
                const rayPos2ToPoint = rayPos2.subtract(behaviorPosition);
                const distance = rayPosToPoint.cross(rayPos2ToPoint).length();

                if (distance < this.gazeProximity) {
                    gazeVisible = true;
                }
            }
        }

        if (this.handConstraintVisibility === HandConstraintVisibility.PALM_UP ||
            this.handConstraintVisibility === HandConstraintVisibility.PALM_AND_GAZE) {
            palmVisible = false;

            const pose = this._getHandPose();
            if (pose) {
                const palmDirection = Vector3.Up();
                palmDirection.rotateByQuaternionToRef(pose.quaternion, palmDirection);

                if (Vector3.Dot(palmDirection, Vector3.UpReadOnly) > this.palmUpStrictness) {
                    palmVisible = true;
                }
            }
        }

        this._node.setEnabled(palmVisible && gazeVisible);
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
        this._eyeTracking = xr.featuresManager.getEnabledFeature(WebXRFeatureName.EYE_TRACKING) as WebXREyeTracking;
        this._handTracking = xr.featuresManager.getEnabledFeature(WebXRFeatureName.HAND_TRACKING) as WebXRHandTracking;
    }
}

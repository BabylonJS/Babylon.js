import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRFeatureName } from "../webXRFeaturesManager";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Mesh } from "../../Meshes/mesh";
import { SphereBuilder } from "../../Meshes/Builders/sphereBuilder";
import { WebXRInput } from "../webXRInput";
import { WebXRInputSource } from "../webXRInputSource";
import { Ray } from "../../Culling/ray";
import { Vector3, Quaternion } from "../../Maths/math.vector";
import { Nullable } from "../../types";
import { PhysicsImpostor } from "../../Physics/physicsImpostor";
import { WebXRFeaturesManager } from "../webXRFeaturesManager";
import { WebXRControllerPointerSelection } from "./WebXRControllerPointerSelection";
import { IDisposable } from "../../scene";

export interface IWebXRHandTrackingOptions {
    xrInput: WebXRInput;

    pointerSelectionFeature?: WebXRControllerPointerSelection;

    enableFingerPointer?: boolean;

    jointMeshes?: {
        invisible?: boolean;
        originalMesh?: Mesh;
        keepOriginalVisible?: boolean;
        scaleFactor?: number;
        enablePhysics?: boolean;
    };
}

/**
 * Parts of the hands divided to writs and finger names
 */
export const enum HandPart {
    WRIST = "wrist",
    THUMB = "thumb",
    INDEX = "index",
    MIDDLE = "middle",
    RING = "ring",
    LITTLE = "little",
}

/**
 * Representing a single hand (with its corresponding native XRHand object)
 */
export class WebXRHand implements IDisposable {
    public static HandPartsDefinition: { [key: string]: number[] };

    public static _PopulateHandPartsDefinition() {
        if (typeof XRHand !== "undefined") {
            WebXRHand.HandPartsDefinition = {
                [HandPart.WRIST]: [XRHand.WRIST],
                [HandPart.THUMB]: [XRHand.THUMB_METACARPAL, XRHand.THUMB_PHALANX_PROXIMAL, XRHand.THUMB_PHALANX_DISTAL, XRHand.THUMB_PHALANX_TIP],
                [HandPart.INDEX]: [XRHand.INDEX_METACARPAL, XRHand.INDEX_PHALANX_PROXIMAL, XRHand.INDEX_PHALANX_INTERMEDIATE, XRHand.INDEX_PHALANX_DISTAL, XRHand.INDEX_PHALANX_TIP],
                [HandPart.MIDDLE]: [XRHand.MIDDLE_METACARPAL, XRHand.MIDDLE_PHALANX_PROXIMAL, XRHand.MIDDLE_PHALANX_INTERMEDIATE, XRHand.MIDDLE_PHALANX_DISTAL, XRHand.MIDDLE_PHALANX_TIP],
                [HandPart.RING]: [XRHand.RING_METACARPAL, XRHand.RING_PHALANX_PROXIMAL, XRHand.RING_PHALANX_INTERMEDIATE, XRHand.RING_PHALANX_DISTAL, XRHand.RING_PHALANX_TIP],
                [HandPart.LITTLE]: [XRHand.LITTLE_METACARPAL, XRHand.LITTLE_PHALANX_PROXIMAL, XRHand.LITTLE_PHALANX_INTERMEDIATE, XRHand.LITTLE_PHALANX_DISTAL, XRHand.LITTLE_PHALANX_TIP],
            };
        }
    }

    /**
     * Construct a new hand object
     * @param xrController the controller to which the hand correlates
     * @param trackedMeshes the meshes to be used to track the hand joints
     */
    constructor(public xrController: WebXRInputSource, public trackedMeshes: AbstractMesh[]) {}

    /**
     * Update this hand from the latest xr frame
     * @param xrFrame xrFrame to update from
     * @param referenceSpace The current viewer reference space
     * @param scaleFactor optional scale factor for the meshes
     */
    public updateFromXRFrame(xrFrame: XRFrame, referenceSpace: XRReferenceSpace, scaleFactor: number = 2) {
        const hand = this.xrController.inputSource.hand as XRJointSpace[];
        if (!hand) {
            return;
        }
        this.trackedMeshes.forEach((mesh, idx) => {
            const xrJoint = hand[idx];
            if (xrJoint) {
                let pose = xrFrame.getJointPose(xrJoint, referenceSpace);
                if (!pose || !pose.transform) {
                    return;
                }
                // get the transformation. can be done with matrix decomposition as well
                const pos = pose.transform.position;
                const orientation = pose.transform.orientation;
                mesh.position.set(pos.x, pos.y, pos.z);
                mesh.rotationQuaternion!.set(orientation.x, orientation.y, orientation.z, orientation.w);
                // left handed system conversion
                if (!mesh.getScene().useRightHandedSystem) {
                    mesh.position.z *= -1;
                    mesh.rotationQuaternion!.z *= -1;
                    mesh.rotationQuaternion!.w *= -1;
                }
                // get the radius of the joint. In general it is static, but just in case it does change we update it on each frame.
                const radius = (pose.radius || 0.008) * scaleFactor;
                mesh.scaling.set(radius, radius, radius);
            }
        });
    }

    /**
     * Get meshes of part of the hand
     * @param part the part of hand to get
     */
    public getHandPartMeshes(part: HandPart): AbstractMesh[] {
        return WebXRHand.HandPartsDefinition[part].map((idx) => this.trackedMeshes[idx]);
    }

    /**
     * Dispose this Hand object
     */
    public dispose() {
        this.trackedMeshes.forEach((mesh) => mesh.dispose());
    }
}

WebXRHand._PopulateHandPartsDefinition();

export class WebXRHandTracking extends WebXRAbstractFeature {
    private static _idCounter = 0;
    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.HAND_TRACKING;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    private _hands: {
        [id: string]: {
            xrController: WebXRInputSource;
            tmpRay: Ray;
            id: number;
            handObject: WebXRHand;
        };
    } = {};

    /**
     * Creates a new instance of the hit test feature
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param options options to use when constructing this feature
     */
    constructor(
        _xrSessionManager: WebXRSessionManager,
        /**
         * options to use when constructing this feature
         */
        public readonly options: IWebXRHandTrackingOptions
    ) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "hand-tracking";
    }

    /**
     * Check if the needed objects are defined.
     * This does not mean that the feature is enabled, but that the objects needed are well defined.
     */
    public isCompatible(): boolean {
        return typeof XRHand !== "undefined";
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public attach(): boolean {
        if (!super.attach()) {
            return false;
        }
        this.options.xrInput.controllers.forEach(this._attachHand);
        this._addNewAttachObserver(this.options.xrInput.onControllerAddedObservable, this._attachHand);
        this._addNewAttachObserver(this.options.xrInput.onControllerRemovedObservable, (controller) => {
            // REMOVE the controller
            this._detachHand(controller.uniqueId);
        });

        return true;
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public detach(): boolean {
        if (!super.detach()) {
            return false;
        }

        Object.keys(this._hands).forEach((controllerId) => {
            this._detachHand(controllerId);
        });

        return true;
    }

    /**
     * Get the hand object according to the controller id
     * @param controllerId the controller id to which we want to get the hand
     */
    public getHandByControllerId(controllerId: string): Nullable<WebXRHand> {
        return this._hands[controllerId]?.handObject || null;
    }

    /**
     * Get a hand object according to the required handedness
     * @param handedness the handedness to request
     */
    public getHandByHandedness(handedness: XRHandedness): Nullable<WebXRHand> {
        const handednesses = Object.keys(this._hands).map((key) => this._hands[key].xrController.inputSource.handedness);
        const found = handednesses.indexOf(handedness);
        if (found !== -1) {
            return this._hands[found].handObject;
        }
        return null;
    }

    protected _onXRFrame(_xrFrame: XRFrame): void {
        // iterate over the hands object
        Object.keys(this._hands).forEach((id) => {
            this._hands[id].handObject.updateFromXRFrame(_xrFrame, this._xrSessionManager.referenceSpace, this.options.jointMeshes?.scaleFactor);
        });
    }

    private _attachHand = (xrController: WebXRInputSource) => {
        if (!xrController.inputSource.hand || this._hands[xrController.uniqueId]) {
            // already attached
            return;
        }

        const hand = xrController.inputSource.hand;
        const trackedMeshes: AbstractMesh[] = [];
        const originalMesh = this.options.jointMeshes?.originalMesh || SphereBuilder.CreateSphere("jointParent", { diameter: 1 });
        originalMesh.isVisible = !!this.options.jointMeshes?.keepOriginalVisible;
        for (let i = 0; i < hand.length; ++i) {
            const newInstance = originalMesh.createInstance(`${xrController.uniqueId}-handJoint-${i}`);
            newInstance.isPickable = false;
            if (this.options.jointMeshes?.enablePhysics) {
                newInstance.physicsImpostor = new PhysicsImpostor(newInstance, PhysicsImpostor.SphereImpostor, { mass: 0 });
            }
            newInstance.rotationQuaternion = new Quaternion();
            trackedMeshes.push(newInstance);
        }

        // get two new meshes
        this._hands[xrController.uniqueId] = {
            xrController,
            handObject: new WebXRHand(xrController, trackedMeshes),
            tmpRay: new Ray(new Vector3(), new Vector3()),
            id: WebXRHandTracking._idCounter++,
        };
    };

    private _detachHand(controllerId: string) {
        this._hands[controllerId] && this._hands[controllerId].handObject.dispose();
    }
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRHandTracking.Name,
    (xrSessionManager, options) => {
        return () => new WebXRHandTracking(xrSessionManager, options);
    },
    WebXRHandTracking.Version,
    false
);

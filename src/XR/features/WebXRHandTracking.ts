import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRFeatureName } from "../webXRFeaturesManager";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Mesh } from "../../Meshes/mesh";
import { SphereBuilder } from "../../Meshes/Builders/sphereBuilder";
import { WebXRInput } from "../webXRInput";
import { WebXRInputSource } from "../webXRInputSource";
import { Quaternion } from "../../Maths/math.vector";
import { Nullable } from "../../types";
import { PhysicsImpostor } from "../../Physics/physicsImpostor";
import { WebXRFeaturesManager } from "../webXRFeaturesManager";
import { IDisposable, Scene } from "../../scene";
import { Observable } from "../../Misc/observable";
import { InstancedMesh } from "../../Meshes/instancedMesh";
import { SceneLoader } from "../../Loading/sceneLoader";
import { Color3 } from "../../Maths/math.color";
import { NodeMaterial } from "../../Materials/Node/nodeMaterial";
import { InputBlock } from "../../Materials/Node/Blocks/Input/inputBlock";
import { Material } from "../../Materials/material";
import { Engine } from "../../Engines/engine";
import { Tools } from "../../Misc/tools";
import { Axis } from "../../Maths/math.axis";
import { TransformNode } from "../../Meshes/transformNode";

declare const XRHand: XRHand;

/**
 * Configuration interface for the hand tracking feature
 */
export interface IWebXRHandTrackingOptions {
    /**
     * The xrInput that will be used as source for new hands
     */
    xrInput: WebXRInput;

    /**
     * Configuration object for the joint meshes
     */
    jointMeshes?: {
        /**
         * Should the meshes created be invisible (defaults to false)
         */
        invisible?: boolean;
        /**
         * A source mesh to be used to create instances. Defaults to a sphere.
         * This mesh will be the source for all other (25) meshes.
         * It should have the general size of a single unit, as the instances will be scaled according to the provided radius
         */
        sourceMesh?: Mesh;

        /**
         * This function will be called after a mesh was created for a specific joint.
         * Using this function you can either manipulate the instance or return a new mesh.
         * When returning a new mesh the instance created before will be disposed
         */
        onHandJointMeshGenerated?: (meshInstance: InstancedMesh, jointId: number, controllerId: string) => Mesh | undefined;
        /**
         * Should the source mesh stay visible. Defaults to false
         */
        keepOriginalVisible?: boolean;
        /**
         * Scale factor for all instances (defaults to 2)
         */
        scaleFactor?: number;
        /**
         * Should each instance have its own physics impostor
         */
        enablePhysics?: boolean;
        /**
         * If enabled, override default physics properties
         */
        physicsProps?: { friction?: number; restitution?: number; impostorType?: number };
        /**
         * Should the default hand mesh be disabled. In this case, the spheres will be visible (unless set invisible).
         */
        disableDefaultHandMesh?: boolean;
        /**
         * a rigged hand-mesh that will be updated according to the XRHand data provided. This will override the default hand mesh
         */
        handMeshes?: {
            right: AbstractMesh;
            left: AbstractMesh;
        };
        /**
         * If a hand mesh was provided, this array will define what axis will update which node. This will override the default hand mesh
         */
        rigMapping?: {
            right: string[];
            left: string[];
        };
    };
}

/**
 * Parts of the hands divided to writs and finger names
 */
export const enum HandPart {
    /**
     * HandPart - Wrist
     */
    WRIST = "wrist",
    /**
     * HandPart - The THumb
     */
    THUMB = "thumb",
    /**
     * HandPart - Index finger
     */
    INDEX = "index",
    /**
     * HandPart - Middle finger
     */
    MIDDLE = "middle",
    /**
     * HandPart - Ring finger
     */
    RING = "ring",
    /**
     * HandPart - Little finger
     */
    LITTLE = "little",
}

/**
 * Representing a single hand (with its corresponding native XRHand object)
 */
export class WebXRHand implements IDisposable {
    private _scene: Scene;
    private _defaultHandMesh: boolean = false;
    private _transformNodeMapping: TransformNode[] = [];
    /**
     * Hand-parts definition (key is HandPart)
     */
    public handPartsDefinition: { [key: string]: number[] };

    /**
     * Populate the HandPartsDefinition object.
     * This is called as a side effect since certain browsers don't have XRHand defined.
     */
    private generateHandPartsDefinition(hand: XRHand) {
        return {
            [HandPart.WRIST]: [hand.WRIST],
            [HandPart.THUMB]: [hand.THUMB_METACARPAL, hand.THUMB_PHALANX_PROXIMAL, hand.THUMB_PHALANX_DISTAL, hand.THUMB_PHALANX_TIP],
            [HandPart.INDEX]: [hand.INDEX_METACARPAL, hand.INDEX_PHALANX_PROXIMAL, hand.INDEX_PHALANX_INTERMEDIATE, hand.INDEX_PHALANX_DISTAL, hand.INDEX_PHALANX_TIP],
            [HandPart.MIDDLE]: [hand.MIDDLE_METACARPAL, hand.MIDDLE_PHALANX_PROXIMAL, hand.MIDDLE_PHALANX_INTERMEDIATE, hand.MIDDLE_PHALANX_DISTAL, hand.MIDDLE_PHALANX_TIP],
            [HandPart.RING]: [hand.RING_METACARPAL, hand.RING_PHALANX_PROXIMAL, hand.RING_PHALANX_INTERMEDIATE, hand.RING_PHALANX_DISTAL, hand.RING_PHALANX_TIP],
            [HandPart.LITTLE]: [hand.LITTLE_METACARPAL, hand.LITTLE_PHALANX_PROXIMAL, hand.LITTLE_PHALANX_INTERMEDIATE, hand.LITTLE_PHALANX_DISTAL, hand.LITTLE_PHALANX_TIP],
        };
    }

    /**
     * Construct a new hand object
     * @param xrController the controller to which the hand correlates
     * @param trackedMeshes the meshes to be used to track the hand joints
     * @param _handMesh an optional hand mesh. if not provided, ours will be used
     * @param _rigMapping an optional rig mapping for the hand mesh. if not provided, ours will be used
     * @param disableDefaultHandMesh should the default mesh creation be disabled
     */
    constructor(
        /** the controller to which the hand correlates */
        public readonly xrController: WebXRInputSource,
        /** the meshes to be used to track the hand joints */
        public readonly trackedMeshes: AbstractMesh[],
        private _handMesh?: AbstractMesh,
        private _rigMapping?: string[],
        disableDefaultHandMesh?: boolean
    ) {
        this.handPartsDefinition = this.generateHandPartsDefinition(xrController.inputSource.hand!);
        this._scene = trackedMeshes[0].getScene();
        if (this._handMesh && this._rigMapping) {
            this._defaultHandMesh = false;
        } else {
            if (!disableDefaultHandMesh) {
                this._generateDefaultHandMesh();
            }
        }

        // hide the motion controller, if available/loaded
        if (this.xrController.motionController) {
            if (this.xrController.motionController.rootMesh) {
                this.xrController.motionController.rootMesh.setEnabled(false);
            } else {
                this.xrController.motionController.onModelLoadedObservable.add((controller) => {
                    if (controller.rootMesh) {
                        controller.rootMesh.setEnabled(false);
                    }
                });
            }
        }

        this.xrController.onMotionControllerInitObservable.add((motionController) => {
            motionController.onModelLoadedObservable.add((controller) => {
                if (controller.rootMesh) {
                    controller.rootMesh.setEnabled(false);
                }
            });
            if (motionController.rootMesh) {
                motionController.rootMesh.setEnabled(false);
            }
        });
    }

    /**
     * Update this hand from the latest xr frame
     * @param xrFrame xrFrame to update from
     * @param referenceSpace The current viewer reference space
     * @param scaleFactor optional scale factor for the meshes
     */
    public updateFromXRFrame(xrFrame: XRFrame, referenceSpace: XRReferenceSpace, scaleFactor: number = 2) {
        const hand = this.xrController.inputSource.hand;
        if (!hand) {
            return;
        }
        this.trackedMeshes.forEach((mesh, idx) => {
            const xrJoint = hand[idx];
            if (xrJoint) {
                let pose = xrFrame.getJointPose!(xrJoint, referenceSpace);
                if (!pose || !pose.transform) {
                    return;
                }
                // get the transformation. can be done with matrix decomposition as well
                const pos = pose.transform.position;
                const orientation = pose.transform.orientation;
                mesh.position.set(pos.x, pos.y, pos.z);
                mesh.rotationQuaternion!.set(orientation.x, orientation.y, orientation.z, orientation.w);
                // left handed system conversion
                // get the radius of the joint. In general it is static, but just in case it does change we update it on each frame.
                const radius = (pose.radius || 0.008) * scaleFactor;
                mesh.scaling.set(radius, radius, radius);

                // now check for the hand mesh
                if (this._handMesh && this._rigMapping) {
                    if (this._rigMapping[idx]) {
                        this._transformNodeMapping[idx] = this._transformNodeMapping[idx] || this._scene.getTransformNodeByName(this._rigMapping[idx]);
                        if (this._transformNodeMapping[idx]) {
                            this._transformNodeMapping[idx].position.copyFrom(mesh.position);
                            this._transformNodeMapping[idx].rotationQuaternion!.copyFrom(mesh.rotationQuaternion!);
                            // no scaling at the moment
                            // this._transformNodeMapping[idx].scaling.copyFrom(mesh.scaling).scaleInPlace(20);
                            mesh.isVisible = false;
                        }
                    }
                }
                if (!mesh.getScene().useRightHandedSystem) {
                    mesh.position.z *= -1;
                    mesh.rotationQuaternion!.z *= -1;
                    mesh.rotationQuaternion!.w *= -1;
                }
            }
        });
    }

    /**
     * Get meshes of part of the hand
     * @param part the part of hand to get
     * @returns An array of meshes that correlate to the hand part requested
     */
    public getHandPartMeshes(part: HandPart): AbstractMesh[] {
        return this.handPartsDefinition[part].map((idx) => this.trackedMeshes[idx]);
    }

    /**
     * Dispose this Hand object
     */
    public dispose() {
        this.trackedMeshes.forEach((mesh) => mesh.dispose());
        // dispose the hand mesh, if it is the default one
        if (this._defaultHandMesh && this._handMesh) {
            this._handMesh.dispose();
        }
    }

    private async _generateDefaultHandMesh() {
        try {
            const handedness = this.xrController.inputSource.handedness === "right" ? "right" : "left";
            const filename = `${handedness === "right" ? "r" : "l"}_hand_${this._scene.useRightHandedSystem ? "r" : "l"}hs.glb`;
            const loaded = await SceneLoader.ImportMeshAsync("", "https://assets.babylonjs.com/meshes/HandMeshes/", filename, this._scene);
            // shader
            const handColors = {
                base: Color3.FromInts(116, 63, 203),
                fresnel: Color3.FromInts(149, 102, 229),
                fingerColor: Color3.FromInts(177, 130, 255),
                tipFresnel: Color3.FromInts(220, 200, 255),
            };

            const handShader = new NodeMaterial("leftHandShader", this._scene, { emitComments: false });
            await handShader.loadAsync("https://patrickryanms.github.io/BabylonJStextures/Demos/xrHandMesh/handsShader.json");
            // build node materials
            handShader.build(false);

            // depth prepass and alpha mode
            handShader.needDepthPrePass = true;
            handShader.transparencyMode = Material.MATERIAL_ALPHABLEND;
            handShader.alphaMode = Engine.ALPHA_COMBINE;

            const handNodes = {
                base: handShader.getBlockByName("baseColor") as InputBlock,
                fresnel: handShader.getBlockByName("fresnelColor") as InputBlock,
                fingerColor: handShader.getBlockByName("fingerColor") as InputBlock,
                tipFresnel: handShader.getBlockByName("tipFresnelColor") as InputBlock,
            };

            handNodes.base.value = handColors.base;
            handNodes.fresnel.value = handColors.fresnel;
            handNodes.fingerColor.value = handColors.fingerColor;
            handNodes.tipFresnel.value = handColors.tipFresnel;

            loaded.meshes[1].material = handShader;

            this._defaultHandMesh = true;
            this._handMesh = loaded.meshes[0];
            this._rigMapping = [
                "wrist_",
                "thumb_metacarpal_",
                "thumb_proxPhalanx_",
                "thumb_distPhalanx_",
                "thumb_tip_",
                "index_metacarpal_",
                "index_proxPhalanx_",
                "index_intPhalanx_",
                "index_distPhalanx_",
                "index_tip_",
                "middle_metacarpal_",
                "middle_proxPhalanx_",
                "middle_intPhalanx_",
                "middle_distPhalanx_",
                "middle_tip_",
                "ring_metacarpal_",
                "ring_proxPhalanx_",
                "ring_intPhalanx_",
                "ring_distPhalanx_",
                "ring_tip_",
                "little_metacarpal_",
                "little_proxPhalanx_",
                "little_intPhalanx_",
                "little_distPhalanx_",
                "little_tip_",
            ].map((joint) => `${joint}${handedness === "right" ? "R" : "L"}`);
            // single change for left handed systems
            const tm = this._scene.getTransformNodeByName(this._rigMapping[0]);
            if (!tm) {
                throw new Error("could not find the wrist node");
            } else {
                tm.parent && (tm.parent as AbstractMesh).rotate(Axis.Y, Math.PI);
            }
        } catch (e) {
            Tools.Error("error loading hand mesh");
            console.log(e);
        }
    }
}

/**
 * WebXR Hand Joint tracking feature, available for selected browsers and devices
 */
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

    /**
     * This observable will notify registered observers when a new hand object was added and initialized
     */
    public onHandAddedObservable: Observable<WebXRHand> = new Observable();
    /**
     * This observable will notify its observers right before the hand object is disposed
     */
    public onHandRemovedObservable: Observable<WebXRHand> = new Observable();

    private _hands: {
        [controllerId: string]: {
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
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        super.dispose();
        this.onHandAddedObservable.clear();
    }

    /**
     * Get the hand object according to the controller id
     * @param controllerId the controller id to which we want to get the hand
     * @returns null if not found or the WebXRHand object if found
     */
    public getHandByControllerId(controllerId: string): Nullable<WebXRHand> {
        return this._hands[controllerId]?.handObject || null;
    }

    /**
     * Get a hand object according to the requested handedness
     * @param handedness the handedness to request
     * @returns null if not found or the WebXRHand object if found
     */
    public getHandByHandedness(handedness: XRHandedness): Nullable<WebXRHand> {
        const handednesses = Object.keys(this._hands).map((key) => this._hands[key].handObject.xrController.inputSource.handedness);
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
        const originalMesh = this.options.jointMeshes?.sourceMesh || SphereBuilder.CreateSphere("jointParent", { diameter: 1 });
        originalMesh.isVisible = !!this.options.jointMeshes?.keepOriginalVisible;
        for (let i = 0; i < hand.length; ++i) {
            let newInstance: AbstractMesh = originalMesh.createInstance(`${xrController.uniqueId}-handJoint-${i}`);
            if (this.options.jointMeshes?.onHandJointMeshGenerated) {
                const returnedMesh = this.options.jointMeshes.onHandJointMeshGenerated(newInstance as InstancedMesh, i, xrController.uniqueId);
                if (returnedMesh) {
                    if (returnedMesh !== newInstance) {
                        newInstance.dispose();
                        newInstance = returnedMesh;
                    }
                }
            }
            newInstance.isPickable = false;
            if (this.options.jointMeshes?.enablePhysics) {
                const props = this.options.jointMeshes.physicsProps || {};
                const type = props.impostorType !== undefined ? props.impostorType : PhysicsImpostor.SphereImpostor;
                newInstance.physicsImpostor = new PhysicsImpostor(newInstance, type, { mass: 0, ...props });
            }
            newInstance.rotationQuaternion = new Quaternion();
            if (this.options.jointMeshes?.invisible) {
                newInstance.isVisible = false;
            }
            trackedMeshes.push(newInstance);
        }

        const handedness = xrController.inputSource.handedness === "right" ? "right" : "left";
        const handMesh = this.options.jointMeshes?.handMeshes && this.options.jointMeshes?.handMeshes[handedness];
        const rigMapping = this.options.jointMeshes?.rigMapping && this.options.jointMeshes?.rigMapping[handedness];
        const webxrHand = new WebXRHand(xrController, trackedMeshes, handMesh, rigMapping, this.options.jointMeshes?.disableDefaultHandMesh);

        // get two new meshes
        this._hands[xrController.uniqueId] = {
            handObject: webxrHand,
            id: WebXRHandTracking._idCounter++,
        };

        this.onHandAddedObservable.notifyObservers(webxrHand);
    };

    private _detachHand(controllerId: string) {
        if (this._hands[controllerId]) {
            this.onHandRemovedObservable.notifyObservers(this._hands[controllerId].handObject);
            this._hands[controllerId].handObject.dispose();
        }
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

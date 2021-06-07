import { IWebXRFeature, WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import { WebXRSessionManager } from "../webXRSessionManager";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { SphereBuilder } from "../../Meshes/Builders/sphereBuilder";
import { Observer } from "../../Misc/observable";
import { WebXRInput } from "../webXRInput";
import { WebXRInputSource } from "../webXRInputSource";
import { Scene } from "../../scene";
import { WebXRControllerComponent } from "../motionController/webXRControllerComponent";
import { Nullable } from "../../types";
import { Vector3, Quaternion } from "../../Maths/math.vector";
import { Ray } from "../../Culling/ray";
import { PickingInfo } from "../../Collisions/pickingInfo";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { UtilityLayerRenderer } from "../../Rendering/utilityLayerRenderer";
import { WebXRAbstractMotionController } from "../motionController/webXRAbstractMotionController";

/**
 * Options interface for the near interaction module
 */
export interface IWebXRNearInteractionOptions {
    /**
     * If provided, this scene will be used to render meshes.
     */
    customUtilityLayerScene?: Scene;
    /**
     * Should meshes created here be added to a utility layer or the main scene
     */
    useUtilityLayer?: boolean;
    /**
     * The xr input to use with this near interaction
     */
    xrInput: WebXRInput;
    /**
     * Enable near interaction on all controllers instead of switching between them
     */
    enableNearInteractionOnAllControllers?: boolean;
    /**
     * The preferred hand to give the near interaction to. This will be prioritized when the controller initialize.
     * If switch is enabled, it will still allow the user to switch between the different controllers
     */
    preferredHandedness?: XRHandedness;
    /**
     * Disable switching the near interaction from one controller to the other.
     * If the preferred hand is set it will be fixed on this hand, and if not it will be fixed on the first controller added to the scene
     */
    disableSwitchOnClick?: boolean;

    /**
     * Far interaction feature to toggle when near interaction takes precedence
     */
    farInteractionFeature?: WebXRAbstractFeature;
}

/**
 * A module that will enable near interaction near interaction for hands and motion controllers of XR Input Sources
 */
export class WebXRNearInteraction extends WebXRAbstractFeature {
    private static _idCounter = 200;

    private _attachController = (xrController: WebXRInputSource) => {
        if (this._controllers[xrController.uniqueId]) {
            // already attached
            return;
        }
        // get two new meshes
        const { hoverIndexMeshTip, pickIndexMeshTip } = this._generateNewHandTipMeshes();
        this._controllers[xrController.uniqueId] = {
            xrController,
            meshUnderPointer: null,
            pick: null,
            pickIndexMeshTip,
            hoverIndexMeshTip,
            grabRay: new Ray(new Vector3(), new Vector3()),
            nearInteraction: false,
            nearGrab: false,
            nearGrabInProcess: false,
            id: WebXRNearInteraction._idCounter++,
        };

        if (this._attachedController) {
            if (
                !this._options.enableNearInteractionOnAllControllers &&
                this._options.preferredHandedness &&
                xrController.inputSource.handedness === this._options.preferredHandedness
            ) {
                this._attachedController = xrController.uniqueId;
            }
        } else {
            if (!this._options.enableNearInteractionOnAllControllers) {
                this._attachedController = xrController.uniqueId;
            }
        }
        switch (xrController.inputSource.targetRayMode) {
            case "tracked-pointer":
                return this._attachNearInteractionMode(xrController);
            case "gaze":
                return null;
            case "screen":
                return null;
        }
    };

    private _controllers: {
        [controllerUniqueId: string]: {
            xrController?: WebXRInputSource;
            squeezeComponent?: WebXRControllerComponent;
            selectionComponent?: WebXRControllerComponent;
            onButtonChangedObserver?: Nullable<Observer<WebXRControllerComponent>>;
            onSqueezeButtonChangedObserver?: Nullable<Observer<WebXRControllerComponent>>;
            onFrameObserver?: Nullable<Observer<XRFrame>>;
            meshUnderPointer: Nullable<AbstractMesh>;
            pick: Nullable<PickingInfo>;
            id: number;
            pickIndexMeshTip: Nullable<AbstractMesh>;
            hoverIndexMeshTip: Nullable<AbstractMesh>;
            grabRay: Ray;
            nearInteraction: boolean;
            nearGrab: boolean;
            nearGrabInProcess: boolean;
            // event support
            eventListeners?: { [event in XREventType]?: (event: XRInputSourceEvent) => void };
        };
    } = {};
    private _scene: Scene;

    private _attachedController: string;

    private _farInteractionFeature: Nullable<IWebXRFeature> = null;

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.NEAR_INTERACTION;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
     * constructs a new background remover module
     * @param _xrSessionManager the session manager for this module
     * @param _options read-only options to be used in this module
     */
    constructor(_xrSessionManager: WebXRSessionManager, private readonly _options: IWebXRNearInteractionOptions) {
        super(_xrSessionManager);
        this._scene = this._xrSessionManager.scene;
        if (this._options.farInteractionFeature) {
            this._farInteractionFeature = this._options.farInteractionFeature;
        }
    }

    /**
     * Attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public attach(): boolean {
        if (!super.attach()) {
            return false;
        }

        this._options.xrInput.controllers.forEach(this._attachController);
        this._addNewAttachObserver(this._options.xrInput.onControllerAddedObservable, this._attachController);
        this._addNewAttachObserver(this._options.xrInput.onControllerRemovedObservable, (controller) => {
            // REMOVE the controller
            this._detachController(controller.uniqueId);
        });

        this._scene.constantlyUpdateMeshUnderPointer = true;
        return true;
    }

    /**
     * Detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public detach(): boolean {
        if (!super.detach()) {
            return false;
        }

        Object.keys(this._controllers).forEach((controllerId) => {
            this._detachController(controllerId);
        });

        return true;
    }

    /**
     * Will get the mesh under a specific pointer.
     * `scene.meshUnderPointer` will only return one mesh - either left or right.
     * @param controllerId the controllerId to check
     * @returns The mesh under pointer or null if no mesh is under the pointer
     */
    public getMeshUnderPointer(controllerId: string): Nullable<AbstractMesh> {
        if (this._controllers[controllerId]) {
            return this._controllers[controllerId].meshUnderPointer;
        } else {
            return null;
        }
    }

    /**
     * Get the xr controller that correlates to the pointer id in the pointer event
     *
     * @param id the pointer id to search for
     * @returns the controller that correlates to this id or null if not found
     */
    public getXRControllerByPointerId(id: number): Nullable<WebXRInputSource> {
        const keys = Object.keys(this._controllers);

        for (let i = 0; i < keys.length; ++i) {
            if (this._controllers[keys[i]].id === id) {
                return this._controllers[keys[i]].xrController || null;
            }
        }
        return null;
    }

    /**
     * This function sets webXRControllerPointer Selection feature that will be disabled when
     * the hover range is reached for a mesh and will be reattached when not in hover range.
     * This is used to remove the selection rays when moving.
     * @param farInteractionFeature the feature to disable when finger is in hover range for a mesh
     */
    public setFarInteractionFeature(farInteractionFeature: Nullable<IWebXRFeature>) {
        this._farInteractionFeature = farInteractionFeature;
    }

    /**
     * Filter used for near interaction pick and hover
     */
    private nearPickPredicate(mesh: AbstractMesh): boolean {
        return mesh.isEnabled() && mesh.isVisible && mesh.isPickable && mesh.isNearPickable;
    }

    /**
     * Filter used for near interaction grab
     */
    private nearGrabPredicate(mesh: AbstractMesh): boolean {
        return mesh.isEnabled() && mesh.isVisible && mesh.isPickable && mesh.isNearGrabbable;
    }

    private readonly _hoverRadius = 0.1;
    private readonly _pickRadius = 0.03;
    private readonly _nearGrabLengthScale = 5;
    private _indexTipQuaternion = new Quaternion();
    private _indexTipOrientationVector = Vector3.Zero();

    protected _onXRFrame(_xrFrame: XRFrame) {
        Object.keys(this._controllers).forEach((id) => {
            // only do this for the selected pointer
            const controllerData = this._controllers[id];
            if (!this._options.enableNearInteractionOnAllControllers && id !== this._attachedController) {
                controllerData.pick = null;
                return;
            }
            if (!controllerData.nearGrabInProcess) {
                controllerData.nearInteraction = false;
                controllerData.nearGrab = false;
            }
            // Every frame check collisions/input
            if (controllerData.xrController) {
                const hand = controllerData.xrController.inputSource.hand;
                if (hand) {
                    const xrIndexTip = hand.get("index-finger-tip");
                    if (xrIndexTip) {
                        let indexTipPose = _xrFrame.getJointPose!(xrIndexTip, this._xrSessionManager.referenceSpace);
                        if (indexTipPose && indexTipPose.transform) {
                            let axisRHSMultiplier = this._scene.useRightHandedSystem ? 1 : -1;
                            const indexTipPos = indexTipPose.transform.position;
                            const indexTipOrientation = indexTipPose.transform.orientation;
                            this._indexTipQuaternion.set(
                                indexTipOrientation.x,
                                indexTipOrientation.y,
                                indexTipOrientation.z * axisRHSMultiplier,
                                indexTipOrientation.w * axisRHSMultiplier
                            );

                            // set positions for near pick and hover
                            if (controllerData.pickIndexMeshTip) {
                                controllerData.pickIndexMeshTip.position.set(indexTipPos.x, indexTipPos.y, indexTipPos.z * axisRHSMultiplier);
                            }
                            if (controllerData.hoverIndexMeshTip) {
                                controllerData.hoverIndexMeshTip.position.set(indexTipPos.x, indexTipPos.y, indexTipPos.z * axisRHSMultiplier);
                            }

                            // set near interaction grab ray parameters
                            const nearGrabRayLength = this._nearGrabLengthScale * this._hoverRadius;
                            controllerData.grabRay.origin.set(indexTipPos.x, indexTipPos.y, indexTipPos.z * axisRHSMultiplier);
                            this._indexTipQuaternion.toEulerAnglesToRef(this._indexTipOrientationVector);
                            controllerData.grabRay.direction.set(this._indexTipOrientationVector.x, this._indexTipOrientationVector.y, this._indexTipOrientationVector.z);
                            controllerData.grabRay.length = nearGrabRayLength;
                        }
                    }
                }
            } else {
                return;
            }

            let accuratePickInfo = (originalScenePick: Nullable<PickingInfo>, utilityScenePick: Nullable<PickingInfo>): Nullable<PickingInfo> => {
                let pick = null;
                if (!utilityScenePick || !utilityScenePick.hit) {
                    // No hit in utility scene
                    pick = originalScenePick;
                } else if (!originalScenePick || !originalScenePick.hit) {
                    // No hit in original scene
                    pick = utilityScenePick;
                } else if (utilityScenePick.distance < originalScenePick.distance) {
                    // Hit is closer in utility scene
                    pick = utilityScenePick;
                } else {
                    // Hit is closer in original scene
                    pick = originalScenePick;
                }
                return pick;
            };
            let populateNearInteractionInfo = (nearInteractionInfo: Nullable<PickingInfo>): Nullable<PickingInfo> => {
                let result = null;
                let nearInteractionAtOrigin = false;
                let nearInteraction = nearInteractionInfo && nearInteractionInfo.pickedPoint && nearInteractionInfo.hit;
                if (nearInteractionInfo?.pickedPoint) {
                    nearInteractionAtOrigin = nearInteractionInfo.pickedPoint.x === 0 && nearInteractionInfo.pickedPoint.y === 0 && nearInteractionInfo.pickedPoint.z === 0;
                }
                if (nearInteraction && !nearInteractionAtOrigin) {
                    result = nearInteractionInfo;
                    controllerData.nearInteraction = true;
                }
                return result;
            };

            let pick = null;
            let hoverRange = false;
            // near interaction hover
            if (controllerData.hoverIndexMeshTip) {
                let utilitySceneHoverPick = null;
                let utilitySceneHoverGrab = null;
                if (this._options.useUtilityLayer && this._utilityLayerScene) {
                    utilitySceneHoverPick = this._pickWithMesh(controllerData.hoverIndexMeshTip, this._utilityLayerScene, false, this.nearPickPredicate);
                }
                let originalSceneHoverPick = this._pickWithMesh(controllerData.hoverIndexMeshTip, this._scene, false, this.nearPickPredicate);
                if (this._options.useUtilityLayer && this._utilityLayerScene) {
                    utilitySceneHoverGrab = this._pickWithMesh(controllerData.hoverIndexMeshTip, this._utilityLayerScene, false, this.nearGrabPredicate);
                }
                let originalSceneHoverGrab = this._pickWithMesh(controllerData.hoverIndexMeshTip, this._scene, false, this.nearGrabPredicate);

                let hoverPickInfo = accuratePickInfo(originalSceneHoverPick, utilitySceneHoverPick);
                let hoverGrabInfo = accuratePickInfo(originalSceneHoverGrab, utilitySceneHoverGrab);
                if ((hoverPickInfo && hoverPickInfo.hit) || (hoverGrabInfo && hoverGrabInfo.hit)) {
                    hoverRange = true;
                    // turn off far interaction if in the hover range
                    if (this._farInteractionFeature) {
                        this._farInteractionFeature.detach();
                    }
                    pick = populateNearInteractionInfo(hoverPickInfo);
                }
            }

            // near interaction pick
            if (controllerData.pickIndexMeshTip && hoverRange) {
                let utilitySceneNearPick = null;
                if (this._options.useUtilityLayer && this._utilityLayerScene) {
                    utilitySceneNearPick = this._pickWithMesh(controllerData.pickIndexMeshTip, this._utilityLayerScene, false, this.nearPickPredicate);
                }
                let originalSceneNearPick = this._pickWithMesh(controllerData.pickIndexMeshTip, this._scene, false, this.nearPickPredicate);
                let pickInfo = accuratePickInfo(originalSceneNearPick, utilitySceneNearPick);
                pick = populateNearInteractionInfo(pickInfo);
            }

            // near interaction grab
            if (controllerData.grabRay && hoverRange) {
                let utilitySceneNearGrab = null;
                if (this._utilityLayerScene) {
                    utilitySceneNearGrab = this._utilityLayerScene.pickWithRay(controllerData.grabRay, this.nearGrabPredicate);
                }
                let originalSceneNearGrab = this._scene.pickWithRay(controllerData.grabRay, this.nearGrabPredicate);
                pick = accuratePickInfo(originalSceneNearGrab, utilitySceneNearGrab);
                if (pick && pick.pickedPoint && pick.hit) {
                    controllerData.nearGrab = true;
                    controllerData.nearInteraction = true;
                    pick.ray = controllerData.grabRay;
                }
            }

            // Turn on far interaction if near interaction is unsuccessful
            if (!controllerData.nearInteraction && !hoverRange && !controllerData.nearGrabInProcess) {
                if (this._farInteractionFeature) {
                    this._farInteractionFeature.attach();
                }
            }
            controllerData.pick = pick;
            if (pick && pick.pickedPoint && pick.hit) {
                controllerData.meshUnderPointer = pick.pickedMesh;
            } else {
                controllerData.meshUnderPointer = null;
            }
        });
    }

    private get _utilityLayerScene() {
        return this._options.customUtilityLayerScene || UtilityLayerRenderer.DefaultUtilityLayer.utilityLayerScene;
    }

    private _attachNearInteractionMode(xrController: WebXRInputSource) {
        const controllerData = this._controllers[xrController.uniqueId];
        const pointerEventInit: PointerEventInit = {
            pointerId: controllerData.id,
            pointerType: "xr",
        };
        controllerData.onFrameObserver = this._xrSessionManager.onXRFrameObservable.add(() => {
            if (controllerData.pick && !this._farInteractionFeature?.attached) {
                this._scene.simulatePointerMove(controllerData.pick, pointerEventInit);
            }
        });
        if (xrController.inputSource.gamepad) {
            const init = (motionController: WebXRAbstractMotionController) => {
                controllerData.squeezeComponent = motionController.getComponent("grasp");
                if (controllerData.squeezeComponent) {
                    controllerData.onSqueezeButtonChangedObserver = controllerData.squeezeComponent.onButtonStateChangedObservable.add((component) => {
                        if (component.changes.pressed) {
                            const pressed = component.changes.pressed.current;
                            if (controllerData.pick && controllerData.nearGrab) {
                                if (this._options.enableNearInteractionOnAllControllers || xrController.uniqueId === this._attachedController && !this._farInteractionFeature?.attached) {
                                    if (pressed) {
                                        controllerData.nearGrabInProcess = true;
                                        this._scene.simulatePointerDown(controllerData.pick, pointerEventInit);
                                    } else {
                                        this._scene.simulatePointerUp(controllerData.pick, pointerEventInit);
                                        controllerData.nearGrabInProcess = false;
                                    }
                                }
                            } else {
                                if (pressed && !this._options.enableNearInteractionOnAllControllers && !this._options.disableSwitchOnClick) {
                                    this._attachedController = xrController.uniqueId;
                                }
                            }
                        }
                    });
                } else {
                    controllerData.selectionComponent = motionController.getMainComponent();
                    controllerData.onButtonChangedObserver = controllerData.selectionComponent.onButtonStateChangedObservable.add((component) => {
                        if (component.changes.pressed && !this._farInteractionFeature?.attached) {
                            const pressed = component.changes.pressed.current;
                            if (controllerData.pick) {
                                if (this._options.enableNearInteractionOnAllControllers || xrController.uniqueId === this._attachedController) {
                                    if (pressed) {
                                        controllerData.nearGrabInProcess = true;
                                        this._scene.simulatePointerDown(controllerData.pick, pointerEventInit);
                                    } else {
                                        this._scene.simulatePointerUp(controllerData.pick, pointerEventInit);
                                        controllerData.nearGrabInProcess = false;
                                    }
                                } else {
                                }
                            } else {
                                if (pressed && !this._options.enableNearInteractionOnAllControllers && !this._options.disableSwitchOnClick) {
                                    this._attachedController = xrController.uniqueId;
                                }
                            }
                        }
                    });
                }
            };
            if (xrController.motionController) {
                init(xrController.motionController);
            } else {
                xrController.onMotionControllerInitObservable.add(init);
            }
        } else {
            // use the select and squeeze events
            const selectStartListener = (event: XRInputSourceEvent) => {
                if (controllerData.xrController && event.inputSource === controllerData.xrController.inputSource && controllerData.pick && !this._farInteractionFeature?.attached) {
                    controllerData.nearGrabInProcess = true;
                    this._scene.simulatePointerDown(controllerData.pick, pointerEventInit);
                }
            };

            const selectEndListener = (event: XRInputSourceEvent) => {
                if (controllerData.xrController && event.inputSource === controllerData.xrController.inputSource && controllerData.pick && !this._farInteractionFeature?.attached) {
                    this._scene.simulatePointerUp(controllerData.pick, pointerEventInit);
                    controllerData.nearGrabInProcess = false;
                }
            };

            controllerData.eventListeners = {
                selectend: selectEndListener,
                selectstart: selectStartListener,
            };

            this._xrSessionManager.session.addEventListener("selectstart", selectStartListener);
            this._xrSessionManager.session.addEventListener("selectend", selectEndListener);
        }
    }

    private _detachController(xrControllerUniqueId: string) {
        const controllerData = this._controllers[xrControllerUniqueId];
        if (!controllerData) {
            return;
        }
        if (controllerData.squeezeComponent) {
            if (controllerData.onSqueezeButtonChangedObserver) {
                controllerData.squeezeComponent.onButtonStateChangedObservable.remove(controllerData.onSqueezeButtonChangedObserver);
            }
        }
        if (controllerData.selectionComponent) {
            if (controllerData.onButtonChangedObserver) {
                controllerData.selectionComponent.onButtonStateChangedObservable.remove(controllerData.onButtonChangedObserver);
            }
        }
        if (controllerData.onFrameObserver) {
            this._xrSessionManager.onXRFrameObservable.remove(controllerData.onFrameObserver);
        }
        if (controllerData.eventListeners) {
            Object.keys(controllerData.eventListeners).forEach((eventName: string) => {
                const func = controllerData.eventListeners && controllerData.eventListeners[eventName as XREventType];
                if (func) {
                    this._xrSessionManager.session.removeEventListener(eventName as XREventType, func);
                }
            });
        }
        controllerData.pickIndexMeshTip?.dispose();
        controllerData.hoverIndexMeshTip?.dispose();

        // remove from the map
        delete this._controllers[xrControllerUniqueId];
        if (this._attachedController === xrControllerUniqueId) {
            // check for other controllers
            const keys = Object.keys(this._controllers);
            if (keys.length) {
                this._attachedController = keys[0];
            } else {
                this._attachedController = "";
            }
        }
    }

    private _generateNewHandTipMeshes() {
        // populate information for near hover, pick and pinch
        const meshCreationScene = this._options.useUtilityLayer ? this._options.customUtilityLayerScene || UtilityLayerRenderer.DefaultUtilityLayer.utilityLayerScene : this._scene;
        var hoverIndexMeshTip = null;
        var pickIndexMeshTip = null;

        let createSphereMesh = (name: string, scale: number, sceneToUse: Scene): Nullable<AbstractMesh> => {
            let resultMesh = null;
            resultMesh = SphereBuilder.CreateSphere(name, { diameter: 1 }, sceneToUse);
            resultMesh.scaling.set(scale, scale, scale);
            resultMesh.isVisible = false;

            return resultMesh;
        };

        hoverIndexMeshTip = createSphereMesh("IndexHoverSphere", this._hoverRadius, meshCreationScene);
        pickIndexMeshTip = createSphereMesh("IndexPickSphere", this._pickRadius, meshCreationScene);
        return {
            hoverIndexMeshTip,
            pickIndexMeshTip,
        };
    }

    private _pickWithMesh(indexTipMesh: AbstractMesh, sceneToUse: Scene, precise: boolean, predicate: (mesh: AbstractMesh) => boolean): Nullable<PickingInfo> {
        let pickingInfo = null;
        if (indexTipMesh) {
            for (let meshIndex = 0; meshIndex < sceneToUse.meshes.length; meshIndex++) {
                let mesh = sceneToUse.meshes[meshIndex];
                if (!predicate(mesh)) {
                    continue;
                }
                let result = mesh.intersectsMesh(indexTipMesh, precise);
                if (result) {
                    pickingInfo = new PickingInfo();
                    pickingInfo.hit = result;
                    pickingInfo.pickedMesh = mesh;
                    pickingInfo.pickedPoint = indexTipMesh.position;
                    pickingInfo.originMesh = indexTipMesh;
                    pickingInfo.distance = Vector3.Distance(mesh.position, indexTipMesh.position);
                }
            }
        }
        return pickingInfo;
    }
}

//Register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRNearInteraction.Name,
    (xrSessionManager, options) => {
        return () => new WebXRNearInteraction(xrSessionManager, options);
    },
    WebXRNearInteraction.Version,
    true
);

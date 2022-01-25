import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import { WebXRControllerPointerSelection } from "./WebXRControllerPointerSelection";
import { WebXRSessionManager } from "../webXRSessionManager";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { CreateSphere } from "../../Meshes/Builders/sphereBuilder";
import { Observer } from "../../Misc/observable";
import { WebXRInput } from "../webXRInput";
import { WebXRInputSource } from "../webXRInputSource";
import { Scene } from "../../scene";
import { WebXRControllerComponent } from "../motionController/webXRControllerComponent";
import { IndicesArray, Nullable } from "../../types";
import { Vector3, Quaternion, TmpVectors } from "../../Maths/math.vector";
import { Ray } from "../../Culling/ray";
import { PickingInfo } from "../../Collisions/pickingInfo";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { UtilityLayerRenderer } from "../../Rendering/utilityLayerRenderer";
import { WebXRAbstractMotionController } from "../motionController/webXRAbstractMotionController";
import { BoundingSphere } from "../../Culling/boundingSphere";
import { TransformNode } from "../../Meshes/transformNode";
import { StandardMaterial } from "../../Materials/standardMaterial";
import { Color3 } from "../../Maths/math.color";
import { NodeMaterial } from "../../Materials/Node/nodeMaterial";
import { Animation } from "../../Animations/animation";
import { QuadraticEase, EasingFunction } from "../../Animations/easing";
// side effects
import "../../Meshes/subMesh.project";

type ControllerData = {
    xrController?: WebXRInputSource;
    squeezeComponent?: WebXRControllerComponent;
    selectionComponent?: WebXRControllerComponent;
    onButtonChangedObserver?: Nullable<Observer<WebXRControllerComponent>>;
    onSqueezeButtonChangedObserver?: Nullable<Observer<WebXRControllerComponent>>;
    onFrameObserver?: Nullable<Observer<XRFrame>>;
    meshUnderPointer: Nullable<AbstractMesh>;
    nearInteractionTargetMesh: Nullable<AbstractMesh>;
    pick: Nullable<PickingInfo>;
    id: number;
    touchCollisionMesh: AbstractMesh;
    touchCollisionMeshFunction: (isTouch: boolean) => void;
    hydrateCollisionMeshFunction: (isHydration: boolean) => void;
    currentAnimationState: ControllerOrbAnimationState;
    grabRay: Ray;
    nearInteraction: boolean;
    hoverInteraction: boolean;
    grabInteraction: boolean;
    // event support
    eventListeners?: { [event in XREventType]?: (event: XRInputSourceEvent) => void };
    pickedPointVisualCue: AbstractMesh;
};

// Tracks the interaction animation state when using a motion controller with a near interaction orb
enum ControllerOrbAnimationState {
    DEHYDRATED,
    HYDRATED,
    HOVER,
    TOUCH
}

export enum WebXRNearControllerMode {
    /**
     * Motion controllers will not support near interaction
     */
    DISABLED = 0,
    /**
     * The interaction point for motion controllers will be inside of them
     */
    CENTERED_ON_CONTROLLER = 1,
    /**
     * The interaction point for motion controllers will be in front of the controller
     */
    CENTERED_IN_FRONT = 2
}

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
    farInteractionFeature?: WebXRControllerPointerSelection;

    /**
     * Near interaction mode for motion controllers
     */
    nearInteractionControllerMode?: WebXRNearControllerMode;
}

/**
 * A module that will enable near interaction near interaction for hands and motion controllers of XR Input Sources
 */
export class WebXRNearInteraction extends WebXRAbstractFeature {
    private static _idCounter = 200;

    private _tmpRay: Ray = new Ray(new Vector3(), new Vector3());

    private _attachController = (xrController: WebXRInputSource) => {
        if (this._controllers[xrController.uniqueId]) {
            // already attached
            return;
        }
        // get two new meshes
        const {touchCollisionMesh, touchCollisionMeshFunction, hydrateCollisionMeshFunction} = this._generateNewTouchPointMesh();
        const selectionMesh = this._generateVisualCue();

        this._controllers[xrController.uniqueId] = {
            xrController,
            meshUnderPointer: null,
            nearInteractionTargetMesh: null,
            pick: null,
            touchCollisionMesh,
            touchCollisionMeshFunction: touchCollisionMeshFunction,
            hydrateCollisionMeshFunction: hydrateCollisionMeshFunction,
            currentAnimationState: ControllerOrbAnimationState.DEHYDRATED,
            grabRay: new Ray(new Vector3(), new Vector3()),
            hoverInteraction: false,
            nearInteraction: false,
            grabInteraction: false,
            id: WebXRNearInteraction._idCounter++,
            pickedPointVisualCue: selectionMesh,
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
        [controllerUniqueId: string]: ControllerData;
    } = {};
    private _scene: Scene;

    private _attachedController: string;

    private _farInteractionFeature: Nullable<WebXRControllerPointerSelection> = null;

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
     * default color of the selection ring
     */
    public selectionMeshDefaultColor: Color3 = new Color3(0.8, 0.8, 0.8);
    /**
     * This color will be applied to the selection ring when selection is triggered
     */
    public selectionMeshPickedColor: Color3 = new Color3(0.3, 0.3, 1.0);

    /**
     * constructs a new background remover module
     * @param _xrSessionManager the session manager for this module
     * @param _options read-only options to be used in this module
     */
    constructor(_xrSessionManager: WebXRSessionManager, private readonly _options: IWebXRNearInteractionOptions) {
        super(_xrSessionManager);
        this._scene = this._xrSessionManager.scene;
        this._options.nearInteractionControllerMode = WebXRNearControllerMode.CENTERED_IN_FRONT;
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
     * This function sets webXRControllerPointerSelection feature that will be disabled when
     * the hover range is reached for a mesh and will be reattached when not in hover range.
     * This is used to remove the selection rays when moving.
     * @param farInteractionFeature the feature to disable when finger is in hover range for a mesh
     */
    public setFarInteractionFeature(farInteractionFeature: Nullable<WebXRControllerPointerSelection>) {
        this._farInteractionFeature = farInteractionFeature;
    }

    /**
     * Filter used for near interaction pick and hover
     */
    private _nearPickPredicate(mesh: AbstractMesh): boolean {
        return mesh.isEnabled() && mesh.isVisible && mesh.isPickable && mesh.isNearPickable;
    }

    /**
     * Filter used for near interaction grab
     */
    private _nearGrabPredicate(mesh: AbstractMesh): boolean {
        return mesh.isEnabled() && mesh.isVisible && mesh.isPickable && mesh.isNearGrabbable;
    }

    /**
     * Filter used for any near interaction
     */
    private _nearInteractionPredicate(mesh: AbstractMesh): boolean {
        return mesh.isEnabled() && mesh.isVisible && mesh.isPickable && (mesh.isNearPickable || mesh.isNearGrabbable);
    }

    private _controllerAvailablePredicate(mesh: AbstractMesh, controllerId: string): boolean {
        let parent: TransformNode = mesh;

        while (parent) {
            if (parent.reservedDataStore && parent.reservedDataStore.nearInteraction && parent.reservedDataStore.nearInteraction.excludedControllerId === controllerId) {
                return false;
            }
            parent = parent.parent as TransformNode;
        }

        return true;
    }

    private _handleTransitionAnimation(controllerData: ControllerData, newState: ControllerOrbAnimationState) {
        if (controllerData.currentAnimationState === newState ||
            this._options.nearInteractionControllerMode !== WebXRNearControllerMode.CENTERED_IN_FRONT ||
            !!controllerData.xrController?.inputSource.hand) {
            return;
        }

        if (newState > controllerData.currentAnimationState) {
            switch(controllerData.currentAnimationState) {
                case ControllerOrbAnimationState.DEHYDRATED: {
                    controllerData.hydrateCollisionMeshFunction(true);
                    if (newState === ControllerOrbAnimationState.HOVER) {
                        break;
                    }
                }
                case ControllerOrbAnimationState.HOVER: {
                    controllerData.touchCollisionMeshFunction(true);
                    if (newState === ControllerOrbAnimationState.TOUCH) {
                        break;
                    }
                }
            }
        }
        else {
            switch(controllerData.currentAnimationState) {
                case ControllerOrbAnimationState.TOUCH: {
                    controllerData.touchCollisionMeshFunction(false);
                    if (newState === ControllerOrbAnimationState.HOVER) {
                        break;
                    }
                }
                case ControllerOrbAnimationState.HOVER: {
                    controllerData.hydrateCollisionMeshFunction(false);
                    if (newState === ControllerOrbAnimationState.DEHYDRATED) {
                        break;
                    }
                }
            }
        }

        controllerData.currentAnimationState = newState;
    }

    private readonly _hoverRadius = 0.1;
    private readonly _pickRadius = 0.02;
    private readonly _nearGrabLengthScale = 5;
    private _touchPointQuaternion = new Quaternion();
    private _touchPointOrientationVector = Vector3.Zero();

    private _processTouchPoint(id: string, transform: XRRigidTransform) {
        const controllerData = this._controllers[id];

        let axisRHSMultiplier = this._scene.useRightHandedSystem ? 1 : -1;
        let touchPointPosition = transform.position;
        const touchPointOrientation = transform.orientation;
        this._touchPointQuaternion.set(
            touchPointOrientation.x,
            touchPointOrientation.y,
            touchPointOrientation.z * axisRHSMultiplier,
            touchPointOrientation.w * axisRHSMultiplier
        );

        // set near interaction grab ray parameters
        const nearGrabRayLength = this._nearGrabLengthScale * this._hoverRadius;
        controllerData.grabRay.origin.set(touchPointPosition.x, touchPointPosition.y, touchPointPosition.z * axisRHSMultiplier);

        if (this._options.nearInteractionControllerMode === WebXRNearControllerMode.CENTERED_IN_FRONT && !(controllerData.xrController?.inputSource.hand)) {
            // offset the touch point in the direction the transform is facing
            controllerData.xrController!.getWorldPointerRayToRef(this._tmpRay);
            controllerData.grabRay.origin.addInPlace(this._tmpRay.direction.scale(0.05));
        }

        this._touchPointQuaternion.toEulerAnglesToRef(this._touchPointOrientationVector);
        controllerData.grabRay.direction.set(this._touchPointOrientationVector.x, this._touchPointOrientationVector.y, this._touchPointOrientationVector.z);
        controllerData.grabRay.length = nearGrabRayLength;

        // set positions for near pick and hover
        controllerData.touchCollisionMesh.position.copyFrom(controllerData.grabRay.origin);
    }

    protected _onXRFrame(_xrFrame: XRFrame) {
        Object.keys(this._controllers).forEach((id) => {
            // only do this for the selected pointer
            const controllerData = this._controllers[id];
            // If near interaction is not enabled/available for this controller, return early
            if ((!this._options.enableNearInteractionOnAllControllers && id !== this._attachedController) ||
                !controllerData.xrController ||
                (!controllerData.xrController.inputSource.hand && (!this._options.nearInteractionControllerMode || !controllerData.xrController.inputSource.gamepad))) {
                controllerData.pick = null;
                return;
            }
            controllerData.hoverInteraction = false;
            controllerData.nearInteraction = false;

            // Every frame check collisions/input
            if (controllerData.xrController) {
                const hand = controllerData.xrController.inputSource.hand;
                if (hand) {
                    const xrIndexTip = hand.get("index-finger-tip");
                    if (xrIndexTip) {
                        let indexTipPose = _xrFrame.getJointPose!(xrIndexTip, this._xrSessionManager.referenceSpace);
                        if (indexTipPose && indexTipPose.transform) {
                            this._processTouchPoint(id, indexTipPose.transform);
                        }
                    }
                }
                else if (controllerData.xrController.inputSource.gamepad) {
                    const controller = controllerData.xrController.inputSource;
                    if (this._options.nearInteractionControllerMode === WebXRNearControllerMode.CENTERED_ON_CONTROLLER) {
                        // Try to get the grip space, with a target ray space fallback
                        let controllerPose = _xrFrame.getPose(controller.gripSpace || controller.targetRaySpace, this._xrSessionManager.referenceSpace);
                        if (controllerPose && controllerPose.transform) {
                            this._processTouchPoint(id, controllerPose.transform);
                        }
                    }
                    else if (this._options.nearInteractionControllerMode === WebXRNearControllerMode.CENTERED_IN_FRONT) {
                        let controllerPose = _xrFrame.getPose(controller.targetRaySpace, this._xrSessionManager.referenceSpace);
                        if (controllerPose && controllerPose.transform) {
                            this._processTouchPoint(id, controllerPose.transform);
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
            let populateNearInteractionInfo = (nearInteractionInfo: Nullable<PickingInfo>): PickingInfo => {
                let result = new PickingInfo();

                let nearInteractionAtOrigin = false;
                let nearInteraction = nearInteractionInfo && nearInteractionInfo.pickedPoint && nearInteractionInfo.hit;
                if (nearInteractionInfo?.pickedPoint) {
                    nearInteractionAtOrigin = nearInteractionInfo.pickedPoint.x === 0 && nearInteractionInfo.pickedPoint.y === 0 && nearInteractionInfo.pickedPoint.z === 0;
                }
                if (nearInteraction && !nearInteractionAtOrigin) {
                    result = nearInteractionInfo!;
                }
                return result;
            };

            // Don't perform touch logic while grabbing, to prevent triggering touch interactions while in the middle of a grab interaction
            // Dont update cursor logic either - the cursor should already be visible for the grab to be in range,
            // and in order to maintain its position on the target mesh it is parented for the duration of the grab.
            if (!controllerData.grabInteraction) {
                let pick = null;

                // near interaction hover
                let utilitySceneHoverPick = null;
                if (this._options.useUtilityLayer && this._utilityLayerScene) {
                    utilitySceneHoverPick = this._pickWithSphere(controllerData, this._hoverRadius, this._utilityLayerScene, (mesh: AbstractMesh) =>
                        this._nearInteractionPredicate(mesh)
                    );
                }
                let originalSceneHoverPick = this._pickWithSphere(controllerData, this._hoverRadius, this._scene, (mesh: AbstractMesh) => this._nearInteractionPredicate(mesh));

                let hoverPickInfo = accuratePickInfo(originalSceneHoverPick, utilitySceneHoverPick);
                if (hoverPickInfo && hoverPickInfo.hit) {
                    pick = populateNearInteractionInfo(hoverPickInfo);
                    if (pick.hit) {
                        controllerData.hoverInteraction = true;
                    }
                }

                // near interaction pick
                if (controllerData.hoverInteraction) {
                    let utilitySceneNearPick = null;
                    if (this._options.useUtilityLayer && this._utilityLayerScene) {
                        utilitySceneNearPick = this._pickWithSphere(controllerData, this._pickRadius, this._utilityLayerScene, (mesh: AbstractMesh) => this._nearPickPredicate(mesh));
                    }
                    let originalSceneNearPick = this._pickWithSphere(controllerData, this._pickRadius, this._scene, (mesh: AbstractMesh) => this._nearPickPredicate(mesh));
                    let pickInfo = accuratePickInfo(originalSceneNearPick, utilitySceneNearPick);
                    const nearPick = populateNearInteractionInfo(pickInfo);
                    if (nearPick.hit) {
                        // Near pick takes precedence over hover interaction
                        pick = nearPick;
                        controllerData.nearInteraction = true;
                    }
                }

                controllerData.pick = pick;

                // Update mesh under pointer
                if (controllerData.pick && controllerData.pick.pickedPoint && controllerData.pick.hit) {
                    controllerData.meshUnderPointer = controllerData.pick.pickedMesh;
                    controllerData.pickedPointVisualCue.position.copyFrom(controllerData.pick.pickedPoint);
                    controllerData.pickedPointVisualCue.isVisible = true;

                    if (this._farInteractionFeature && this._farInteractionFeature.attached) {
                        this._farInteractionFeature._setPointerSelectionDisabledByPointerId(controllerData.id, true);
                    }
                } else {
                    controllerData.meshUnderPointer = null;
                    controllerData.pickedPointVisualCue.isVisible = false;

                    if (this._farInteractionFeature && this._farInteractionFeature.attached) {
                        this._farInteractionFeature._setPointerSelectionDisabledByPointerId(controllerData.id, false);
                    }
                }
            }

            // Update the interaction animation. Only updates if the visible touch mesh is active
            if (controllerData.grabInteraction || controllerData.nearInteraction) {
                this._handleTransitionAnimation(controllerData, ControllerOrbAnimationState.TOUCH);
            }
            else if (controllerData.hoverInteraction) {
                this._handleTransitionAnimation(controllerData, ControllerOrbAnimationState.HYDRATED);
            }
            else {
                this._handleTransitionAnimation(controllerData, ControllerOrbAnimationState.DEHYDRATED);
            }
        });
    }

    private get _utilityLayerScene() {
        return this._options.customUtilityLayerScene || UtilityLayerRenderer.DefaultUtilityLayer.utilityLayerScene;
    }

    private _generateVisualCue() {
        const sceneToRenderTo = this._options.useUtilityLayer ? this._options.customUtilityLayerScene || UtilityLayerRenderer.DefaultUtilityLayer.utilityLayerScene : this._scene;
        const selectionMesh = CreateSphere(
            "nearInteraction",
            {
                diameter: 0.0035 * 3,
            },
            sceneToRenderTo
        );
        selectionMesh.bakeCurrentTransformIntoVertices();
        selectionMesh.isPickable = false;
        selectionMesh.isVisible = false;
        selectionMesh.rotationQuaternion = Quaternion.Identity();
        let targetMat = new StandardMaterial("targetMat", sceneToRenderTo);
        targetMat.specularColor = Color3.Black();
        targetMat.emissiveColor = this.selectionMeshDefaultColor;
        targetMat.backFaceCulling = false;
        selectionMesh.material = targetMat;

        return selectionMesh;
    }

    private _isControllerReadyForNearInteraction(id: number) {
        if (this._farInteractionFeature) {
            return this._farInteractionFeature._getPointerSelectionDisabledByPointerId(id);
        }

        return true;
    }

    private _attachNearInteractionMode(xrController: WebXRInputSource) {
        const controllerData = this._controllers[xrController.uniqueId];
        const pointerEventInit: PointerEventInit = {
            pointerId: controllerData.id,
            pointerType: "xr",
        };
        controllerData.onFrameObserver = this._xrSessionManager.onXRFrameObservable.add(() => {
            if ((!this._options.enableNearInteractionOnAllControllers && xrController.uniqueId !== this._attachedController) ||
                !controllerData.xrController ||
                (!controllerData.xrController.inputSource.hand && (!this._options.nearInteractionControllerMode || !controllerData.xrController.inputSource.gamepad))) {
                return;
            }
            if (controllerData.pick) {
                controllerData.pick.ray = controllerData.grabRay;
            }

            if (controllerData.pick && this._isControllerReadyForNearInteraction(controllerData.id)) {
                this._scene.simulatePointerMove(controllerData.pick, pointerEventInit);
            }

            // Near pick pointer event
            if (controllerData.nearInteraction && controllerData.pick && controllerData.pick.hit) {
                if (!controllerData.nearInteractionTargetMesh) {
                    this._scene.simulatePointerDown(controllerData.pick, pointerEventInit);
                    controllerData.nearInteractionTargetMesh = controllerData.meshUnderPointer;
                }
            } else if (controllerData.nearInteractionTargetMesh && controllerData.pick) {
                this._scene.simulatePointerUp(controllerData.pick, pointerEventInit);
                controllerData.nearInteractionTargetMesh = null;
            }
        });

        const grabCheck = (pressed: boolean) => {
            if (this._options.enableNearInteractionOnAllControllers || (xrController.uniqueId === this._attachedController && this._isControllerReadyForNearInteraction(controllerData.id))) {
                if (controllerData.pick) {
                    controllerData.pick.ray = controllerData.grabRay;
                }
                if (pressed && controllerData.pick && controllerData.meshUnderPointer && this._nearGrabPredicate(controllerData.meshUnderPointer)) {
                    controllerData.grabInteraction = true;
                    controllerData.pickedPointVisualCue.isVisible = false;
                    this._scene.simulatePointerDown(controllerData.pick, pointerEventInit);
                } else if (!pressed && controllerData.pick && controllerData.grabInteraction) {
                    this._scene.simulatePointerUp(controllerData.pick, pointerEventInit);
                    controllerData.grabInteraction = false;
                    controllerData.pickedPointVisualCue.isVisible = true;
                }
            } else {
                if (pressed && !this._options.enableNearInteractionOnAllControllers && !this._options.disableSwitchOnClick) {
                    this._attachedController = xrController.uniqueId;
                }
            }
        };

        if (xrController.inputSource.gamepad) {
            const init = (motionController: WebXRAbstractMotionController) => {
                controllerData.squeezeComponent = motionController.getComponent("grasp");
                if (controllerData.squeezeComponent) {
                    controllerData.onSqueezeButtonChangedObserver = controllerData.squeezeComponent.onButtonStateChangedObservable.add((component) => {
                        if (component.changes.pressed) {
                            const pressed = component.changes.pressed.current;
                            grabCheck(pressed);
                        }
                    });
                } else {
                    controllerData.selectionComponent = motionController.getMainComponent();
                    controllerData.onButtonChangedObserver = controllerData.selectionComponent.onButtonStateChangedObservable.add((component) => {
                        if (component.changes.pressed) {
                            const pressed = component.changes.pressed.current;
                            grabCheck(pressed);
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
                if (
                    controllerData.xrController &&
                    event.inputSource === controllerData.xrController.inputSource &&
                    controllerData.pick &&
                    this._isControllerReadyForNearInteraction(controllerData.id) &&
                    controllerData.meshUnderPointer &&
                    this._nearGrabPredicate(controllerData.meshUnderPointer)
                ) {
                    controllerData.grabInteraction = true;
                    controllerData.pickedPointVisualCue.isVisible = false;
                    this._scene.simulatePointerDown(controllerData.pick, pointerEventInit);
                }
            };

            const selectEndListener = (event: XRInputSourceEvent) => {
                if (controllerData.xrController && event.inputSource === controllerData.xrController.inputSource && controllerData.pick && this._isControllerReadyForNearInteraction(controllerData.id)) {
                    this._scene.simulatePointerUp(controllerData.pick, pointerEventInit);
                    controllerData.grabInteraction = false;
                    controllerData.pickedPointVisualCue.isVisible = true;
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
        controllerData.touchCollisionMesh.dispose();
        controllerData.pickedPointVisualCue.dispose();

        this._xrSessionManager.runInXRFrame(() => {
            // Fire a pointerup
            const pointerEventInit: PointerEventInit = {
                pointerId: controllerData.id,
                pointerType: "xr",
            };
            this._scene.simulatePointerUp(new PickingInfo(), pointerEventInit);
        });

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

    private _generateNewTouchPointMesh() {
        // populate information for near hover, pick and pinch
        const meshCreationScene = this._options.useUtilityLayer ? this._options.customUtilityLayerScene || UtilityLayerRenderer.DefaultUtilityLayer.utilityLayerScene : this._scene;

        let touchCollisionMesh = CreateSphere("PickSphere", { diameter: 1 }, meshCreationScene);
        touchCollisionMesh.scaling.set(this._pickRadius, this._pickRadius, this._pickRadius);
        touchCollisionMesh.isVisible = false;

        // Generate the material for the touch mesh visuals
        NodeMaterial.ParseFromSnippetAsync("8RUNKL#3", meshCreationScene).then(nodeMaterial => {
            touchCollisionMesh.material = nodeMaterial;
        });

        const easingFunction = new QuadraticEase();
        easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

        let touchKeys = [
            {frame:  0, value: new Vector3(0.03, 0.03, 0.03)},
            {frame: 10, value: new Vector3(0.046, 0.046, 0.046)},
            {frame: 18, value: new Vector3(0.04, 0.04, 0.04)}
        ];
        let releaseKeys = [
            {frame:  0, value: new Vector3(0.04, 0.04, 0.04)},
            {frame: 10, value: new Vector3(0.024, 0.024, 0.024)},
            {frame: 18, value: new Vector3(0.03, 0.03, 0.03)}
        ];
        let hydrateKeys = [
            {frame:  0, value: new Vector3(0.0, 0.0, 0.0)},
            {frame: 12, value: new Vector3(0.035, 0.035, 0.035)},
            {frame: 15, value: new Vector3(0.03, 0.03, 0.03)}
        ];
        let dehydrateKeys = [
            {frame:  0, value: new Vector3(0.03, 0.03, 0.03)},
            {frame: 10, value: new Vector3(0.0, 0.0, 0.0)},
            {frame: 15, value: new Vector3(0.0, 0.0, 0.0)}
        ];

        let touchAction = new Animation("touch", "scaling", 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        let releaseAction = new Animation("release", "scaling", 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        let hydrateAction = new Animation("hydrate", "scaling", 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        let dehydrateAction = new Animation("dehydrate", "scaling", 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

        touchAction.setEasingFunction(easingFunction);
        releaseAction.setEasingFunction(easingFunction);
        hydrateAction.setEasingFunction(easingFunction);
        dehydrateAction.setEasingFunction(easingFunction);

        touchAction.setKeys(touchKeys);
        releaseAction.setKeys(releaseKeys);
        hydrateAction.setKeys(hydrateKeys);
        dehydrateAction.setKeys(dehydrateKeys);

        let touchCollisionMeshFunction = (isTouch: boolean) => {
            let action = isTouch ? touchAction : releaseAction;
            meshCreationScene.beginDirectAnimation(touchCollisionMesh, [action], 0, 18, false, 1);
        };

        let hydrateCollisionMeshFunction = (isHydration: boolean) => {
            let action = isHydration ? hydrateAction : dehydrateAction;
            if (isHydration) {
                touchCollisionMesh.isVisible = true;
            }
            meshCreationScene.beginDirectAnimation(touchCollisionMesh, [action], 0, 15, false, 1, () => {
                if (!isHydration) {
                    touchCollisionMesh.isVisible = false;
                }
            });
        };

        return {touchCollisionMesh, touchCollisionMeshFunction, hydrateCollisionMeshFunction};
    }

    private _pickWithSphere(controllerData: ControllerData, radius: number, sceneToUse: Scene, predicate: (mesh: AbstractMesh) => boolean): Nullable<PickingInfo> {
        let pickingInfo = new PickingInfo();
        pickingInfo.distance = +Infinity;

        if (controllerData.touchCollisionMesh && controllerData.xrController) {
            const position = controllerData.touchCollisionMesh.position;
            const sphere = BoundingSphere.CreateFromCenterAndRadius(position, radius);

            for (let meshIndex = 0; meshIndex < sceneToUse.meshes.length; meshIndex++) {
                let mesh = sceneToUse.meshes[meshIndex];
                if (!predicate(mesh) || !this._controllerAvailablePredicate(mesh, controllerData.xrController.uniqueId)) {
                    continue;
                }
                let result = WebXRNearInteraction.PickMeshWithSphere(mesh, sphere);

                if (result && result.hit && result.distance < pickingInfo.distance) {
                    pickingInfo.hit = result.hit;
                    pickingInfo.pickedMesh = mesh;
                    pickingInfo.pickedPoint = result.pickedPoint;
                    pickingInfo.aimTransform = controllerData.xrController.pointer;
                    pickingInfo.gripTransform = controllerData.xrController.grip || null;
                    pickingInfo.originMesh = controllerData.touchCollisionMesh;
                    pickingInfo.distance = result.distance;
                }
            }
        }
        return pickingInfo;
    }

    /**
     * Picks a mesh with a sphere
     * @param mesh the mesh to pick
     * @param sphere picking sphere in world coordinates
     * @param skipBoundingInfo a boolean indicating if we should skip the bounding info check
     * @returns the picking info
     */
    public static PickMeshWithSphere(mesh: AbstractMesh, sphere: BoundingSphere, skipBoundingInfo = false): PickingInfo {
        const subMeshes = mesh.subMeshes;
        const pi = new PickingInfo();
        const boundingInfo = mesh.getBoundingInfo();

        if (!mesh._generatePointsArray()) {
            return pi;
        }

        if (!mesh.subMeshes || !boundingInfo) {
            return pi;
        }

        if (!skipBoundingInfo && !BoundingSphere.Intersects(boundingInfo.boundingSphere, sphere)) {
            return pi;
        }

        const result = TmpVectors.Vector3[0];
        const tmpVec = TmpVectors.Vector3[1];

        let distance = +Infinity;
        let tmp, tmpDistanceSphereToCenter, tmpDistanceSurfaceToCenter;
        const center = TmpVectors.Vector3[2];
        const worldToMesh = TmpVectors.Matrix[0];
        worldToMesh.copyFrom(mesh.getWorldMatrix());
        worldToMesh.invert();
        Vector3.TransformCoordinatesToRef(sphere.center, worldToMesh, center);

        for (var index = 0; index < subMeshes.length; index++) {
            const subMesh = subMeshes[index];

            subMesh.projectToRef(center, <Vector3[]>mesh._positions, <IndicesArray>mesh.getIndices(), tmpVec);

            Vector3.TransformCoordinatesToRef(tmpVec, mesh.getWorldMatrix(), tmpVec);
            tmp = Vector3.Distance(tmpVec, sphere.center);

            // Check for finger inside of mesh
            tmpDistanceSurfaceToCenter = Vector3.Distance(tmpVec, mesh.getAbsolutePosition());
            tmpDistanceSphereToCenter = Vector3.Distance(sphere.center, mesh.getAbsolutePosition());
            if (tmpDistanceSphereToCenter !== -1 && tmpDistanceSurfaceToCenter !== -1 && tmpDistanceSurfaceToCenter > tmpDistanceSphereToCenter) {
                tmp = 0;
                tmpVec.copyFrom(sphere.center);
            }

            if (tmp !== -1 && tmp < distance) {
                distance = tmp;
                result.copyFrom(tmpVec);
            }
        }

        if (distance < sphere.radius) {
            pi.hit = true;
            pi.distance = distance;
            pi.pickedMesh = mesh;
            pi.pickedPoint = result.clone();
        }

        return pi;
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

import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import type { WebXRSessionManager } from "../webXRSessionManager";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Observer } from "../../Misc/observable";
import type { WebXRInput } from "../webXRInput";
import type { WebXRInputSource } from "../webXRInputSource";
import type { Scene } from "../../scene";
import type { WebXRControllerComponent } from "../motionController/webXRControllerComponent";
import type { Nullable } from "../../types";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { Color3 } from "../../Maths/math.color";
import { Axis } from "../../Maths/math.axis";
import { StandardMaterial } from "../../Materials/standardMaterial";
import { CreateCylinder } from "../../Meshes/Builders/cylinderBuilder";
import { CreateTorus } from "../../Meshes/Builders/torusBuilder";
import { Ray } from "../../Culling/ray";
import { PickingInfo } from "../../Collisions/pickingInfo";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { UtilityLayerRenderer } from "../../Rendering/utilityLayerRenderer";
import type { WebXRAbstractMotionController } from "../motionController/webXRAbstractMotionController";
import type { WebXRCamera } from "../webXRCamera";
import type { Node } from "../../node";
import { Viewport } from "../../Maths/math.viewport";
import type { Mesh } from "../../Meshes/mesh";
import { Tools } from "../../Misc/tools";

/**
 * Options interface for the pointer selection module
 */
export interface IWebXRControllerPointerSelectionOptions {
    /**
     * if provided, this scene will be used to render meshes.
     */
    customUtilityLayerScene?: Scene;
    /**
     * Disable the pointer up event when the xr controller in screen and gaze mode is disposed (meaning - when the user removed the finger from the screen)
     * If not disabled, the last picked point will be used to execute a pointer up event
     * If disabled, pointer up event will be triggered right after the pointer down event.
     * Used in screen and gaze target ray mode only
     */
    disablePointerUpOnTouchOut: boolean;
    /**
     * For gaze mode for tracked-pointer / controllers (time to select instead of button press)
     */
    forceGazeMode: boolean;
    /**
     * Factor to be applied to the pointer-moved function in the gaze mode. How sensitive should the gaze mode be when checking if the pointer moved
     * to start a new countdown to the pointer down event.
     * Defaults to 1.
     */
    gazeModePointerMovedFactor?: number;
    /**
     * Different button type to use instead of the main component
     */
    overrideButtonId?: string;
    /**
     *  use this rendering group id for the meshes (optional)
     */
    renderingGroupId?: number;
    /**
     * The amount of time in milliseconds it takes between pick found something to a pointer down event.
     * Used in gaze modes. Tracked pointer uses the trigger, screen uses touch events
     * 3000 means 3 seconds between pointing at something and selecting it
     */
    timeToSelect?: number;
    /**
     * Should meshes created here be added to a utility layer or the main scene
     */
    useUtilityLayer?: boolean;
    /**
     * Optional WebXR camera to be used for gaze selection
     */
    gazeCamera?: WebXRCamera;
    /**
     * the xr input to use with this pointer selection
     */
    xrInput: WebXRInput;

    /**
     * Should the scene pointerX and pointerY update be disabled
     * This is required for fullscreen AR GUI, but might slow down other experiences.
     * Disable in VR, if not needed.
     * The first rig camera (left eye) will be used to calculate the projection
     */
    disableScenePointerVectorUpdate: boolean;

    /**
     * Enable pointer selection on all controllers instead of switching between them
     */
    enablePointerSelectionOnAllControllers?: boolean;

    /**
     * The preferred hand to give the pointer selection to. This will be prioritized when the controller initialize.
     * If switch is enabled, it will still allow the user to switch between the different controllers
     */
    preferredHandedness?: XRHandedness;

    /**
     * Disable switching the pointer selection from one controller to the other.
     * If the preferred hand is set it will be fixed on this hand, and if not it will be fixed on the first controller added to the scene
     */
    disableSwitchOnClick?: boolean;

    /**
     * The maximum distance of the pointer selection feature. Defaults to 100.
     */
    maxPointerDistance?: number;

    /**
     * A function that will be called when a new selection mesh is generated.
     * This function should return a mesh that will be used as the selection mesh.
     * The default is a torus with a 0.01 diameter and 0.0075 thickness .
     */
    customSelectionMeshGenerator?: () => Mesh;

    /**
     * A function that will be called when a new laser pointer mesh is generated.
     * This function should return a mesh that will be used as the laser pointer mesh.
     * The height (y) of the mesh must be 1.
     */
    customLasterPointerMeshGenerator?: () => AbstractMesh;

    /**
     * Use the grip space instead of the pointer space for selection, if available.
     */
    forceGripIfAvailable?: boolean;

    /**
     * If set to true, the hand rays will be disabled and the user will be able to look and pick objects.
     * This requires system support (like in the vision OS) and will not work in all systems.
     * @experimental - this is an experimental feature and might change int he future
     */
    lookAndPickMode?: boolean;
}

/**
 * A module that will enable pointer selection for motion controllers of XR Input Sources
 */
export class WebXRControllerPointerSelection extends WebXRAbstractFeature {
    private static _IdCounter = 200;

    private _attachController = (xrController: WebXRInputSource) => {
        if (this._controllers[xrController.uniqueId]) {
            // already attached
            return;
        }

        const { laserPointer, selectionMesh } = this._generateNewMeshPair(this._options.forceGripIfAvailable && xrController.grip ? xrController.grip : xrController.pointer);

        // get two new meshes
        this._controllers[xrController.uniqueId] = {
            xrController,
            laserPointer,
            selectionMesh,
            meshUnderPointer: null,
            pick: null,
            tmpRay: new Ray(new Vector3(), new Vector3()),
            disabledByNearInteraction: false,
            id: WebXRControllerPointerSelection._IdCounter++,
        };

        if (this._attachedController) {
            if (
                !this._options.enablePointerSelectionOnAllControllers &&
                this._options.preferredHandedness &&
                xrController.inputSource.handedness === this._options.preferredHandedness
            ) {
                this._attachedController = xrController.uniqueId;
            }
        } else {
            if (!this._options.enablePointerSelectionOnAllControllers) {
                this._attachedController = xrController.uniqueId;
            }
        }

        switch (xrController.inputSource.targetRayMode) {
            case "tracked-pointer":
                return this._attachTrackedPointerRayMode(xrController);
            case "gaze":
                return this._attachGazeMode(xrController);
            case "screen":
            case "transient-pointer":
                return this._attachScreenRayMode(xrController);
        }
    };

    private _controllers: {
        [controllerUniqueId: string]: {
            xrController?: WebXRInputSource;
            webXRCamera?: WebXRCamera;
            selectionComponent?: WebXRControllerComponent;
            onButtonChangedObserver?: Nullable<Observer<WebXRControllerComponent>>;
            onFrameObserver?: Nullable<Observer<XRFrame>>;
            laserPointer: AbstractMesh;
            selectionMesh: AbstractMesh;
            meshUnderPointer: Nullable<AbstractMesh>;
            pick: Nullable<PickingInfo>;
            id: number;
            tmpRay: Ray;
            disabledByNearInteraction: boolean;
            // event support
            eventListeners?: { [event in XREventType]?: (event: XRInputSourceEvent) => void };
            screenCoordinates?: { x: number; y: number };
            pointerDownTriggered?: boolean;
            finalPointerUpTriggered?: boolean;
        };
    } = {};
    private _scene: Scene;
    private _tmpVectorForPickCompare = new Vector3();

    private _attachedController: string;

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.POINTER_SELECTION;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
     * Disable lighting on the laser pointer (so it will always be visible)
     */
    public disablePointerLighting: boolean = true;
    /**
     * Disable lighting on the selection mesh (so it will always be visible)
     */
    public disableSelectionMeshLighting: boolean = true;
    /**
     * Should the laser pointer be displayed
     */
    public displayLaserPointer: boolean = true;
    /**
     * Should the selection mesh be displayed (The ring at the end of the laser pointer)
     */
    public displaySelectionMesh: boolean = true;
    /**
     * This color will be set to the laser pointer when selection is triggered
     */
    public laserPointerPickedColor: Color3 = new Color3(0.9, 0.9, 0.9);
    /**
     * Default color of the laser pointer
     */
    public laserPointerDefaultColor: Color3 = new Color3(0.7, 0.7, 0.7);
    /**
     * default color of the selection ring
     */
    public selectionMeshDefaultColor: Color3 = new Color3(0.8, 0.8, 0.8);
    /**
     * This color will be applied to the selection ring when selection is triggered
     */
    public selectionMeshPickedColor: Color3 = new Color3(0.3, 0.3, 1.0);

    /**
     * Optional filter to be used for ray selection.  This predicate shares behavior with
     * scene.pointerMovePredicate which takes priority if it is also assigned.
     */
    public raySelectionPredicate: (mesh: AbstractMesh) => boolean;

    /**
     * constructs a new background remover module
     * @param _xrSessionManager the session manager for this module
     * @param _options read-only options to be used in this module
     */
    constructor(
        _xrSessionManager: WebXRSessionManager,
        private readonly _options: IWebXRControllerPointerSelectionOptions
    ) {
        super(_xrSessionManager);
        this._scene = this._xrSessionManager.scene;

        // force look and pick mode if using WebXR on safari, assuming it is vision OS
        // Only if not explicitly set. If set to false, it will not be forced
        if (this._options.lookAndPickMode === undefined && (this._scene.getEngine()._badDesktopOS || this._scene.getEngine()._badOS)) {
            this._options.lookAndPickMode = true;
        }

        // look and pick mode extra state changes
        if (this._options.lookAndPickMode) {
            this._options.enablePointerSelectionOnAllControllers = true;
            this.displayLaserPointer = false;
        }
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public override attach(): boolean {
        if (!super.attach()) {
            return false;
        }

        for (const controller of this._options.xrInput.controllers) {
            this._attachController(controller);
        }
        this._addNewAttachObserver(this._options.xrInput.onControllerAddedObservable, this._attachController, true);
        this._addNewAttachObserver(
            this._options.xrInput.onControllerRemovedObservable,
            (controller) => {
                // REMOVE the controller
                this._detachController(controller.uniqueId);
            },
            true
        );

        this._scene.constantlyUpdateMeshUnderPointer = true;

        if (this._options.gazeCamera) {
            const webXRCamera = this._options.gazeCamera;

            const { laserPointer, selectionMesh } = this._generateNewMeshPair(webXRCamera);

            this._controllers["camera"] = {
                webXRCamera,
                laserPointer,
                selectionMesh,
                meshUnderPointer: null,
                pick: null,
                tmpRay: new Ray(new Vector3(), new Vector3()),
                disabledByNearInteraction: false,
                id: WebXRControllerPointerSelection._IdCounter++,
            };
            this._attachGazeMode();
        }

        return true;
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public override detach(): boolean {
        if (!super.detach()) {
            return false;
        }
        const keys = Object.keys(this._controllers);
        for (const controllerId of keys) {
            this._detachController(controllerId);
        }

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
     * @internal
     */
    public _getPointerSelectionDisabledByPointerId(id: number): boolean {
        const keys = Object.keys(this._controllers);

        for (let i = 0; i < keys.length; ++i) {
            if (this._controllers[keys[i]].id === id) {
                return this._controllers[keys[i]].disabledByNearInteraction;
            }
        }
        return true;
    }

    /**
     * @internal
     */
    public _setPointerSelectionDisabledByPointerId(id: number, state: boolean) {
        const keys = Object.keys(this._controllers);

        for (let i = 0; i < keys.length; ++i) {
            if (this._controllers[keys[i]].id === id) {
                this._controllers[keys[i]].disabledByNearInteraction = state;
                return;
            }
        }
    }

    private _identityMatrix = Matrix.Identity();
    private _screenCoordinatesRef = Vector3.Zero();
    private _viewportRef = new Viewport(0, 0, 0, 0);

    protected _onXRFrame(_xrFrame: XRFrame) {
        const keys = Object.keys(this._controllers);
        for (const id of keys) {
            // look and pick mode
            // only do this for the selected pointer
            const controllerData = this._controllers[id];
            if (this._options.lookAndPickMode && controllerData.xrController?.inputSource.targetRayMode !== "transient-pointer") {
                return;
            }
            if ((!this._options.enablePointerSelectionOnAllControllers && id !== this._attachedController) || controllerData.disabledByNearInteraction) {
                controllerData.selectionMesh.isVisible = false;
                controllerData.laserPointer.isVisible = false;
                controllerData.pick = null;
                return;
            }

            controllerData.laserPointer.isVisible = this.displayLaserPointer;

            let controllerGlobalPosition: Vector3;

            // Every frame check collisions/input
            if (controllerData.xrController) {
                controllerGlobalPosition =
                    this._options.forceGripIfAvailable && controllerData.xrController.grip
                        ? controllerData.xrController.grip.position
                        : controllerData.xrController.pointer.position;
                controllerData.xrController.getWorldPointerRayToRef(controllerData.tmpRay, this._options.forceGripIfAvailable);
            } else if (controllerData.webXRCamera) {
                controllerGlobalPosition = controllerData.webXRCamera.position;
                controllerData.webXRCamera.getForwardRayToRef(controllerData.tmpRay);
            } else {
                return;
            }

            if (this._options.maxPointerDistance) {
                controllerData.tmpRay.length = this._options.maxPointerDistance;
            }
            // update pointerX and pointerY of the scene. Only if the flag is set to true!
            if (!this._options.disableScenePointerVectorUpdate && controllerGlobalPosition) {
                const scene = this._xrSessionManager.scene;
                const camera = this._options.xrInput.xrCamera;
                if (camera) {
                    camera.viewport.toGlobalToRef(scene.getEngine().getRenderWidth() / camera.rigCameras.length, scene.getEngine().getRenderHeight(), this._viewportRef);
                    Vector3.ProjectToRef(controllerGlobalPosition, this._identityMatrix, camera.getTransformationMatrix(), this._viewportRef, this._screenCoordinatesRef);
                    // stay safe
                    if (
                        typeof this._screenCoordinatesRef.x === "number" &&
                        typeof this._screenCoordinatesRef.y === "number" &&
                        !isNaN(this._screenCoordinatesRef.x) &&
                        !isNaN(this._screenCoordinatesRef.y) &&
                        this._screenCoordinatesRef.x !== Infinity &&
                        this._screenCoordinatesRef.y !== Infinity
                    ) {
                        scene.pointerX = this._screenCoordinatesRef.x;
                        scene.pointerY = this._screenCoordinatesRef.y;

                        controllerData.screenCoordinates = {
                            x: this._screenCoordinatesRef.x,
                            y: this._screenCoordinatesRef.y,
                        };
                    }
                }
            }

            let utilityScenePick = null;
            if (this._utilityLayerScene) {
                utilityScenePick = this._utilityLayerScene.pickWithRay(controllerData.tmpRay, this._utilityLayerScene.pointerMovePredicate || this.raySelectionPredicate);
            }

            const originalScenePick = this._scene.pickWithRay(controllerData.tmpRay, this._scene.pointerMovePredicate || this.raySelectionPredicate);
            if (!utilityScenePick || !utilityScenePick.hit) {
                // No hit in utility scene
                controllerData.pick = originalScenePick;
            } else if (!originalScenePick || !originalScenePick.hit) {
                // No hit in original scene
                controllerData.pick = utilityScenePick;
            } else if (utilityScenePick.distance < originalScenePick.distance) {
                // Hit is closer in utility scene
                controllerData.pick = utilityScenePick;
            } else {
                // Hit is closer in original scene
                controllerData.pick = originalScenePick;
            }

            if (controllerData.pick && controllerData.xrController) {
                controllerData.pick.aimTransform = controllerData.xrController.pointer;
                controllerData.pick.gripTransform = controllerData.xrController.grip || null;
                controllerData.pick.originMesh = controllerData.xrController.pointer;
                controllerData.tmpRay.length = controllerData.pick.distance;
            }

            const pick = controllerData.pick;

            if (pick && pick.pickedPoint && pick.hit) {
                // Update laser state
                this._updatePointerDistance(controllerData.laserPointer, pick.distance);

                // Update cursor state
                controllerData.selectionMesh.position.copyFrom(pick.pickedPoint);
                controllerData.selectionMesh.scaling.x = Math.sqrt(pick.distance);
                controllerData.selectionMesh.scaling.y = Math.sqrt(pick.distance);
                controllerData.selectionMesh.scaling.z = Math.sqrt(pick.distance);

                // To avoid z-fighting
                const pickNormal = this._convertNormalToDirectionOfRay(pick.getNormal(true), controllerData.tmpRay);
                const deltaFighting = 0.001;
                controllerData.selectionMesh.position.copyFrom(pick.pickedPoint);
                if (pickNormal) {
                    const axis1 = Vector3.Cross(Axis.Y, pickNormal);
                    const axis2 = Vector3.Cross(pickNormal, axis1);
                    Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, controllerData.selectionMesh.rotation);
                    controllerData.selectionMesh.position.addInPlace(pickNormal.scale(deltaFighting));
                }
                controllerData.selectionMesh.isVisible = this.displaySelectionMesh;
                controllerData.meshUnderPointer = pick.pickedMesh;
            } else {
                controllerData.selectionMesh.isVisible = false;
                this._updatePointerDistance(controllerData.laserPointer, 1);
                controllerData.meshUnderPointer = null;
            }
        }
    }

    private get _utilityLayerScene() {
        return this._options.customUtilityLayerScene || UtilityLayerRenderer.DefaultUtilityLayer.utilityLayerScene;
    }

    private _attachGazeMode(xrController?: WebXRInputSource) {
        const controllerData = this._controllers[(xrController && xrController.uniqueId) || "camera"];
        // attached when touched, detaches when raised
        const timeToSelect = this._options.timeToSelect || 3000;
        const sceneToRenderTo = this._options.useUtilityLayer ? this._utilityLayerScene : this._scene;
        let oldPick = new PickingInfo();
        const discMesh = CreateTorus(
            "selection",
            {
                diameter: 0.0035 * 15,
                thickness: 0.0025 * 6,
                tessellation: 20,
            },
            sceneToRenderTo
        );
        discMesh.isVisible = false;
        discMesh.isPickable = false;
        discMesh.parent = controllerData.selectionMesh;
        let timer = 0;
        let downTriggered = false;
        const pointerEventInit: PointerEventInit = {
            pointerId: controllerData.id,
            pointerType: "xr",
        };
        controllerData.onFrameObserver = this._xrSessionManager.onXRFrameObservable.add(() => {
            if (!controllerData.pick) {
                return;
            }
            this._augmentPointerInit(pointerEventInit, controllerData.id, controllerData.screenCoordinates);
            controllerData.laserPointer.material!.alpha = 0;
            discMesh.isVisible = false;
            if (controllerData.pick.hit) {
                if (!this._pickingMoved(oldPick, controllerData.pick)) {
                    if (timer > timeToSelect / 10) {
                        discMesh.isVisible = true;
                    }

                    timer += this._scene.getEngine().getDeltaTime();
                    if (timer >= timeToSelect) {
                        this._scene.simulatePointerDown(controllerData.pick, pointerEventInit);
                        // this pointerdown event is not setting the controllerData.pointerDownTriggered to avoid a pointerUp event when this feature is detached
                        downTriggered = true;
                        // pointer up right after down, if disable on touch out
                        if (this._options.disablePointerUpOnTouchOut) {
                            this._scene.simulatePointerUp(controllerData.pick, pointerEventInit);
                        }
                        discMesh.isVisible = false;
                    } else {
                        const scaleFactor = 1 - timer / timeToSelect;
                        discMesh.scaling.set(scaleFactor, scaleFactor, scaleFactor);
                    }
                } else {
                    if (downTriggered) {
                        if (!this._options.disablePointerUpOnTouchOut) {
                            this._scene.simulatePointerUp(controllerData.pick, pointerEventInit);
                        }
                    }
                    downTriggered = false;
                    timer = 0;
                }
            } else {
                downTriggered = false;
                timer = 0;
            }

            this._scene.simulatePointerMove(controllerData.pick, pointerEventInit);

            oldPick = controllerData.pick;
        });

        if (this._options.renderingGroupId !== undefined) {
            discMesh.renderingGroupId = this._options.renderingGroupId;
        }
        if (xrController) {
            xrController.onDisposeObservable.addOnce(() => {
                if (controllerData.pick && !this._options.disablePointerUpOnTouchOut && downTriggered) {
                    this._scene.simulatePointerUp(controllerData.pick, pointerEventInit);
                    controllerData.finalPointerUpTriggered = true;
                }
                discMesh.dispose();
            });
        }
    }

    private _attachScreenRayMode(xrController: WebXRInputSource) {
        const controllerData = this._controllers[xrController.uniqueId];
        let downTriggered = false;
        const pointerEventInit: PointerEventInit = {
            pointerId: controllerData.id,
            pointerType: "xr",
        };
        controllerData.onFrameObserver = this._xrSessionManager.onXRFrameObservable.add(() => {
            this._augmentPointerInit(pointerEventInit, controllerData.id, controllerData.screenCoordinates);
            if (!controllerData.pick || (this._options.disablePointerUpOnTouchOut && downTriggered)) {
                return;
            }
            if (!downTriggered) {
                this._scene.simulatePointerDown(controllerData.pick, pointerEventInit);
                controllerData.pointerDownTriggered = true;
                downTriggered = true;
                if (this._options.disablePointerUpOnTouchOut) {
                    this._scene.simulatePointerUp(controllerData.pick, pointerEventInit);
                }
            } else {
                this._scene.simulatePointerMove(controllerData.pick, pointerEventInit);
            }
        });
        xrController.onDisposeObservable.addOnce(() => {
            this._augmentPointerInit(pointerEventInit, controllerData.id, controllerData.screenCoordinates);
            this._xrSessionManager.runInXRFrame(() => {
                if (controllerData.pick && !controllerData.finalPointerUpTriggered && downTriggered && !this._options.disablePointerUpOnTouchOut) {
                    this._scene.simulatePointerUp(controllerData.pick, pointerEventInit);
                    controllerData.finalPointerUpTriggered = true;
                }
            });
        });
    }

    private _attachTrackedPointerRayMode(xrController: WebXRInputSource) {
        const controllerData = this._controllers[xrController.uniqueId];
        if (this._options.forceGazeMode) {
            return this._attachGazeMode(xrController);
        }
        const pointerEventInit: PointerEventInit = {
            pointerId: controllerData.id,
            pointerType: "xr",
        };
        controllerData.onFrameObserver = this._xrSessionManager.onXRFrameObservable.add(() => {
            (<StandardMaterial>controllerData.laserPointer.material).disableLighting = this.disablePointerLighting;
            (<StandardMaterial>controllerData.selectionMesh.material).disableLighting = this.disableSelectionMeshLighting;

            if (controllerData.pick) {
                this._augmentPointerInit(pointerEventInit, controllerData.id, controllerData.screenCoordinates);
                this._scene.simulatePointerMove(controllerData.pick, pointerEventInit);
            }
        });
        if (xrController.inputSource.gamepad) {
            const init = (motionController: WebXRAbstractMotionController) => {
                if (this._options.overrideButtonId) {
                    controllerData.selectionComponent = motionController.getComponent(this._options.overrideButtonId);
                }
                if (!controllerData.selectionComponent) {
                    controllerData.selectionComponent = motionController.getMainComponent();
                }

                controllerData.onButtonChangedObserver = controllerData.selectionComponent.onButtonStateChangedObservable.add((component) => {
                    if (component.changes.pressed) {
                        const pressed = component.changes.pressed.current;
                        if (controllerData.pick) {
                            if (this._options.enablePointerSelectionOnAllControllers || xrController.uniqueId === this._attachedController) {
                                this._augmentPointerInit(pointerEventInit, controllerData.id, controllerData.screenCoordinates);
                                if (pressed) {
                                    this._scene.simulatePointerDown(controllerData.pick, pointerEventInit);
                                    controllerData.pointerDownTriggered = true;
                                    (<StandardMaterial>controllerData.selectionMesh.material).emissiveColor = this.selectionMeshPickedColor;
                                    (<StandardMaterial>controllerData.laserPointer.material).emissiveColor = this.laserPointerPickedColor;
                                } else {
                                    this._scene.simulatePointerUp(controllerData.pick, pointerEventInit);
                                    (<StandardMaterial>controllerData.selectionMesh.material).emissiveColor = this.selectionMeshDefaultColor;
                                    (<StandardMaterial>controllerData.laserPointer.material).emissiveColor = this.laserPointerDefaultColor;
                                }
                            }
                        } else {
                            if (pressed && !this._options.enablePointerSelectionOnAllControllers && !this._options.disableSwitchOnClick) {
                                // force a pointer up if switching controllers
                                // get the controller that was attached before
                                const prevController = this._controllers[this._attachedController];
                                if (prevController && prevController.pointerDownTriggered && !prevController.finalPointerUpTriggered) {
                                    this._augmentPointerInit(pointerEventInit, prevController.id, prevController.screenCoordinates);
                                    this._scene.simulatePointerUp(new PickingInfo(), {
                                        pointerId: prevController.id,
                                        pointerType: "xr",
                                    });
                                    prevController.finalPointerUpTriggered = true;
                                }
                                this._attachedController = xrController.uniqueId;
                            }
                        }
                    }
                });
            };
            if (xrController.motionController) {
                init(xrController.motionController);
            } else {
                xrController.onMotionControllerInitObservable.add(init);
            }
        } else {
            // use the select and squeeze events
            const selectStartListener = (event: XRInputSourceEvent) => {
                this._xrSessionManager.onXRFrameObservable.addOnce(() => {
                    this._augmentPointerInit(pointerEventInit, controllerData.id, controllerData.screenCoordinates);
                    if (controllerData.xrController && event.inputSource === controllerData.xrController.inputSource && controllerData.pick) {
                        this._scene.simulatePointerDown(controllerData.pick, pointerEventInit);
                        controllerData.pointerDownTriggered = true;
                        (<StandardMaterial>controllerData.selectionMesh.material).emissiveColor = this.selectionMeshPickedColor;
                        (<StandardMaterial>controllerData.laserPointer.material).emissiveColor = this.laserPointerPickedColor;
                    }
                });
            };

            const selectEndListener = (event: XRInputSourceEvent) => {
                this._xrSessionManager.onXRFrameObservable.addOnce(() => {
                    this._augmentPointerInit(pointerEventInit, controllerData.id, controllerData.screenCoordinates);
                    if (controllerData.xrController && event.inputSource === controllerData.xrController.inputSource && controllerData.pick) {
                        this._scene.simulatePointerUp(controllerData.pick, pointerEventInit);
                        (<StandardMaterial>controllerData.selectionMesh.material).emissiveColor = this.selectionMeshDefaultColor;
                        (<StandardMaterial>controllerData.laserPointer.material).emissiveColor = this.laserPointerDefaultColor;
                    }
                });
            };

            controllerData.eventListeners = {
                selectend: selectEndListener,
                selectstart: selectStartListener,
            };

            this._xrSessionManager.session.addEventListener("selectstart", selectStartListener);
            this._xrSessionManager.session.addEventListener("selectend", selectEndListener);
        }
    }

    private _convertNormalToDirectionOfRay(normal: Nullable<Vector3>, ray: Ray) {
        if (normal) {
            const angle = Math.acos(Vector3.Dot(normal, ray.direction));
            if (angle < Math.PI / 2) {
                normal.scaleInPlace(-1);
            }
        }
        return normal;
    }

    private _detachController(xrControllerUniqueId: string) {
        const controllerData = this._controllers[xrControllerUniqueId];
        if (!controllerData) {
            return;
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
            const keys = Object.keys(controllerData.eventListeners);
            for (const eventName of keys) {
                const func = controllerData.eventListeners && controllerData.eventListeners[eventName as XREventType];
                if (func) {
                    // For future reference - this is an issue in the WebXR typings.
                    this._xrSessionManager.session.removeEventListener(eventName as XREventType, func as any);
                }
            }
        }

        if (!controllerData.finalPointerUpTriggered && controllerData.pointerDownTriggered) {
            // Stay safe and fire a pointerup, in case it wasn't already triggered
            const pointerEventInit: PointerEventInit = {
                pointerId: controllerData.id,
                pointerType: "xr",
            };
            this._xrSessionManager.runInXRFrame(() => {
                this._augmentPointerInit(pointerEventInit, controllerData.id, controllerData.screenCoordinates);
                this._scene.simulatePointerUp(controllerData.pick || new PickingInfo(), pointerEventInit);
                controllerData.finalPointerUpTriggered = true;
            });
        }
        this._xrSessionManager.scene.onBeforeRenderObservable.addOnce(() => {
            try {
                controllerData.selectionMesh.dispose();
                controllerData.laserPointer.dispose();
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
            } catch (e) {
                Tools.Warn("controller already detached.");
            }
        });
    }

    private _generateNewMeshPair(meshParent: Node) {
        const sceneToRenderTo = this._options.useUtilityLayer ? this._options.customUtilityLayerScene || UtilityLayerRenderer.DefaultUtilityLayer.utilityLayerScene : this._scene;
        const laserPointer = this._options.customLasterPointerMeshGenerator
            ? this._options.customLasterPointerMeshGenerator()
            : CreateCylinder(
                  "laserPointer",
                  {
                      height: 1,
                      diameterTop: 0.0002,
                      diameterBottom: 0.004,
                      tessellation: 20,
                      subdivisions: 1,
                  },
                  sceneToRenderTo
              );
        laserPointer.parent = meshParent;
        const laserPointerMaterial = new StandardMaterial("laserPointerMat", sceneToRenderTo);
        laserPointerMaterial.emissiveColor = this.laserPointerDefaultColor;
        laserPointerMaterial.alpha = 0.7;
        laserPointer.material = laserPointerMaterial;
        laserPointer.rotation.x = Math.PI / 2;
        this._updatePointerDistance(laserPointer, 1);
        laserPointer.isPickable = false;
        laserPointer.isVisible = false;

        // Create a gaze tracker for the  XR controller
        const selectionMesh = this._options.customSelectionMeshGenerator
            ? this._options.customSelectionMeshGenerator()
            : CreateTorus(
                  "gazeTracker",
                  {
                      diameter: 0.0035 * 3,
                      thickness: 0.0025 * 3,
                      tessellation: 20,
                  },
                  sceneToRenderTo
              );
        selectionMesh.bakeCurrentTransformIntoVertices();
        selectionMesh.isPickable = false;
        selectionMesh.isVisible = false;
        const targetMat = new StandardMaterial("targetMat", sceneToRenderTo);
        targetMat.specularColor = Color3.Black();
        targetMat.emissiveColor = this.selectionMeshDefaultColor;
        targetMat.backFaceCulling = false;
        selectionMesh.material = targetMat;

        if (this._options.renderingGroupId !== undefined) {
            laserPointer.renderingGroupId = this._options.renderingGroupId;
            selectionMesh.renderingGroupId = this._options.renderingGroupId;
        }

        return {
            laserPointer,
            selectionMesh,
        };
    }

    private _pickingMoved(oldPick: PickingInfo, newPick: PickingInfo) {
        if (!oldPick.hit || !newPick.hit) {
            return true;
        }
        if (!oldPick.pickedMesh || !oldPick.pickedPoint || !newPick.pickedMesh || !newPick.pickedPoint) {
            return true;
        }
        if (oldPick.pickedMesh !== newPick.pickedMesh) {
            return true;
        }
        oldPick.pickedPoint?.subtractToRef(newPick.pickedPoint, this._tmpVectorForPickCompare);
        this._tmpVectorForPickCompare.set(Math.abs(this._tmpVectorForPickCompare.x), Math.abs(this._tmpVectorForPickCompare.y), Math.abs(this._tmpVectorForPickCompare.z));
        const delta = (this._options.gazeModePointerMovedFactor || 1) * 0.01 * newPick.distance;
        const length = this._tmpVectorForPickCompare.length();
        if (length > delta) {
            return true;
        }
        return false;
    }

    private _updatePointerDistance(_laserPointer: AbstractMesh, distance: number = 100) {
        _laserPointer.scaling.y = distance;
        // a bit of distance from the controller
        if (this._scene.useRightHandedSystem) {
            distance *= -1;
        }
        _laserPointer.position.z = distance / 2 + 0.05;
    }

    private _augmentPointerInit(pointerEventInit: PointerEventInit, id: number, screenCoordinates?: { x: number; y: number }): void {
        pointerEventInit.pointerId = id;
        pointerEventInit.pointerType = "xr";
        if (screenCoordinates) {
            pointerEventInit.screenX = screenCoordinates.x;
            pointerEventInit.screenY = screenCoordinates.y;
        }
    }

    /** @internal */
    public get lasterPointerDefaultColor(): Color3 {
        // here due to a typo
        return this.laserPointerDefaultColor;
    }
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRControllerPointerSelection.Name,
    (xrSessionManager, options) => {
        return () => new WebXRControllerPointerSelection(xrSessionManager, options);
    },
    WebXRControllerPointerSelection.Version,
    true
);

import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import { WebXRSessionManager } from "../webXRSessionManager";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Observer } from "../../Misc/observable";
import { WebXRInput } from "../webXRInput";
import { WebXRInputSource } from "../webXRInputSource";
import { Scene } from "../../scene";
import { WebXRControllerComponent } from "../motionController/webXRControllerComponent";
import { Nullable } from "../../types";
import { Vector3 } from "../../Maths/math.vector";
import { Color3 } from "../../Maths/math.color";
import { Axis } from "../../Maths/math.axis";
import { StandardMaterial } from "../../Materials/standardMaterial";
import { CylinderBuilder } from "../../Meshes/Builders/cylinderBuilder";
import { TorusBuilder } from "../../Meshes/Builders/torusBuilder";
import { Ray } from "../../Culling/ray";
import { PickingInfo } from "../../Collisions/pickingInfo";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { UtilityLayerRenderer } from "../../Rendering/utilityLayerRenderer";
import { WebXRAbstractMotionController } from "../motionController/webXRAbstractMotionController";
import { WebXRCamera } from "../webXRCamera";
import { Node } from "../../node";

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
}

/**
 * A module that will enable pointer selection for motion controllers of XR Input Sources
 */
export class WebXRControllerPointerSelection extends WebXRAbstractFeature {
    private static _idCounter = 200;

    private _attachController = (xrController: WebXRInputSource) => {
        if (this._controllers[xrController.uniqueId]) {
            // already attached
            return;
        }
        // For now no support for hand-tracked input sources!
        if (xrController.inputSource.hand && !xrController.inputSource.gamepad) {
            return;
        }
        // only support tracker pointer
        const { laserPointer, selectionMesh } = this._generateNewMeshPair(xrController.pointer);

        // get two new meshes
        this._controllers[xrController.uniqueId] = {
            xrController,
            laserPointer,
            selectionMesh,
            meshUnderPointer: null,
            pick: null,
            tmpRay: new Ray(new Vector3(), new Vector3()),
            id: WebXRControllerPointerSelection._idCounter++,
        };
        switch (xrController.inputSource.targetRayMode) {
            case "tracked-pointer":
                return this._attachTrackedPointerRayMode(xrController);
            case "gaze":
                return this._attachGazeMode(xrController);
            case "screen":
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
            // event support
            eventListeners?: { [event in XREventType]?: (event: XRInputSourceEvent) => void };
        };
    } = {};
    private _scene: Scene;
    private _tmpVectorForPickCompare = new Vector3();

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
    constructor(_xrSessionManager: WebXRSessionManager, private readonly _options: IWebXRControllerPointerSelectionOptions) {
        super(_xrSessionManager);
        this._scene = this._xrSessionManager.scene;
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

        this._options.xrInput.controllers.forEach(this._attachController);
        this._addNewAttachObserver(this._options.xrInput.onControllerAddedObservable, this._attachController);
        this._addNewAttachObserver(this._options.xrInput.onControllerRemovedObservable, (controller) => {
            // REMOVE the controller
            this._detachController(controller.uniqueId);
        });

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
                id: WebXRControllerPointerSelection._idCounter++,
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

    protected _onXRFrame(_xrFrame: XRFrame) {
        Object.keys(this._controllers).forEach((id) => {
            const controllerData = this._controllers[id];

            // Every frame check collisions/input
            if (controllerData.xrController) {
                controllerData.xrController.getWorldPointerRayToRef(controllerData.tmpRay);
            } else if (controllerData.webXRCamera) {
                controllerData.webXRCamera.getForwardRayToRef(controllerData.tmpRay);
            } else {
                return;
            }
            controllerData.pick = this._scene.pickWithRay(controllerData.tmpRay, this._scene.pointerMovePredicate || this.raySelectionPredicate);

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
                let pickNormal = this._convertNormalToDirectionOfRay(pick.getNormal(true), controllerData.tmpRay);
                let deltaFighting = 0.001;
                controllerData.selectionMesh.position.copyFrom(pick.pickedPoint);
                if (pickNormal) {
                    let axis1 = Vector3.Cross(Axis.Y, pickNormal);
                    let axis2 = Vector3.Cross(pickNormal, axis1);
                    Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, controllerData.selectionMesh.rotation);
                    controllerData.selectionMesh.position.addInPlace(pickNormal.scale(deltaFighting));
                }
                controllerData.selectionMesh.isVisible = true && this.displaySelectionMesh;
                controllerData.meshUnderPointer = pick.pickedMesh;
            } else {
                controllerData.selectionMesh.isVisible = false;
                controllerData.meshUnderPointer = null;
            }
        });
    }

    private _attachGazeMode(xrController?: WebXRInputSource) {
        const controllerData = this._controllers[(xrController && xrController.uniqueId) || "camera"];
        // attached when touched, detaches when raised
        const timeToSelect = this._options.timeToSelect || 3000;
        const sceneToRenderTo = this._options.useUtilityLayer ? this._options.customUtilityLayerScene || UtilityLayerRenderer.DefaultUtilityLayer.utilityLayerScene : this._scene;
        let oldPick = new PickingInfo();
        let discMesh = TorusBuilder.CreateTorus(
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
        controllerData.onFrameObserver = this._xrSessionManager.onXRFrameObservable.add(() => {
            if (!controllerData.pick) {
                return;
            }
            controllerData.laserPointer.material!.alpha = 0;
            discMesh.isVisible = false;
            if (controllerData.pick.hit) {
                if (!this._pickingMoved(oldPick, controllerData.pick)) {
                    if (timer > timeToSelect / 10) {
                        discMesh.isVisible = true;
                    }

                    timer += this._scene.getEngine().getDeltaTime();
                    if (timer >= timeToSelect) {
                        this._scene.simulatePointerDown(controllerData.pick, { pointerId: controllerData.id });
                        downTriggered = true;
                        // pointer up right after down, if disable on touch out
                        if (this._options.disablePointerUpOnTouchOut) {
                            this._scene.simulatePointerUp(controllerData.pick, { pointerId: controllerData.id });
                        }
                        discMesh.isVisible = false;
                    } else {
                        const scaleFactor = 1 - timer / timeToSelect;
                        discMesh.scaling.set(scaleFactor, scaleFactor, scaleFactor);
                    }
                } else {
                    if (downTriggered) {
                        if (!this._options.disablePointerUpOnTouchOut) {
                            this._scene.simulatePointerUp(controllerData.pick, { pointerId: controllerData.id });
                        }
                    }
                    downTriggered = false;
                    timer = 0;
                }
            } else {
                downTriggered = false;
                timer = 0;
            }

            this._scene.simulatePointerMove(controllerData.pick, { pointerId: controllerData.id });

            oldPick = controllerData.pick;
        });

        if (this._options.renderingGroupId !== undefined) {
            discMesh.renderingGroupId = this._options.renderingGroupId;
        }
        if (xrController) {
            xrController.onDisposeObservable.addOnce(() => {
                if (controllerData.pick && !this._options.disablePointerUpOnTouchOut && downTriggered) {
                    this._scene.simulatePointerUp(controllerData.pick, { pointerId: controllerData.id });
                }
                discMesh.dispose();
            });
        }
    }

    private _attachScreenRayMode(xrController: WebXRInputSource) {
        const controllerData = this._controllers[xrController.uniqueId];
        let downTriggered = false;
        controllerData.onFrameObserver = this._xrSessionManager.onXRFrameObservable.add(() => {
            if (!controllerData.pick || (this._options.disablePointerUpOnTouchOut && downTriggered)) {
                return;
            }
            if (!downTriggered) {
                this._scene.simulatePointerDown(controllerData.pick, { pointerId: controllerData.id });
                downTriggered = true;
                if (this._options.disablePointerUpOnTouchOut) {
                    this._scene.simulatePointerUp(controllerData.pick, { pointerId: controllerData.id });
                }
            } else {
                this._scene.simulatePointerMove(controllerData.pick, { pointerId: controllerData.id });
            }
        });
        xrController.onDisposeObservable.addOnce(() => {
            if (controllerData.pick && downTriggered && !this._options.disablePointerUpOnTouchOut) {
                this._scene.simulatePointerUp(controllerData.pick, { pointerId: controllerData.id });
            }
        });
    }

    private _attachTrackedPointerRayMode(xrController: WebXRInputSource) {
        const controllerData = this._controllers[xrController.uniqueId];
        if (this._options.forceGazeMode) {
            return this._attachGazeMode(xrController);
        }
        controllerData.onFrameObserver = this._xrSessionManager.onXRFrameObservable.add(() => {
            controllerData.laserPointer.isVisible = this.displayLaserPointer;
            (<StandardMaterial>controllerData.laserPointer.material).disableLighting = this.disablePointerLighting;
            (<StandardMaterial>controllerData.selectionMesh.material).disableLighting = this.disableSelectionMeshLighting;

            if (controllerData.pick) {
                this._scene.simulatePointerMove(controllerData.pick, { pointerId: controllerData.id });
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
                            if (pressed) {
                                this._scene.simulatePointerDown(controllerData.pick, { pointerId: controllerData.id });
                                (<StandardMaterial>controllerData.selectionMesh.material).emissiveColor = this.selectionMeshPickedColor;
                                (<StandardMaterial>controllerData.laserPointer.material).emissiveColor = this.laserPointerPickedColor;
                            } else {
                                this._scene.simulatePointerUp(controllerData.pick, { pointerId: controllerData.id });
                                (<StandardMaterial>controllerData.selectionMesh.material).emissiveColor = this.selectionMeshDefaultColor;
                                (<StandardMaterial>controllerData.laserPointer.material).emissiveColor = this.laserPointerDefaultColor;
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
                if (controllerData.xrController && event.inputSource === controllerData.xrController.inputSource && controllerData.pick) {
                    this._scene.simulatePointerDown(controllerData.pick, { pointerId: controllerData.id });
                    (<StandardMaterial>controllerData.selectionMesh.material).emissiveColor = this.selectionMeshPickedColor;
                    (<StandardMaterial>controllerData.laserPointer.material).emissiveColor = this.laserPointerPickedColor;
                }
            };

            const selectEndListener = (event: XRInputSourceEvent) => {
                if (controllerData.xrController && event.inputSource === controllerData.xrController.inputSource && controllerData.pick) {
                    this._scene.simulatePointerUp(controllerData.pick, { pointerId: controllerData.id });
                    (<StandardMaterial>controllerData.selectionMesh.material).emissiveColor = this.selectionMeshDefaultColor;
                    (<StandardMaterial>controllerData.laserPointer.material).emissiveColor = this.laserPointerDefaultColor;
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

    private _convertNormalToDirectionOfRay(normal: Nullable<Vector3>, ray: Ray) {
        if (normal) {
            let angle = Math.acos(Vector3.Dot(normal, ray.direction));
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
            Object.keys(controllerData.eventListeners).forEach((eventName: string) => {
                const func = controllerData.eventListeners && controllerData.eventListeners[eventName as XREventType];
                if (func) {
                    this._xrSessionManager.session.removeEventListener(eventName, func);
                }
            });
        }
        controllerData.selectionMesh.dispose();
        controllerData.laserPointer.dispose();
        // remove from the map
        delete this._controllers[xrControllerUniqueId];
    }

    private _generateNewMeshPair(meshParent: Node) {
        const sceneToRenderTo = this._options.useUtilityLayer ? this._options.customUtilityLayerScene || UtilityLayerRenderer.DefaultUtilityLayer.utilityLayerScene : this._scene;
        const laserPointer = CylinderBuilder.CreateCylinder(
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
        let laserPointerMaterial = new StandardMaterial("laserPointerMat", sceneToRenderTo);
        laserPointerMaterial.emissiveColor = this.laserPointerDefaultColor;
        laserPointerMaterial.alpha = 0.7;
        laserPointer.material = laserPointerMaterial;
        laserPointer.rotation.x = Math.PI / 2;
        this._updatePointerDistance(laserPointer, 1);
        laserPointer.isPickable = false;

        // Create a gaze tracker for the  XR controller
        const selectionMesh = TorusBuilder.CreateTorus(
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
        let targetMat = new StandardMaterial("targetMat", sceneToRenderTo);
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

    /** @hidden */
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

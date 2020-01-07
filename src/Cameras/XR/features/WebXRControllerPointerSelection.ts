import { WebXRFeaturesManager, IWebXRFeature } from "../webXRFeaturesManager";
import { WebXRSessionManager } from '../webXRSessionManager';
import { AbstractMesh } from '../../../Meshes/abstractMesh';
import { Observer } from '../../../Misc/observable';
import { WebXRInput } from '../webXRInput';
import { WebXRController } from '../webXRController';
import { Scene } from '../../../scene';
import { WebXRControllerComponent } from '../motionController/webXRControllerComponent';
import { Nullable } from '../../../types';
import { Vector3 } from '../../../Maths/math.vector';
import { Color3 } from '../../../Maths/math.color';
import { Axis } from '../../../Maths/math.axis';
import { StandardMaterial } from '../../../Materials/standardMaterial';
import { CylinderBuilder } from '../../../Meshes/Builders/cylinderBuilder';
import { TorusBuilder } from '../../../Meshes/Builders/torusBuilder';
import { Ray } from '../../../Culling/ray';
import { PickingInfo } from '../../../Collisions/pickingInfo';

const Name = "xr-controller-pointer-selection";

/**
 * Options interface for the pointer selection module
 */
export interface IWebXRControllerPointerSelectionOptions {
    /**
     * the xr input to use with this pointer selection
     */
    xrInput: WebXRInput;
    /**
     * Different button type to use instead of the main component
     */
    overrideButtonId?: string;
}

/**
 * A module that will enable pointer selection for motion controllers of XR Input Sources
 */
export class WebXRControllerPointerSelection implements IWebXRFeature {

    /**
     * The module's name
     */
    public static readonly Name = Name;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the webxr specs version
     */
    public static readonly Version = 1;

    /**
     * This color will be set to the laser pointer when selection is triggered
     */
    public onPickedLaserPointerColor: Color3 = new Color3(0.7, 0.7, 0.7);
    /**
     * This color will be applied to the selection ring when selection is triggered
     */
    public onPickedSelectionMeshColor: Color3 = new Color3(0.7, 0.7, 0.7);
    /**
     * default color of the selection ring
     */
    public selectionMeshDefaultColor: Color3 = new Color3(0.5, 0.5, 0.5);
    /**
     * Default color of the laser pointer
     */
    public lasterPointerDefaultColor: Color3 = new Color3(0.5, 0.5, 0.5);

    private static _idCounter = 0;

    private _observerTracked: Nullable<Observer<XRFrame>>;
    private _attached: boolean = false;
    private _tmpRay = new Ray(new Vector3(), new Vector3());

    private _controllers: {
        [controllerUniqueId: string]: {
            xrController: WebXRController;
            selectionComponent?: WebXRControllerComponent;
            onButtonChangedObserver?: Nullable<Observer<WebXRControllerComponent>>;
            laserPointer: AbstractMesh;
            selectionMesh: AbstractMesh;
            pick: Nullable<PickingInfo>;
            id: number;
        };
    } = {};

    /**
     * Is this feature attached
     */
    public get attached() {
        return this._attached;
    }

    private _scene: Scene;

    /**
     * constructs a new background remover module
     * @param _xrSessionManager the session manager for this module
     * @param _options read-only options to be used in this module
     */
    constructor(private _xrSessionManager: WebXRSessionManager, private readonly _options: IWebXRControllerPointerSelectionOptions) {
        this._scene = this._xrSessionManager.scene;
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    attach(): boolean {

        this._options.xrInput.controllers.forEach(this._attachController);
        this._options.xrInput.onControllerAddedObservable.add(this._attachController);
        this._options.xrInput.onControllerRemovedObservable.add((controller) => {
            // REMOVE the controller
            this._detachController(controller.uniqueId);
        });

        this._observerTracked = this._xrSessionManager.onXRFrameObservable.add(() => {
            Object.keys(this._controllers).forEach((id) => {
                const controllerData = this._controllers[id];

                // Every frame check collisions/input
                controllerData.xrController.getWorldPointerRayToRef(this._tmpRay);
                controllerData.pick = this._scene.pickWithRay(this._tmpRay);

                if (controllerData.selectionComponent && controllerData.selectionComponent.pressed) {
                    (<StandardMaterial>controllerData.selectionMesh.material).emissiveColor = this.onPickedSelectionMeshColor;
                    (<StandardMaterial>controllerData.laserPointer.material).emissiveColor = this.onPickedLaserPointerColor;
                } else {
                    (<StandardMaterial>controllerData.selectionMesh.material).emissiveColor = this.selectionMeshDefaultColor;
                    (<StandardMaterial>controllerData.laserPointer.material).emissiveColor = this.lasterPointerDefaultColor;
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
                    let pickNormal = this._convertNormalToDirectionOfRay(pick.getNormal(true), this._tmpRay);
                    let deltaFighting = 0.001;
                    controllerData.selectionMesh.position.copyFrom(pick.pickedPoint);
                    if (pickNormal) {
                        let axis1 = Vector3.Cross(Axis.Y, pickNormal);
                        let axis2 = Vector3.Cross(pickNormal, axis1);
                        Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, controllerData.selectionMesh.rotation);
                        controllerData.selectionMesh.position.addInPlace(pickNormal.scale(deltaFighting));
                    }
                    controllerData.selectionMesh.isVisible = true;
                } else {
                    controllerData.selectionMesh.isVisible = false;
                }
            });
        });

        this._attached = true;

        return true;
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    detach(): boolean {

        if (this._observerTracked) {
            this._xrSessionManager.onXRFrameObservable.remove(this._observerTracked);
        }

        Object.keys(this._controllers).forEach((controllerId) => {
            this._detachController(controllerId);
        });

        this._attached = false;

        return true;
    }

    private _attachController = (xrController: WebXRController) => {
        // only support tracker pointer
        if (xrController.inputSource.targetRayMode !== "tracked-pointer") {
            return;
        }

        if (this._controllers[xrController.uniqueId] || !xrController.gamepadController) {
            // already attached
            return;
        }

        const { laserPointer, selectionMesh } = this._generateNewMeshPair(xrController);

        // get two new meshes
        this._controllers[xrController.uniqueId] = {
            xrController,
            laserPointer,
            selectionMesh,
            pick: null,
            id: WebXRControllerPointerSelection._idCounter++
        };
        const controllerData = this._controllers[xrController.uniqueId];

        if (this._options.overrideButtonId) {
            controllerData.selectionComponent = xrController.gamepadController.getComponent(this._options.overrideButtonId);
        }
        if (!controllerData.selectionComponent) {
            controllerData.selectionComponent = xrController.gamepadController.getMainComponent();
        }

        let observer: Nullable<Observer<XRFrame>> = null;

        controllerData.onButtonChangedObserver = controllerData.selectionComponent.onButtonStateChanged.add((component) => {
            if (component.changes.pressed) {
                const pressed = component.changes.pressed.current;
                if (controllerData.pick) {
                    if (pressed) {
                        this._scene.simulatePointerDown(controllerData.pick, { pointerId: controllerData.id });
                        observer = this._xrSessionManager.onXRFrameObservable.add(() => {
                            if (controllerData.pick) {
                                this._scene.simulatePointerMove(controllerData.pick, { pointerId: controllerData.id });
                            }
                        });
                    } else {
                        this._xrSessionManager.onXRFrameObservable.remove(observer);
                        this._scene.simulatePointerUp(controllerData.pick, { pointerId: controllerData.id });
                    }
                }
            }
        });

    }

    private _detachController(xrControllerUniqueId: string) {
        const controllerData = this._controllers[xrControllerUniqueId];
        if (!controllerData) { return; }
        if (controllerData.selectionComponent) {
            if (controllerData.onButtonChangedObserver) {
                controllerData.selectionComponent.onButtonStateChanged.remove(controllerData.onButtonChangedObserver);
            }
        }
        controllerData.selectionMesh.dispose();
        controllerData.laserPointer.dispose();
        // remove from the map
        delete this._controllers[xrControllerUniqueId];
    }

    private _generateNewMeshPair(xrController: WebXRController) {
        const laserPointer = CylinderBuilder.CreateCylinder("laserPointer", {
            height: 1,
            diameterTop: 0.0002,
            diameterBottom: 0.004,
            tessellation: 20,
            subdivisions: 1
        }, this._scene);
        laserPointer.parent = xrController.pointer;
        let laserPointerMaterial = new StandardMaterial("laserPointerMat", this._scene);
        laserPointerMaterial.emissiveColor = this.lasterPointerDefaultColor;
        laserPointerMaterial.alpha = 0.6;
        laserPointer.material = laserPointerMaterial;
        laserPointer.rotation.x = Math.PI / 2;
        this._updatePointerDistance(laserPointer, 1);
        laserPointer.isPickable = false;

        // Create a gaze tracker for the  XR controller
        const selectionMesh = TorusBuilder.CreateTorus("gazeTracker", {
            diameter: 0.0035 * 3,
            thickness: 0.0025 * 3,
            tessellation: 20
        }, this._scene);
        selectionMesh.bakeCurrentTransformIntoVertices();
        selectionMesh.isPickable = false;
        selectionMesh.isVisible = false;
        let targetMat = new StandardMaterial("targetMat", this._scene);
        targetMat.specularColor = Color3.Black();
        targetMat.emissiveColor = this.selectionMeshDefaultColor;
        targetMat.backFaceCulling = false;
        selectionMesh.material = targetMat;

        return {
            laserPointer,
            selectionMesh
        };
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

    private _updatePointerDistance(_laserPointer: AbstractMesh, distance: number = 100) {
        _laserPointer.scaling.y = distance;
        _laserPointer.position.z = distance / 2;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    dispose(): void {
        this.detach();
    }
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(WebXRControllerPointerSelection.Name, (xrSessionManager, options) => {
    return () => new WebXRControllerPointerSelection(xrSessionManager, options);
}, WebXRControllerPointerSelection.Version, true);

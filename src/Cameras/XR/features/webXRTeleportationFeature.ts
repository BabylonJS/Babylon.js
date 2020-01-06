import { IWebXRFeature } from '../webXRFeaturesManager';
import { Observer } from '../../../Misc/observable';
import { WebXRSessionManager } from '../webXRSessionManager';
import { Nullable } from '../../../types';
import { WebXRInput } from '../webXRInput';
import { WebXRController } from '../webXRController';
import { WebXRControllerComponent, IWebXRMotionControllerAxesValue, IWebXRMotionControllerComponentChanges } from '../motionController';
import { AbstractMesh } from '../../../Meshes/abstractMesh';

const Name = "xr-teleportation";

export interface IWebXRTeleportationOptions {
    xrInput: WebXRInput;
    floorMeshes: AbstractMesh[];
    rotaionAngle: number;
}

export class WebXRTeleportationFeature implements IWebXRFeature {
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

    private _observerTracked: Nullable<Observer<XRFrame>>;
    private _attached: boolean = false;

    /**
     * constructs a new anchor system
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param _options configuration object for this feature
     */
    constructor(private _xrSessionManager: WebXRSessionManager, private _options: IWebXRTeleportationOptions) {
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
            const frame = this._xrSessionManager.currentFrame;
            if (!this._attached || !frame) { return; }

        });

        this._attached = true;
        return true;
    }

    private _controllers: {
        [controllerUniqueId: string]: {
            xrController: WebXRController;
            teleportationComponent?: WebXRControllerComponent;
            teleportationState: {
                forward: boolean;
                backwards: boolean;
                currentRotation: number;
            }
            onAxisChangedObserver?: Nullable<Observer<IWebXRMotionControllerAxesValue>>;
            onButtonChangedObserver?: Nullable<Observer<WebXRControllerComponent>>;
        };
    } = {};

    private _currentTeleportationControllerId: string;

    private _attachController = (xrController: WebXRController) => {
        if (this._controllers[xrController.uniqueId]) {
            // already attached
            return;
        }
        this._controllers[xrController.uniqueId] = {
            xrController,
            teleportationState: {
                forward: false,
                backwards: false,
                currentRotation: 0
            }
        };
        const controllerData = this._controllers[xrController.uniqueId];
        // motion controller support
        if (xrController.gamepadController) {
            const movementController = xrController.gamepadController.getComponent(WebXRControllerComponent.THUMBSTICK) || xrController.gamepadController.getComponent(WebXRControllerComponent.TOUCHPAD);
            if (!movementController) {
                // user trigger to move on long press
            } else {
                controllerData.onAxisChangedObserver = movementController.onAxisValueChanged.add((axesData) => {
                    if (axesData.y <= 0.7) {
                        controllerData.teleportationState.backwards = false;
                    }
                    if (axesData.y >= -0.7) {
                        if (axesData.y === 0 && axesData.x === 0) {
                            controllerData.teleportationState.forward = false;
                            // do the movement forward here
                        }
                    }
                    if (axesData.y > 0.7) {
                        // teleport backwards
                        if (!controllerData.teleportationState.backwards) {
                            // teleport backwards
                        }
                    }
                    if (axesData.y < -0.7) {
                        controllerData.teleportationState.forward = true;
                    }
                    if (axesData.x) {
                        if (!controllerData.teleportationState.forward) {
                            // rotate in the right direction
                        } else {
                            // set the rotation of the forward movement
                            controllerData.teleportationState.currentRotation = Math.PI * axesData.x;
                        }
                    }
                });
            }
        }
        // support other methods
    }

    private _detachController(xrControllerUniqueId: string) {
        const controllerData = this._controllers[xrControllerUniqueId];
        if (!controllerData) { return; }
        if (controllerData.teleportationComponent) {
            if (controllerData.onAxisChangedObserver) {
                controllerData.teleportationComponent.onAxisValueChanged.remove(controllerData.onAxisChangedObserver);
            }
            if (controllerData.onButtonChangedObserver) {
                controllerData.teleportationComponent.onButtonStateChanged.remove(controllerData.onButtonChangedObserver);
            }
        }
        // remove from the map
        delete this._controllers[xrControllerUniqueId];
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    detach(): boolean {
        this._attached = false;

        if (this._observerTracked) {
            this._xrSessionManager.onXRFrameObservable.remove(this._observerTracked);
        }

        Object.keys(this._controllers).forEach((controllerId) => {
            this._detachController(controllerId);
        });

        return true;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    dispose(): void {
        this.detach();
    }
}
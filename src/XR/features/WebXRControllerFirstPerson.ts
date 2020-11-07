import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import { Observer } from "../../Misc/observable";
import { WebXRSessionManager } from "../webXRSessionManager";
import { Nullable } from "../../types";
import { WebXRInput } from "../webXRInput";
import { WebXRInputSource } from "../webXRInputSource";
import { WebXRControllerComponent, IWebXRMotionControllerAxesValue } from "../motionController/webXRControllerComponent";
import { Vector3, Matrix, Quaternion } from "../../Maths/math.vector";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";

/**
 * The options container for the first person module
 */
export interface IWebXRFirstPersonOptions {
    /**
     * Setting the movement speed.
     */
    movementSpeed?: number;

    /**
     * Limiting vertical movement.
     */
    isOnlyVerticalMovement?: boolean;

    /**
     * Babylon XR Input class for controller
     */
    xrInput: WebXRInput;
}

/**
 * This is a first person movement feature to be used with WebXR-enabled motion controllers.
 * When enabled and attached, the feature will allow a user to move around and rotate in the scene using
 * the input of the attached controllers.
 */
export class WebXRMotionControllerFirstPerson extends WebXRAbstractFeature {
    private _controllers: {
        [controllerUniqueId: string]: {
            xrController: WebXRInputSource;
            firstPersonComponent?: WebXRControllerComponent;
            firstPersonState: {
                isHorizontalRotate: boolean
            },
            onAxisChangedObserver?: Nullable<Observer<IWebXRMotionControllerAxesValue>>;
        };
    } = {};

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.FIRST_PERSON;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the webxr specs version
     */
    public static readonly Version = 1;

    /**
     * How much rotation should be applied when rotating right and left
     */
    public rotationAngle: number = Math.PI / 8;

    /**
     * Threshold of rotation when the controller's stick is tipped over.
     */
    public thumbstickThreshold: number = 0.8;

    /**
     * Quaternion to be used to maintain the frontal orientation.
     */
    public currentRotationQuaternion: Quaternion = Quaternion.Identity();

    /**
     * constructs a new anchor system
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param _options configuration object for this feature
     */
    constructor(_xrSessionManager: WebXRSessionManager, private _options: IWebXRFirstPersonOptions) {
        super(_xrSessionManager);
        console.log("constructor");
    }

    public attach(): boolean {
        console.log("attach");
        if (!super.attach()) {
            return false;
        }

        this._options.xrInput.controllers.forEach(this._attachController);
        this._addNewAttachObserver(this._options.xrInput.onControllerAddedObservable, this._attachController);
        this._addNewAttachObserver(this._options.xrInput.onControllerRemovedObservable, (controller) => {
            // REMOVE the controller
            this._detachController(controller.uniqueId);
        });

        return true;
    }

    public detach(): boolean {
        if (!super.detach()) {
            return false;
        }

        Object.keys(this._controllers).forEach((controllerId) => {
            this._detachController(controllerId);
        });

        this._controllers = {};

        return true;
    }

    public dispose(): void {
        super.dispose();
    }

    protected _onXRFrame(_xrFrame: XRFrame) {
    }

    private _attachController = (xrController: WebXRInputSource) => {
        console.log("_attachController");
        if (this._controllers[xrController.uniqueId]) {
            // already attached
            return;
        }
        this._controllers[xrController.uniqueId] = {
            xrController,
            firstPersonState: {
                isHorizontalRotate: false
            }
        };
        const controllerData = this._controllers[xrController.uniqueId];
        // motion controller support
        const initMotionController = () => {
            console.log("initMotionController");
            if (xrController.motionController) {
                console.log(xrController.inputSource.handedness);
                const movementController = xrController.motionController.getComponentOfType(WebXRControllerComponent.THUMBSTICK_TYPE) || xrController.motionController.getComponentOfType(WebXRControllerComponent.TOUCHPAD_TYPE);
                if (!movementController) {
                    return;
                }
                controllerData.firstPersonComponent = movementController;
                // use thumbstick (or touchpad if thumbstick not available)
                controllerData.onAxisChangedObserver = movementController.onAxisValueChangedObservable.add((axesData) => {
                    if (xrController.inputSource.handedness === "left") {
                        const { x, y } = axesData;

                        const matrix = new Matrix();
                        Matrix.FromQuaternionToRef(this.currentRotationQuaternion, matrix);

                        const movementSpeed = this._options.movementSpeed || 0.2;
                        const move = new Vector3(x * movementSpeed, 0, -y * movementSpeed);
                        const addPos = Vector3.TransformCoordinates(move, matrix);
                        addPos.y = 0;

                        this._options.xrInput.xrCamera.position = this._options.xrInput.xrCamera.position.add(addPos);
                    } else {
                        const { x } = axesData;

                        if (controllerData.firstPersonState.isHorizontalRotate && Math.abs(x) > this.thumbstickThreshold) {
                            controllerData.firstPersonState.isHorizontalRotate = false;

                            const rotationAngle = x > 0 ? this.rotationAngle : -this.rotationAngle;

                            const eulerAngles = Quaternion.FromEulerAngles(0, rotationAngle , 0);
                            this._options.xrInput.xrCamera.rotationQuaternion.multiplyInPlace(eulerAngles);
                            this.currentRotationQuaternion = this._options.xrInput.xrCamera.rotationQuaternion;
                        } else if (Math.abs(x) < this.thumbstickThreshold) {
                            controllerData.firstPersonState.isHorizontalRotate = true;
                        }
                    }
                });
            }
        };
        if (xrController.motionController) {
            initMotionController();
        } else {
            xrController.onMotionControllerInitObservable.addOnce(() => {
                initMotionController();
            });
        }
    };

    private _detachController(xrControllerUniqueId: string) {
        const controllerData = this._controllers[xrControllerUniqueId];
        if (!controllerData) {
            return;
        }
        if (controllerData.firstPersonComponent) {
            if (controllerData.onAxisChangedObserver) {
                controllerData.firstPersonComponent.onAxisValueChangedObservable.remove(controllerData.onAxisChangedObserver);
            }
        }
        // remove from the map
        delete this._controllers[xrControllerUniqueId];
    }
}

WebXRFeaturesManager.AddWebXRFeature(
    WebXRMotionControllerFirstPerson.Name,
    (xrSessionManager, options) => {
        console.log("WebXRMotionControllerFirstPerson");
        return () => new WebXRMotionControllerFirstPerson(xrSessionManager, options);
    },
    WebXRMotionControllerFirstPerson.Version,
    true
);

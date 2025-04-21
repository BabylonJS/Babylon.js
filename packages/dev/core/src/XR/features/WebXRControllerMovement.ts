import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import type { Observer } from "../../Misc/observable";
import type { WebXRSessionManager } from "../webXRSessionManager";
import type { Nullable } from "../../types";
import type { WebXRInput } from "../webXRInput";
import type { WebXRInputSource } from "../webXRInputSource";
import type { IWebXRMotionControllerAxesValue, IWebXRMotionControllerComponentChangesValues } from "../motionController/webXRControllerComponent";
import { WebXRControllerComponent } from "../motionController/webXRControllerComponent";
import { Matrix, Quaternion, Vector3 } from "../../Maths/math.vector";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import type { MotionControllerComponentType } from "../motionController/webXRAbstractMotionController";
import { Tools } from "../../Misc/tools";

/**
 * The options container for the controller movement module
 */
export interface IWebXRControllerMovementOptions {
    /**
     * Override default behaviour and provide your own movement controls
     */
    customRegistrationConfigurations?: WebXRControllerMovementRegistrationConfiguration[];
    /**
     * Is movement enabled
     */
    movementEnabled?: boolean;
    /**
     * Camera direction follows view pose and movement by default will move independently of the viewer's pose.
     */
    movementOrientationFollowsViewerPose: boolean;
    /**
     * Movement speed factor (default is 1.0)
     */
    movementSpeed?: number;
    /**
     * Minimum threshold the controller's thumbstick/touchpad must pass before being recognized for movement (avoids jitter/unintentional movement)
     */
    movementThreshold?: number;
    /**
     * Is rotation enabled
     */
    rotationEnabled?: boolean;
    /**
     * Minimum threshold the controller's thumstick/touchpad must pass before being recognized for rotation (avoids jitter/unintentional rotation)
     */
    rotationThreshold?: number;
    /**
     * Movement speed factor (default is 1.0)
     */
    rotationSpeed?: number;
    /**
     * Babylon XR Input class for controller
     */
    xrInput: WebXRInput;

    /**
     * If movement orientation should follow controller orientation instead of viewer pose.
     * Make sure to set movementOrientationFollowsViewerPose to false, otherwise it will be ignored.
     */
    movementOrientationFollowsController: boolean;

    /**
     * If orientation follows the controller, this is the preferred handedness to use for forward movement.
     * If not set (or handedness not found), the handedness will be selected by the controller triggering the movement.
     * Note that this only works if movementOrientationFollowsController is true.
     */
    orientationPreferredHandedness?: XRHandedness;
}

/**
 * Feature context is used in handlers and on each XR frame to control the camera movement/direction.
 */
export type WebXRControllerMovementFeatureContext = {
    movementEnabled: boolean;
    movementOrientationFollowsViewerPose: boolean;
    movementOrientationFollowsController: boolean;
    orientationPreferredHandedness?: XRHandedness;
    movementSpeed: number;
    movementThreshold: number;
    rotationEnabled: boolean;
    rotationSpeed: number;
    rotationThreshold: number;
};

/**
 * Current state of Movements shared across components and handlers.
 */
export type WebXRControllerMovementState = {
    moveX: number;
    moveY: number;
    rotateX: number;
    rotateY: number;
};

/**
 * Button of Axis Handler must be specified.
 */
export type WebXRControllerMovementRegistrationConfiguration = {
    /**
     * handlers are filtered to these types only
     */
    allowedComponentTypes?: MotionControllerComponentType[];
    /**
     * For registering movement to specific hand only.  Useful if your app has a "main hand" and "off hand" for determining the functionality of a controller.
     */
    forceHandedness?: XRHandedness;
    /**
     * For main component only (useful for buttons and may not trigger axis changes).
     */
    mainComponentOnly?: boolean;
    /**
     * Additional predicate to apply to controllers to restrict a handler being added.
     */
    componentSelectionPredicate?: (xrController: WebXRInputSource) => Nullable<WebXRControllerComponent>;
} & (
    | {
          /**
           * Called when axis changes occur.
           */
          axisChangedHandler: (
              axes: IWebXRMotionControllerAxesValue,
              movementState: WebXRControllerMovementState,
              featureContext: WebXRControllerMovementFeatureContext,
              xrInput: WebXRInput
          ) => void;
      }
    | {
          /**
           * Called when the button state changes.
           */
          buttonChangedHandler: (
              pressed: IWebXRMotionControllerComponentChangesValues<boolean>,
              movementState: WebXRControllerMovementState,
              featureContext: WebXRControllerMovementFeatureContext,
              xrInput: WebXRInput
          ) => void;
      }
);

type RegisteredComponent = {
    registrationConfiguration: WebXRControllerMovementRegistrationConfiguration;
    component: WebXRControllerComponent;
    onAxisChangedObserver?: Nullable<Observer<IWebXRMotionControllerAxesValue>>;
    onButtonChangedObserver?: Nullable<Observer<WebXRControllerComponent>>;
};

/**
 * This is a movement feature to be used with WebXR-enabled motion controllers.
 * When enabled and attached, the feature will allow a user to move around and rotate in the scene using
 * the input of the attached controllers.
 */
export class WebXRControllerMovement extends WebXRAbstractFeature {
    private _controllers: {
        [controllerUniqueId: string]: {
            xrController: WebXRInputSource;
            registeredComponents: RegisteredComponent[];
        };
    } = {};

    private _currentRegistrationConfigurations: WebXRControllerMovementRegistrationConfiguration[] = [];
    // Feature configuration is synchronized - this is passed to all handlers (reduce GC pressure).
    private _featureContext: WebXRControllerMovementFeatureContext;
    // forward direction for movement, which may differ from viewer pose.
    private _movementDirection: Quaternion = new Quaternion();
    private _movementState: WebXRControllerMovementState;
    private _xrInput: WebXRInput;

    // unused
    private _tmpRotationMatrix: Matrix = Matrix.Identity();
    private _tmpTranslationDirection: Vector3 = new Vector3();
    private _tmpMovementTranslation: Vector3 = new Vector3();
    private _tempCacheQuaternion: Quaternion = new Quaternion();

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.MOVEMENT;

    /**
     * Standard controller configurations.
     */
    public static readonly REGISTRATIONS: { [key: string]: WebXRControllerMovementRegistrationConfiguration[] } = {
        default: [
            {
                allowedComponentTypes: [WebXRControllerComponent.THUMBSTICK_TYPE, WebXRControllerComponent.TOUCHPAD_TYPE],
                forceHandedness: "left",
                axisChangedHandler: (axes: IWebXRMotionControllerAxesValue, movementState: WebXRControllerMovementState, featureContext: WebXRControllerMovementFeatureContext) => {
                    movementState.rotateX = Math.abs(axes.x) > featureContext.rotationThreshold ? axes.x : 0;
                    movementState.rotateY = Math.abs(axes.y) > featureContext.rotationThreshold ? axes.y : 0;
                },
            },
            {
                allowedComponentTypes: [WebXRControllerComponent.THUMBSTICK_TYPE, WebXRControllerComponent.TOUCHPAD_TYPE],
                forceHandedness: "right",
                axisChangedHandler: (axes: IWebXRMotionControllerAxesValue, movementState: WebXRControllerMovementState, featureContext: WebXRControllerMovementFeatureContext) => {
                    movementState.moveX = Math.abs(axes.x) > featureContext.movementThreshold ? axes.x : 0;
                    movementState.moveY = Math.abs(axes.y) > featureContext.movementThreshold ? axes.y : 0;
                },
            },
        ],
    };

    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the webxr specs version
     */
    public static readonly Version = 1;

    /**
     * Current movement direction.  Will be null before XR Frames have been processed.
     */
    public get movementDirection(): Quaternion {
        return this._movementDirection;
    }

    /**
     * Is movement enabled
     */
    public get movementEnabled(): boolean {
        return this._featureContext.movementEnabled;
    }

    /**
     * Sets whether movement is enabled or not
     * @param enabled is movement enabled
     */
    public set movementEnabled(enabled: boolean) {
        this._featureContext.movementEnabled = enabled;
    }

    /**
     * If movement follows viewer pose
     */
    public get movementOrientationFollowsViewerPose(): boolean {
        return this._featureContext.movementOrientationFollowsViewerPose;
    }

    /**
     * Sets whether movement follows viewer pose
     * @param followsPose is movement should follow viewer pose
     */
    public set movementOrientationFollowsViewerPose(followsPose: boolean) {
        this._featureContext.movementOrientationFollowsViewerPose = followsPose;
    }

    /**
     * Gets movement speed
     */
    public get movementSpeed(): number {
        return this._featureContext.movementSpeed;
    }

    /**
     * Sets movement speed
     * @param movementSpeed movement speed
     */
    public set movementSpeed(movementSpeed: number) {
        this._featureContext.movementSpeed = movementSpeed;
    }

    /**
     * Gets minimum threshold the controller's thumbstick/touchpad must pass before being recognized for movement (avoids jitter/unintentional movement)
     */
    public get movementThreshold(): number {
        return this._featureContext.movementThreshold;
    }

    /**
     * Sets minimum threshold the controller's thumbstick/touchpad must pass before being recognized for movement (avoids jitter/unintentional movement)
     * @param movementThreshold new threshold
     */
    public set movementThreshold(movementThreshold: number) {
        this._featureContext.movementThreshold = movementThreshold;
    }

    /**
     * Is rotation enabled
     */
    public get rotationEnabled(): boolean {
        return this._featureContext.rotationEnabled;
    }

    /**
     * Sets whether rotation is enabled or not
     * @param enabled is rotation enabled
     */
    public set rotationEnabled(enabled: boolean) {
        this._featureContext.rotationEnabled = enabled;
    }

    /**
     * Gets rotation speed factor
     */
    public get rotationSpeed(): number {
        return this._featureContext.rotationSpeed;
    }

    /**
     * Sets rotation speed factor (1.0 is default)
     * @param rotationSpeed new rotation speed factor
     */
    public set rotationSpeed(rotationSpeed: number) {
        this._featureContext.rotationSpeed = rotationSpeed;
    }

    /**
     * Gets minimum threshold the controller's thumbstick/touchpad must pass before being recognized for rotation (avoids jitter/unintentional rotation)
     */
    public get rotationThreshold(): number {
        return this._featureContext.rotationThreshold;
    }

    /**
     * Sets minimum threshold the controller's thumbstick/touchpad must pass before being recognized for rotation (avoids jitter/unintentional rotation)
     * @param threshold new threshold
     */
    public set rotationThreshold(threshold: number) {
        this._featureContext.rotationThreshold = threshold;
    }
    /**
     * constructs a new movement controller system
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param options configuration object for this feature
     */
    constructor(_xrSessionManager: WebXRSessionManager, options: IWebXRControllerMovementOptions) {
        super(_xrSessionManager);

        if (!options || options.xrInput === undefined) {
            Tools.Error('WebXRControllerMovement feature requires "xrInput" option.');
            return;
        }

        if (Array.isArray(options.customRegistrationConfigurations)) {
            this._currentRegistrationConfigurations = options.customRegistrationConfigurations;
        } else {
            this._currentRegistrationConfigurations = WebXRControllerMovement.REGISTRATIONS.default;
        }

        // synchronized from feature setter properties
        this._featureContext = {
            movementEnabled: options.movementEnabled || true,
            movementOrientationFollowsViewerPose: options.movementOrientationFollowsViewerPose ?? true,
            movementOrientationFollowsController: options.movementOrientationFollowsController ?? false,
            orientationPreferredHandedness: options.orientationPreferredHandedness,
            movementSpeed: options.movementSpeed ?? 1,
            movementThreshold: options.movementThreshold ?? 0.25,
            rotationEnabled: options.rotationEnabled ?? true,
            rotationSpeed: options.rotationSpeed ?? 1.0,
            rotationThreshold: options.rotationThreshold ?? 0.25,
        };

        this._movementState = {
            moveX: 0,
            moveY: 0,
            rotateX: 0,
            rotateY: 0,
        };

        this._xrInput = options.xrInput;
    }

    public override attach(): boolean {
        if (!super.attach()) {
            return false;
        }

        for (const controller of this._xrInput.controllers) {
            this._attachController(controller);
        }
        this._addNewAttachObserver(this._xrInput.onControllerAddedObservable, this._attachController);
        this._addNewAttachObserver(this._xrInput.onControllerRemovedObservable, (controller: WebXRInputSource) => {
            // REMOVE the controller
            this._detachController(controller.uniqueId);
        });

        return true;
    }

    public override detach(): boolean {
        if (!super.detach()) {
            return false;
        }
        const keys = Object.keys(this._controllers);

        for (const controllerId of keys) {
            this._detachController(controllerId);
        }

        this._controllers = {};

        return true;
    }

    /**
     * Occurs on every XR frame.
     * @param _xrFrame
     */
    protected _onXRFrame(_xrFrame: XRFrame) {
        if (!this.attached) {
            return;
        }

        if (this._movementState.rotateX !== 0 && this._featureContext.rotationEnabled) {
            // smooth rotation
            const deltaMillis = this._xrSessionManager.scene.getEngine().getDeltaTime();
            const rotationY = deltaMillis * 0.001 * this._featureContext.rotationSpeed * this._movementState.rotateX * (this._xrSessionManager.scene.useRightHandedSystem ? -1 : 1);

            if (this._featureContext.movementOrientationFollowsViewerPose) {
                this._xrInput.xrCamera.cameraRotation.y += rotationY;
                Quaternion.RotationYawPitchRollToRef(rotationY, 0, 0, this._tempCacheQuaternion);
                this._xrInput.xrCamera.rotationQuaternion.multiplyToRef(this._tempCacheQuaternion, this._movementDirection);
            } else if (this._featureContext.movementOrientationFollowsController) {
                this._xrInput.xrCamera.cameraRotation.y += rotationY;
                // get the correct controller
                const handedness = this._featureContext.orientationPreferredHandedness || "right";
                const key =
                    Object.keys(this._controllers).find((key) => this._controllers[key]?.xrController?.inputSource.handedness === handedness) || Object.keys(this._controllers)[0];
                const controller = this._controllers[key];
                Quaternion.RotationYawPitchRollToRef(rotationY, 0, 0, this._tempCacheQuaternion);
                (controller?.xrController.pointer.rotationQuaternion || Quaternion.Identity()).multiplyToRef(this._tempCacheQuaternion, this._movementDirection);
            } else {
                // movement orientation direction does not affect camera.  We use rotation speed multiplier
                // otherwise need to implement inertia and constraints for same feel as TargetCamera.

                Quaternion.RotationYawPitchRollToRef(rotationY * 3.0, 0, 0, this._tempCacheQuaternion);
                this._movementDirection.multiplyInPlace(this._tempCacheQuaternion);
            }
        } else if (this._featureContext.movementOrientationFollowsViewerPose) {
            this._movementDirection.copyFrom(this._xrInput.xrCamera.rotationQuaternion);
        } else if (this._featureContext.movementOrientationFollowsController) {
            // get the correct controller
            const handedness = this._featureContext.orientationPreferredHandedness || "right";
            const key =
                Object.keys(this._controllers).find((key) => this._controllers[key]?.xrController.inputSource.handedness === handedness) || Object.keys(this._controllers)[0];
            const controller = this._controllers[key];
            this._movementDirection.copyFrom(controller?.xrController.pointer.rotationQuaternion || Quaternion.Identity());
        }

        if ((this._movementState.moveX || this._movementState.moveY) && this._featureContext.movementEnabled) {
            Matrix.FromQuaternionToRef(this._movementDirection, this._tmpRotationMatrix);
            this._tmpTranslationDirection.set(this._movementState.moveX, 0, this._movementState.moveY * (this._xrSessionManager.scene.useRightHandedSystem ? 1.0 : -1.0));
            // move according to forward direction based on camera speed
            Vector3.TransformCoordinatesToRef(this._tmpTranslationDirection, this._tmpRotationMatrix, this._tmpMovementTranslation);
            this._tmpMovementTranslation.scaleInPlace(this._xrInput.xrCamera._computeLocalCameraSpeed() * this._featureContext.movementSpeed);

            this._xrInput.xrCamera.cameraDirection.addInPlace(this._tmpMovementTranslation);
        }
    }

    private _attachController = (xrController: WebXRInputSource) => {
        if (this._controllers[xrController.uniqueId]) {
            // already attached
            return;
        }

        this._controllers[xrController.uniqueId] = {
            xrController,
            registeredComponents: [],
        };
        const controllerData = this._controllers[xrController.uniqueId];

        // movement controller only available to gamepad-enabled input sources.
        if (controllerData.xrController.inputSource.targetRayMode === "tracked-pointer" && controllerData.xrController.inputSource.gamepad) {
            // motion controller support
            const initController = () => {
                if (xrController.motionController) {
                    for (const registration of this._currentRegistrationConfigurations) {
                        let component: Nullable<WebXRControllerComponent> = null;

                        if (registration.allowedComponentTypes) {
                            for (const componentType of registration.allowedComponentTypes) {
                                const componentOfType = xrController.motionController.getComponentOfType(componentType);
                                if (componentOfType !== null) {
                                    component = componentOfType;
                                    break;
                                }
                            }
                        }

                        if (registration.mainComponentOnly) {
                            const mainComponent = xrController.motionController.getMainComponent();
                            if (mainComponent === null) {
                                continue;
                            }
                            component = mainComponent;
                        }

                        if (typeof registration.componentSelectionPredicate === "function") {
                            // if does not match we do want to ignore a previously found component
                            component = registration.componentSelectionPredicate(xrController);
                        }

                        if (component && registration.forceHandedness) {
                            if (xrController.inputSource.handedness !== registration.forceHandedness) {
                                continue; // do not register
                            }
                        }

                        if (component === null) {
                            continue; // do not register
                        }

                        const registeredComponent: RegisteredComponent = {
                            registrationConfiguration: registration,
                            component,
                        };
                        controllerData.registeredComponents.push(registeredComponent);

                        if ("axisChangedHandler" in registration) {
                            registeredComponent.onAxisChangedObserver = component.onAxisValueChangedObservable.add((axesData) => {
                                registration.axisChangedHandler(axesData, this._movementState, this._featureContext, this._xrInput);
                            });
                        }

                        if ("buttonChangedHandler" in registration) {
                            registeredComponent.onButtonChangedObserver = component.onButtonStateChangedObservable.add((component) => {
                                if (component.changes.pressed) {
                                    registration.buttonChangedHandler(component.changes.pressed, this._movementState, this._featureContext, this._xrInput);
                                }
                            });
                        }
                    }
                }
            };

            if (xrController.motionController) {
                initController();
            } else {
                xrController.onMotionControllerInitObservable.addOnce(() => {
                    initController();
                });
            }
        }
    };

    private _detachController(xrControllerUniqueId: string) {
        const controllerData = this._controllers[xrControllerUniqueId];
        if (!controllerData) {
            return;
        }

        for (const registeredComponent of controllerData.registeredComponents) {
            if (registeredComponent.onAxisChangedObserver) {
                registeredComponent.component.onAxisValueChangedObservable.remove(registeredComponent.onAxisChangedObserver);
            }
            if (registeredComponent.onButtonChangedObserver) {
                registeredComponent.component.onButtonStateChangedObservable.remove(registeredComponent.onButtonChangedObserver);
            }
        }

        // remove from the map
        delete this._controllers[xrControllerUniqueId];
    }
}

WebXRFeaturesManager.AddWebXRFeature(
    WebXRControllerMovement.Name,
    (xrSessionManager, options) => {
        return () => new WebXRControllerMovement(xrSessionManager, options);
    },
    WebXRControllerMovement.Version,
    true
);

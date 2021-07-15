import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import { Observer } from "../../Misc/observable";
import { WebXRSessionManager } from "../webXRSessionManager";
import { Nullable } from "../../types";
import { WebXRInput } from "../webXRInput";
import { WebXRInputSource } from "../webXRInputSource";
import {
    WebXRControllerComponent,
    IWebXRMotionControllerAxesValue,
    IWebXRMotionControllerComponentChangesValues,
} from "../motionController/webXRControllerComponent";
import { Matrix, Quaternion, Vector3 } from "../../Maths/math.vector";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { MotionControllerComponentType } from "../motionController/webXRAbstractMotionController";
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
}

/**
 * Feature context is used in handlers and on each XR frame to control the camera movement/direction.
 */
export type WebXRControllerMovementFeatureContext = {
    movementEnabled: boolean;
    movementOrientationFollowsViewerPose: boolean;
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
            buttonChangedhandler: (
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
    // Feature configuration is syncronized - this is passed to all handlers (reduce GC pressure).
    private _featureContext: WebXRControllerMovementFeatureContext;
    // forward direction for movement, which may differ from viewer pose.
    private _movementDirection: Nullable<Quaternion> = null;
    private _movementState: WebXRControllerMovementState;
    private _xrInput: WebXRInput;

    // unused
    private _tmpRotationMatrix: Matrix = Matrix.Identity();
    private _tmpTranslationDirection: Vector3 = new Vector3();
    private _tmpMovementTranslation: Vector3 = new Vector3();

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
                axisChangedHandler: (
                    axes: IWebXRMotionControllerAxesValue,
                    movementState: WebXRControllerMovementState,
                    featureContext: WebXRControllerMovementFeatureContext,
                    xrInput: WebXRInput
                ) => {
                    movementState.rotateX = Math.abs(axes.x) > featureContext.rotationThreshold ? axes.x : 0;
                    movementState.rotateY = Math.abs(axes.y) > featureContext.rotationThreshold ? axes.y : 0;
                },
            },
            {
                allowedComponentTypes: [WebXRControllerComponent.THUMBSTICK_TYPE, WebXRControllerComponent.TOUCHPAD_TYPE],
                forceHandedness: "right",
                axisChangedHandler: (
                    axes: IWebXRMotionControllerAxesValue,
                    movementState: WebXRControllerMovementState,
                    featureContext: WebXRControllerMovementFeatureContext,
                    xrInput: WebXRInput
                ) => {
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
    public get movementDirection(): Nullable<Quaternion> {
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

    public attach(): boolean {
        if (!super.attach()) {
            return false;
        }

        this._xrInput.controllers.forEach(this._attachController);
        this._addNewAttachObserver(this._xrInput.onControllerAddedObservable, this._attachController);
        this._addNewAttachObserver(this._xrInput.onControllerRemovedObservable, (controller: WebXRInputSource) => {
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

    /**
     * Occurs on every XR frame.
     */
    protected _onXRFrame(_xrFrame: XRFrame) {
        if (!this.attach) {
            return;
        }

        if (this._movementDirection === null) {
            this._movementDirection = this._xrInput.xrCamera.rotationQuaternion.clone();
        }

        if (this._movementState.rotateX !== 0 && this._featureContext.rotationEnabled) {
            // smooth rotation
            const deltaMillis = this._xrSessionManager.scene.getEngine().getDeltaTime();
            const rotationY = deltaMillis * 0.001 * this._featureContext.rotationSpeed * this._movementState.rotateX * (this._xrSessionManager.scene.useRightHandedSystem ? -1 : 1);

            if (this._featureContext.movementOrientationFollowsViewerPose === true) {
                this._xrInput.xrCamera.cameraRotation.y += rotationY;
                this._movementDirection = this._xrInput.xrCamera.rotationQuaternion.multiply(Quaternion.RotationYawPitchRoll(rotationY, 0, 0));
            } else {
                // movement orientation direction does not affect camera.  We use rotation speed multiplier
                // otherwise need to implement inertia and constraints for same feel as TargetCamera.
                this._movementDirection.multiplyInPlace(Quaternion.RotationYawPitchRoll(rotationY * 3.0, 0, 0));
            }
        } else if (this._featureContext.movementOrientationFollowsViewerPose === true) {
            this._movementDirection.copyFrom(this._xrInput.xrCamera.rotationQuaternion);
        }

        if ((this._movementState.moveX !== 0 || this._movementState.moveY !== 0) && this._featureContext.movementEnabled) {
            Matrix.FromQuaternionToRef(this._movementDirection, this._tmpRotationMatrix);
            this._tmpTranslationDirection.set(
                this._movementState.moveX,
                0,
                this._movementState.moveY * (this._xrSessionManager.scene.useRightHandedSystem ? 1.0 : -1.0)
            );
            // move according to forward direction based on camera speed
            Vector3.TransformCoordinatesToRef(this._tmpTranslationDirection, this._tmpRotationMatrix, this._tmpMovementTranslation);
            this._tmpMovementTranslation.scaleInPlace(this._xrInput.xrCamera._computeLocalCameraSpeed() * this._featureContext.movementSpeed);
            this._tmpMovementTranslation.y = 0;

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

                        if ("buttonChangedhandler" in registration) {
                            registeredComponent.onButtonChangedObserver = component.onButtonStateChangedObservable.add(() => {
                                if (component!.changes.pressed) {
                                    registration.buttonChangedhandler(component!.changes.pressed, this._movementState, this._featureContext, this._xrInput);
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

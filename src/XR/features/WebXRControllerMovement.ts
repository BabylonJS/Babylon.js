import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import { Observer } from "../../Misc/observable";
import { WebXRSessionManager } from "../webXRSessionManager";
import { Nullable } from "../../types";
import { WebXRInput } from "../webXRInput";
import { WebXRInputSource } from "../webXRInputSource";
import { WebXRControllerComponent, IWebXRMotionControllerAxesValue, IWebXRMotionControllerComponentChangesValues } from "../motionController/webXRControllerComponent";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Matrix, Quaternion, Vector3 } from "../../Maths/math.vector";
import { Ray } from "../../Culling/ray";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { MotionControllerComponentType } from "../motionController/webXRAbstractMotionController";
import { Tools } from "../../Misc/tools";
import { PrecisionDate } from "../../Misc/precisionDate";

/**
 * These restrictions are applied to movements (not rotations).
 */
export type WebXRControllerMovementRestrictions = {
    /**
     * Only allow movement on floor meshes within additional constraints.
     * Default: true
     */
    floorMeshesOnly: boolean
    /**
     * Can we fall to a lower floor mesh when moving?
     * Default: user height (or 1.8 when not available) x 3.  Set to 0 to disable.
     */
    fallingDistance: number
    /**
     * Can we go up to a higher floor (ie: stairs) when moving?
     * Default: user height (or 1.8m when not available).  Set to 0 to disable.
     */
    climbingDistance: number
};

/**
 * The options container for the controller movement module
 */
export interface IWebXRControllerMovementOptions {
    /**
     * A list of meshes to use as floor meshes.
     * Meshes can be added and removed after initializing the feature using the
     * addFloorMesh and removeFloorMesh functions
     */
    floorMeshes?: AbstractMesh[];
    /**
     * Babylon XR Input class for controller
     */
    xrInput: WebXRInput;
    /**
     * How rotational speed should be applied when rotating right and left based on amount tipped
     */
    rotationSpeed?: number;
    /**
     * Is rotation enabled
     */
    rotationEnabled?: boolean;
    /**
    * Threshold the controller's stick is tipped over (below is ignored) for both rotation and movement.
    */
    thumbstickThreshold?: number;
    /**
     * How movement should be applied to values.  Defaults to walking speed 1.4 m/s
     */
    movementSpeed?: number;
    /**
     * Is movement enabled
     */
    movementEnabled?: boolean;
    /**
     * Override default behaviour and provide your own movement controls
     */
    customRegistrationConfigurations?: WebXRControllerMovementRegistrationConfiguration[];
    /**
     * Restrict controller movement to remain above floor meshes (within defined restrictions for climbing/drops/etc.)
     * Default: Floor meshes only with climbing and drops allowed.
     */
    movementRestrictions?: WebXRControllerMovementRestrictions;
    /**
     * TODO: If provided, this function will be used to generate the ray mesh instead of the lines mesh being used per default
     * use camera direction?  Currently camera direction follows head movement - would like to turn this off.
     */
    // followCamera?: boolean
    // getForwardDirection?: (??) => Vector3;
}

/**
 * Feature context is used in handlers and on each XR frame to control the camera movement.
 */
export type WebXRControllerMovementFeatureContext = {
    rotationSpeed: number
    rotationEnabled: boolean
    movementSpeed: number
    movementEnabled: boolean
    thumbstickThreshold: number
    floorMeshes: AbstractMesh[]
    // followCameraRotation: boolean
    movementRestrictions: WebXRControllerMovementRestrictions;
};

/**
 * Current state of Movements shared across components and handlers.
 */
export type WebXRControllerMovementState = {
    moveX: number
    moveZ: number
    baseRotationY: number
    rotateY: number
};

/**
 * Button of Axis Handler must be specified.
 */
export type WebXRControllerMovementRegistrationConfiguration = {
    /**
     * handlers are filtered to these types only
     */
    allowedComponentTypes?: MotionControllerComponentType[]
    /**
     * For registering movement to specific hand only.  Useful if your app has a "main hand" and "off hand" for determining the functionality of a controller.
     */
    handedness?: XRHandedness
    /**
     * For main component only (useful for buttons and may not trigger axis changes)
     */
    mainComponentOnly?: boolean
    /**
     * Additional predicate to apply to controllers to restrict a handler being added.
     */
    componentSelectionPredicate?: (xrController: WebXRInputSource) => Nullable<WebXRControllerComponent>
} & ({
    /**
     * called when the axis changes
     */
    axisChangedHandler: (axes: IWebXRMotionControllerAxesValue, movementState: WebXRControllerMovementState, featureContext: WebXRControllerMovementFeatureContext, xrInput: WebXRInput, xrSessionManager: WebXRSessionManager) => void
    // buttonChangedhandler?: never
} | {
    /**
     * Called when the button state changes
     */
    buttonChangedhandler: (pressed: IWebXRMotionControllerComponentChangesValues<boolean>, movementState: WebXRControllerMovementState, featureContext: WebXRControllerMovementFeatureContext, xrInput: WebXRInput, xrSessionManager: WebXRSessionManager) => void
    // axisChangedHandler?: never
});

type RegisteredComponent = {
    registrationConfiguration: WebXRControllerMovementRegistrationConfiguration
    component: WebXRControllerComponent
    onAxisChangedObserver?: Nullable<Observer<IWebXRMotionControllerAxesValue>>
    onButtonChangedObserver?: Nullable<Observer<WebXRControllerComponent>>
};

/**
 * This is a movement feature to be used with WebXR-enabled motion controllers.
 * When enabled and attached, the feature will allow a user to move around and rotate in the scene using
 * the input of the attached controllers.
 */
export class WebXRControllerMovement extends WebXRAbstractFeature {
    private static readonly AVERAGE_WALKING_SPEED_METERS_PER_SECOND = 1.4;
    private _controllers: {
        [controllerUniqueId: string]: {
            xrController: WebXRInputSource;
            registeredComponents: RegisteredComponent[];
        };
    } = {};

    private _currentRegistrationConfigurations: WebXRControllerMovementRegistrationConfiguration[] = [];
    private _xrInput: WebXRInput;
    private _movementState: WebXRControllerMovementState;
    private _lastFrameTime: number;

    // unused
    private _tmpRay = new Ray(new Vector3(), new Vector3());
    private _tmpVector = new Vector3();
    // private _tmpQuaternion = new Quaternion();

    // Feature configuration is syncronized here - this is passed to all handlers (reduce memory pressure).
    private _featureContext: WebXRControllerMovementFeatureContext;

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.MOVEMENT;

    /**
     * These are the default movements.
     * TODO: add alternative common movements
     */
    public static readonly REGISTRATIONS: Record<string, WebXRControllerMovementRegistrationConfiguration[]> = {
        "default": [
            {
                allowedComponentTypes: [WebXRControllerComponent.THUMBSTICK_TYPE, WebXRControllerComponent.TOUCHPAD_TYPE],
                handedness: "left",
                axisChangedHandler: (axes: IWebXRMotionControllerAxesValue, movementState: WebXRControllerMovementState, featureContext: WebXRControllerMovementFeatureContext, xrInput: WebXRInput, xrSessionManager: WebXRSessionManager) => {
                    console.log(`rotate axes: ${JSON.stringify(axes)}`);
                    movementState.rotateY = Math.abs(axes.x) > featureContext.thumbstickThreshold
                        ? axes.x
                        : 0;
                }
            }, {
                allowedComponentTypes: [WebXRControllerComponent.THUMBSTICK_TYPE, WebXRControllerComponent.TOUCHPAD_TYPE],
                handedness: "right",
                axisChangedHandler: (axes: IWebXRMotionControllerAxesValue, movementState: WebXRControllerMovementState, featureContext: WebXRControllerMovementFeatureContext, xrInput: WebXRInput, xrSessionManager: WebXRSessionManager) => {
                    movementState.moveX = (Math.abs(axes.x) > featureContext.thumbstickThreshold)
                        ? axes.x
                        : 0;
                    movementState.moveZ = (Math.abs(axes.y) > featureContext.thumbstickThreshold)
                        ? axes.y
                        : 0;
                    console.log(`move axes: ${JSON.stringify(axes)}, ${JSON.stringify(movementState)}`);
                }
            }
        ]
    };
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the webxr specs version
     */
    public static readonly Version = 1;

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
     * Gets rotation speed
     */
    public get rotationSpeed(): number {
        return this._featureContext.rotationSpeed;
    }

    /**
     * Sets rotation speed
     * @param rotationSpeed new rotation speed
     */
    public set rotationSpeed(rotationSpeed: number) {
        this._featureContext.rotationSpeed = rotationSpeed;
    }

    /**
     * Gets thumbstick threshold (amount needed to tip to trigger movement or rotation)
     */
    public get thumbstickThreshold(): number {
        return this._featureContext.thumbstickThreshold;
    }

    /**
     * Sets the threshold for the thumbstick movement
     * @param thumbstickThreshold new threshold for thumbstick
     */
    public set thumbstickThreshold(thumbstickThreshold: number) {
        this._featureContext.thumbstickThreshold = thumbstickThreshold;
    }

    /**
     * Gets restrictions that are applied while moving
     */
     public get movementRestrictions(): WebXRControllerMovementRestrictions {
        return this._featureContext.movementRestrictions;
    }

    /**
     * constructs a new movement controller system
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param options configuration object for this feature
     */
    constructor(_xrSessionManager: WebXRSessionManager, options: IWebXRControllerMovementOptions) {
        super(_xrSessionManager);

        if (!options || options.xrInput === undefined) {
            Tools.Warn('WebXRControllerMovement feature requires "xrInput" option.');
            return;
        }

        this._xrInput = options.xrInput;

        this._movementState = {
            // TODO: needed for adding feature that movement doesn't follow head rotating camera
            baseRotationY: this._xrInput.xrCamera.rotationQuaternion.toEulerAngles().y,
            // currentRotation: Quaternion.Identity(),
            moveX: 0,
            moveZ: 0,
            rotateY: 0,
        };

        const realWorldHeight = this._xrInput.xrCamera.realWorldHeight;

        // synchronized from feature setter properties
        this._featureContext = {
            floorMeshes: options.floorMeshes || [],
            movementEnabled: options.movementEnabled || true,
            movementSpeed: options.movementSpeed || WebXRControllerMovement.AVERAGE_WALKING_SPEED_METERS_PER_SECOND,
            rotationEnabled: options.rotationEnabled || true,
            rotationSpeed: options.rotationSpeed || 0.15,
            thumbstickThreshold: options.thumbstickThreshold || 0.25,
            movementRestrictions: options.movementRestrictions ?? {
                floorMeshesOnly: true,
                climbingDistance: realWorldHeight > 0 ? realWorldHeight : 1.8,
                fallingDistance: realWorldHeight > 0 ? realWorldHeight : 1.8 * 3,
            }
        };

        if (Array.isArray(options.customRegistrationConfigurations)) {
            this._currentRegistrationConfigurations = options.customRegistrationConfigurations;
        } else {
            this._currentRegistrationConfigurations = WebXRControllerMovement.REGISTRATIONS.default;
        }
    }

    /**
     * Add a new mesh to the floor meshes array
     * @param mesh the mesh to use as floor mesh
     */
    public addFloorMesh(mesh: AbstractMesh) {
        this._featureContext.floorMeshes.push(mesh);
    }

    public attach(): boolean {
        if (!super.attach()) {
            return false;
        }

        // restart for deltas
        this._lastFrameTime = PrecisionDate.Now;

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

    // public dispose(): void {
    //     super.dispose();
    // }

    /**
     * Remove a mesh from the floor meshes array
     * @param mesh the mesh to remove
     */
    public removeFloorMesh(mesh: AbstractMesh) {
        const index = this._featureContext.floorMeshes.indexOf(mesh);
        if (index !== -1) {
            this._featureContext.floorMeshes.splice(index, 1);
        }
    }

    /**
     * Remove a mesh from the floor meshes array using its name
     * @param name the mesh name to remove
     */
    public removeFloorMeshByName(name: string) {
        const mesh = this._xrSessionManager.scene.getMeshByName(name);
        if (mesh) {
            this.removeFloorMesh(mesh);
        }
    }

    /**
     * Occurs on every XR frame.
     * NOTE: we probably want an afterXRFrame to fire.
     */
    protected _onXRFrame(_xrFrame: XRFrame) {
        if (!this.attach) {
            return;
        }

        // smooth between different frame rates
        const currentTime = PrecisionDate.Now;
        const delta = (currentTime - this._lastFrameTime) * 0.001;
        this._lastFrameTime = currentTime;

        // applying rotations before translations
        if (this._movementState.rotateY !== 0 && this._featureContext.rotationEnabled) {
            const rotationY = this._movementState.rotateY * delta * (this._xrSessionManager.scene.useRightHandedSystem ? -1 : 1);
            Quaternion.FromEulerAngles(0, rotationY, 0).multiplyToRef(
                this._xrInput.xrCamera.rotationQuaternion,
                this._xrInput.xrCamera.rotationQuaternion
            );
        }

        if ((this._movementState.moveX !== 0 || this._movementState.moveZ !== 0) && this._featureContext.movementEnabled) {
            const matrix = new Matrix();
            Matrix.FromQuaternionToRef(this._xrInput.xrCamera.rotationQuaternion, matrix);

            const translation = new Vector3(this._movementState.moveX, 0, this._movementState.moveZ * (this._xrSessionManager.scene.useRightHandedSystem ? 1.0 : -1.0)).normalize();
            translation.scaleInPlace(this._featureContext.movementSpeed * delta);
            const addPos = Vector3.TransformCoordinates(translation, matrix);

            addPos.y = 0;

            // get the mesh below new position based on movement from current position
            this._tmpVector.copyFrom(addPos);
            this._tmpVector.addInPlace(this._xrInput.xrCamera.position);

            // make a ray from where we would move to starting at climbing height above us and pointing to max fall distance.
            this._tmpRay.origin.copyFrom(this._tmpVector);
            this._tmpRay.origin.y += this._featureContext.movementRestrictions.climbingDistance;
            this._tmpRay.length = this._featureContext.movementRestrictions.climbingDistance + this._featureContext.movementRestrictions.fallingDistance;
            this._tmpRay.direction.set(0, -1, 0); // Vector3.Down()

            let pick = this._xrSessionManager.scene.pickWithRay(this._tmpRay, (o) => {
                return this._featureContext.floorMeshes.indexOf(o) !== -1;
            });

            if (pick && pick.pickedPoint) {
                this._xrInput.xrCamera.position.x = pick.pickedPoint.x;
                this._xrInput.xrCamera.position.z = pick.pickedPoint.z;

                const feetToFloorDifference = this._xrInput.xrCamera.position.y - pick.pickedPoint.y - this._xrInput.xrCamera.realWorldHeight;

                // always move x,z coordinates, but camera should be our height from the ground.
                if (Math.abs(feetToFloorDifference) > 0.01 /* 1cm epsilon */) {
                    // TODO: lerp on XRFrame will be a problem if we are "in the air" when XR Frames stop!
                    // TODO: animation would need to be ended on a detach
                    // TODO: animation would need to be stopped and a new one started if we detected a new height
                    // TODO: we need to do nothing if there is an animation in progress to the correct height already
                    // this._movementState.cameraAnimationY = this._xrSessionManager.scene.beginDirectAnimation(this._xrInput.xrCamera.position.y, [], 1, 2, false, undefined, (() => {
                    //     this._movementState.cameraAnimationY = null;
                    // }));

                    const lerp = feetToFloorDifference * 0.75;
                    this._xrInput.xrCamera.position.y = pick.pickedPoint.y + this._xrInput.xrCamera.realWorldHeight + lerp;
                } else {
                    this._xrInput.xrCamera.position.y = pick.pickedPoint.y + this._xrInput.xrCamera.realWorldHeight;
                }
            } else {
                if (this._featureContext.movementRestrictions.floorMeshesOnly !== true) {
                    this._xrInput.xrCamera.position = this._xrInput.xrCamera.position.add(addPos);
                }
            }
        }
    }

    private _attachController = (xrController: WebXRInputSource) => {
        if (this._controllers[xrController.uniqueId]) {
            // already attached
            return;
        }

        this._controllers[xrController.uniqueId] = {
            xrController,
            registeredComponents: []
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
                            for (let componentType of registration.allowedComponentTypes) {
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

                        if (typeof registration.componentSelectionPredicate === 'function') {
                            // if does not match we do want to ignore a previously found component
                            component = registration.componentSelectionPredicate(xrController);
                        }

                        if (component && registration.handedness) {
                            if (xrController.inputSource.handedness !== registration.handedness) {
                                component = null; // do no register
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

                        if ('axisChangedHandler' in registration) {
                            registeredComponent.onAxisChangedObserver = component.onAxisValueChangedObservable.add((axesData) => {
                                registration.axisChangedHandler(axesData, this._movementState, this._featureContext, this._xrInput, this._xrSessionManager);
                            });
                        }

                        if ('buttonChangedhandler' in registration) {
                            registeredComponent.onButtonChangedObserver = component.onButtonStateChangedObservable.add(() => {
                                if (component!.changes.pressed) {
                                    registration.buttonChangedhandler(component!.changes.pressed, this._movementState, this._featureContext, this._xrInput, this._xrSessionManager);
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
    }

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

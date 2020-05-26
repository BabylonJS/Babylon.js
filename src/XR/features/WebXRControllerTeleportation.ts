import { IWebXRFeature, WebXRFeaturesManager, WebXRFeatureName } from '../webXRFeaturesManager';
import { Observer } from '../../Misc/observable';
import { WebXRSessionManager } from '../webXRSessionManager';
import { Nullable } from '../../types';
import { WebXRInput } from '../webXRInput';
import { WebXRInputSource } from '../webXRInputSource';
import { WebXRControllerComponent, IWebXRMotionControllerAxesValue } from '../motionController/webXRControllerComponent';
import { AbstractMesh } from '../../Meshes/abstractMesh';
import { Vector3, Quaternion } from '../../Maths/math.vector';
import { Ray } from '../../Culling/ray';
import { Material } from '../../Materials/material';
import { DynamicTexture } from '../../Materials/Textures/dynamicTexture';
import { CylinderBuilder } from '../../Meshes/Builders/cylinderBuilder';
import { SineEase, EasingFunction } from '../../Animations/easing';
import { Animation } from '../../Animations/animation';
import { Axis } from '../../Maths/math.axis';
import { StandardMaterial } from '../../Materials/standardMaterial';
import { GroundBuilder } from '../../Meshes/Builders/groundBuilder';
import { TorusBuilder } from '../../Meshes/Builders/torusBuilder';
import { PickingInfo } from '../../Collisions/pickingInfo';
import { Curve3 } from '../../Maths/math.path';
import { LinesBuilder } from '../../Meshes/Builders/linesBuilder';
import { WebXRAbstractFeature } from './WebXRAbstractFeature';
import { Color3 } from '../../Maths/math.color';
import { Scene } from '../../scene';
import { UtilityLayerRenderer } from '../../Rendering/utilityLayerRenderer';
import { PointerEventTypes } from '../../Events/pointerEvents';
import { SetAndStartTimer } from '../../Misc/timer';

/**
 * The options container for the teleportation module
 */
export interface IWebXRTeleportationOptions {
    /**
     * if provided, this scene will be used to render meshes.
     */
    customUtilityLayerScene?: Scene;
    /**
     * Values to configure the default target mesh
     */
    defaultTargetMeshOptions?: {
        /**
         * Fill color of the teleportation area
         */
        teleportationFillColor?: string;
        /**
         * Border color for the teleportation area
         */
        teleportationBorderColor?: string;
        /**
         * Disable the mesh's animation sequence
         */
        disableAnimation?: boolean;
        /**
         * Disable lighting on the material or the ring and arrow
         */
        disableLighting?: boolean;
        /**
         * Override the default material of the torus and arrow
         */
        torusArrowMaterial?: Material;
    };
    /**
     * A list of meshes to use as floor meshes.
     * Meshes can be added and removed after initializing the feature using the
     * addFloorMesh and removeFloorMesh functions
     * If empty, rotation will still work
     */
    floorMeshes?: AbstractMesh[];
    /**
     *  use this rendering group id for the meshes (optional)
     */
    renderingGroupId?: number;
    /**
     * Should teleportation move only to snap points
     */
    snapPointsOnly?: boolean;
    /**
     * An array of points to which the teleportation will snap to.
     * If the teleportation ray is in the proximity of one of those points, it will be corrected to this point.
     */
    snapPositions?: Vector3[];
    /**
     * How close should the teleportation ray be in order to snap to position.
     * Default to 0.8 units (meters)
     */
    snapToPositionRadius?: number;
    /**
     * Provide your own teleportation mesh instead of babylon's wonderful doughnut.
     * If you want to support rotation, make sure your mesh has a direction indicator.
     *
     * When left untouched, the default mesh will be initialized.
     */
    teleportationTargetMesh?: AbstractMesh;
    /**
     * If main component is used (no thumbstick), how long should the "long press" take before teleport
     */
    timeToTeleport?: number;
    /**
     * Disable using the thumbstick and use the main component (usually trigger) on long press.
     * This will be automatically true if the controller doesn't have a thumbstick or touchpad.
     */
    useMainComponentOnly?: boolean;
    /**
     * Should meshes created here be added to a utility layer or the main scene
     */
    useUtilityLayer?: boolean;
    /**
     * Babylon XR Input class for controller
     */
    xrInput: WebXRInput;
}

/**
 * This is a teleportation feature to be used with WebXR-enabled motion controllers.
 * When enabled and attached, the feature will allow a user to move around and rotate in the scene using
 * the input of the attached controllers.
 */
export class WebXRMotionControllerTeleportation extends WebXRAbstractFeature {
    private _controllers: {
        [controllerUniqueId: string]: {
            xrController: WebXRInputSource;
            teleportationComponent?: WebXRControllerComponent;
            teleportationState: {
                forward: boolean;
                backwards: boolean;
                currentRotation: number;
                baseRotation: number;
                rotating: boolean;
            }
            onAxisChangedObserver?: Nullable<Observer<IWebXRMotionControllerAxesValue>>;
            onButtonChangedObserver?: Nullable<Observer<WebXRControllerComponent>>;
        };
    } = {};
    private _currentTeleportationControllerId: string;
    private _floorMeshes: AbstractMesh[];
    private _quadraticBezierCurve: AbstractMesh;
    private _selectionFeature: IWebXRFeature;
    private _snapToPositions: Vector3[];
    private _snappedToPoint: boolean = false;
    private _teleportationRingMaterial?: StandardMaterial;
    private _tmpRay = new Ray(new Vector3(), new Vector3());
    private _tmpVector = new Vector3();

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.TELEPORTATION;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the webxr specs version
     */
    public static readonly Version = 1;

    /**
     * Is movement backwards enabled
     */
    public backwardsMovementEnabled = true;
    /**
     * Distance to travel when moving backwards
     */
    public backwardsTeleportationDistance: number = 0.7;
    /**
     * The distance from the user to the inspection point in the direction of the controller
     * A higher number will allow the user to move further
     * defaults to 5 (meters, in xr units)
     */
    public parabolicCheckRadius: number = 5;
    /**
     * Should the module support parabolic ray on top of direct ray
     * If enabled, the user will be able to point "at the sky" and move according to predefined radius distance
     * Very helpful when moving between floors / different heights
     */
    public parabolicRayEnabled: boolean = true;
    /**
     * How much rotation should be applied when rotating right and left
     */
    public rotationAngle: number = Math.PI / 8;
    /**
     * Is rotation enabled when moving forward?
     * Disabling this feature will prevent the user from deciding the direction when teleporting
     */
    public rotationEnabled: boolean = true;

    /**
     * constructs a new anchor system
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param _options configuration object for this feature
     */
    constructor(_xrSessionManager: WebXRSessionManager, private _options: IWebXRTeleportationOptions) {
        super(_xrSessionManager);
        // create default mesh if not provided
        if (!this._options.teleportationTargetMesh) {
            this._createDefaultTargetMesh();
        }

        this._floorMeshes = this._options.floorMeshes || [];
        this._snapToPositions = this._options.snapPositions || [];

        this._setTargetMeshVisibility(false);
    }

    /**
     * Get the snapPointsOnly flag
     */
    public get snapPointsOnly(): boolean {
        return !!this._options.snapPointsOnly;
    }

    /**
     * Sets the snapPointsOnly flag
     * @param snapToPoints should teleportation be exclusively to snap points
     */
    public set snapPointsOnly(snapToPoints: boolean) {
        this._options.snapPointsOnly = snapToPoints;
    }

    /**
     * Add a new mesh to the floor meshes array
     * @param mesh the mesh to use as floor mesh
     */
    public addFloorMesh(mesh: AbstractMesh) {
        this._floorMeshes.push(mesh);
    }

    /**
     * Add a new snap-to point to fix teleportation to this position
     * @param newSnapPoint The new Snap-To point
     */
    public addSnapPoint(newSnapPoint: Vector3) {
        this._snapToPositions.push(newSnapPoint);
    }

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

        return true;
    }

    public detach(): boolean {
        if (!super.detach()) {
            return false;
        }

        Object.keys(this._controllers).forEach((controllerId) => {
            this._detachController(controllerId);
        });

        this._setTargetMeshVisibility(false);

        return true;
    }

    public dispose(): void {
        super.dispose();
        this._options.teleportationTargetMesh && this._options.teleportationTargetMesh.dispose(false, true);
    }

    /**
     * Remove a mesh from the floor meshes array
     * @param mesh the mesh to remove
     */
    public removeFloorMesh(mesh: AbstractMesh) {
        const index = this._floorMeshes.indexOf(mesh);
        if (index !== -1) {
            this._floorMeshes.splice(index, 1);
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
     * This function will iterate through the array, searching for this point or equal to it. It will then remove it from the snap-to array
     * @param snapPointToRemove the point (or a clone of it) to be removed from the array
     * @returns was the point found and removed or not
     */
    public removeSnapPoint(snapPointToRemove: Vector3): boolean {
        // check if the object is in the array
        let index = this._snapToPositions.indexOf(snapPointToRemove);
        // if not found as an object, compare to the points
        if (index === -1) {
            for (let i = 0; i < this._snapToPositions.length; ++i) {
                // equals? index is i, break the loop
                if (this._snapToPositions[i].equals(snapPointToRemove)) {
                    index = i;
                    break;
                }
            }
        }
        // index is not -1? remove the object
        if (index !== -1) {
            this._snapToPositions.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * This function sets a selection feature that will be disabled when
     * the forward ray is shown and will be reattached when hidden.
     * This is used to remove the selection rays when moving.
     * @param selectionFeature the feature to disable when forward movement is enabled
     */
    public setSelectionFeature(selectionFeature: IWebXRFeature) {
        this._selectionFeature = selectionFeature;
    }

    protected _onXRFrame(_xrFrame: XRFrame) {
        const frame = this._xrSessionManager.currentFrame;
        const scene = this._xrSessionManager.scene;
        if (!this.attach || !frame) { return; }

        // render target if needed
        const targetMesh = this._options.teleportationTargetMesh;
        if (this._currentTeleportationControllerId) {
            if (!targetMesh) {
                return;
            }
            targetMesh.rotationQuaternion = targetMesh.rotationQuaternion || new Quaternion();
            const controllerData = this._controllers[this._currentTeleportationControllerId];
            if (controllerData.teleportationState.forward) {
                // set the rotation
                Quaternion.RotationYawPitchRollToRef(controllerData.teleportationState.currentRotation + controllerData.teleportationState.baseRotation, 0, 0, targetMesh.rotationQuaternion);
                // set the ray and position

                let hitPossible = false;
                // first check if direct ray possible
                controllerData.xrController.getWorldPointerRayToRef(this._tmpRay);
                // pick grounds that are LOWER only. upper will use parabolic path
                let pick = scene.pickWithRay(this._tmpRay, (o) => {
                    const index = this._floorMeshes.indexOf(o);
                    if (index === -1) { return false; }
                    return (this._floorMeshes[index].absolutePosition.y < this._options.xrInput.xrCamera.position.y);
                });
                if (pick && pick.pickedPoint) {
                    hitPossible = true;
                    this._setTargetMeshPosition(pick.pickedPoint);
                    this._setTargetMeshVisibility(true);
                    this._showParabolicPath(pick);
                } else {
                    if (this.parabolicRayEnabled) {
                        // radius compensation according to pointer rotation around X
                        const xRotation = controllerData.xrController.pointer.rotationQuaternion!.toEulerAngles().x;
                        const compensation = (1 + ((Math.PI / 2) - Math.abs(xRotation)));
                        // check parabolic ray
                        const radius = this.parabolicCheckRadius * compensation;
                        this._tmpRay.origin.addToRef(this._tmpRay.direction.scale(radius * 2), this._tmpVector);
                        this._tmpVector.y = this._tmpRay.origin.y;
                        this._tmpRay.origin.addInPlace(this._tmpRay.direction.scale(radius));
                        this._tmpVector.subtractToRef(this._tmpRay.origin, this._tmpRay.direction);
                        this._tmpRay.direction.normalize();

                        let pick = scene.pickWithRay(this._tmpRay, (o) => {
                            return this._floorMeshes.indexOf(o) !== -1;
                        });
                        if (pick && pick.pickedPoint) {
                            hitPossible = true;
                            this._setTargetMeshPosition(pick.pickedPoint);
                            this._setTargetMeshVisibility(true);
                            this._showParabolicPath(pick);
                        }
                    }
                }

                // if needed, set visible:
                this._setTargetMeshVisibility(hitPossible);
            } else {
                this._setTargetMeshVisibility(false);
            }
        } else {
            this._setTargetMeshVisibility(false);
        }
    }

    private _attachController = (xrController: WebXRInputSource) => {
        if (this._controllers[xrController.uniqueId]) {
            // already attached
            return;
        }
        this._controllers[xrController.uniqueId] = {
            xrController,
            teleportationState: {
                forward: false,
                backwards: false,
                rotating: false,
                currentRotation: 0,
                baseRotation: 0
            }
        };
        const controllerData = this._controllers[xrController.uniqueId];
        // motion controller only available to gamepad-enabled input sources.
        if (controllerData.xrController.inputSource.targetRayMode === 'tracked-pointer'
            && controllerData.xrController.inputSource.gamepad) {
            // motion controller support
            xrController.onMotionControllerInitObservable.addOnce(() => {
                if (xrController.motionController) {
                    const movementController = xrController.motionController.getComponentOfType(WebXRControllerComponent.THUMBSTICK_TYPE) || xrController.motionController.getComponentOfType(WebXRControllerComponent.TOUCHPAD_TYPE);
                if (!movementController || this._options.useMainComponentOnly) {
                        // use trigger to move on long press
                        const mainComponent = xrController.motionController.getMainComponent();
                        if (!mainComponent) {
                            return;
                        }
                        controllerData.onButtonChangedObserver = mainComponent.onButtonStateChangedObservable.add(() => {
                            // did "pressed" changed?
                            if (mainComponent.changes.pressed) {
                                if (mainComponent.changes.pressed.current) {
                                    // simulate "forward" thumbstick push
                                    controllerData.teleportationState.forward = true;
                                    this._currentTeleportationControllerId = controllerData.xrController.uniqueId;
                                    controllerData.teleportationState.baseRotation = this._options.xrInput.xrCamera.rotationQuaternion.toEulerAngles().y;
                                    controllerData.teleportationState.currentRotation = 0;
                                    const timeToSelect = this._options.timeToTeleport || 3000;
                                    SetAndStartTimer({
                                        time: timeToSelect,
                                        countingObservable: this._xrSessionManager.onXRFrameObservable,
                                        breakCondition: () => !mainComponent.pressed,
                                        onEnded: () => {
                                            if (this._currentTeleportationControllerId === controllerData.xrController.uniqueId && controllerData.teleportationState.forward) {
                                                this._teleportForward(xrController.uniqueId);
                                            }
                                        }
                                    });
                                } else {
                                    controllerData.teleportationState.forward = false;
                                    this._currentTeleportationControllerId = "";
                                }
                            }
                        });
                    } else {
                        // use thumbstick (or touchpad if thumbstick not available)
                        controllerData.onAxisChangedObserver = movementController.onAxisValueChangedObservable.add((axesData) => {
                            if (axesData.y <= 0.7 && controllerData.teleportationState.backwards) {
                                controllerData.teleportationState.backwards = false;
                            }
                            if (axesData.y > 0.7 && !controllerData.teleportationState.forward && this.backwardsMovementEnabled && !this.snapPointsOnly) {
                                // teleport backwards
                                if (!controllerData.teleportationState.backwards) {
                                    controllerData.teleportationState.backwards = true;
                                    // teleport backwards ONCE
                                    this._tmpVector.set(0, 0, this.backwardsTeleportationDistance * (this._xrSessionManager.scene.useRightHandedSystem ? -1.0 : 1.0));
                                    this._tmpVector.rotateByQuaternionToRef(this._options.xrInput.xrCamera.rotationQuaternion!, this._tmpVector);
                                    this._tmpVector.addInPlace(this._options.xrInput.xrCamera.position);
                                    this._options.xrInput.xrCamera.position.subtractToRef(this._tmpVector, this._tmpVector);
                                    this._tmpRay.origin.copyFrom(this._tmpVector);
                                    this._tmpRay.direction.set(0, this._xrSessionManager.scene.useRightHandedSystem ? 1 : -1, 0);
                                    let pick = this._xrSessionManager.scene.pickWithRay(this._tmpRay, (o) => {
                                        return this._floorMeshes.indexOf(o) !== -1;
                                    });

                                    // pick must exist, but stay safe
                                    if (pick && pick.pickedPoint) {
                                        // Teleport the users feet to where they targeted
                                        this._options.xrInput.xrCamera.position.addInPlace(pick.pickedPoint);
                                    }
                                }
                            }
                            if (axesData.y < -0.7 && !this._currentTeleportationControllerId && !controllerData.teleportationState.rotating) {
                                controllerData.teleportationState.forward = true;
                                this._currentTeleportationControllerId = controllerData.xrController.uniqueId;
                                controllerData.teleportationState.baseRotation = this._options.xrInput.xrCamera.rotationQuaternion.toEulerAngles().y;
                            }
                            if (axesData.x) {
                                if (!controllerData.teleportationState.forward) {
                                    if (!controllerData.teleportationState.rotating && Math.abs(axesData.x) > 0.7) {
                                        // rotate in the right direction positive is right
                                        controllerData.teleportationState.rotating = true;
                                        const rotation = this.rotationAngle * (axesData.x > 0 ? 1 : -1) * (this._xrSessionManager.scene.useRightHandedSystem ? -1 : 1);
                                        this._options.xrInput.xrCamera.rotationQuaternion.multiplyInPlace(Quaternion.FromEulerAngles(0, rotation, 0));
                                    }
                                } else {
                                    if (this._currentTeleportationControllerId === controllerData.xrController.uniqueId) {
                                        // set the rotation of the forward movement
                                        if (this.rotationEnabled) {
                                            setTimeout(() => {
                                                controllerData.teleportationState.currentRotation = Math.atan2(axesData.x, axesData.y * (this._xrSessionManager.scene.useRightHandedSystem ? 1 : -1));
                                            });
                                        } else {
                                            controllerData.teleportationState.currentRotation = 0;
                                        }
                                    }
                                }
                            } else {
                                controllerData.teleportationState.rotating = false;
                            }

                            if (axesData.x === 0 && axesData.y === 0) {
                                if (controllerData.teleportationState.forward) {
                                    this._teleportForward(xrController.uniqueId);
                                }
                            }
                        });
                    }
                }
            });
        } else {

            this._xrSessionManager.scene.onPointerObservable.add((pointerInfo) => {
                if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                    controllerData.teleportationState.forward = true;
                    this._currentTeleportationControllerId = controllerData.xrController.uniqueId;
                    controllerData.teleportationState.baseRotation = this._options.xrInput.xrCamera.rotationQuaternion.toEulerAngles().y;
                    controllerData.teleportationState.currentRotation = 0;
                    const timeToSelect = this._options.timeToTeleport || 3000;
                    SetAndStartTimer({
                        time: timeToSelect,
                        countingObservable: this._xrSessionManager.onXRFrameObservable,
                        onEnded: () => {
                            if (this._currentTeleportationControllerId === controllerData.xrController.uniqueId && controllerData.teleportationState.forward) {
                                this._teleportForward(xrController.uniqueId);
                            }
                        }
                    });
                } else if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                    controllerData.teleportationState.forward = false;
                    this._currentTeleportationControllerId = "";
                }
            });
        }
    }

    private _createDefaultTargetMesh() {
        // set defaults
        this._options.defaultTargetMeshOptions = this._options.defaultTargetMeshOptions || {};
        const sceneToRenderTo = this._options.useUtilityLayer ? (this._options.customUtilityLayerScene || UtilityLayerRenderer.DefaultUtilityLayer.utilityLayerScene) : this._xrSessionManager.scene;
        let teleportationTarget = GroundBuilder.CreateGround("teleportationTarget", { width: 2, height: 2, subdivisions: 2 }, sceneToRenderTo);
        teleportationTarget.isPickable = false;
        let length = 512;
        let dynamicTexture = new DynamicTexture("teleportationPlaneDynamicTexture", length, sceneToRenderTo, true);
        dynamicTexture.hasAlpha = true;
        let context = dynamicTexture.getContext();
        let centerX = length / 2;
        let centerY = length / 2;
        let radius = 200;
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        context.fillStyle = this._options.defaultTargetMeshOptions.teleportationFillColor || "#444444";
        context.fill();
        context.lineWidth = 10;
        context.strokeStyle = this._options.defaultTargetMeshOptions.teleportationBorderColor || "#FFFFFF";
        context.stroke();
        context.closePath();
        dynamicTexture.update();
        const teleportationCircleMaterial = new StandardMaterial("teleportationPlaneMaterial", sceneToRenderTo);
        teleportationCircleMaterial.diffuseTexture = dynamicTexture;
        teleportationTarget.material = teleportationCircleMaterial;
        let torus = TorusBuilder.CreateTorus("torusTeleportation", {
            diameter: 0.75,
            thickness: 0.1,
            tessellation: 20
        }, sceneToRenderTo);
        torus.isPickable = false;
        torus.parent = teleportationTarget;
        if (!this._options.defaultTargetMeshOptions.disableAnimation) {
            let animationInnerCircle = new Animation("animationInnerCircle", "position.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
            let keys = [];
            keys.push({
                frame: 0,
                value: 0
            });
            keys.push({
                frame: 30,
                value: 0.4
            });
            keys.push({
                frame: 60,
                value: 0
            });
            animationInnerCircle.setKeys(keys);
            let easingFunction = new SineEase();
            easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
            animationInnerCircle.setEasingFunction(easingFunction);
            torus.animations = [];
            torus.animations.push(animationInnerCircle);
            sceneToRenderTo.beginAnimation(torus, 0, 60, true);
        }

        var cone = CylinderBuilder.CreateCylinder("cone", { diameterTop: 0, tessellation: 4 }, sceneToRenderTo);
        cone.isPickable = false;
        cone.scaling.set(0.5, 0.12, 0.2);

        cone.rotate(Axis.X, Math.PI / 2);

        cone.position.z = 0.6;
        cone.parent = torus;

        if (this._options.defaultTargetMeshOptions.torusArrowMaterial) {
            torus.material = this._options.defaultTargetMeshOptions.torusArrowMaterial;
            cone.material = this._options.defaultTargetMeshOptions.torusArrowMaterial;
        } else {
            const torusConeMaterial = new StandardMaterial("torusConsMat", sceneToRenderTo);
            torusConeMaterial.disableLighting = !!this._options.defaultTargetMeshOptions.disableLighting;
            if (torusConeMaterial.disableLighting) {
                torusConeMaterial.emissiveColor = new Color3(0.3, 0.3, 1.0);
            } else {
                torusConeMaterial.diffuseColor = new Color3(0.3, 0.3, 1.0);
            }
            torusConeMaterial.alpha = 0.9;
            torus.material = torusConeMaterial;
            cone.material = torusConeMaterial;
            this._teleportationRingMaterial = torusConeMaterial;
        }

        if (this._options.renderingGroupId !== undefined) {
            teleportationTarget.renderingGroupId = this._options.renderingGroupId;
            torus.renderingGroupId = this._options.renderingGroupId;
            cone.renderingGroupId = this._options.renderingGroupId;
        }

        this._options.teleportationTargetMesh = teleportationTarget;
    }

    private _detachController(xrControllerUniqueId: string) {
        const controllerData = this._controllers[xrControllerUniqueId];
        if (!controllerData) { return; }
        if (controllerData.teleportationComponent) {
            if (controllerData.onAxisChangedObserver) {
                controllerData.teleportationComponent.onAxisValueChangedObservable.remove(controllerData.onAxisChangedObserver);
            }
            if (controllerData.onButtonChangedObserver) {
                controllerData.teleportationComponent.onButtonStateChangedObservable.remove(controllerData.onButtonChangedObserver);
            }
        }
        // remove from the map
        delete this._controllers[xrControllerUniqueId];
    }

    private _findClosestSnapPointWithRadius(realPosition: Vector3, radius: number = this._options.snapToPositionRadius || 0.8) {
        let closestPoint: Nullable<Vector3> = null;
        let closestDistance = Number.MAX_VALUE;
        if (this._snapToPositions.length) {
            const radiusSquared = radius * radius;
            this._snapToPositions.forEach((position) => {
                const dist = Vector3.DistanceSquared(position, realPosition);
                if (dist <= radiusSquared && dist < closestDistance) {
                    closestDistance = dist;
                    closestPoint = position;
                }
            });
        }
        return closestPoint;
    }

    private _setTargetMeshPosition(newPosition: Vector3) {
        if (!this._options.teleportationTargetMesh) { return; }
        const snapPosition = this._findClosestSnapPointWithRadius(newPosition);
        this._snappedToPoint = !!snapPosition;
        if (this.snapPointsOnly && !this._snappedToPoint && this._teleportationRingMaterial) {
            this._teleportationRingMaterial.diffuseColor.set(1.0, 0.3, 0.3);
        } else if (this.snapPointsOnly && this._snappedToPoint && this._teleportationRingMaterial) {
            this._teleportationRingMaterial.diffuseColor.set(0.3, 0.3, 1.0);
        }
        this._options.teleportationTargetMesh.position.copyFrom(snapPosition || newPosition);
        this._options.teleportationTargetMesh.position.y += 0.01;
    }

    private _setTargetMeshVisibility(visible: boolean) {
        if (!this._options.teleportationTargetMesh) { return; }
        if (this._options.teleportationTargetMesh.isVisible === visible) { return; }
        this._options.teleportationTargetMesh.isVisible = visible;
        this._options.teleportationTargetMesh.getChildren(undefined, false).forEach((m) => { (<any>(m)).isVisible = visible; });

        if (!visible) {
            if (this._quadraticBezierCurve) {
                this._quadraticBezierCurve.dispose();
            }
            if (this._selectionFeature) {
                this._selectionFeature.attach();
            }
        } else {
            if (this._selectionFeature) {
                this._selectionFeature.detach();
            }
        }
    }

    private _showParabolicPath(pickInfo: PickingInfo) {
        if (!pickInfo.pickedPoint) { return; }

        const controllerData = this._controllers[this._currentTeleportationControllerId];

        const quadraticBezierVectors = Curve3.CreateQuadraticBezier(
            controllerData.xrController.pointer.absolutePosition,
            pickInfo.ray!.origin,
            pickInfo.pickedPoint,
            25);

        if (this._quadraticBezierCurve) {
            this._quadraticBezierCurve.dispose();
        }

        this._quadraticBezierCurve = LinesBuilder.CreateLines("path line", { points: quadraticBezierVectors.getPoints() });
        this._quadraticBezierCurve.isPickable = false;
    }

    private _teleportForward(controllerId: string) {
        const controllerData = this._controllers[controllerId];
        if (!controllerData.teleportationState.forward) {
            return;
        }
        controllerData.teleportationState.forward = false;
        this._currentTeleportationControllerId = "";
        if (this.snapPointsOnly && !this._snappedToPoint) {
            return;
        }
        // do the movement forward here
        if (this._options.teleportationTargetMesh && this._options.teleportationTargetMesh.isVisible) {
            const height = this._options.xrInput.xrCamera.realWorldHeight;
            this._options.xrInput.xrCamera.position.copyFrom(this._options.teleportationTargetMesh.position);
            this._options.xrInput.xrCamera.position.y += height;
            this._options.xrInput.xrCamera.rotationQuaternion.multiplyInPlace(Quaternion.FromEulerAngles(0, controllerData.teleportationState.currentRotation - (this._xrSessionManager.scene.useRightHandedSystem ? Math.PI : 0), 0));
        }
    }
}

WebXRFeaturesManager.AddWebXRFeature(WebXRMotionControllerTeleportation.Name, (xrSessionManager, options) => {
    return () => new WebXRMotionControllerTeleportation(xrSessionManager, options);
}, WebXRMotionControllerTeleportation.Version, true);
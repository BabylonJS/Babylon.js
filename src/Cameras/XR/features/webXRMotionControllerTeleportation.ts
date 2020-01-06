import { IWebXRFeature, WebXRFeaturesManager } from '../webXRFeaturesManager';
import { Observer } from '../../../Misc/observable';
import { WebXRSessionManager } from '../webXRSessionManager';
import { Nullable } from '../../../types';
import { WebXRInput } from '../webXRInput';
import { WebXRController } from '../webXRController';
import { WebXRControllerComponent, IWebXRMotionControllerAxesValue } from '../motionController/webXRControllerComponent';
import { AbstractMesh } from '../../../Meshes/abstractMesh';
import { Vector3, Quaternion } from '../../../Maths/math.vector';
import { Ray } from '../../../Culling/ray';
import { Material } from '../../../Materials/material';
import { DynamicTexture } from '../../../Materials/Textures/dynamicTexture';
import { CylinderBuilder } from '../../../Meshes/Builders/cylinderBuilder';
import { SineEase, EasingFunction } from '../../../Animations/easing';
import { Animation } from '../../../Animations/animation';
import { Axis } from '../../../Maths/math.axis';
import { StandardMaterial } from '../../../Materials/standardMaterial';
import { GroundBuilder } from '../../../Meshes/Builders/groundBuilder';
import { TorusBuilder } from '../../../Meshes/Builders/torusBuilder';
import { PickingInfo } from '../../../Collisions/pickingInfo';
import { Curve3 } from '../../../Maths/math.path';
import { LinesBuilder } from '../../../Meshes/Builders/linesBuilder';

const Name = "xr-teleportation";

export interface IWebXRTeleportationOptions {
    xrInput: WebXRInput;
    floorMeshes: AbstractMesh[];
    rotationAngle?: number;
    backwardsTeleportationDistance?: number;
    teleportationTargetMesh?: AbstractMesh;
    defaultTargetMeshOptions?: {
        teleportationFillColor?: string;
        teleportationBorderColor?: string;
        torusArrowMaterial?: Material;
        disableAnimation?: boolean;
    };
    disableTeleportationParabolicRay?: boolean;
    disableRotation?: boolean;
    parabolicCheckRadius?: number;
}

export class WebXRMotionControllerTeleportation implements IWebXRFeature {
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
    private _tmpRay = new Ray(new Vector3(), new Vector3());
    private _tmpVector = new Vector3();

    /**
     * constructs a new anchor system
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param _options configuration object for this feature
     */
    constructor(private _xrSessionManager: WebXRSessionManager, private _options: IWebXRTeleportationOptions) {
        // set defaults
        if (!this._options.rotationAngle) {
            this._options.rotationAngle = Math.PI / 8;
        }

        if (!this._options.backwardsTeleportationDistance) {
            this._options.backwardsTeleportationDistance = 0.5;
        }

        // create default mesh if not provided
        if (!this._options.teleportationTargetMesh) {
            this.createDefaultTargetMesh();
        }

        this.setTargetMeshVisibility(false);
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
            const scene = this._xrSessionManager.scene;
            if (!this._attached || !frame) { return; }

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

                    // first check if direct ray possible
                    controllerData.xrController.getWorldPointerRayToRef(this._tmpRay);
                    let pick = scene.pickWithRay(this._tmpRay, (o) => {
                        return this._options.floorMeshes.indexOf(o) !== -1;
                    });
                    if (pick && pick.pickedPoint) {
                        this.setTargetMeshPosition(pick.pickedPoint);
                        this.setTargetMeshVisibility(true);
                        this.showParabolicPath(pick);
                    } else {
                        if (!this._options.disableTeleportationParabolicRay) {
                            // check parabolic ray
                            const radius = this._options.parabolicCheckRadius || 4;
                            this._tmpRay.origin.addToRef(this._tmpRay.direction.scale(radius * 2), this._tmpVector);
                            this._tmpVector.y = this._tmpRay.origin.y;
                            this._tmpRay.origin.addInPlace(this._tmpRay.direction.scale(radius));
                            this._tmpVector.subtractToRef(this._tmpRay.origin, this._tmpRay.direction);
                            this._tmpRay.direction.normalize();

                            let pick = scene.pickWithRay(this._tmpRay, (o) => {
                                return this._options.floorMeshes.indexOf(o) !== -1;
                            });
                            if (pick && pick.pickedPoint) {
                                this.setTargetMeshPosition(pick.pickedPoint);
                                this.setTargetMeshVisibility(true);
                                this.showParabolicPath(pick);
                            }
                        }
                    }

                    // if needed, set visible:
                    this.setTargetMeshVisibility(true);
                } else {
                    this.setTargetMeshVisibility(false);
                }
            } else {
                this.setTargetMeshVisibility(false);
            }
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
                baseRotation: number;
                rotating: boolean;
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
                rotating: false,
                currentRotation: 0,
                baseRotation: 0
            }
        };
        const controllerData = this._controllers[xrController.uniqueId];
        // motion controller support
        if (xrController.gamepadController) {
            const movementController = xrController.gamepadController.getComponent(WebXRControllerComponent.THUMBSTICK) || xrController.gamepadController.getComponent(WebXRControllerComponent.TOUCHPAD);
            if (!movementController) {
                // use trigger to move on long press
            } else {
                controllerData.onButtonChangedObserver = movementController.onButtonStateChanged.add(() => {
                    if (this._currentTeleportationControllerId === controllerData.xrController.uniqueId && controllerData.teleportationState.forward && !movementController.touched) {
                        console.log("in button changed", controllerData.teleportationState, movementController.touched, movementController.changes);
                        controllerData.teleportationState.forward = false;
                        this._currentTeleportationControllerId = "";
                        // do the movement forward here
                        if (this._options.teleportationTargetMesh) {
                            const height = this._options.xrInput.xrCamera.position.y - this._options.teleportationTargetMesh.position.y;
                            this._options.xrInput.xrCamera.position.copyFrom(this._options.teleportationTargetMesh.position);
                            this._options.xrInput.xrCamera.position.y += height;
                            this._options.xrInput.xrCamera.rotationQuaternion.multiplyInPlace(Quaternion.FromEulerAngles(0, controllerData.teleportationState.currentRotation, 0));
                        }
                    }
                });
                // use thumbstick (or touchpad if thumbstick not available)
                controllerData.onAxisChangedObserver = movementController.onAxisValueChanged.add((axesData) => {
                    if (axesData.y <= 0.7 && controllerData.teleportationState.backwards) {
                        //if (this._currentTeleportationControllerId === controllerData.xrController.uniqueId) {
                        controllerData.teleportationState.backwards = false;
                        //this._currentTeleportationControllerId = "";
                        //}
                    }
                    if (axesData.y > 0.7 && !controllerData.teleportationState.forward) {
                        // teleport backwards
                        if (!controllerData.teleportationState.backwards) {
                            controllerData.teleportationState.backwards = true;
                            // teleport backwards ONCE
                            this._tmpVector.set(0, 0, -this._options.backwardsTeleportationDistance!);
                            this._tmpVector.addInPlace(this._options.xrInput.xrCamera.position);
                            this._tmpRay.origin.copyFrom(this._tmpVector);
                            this._tmpRay.direction.set(0, -1, 0);
                            let pick = this._xrSessionManager.scene.pickWithRay(this._tmpRay, (o) => {
                                return this._options.floorMeshes.indexOf(o) !== -1;
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
                                console.log("in rotating", controllerData.teleportationState, movementController.touched, movementController.changes);
                                controllerData.teleportationState.rotating = true;
                                const rotation = this._options.rotationAngle! * (axesData.x > 0 ? 1 : -1);
                                this._options.xrInput.xrCamera.rotationQuaternion.multiplyInPlace(Quaternion.FromEulerAngles(0, rotation, 0));
                            }
                        } else {
                            if (this._currentTeleportationControllerId === controllerData.xrController.uniqueId) {
                                // set the rotation of the forward movement
                                setTimeout(() => {
                                    controllerData.teleportationState.currentRotation = Math.atan2(axesData.x, -axesData.y);
                                });
                            }
                        }
                    } else {
                        controllerData.teleportationState.rotating = false;
                    }

                    // if (this._currentTeleportationControllerId === controllerData.xrController.uniqueId && controllerData.teleportationState.forward && !movementController.touched) {
                    //     console.log("in forward axes", controllerData.teleportationState, movementController.touched, movementController.changes);
                    //     controllerData.teleportationState.forward = false;
                    //     this._currentTeleportationControllerId = "";
                    //     // do the movement forward here
                    //     if (this._options.teleportationTargetMesh) {
                    //         const height = this._options.xrInput.xrCamera.position.y - this._options.teleportationTargetMesh.position.y;
                    //         this._options.xrInput.xrCamera.position.copyFrom(this._options.teleportationTargetMesh.position);
                    //         this._options.xrInput.xrCamera.position.y += height;
                    //         this._options.xrInput.xrCamera.rotationQuaternion.multiplyInPlace(Quaternion.FromEulerAngles(0, controllerData.teleportationState.currentRotation, 0));
                    //     }
                    // }
                });
            }
        }
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

    private createDefaultTargetMesh() {
        // set defaults
        this._options.defaultTargetMeshOptions = this._options.defaultTargetMeshOptions || {};
        const scene = this._xrSessionManager.scene;
        let teleportationTarget = GroundBuilder.CreateGround("teleportationTarget", { width: 2, height: 2, subdivisions: 2 }, scene);
        teleportationTarget.isPickable = false;
        let length = 512;
        let dynamicTexture = new DynamicTexture("DynamicTexture", length, scene, true);
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
        let teleportationCircleMaterial = new StandardMaterial("TextPlaneMaterial", scene);
        teleportationCircleMaterial.diffuseTexture = dynamicTexture;
        teleportationTarget.material = teleportationCircleMaterial;
        let torus = TorusBuilder.CreateTorus("torusTeleportation", {
            diameter: 0.75,
            thickness: 0.1,
            tessellation: 20
        }, scene);
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
            scene.beginAnimation(torus, 0, 60, true);
        }

        var cone = CylinderBuilder.CreateCylinder("cone", { diameterTop: 0, tessellation: 4 }, scene);
        cone.scaling.set(0.5, 0.12, 0.2);

        cone.rotate(Axis.X, Math.PI / 2);

        cone.position.z = 0.6;
        cone.parent = torus;

        if (this._options.defaultTargetMeshOptions.torusArrowMaterial) {
            torus.material = this._options.defaultTargetMeshOptions.torusArrowMaterial;
            cone.material = this._options.defaultTargetMeshOptions.torusArrowMaterial;
        }

        this._options.teleportationTargetMesh = teleportationTarget;
    }

    private setTargetMeshVisibility(visible: boolean) {
        if (!this._options.teleportationTargetMesh) { return; }
        if (this._options.teleportationTargetMesh.isVisible === visible) { return; }
        this._options.teleportationTargetMesh.isVisible = visible;
        this._options.teleportationTargetMesh.getChildren(undefined, false).forEach((m) => { (<any>(m)).isVisible = visible; });

        if (!visible) {
            if (this.quadraticBezierCurve) {
                this.quadraticBezierCurve.dispose();
            }
        }
    }

    private setTargetMeshPosition(newPosition: Vector3) {
        if (!this._options.teleportationTargetMesh) { return; }
        this._options.teleportationTargetMesh.position.copyFrom(newPosition);
        this._options.teleportationTargetMesh.position.y += 0.01;
    }

    private quadraticBezierCurve: AbstractMesh;

    private showParabolicPath(pickInfo: PickingInfo) {
        if (!pickInfo.pickedPoint) { return; }

        const controllerData = this._controllers[this._currentTeleportationControllerId];

        const quadraticBezierVectors = Curve3.CreateQuadraticBezier(
            controllerData.xrController.pointer.absolutePosition,
            pickInfo.ray!.origin,
            pickInfo.pickedPoint,
            25);

            if (this.quadraticBezierCurve) {
                this.quadraticBezierCurve.dispose();
            }

            this.quadraticBezierCurve = LinesBuilder.CreateLines("qbezier", {points: quadraticBezierVectors.getPoints()});

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

WebXRFeaturesManager.AddWebXRFeature(WebXRMotionControllerTeleportation.Name, (xrSessionManager, options) => {
    return () => new WebXRMotionControllerTeleportation(xrSessionManager, options);
}, WebXRMotionControllerTeleportation.Version, true);
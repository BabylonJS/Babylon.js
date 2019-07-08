import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Quaternion, Vector3 } from '../../Maths/math';
import { Mesh } from '../../Meshes/mesh';
import { Ray } from '../../Culling/ray';
import { StandardMaterial } from '../../Materials/standardMaterial';
import { DynamicTexture } from '../../Materials/Textures/dynamicTexture';
import { EasingFunction, SineEase } from '../../Animations/easing';
import { Animation } from '../../Animations/animation';
import { WebXRInput } from './webXRInput';

/**
 * Enables teleportation
 */
export class WebXRControllerTeleportation {
    private _teleportationFillColor: string = "#444444";
    private _teleportationBorderColor: string = "#FFFFFF";

    private _tmpRay = new Ray(new Vector3(), new Vector3());
    private _tmpVector = new Vector3();

    /**
     * Creates a WebXRControllerTeleportation
     * @param input input manager to add teleportation to
     * @param floorMeshes floormeshes which can be teleported to
     */
    constructor(input: WebXRInput, floorMeshes: Array<AbstractMesh> = []) {
        input.onControllerAddedObservable.add((c) => {
            let scene = c.pointer.getScene();

            let forwardReadyToTeleport = false;
            let backwardReadyToTeleport = false;
            let leftReadyToTeleport = false;
            let rightReadyToTeleport = false;

            // Teleport target abd it's animation
            let teleportationTarget = Mesh.CreateGround("teleportationTarget", 2, 2, 2, scene);
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
            context.fillStyle = this._teleportationFillColor;
            context.fill();
            context.lineWidth = 10;
            context.strokeStyle = this._teleportationBorderColor;
            context.stroke();
            context.closePath();
            dynamicTexture.update();
            let teleportationCircleMaterial = new StandardMaterial("TextPlaneMaterial", scene);
            teleportationCircleMaterial.diffuseTexture = dynamicTexture;
            teleportationTarget.material = teleportationCircleMaterial;
            let torus = Mesh.CreateTorus("torusTeleportation", 0.75, 0.1, 25, scene, false);
            torus.isPickable = false;
            torus.parent = teleportationTarget;
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

            // Handle user input on every frame
            let renderObserver = scene.onBeforeRenderObservable.add(() => {
                // Move the teleportationTarget to where the user is targetting to teleport to
                if (forwardReadyToTeleport) {
                    c.getWorldPointerRayToRef(this._tmpRay);
                    let pick = scene.pickWithRay(this._tmpRay, (o) => {
                        return floorMeshes.indexOf(o) !== -1;
                    });
                    if (pick && pick.pickedPoint) {
                        // To avoid z-fighting
                        teleportationTarget.position.copyFrom(pick.pickedPoint);
                        teleportationTarget.position.y += 0.002;
                    }
                    teleportationTarget.isVisible = true;
                    (<Mesh>teleportationTarget.getChildren()[0]).isVisible = true;
                }else {
                    teleportationTarget.isVisible = false;
                    (<Mesh>teleportationTarget.getChildren()[0]).isVisible = false;
                }

                if (c.inputSource.gamepad) {
                    if (c.inputSource.gamepad.axes[1]) {
                        // Forward teleportation
                        if (c.inputSource.gamepad.axes[1] < -0.7) {
                            forwardReadyToTeleport = true;
                        }else {
                            if (forwardReadyToTeleport) {
                                // Teleport the users feet to where they targetted
                                this._tmpVector.copyFrom(teleportationTarget.position);
                                this._tmpVector.y += input.baseExperience.camera.position.y;
                                input.baseExperience.setPositionOfCameraUsingContainer(this._tmpVector);
                            }
                            forwardReadyToTeleport = false;
                        }

                        // Backward teleportation
                        if (c.inputSource.gamepad.axes[1] > 0.7) {
                            backwardReadyToTeleport = true;
                        }else {
                            if (backwardReadyToTeleport) {
                                // Cast a ray down from behind the user
                                let camMat = input.baseExperience.camera.computeWorldMatrix();
                                let q = new Quaternion();
                                camMat.decompose(undefined, q, this._tmpRay.origin);
                                this._tmpVector.set(0, 0, -1);
                                this._tmpVector.rotateByQuaternionToRef(q, this._tmpVector);
                                this._tmpVector.y = 0;
                                this._tmpVector.normalize();
                                this._tmpVector.y = -1.5;
                                this._tmpVector.normalize();
                                this._tmpRay.direction.copyFrom(this._tmpVector);
                                let pick = scene.pickWithRay(this._tmpRay, (o) => {
                                    return floorMeshes.indexOf(o) !== -1;
                                });

                                if (pick && pick.pickedPoint) {
                                    // Teleport the users feet to where they targetted
                                    this._tmpVector.copyFrom(pick.pickedPoint);
                                    this._tmpVector.y += input.baseExperience.camera.position.y;
                                    input.baseExperience.setPositionOfCameraUsingContainer(this._tmpVector);
                                }
                            }
                            backwardReadyToTeleport = false;
                        }
                    }

                    if (c.inputSource.gamepad.axes[0]) {
                        if (c.inputSource.gamepad.axes[0] < -0.7) {
                            leftReadyToTeleport = true;
                        }else {
                            if (leftReadyToTeleport) {
                                input.baseExperience.rotateCameraByQuaternionUsingContainer(Quaternion.FromEulerAngles(0, -Math.PI / 4, 0));
                            }
                            leftReadyToTeleport = false;
                        }
                        if (c.inputSource.gamepad.axes[0] > 0.7) {
                            rightReadyToTeleport = true;
                        }else {
                            if (rightReadyToTeleport) {
                                input.baseExperience.rotateCameraByQuaternionUsingContainer(Quaternion.FromEulerAngles(0, Math.PI / 4, 0));
                            }
                            rightReadyToTeleport = false;
                        }
                    }

                }
            });

            c.onDisposeObservable.addOnce(() => {
                teleportationTarget.dispose();
                dynamicTexture.dispose();
                teleportationCircleMaterial.dispose();
                torus.dispose();

                scene.onBeforeRenderObservable.remove(renderObserver);
            });
        });
    }

}
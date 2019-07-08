import { Nullable } from "../../types";
import {  Vector3, Color3, Axis } from '../../Maths/math';
import { Mesh } from '../../Meshes/mesh';
import { Ray } from '../../Culling/ray';
import { StandardMaterial } from '../../Materials/standardMaterial';
import { WebXRInput } from './webXRInput';

/**
 * Handles pointer input automatically for the pointer of XR controllers
 */
export class WebXRControllerPointerSelection {
    private static _idCounter = 0;
    private _tmpRay = new Ray(new Vector3(), new Vector3());

    /**
     * Creates a WebXRControllerPointerSelection
     * @param input input manager to setup pointer selection
     */
    constructor(input: WebXRInput) {
        input.onControllerAddedObservable.add((controller) => {
            let scene = controller.pointer.getScene();

            let laserPointer: Mesh;
            let cursorMesh: Mesh;
            let triggerDown = false;
            let id: number;
            id = WebXRControllerPointerSelection._idCounter++;

            // Create a laser pointer for the XR controller
            laserPointer = Mesh.CreateCylinder("laserPointer", 1, 0.0002, 0.004, 20, 1, scene, false);
            laserPointer.parent = controller.pointer;
            let laserPointerMaterial = new StandardMaterial("laserPointerMat", scene);
            laserPointerMaterial.emissiveColor = new Color3(0.7, 0.7, 0.7);
            laserPointerMaterial.alpha = 0.6;
            laserPointer.material = laserPointerMaterial;
            laserPointer.rotation.x = Math.PI / 2;
            this._updatePointerDistance(laserPointer, 1);
            laserPointer.isPickable = false;

            // Create a gaze tracker for the  XR controlelr
            cursorMesh = Mesh.CreateTorus("gazeTracker", 0.0035 * 3, 0.0025 * 3, 20, scene, false);
            cursorMesh.bakeCurrentTransformIntoVertices();
            cursorMesh.isPickable = false;
            cursorMesh.isVisible = false;
            let targetMat = new StandardMaterial("targetMat", scene);
            targetMat.specularColor = Color3.Black();
            targetMat.emissiveColor = new Color3(0.7, 0.7, 0.7);
            targetMat.backFaceCulling = false;
            cursorMesh.material = targetMat;

            let renderObserver = scene.onBeforeRenderObservable.add(() => {
                // Every frame check collisions/input
                controller.getWorldPointerRayToRef(this._tmpRay);
                let pick = scene.pickWithRay(this._tmpRay);
                if (pick) {
                    if (controller.inputSource.gamepad && controller.inputSource.gamepad.buttons[0] && controller.inputSource.gamepad.buttons[0].value > 0.7) {
                        if (!triggerDown) {
                            scene.simulatePointerDown(pick, { pointerId: id });
                        }
                        triggerDown = true;
                    }else {
                        if (triggerDown) {
                            scene.simulatePointerUp(pick, { pointerId: id });
                        }
                        triggerDown = false;
                    }
                    scene.simulatePointerMove(pick, { pointerId: id });
                }

                if (pick && pick.pickedPoint && pick.hit) {
                    // Update laser state
                    this._updatePointerDistance(laserPointer, pick.distance);

                    // Update cursor state
                    cursorMesh.position.copyFrom(pick.pickedPoint);
                    cursorMesh.scaling.x = Math.sqrt(pick.distance);
                    cursorMesh.scaling.y = Math.sqrt(pick.distance);
                    cursorMesh.scaling.z = Math.sqrt(pick.distance);

                    // To avoid z-fighting
                    let pickNormal = this._convertNormalToDirectionOfRay(pick.getNormal(), this._tmpRay);
                    let deltaFighting = 0.002;
                    cursorMesh.position.copyFrom(pick.pickedPoint);
                    if (pickNormal) {
                        let axis1 = Vector3.Cross(Axis.Y, pickNormal);
                        let axis2 = Vector3.Cross(pickNormal, axis1);
                        Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, cursorMesh.rotation);
                        cursorMesh.position.addInPlace(pickNormal.scale(deltaFighting));
                    }
                    cursorMesh.isVisible = true;
                }else {
                    cursorMesh.isVisible = false;
                }
            });

            controller.onDisposeObservable.addOnce(() => {
                laserPointer.dispose();
                cursorMesh.dispose();

                scene.onBeforeRenderObservable.remove(renderObserver);
            });
        });
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

    private _updatePointerDistance(_laserPointer: Mesh, distance: number = 100) {
        _laserPointer.scaling.y = distance;
        _laserPointer.position.z = distance / 2;
    }
}
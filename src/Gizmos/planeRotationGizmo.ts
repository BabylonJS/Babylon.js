import { Color3 } from "../Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import "../Meshes/Builders/linesBuilder";
import { Mesh } from "../Meshes/mesh";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { Nullable } from "../types";
import { DraggableGizmo } from "./draggableGizmo";
import { RotationGizmo } from "./rotationGizmo";

/**
 * Single plane rotation gizmo
 */
export class PlaneRotationGizmo extends DraggableGizmo {
    /**
     * Creates a PlaneRotationGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param dragPlaneNormal The normal of the plane which the gizmo will be able to rotate on
     * @param color The color of the gizmo
     * @param tessellation Amount of tessellation to be used when creating rotation circles
     * @param useEulerRotation Use and update Euler angle instead of quaternion
     */
    constructor(dragPlaneNormal: Vector3, color: Color3 = Color3.Gray(), gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, tessellation = 32, parent: Nullable<RotationGizmo> = null, useEulerRotation = false) {
        super({ dragPlaneNormal }, color, gizmoLayer, parent);

        // Build mesh on root node
        var parentMesh = new AbstractMesh("", gizmoLayer.utilityLayerScene);

        let drag = Mesh.CreateTorus("", 0.6, 0.03, tessellation, gizmoLayer.utilityLayerScene);
        drag.visibility = 0;
        let rotationMesh = Mesh.CreateTorus("", 0.6, 0.005, tessellation, gizmoLayer.utilityLayerScene);

        // Position arrow pointing in its drag axis
        rotationMesh.rotation.x = Math.PI / 2;
        drag.rotation.x = Math.PI / 2;
        parentMesh.addChild(rotationMesh);
        parentMesh.addChild(drag);
        parentMesh.lookAt(this._rootMesh.position.add(dragPlaneNormal));

        this._rootMesh.addChild(parentMesh);
        parentMesh.scaling.scaleInPlace(1 / 3);

        this.dragBehavior.maxDragAngle = (Math.PI * 9) / 20;
        this.dragBehavior._useAlternatePickedPointAboveMaxDragAngle = true;

        var lastDragPosition = new Vector3();
        this.dragBehavior.onDragStartObservable.add((e) => {
            if (this.attachedMesh) {
                lastDragPosition.copyFrom(e.dragPlanePoint);
            }
        });

        this._materialSwitcher.registerMeshes(
            this._rootMesh.getChildMeshes(false)
        );

        var rotationMatrix = new Matrix();
        var planeNormalTowardsCamera = new Vector3();
        var localPlaneNormalTowardsCamera = new Vector3();

        var tmpSnapEvent = { snapDistance: 0 };
        var currentSnapDragDistance = 0;
        var tmpMatrix = new Matrix();
        var tmpVector = new Vector3();
        var amountToRotate = new Quaternion();

        this.dragBehavior.onDragObservable.add((event) => {
            if (this.attachedMesh) {
                if (!this.attachedMesh.rotationQuaternion || useEulerRotation) {
                    this.attachedMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.attachedMesh.rotation.y, this.attachedMesh.rotation.x, this.attachedMesh.rotation.z);
                }

                // Remove parent priort to rotating
                var attachedMeshParent = this.attachedMesh.parent;
                if (attachedMeshParent) {
                    this.attachedMesh.setParent(null);
                }

                // Calc angle over full 360 degree (https://stackoverflow.com/questions/43493711/the-angle-between-two-3d-vectors-with-a-result-range-0-360)
                var newVector = event.dragPlanePoint.subtract(this.attachedMesh.absolutePosition).normalize();
                var originalVector = lastDragPosition.subtract(this.attachedMesh.absolutePosition).normalize();
                var cross = Vector3.Cross(newVector, originalVector);
                var dot = Vector3.Dot(newVector, originalVector);
                var angle = Math.atan2(cross.length(), dot);
                planeNormalTowardsCamera.copyFrom(dragPlaneNormal);
                localPlaneNormalTowardsCamera.copyFrom(dragPlaneNormal);
                if (this.updateGizmoRotationToMatchAttachedMesh) {
                    this.attachedMesh.rotationQuaternion.toRotationMatrix(rotationMatrix);
                    localPlaneNormalTowardsCamera = Vector3.TransformCoordinates(planeNormalTowardsCamera, rotationMatrix);
                }
                // Flip up vector depending on which side the camera is on
                if (gizmoLayer.utilityLayerScene.activeCamera) {
                    var camVec = gizmoLayer.utilityLayerScene.activeCamera.position.subtract(this.attachedMesh.position);
                    if (Vector3.Dot(camVec, localPlaneNormalTowardsCamera) > 0) {
                        planeNormalTowardsCamera.scaleInPlace(-1);
                        localPlaneNormalTowardsCamera.scaleInPlace(-1);
                    }
                }
                var halfCircleSide = Vector3.Dot(localPlaneNormalTowardsCamera, cross) > 0.0;
                if (halfCircleSide) { angle = -angle; }

                // Snapping logic
                var snapped = false;
                if (this.snapDistance != 0) {
                    currentSnapDragDistance += angle;
                    if (Math.abs(currentSnapDragDistance) > this.snapDistance) {
                        var dragSteps = Math.floor(Math.abs(currentSnapDragDistance) / this.snapDistance);
                        if (currentSnapDragDistance < 0) {
                            dragSteps *= -1;
                        }
                        currentSnapDragDistance = currentSnapDragDistance % this.snapDistance;
                        angle = this.snapDistance * dragSteps;
                        snapped = true;
                    } else {
                        angle = 0;
                    }
                }

                // If the mesh has a parent, convert needed world rotation to local rotation
                tmpMatrix.reset();
                if (this.attachedMesh.parent) {
                    this.attachedMesh.parent.computeWorldMatrix().invertToRef(tmpMatrix);
                    tmpMatrix.getRotationMatrixToRef(tmpMatrix);
                    Vector3.TransformCoordinatesToRef(planeNormalTowardsCamera, tmpMatrix, planeNormalTowardsCamera);
                }

                // Convert angle and axis to quaternion (http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm)
                var quaternionCoefficient = Math.sin(angle / 2);
                amountToRotate.set(planeNormalTowardsCamera.x * quaternionCoefficient, planeNormalTowardsCamera.y * quaternionCoefficient, planeNormalTowardsCamera.z * quaternionCoefficient, Math.cos(angle / 2));

                // If the meshes local scale is inverted (eg. loaded gltf file parent with z scale of -1) the rotation needs to be inverted on the y axis
                if (tmpMatrix.determinant() > 0) {
                    amountToRotate.toEulerAnglesToRef(tmpVector);
                    Quaternion.RotationYawPitchRollToRef(tmpVector.y, -tmpVector.x, -tmpVector.z, amountToRotate);
                }

                if (this.updateGizmoRotationToMatchAttachedMesh) {
                    // Rotate selected mesh quaternion over fixed axis
                    this.attachedMesh.rotationQuaternion.multiplyToRef(amountToRotate, this.attachedMesh.rotationQuaternion);
                } else {
                    // Rotate selected mesh quaternion over rotated axis
                    amountToRotate.multiplyToRef(this.attachedMesh.rotationQuaternion, this.attachedMesh.rotationQuaternion);
                }

                if (useEulerRotation) {
                    this.attachedMesh.rotationQuaternion.toEulerAnglesToRef(tmpVector);
                    this.attachedMesh.rotationQuaternion = null;
                    this.attachedMesh.rotation.copyFrom(tmpVector);
                }

                lastDragPosition.copyFrom(event.dragPlanePoint);
                if (snapped) {
                    tmpSnapEvent.snapDistance = angle;
                    this.onSnapObservable.notifyObservers(tmpSnapEvent);
                }

                // Restore parent
                if (attachedMeshParent) {
                    this.attachedMesh.setParent(attachedMeshParent);
                }
            }
        });
    }
}

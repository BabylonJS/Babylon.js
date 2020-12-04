import { Observer, Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { PointerInfo } from "../Events/pointerEvents";
import { Quaternion, Matrix, Vector3 } from "../Maths/math.vector";
import { Color3 } from '../Maths/math.color';
import "../Meshes/Builders/linesBuilder";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { LinesMesh } from '../Meshes/linesMesh';
import { Mesh } from "../Meshes/mesh";
import { Node } from "../node";
import { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import { Gizmo, GizmoAxisCache } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { StandardMaterial } from "../Materials/standardMaterial";
import { RotationGizmo } from "./rotationGizmo";

/**
 * Single plane rotation gizmo
 */
export class PlaneRotationGizmo extends Gizmo {
    /**
     * Drag behavior responsible for the gizmos dragging interactions
     */
    public dragBehavior: PointerDragBehavior;
    private _pointerObserver: Nullable<Observer<PointerInfo>> = null;

    /**
     * Rotation distance in radians that the gizmo will snap to (Default: 0)
     */
    public snapDistance = 0;
    /**
     * Event that fires each time the gizmo snaps to a new location.
     * * snapDistance is the the change in distance
     */
    public onSnapObservable = new Observable<{ snapDistance: number }>();

    private _isEnabled: boolean = true;
    private _parent: Nullable<RotationGizmo> = null;
    private _coloredMaterial: StandardMaterial;
    private _hoverMaterial: StandardMaterial;
    private _disableMaterial: StandardMaterial;
    private _gizmoMesh: Mesh;
    private _rotationCircle: Mesh;
    private _dragging: boolean = false;

    private static _CircleConstants = {
        radius: 0.3,
        pi2: Math.PI * 2,
        tessellation: 70,
        rotationCircleRange: 4
    };

    /**
     * Creates a PlaneRotationGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param planeNormal The normal of the plane which the gizmo will be able to rotate on
     * @param color The color of the gizmo
     * @param tessellation Amount of tessellation to be used when creating rotation circles
     * @param useEulerRotation Use and update Euler angle instead of quaternion
     * @param thickness display gizmo axis thickness
     */
    constructor(planeNormal: Vector3, color: Color3 = Color3.Gray(), gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, tessellation = 32, parent: Nullable<RotationGizmo> = null, useEulerRotation = false, thickness: number = 1) {
        super(gizmoLayer);
        this._parent = parent;
        // Create Material
        this._coloredMaterial = new StandardMaterial("", gizmoLayer.utilityLayerScene);
        this._coloredMaterial.diffuseColor = color;
        this._coloredMaterial.specularColor = color.subtract(new Color3(0.1, 0.1, 0.1));

        this._hoverMaterial = new StandardMaterial("", gizmoLayer.utilityLayerScene);
        this._hoverMaterial.diffuseColor = Color3.Yellow();

        this._disableMaterial = new StandardMaterial("", gizmoLayer.utilityLayerScene);
        this._disableMaterial.diffuseColor = Color3.Gray();
        this._disableMaterial.alpha = 0.4;

        // Build mesh on root node
        this._gizmoMesh = new Mesh("", gizmoLayer.utilityLayerScene);
        const { rotationMesh, collider } = this._createGizmoMesh(this._gizmoMesh, thickness, tessellation);

        // Setup Rotation Circle
        const rotationCirclePaths: any[] = [];
        this._rotationCircle = this.setupRotationCircle(rotationCirclePaths, this._gizmoMesh);

        this._gizmoMesh.lookAt(this._rootMesh.position.add(planeNormal));
        this._rootMesh.addChild(this._gizmoMesh);
        this._gizmoMesh.scaling.scaleInPlace(1 / 3);
        // Add drag behavior to handle events when the gizmo is dragged
        this.dragBehavior = new PointerDragBehavior({ dragPlaneNormal: planeNormal });
        this.dragBehavior.moveAttached = false;
        this.dragBehavior.maxDragAngle = Math.PI * 9 / 20;
        this.dragBehavior._useAlternatePickedPointAboveMaxDragAngle = true;
        this._rootMesh.addBehavior(this.dragBehavior);

        // Closures for drag logic
        let dragDistance = 0;
        const lastDragPosition = new Vector3();
        let dragPlanePoint = new Vector3();
        const rotationMatrix = new Matrix();
        const planeNormalTowardsCamera = new Vector3();
        let localPlaneNormalTowardsCamera = new Vector3();

        this.dragBehavior.onDragStartObservable.add((e) => {
            if (this.attachedNode) {
                lastDragPosition.copyFrom(e.dragPlanePoint);

                // This is for instantiation location of rotation circle
                const forward = new Vector3(0, 0, 1);
                const direction = this._rotationCircle.getDirection(forward);
                direction.normalize();

                // Remove Rotation Circle from parent mesh before drag interaction
                this._gizmoMesh.removeChild(this._rotationCircle);

                lastDragPosition.copyFrom(e.dragPlanePoint);
                dragPlanePoint = e.dragPlanePoint;
                const origin = this._rotationCircle.getAbsolutePosition().clone();
                const originalRotationPoint = this._rotationCircle.getAbsolutePosition().clone().addInPlace(direction);
                const dragStartPoint = e.dragPlanePoint;
                const angle = Vector3.GetAngleBetweenVectors(originalRotationPoint.subtract(origin), dragStartPoint.subtract(origin), this._rotationCircle.up);

                this._rotationCircle.addRotation(0, angle, 0);
                this._dragging = true;
            }
        });

        this.dragBehavior.onDragEndObservable.add(() => {
            dragDistance = 0;
            this.updateRotationCircle(this._rotationCircle, rotationCirclePaths, dragDistance, dragPlanePoint);
            this._gizmoMesh.addChild(this._rotationCircle);    // Add rotation circle back to parent mesh after drag behavior
            this._dragging = false;
        });

        var tmpSnapEvent = { snapDistance: 0 };
        var currentSnapDragDistance = 0;
        var tmpMatrix = new Matrix();
        var amountToRotate = new Quaternion();
        this.dragBehavior.onDragObservable.add((event) => {
            if (this.attachedNode) {
                // Calc angle over full 360 degree (https://stackoverflow.com/questions/43493711/the-angle-between-two-3d-vectors-with-a-result-range-0-360)
                var nodeScale = new Vector3(1, 1, 1);
                var nodeQuaternion = new Quaternion(0, 0, 0, 1);
                var nodeTranslation = new Vector3(0, 0, 0);
                this.attachedNode.getWorldMatrix().decompose(nodeScale, nodeQuaternion, nodeTranslation);

                var newVector = event.dragPlanePoint.subtract(nodeTranslation).normalize();
                var originalVector = lastDragPosition.subtract(nodeTranslation).normalize();
                var cross = Vector3.Cross(newVector, originalVector);
                var dot = Vector3.Dot(newVector, originalVector);
                var angle = Math.atan2(cross.length(), dot);
                planeNormalTowardsCamera.copyFrom(planeNormal);
                localPlaneNormalTowardsCamera.copyFrom(planeNormal);
                if (this.updateGizmoRotationToMatchAttachedMesh) {
                    nodeQuaternion.toRotationMatrix(rotationMatrix);
                    localPlaneNormalTowardsCamera = Vector3.TransformCoordinates(planeNormalTowardsCamera, rotationMatrix);
                }
                // Flip up vector depending on which side the camera is on
                let cameraFlipped = false;
                if (gizmoLayer.utilityLayerScene.activeCamera) {
                    var camVec = gizmoLayer.utilityLayerScene.activeCamera.position.subtract(nodeTranslation);
                    if (Vector3.Dot(camVec, localPlaneNormalTowardsCamera) > 0) {
                        planeNormalTowardsCamera.scaleInPlace(-1);
                        localPlaneNormalTowardsCamera.scaleInPlace(-1);
                        cameraFlipped = true;
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

                dragDistance += cameraFlipped ? -angle : angle;
                this.updateRotationCircle(this._rotationCircle, rotationCirclePaths, dragDistance, dragPlanePoint);

                // Convert angle and axis to quaternion (http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm)
                var quaternionCoefficient = Math.sin(angle / 2);
                amountToRotate.set(planeNormalTowardsCamera.x * quaternionCoefficient, planeNormalTowardsCamera.y * quaternionCoefficient, planeNormalTowardsCamera.z * quaternionCoefficient, Math.cos(angle / 2));

                // If the meshes local scale is inverted (eg. loaded gltf file parent with z scale of -1) the rotation needs to be inverted on the y axis
                if (tmpMatrix.determinant() > 0) {
                    var tmpVector = new Vector3();
                    amountToRotate.toEulerAnglesToRef(tmpVector);
                    Quaternion.RotationYawPitchRollToRef(tmpVector.y, -tmpVector.x, -tmpVector.z, amountToRotate);
                }

                if (this.updateGizmoRotationToMatchAttachedMesh) {
                    // Rotate selected mesh quaternion over fixed axis
                    nodeQuaternion.multiplyToRef(amountToRotate, nodeQuaternion);
                } else {
                    // Rotate selected mesh quaternion over rotated axis
                    amountToRotate.multiplyToRef(nodeQuaternion, nodeQuaternion);
                }

                // recompose matrix
                this.attachedNode.getWorldMatrix().copyFrom(Matrix.Compose(nodeScale, nodeQuaternion, nodeTranslation));

                lastDragPosition.copyFrom(event.dragPlanePoint);
                if (snapped) {
                    tmpSnapEvent.snapDistance = angle;
                    this.onSnapObservable.notifyObservers(tmpSnapEvent);
                }

                this._matrixChanged();
            }
        });

        var light = gizmoLayer._getSharedGizmoLight();
        light.includedOnlyMeshes = light.includedOnlyMeshes.concat(this._rootMesh.getChildMeshes(false));

        const cache: GizmoAxisCache = {
            colliderMeshes: [ collider ],
            gizmoMeshes: [ rotationMesh ],
            material: this._coloredMaterial,
            hoverMaterial: this._hoverMaterial,
            disableMaterial: this._disableMaterial,
            active: false
        };
        this._parent?.addToAxisCache(this._gizmoMesh, cache);

        this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo) => {
            if (this._customMeshSet) {
                return;
            }
            this._isHovered = !!(cache.colliderMeshes.indexOf(<Mesh>pointerInfo?.pickInfo?.pickedMesh) != -1);
            if (!this._parent) {
                var material = this._isHovered || this._dragging ? this._hoverMaterial : this._coloredMaterial;
                cache.gizmoMeshes.forEach((m: Mesh) => {
                    m.material = material;
                    if ((<LinesMesh>m).color) {
                        (<LinesMesh>m).color = material.diffuseColor;
                    }
                });
            }
        });
    }

    /** Create Geometry for Gizmo */
    private _createGizmoMesh(parentMesh: AbstractMesh, thickness: number, tessellation: number) {
        let collider = Mesh.CreateTorus("ignore", 0.6, 0.03 * thickness, tessellation, this.gizmoLayer.utilityLayerScene);
        collider.visibility = 0;
        let rotationMesh = Mesh.CreateTorus("", 0.6, 0.005 * thickness, tessellation, this.gizmoLayer.utilityLayerScene);
        rotationMesh.material = this._coloredMaterial;

        // Position arrow pointing in its drag axis
        rotationMesh.rotation.x = Math.PI / 2;
        collider.rotation.x = Math.PI / 2;

        parentMesh.addChild(rotationMesh);
        parentMesh.addChild(collider);
        return { rotationMesh, collider };
    }

    protected _attachedNodeChanged(value: Nullable<Node>) {
        if (this.dragBehavior) {
            this.dragBehavior.enabled = value ? true : false;
        }
    }

    private setupRotationCircle(paths: Vector3[][], parentMesh: AbstractMesh): Mesh {
        const fillRadians = 0;
        const step = PlaneRotationGizmo._CircleConstants.pi2 / PlaneRotationGizmo._CircleConstants.tessellation;
        for (let p = -Math.PI / 2; p < Math.PI / 2 - 1.5; p += step / 2) {
            const path: Vector3[] = [];
            for (let i = 0; i < PlaneRotationGizmo._CircleConstants.pi2 * PlaneRotationGizmo._CircleConstants.rotationCircleRange + 0.01; i += step) {
                if (i < fillRadians) {
                    const x = PlaneRotationGizmo._CircleConstants.radius * Math.sin(i) * Math.cos(p);
                    const z = PlaneRotationGizmo._CircleConstants.radius * Math.cos(i) * Math.cos(p);
                    const y = 0;
                    path.push(new Vector3(x, y, z));
                } else {
                    path.push(new Vector3(0, 0, 0));
                }
            }

            paths.push(path);
        }

        const mat = new StandardMaterial("", this.gizmoLayer.utilityLayerScene);
        mat.diffuseColor = Color3.Yellow();
        mat.backFaceCulling = false;
        const mesh = Mesh.CreateRibbon("rotationCircle", paths, false, false, 0, this.gizmoLayer.utilityLayerScene, true);
        mesh.material = mat;
        mesh.material.alpha = .25;
        mesh.rotation.x = Math.PI / 2;
        parentMesh.addChild(mesh);
        return mesh;
    }

    private updateRotationPath(pathArr: Vector3[][], newFill: number): void {
        // To update the Ribbon, you have to mutate the pathArray in-place
        const step = PlaneRotationGizmo._CircleConstants.pi2 / PlaneRotationGizmo._CircleConstants.tessellation;
        let tessellationCounter = 0;
        for (let p = -Math.PI / 2; p < Math.PI / 2 - 1.5; p += step / 2) {
            const path = pathArr[tessellationCounter];
            if (path) {
                let radianCounter = 0;
                for (let i = 0; i < PlaneRotationGizmo._CircleConstants.pi2 * PlaneRotationGizmo._CircleConstants.rotationCircleRange + 0.01; i += step) {
                    if (path[radianCounter]) {
                        if (i < Math.abs(newFill)) {
                            const absI = (newFill > 0) ? i : i * -1;
                            const absP = (newFill > 0) ? p : p * -1;
                            path[radianCounter].set(
                                PlaneRotationGizmo._CircleConstants.radius * Math.sin(absI) * Math.cos(absP),
                                0,
                                PlaneRotationGizmo._CircleConstants.radius * Math.cos(absI) * Math.cos(absP)
                            );
                        } else {
                            path[radianCounter].set(0, 0, 0);
                        }
                    }

                    radianCounter++;
                }
            }

            tessellationCounter ++;
        }
    }

    private updateRotationCircle(mesh: Mesh, paths: any[], newFill: number, dragPlanePoint: Vector3): void {
        this.updateRotationPath(paths, newFill);
        Mesh.CreateRibbon("rotationCircle", paths, false, false, 0, this.gizmoLayer.utilityLayerScene, undefined, undefined, mesh.geometry ? mesh : undefined);
    }

    /**
         * If the gizmo is enabled
         */
    public set isEnabled(value: boolean) {
        this._isEnabled = value;
        if (!value) {
            this.attachedMesh = null;
        }
        else {
            if (this._parent) {
                this.attachedMesh = this._parent.attachedMesh;
            }
        }
    }
    public get isEnabled(): boolean {
        return this._isEnabled;
    }
    /**
     * Disposes of the gizmo
     */
    public dispose() {
        this.onSnapObservable.clear();
        this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
        this.dragBehavior.detach();
        if (this._gizmoMesh) {
            this._gizmoMesh.dispose();
        }
        if (this._rotationCircle) {
            this._rotationCircle.dispose();
        }
        [this._coloredMaterial, this._hoverMaterial, this._disableMaterial].forEach((matl) => {
            if (matl) {
                matl.dispose();
            }
        });
        super.dispose();
    }
}
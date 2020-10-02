import { Observer, Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { PointerInfo } from "../Events/pointerEvents";
import { Quaternion, Matrix, Vector3 } from "../Maths/math.vector";
import { Color3 } from '../Maths/math.color';
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Node } from "../node";
import { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import { Gizmo } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { StandardMaterial } from "../Materials/standardMaterial";
import { RotationGizmo } from "./rotationGizmo";
import { Angle } from '../Maths/math.path';
import { LinesMesh } from 'Meshes/linesMesh';

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

    private circleConstants = {
        radius: 0.3,
        pi2: Math.PI * 2,
        tessellation: 360
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
        this._createGizmoMesh(this._gizmoMesh, thickness, tessellation);

        // Axis Gizmo Closures
        let dragDistance = 0;
        const rotationCirclePaths: any[] = [];
        const rotationCircle: Mesh = this.setupRotationCircle(rotationCirclePaths, this._gizmoMesh);

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
        const lastDragPosition = new Vector3();
        let dragPlanePoint = new Vector3();
        const rotationMatrix = new Matrix();
        const planeNormalTowardsCamera = new Vector3();
        let localPlaneNormalTowardsCamera = new Vector3();

        this.dragBehavior.onDragStartObservable.add((e) => {
            if (this.attachedNode) {
                lastDragPosition.copyFrom(e.dragPlanePoint);

                // This is for instantiation location of rotation circle
                // Rotation Circle Forward Vector
                const forward = new Vector3(0, 0, 1);		
                const direction = rotationCircle.getDirection(forward);
                direction.normalize();

                // Remove Rotation Circle from parent mesh before drag interaction
                this._gizmoMesh.removeChild(rotationCircle);
                
                lastDragPosition.copyFrom(e.dragPlanePoint);
                dragPlanePoint = e.dragPlanePoint;
                const origin = rotationCircle.getAbsolutePosition().clone();
                const originalRotationVector = rotationCircle.getAbsolutePosition().clone().addInPlace(direction);
                const dragStartVector = e.dragPlanePoint;
                let angle = this.angleBetween3DCoords(origin, originalRotationVector, dragStartVector);

                if (Vector3.Dot(rotationCircle.up, Vector3.Down()) > 0) {
                    angle = -angle;
                }

                rotationCircle.addRotation(0, angle, 0);
            }
        });

        this.dragBehavior.onDragEndObservable.add(() => {
            dragDistance = 0;
            this.updateRotationCircle(rotationCircle, rotationCirclePaths, dragDistance, dragPlanePoint);
            this._gizmoMesh.addChild(rotationCircle);    // Add rotation circle back to parent mesh after drag behavior
        });

        // var rotationMatrix = new Matrix();
        // var planeNormalTowardsCamera = new Vector3();
        // var localPlaneNormalTowardsCamera = new Vector3();

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

                dragDistance += cameraFlipped ? -angle: angle;
                this.updateRotationCircle(rotationCircle, rotationCirclePaths, dragDistance, dragPlanePoint);

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

        this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo) => {
            if (this._customMeshSet) {
                return;
            }
            this._isHovered = !!(pointerInfo.pickInfo && (this._rootMesh.getChildMeshes().indexOf(<Mesh>pointerInfo.pickInfo.pickedMesh) != -1));
            if (!this._parent) {
                var material = this._isHovered ? this._hoverMaterial : this._coloredMaterial;
                this._rootMesh.getChildMeshes().forEach((m) => {
                    m.material = material;
                    if ((<LinesMesh>m).color) {
                        (<LinesMesh>m).color = material.diffuseColor;
                    }
                });
            }
        });

        var light = gizmoLayer._getSharedGizmoLight();
        light.includedOnlyMeshes = light.includedOnlyMeshes.concat(this._rootMesh.getChildMeshes(false));

        const cache: any = {
            material: this._coloredMaterial,
            hoverMaterial: this._hoverMaterial,
            disableMaterial: this._disableMaterial,
            active: false
        };
        this._parent?.addToAxisCache(this._gizmoMesh, cache);
    }

    private _createGizmoMesh(parentMesh: AbstractMesh, thickness: number, tessellation: number){
        let drag = Mesh.CreateTorus("ignore", 0.6, 0.03 * thickness, tessellation, this.gizmoLayer.utilityLayerScene);
        drag.visibility = 0;
        let rotationMesh = Mesh.CreateTorus("", 0.6, 0.005 * thickness, tessellation, this.gizmoLayer.utilityLayerScene);
        rotationMesh.material = this._coloredMaterial;

        // Position arrow pointing in its drag axis
        rotationMesh.rotation.x = Math.PI / 2;
        drag.rotation.x = Math.PI / 2;

        parentMesh.addChild(rotationMesh);
        parentMesh.addChild(drag);
    }

    protected _attachedNodeChanged(value: Nullable<Node>) {
        if (this.dragBehavior) {
            this.dragBehavior.enabled = value ? true : false;
        }
    }

    private angleBetween3DCoords(origin: Vector3, coord1: Vector3, coord2: Vector3): number {
        // The dot product of vectors v1 & v2 is a function of the cosine of the angle between them scaled by the product of their magnitudes.
        const v1 = new Vector3(coord1.x - origin.x, coord1.y - origin.y, coord1.z - origin.z);
        const v2 = new Vector3(coord2.x - origin.x, coord2.y - origin.y, coord2.z - origin.z);

        // Normalize v1
        const v1mag = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
        const v1norm = new Vector3(v1.x / v1mag, v1.y / v1mag, v1.z / v1mag);

        // Normalize v2
        const v2mag = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
        const v2norm = new Vector3(v2.x / v2mag, v2.y / v2mag, v2.z / v2mag);

        // Calculate the dot products of vectors v1 and v2
        const dotProducts = v1norm.x * v2norm.x + v1norm.y * v2norm.y + v1norm.z * v2norm.z;
        const cross = Vector3.Cross(v1norm as any, v2norm as any);

        // Extract the angle from the dot products
        let angle = (Math.acos(dotProducts) * 180.0) / Math.PI;
        angle = Math.round(angle * 1000) / 1000;
        angle = Angle.FromDegrees(angle).radians();

        // Flip if its cross has negitive y orientation
        if (cross.y < 0) { angle = -angle; }

        return angle;
    }

    private setupRotationCircle(paths: any[], parentMesh: AbstractMesh): Mesh {
        const fillRadians = 0;
        const step = this.circleConstants.pi2 / this.circleConstants.tessellation;
        for (let p = -Math.PI / 2; p < Math.PI / 2 - 1.5; p += step / 2) {
            const path = [];
            for (let i = 0; i < this.circleConstants.pi2; i += step ) {
                if (i < fillRadians) {
                    const x = this.circleConstants.radius * Math.sin(i) * Math.cos(p);
                    const z = this.circleConstants.radius * Math.cos(i) * Math.cos(p);
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
        const mesh = Mesh.CreateRibbon("ignore", paths, false, false, 0, this.gizmoLayer.utilityLayerScene, true);
        mesh.material = mat;
        mesh.material.alpha = .25;
        mesh.rotation.x = Math.PI / 2;
        parentMesh.addChild(mesh);
        return mesh;
    }

    private updateRotationPath(pathArr: any[], newFill: number): void {
        // To update the Ribbon, you have to mutate the pathArray in-place
        const step = this.circleConstants.pi2 / this.circleConstants.tessellation;
        let tessellationCounter = 0;
        for (let p = -Math.PI / 2; p < Math.PI / 2 - 1.5; p += step / 2) {
            const path = pathArr[tessellationCounter];
            if (path) {
                let radianCounter = 0;
                for (let i = 0; i < this.circleConstants.pi2; i += step ) {
                    if (path[radianCounter]) {
                        if (i < Math.abs(newFill)) {
                            const eie = (newFill > 0) ? i : i * -1;
                            const pea = (newFill > 0) ? p : p * -1;
                            path[radianCounter].x = this.circleConstants.radius * Math.sin(eie) * Math.cos(pea);
                            path[radianCounter].z = this.circleConstants.radius * Math.cos(eie) * Math.cos(pea);
                            path[radianCounter].y = 0;
                        } else {
                            path[radianCounter].x = 0;
                            path[radianCounter].y = 0;
                            path[radianCounter].z = 0;
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
        mesh = Mesh.CreateRibbon("ribbon", paths, false, false, 0, this.gizmoLayer.utilityLayerScene, undefined, undefined, mesh);
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
        [this._coloredMaterial, this._hoverMaterial, this._disableMaterial].forEach((matl) => {
            if (matl) {
                matl.dispose();
            }
        });
        super.dispose();
    }
}
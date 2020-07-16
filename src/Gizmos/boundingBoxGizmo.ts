import { Observer, Observable } from "../Misc/observable";
import { Logger } from "../Misc/logger";
import { Nullable } from "../types";
import { PointerInfo } from "../Events/pointerEvents";
import { Scene } from "../scene";
import { Quaternion, Matrix, Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { SphereBuilder } from "../Meshes/Builders/sphereBuilder";
import { BoxBuilder } from "../Meshes/Builders/boxBuilder";
import { LinesBuilder } from "../Meshes/Builders/linesBuilder";
import { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import { Gizmo } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { StandardMaterial } from "../Materials/standardMaterial";
import { PivotTools } from "../Misc/pivotTools";
import { Color3 } from '../Maths/math.color';

import "../Meshes/Builders/boxBuilder";
import { LinesMesh } from '../Meshes/linesMesh';
import { Epsilon } from '../Maths/math.constants';

/**
 * Bounding box gizmo
 */
export class BoundingBoxGizmo extends Gizmo {
    private _lineBoundingBox: AbstractMesh;
    private _rotateSpheresParent: AbstractMesh;
    private _scaleBoxesParent: AbstractMesh;
    private _boundingDimensions = new Vector3(1, 1, 1);
    private _renderObserver: Nullable<Observer<Scene>> = null;
    private _pointerObserver: Nullable<Observer<PointerInfo>> = null;
    private _scaleDragSpeed = 0.2;

    private _tmpQuaternion = new Quaternion();
    private _tmpVector = new Vector3(0, 0, 0);
    private _tmpRotationMatrix = new Matrix();
    /**
     * If child meshes should be ignored when calculating the boudning box. This should be set to true to avoid perf hits with heavily nested meshes (Default: false)
     */
    public ignoreChildren = false;
    /**
     * Returns true if a descendant should be included when computing the bounding box. When null, all descendants are included. If ignoreChildren is set this will be ignored. (Default: null)
     */
    public includeChildPredicate: Nullable<(abstractMesh: AbstractMesh) => boolean> = null;

    /**
     * The size of the rotation spheres attached to the bounding box (Default: 0.1)
     */
    public rotationSphereSize = 0.1;
    /**
     * The size of the scale boxes attached to the bounding box (Default: 0.1)
     */
    public scaleBoxSize = 0.1;
    /**
     * If set, the rotation spheres and scale boxes will increase in size based on the distance away from the camera to have a consistent screen size (Default: false)
     */
    public fixedDragMeshScreenSize = false;

    /**
     * The distance away from the object which the draggable meshes should appear world sized when fixedDragMeshScreenSize is set to true (default: 10)
     */
    public fixedDragMeshScreenSizeDistanceFactor = 10;
    /**
     * Fired when a rotation sphere or scale box is dragged
     */
    public onDragStartObservable = new Observable<{}>();
    /**
     * Fired when a scale box is dragged
     */
    public onScaleBoxDragObservable = new Observable<{}>();
    /**
      * Fired when a scale box drag is ended
     */
    public onScaleBoxDragEndObservable = new Observable<{}>();
    /**
     * Fired when a rotation sphere is dragged
     */
    public onRotationSphereDragObservable = new Observable<{}>();
    /**
     * Fired when a rotation sphere drag is ended
     */
    public onRotationSphereDragEndObservable = new Observable<{}>();
    /**
     * Relative bounding box pivot used when scaling the attached node. When null object with scale from the opposite corner. 0.5,0.5,0.5 for center and 0.5,0,0.5 for bottom (Default: null)
     */
    public scalePivot: Nullable<Vector3> = null;

    /**
     * Mesh used as a pivot to rotate the attached node
     */
    private _anchorMesh: AbstractMesh;

    private _existingMeshScale = new Vector3();

    // Dragging
    private _dragMesh: Nullable<Mesh> = null;
    private pointerDragBehavior = new PointerDragBehavior();

    private coloredMaterial: StandardMaterial;
    private hoverColoredMaterial: StandardMaterial;

    /**
     * Sets the color of the bounding box gizmo
     * @param color the color to set
     */
    public setColor(color: Color3) {
        this.coloredMaterial.emissiveColor = color;
        this.hoverColoredMaterial.emissiveColor = color.clone().add(new Color3(0.3, 0.3, 0.3));
        this._lineBoundingBox.getChildren().forEach((l) => {
            if ((l as LinesMesh).color) {
                (l as LinesMesh).color = color;
            }
        });
    }
    /**
     * Creates an BoundingBoxGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param color The color of the gizmo
     */
    constructor(color: Color3 = Color3.Gray(), gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultKeepDepthUtilityLayer) {
        super(gizmoLayer);

        // Do not update the gizmo's scale so it has a fixed size to the object its attached to
        this.updateScale = false;

        this._anchorMesh = new AbstractMesh("anchor", gizmoLayer.utilityLayerScene);
        // Create Materials
        this.coloredMaterial = new StandardMaterial("", gizmoLayer.utilityLayerScene);
        this.coloredMaterial.disableLighting = true;
        this.hoverColoredMaterial = new StandardMaterial("", gizmoLayer.utilityLayerScene);
        this.hoverColoredMaterial.disableLighting = true;

        // Build bounding box out of lines
        this._lineBoundingBox = new AbstractMesh("", gizmoLayer.utilityLayerScene);
        this._lineBoundingBox.rotationQuaternion = new Quaternion();
        var lines = [];
        lines.push(LinesBuilder.CreateLines("lines", { points: [new Vector3(0, 0, 0), new Vector3(this._boundingDimensions.x, 0, 0)] }, gizmoLayer.utilityLayerScene));
        lines.push(LinesBuilder.CreateLines("lines", { points: [new Vector3(0, 0, 0), new Vector3(0, this._boundingDimensions.y, 0)] }, gizmoLayer.utilityLayerScene));
        lines.push(LinesBuilder.CreateLines("lines", { points: [new Vector3(0, 0, 0), new Vector3(0, 0, this._boundingDimensions.z)] }, gizmoLayer.utilityLayerScene));
        lines.push(LinesBuilder.CreateLines("lines", { points: [new Vector3(this._boundingDimensions.x, 0, 0), new Vector3(this._boundingDimensions.x, this._boundingDimensions.y, 0)] }, gizmoLayer.utilityLayerScene));
        lines.push(LinesBuilder.CreateLines("lines", { points: [new Vector3(this._boundingDimensions.x, 0, 0), new Vector3(this._boundingDimensions.x, 0, this._boundingDimensions.z)] }, gizmoLayer.utilityLayerScene));
        lines.push(LinesBuilder.CreateLines("lines", { points: [new Vector3(0, this._boundingDimensions.y, 0), new Vector3(this._boundingDimensions.x, this._boundingDimensions.y, 0)] }, gizmoLayer.utilityLayerScene));
        lines.push(LinesBuilder.CreateLines("lines", { points: [new Vector3(0, this._boundingDimensions.y, 0), new Vector3(0, this._boundingDimensions.y, this._boundingDimensions.z)] }, gizmoLayer.utilityLayerScene));
        lines.push(LinesBuilder.CreateLines("lines", { points: [new Vector3(0, 0, this._boundingDimensions.z), new Vector3(this._boundingDimensions.x, 0, this._boundingDimensions.z)] }, gizmoLayer.utilityLayerScene));
        lines.push(LinesBuilder.CreateLines("lines", { points: [new Vector3(0, 0, this._boundingDimensions.z), new Vector3(0, this._boundingDimensions.y, this._boundingDimensions.z)] }, gizmoLayer.utilityLayerScene));
        lines.push(LinesBuilder.CreateLines("lines", { points: [new Vector3(this._boundingDimensions.x, this._boundingDimensions.y, this._boundingDimensions.z), new Vector3(0, this._boundingDimensions.y, this._boundingDimensions.z)] }, gizmoLayer.utilityLayerScene));
        lines.push(LinesBuilder.CreateLines("lines", { points: [new Vector3(this._boundingDimensions.x, this._boundingDimensions.y, this._boundingDimensions.z), new Vector3(this._boundingDimensions.x, 0, this._boundingDimensions.z)] }, gizmoLayer.utilityLayerScene));
        lines.push(LinesBuilder.CreateLines("lines", { points: [new Vector3(this._boundingDimensions.x, this._boundingDimensions.y, this._boundingDimensions.z), new Vector3(this._boundingDimensions.x, this._boundingDimensions.y, 0)] }, gizmoLayer.utilityLayerScene));
        lines.forEach((l) => {
            l.color = color;
            l.position.addInPlace(new Vector3(-this._boundingDimensions.x / 2, -this._boundingDimensions.y / 2, -this._boundingDimensions.z / 2));
            l.isPickable = false;
            this._lineBoundingBox.addChild(l);
        });
        this._rootMesh.addChild(this._lineBoundingBox);

        this.setColor(color);

        // Create rotation spheres
        this._rotateSpheresParent = new AbstractMesh("", gizmoLayer.utilityLayerScene);
        this._rotateSpheresParent.rotationQuaternion = new Quaternion();
        for (let i = 0; i < 12; i++) {
            let sphere = SphereBuilder.CreateSphere("", { diameter: 1 }, gizmoLayer.utilityLayerScene);
            sphere.rotationQuaternion = new Quaternion();
            sphere.material = this.coloredMaterial;

            // Drag behavior
            var _dragBehavior = new PointerDragBehavior({});
            _dragBehavior.moveAttached = false;
            _dragBehavior.updateDragPlane = false;
            sphere.addBehavior(_dragBehavior);
            let startingTurnDirection = new Vector3(1, 0, 0);
            let totalTurnAmountOfDrag = 0;
            _dragBehavior.onDragStartObservable.add(() => {
                startingTurnDirection.copyFrom(sphere.forward);
                totalTurnAmountOfDrag = 0;
            });
            _dragBehavior.onDragObservable.add((event) => {
                this.onRotationSphereDragObservable.notifyObservers({});
                if (this.attachedMesh) {
                    var originalParent = this.attachedMesh.parent;
                    if (originalParent && ((originalParent as Mesh).scaling && (originalParent as Mesh).scaling.isNonUniformWithinEpsilon(0.001))) {
                        Logger.Warn("BoundingBoxGizmo controls are not supported on child meshes with non-uniform parent scaling");
                        return;
                    }
                    PivotTools._RemoveAndStorePivotPoint(this.attachedMesh);

                    var worldDragDirection = startingTurnDirection;

                    // Project the world right on to the drag plane
                    var toSub = event.dragPlaneNormal.scale(Vector3.Dot(event.dragPlaneNormal, worldDragDirection));
                    var dragAxis = worldDragDirection.subtract(toSub).normalizeToNew();

                    // project drag delta on to the resulting drag axis and rotate based on that
                    var projectDist = Vector3.Dot(dragAxis, event.delta) < 0 ? Math.abs(event.delta.length()) : -Math.abs(event.delta.length());

                    // Make rotation relative to size of mesh.
                    projectDist = (projectDist / this._boundingDimensions.length()) * this._anchorMesh.scaling.length();

                    // Rotate based on axis
                    if (!this.attachedMesh.rotationQuaternion) {
                        this.attachedMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.attachedMesh.rotation.y, this.attachedMesh.rotation.x, this.attachedMesh.rotation.z);
                    }
                    if (!this._anchorMesh.rotationQuaternion) {
                        this._anchorMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this._anchorMesh.rotation.y, this._anchorMesh.rotation.x, this._anchorMesh.rotation.z);
                    }

                    // Do not allow the object to turn more than a full circle
                    totalTurnAmountOfDrag += projectDist;
                    if (Math.abs(totalTurnAmountOfDrag) <= 2 * Math.PI) {
                        if (i >= 8) {
                            Quaternion.RotationYawPitchRollToRef(0, 0, projectDist, this._tmpQuaternion);
                        } else if (i >= 4) {
                            Quaternion.RotationYawPitchRollToRef(projectDist, 0, 0, this._tmpQuaternion);
                        } else {
                            Quaternion.RotationYawPitchRollToRef(0, projectDist, 0, this._tmpQuaternion);
                        }

                        // Rotate around center of bounding box
                        this._anchorMesh.addChild(this.attachedMesh);
                        this._anchorMesh.rotationQuaternion!.multiplyToRef(this._tmpQuaternion, this._anchorMesh.rotationQuaternion!);
                        this._anchorMesh.removeChild(this.attachedMesh);
                        this.attachedMesh.setParent(originalParent);
                    }
                    this.updateBoundingBox();

                    PivotTools._RestorePivotPoint(this.attachedMesh);
                }
                this._updateDummy();
            });

            // Selection/deselection
            _dragBehavior.onDragStartObservable.add(() => {
                this.onDragStartObservable.notifyObservers({});
                this._selectNode(sphere);
            });
            _dragBehavior.onDragEndObservable.add(() => {
                this.onRotationSphereDragEndObservable.notifyObservers({});
                this._selectNode(null);
                this._updateDummy();
            });

            this._rotateSpheresParent.addChild(sphere);
        }
        this._rootMesh.addChild(this._rotateSpheresParent);

        // Create scale cubes
        this._scaleBoxesParent = new AbstractMesh("", gizmoLayer.utilityLayerScene);
        this._scaleBoxesParent.rotationQuaternion = new Quaternion();
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                for (var k = 0; k < 3; k++) {
                    // create box for relevant axis
                    let zeroAxisCount = ((i === 1) ? 1 : 0) + ((j === 1) ? 1 : 0) + ((k === 1) ? 1 : 0);
                    if (zeroAxisCount === 1 || zeroAxisCount === 3) {
                        continue;
                    }

                    let box = BoxBuilder.CreateBox("", { size: 1 }, gizmoLayer.utilityLayerScene);
                    box.material = this.coloredMaterial;
                    box.metadata = zeroAxisCount === 2; // None homogenous scale handle

                    // Dragging logic
                    let dragAxis = new Vector3(i - 1, j - 1, k - 1);
                    var _dragBehavior = new PointerDragBehavior({ dragAxis: dragAxis });
                    _dragBehavior.moveAttached = false;
                    box.addBehavior(_dragBehavior);
                    _dragBehavior.onDragObservable.add((event) => {
                        this.onScaleBoxDragObservable.notifyObservers({});
                        if (this.attachedMesh) {
                            var originalParent = this.attachedMesh.parent;
                            if (originalParent && ((originalParent as Mesh).scaling && (originalParent as Mesh).scaling.isNonUniformWithinEpsilon(0.001))) {
                                Logger.Warn("BoundingBoxGizmo controls are not supported on child meshes with non-uniform parent scaling");
                                return;
                            }
                            PivotTools._RemoveAndStorePivotPoint(this.attachedMesh);
                            var relativeDragDistance = (event.dragDistance / this._boundingDimensions.length()) * this._anchorMesh.scaling.length();
                            var deltaScale = new Vector3(relativeDragDistance, relativeDragDistance, relativeDragDistance);
                            if (zeroAxisCount === 2) {
                                // scale on 1 axis when using the anchor box in the face middle
                                deltaScale.x *= Math.abs(dragAxis.x);
                                deltaScale.y *= Math.abs(dragAxis.y);
                                deltaScale.z *= Math.abs(dragAxis.z);
                            }
                            deltaScale.scaleInPlace(this._scaleDragSpeed);
                            this.updateBoundingBox();
                            if (this.scalePivot) {
                                this.attachedMesh.getWorldMatrix().getRotationMatrixToRef(this._tmpRotationMatrix);
                                // Move anchor to desired pivot point (Bottom left corner + dimension/2)
                                this._boundingDimensions.scaleToRef(0.5, this._tmpVector);
                                Vector3.TransformCoordinatesToRef(this._tmpVector, this._tmpRotationMatrix, this._tmpVector);
                                this._anchorMesh.position.subtractInPlace(this._tmpVector);
                                this._boundingDimensions.multiplyToRef(this.scalePivot, this._tmpVector);
                                Vector3.TransformCoordinatesToRef(this._tmpVector, this._tmpRotationMatrix, this._tmpVector);
                                this._anchorMesh.position.addInPlace(this._tmpVector);
                            } else {
                                // Scale from the position of the opposite corner
                                box.absolutePosition.subtractToRef(this._anchorMesh.position, this._tmpVector);
                                this._anchorMesh.position.subtractInPlace(this._tmpVector);
                            }

                            this._anchorMesh.addChild(this.attachedMesh);
                            this._anchorMesh.scaling.addInPlace(deltaScale);
                            if (this._anchorMesh.scaling.x < 0 || this._anchorMesh.scaling.y < 0 || this._anchorMesh.scaling.z < 0) {
                                this._anchorMesh.scaling.subtractInPlace(deltaScale);
                            }
                            this._anchorMesh.removeChild(this.attachedMesh);
                            this.attachedMesh.setParent(originalParent);
                            PivotTools._RestorePivotPoint(this.attachedMesh);
                        }
                        this._updateDummy();
                    });

                    // Selection/deselection
                    _dragBehavior.onDragStartObservable.add(() => {
                        this.onDragStartObservable.notifyObservers({});
                        this._selectNode(box);
                    });
                    _dragBehavior.onDragEndObservable.add(() => {
                        this.onScaleBoxDragEndObservable.notifyObservers({});
                        this._selectNode(null);
                        this._updateDummy();
                    });

                    this._scaleBoxesParent.addChild(box);
                }
            }
        }
        this._rootMesh.addChild(this._scaleBoxesParent);

        // Hover color change
        var pointerIds = new Array<AbstractMesh>();
        this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo) => {
            if (!pointerIds[(<PointerEvent>pointerInfo.event).pointerId]) {
                this._rotateSpheresParent.getChildMeshes().concat(this._scaleBoxesParent.getChildMeshes()).forEach((mesh) => {
                    if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh == mesh) {
                        pointerIds[(<PointerEvent>pointerInfo.event).pointerId] = mesh;
                        mesh.material = this.hoverColoredMaterial;
                    }
                });
            } else {
                if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh != pointerIds[(<PointerEvent>pointerInfo.event).pointerId]) {
                    pointerIds[(<PointerEvent>pointerInfo.event).pointerId].material = this.coloredMaterial;
                    delete pointerIds[(<PointerEvent>pointerInfo.event).pointerId];
                }
            }
        });

        // Update bounding box positions
        this._renderObserver = this.gizmoLayer.originalScene.onBeforeRenderObservable.add(() => {
            // Only update the bouding box if scaling has changed
            if (this.attachedMesh && !this._existingMeshScale.equals(this.attachedMesh.scaling)) {
                this.updateBoundingBox();
            } else if (this.fixedDragMeshScreenSize) {
                this._updateRotationSpheres();
                this._updateScaleBoxes();
            }

            // If dragg mesh is enabled and dragging, update the attached mesh pose to match the drag mesh
            if (this._dragMesh && this.attachedMesh && this.pointerDragBehavior.dragging) {
                this._lineBoundingBox.position.rotateByQuaternionToRef(this._rootMesh.rotationQuaternion!, this._tmpVector);
                this.attachedMesh.setAbsolutePosition(this._dragMesh.position.add(this._tmpVector.scale(-1)));
            }
        });
        this.updateBoundingBox();
    }

    protected _attachedNodeChanged(value: Nullable<AbstractMesh>) {
        if (value) {
            // Reset anchor mesh to match attached mesh's scale
            // This is needed to avoid invalid box/sphere position on first drag
            PivotTools._RemoveAndStorePivotPoint(value);
            var originalParent = value.parent;
            this._anchorMesh.addChild(value);
            this._anchorMesh.removeChild(value);
            value.setParent(originalParent);
            PivotTools._RestorePivotPoint(value);
            this.updateBoundingBox();
            value.getChildMeshes(false).forEach((m) => {
                m.markAsDirty("scaling");
            });

            this.gizmoLayer.utilityLayerScene.onAfterRenderObservable.addOnce(() => {
                this._updateDummy();
            });
        }
    }

    private _selectNode(selectedMesh: Nullable<Mesh>) {
        this._rotateSpheresParent.getChildMeshes()
            .concat(this._scaleBoxesParent.getChildMeshes()).forEach((m) => {
                m.isVisible = (!selectedMesh || m == selectedMesh);
            });
    }

    /**
     * Updates the bounding box information for the Gizmo
     */
    public updateBoundingBox() {
        if (this.attachedMesh) {
            PivotTools._RemoveAndStorePivotPoint(this.attachedMesh);

            // Store original parent
            var originalParent = this.attachedMesh.parent;
            this.attachedMesh.setParent(null);

            // Store original skelton override mesh
            var originalSkeletonOverrideMesh = null;
            if (this.attachedMesh.skeleton) {
                originalSkeletonOverrideMesh = this.attachedMesh.skeleton.overrideMesh;
                this.attachedMesh.skeleton.overrideMesh = null;
            }

            this._update();

            // Rotate based on axis
            if (!this.attachedMesh.rotationQuaternion) {
                this.attachedMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.attachedMesh.rotation.y, this.attachedMesh.rotation.x, this.attachedMesh.rotation.z);
            }
            if (!this._anchorMesh.rotationQuaternion) {
                this._anchorMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this._anchorMesh.rotation.y, this._anchorMesh.rotation.x, this._anchorMesh.rotation.z);
            }
            this._anchorMesh.rotationQuaternion.copyFrom(this.attachedMesh.rotationQuaternion);

            // Store original position and reset mesh to origin before computing the bounding box
            this._tmpQuaternion.copyFrom(this.attachedMesh.rotationQuaternion);
            this._tmpVector.copyFrom(this.attachedMesh.position);
            this.attachedMesh.rotationQuaternion.set(0, 0, 0, 1);
            this.attachedMesh.position.set(0, 0, 0);

            // Update bounding dimensions/positions
            var boundingMinMax = this.attachedMesh.getHierarchyBoundingVectors(!this.ignoreChildren, this.includeChildPredicate);
            boundingMinMax.max.subtractToRef(boundingMinMax.min, this._boundingDimensions);

            // Update gizmo to match bounding box scaling and rotation
            // The position set here is the offset from the origin for the boundingbox when the attached mesh is at the origin
            // The position of the gizmo is then set to the attachedMesh in gizmo._update
            this._lineBoundingBox.scaling.copyFrom(this._boundingDimensions);
            this._lineBoundingBox.position.set((boundingMinMax.max.x + boundingMinMax.min.x) / 2, (boundingMinMax.max.y + boundingMinMax.min.y) / 2, (boundingMinMax.max.z + boundingMinMax.min.z) / 2);
            this._rotateSpheresParent.position.copyFrom(this._lineBoundingBox.position);
            this._scaleBoxesParent.position.copyFrom(this._lineBoundingBox.position);
            this._lineBoundingBox.computeWorldMatrix();
            this._anchorMesh.position.copyFrom(this._lineBoundingBox.absolutePosition);

            // Restore position/rotation values
            this.attachedMesh.rotationQuaternion.copyFrom(this._tmpQuaternion);
            this.attachedMesh.position.copyFrom(this._tmpVector);

            // Restore original parent
            this.attachedMesh.setParent(originalParent);

            // Restore original skeleton override mesh
            if (this.attachedMesh.skeleton) {
                this.attachedMesh.skeleton.overrideMesh = originalSkeletonOverrideMesh;
            }
        }

        this._updateRotationSpheres();
        this._updateScaleBoxes();

        if (this.attachedMesh) {
            this._existingMeshScale.copyFrom(this.attachedMesh.scaling);
            PivotTools._RestorePivotPoint(this.attachedMesh);
        }
    }

    private _updateRotationSpheres() {
        var rotateSpheres = this._rotateSpheresParent.getChildMeshes();
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 2; j++) {
                for (var k = 0; k < 2; k++) {
                    var index = ((i * 4) + (j * 2)) + k;
                    if (i == 0) {
                        rotateSpheres[index].position.set(this._boundingDimensions.x / 2, this._boundingDimensions.y * j, this._boundingDimensions.z * k);
                        rotateSpheres[index].position.addInPlace(new Vector3(-this._boundingDimensions.x / 2, -this._boundingDimensions.y / 2, -this._boundingDimensions.z / 2));
                        rotateSpheres[index].lookAt(Vector3.Cross(rotateSpheres[index].position.normalizeToNew(), Vector3.Right()).normalizeToNew().add(rotateSpheres[index].position));
                    }
                    if (i == 1) {
                        rotateSpheres[index].position.set(this._boundingDimensions.x * j, this._boundingDimensions.y / 2, this._boundingDimensions.z * k);
                        rotateSpheres[index].position.addInPlace(new Vector3(-this._boundingDimensions.x / 2, -this._boundingDimensions.y / 2, -this._boundingDimensions.z / 2));
                        rotateSpheres[index].lookAt(Vector3.Cross(rotateSpheres[index].position.normalizeToNew(), Vector3.Up()).normalizeToNew().add(rotateSpheres[index].position));
                    }
                    if (i == 2) {
                        rotateSpheres[index].position.set(this._boundingDimensions.x * j, this._boundingDimensions.y * k, this._boundingDimensions.z / 2);
                        rotateSpheres[index].position.addInPlace(new Vector3(-this._boundingDimensions.x / 2, -this._boundingDimensions.y / 2, -this._boundingDimensions.z / 2));
                        rotateSpheres[index].lookAt(Vector3.Cross(rotateSpheres[index].position.normalizeToNew(), Vector3.Forward()).normalizeToNew().add(rotateSpheres[index].position));
                    }
                    if (this.fixedDragMeshScreenSize && this.gizmoLayer.utilityLayerScene.activeCamera) {
                        rotateSpheres[index].absolutePosition.subtractToRef(this.gizmoLayer.utilityLayerScene.activeCamera.position, this._tmpVector);
                        var distanceFromCamera = this.rotationSphereSize * this._tmpVector.length() / this.fixedDragMeshScreenSizeDistanceFactor;
                        rotateSpheres[index].scaling.set(distanceFromCamera, distanceFromCamera, distanceFromCamera);
                    } else {
                        rotateSpheres[index].scaling.set(this.rotationSphereSize, this.rotationSphereSize, this.rotationSphereSize);
                    }
                }
            }
        }
    }

    private _updateScaleBoxes() {
        var scaleBoxes = this._scaleBoxesParent.getChildMeshes();
        var index = 0;
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                for (var k = 0; k < 3; k++) {
                    let zeroAxisCount = ((i === 1) ? 1 : 0) + ((j === 1) ? 1 : 0) + ((k === 1) ? 1 : 0);
                    if (zeroAxisCount === 1 || zeroAxisCount === 3) {
                        continue;
                    }
                    if (scaleBoxes[index]) {
                        scaleBoxes[index].position.set(this._boundingDimensions.x * (i / 2), this._boundingDimensions.y * (j / 2), this._boundingDimensions.z * (k / 2));
                        scaleBoxes[index].position.addInPlace(new Vector3(-this._boundingDimensions.x / 2, -this._boundingDimensions.y / 2, -this._boundingDimensions.z / 2));
                        if (this.fixedDragMeshScreenSize && this.gizmoLayer.utilityLayerScene.activeCamera) {
                            scaleBoxes[index].absolutePosition.subtractToRef(this.gizmoLayer.utilityLayerScene.activeCamera.position, this._tmpVector);
                            var distanceFromCamera = this.scaleBoxSize * this._tmpVector.length() / this.fixedDragMeshScreenSizeDistanceFactor;
                            scaleBoxes[index].scaling.set(distanceFromCamera, distanceFromCamera, distanceFromCamera);
                        } else {
                            scaleBoxes[index].scaling.set(this.scaleBoxSize, this.scaleBoxSize, this.scaleBoxSize);
                        }
                    }
                    index++;
                }
            }
        }
    }

    /**
     * Enables rotation on the specified axis and disables rotation on the others
     * @param axis The list of axis that should be enabled (eg. "xy" or "xyz")
     */
    public setEnabledRotationAxis(axis: string) {
        this._rotateSpheresParent.getChildMeshes().forEach((m, i) => {
            if (i < 4) {
                m.setEnabled(axis.indexOf("x") != -1);
            } else if (i < 8) {
                m.setEnabled(axis.indexOf("y") != -1);
            } else {
                m.setEnabled(axis.indexOf("z") != -1);
            }
        });
    }

    /**
     * Enables/disables scaling
     * @param enable if scaling should be enabled
     * @param homogeneousScaling defines if scaling should only be homogeneous
     */
    public setEnabledScaling(enable: boolean, homogeneousScaling = false) {
        this._scaleBoxesParent.getChildMeshes().forEach((m, i) => {
            let enableMesh = enable;
            // Disable heterogenous scale handles if requested.
            if (homogeneousScaling && m.metadata === true) {
                enableMesh = false;
            }
            m.setEnabled(enableMesh);
        });
    }

    private _updateDummy() {
        if (this._dragMesh) {
            this._dragMesh.position.copyFrom(this._lineBoundingBox.getAbsolutePosition());
            this._dragMesh.scaling.copyFrom(this._lineBoundingBox.scaling);
            this._dragMesh.rotationQuaternion!.copyFrom(this._rootMesh.rotationQuaternion!);
        }
    }

    /**
     * Enables a pointer drag behavior on the bounding box of the gizmo
     */
    public enableDragBehavior() {
        this._dragMesh = Mesh.CreateBox("dummy", 1, this.gizmoLayer.utilityLayerScene);
        this._dragMesh.visibility = 0;
        this._dragMesh.rotationQuaternion = new Quaternion();
        this.pointerDragBehavior.useObjectOrientationForDragging = false;
        this._dragMesh.addBehavior(this.pointerDragBehavior);
    }

    /**
     * Disposes of the gizmo
     */
    public dispose() {
        this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
        this.gizmoLayer.originalScene.onBeforeRenderObservable.remove(this._renderObserver);
        this._lineBoundingBox.dispose();
        this._rotateSpheresParent.dispose();
        this._scaleBoxesParent.dispose();
        if (this._dragMesh) {
            this._dragMesh.dispose();
        }
        super.dispose();
    }

    /**
     * Makes a mesh not pickable and wraps the mesh inside of a bounding box mesh that is pickable. (This is useful to avoid picking within complex geometry)
     * @param mesh the mesh to wrap in the bounding box mesh and make not pickable
     * @returns the bounding box mesh with the passed in mesh as a child
     */
    public static MakeNotPickableAndWrapInBoundingBox(mesh: Mesh): Mesh {
        var makeNotPickable = (root: AbstractMesh) => {
            root.isPickable = false;
            root.getChildMeshes().forEach((c) => {
                makeNotPickable(c);
            });
        };
        makeNotPickable(mesh);

        // Reset position to get boudning box from origin with no rotation
        if (!mesh.rotationQuaternion) {
            mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
        }
        var oldPos = mesh.position.clone();
        var oldRot = mesh.rotationQuaternion.clone();
        mesh.rotationQuaternion.set(0, 0, 0, 1);
        mesh.position.set(0, 0, 0);

        // Update bounding dimensions/positions
        var box = BoxBuilder.CreateBox("box", { size: 1 }, mesh.getScene());
        var boundingMinMax = mesh.getHierarchyBoundingVectors();
        boundingMinMax.max.subtractToRef(boundingMinMax.min, box.scaling);

        // Adjust scale to avoid undefined behavior when adding child
        if (box.scaling.y === 0) {
            box.scaling.y = Epsilon;
        }
        if (box.scaling.x === 0) {
            box.scaling.x = Epsilon;
        }
        if (box.scaling.z === 0) {
            box.scaling.z = Epsilon;
        }

        box.position.set((boundingMinMax.max.x + boundingMinMax.min.x) / 2, (boundingMinMax.max.y + boundingMinMax.min.y) / 2, (boundingMinMax.max.z + boundingMinMax.min.z) / 2);

        // Restore original positions
        mesh.addChild(box);
        mesh.rotationQuaternion.copyFrom(oldRot);
        mesh.position.copyFrom(oldPos);

        // Reverse parenting
        mesh.removeChild(box);

        box.addChild(mesh);
        box.visibility = 0;
        return box;
    }
    /**
     * CustomMeshes are not supported by this gizmo
     * @param mesh The mesh to replace the default mesh of the gizmo
     */
    public setCustomMesh(mesh: Mesh) {
        Logger.Error("Custom meshes are not supported on this gizmo");
    }
}

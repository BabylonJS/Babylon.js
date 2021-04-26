import { PointerDragBehavior } from "babylonjs/Behaviors/Meshes/pointerDragBehavior";
import { Gizmo } from "babylonjs/Gizmos/gizmo";
import { Quaternion, Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import { AbstractMesh } from "babylonjs/Meshes/index";
import { MeshBuilder } from "babylonjs/Meshes/meshBuilder";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { PivotTools } from "babylonjs/Misc/pivotTools";
import { Node } from "babylonjs/node";
import { UtilityLayerRenderer } from "babylonjs/Rendering/utilityLayerRenderer";
import { Nullable } from "babylonjs/types";
import { HolographicSlate } from "../controls";

export class BoundingBoxGizmo2D extends Gizmo {
    private _boundingDimensions = new Vector3(0, 0, 0);
    private _dragPlaneNormal = new Vector3(0, 0, 1);

    /**
     * Relative bounding box pivot used when scaling the attached node. When null object with scale from the opposite corner. 0.5,0.5,0.5 for center and 0.5,0,0.5 for bottom (Default: null)
     */
    public scalePivot: Nullable<Vector3> = null;

    // Dragging
    // private _dragMesh: Nullable<Mesh> = null;
    // private _pointerDragBehavior = new PointerDragBehavior();
    // private _normalVector: Vector3 = new Vector3(0, 0, 1);

    private _tmpQuaternion = new Quaternion();
    private _tmpVector = new Vector3(0, 0, 0);

    // Ordered bl, br, tr, tl
    private _corners: TransformNode[] = [];
    private _cornersParent: TransformNode;
    // private _sides: TransformNode[] = [];

    /**
     * Value we use to offset handles from mesh
     */
    private _margin = 0.1;

    private _attachedSlate: Nullable<HolographicSlate> = null;
    public set attachedSlate(control: Nullable<HolographicSlate>) {
        this._attachedSlate = control;
        if (control) {
            this.attachedMesh = control.mesh;
        } else {
            this.attachedMesh = null;
        }
    }

    public get attachedSlate(): Nullable<HolographicSlate> {
        return this._attachedSlate;
    }

    constructor(utilityLayer: UtilityLayerRenderer) {
        super(utilityLayer);

        this._createNode();
        this.updateScale = false;
    }

    private _createNode() {
        this._cornersParent = new TransformNode("cornersParent", this.gizmoLayer.utilityLayerScene);
        this._cornersParent.rotationQuaternion = Quaternion.Identity();

        for (let i = 0; i < 4; i++) {
            const node = this._createAngleMesh();
            this._corners.push(node);
            node.rotation.z = (Math.PI / 2) * i;
            node.scaling.copyFromFloats(0.1, 0.1, 0.1);
            node.parent = this._cornersParent;
            this._assignDragBehavior(node);
        }

        this._corners[0].position.copyFromFloats(-1, -1, 0);
        this._corners[1].position.copyFromFloats(1, -1, 0);
        this._corners[2].position.copyFromFloats(1, 1, 0);
        this._corners[3].position.copyFromFloats(-1, 1, 0);
        this._cornersParent.parent = this._rootMesh;
    }

    private _assignDragBehavior(node: Node) {
        // Drag behavior
        var _dragBehavior = new PointerDragBehavior({
            dragPlaneNormal: this._dragPlaneNormal,
        });
        _dragBehavior.moveAttached = false;
        _dragBehavior.updateDragPlane = false;
        node.addBehavior(_dragBehavior);

        let dimensionsStart = new Vector2();
        let dragOrigin = new Vector3();
        _dragBehavior.onDragStartObservable.add((event) => {
            if (this.attachedSlate) {
                dimensionsStart.copyFromFloats(this.attachedSlate.relativeWidth, this.attachedSlate.relativeHeight);
                dragOrigin.copyFrom(event.dragPlanePoint);
            }
        });

        _dragBehavior.onDragObservable.add((event) => {
            if (this.attachedSlate) {
                // Todo : To local
                const offset = event.dragPlanePoint.subtract(dragOrigin);
                const offsetProjected = new Vector2(offset.x, offset.y);
                const newDimensions = dimensionsStart.add(offsetProjected.multiplyByFloats(1 / HolographicSlate._DIMENSIONS.x, 1 / HolographicSlate._DIMENSIONS.y));
                console.log(newDimensions);
                this.attachedSlate.relativeWidth = newDimensions.x;
                this.attachedSlate.relativeHeight = newDimensions.y;
                // project drag delta on to the resulting drag axis and rotate based on that
                // var projectDist = Vector3.Dot(dragAxis, event.delta) < 0 ? Math.abs(event.delta.length()) : -Math.abs(event.delta.length());

                // Make rotation relative to size of mesh.
                // projectDist = (projectDist / this._boundingDimensions.length()) * this._anchorMesh.scaling.length();

                // Do not allow the object to turn more than a full circle
                // totalTurnAmountOfDrag += projectDist;
                // if (Math.abs(totalTurnAmountOfDrag) <= 2 * Math.PI) {
                //     if (i >= 8) {
                //         Quaternion.RotationYawPitchRollToRef(0, 0, projectDist, this._tmpQuaternion);
                //     } else if (i >= 4) {
                //         Quaternion.RotationYawPitchRollToRef(projectDist, 0, 0, this._tmpQuaternion);
                //     } else {
                //         Quaternion.RotationYawPitchRollToRef(0, projectDist, 0, this._tmpQuaternion);
                //     }

                //     // Rotate around center of bounding box
                //     this._anchorMesh.addChild(this.attachedMesh);
                //     this._anchorMesh.rotationQuaternion!.multiplyToRef(this._tmpQuaternion, this._anchorMesh.rotationQuaternion!);
                //     this._anchorMesh.removeChild(this.attachedMesh);
                //     this.attachedMesh.setParent(originalParent);
                // }
                this.updateBoundingBox();
            }
        });
    }

    private _createAngleMesh(): TransformNode {
        // Draw 2 boxes making a bottom left corner
        const horizontalBox = MeshBuilder.CreateBox("angleHor", { width: 3, height: 1, depth: 0.1 }, this.gizmoLayer.utilityLayerScene);
        const verticalBox = MeshBuilder.CreateBox("angleVert", { width: 1, height: 3, depth: 0.1 }, this.gizmoLayer.utilityLayerScene);

        const angleNode = new TransformNode("angle", this.gizmoLayer.utilityLayerScene);
        horizontalBox.parent = angleNode;
        verticalBox.parent = angleNode;

        horizontalBox.position.x = 1;
        verticalBox.position.y = 1;

        return angleNode;
    }

    protected _attachedNodeChanged(value: Nullable<AbstractMesh>) {
        if (value) {
            // Reset anchor mesh to match attached mesh's scale
            // This is needed to avoid invalid box/sphere position on first drag
            // this._anchorMesh.scaling.setAll(1);
            // PivotTools._RemoveAndStorePivotPoint(value);
            // const originalParent = value.parent;
            // this._anchorMesh.addChild(value);
            // this._anchorMesh.removeChild(value);
            // value.setParent(originalParent);
            // PivotTools._RestorePivotPoint(value);
            this.updateBoundingBox();
            // value.getChildMeshes(false).forEach((m) => {
            //     m.markAsDirty("scaling");
            // });

            // this.gizmoLayer.utilityLayerScene.onAfterRenderObservable.addOnce(() => {
            //     this._updateDummy();
            // });
        }
    }

    /**
     * Updates the bounding box information for the Gizmo
     */
    public updateBoundingBox() {
        if (this.attachedMesh) {
            PivotTools._RemoveAndStorePivotPoint(this.attachedMesh);

            // Store original parent
            const originalParent = this.attachedMesh.parent;
            this.attachedMesh.setParent(null);

            this._update();

            // Rotate based on axis
            if (!this.attachedMesh.rotationQuaternion) {
                this.attachedMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.attachedMesh.rotation.y, this.attachedMesh.rotation.x, this.attachedMesh.rotation.z);
            }

            // Store original position and reset mesh to origin before computing the bounding box
            this._tmpQuaternion.copyFrom(this.attachedMesh.rotationQuaternion);
            this._tmpVector.copyFrom(this.attachedMesh.position);
            this.attachedMesh.rotationQuaternion.set(0, 0, 0, 1);
            this.attachedMesh.position.set(0, 0, 0);

            // Update bounding dimensions/positions
            const boundingMinMax = this.attachedMesh.getHierarchyBoundingVectors();
            boundingMinMax.max.subtractToRef(boundingMinMax.min, this._boundingDimensions);
            // Update gizmo to match bounding box scaling and rotation
            // The position set here is the offset from the origin for the boundingbox when the attached mesh is at the origin
            // The position of the gizmo is then set to the attachedMesh in gizmo._update

            boundingMinMax.min.x -= this._margin;
            boundingMinMax.min.y -= this._margin;
            boundingMinMax.max.x += this._margin;
            boundingMinMax.max.y += this._margin;

            this._corners[0].position.copyFromFloats(boundingMinMax.min.x, boundingMinMax.min.y, 0);
            this._corners[1].position.copyFromFloats(boundingMinMax.max.x, boundingMinMax.min.y, 0);
            this._corners[2].position.copyFromFloats(boundingMinMax.max.x, boundingMinMax.max.y, 0);
            this._corners[3].position.copyFromFloats(boundingMinMax.min.x, boundingMinMax.max.y, 0);

            // Restore position/rotation values
            this.attachedMesh.rotationQuaternion.copyFrom(this._tmpQuaternion);
            this.attachedMesh.position.copyFrom(this._tmpVector);

            // Restore original parent
            this.attachedMesh.setParent(originalParent);
        }

        if (this.attachedMesh) {
            PivotTools._RestorePivotPoint(this.attachedMesh);
        }
    }
}

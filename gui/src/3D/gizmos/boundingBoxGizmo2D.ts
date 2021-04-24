import { Gizmo } from "babylonjs/Gizmos/gizmo";
import { Quaternion, Vector3 } from "babylonjs/Maths/math.vector";
import { AbstractMesh } from "babylonjs/Meshes/index";
import { MeshBuilder } from "babylonjs/Meshes/meshBuilder";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { PivotTools } from "babylonjs/Misc/pivotTools";
import { UtilityLayerRenderer } from "babylonjs/Rendering/utilityLayerRenderer";
import { Nullable } from "babylonjs/types";

export class BoundingBoxGizmo2D extends Gizmo {
    private _boundingDimensions = new Vector3(0, 0, 0);

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
     * Percentage of the BB we use to offset handles
     */
    private _relativeGizmoMargin = 0.02;

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
        }

        this._corners[0].position.copyFromFloats(-1, -1, 0);
        this._corners[1].position.copyFromFloats(1, -1, 0);
        this._corners[2].position.copyFromFloats(1, 1, 0);
        this._corners[3].position.copyFromFloats(-1, 1, 0);

        this._cornersParent.parent = this._rootMesh;
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
            const margin = Math.max(this._boundingDimensions.x * this._relativeGizmoMargin, this._boundingDimensions.y * this._relativeGizmoMargin);

            boundingMinMax.min.x -= margin;
            boundingMinMax.min.y -= margin;
            boundingMinMax.max.x += margin;
            boundingMinMax.max.y += margin;

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

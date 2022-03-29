import { Gizmo } from "core/Gizmos/gizmo";
import { Epsilon } from "core/Maths/math.constants";
import { Matrix, Quaternion, TmpVectors, Vector3 } from "core/Maths/math.vector";
import type { Scene } from "core/scene";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { TransformNode } from "core/Meshes/transformNode";
import type { Observer } from "core/Misc/observable";
import { PivotTools } from "core/Misc/pivotTools";
import type { UtilityLayerRenderer } from "core/Rendering/utilityLayerRenderer";
import type { Nullable } from "core/types";

import type { HolographicSlate } from "../controls/holographicSlate";
import type { GizmoHandle } from "./gizmoHandle";
import { CornerHandle, SideHandle } from "./gizmoHandle";

// Mask contains the influence of the drag offset vectors on dimensions or origin of the slate
// Mask vector is multiplied to the offset vector
type HandleMasks = {
    dimensions: Vector3;
    origin: Vector3;
};

/**
 * Gizmo to resize 2D slates
 */
export class SlateGizmo extends Gizmo {
    private _boundingDimensions = new Vector3(0, 0, 0);
    private _pickedPointObserver: Nullable<Observer<Nullable<AbstractMesh>>>;
    private _renderObserver: Nullable<Observer<Scene>> = null;

    private _tmpQuaternion = new Quaternion();
    private _tmpVector = new Vector3(0, 0, 0);

    // Ordered bl, br, tr, tl
    private _corners: CornerHandle[] = [];
    // Ordered left, bottom, right, top
    private _sides: SideHandle[] = [];
    private _handlesParent: TransformNode;
    private _handleHovered: Nullable<GizmoHandle>;
    private _handleDragged: Nullable<GizmoHandle>;

    private _boundingBoxGizmo = {
        min: new Vector3(),
        max: new Vector3(),
    };

    /**
     * Value we use to offset handles from mesh
     */
    private _margin = 0.35;
    private _handleSize = 0.075;
    private _attachedSlate: Nullable<HolographicSlate> = null;
    private _existingSlateScale = new Vector3();
    /**
     * If set, the handles will increase in size based on the distance away from the camera to have a consistent screen size (Default: true)
     */
    public fixedScreenSize = false;
    /**
     * The distance away from the object which the draggable meshes should appear world sized when fixedScreenSize is set to true (default: 10)
     */
    public fixedScreenSizeDistanceFactor = 10;

    /**
     * The slate attached to this gizmo
     */
    public set attachedSlate(control: Nullable<HolographicSlate>) {
        if (control) {
            this.attachedMesh = control.mesh;
            this.updateBoundingBox();

            this._pickedPointObserver = control._host.onPickingObservable.add((pickedMesh) => {
                if (this._handleHovered && (!pickedMesh || pickedMesh.parent !== this._handleHovered.node)) {
                    this._handleHovered.hover = false;
                    this._handleHovered = null;
                }

                if (pickedMesh && pickedMesh.parent && pickedMesh.parent.reservedDataStore && pickedMesh.parent.reservedDataStore.handle) {
                    const handle = pickedMesh.parent.reservedDataStore.handle as GizmoHandle;
                    if (handle.gizmo === this) {
                        this._handleHovered = handle;
                        this._handleHovered.hover = true;
                    }
                }
            });
        } else if (this._attachedSlate) {
            this._attachedSlate._host.onPickingObservable.remove(this._pickedPointObserver);
        }
        this._attachedSlate = control;
    }

    public get attachedSlate(): Nullable<HolographicSlate> {
        return this._attachedSlate;
    }

    constructor(utilityLayer?: UtilityLayerRenderer) {
        super(utilityLayer);

        this._createNode();
        this.updateScale = false;

        this._renderObserver = this.gizmoLayer.originalScene.onBeforeRenderObservable.add(() => {
            // Only update the bounding box if scaling has changed
            if (this.attachedMesh && !this._existingSlateScale.equals(this.attachedMesh.scaling)) {
                this.updateBoundingBox();
            }
        });
    }

    private _createNode() {
        this._handlesParent = new TransformNode("handlesParent", this.gizmoLayer.utilityLayerScene);
        this._handlesParent.rotationQuaternion = Quaternion.Identity();

        const masksCorners = [
            {
                dimensions: new Vector3(-1, -1, 0),
                origin: new Vector3(1, 0, 0),
            },
            {
                dimensions: new Vector3(1, -1, 0),
                origin: new Vector3(0, 0, 0),
            },
            {
                dimensions: new Vector3(1, 1, 0),
                origin: new Vector3(0, 1, 0),
            },
            {
                dimensions: new Vector3(-1, 1, 0),
                origin: new Vector3(1, 1, 0),
            },
        ];

        for (let i = 0; i < 4; i++) {
            const corner = new CornerHandle(this, this.gizmoLayer.utilityLayerScene);
            this._corners.push(corner);
            corner.node.rotation.z = (Math.PI / 2) * i;

            corner.node.parent = this._handlesParent;
            this._assignDragBehaviorCorners(
                corner,
                (originStart: Vector3, dimensionsStart: Vector3, offset: Vector3, masks: HandleMasks) => this._moveHandle(originStart, dimensionsStart, offset, masks, true),
                masksCorners[i]
            );
        }

        for (let i = 0; i < 4; i++) {
            const side = new SideHandle(this, this.gizmoLayer.utilityLayerScene);
            this._sides.push(side);
            side.node.rotation.z = (Math.PI / 2) * i;
            side.node.parent = this._handlesParent;
            this._assignDragBehaviorSides(side, i % 2 === 0 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0));
        }

        this._handlesParent.parent = this._rootMesh;
    }

    private _keepAspectRatio(vector: Vector3, aspectRatio: number, invertDiagonal: boolean = false) {
        const axis = TmpVectors.Vector3[0];
        axis.copyFromFloats(aspectRatio, 1, 0).normalize();
        if (invertDiagonal) {
            axis.y *= -1;
        }
        const dot = Vector3.Dot(vector, axis);
        vector.copyFrom(axis).scaleInPlace(dot);
    }

    private _clampDimensions(vector: Vector3, dimensions: Vector3, mask: Vector3, keepAspectRatio: boolean = false) {
        const impact = TmpVectors.Vector3[0];
        impact.copyFrom(vector).multiplyInPlace(mask);

        const clampedDimensions = TmpVectors.Vector3[1];
        clampedDimensions.copyFromFloats(
            Math.max(this._attachedSlate!.minDimensions.x, impact.x + dimensions.x),
            Math.max(this._attachedSlate!.minDimensions.y, impact.y + dimensions.y),
            0
        );

        if (keepAspectRatio) {
            // Extra logic to ensure the ratio is maintained when the vector has been clamped
            const ratio = dimensions.x / dimensions.y;
            clampedDimensions.x = Math.max(clampedDimensions.x, clampedDimensions.y * ratio);
            clampedDimensions.y = Math.max(clampedDimensions.y, clampedDimensions.x / ratio);
        }

        // Calculating the real impact of vector on clamped dimensions
        impact.copyFrom(clampedDimensions).subtractInPlace(dimensions);

        vector.x = Math.sign(vector.x) * Math.abs(impact.x);
        vector.y = Math.sign(vector.y) * Math.abs(impact.y);
    }

    private _moveHandle(originStart: Vector3, dimensionsStart: Vector3, offset: Vector3, masks: HandleMasks, isCorner: boolean) {
        if (!this._attachedSlate) {
            return;
        }

        if (isCorner) {
            const aspectRatio = dimensionsStart.x / dimensionsStart.y;
            this._keepAspectRatio(offset, aspectRatio, masks.dimensions.x * masks.dimensions.y < 0);
        }
        this._clampDimensions(offset, dimensionsStart, masks.dimensions, isCorner);

        const offsetOriginMasked = TmpVectors.Vector3[0];
        const offsetDimensionsMasked = TmpVectors.Vector3[1];
        offsetOriginMasked.copyFrom(offset).multiplyInPlace(masks.origin);
        offsetDimensionsMasked.copyFrom(offset).multiplyInPlace(masks.dimensions);

        this._attachedSlate.origin.copyFrom(originStart).addInPlace(offsetOriginMasked);
        this._attachedSlate.dimensions.set(dimensionsStart.x + offsetDimensionsMasked.x, dimensionsStart.y + offsetDimensionsMasked.y);
    }

    private _assignDragBehaviorCorners(
        handle: GizmoHandle,
        moveFn: (originStart: Vector3, dimensionsStart: Vector3, offset: Vector3, masks: HandleMasks) => void,
        masks: HandleMasks
    ) {
        const dimensionsStart = new Vector3();
        const originStart = new Vector3();
        const dragOrigin = new Vector3();
        const toObjectFrame = new Matrix();
        const dragPlaneNormal = new Vector3();

        const projectToRef = (position: Vector3, normal: Vector3, origin: Vector3, ref: Vector3) => {
            // Projects on the plane with its normal and origin
            position.subtractToRef(origin, TmpVectors.Vector3[0]);
            const dot = Vector3.Dot(TmpVectors.Vector3[0], normal);
            TmpVectors.Vector3[1].copyFrom(normal).scaleInPlace(dot);
            TmpVectors.Vector3[0].subtractInPlace(TmpVectors.Vector3[1]);
            TmpVectors.Vector3[0].addToRef(origin, ref);
        };

        const dragStart = (event: { position: Vector3 }) => {
            if (this.attachedSlate && this.attachedMesh) {
                dimensionsStart.set(this.attachedSlate.dimensions.x, this.attachedSlate.dimensions.y, Epsilon);
                originStart.copyFrom(this.attachedSlate.origin);
                dragOrigin.copyFrom(event.position);
                toObjectFrame.copyFrom(this.attachedMesh.computeWorldMatrix(true));
                toObjectFrame.invert();
                this.attachedSlate._followButton.isToggled = false;
                Vector3.TransformNormalToRef(Vector3.Forward(), this.attachedMesh.getWorldMatrix(), dragPlaneNormal);
                dragPlaneNormal.normalize();

                if (this._handleHovered) {
                    this._handleDragged = this._handleHovered;
                    this._handleDragged.drag = true;
                }
            }
        };

        const dragging = (event: { position: Vector3 }) => {
            if (this.attachedSlate && this.attachedMesh) {
                projectToRef(event.position, dragPlaneNormal, dragOrigin, this._tmpVector);
                this._tmpVector.subtractInPlace(dragOrigin);
                Vector3.TransformNormalToRef(this._tmpVector, toObjectFrame, this._tmpVector);

                moveFn(originStart, dimensionsStart, this._tmpVector, masks);
                this.attachedSlate._positionElements();
                this.updateBoundingBox();
            }
        };

        const dragEnd = () => {
            if (this.attachedSlate && this.attachedNode) {
                this.attachedSlate._updatePivot();

                if (this._handleDragged) {
                    this._handleDragged.drag = false;
                    this._handleDragged = null;
                }
            }
        };

        handle.setDragBehavior(dragStart, dragging, dragEnd);
    }

    private _assignDragBehaviorSides(handle: GizmoHandle, dragPlaneNormal: Vector3) {
        const quaternionOrigin = new Quaternion();
        const dragOrigin = new Vector3();
        const directionOrigin = new Vector3();
        const worldPivot = new Vector3();
        const worldPlaneNormal = new Vector3();

        const dragStart = (event: { position: Vector3 }) => {
            if (this.attachedSlate && this.attachedMesh) {
                quaternionOrigin.copyFrom(this.attachedMesh.rotationQuaternion!);
                dragOrigin.copyFrom(event.position);
                worldPivot.copyFrom(this.attachedMesh.getAbsolutePivotPoint());
                directionOrigin.copyFrom(dragOrigin).subtractInPlace(worldPivot).normalize();
                this.attachedSlate._followButton.isToggled = false;
                Vector3.TransformNormalToRef(dragPlaneNormal, this.attachedMesh.getWorldMatrix(), worldPlaneNormal);
                worldPlaneNormal.normalize();

                if (this._handleHovered) {
                    this._handleDragged = this._handleHovered;
                    this._handleDragged.drag = true;
                }
            }
        };

        const dragging = (event: { position: Vector3 }) => {
            if (this.attachedSlate && this.attachedMesh) {
                this._tmpVector.copyFrom(event.position);
                this._tmpVector.subtractInPlace(worldPivot);
                this._tmpVector.normalize();

                const angle = -Vector3.GetAngleBetweenVectorsOnPlane(this._tmpVector, directionOrigin, worldPlaneNormal);
                Quaternion.RotationAxisToRef(dragPlaneNormal, angle, this._tmpQuaternion);
                quaternionOrigin.multiplyToRef(this._tmpQuaternion, this.attachedMesh.rotationQuaternion!);
            }
        };

        const dragEnd = () => {
            if (this.attachedSlate && this.attachedNode) {
                this.attachedSlate._updatePivot();

                if (this._handleDragged) {
                    this._handleDragged.drag = false;
                    this._handleDragged = null;
                }
            }
        };

        handle.setDragBehavior(dragStart, dragging, dragEnd);
    }

    protected _attachedNodeChanged(value: Nullable<AbstractMesh>) {
        if (value) {
            this.updateBoundingBox();
        }
    }

    /**
     * Updates the bounding box information for the gizmo
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
            this._boundingBoxGizmo.min = boundingMinMax.min;
            this._boundingBoxGizmo.max = boundingMinMax.max;

            // Update handles of the gizmo
            this._updateHandlesPosition();
            this._updateHandlesScaling();

            // Restore position/rotation values
            this.attachedMesh.rotationQuaternion.copyFrom(this._tmpQuaternion);
            this.attachedMesh.position.copyFrom(this._tmpVector);

            PivotTools._RestorePivotPoint(this.attachedMesh);

            // Restore original parent
            this.attachedMesh.setParent(originalParent);
            this.attachedMesh.computeWorldMatrix(true);

            this._existingSlateScale.copyFrom(this.attachedMesh.scaling);
        }
    }

    private _updateHandlesPosition() {
        const min = this._boundingBoxGizmo.min.clone();
        const max = this._boundingBoxGizmo.max.clone();

        const handleScaling = this._corners[0].node.scaling.length();
        min.x -= this._margin * handleScaling;
        min.y -= this._margin * handleScaling;
        max.x += this._margin * handleScaling;
        max.y += this._margin * handleScaling;

        const center = min.add(max).scaleInPlace(0.5);

        this._corners[0].node.position.copyFromFloats(min.x, min.y, 0);
        this._corners[1].node.position.copyFromFloats(max.x, min.y, 0);
        this._corners[2].node.position.copyFromFloats(max.x, max.y, 0);
        this._corners[3].node.position.copyFromFloats(min.x, max.y, 0);

        this._sides[0].node.position.copyFromFloats(min.x, center.y, 0);
        this._sides[1].node.position.copyFromFloats(center.x, min.y, 0);
        this._sides[2].node.position.copyFromFloats(max.x, center.y, 0);
        this._sides[3].node.position.copyFromFloats(center.x, max.y, 0);
    }

    private _updateHandlesScaling() {
        if (this._attachedSlate && this._attachedSlate.mesh) {
            const scaledWidth = this._attachedSlate.mesh.scaling.x * this._attachedSlate.dimensions.x;
            const scaledHeight = this._attachedSlate.mesh.scaling.y * this._attachedSlate.dimensions.y;
            const scale = Math.min(scaledWidth, scaledHeight) * this._handleSize;
            for (let index = 0; index < this._corners.length; index++) {
                this._corners[index].node.scaling.setAll(scale);
            }
            for (let index = 0; index < this._sides.length; index++) {
                this._sides[index].node.scaling.setAll(scale);
            }
        }
    }

    protected _update() {
        super._update();

        if (!this.gizmoLayer.utilityLayerScene.activeCamera) {
            return;
        }

        if (this._attachedSlate && this._attachedSlate.mesh) {
            if (this.fixedScreenSize) {
                this._attachedSlate.mesh.absolutePosition.subtractToRef(this.gizmoLayer.utilityLayerScene.activeCamera.position, this._tmpVector);
                const distanceFromCamera = (this._handleSize * this._tmpVector.length()) / this.fixedScreenSizeDistanceFactor;
                for (let i = 0; i < this._corners.length; i++) {
                    this._corners[i].node.scaling.set(distanceFromCamera, distanceFromCamera, distanceFromCamera);
                }
                for (let i = 0; i < this._sides.length; i++) {
                    this._sides[i].node.scaling.set(distanceFromCamera, distanceFromCamera, distanceFromCamera);
                }
            }
            this._updateHandlesPosition();
        }
    }

    public dispose() {
        this.gizmoLayer.originalScene.onBeforeRenderObservable.remove(this._renderObserver);

        // Will dispose rootMesh and all descendants
        super.dispose();

        for (const corner of this._corners) {
            corner.dispose();
        }

        for (const side of this._sides) {
            side.dispose();
        }
    }
}

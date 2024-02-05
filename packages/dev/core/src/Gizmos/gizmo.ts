import type { Observer } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Scene, IDisposable } from "../scene";
import { Quaternion, Vector3, Matrix, TmpVectors } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Camera } from "../Cameras/camera";
import type { TargetCamera } from "../Cameras/targetCamera";
import type { Node } from "../node";
import type { Bone } from "../Bones/bone";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import type { TransformNode } from "../Meshes/transformNode";
import type { StandardMaterial } from "../Materials/standardMaterial";
import type { PointerInfo } from "../Events/pointerEvents";
import { PointerEventTypes } from "../Events/pointerEvents";
import type { LinesMesh } from "../Meshes/linesMesh";
import type { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import type { ShadowLight } from "../Lights/shadowLight";
import { Light } from "../Lights/light";

/**
 * Cache built by each axis. Used for managing state between all elements of gizmo for enhanced UI
 */
export interface GizmoAxisCache {
    /** Mesh used to render the Gizmo */
    gizmoMeshes: Mesh[];
    /** Mesh used to detect user interaction with Gizmo */
    colliderMeshes: Mesh[];
    /** Material used to indicate color of gizmo mesh */
    material: StandardMaterial;
    /** Material used to indicate hover state of the Gizmo */
    hoverMaterial: StandardMaterial;
    /** Material used to indicate disabled state of the Gizmo */
    disableMaterial: StandardMaterial;
    /** Used to indicate Active state of the Gizmo */
    active: boolean;
    /** DragBehavior */
    dragBehavior: PointerDragBehavior;
}

/**
 * Anchor options where the Gizmo can be positioned in relation to its anchored node
 */
export enum GizmoAnchorPoint {
    /** The origin of the attached node */
    Origin,
    /** The pivot point of the attached node*/
    Pivot,
}

/**
 * Coordinates mode: Local or World. Defines how axis is aligned: either on world axis or transform local axis
 */
export enum GizmoCoordinatesMode {
    World,
    Local,
}

/**
 * Interface for basic gizmo
 */
export interface IGizmo extends IDisposable {
    /** True when the mouse pointer is hovered a gizmo mesh */
    readonly isHovered: boolean;
    /** The root mesh of the gizmo */
    _rootMesh: Mesh;
    /** Ratio for the scale of the gizmo */
    scaleRatio: number;
    /**
     * Mesh that the gizmo will be attached to. (eg. on a drag gizmo the mesh that will be dragged)
     * * When set, interactions will be enabled
     */
    attachedMesh: Nullable<AbstractMesh>;
    /**
     * Node that the gizmo will be attached to. (eg. on a drag gizmo the mesh, bone or NodeTransform that will be dragged)
     * * When set, interactions will be enabled
     */
    attachedNode: Nullable<Node>;
    /**
     * If set the gizmo's rotation will be updated to match the attached mesh each frame (Default: true)
     */
    updateGizmoRotationToMatchAttachedMesh: boolean;
    /** The utility layer the gizmo will be added to */
    gizmoLayer: UtilityLayerRenderer;
    /**
     * If set the gizmo's position will be updated to match the attached mesh each frame (Default: true)
     */
    updateGizmoPositionToMatchAttachedMesh: boolean;
    /**
     * Defines where the gizmo will be positioned if `updateGizmoPositionToMatchAttachedMesh` is enabled.
     * (Default: GizmoAnchorPoint.Origin)
     */
    anchorPoint: GizmoAnchorPoint;

    /**
     * Set the coordinate mode to use. By default it's local.
     */
    coordinatesMode: GizmoCoordinatesMode;

    /**
     * When set, the gizmo will always appear the same size no matter where the camera is (default: true)
     */
    updateScale: boolean;
    /**
     * posture that the gizmo will be display
     * When set null, default value will be used (Quaternion(0, 0, 0, 1))
     */
    customRotationQuaternion: Nullable<Quaternion>;
    /**
     * Disposes and replaces the current meshes in the gizmo with the specified mesh
     * @param mesh The mesh to replace the default mesh of the gizmo
     */
    setCustomMesh(mesh: Mesh): void;
}
/**
 * Renders gizmos on top of an existing scene which provide controls for position, rotation, etc.
 */
export class Gizmo implements IGizmo {
    /**
     * The root mesh of the gizmo
     */
    public _rootMesh: Mesh;
    protected _attachedMesh: Nullable<AbstractMesh> = null;
    protected _attachedNode: Nullable<Node> = null;
    protected _customRotationQuaternion: Nullable<Quaternion> = null;
    /**
     * Ratio for the scale of the gizmo (Default: 1)
     */
    protected _scaleRatio = 1;

    /**
     * boolean updated by pointermove when a gizmo mesh is hovered
     */
    protected _isHovered = false;

    /**
     * When enabled, any gizmo operation will perserve scaling sign. Default is off.
     * Only valid for TransformNode derived classes (Mesh, AbstractMesh, ...)
     */
    public static PreserveScaling = false;

    /**
     * There are 2 ways to preserve scaling: using mesh scaling or absolute scaling. Depending of hierarchy, non uniform scaling and LH or RH coordinates. One is preferable than the other.
     * If the scaling to be preserved is the local scaling, then set this value to false.
     * Default is true which means scaling to be preserved is absolute one (with hierarchy applied)
     */
    public static UseAbsoluteScaling = true;

    /**
     * Ratio for the scale of the gizmo (Default: 1)
     */
    public set scaleRatio(value: number) {
        this._scaleRatio = value;
    }

    public get scaleRatio() {
        return this._scaleRatio;
    }

    /**
     * True when the mouse pointer is hovered a gizmo mesh
     */
    public get isHovered() {
        return this._isHovered;
    }

    /**
     * If a custom mesh has been set (Default: false)
     */
    protected _customMeshSet = false;
    /**
     * Mesh that the gizmo will be attached to. (eg. on a drag gizmo the mesh that will be dragged)
     * * When set, interactions will be enabled
     */
    public get attachedMesh() {
        return this._attachedMesh;
    }
    public set attachedMesh(value) {
        this._attachedMesh = value;
        if (value) {
            this._attachedNode = value;
        }
        this._rootMesh.setEnabled(value ? true : false);
        this._attachedNodeChanged(value);
    }
    /**
     * Node that the gizmo will be attached to. (eg. on a drag gizmo the mesh, bone or NodeTransform that will be dragged)
     * * When set, interactions will be enabled
     */
    public get attachedNode() {
        return this._attachedNode;
    }
    public set attachedNode(value) {
        this._attachedNode = value;
        this._attachedMesh = null;
        this._rootMesh.setEnabled(value ? true : false);
        this._attachedNodeChanged(value);
    }

    /**
     * Disposes and replaces the current meshes in the gizmo with the specified mesh
     * @param mesh The mesh to replace the default mesh of the gizmo
     */
    public setCustomMesh(mesh: Mesh) {
        if (mesh.getScene() != this.gizmoLayer.utilityLayerScene) {
            // eslint-disable-next-line no-throw-literal
            throw "When setting a custom mesh on a gizmo, the custom meshes scene must be the same as the gizmos (eg. gizmo.gizmoLayer.utilityLayerScene)";
        }
        this._rootMesh.getChildMeshes().forEach((c) => {
            c.dispose();
        });
        mesh.parent = this._rootMesh;
        this._customMeshSet = true;
    }

    protected _updateGizmoRotationToMatchAttachedMesh = true;
    protected _updateGizmoPositionToMatchAttachedMesh = true;
    protected _anchorPoint = GizmoAnchorPoint.Origin;
    protected _updateScale = true;
    protected _coordinatesMode = GizmoCoordinatesMode.Local;

    /**
     * If set the gizmo's rotation will be updated to match the attached mesh each frame (Default: true)
     * NOTE: This is only possible for meshes with uniform scaling, as otherwise it's not possible to decompose the rotation
     */
    public set updateGizmoRotationToMatchAttachedMesh(value: boolean) {
        this._updateGizmoRotationToMatchAttachedMesh = value;
    }
    public get updateGizmoRotationToMatchAttachedMesh() {
        return this._updateGizmoRotationToMatchAttachedMesh;
    }
    /**
     * If set the gizmo's position will be updated to match the attached mesh each frame (Default: true)
     */
    public set updateGizmoPositionToMatchAttachedMesh(value: boolean) {
        this._updateGizmoPositionToMatchAttachedMesh = value;
    }
    public get updateGizmoPositionToMatchAttachedMesh() {
        return this._updateGizmoPositionToMatchAttachedMesh;
    }

    /**
     * Defines where the gizmo will be positioned if `updateGizmoPositionToMatchAttachedMesh` is enabled.
     * (Default: GizmoAnchorPoint.Origin)
     */
    public set anchorPoint(value: GizmoAnchorPoint) {
        this._anchorPoint = value;
    }
    public get anchorPoint() {
        return this._anchorPoint;
    }

    /**
     * Set the coordinate system to use. By default it's local.
     * But it's possible for a user to tweak so its local for translation and world for rotation.
     * In that case, setting the coordinate system will change `updateGizmoRotationToMatchAttachedMesh` and `updateGizmoPositionToMatchAttachedMesh`
     */
    public set coordinatesMode(coordinatesMode: GizmoCoordinatesMode) {
        this._coordinatesMode = coordinatesMode;
        const local = coordinatesMode == GizmoCoordinatesMode.Local;
        this.updateGizmoRotationToMatchAttachedMesh = local;
        this.updateGizmoPositionToMatchAttachedMesh = true;
    }

    public get coordinatesMode() {
        return this._coordinatesMode;
    }

    /**
     * When set, the gizmo will always appear the same size no matter where the camera is (default: true)
     */

    public set updateScale(value: boolean) {
        this._updateScale = value;
    }
    public get updateScale() {
        return this._updateScale;
    }
    protected _interactionsEnabled = true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _attachedNodeChanged(value: Nullable<Node>) {}

    protected _beforeRenderObserver: Nullable<Observer<Scene>>;
    private _rightHandtoLeftHandMatrix = Matrix.RotationY(Math.PI);

    /**
     * Creates a gizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     */
    constructor(
        /** The utility layer the gizmo will be added to */
        public gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer
    ) {
        this._rootMesh = new Mesh("gizmoRootNode", gizmoLayer.utilityLayerScene);
        this._rootMesh.rotationQuaternion = Quaternion.Identity();

        this._beforeRenderObserver = this.gizmoLayer.utilityLayerScene.onBeforeRenderObservable.add(() => {
            this._update();
        });
    }

    /**
     * posture that the gizmo will be display
     * When set null, default value will be used (Quaternion(0, 0, 0, 1))
     */
    public get customRotationQuaternion(): Nullable<Quaternion> {
        return this._customRotationQuaternion;
    }

    public set customRotationQuaternion(customRotationQuaternion: Nullable<Quaternion>) {
        this._customRotationQuaternion = customRotationQuaternion;
    }

    /**
     * Updates the gizmo to match the attached mesh's position/rotation
     */
    protected _update() {
        if (this.attachedNode) {
            let effectiveNode = this.attachedNode;
            if (this.attachedMesh) {
                effectiveNode = this.attachedMesh || this.attachedNode;
            }

            // Position
            if (this.updateGizmoPositionToMatchAttachedMesh) {
                if (this.anchorPoint == GizmoAnchorPoint.Pivot && (<TransformNode>effectiveNode).getAbsolutePivotPoint) {
                    const position = (<TransformNode>effectiveNode).getAbsolutePivotPoint();
                    this._rootMesh.position.copyFrom(position);
                } else {
                    const row = effectiveNode.getWorldMatrix().getRow(3);
                    const position = row ? row.toVector3() : new Vector3(0, 0, 0);
                    this._rootMesh.position.copyFrom(position);
                }
            }

            // Rotation
            if (this.updateGizmoRotationToMatchAttachedMesh) {
                const supportedNode =
                    (<Mesh>effectiveNode)._isMesh ||
                    effectiveNode.getClassName() === "AbstractMesh" ||
                    effectiveNode.getClassName() === "TransformNode" ||
                    effectiveNode.getClassName() === "InstancedMesh";
                const transformNode = supportedNode ? (effectiveNode as TransformNode) : undefined;
                effectiveNode.getWorldMatrix().decompose(undefined, this._rootMesh.rotationQuaternion!, undefined, Gizmo.PreserveScaling ? transformNode : undefined);
                this._rootMesh.rotationQuaternion!.normalize();
            } else {
                if (this._customRotationQuaternion) {
                    this._rootMesh.rotationQuaternion!.copyFrom(this._customRotationQuaternion);
                } else {
                    this._rootMesh.rotationQuaternion!.set(0, 0, 0, 1);
                }
            }

            // Scale
            if (this.updateScale) {
                const activeCamera = this.gizmoLayer.utilityLayerScene.activeCamera!;
                const cameraPosition = activeCamera.globalPosition;
                this._rootMesh.position.subtractToRef(cameraPosition, TmpVectors.Vector3[0]);
                let scale = this.scaleRatio;
                if (activeCamera.mode == Camera.ORTHOGRAPHIC_CAMERA) {
                    if (activeCamera.orthoTop && activeCamera.orthoBottom) {
                        const orthoHeight = activeCamera.orthoTop - activeCamera.orthoBottom;
                        scale *= orthoHeight;
                    }
                } else {
                    const camForward = activeCamera.getScene().useRightHandedSystem ? Vector3.RightHandedForwardReadOnly : Vector3.LeftHandedForwardReadOnly;
                    const direction = activeCamera.getDirection(camForward);
                    scale *= Vector3.Dot(TmpVectors.Vector3[0], direction);
                }
                this._rootMesh.scaling.setAll(scale);

                // Account for handedness, similar to Matrix.decompose
                if (effectiveNode._getWorldMatrixDeterminant() < 0 && !Gizmo.PreserveScaling) {
                    this._rootMesh.scaling.y *= -1;
                }
            } else {
                this._rootMesh.scaling.setAll(this.scaleRatio);
            }
        }
    }

    /**
     * if transform has a pivot and is not using PostMultiplyPivotMatrix, then the worldMatrix contains the pivot matrix (it's not cancelled at the end)
     * so, when extracting the world matrix component, the translation (and other components) is containing the pivot translation.
     * And the pivot is applied each frame. Removing it anyway here makes it applied only in computeWorldMatrix.
     * @param transform local transform that needs to be transform by the pivot inverse matrix
     * @param localMatrix local matrix that needs to be transform by the pivot inverse matrix
     * @param result resulting matrix transformed by pivot inverse if the transform node is using pivot without using post Multiply Pivot Matrix
     */
    protected _handlePivotMatrixInverse(transform: TransformNode, localMatrix: Matrix, result: Matrix): void {
        if (transform.isUsingPivotMatrix() && !transform.isUsingPostMultiplyPivotMatrix()) {
            transform.getPivotMatrix().invertToRef(TmpVectors.Matrix[5]);
            TmpVectors.Matrix[5].multiplyToRef(localMatrix, result);
            return;
        }
        result.copyFrom(localMatrix);
    }
    /**
     * computes the rotation/scaling/position of the transform once the Node world matrix has changed.
     */
    protected _matrixChanged() {
        if (!this._attachedNode) {
            return;
        }

        if ((<Camera>this._attachedNode)._isCamera) {
            const camera = this._attachedNode as Camera;
            let worldMatrix;
            let worldMatrixUC;
            if (camera.parent) {
                const parentInv = TmpVectors.Matrix[1];
                camera.parent._worldMatrix.invertToRef(parentInv);
                this._attachedNode._worldMatrix.multiplyToRef(parentInv, TmpVectors.Matrix[0]);
                worldMatrix = TmpVectors.Matrix[0];
            } else {
                worldMatrix = this._attachedNode._worldMatrix;
            }

            if (camera.getScene().useRightHandedSystem) {
                // avoid desync with RH matrix computation. Otherwise, rotation of PI around Y axis happens each frame resulting in axis flipped because worldMatrix is computed as inverse of viewMatrix.
                this._rightHandtoLeftHandMatrix.multiplyToRef(worldMatrix, TmpVectors.Matrix[1]);
                worldMatrixUC = TmpVectors.Matrix[1];
            } else {
                worldMatrixUC = worldMatrix;
            }

            worldMatrixUC.decompose(TmpVectors.Vector3[1], TmpVectors.Quaternion[0], TmpVectors.Vector3[0]);

            const inheritsTargetCamera =
                this._attachedNode.getClassName() === "FreeCamera" ||
                this._attachedNode.getClassName() === "FlyCamera" ||
                this._attachedNode.getClassName() === "ArcFollowCamera" ||
                this._attachedNode.getClassName() === "TargetCamera" ||
                this._attachedNode.getClassName() === "TouchCamera" ||
                this._attachedNode.getClassName() === "UniversalCamera";

            if (inheritsTargetCamera) {
                const targetCamera = this._attachedNode as TargetCamera;
                targetCamera.rotation = TmpVectors.Quaternion[0].toEulerAngles();

                if (targetCamera.rotationQuaternion) {
                    targetCamera.rotationQuaternion.copyFrom(TmpVectors.Quaternion[0]);
                    targetCamera.rotationQuaternion.normalize();
                }
            }

            camera.position.copyFrom(TmpVectors.Vector3[0]);
        } else if (
            (<Mesh>this._attachedNode)._isMesh ||
            this._attachedNode.getClassName() === "AbstractMesh" ||
            this._attachedNode.getClassName() === "TransformNode" ||
            this._attachedNode.getClassName() === "InstancedMesh"
        ) {
            const transform = this._attachedNode as TransformNode;
            if (transform.parent) {
                const parentInv = TmpVectors.Matrix[0];
                const localMat = TmpVectors.Matrix[1];
                transform.parent.getWorldMatrix().invertToRef(parentInv);
                this._attachedNode.getWorldMatrix().multiplyToRef(parentInv, localMat);
                const matrixToDecompose = TmpVectors.Matrix[4];
                this._handlePivotMatrixInverse(transform, localMat, matrixToDecompose);
                matrixToDecompose.decompose(
                    TmpVectors.Vector3[0],
                    TmpVectors.Quaternion[0],
                    transform.position,
                    Gizmo.PreserveScaling ? transform : undefined,
                    Gizmo.UseAbsoluteScaling
                );
                TmpVectors.Quaternion[0].normalize();
                if (transform.isUsingPivotMatrix()) {
                    // Calculate the local matrix without the translation.
                    // Copied from TranslateNode.computeWorldMatrix
                    const r = TmpVectors.Quaternion[1];
                    Quaternion.RotationYawPitchRollToRef(transform.rotation.y, transform.rotation.x, transform.rotation.z, r);

                    const scaleMatrix = TmpVectors.Matrix[2];
                    Matrix.ScalingToRef(transform.scaling.x, transform.scaling.y, transform.scaling.z, scaleMatrix);

                    const rotationMatrix = TmpVectors.Matrix[2];
                    r.toRotationMatrix(rotationMatrix);

                    const pivotMatrix = transform.getPivotMatrix();
                    const invPivotMatrix = TmpVectors.Matrix[3];
                    pivotMatrix.invertToRef(invPivotMatrix);

                    pivotMatrix.multiplyToRef(scaleMatrix, TmpVectors.Matrix[4]);
                    TmpVectors.Matrix[4].multiplyToRef(rotationMatrix, TmpVectors.Matrix[5]);
                    TmpVectors.Matrix[5].multiplyToRef(invPivotMatrix, TmpVectors.Matrix[6]);

                    TmpVectors.Matrix[6].getTranslationToRef(TmpVectors.Vector3[1]);

                    transform.position.subtractInPlace(TmpVectors.Vector3[1]);
                }
            } else {
                const matrixToDecompose = TmpVectors.Matrix[4];
                this._handlePivotMatrixInverse(transform, this._attachedNode._worldMatrix, matrixToDecompose);
                matrixToDecompose.decompose(
                    TmpVectors.Vector3[0],
                    TmpVectors.Quaternion[0],
                    transform.position,
                    Gizmo.PreserveScaling ? transform : undefined,
                    Gizmo.UseAbsoluteScaling
                );
            }
            TmpVectors.Vector3[0].scaleInPlace(1.0 / transform.scalingDeterminant);
            transform.scaling.copyFrom(TmpVectors.Vector3[0]);
            if (!transform.billboardMode) {
                if (transform.rotationQuaternion) {
                    transform.rotationQuaternion.copyFrom(TmpVectors.Quaternion[0]);
                    transform.rotationQuaternion.normalize();
                } else {
                    transform.rotation = TmpVectors.Quaternion[0].toEulerAngles();
                }
            }
        } else if (this._attachedNode.getClassName() === "Bone") {
            const bone = this._attachedNode as Bone;
            const parent = bone.getParent();

            if (parent) {
                const invParent = TmpVectors.Matrix[0];
                const boneLocalMatrix = TmpVectors.Matrix[1];
                parent.getFinalMatrix().invertToRef(invParent);
                bone.getFinalMatrix().multiplyToRef(invParent, boneLocalMatrix);
                const lmat = bone.getLocalMatrix();
                lmat.copyFrom(boneLocalMatrix);
            } else {
                const lmat = bone.getLocalMatrix();
                lmat.copyFrom(bone.getFinalMatrix());
            }
            bone.markAsDirty();
        } else {
            const light = this._attachedNode as ShadowLight;
            if (light.getTypeID) {
                const type = light.getTypeID();
                if (type === Light.LIGHTTYPEID_DIRECTIONALLIGHT || type === Light.LIGHTTYPEID_SPOTLIGHT || type === Light.LIGHTTYPEID_POINTLIGHT) {
                    const parent = light.parent;

                    if (parent) {
                        const invParent = TmpVectors.Matrix[0];
                        const nodeLocalMatrix = TmpVectors.Matrix[1];
                        parent.getWorldMatrix().invertToRef(invParent);
                        light.getWorldMatrix().multiplyToRef(invParent, nodeLocalMatrix);
                        nodeLocalMatrix.decompose(undefined, TmpVectors.Quaternion[0], TmpVectors.Vector3[0]);
                    } else {
                        this._attachedNode._worldMatrix.decompose(undefined, TmpVectors.Quaternion[0], TmpVectors.Vector3[0]);
                    }
                    // setter doesn't copy values. Need a new Vector3
                    light.position = new Vector3(TmpVectors.Vector3[0].x, TmpVectors.Vector3[0].y, TmpVectors.Vector3[0].z);
                    if (light.direction) {
                        light.direction = new Vector3(light.direction.x, light.direction.y, light.direction.z);
                    }
                }
            }
        }
    }

    /**
     * refresh gizmo mesh material
     * @param gizmoMeshes
     * @param material material to apply
     */
    protected _setGizmoMeshMaterial(gizmoMeshes: Mesh[], material: StandardMaterial) {
        if (gizmoMeshes) {
            gizmoMeshes.forEach((m: Mesh) => {
                m.material = material;
                if ((<LinesMesh>m).color) {
                    (<LinesMesh>m).color = material.diffuseColor;
                }
            });
        }
    }

    /**
     * Subscribes to pointer up, down, and hover events. Used for responsive gizmos.
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param gizmoAxisCache Gizmo axis definition used for reactive gizmo UI
     * @returns {Observer<PointerInfo>} pointerObserver
     */
    public static GizmoAxisPointerObserver(gizmoLayer: UtilityLayerRenderer, gizmoAxisCache: Map<Mesh, GizmoAxisCache>): Observer<PointerInfo> {
        let dragging = false;

        const pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.pickInfo) {
                // On Hover Logic
                if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
                    if (dragging) {
                        return;
                    }
                    gizmoAxisCache.forEach((cache) => {
                        if (cache.colliderMeshes && cache.gizmoMeshes) {
                            const isHovered = cache.colliderMeshes?.indexOf(pointerInfo?.pickInfo?.pickedMesh as Mesh) != -1;
                            const material = cache.dragBehavior.enabled ? (isHovered || cache.active ? cache.hoverMaterial : cache.material) : cache.disableMaterial;
                            cache.gizmoMeshes.forEach((m: Mesh) => {
                                m.material = material;
                                if ((m as LinesMesh).color) {
                                    (m as LinesMesh).color = material.diffuseColor;
                                }
                            });
                        }
                    });
                }

                // On Mouse Down
                if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                    // If user Clicked Gizmo
                    if (gizmoAxisCache.has(pointerInfo.pickInfo.pickedMesh?.parent as Mesh)) {
                        dragging = true;
                        const statusMap = gizmoAxisCache.get(pointerInfo.pickInfo.pickedMesh?.parent as Mesh);
                        statusMap!.active = true;
                        gizmoAxisCache.forEach((cache) => {
                            const isHovered = cache.colliderMeshes?.indexOf(pointerInfo?.pickInfo?.pickedMesh as Mesh) != -1;
                            const material = (isHovered || cache.active) && cache.dragBehavior.enabled ? cache.hoverMaterial : cache.disableMaterial;
                            cache.gizmoMeshes.forEach((m: Mesh) => {
                                m.material = material;
                                if ((m as LinesMesh).color) {
                                    (m as LinesMesh).color = material.diffuseColor;
                                }
                            });
                        });
                    }
                }

                // On Mouse Up
                if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                    gizmoAxisCache.forEach((cache) => {
                        cache.active = false;
                        dragging = false;
                        cache.gizmoMeshes.forEach((m: Mesh) => {
                            m.material = cache.dragBehavior.enabled ? cache.material : cache.disableMaterial;
                            if ((m as LinesMesh).color) {
                                (m as LinesMesh).color = cache.material.diffuseColor;
                            }
                        });
                    });
                }
            }
        });

        return pointerObserver!;
    }

    /**
     * Disposes of the gizmo
     */
    public dispose() {
        this._rootMesh.dispose();
        if (this._beforeRenderObserver) {
            this.gizmoLayer.utilityLayerScene.onBeforeRenderObservable.remove(this._beforeRenderObserver);
        }
    }
}

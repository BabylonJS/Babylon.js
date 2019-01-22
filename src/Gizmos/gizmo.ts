import { Observer } from "../Misc/observable";
import { Nullable } from "../types";
import { WebVRFreeCamera } from "../Cameras/VR/webVRCamera";
import { Scene, IDisposable } from "../scene";
import { Quaternion, Matrix, Vector3 } from "../Maths/math";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { _TimeToken } from "../Instrumentation/timeToken";
import { _DepthCullingState, _StencilState, _AlphaState } from "../States/index";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
/**
 * Renders gizmos on top of an existing scene which provide controls for position, rotation, etc.
 */
export class Gizmo implements IDisposable {
    /**
     * The root mesh of the gizmo
     */
    public _rootMesh: Mesh;
    private _attachedMesh: Nullable<AbstractMesh>;
    /**
     * Ratio for the scale of the gizmo (Default: 1)
     */
    public scaleRatio = 1;
    private _tmpMatrix = new Matrix();
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
        this._rootMesh.setEnabled(value ? true : false);
        this._attachedMeshChanged(value);
    }

    /**
     * Disposes and replaces the current meshes in the gizmo with the specified mesh
     * @param mesh The mesh to replace the default mesh of the gizmo
     */
    public setCustomMesh(mesh: Mesh) {
        if (mesh.getScene() != this.gizmoLayer.utilityLayerScene) {
            throw "When setting a custom mesh on a gizmo, the custom meshes scene must be the same as the gizmos (eg. gizmo.gizmoLayer.utilityLayerScene)";
        }
        this._rootMesh.getChildMeshes().forEach((c) => {
            c.dispose();
        });
        mesh.parent = this._rootMesh;
        this._customMeshSet = true;
    }

    /**
     * If set the gizmo's rotation will be updated to match the attached mesh each frame (Default: true)
     */
    public updateGizmoRotationToMatchAttachedMesh = true;
    /**
     * If set the gizmo's position will be updated to match the attached mesh each frame (Default: true)
     */
    public updateGizmoPositionToMatchAttachedMesh = true;
    /**
     * When set, the gizmo will always appear the same size no matter where the camera is (default: false)
     */
    protected _updateScale = true;
    protected _interactionsEnabled = true;
    protected _attachedMeshChanged(value: Nullable<AbstractMesh>) {
    }

    private _beforeRenderObserver: Nullable<Observer<Scene>>;

    /**
     * Creates a gizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     */
    constructor(
        /** The utility layer the gizmo will be added to */
        public gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer) {
        this._rootMesh = new Mesh("gizmoRootNode", gizmoLayer.utilityLayerScene);
        this._beforeRenderObserver = this.gizmoLayer.utilityLayerScene.onBeforeRenderObservable.add(() => {
            this._update();
        });
        this.attachedMesh = null;
    }

    private _tempVector = new Vector3();
    /**
     * @hidden
     * Updates the gizmo to match the attached mesh's position/rotation
     */
    protected _update() {
        if (this.attachedMesh) {
            if (this.updateGizmoRotationToMatchAttachedMesh) {
                if (!this._rootMesh.rotationQuaternion) {
                    this._rootMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this._rootMesh.rotation.y, this._rootMesh.rotation.x, this._rootMesh.rotation.z);
                }

                // Remove scaling before getting rotation matrix to get rotation matrix unmodified by scale
                this._tempVector.copyFrom(this.attachedMesh.scaling);
                if (this.attachedMesh.scaling.x < 0) {
                    this.attachedMesh.scaling.x *= -1;
                }
                if (this.attachedMesh.scaling.y < 0) {
                    this.attachedMesh.scaling.y *= -1;
                }
                if (this.attachedMesh.scaling.z < 0) {
                    this.attachedMesh.scaling.z *= -1;
                }
                this.attachedMesh.computeWorldMatrix().getRotationMatrixToRef(this._tmpMatrix);
                this.attachedMesh.scaling.copyFrom(this._tempVector);
                this.attachedMesh.computeWorldMatrix();
                Quaternion.FromRotationMatrixToRef(this._tmpMatrix, this._rootMesh.rotationQuaternion);
            } else if (this._rootMesh.rotationQuaternion) {
                this._rootMesh.rotationQuaternion.set(0, 0, 0, 1);
            }
            if (this.updateGizmoPositionToMatchAttachedMesh) {
                this._rootMesh.position.copyFrom(this.attachedMesh.absolutePosition);
            }
            if (this._updateScale && this.gizmoLayer.utilityLayerScene.activeCamera && this.attachedMesh) {
                var cameraPosition = this.gizmoLayer.utilityLayerScene.activeCamera.globalPosition;
                if ((<WebVRFreeCamera>this.gizmoLayer.utilityLayerScene.activeCamera).devicePosition) {
                    cameraPosition = (<WebVRFreeCamera>this.gizmoLayer.utilityLayerScene.activeCamera).devicePosition;
                }
                this._rootMesh.position.subtractToRef(cameraPosition, this._tempVector);
                var dist = this._tempVector.length() * this.scaleRatio;
                this._rootMesh.scaling.set(dist, dist, dist);
            }
        }
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

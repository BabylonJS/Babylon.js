import { Observer } from "../Misc/observable";
import { Nullable } from "../types";
import { WebVRFreeCamera } from "../Cameras/VR/webVRCamera";
import { Scene, IDisposable } from "../scene";
import { Quaternion, Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
/**
 * Renders gizmos on top of an existing scene which provide controls for position, rotation, etc.
 */
export class Gizmo implements IDisposable {
    /**
     * The root mesh of the gizmo
     */
    public _rootMesh: Mesh;
    private _attachedMesh: Nullable<AbstractMesh> = null;
    /**
     * Ratio for the scale of the gizmo (Default: 1)
     */
    public scaleRatio = 1;
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
     * When set, the gizmo will always appear the same size no matter where the camera is (default: true)
     */
    public updateScale = true;
    protected _interactionsEnabled = true;
    protected _attachedMeshChanged(value: Nullable<AbstractMesh>) {
    }

    private _beforeRenderObserver: Nullable<Observer<Scene>>;
    private _tempVector = new Vector3();

    /**
     * Creates a gizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     */
    constructor(
        /** The utility layer the gizmo will be added to */
        public gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer) {

        this._rootMesh = new Mesh("gizmoRootNode", gizmoLayer.utilityLayerScene);
        this._rootMesh.rotationQuaternion = Quaternion.Identity();

        this._beforeRenderObserver = this.gizmoLayer.utilityLayerScene.onBeforeRenderObservable.add(() => {
            this._update();
        });
    }

    /**
     * Updates the gizmo to match the attached mesh's position/rotation
     */
    protected _update() {
        if (this.attachedMesh) {
            const effectiveMesh = this.attachedMesh._effectiveMesh || this.attachedMesh;

            // Position
            if (this.updateGizmoPositionToMatchAttachedMesh) {
                this._rootMesh.position.copyFrom(effectiveMesh.absolutePosition);
            }

            // Rotation
            if (this.updateGizmoRotationToMatchAttachedMesh) {
                effectiveMesh.getWorldMatrix().decompose(undefined, this._rootMesh.rotationQuaternion!);
            }
            else {
                this._rootMesh.rotationQuaternion!.set(0, 0, 0, 1);
            }

            // Scale
            if (this.updateScale) {
                const activeCamera = this.gizmoLayer.utilityLayerScene.activeCamera!;
                var cameraPosition = activeCamera.globalPosition;
                if ((<WebVRFreeCamera>activeCamera).devicePosition) {
                    cameraPosition = (<WebVRFreeCamera>activeCamera).devicePosition;
                }
                this._rootMesh.position.subtractToRef(cameraPosition, this._tempVector);
                var dist = this._tempVector.length() * this.scaleRatio;
                this._rootMesh.scaling.set(dist, dist, dist);

                // Account for handedness, similar to Matrix.decompose
                if (effectiveMesh._getWorldMatrixDeterminant() < 0) {
                    this._rootMesh.scaling.y *= -1;
                }
            } else {
                this._rootMesh.scaling.setAll(this.scaleRatio);
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

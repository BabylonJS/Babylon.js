import { WebXRFeaturesManager, WebXRFeatureName } from '../webXRFeaturesManager';
import { WebXRAbstractFeature } from './WebXRAbstractFeature';
import { WebXRSessionManager } from '../webXRSessionManager';
import { TransformNode } from '../../Meshes/transformNode';
import { Matrix } from '../../Maths/math';
import { Observable } from '../../Misc/observable';

/**
 * Options used in the mesh detector module
 */
export interface IWebXRMeshDetectorOptions {
    /**
     * The node to use to transform the local results to world coordinates
     */
    worldParentNode?: TransformNode;
    /**
     * If set to true a reference of the created meshes will be kept until the next session starts
     * If not defined, meshes will be removed from the array when the feature is detached or the session ended.
     */
    doNotRemoveMeshesOnSessionEnded?: boolean;
    /**
     * Preferred detector configuration, not all preferred options will be supported by all platforms.
     */
    preferredDetectorOptions?: XRGeometryDetectorOptions;
}

/**
 * A babylon interface for a XR mesh's vertex data.
 *
 * Currently not supported by WebXR, available only with BabylonNative
 */
export interface IWebXRVertexData {
    /**
     * a babylon-assigned ID for this mesh
     */
    id: number;
    /**
     * an array of vertex positions in babylon space. right/left hand system is taken into account.
     */
    positions: Float32Array;
    /**
     * an array of indices in babylon space. right/left hand system is taken into account.
     */
    indices: Uint32Array;
    /**
     * an array of vertex normals in babylon space. right/left hand system is taken into account.
     */
    normals?: Float32Array;
    /**
     * data required for construction a mesh in Babylon.js
     */
    xrMesh: XRMesh;
    /**
     * A transformation matrix to apply on the mesh that will be built using the meshDefinition
     * Local vs. World are decided if worldParentNode was provided or not in the options when constructing the module
     */
    transformationMatrix: Matrix;
}

let meshIdProvider = 0;

/**
 * The mesh detector is used to detect meshes in the real world when in AR
 */
export class WebXRMeshDetector extends WebXRAbstractFeature {
    private _detectedMeshes: Array<IWebXRVertexData> = [];
    private _lastDetectedSet: XRMeshSet = new Set();

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.MESH_DETECTION;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
     * Observers registered here will be executed when a new mesh was added to the session
     */
    public onMeshAddedObservable: Observable<IWebXRVertexData> = new Observable();
    /**
     * Observers registered here will be executed when a mesh is no longer detected in the session
     */
    public onMeshRemovedObservable: Observable<IWebXRVertexData> = new Observable();
    /**
     * Observers registered here will be executed when an existing mesh updates
     */
    public onMeshUpdatedObservable: Observable<IWebXRVertexData> = new Observable();

    constructor(_xrSessionManager: WebXRSessionManager, private _options: IWebXRMeshDetectorOptions = {}) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "mesh-detection";
        if (this._xrSessionManager.session) {
            this._init();
        } else {
            this._xrSessionManager.onXRSessionInit.addOnce(() => {
                this._init();
            });
        }
    }

    public detach(): boolean {
        if (!super.detach()) {
            return false;
        }

        // Only supported by BabylonNative
        if (!!this._xrSessionManager.isNativeSession() &&
            !!this._xrSessionManager.session.trySetMeshDetectorEnabled) {
            this._xrSessionManager.session.trySetMeshDetectorEnabled(false);
        }

        if (!this._options.doNotRemoveMeshesOnSessionEnded) {
            while (this._detectedMeshes.length) {
                const toRemove = this._detectedMeshes.pop();
                if (toRemove) {
                    this.onMeshRemovedObservable.notifyObservers(toRemove);
                }
            }
        }

        return true;
    }

    public dispose(): void {
        super.dispose();
        this.onMeshAddedObservable.clear();
        this.onMeshRemovedObservable.clear();
        this.onMeshUpdatedObservable.clear();
    }

    protected _onXRFrame(frame: XRFrame) {
        if (!this.attached || !frame) {
            return;
        }

        const detectedMeshes = frame.worldInformation?.detectedMeshes;
        if (!!detectedMeshes) {
            const toRemove = this._detectedMeshes
                .filter((mesh) => !detectedMeshes.has(mesh.xrMesh))
                .map((mesh) => {
                    return this._detectedMeshes.indexOf(mesh);
                });
            let idxTracker = 0;
            toRemove.forEach((index) => {
                const mesh = this._detectedMeshes.splice(index - idxTracker, 1)[0];
                this.onMeshRemovedObservable.notifyObservers(mesh);
                idxTracker++;
            });
            // now check for new ones
            detectedMeshes.forEach((xrMesh) => {
                if (!this._lastDetectedSet.has(xrMesh)) {
                    const newMesh: Partial<IWebXRVertexData> = {
                        id: meshIdProvider++,
                        xrMesh: xrMesh,
                    };
                    const mesh = this._updateMeshWithXRMesh(xrMesh, newMesh, frame);
                    this._detectedMeshes.push(mesh);
                    this.onMeshAddedObservable.notifyObservers(mesh);
                } else {
                    // updated?
                    if (xrMesh.lastChangedTime === this._xrSessionManager.currentTimestamp) {
                        let index = this._findIndexInMeshArray(xrMesh);
                        const mesh = this._detectedMeshes[index];
                        this._updateMeshWithXRMesh(xrMesh, mesh, frame);
                        this.onMeshUpdatedObservable.notifyObservers(mesh);
                    }
                }
            });
            this._lastDetectedSet = detectedMeshes;
        }
    }

    private _init() {
        // Only supported by BabylonNative
        if (!!this._xrSessionManager.isNativeSession()) {
            if (!!this._xrSessionManager.session.trySetMeshDetectorEnabled) {
                this._xrSessionManager.session.trySetMeshDetectorEnabled(true);
            }

            if (!!this._options.preferredDetectorOptions &&
                !!this._xrSessionManager.session.trySetPreferredMeshDetectorOptions) {
                this._xrSessionManager.session.trySetPreferredMeshDetectorOptions(this._options.preferredDetectorOptions);
            }
        }
    }

    private _updateMeshWithXRMesh(xrMesh: XRMesh, mesh: Partial<IWebXRVertexData>, xrFrame: XRFrame): IWebXRVertexData {
        mesh.xrMesh = xrMesh;
        if (!this._xrSessionManager.scene.useRightHandedSystem) {
            mesh.positions = new Float32Array(xrMesh.positions.length);
            for (let i = 0; i < xrMesh.positions.length; i += 3) {
                mesh.positions[i] = xrMesh.positions[i];
                mesh.positions[i + 1] = xrMesh.positions[i + 1];
                mesh.positions[i + 2] = -1 * xrMesh.positions[i + 2];
            }

            mesh.indices = new Uint32Array(xrMesh.indices.length);
            for (let i = 0; i < xrMesh.indices.length; i += 3) {
                mesh.indices[i] = xrMesh.indices[i];
                mesh.indices[i + 1] = xrMesh.indices[i + 2];
                mesh.indices[i + 2] = xrMesh.indices[i + 1];
            }

            if (!!xrMesh.normals) {
                mesh.normals = new Float32Array(xrMesh.normals.length);
                for (let i = 0; i < xrMesh.normals.length; i += 3) {
                    mesh.normals[i] = xrMesh.normals[i];
                    mesh.normals[i + 1] = xrMesh.normals[i + 1];
                    mesh.normals[i + 2] = -1 * xrMesh.normals[i + 2];
                }
            }
        }
        else {
            mesh.positions = xrMesh.positions;
            mesh.indices = xrMesh.indices;
            mesh.normals = xrMesh.normals;
        }

        // matrix
        const pose = xrFrame.getPose(xrMesh.meshSpace, this._xrSessionManager.referenceSpace);
        if (pose) {
            const mat = mesh.transformationMatrix || new Matrix();
            Matrix.FromArrayToRef(pose.transform.matrix, 0, mat);
            if (!this._xrSessionManager.scene.useRightHandedSystem) {
                mat.toggleModelMatrixHandInPlace();
            }
            mesh.transformationMatrix = mat;
            if (this._options.worldParentNode) {
                mat.multiplyToRef(this._options.worldParentNode.getWorldMatrix(), mat);
            }
        }
        
        return <IWebXRVertexData>mesh;
    }

    private _findIndexInMeshArray(xrMesh: XRMesh) {
        for (let i = 0; i < this._detectedMeshes.length; ++i) {
            if (this._detectedMeshes[i].xrMesh === xrMesh) {
                return i;
            }
        }
        return -1;
    }
}

WebXRFeaturesManager.AddWebXRFeature(
    WebXRMeshDetector.Name,
    (xrSessionManager, options) => {
        return () => new WebXRMeshDetector(xrSessionManager, options);
    },
    WebXRMeshDetector.Version,
    false
);
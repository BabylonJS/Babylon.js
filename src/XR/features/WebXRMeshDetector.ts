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
 * A babylon interface for a XR mesh.
 *
 * Currently not supported by WebXR, available only with BabylonNative
 */
export interface IWebXRMesh {
    /**
     * a babylon-assigned ID for this mesh
     */
    id: number;
    /**
     * data required for construction a mesh in Babylon.js
     */
    xrMesh: XRMesh;
    /**
     * A transformation matrix to apply on the mesh that will be built using the meshDefinition
     * Local vs. World are decided if worldParentNode was provided or not in the options when constructing the module
     */
    transformationMatrix: Matrix;
    /**
     * if the mesh is a part of a more complex geometry, this id will represent the geometry
     */
    geometryId?: number;
    /**
     * if the mesh is a part of a more complex geometry, this type will represent the type of the geometry
     */
    geometryType?: XRGeometryType | string;
}

let meshIdProvider = 0;

/**
 * The mesh detector is used to detect meshes in the real world when in AR
 */
export class WebXRMeshDetector extends WebXRAbstractFeature {
    private _detectedMeshes: Array<IWebXRMesh> = [];
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
    public onMeshAddedObservable: Observable<IWebXRMesh> = new Observable();
    /**
     * Observers registered here will be executed when a mesh is no longer detected in the session
     */
    public onMeshRemovedObservable: Observable<IWebXRMesh> = new Observable();
    /**
     * Observers registered here will be executed when an existing mesh updates
     */
    public onMeshUpdatedObservable: Observable<IWebXRMesh> = new Observable();

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

        if (!!this._xrSessionManager.session.trySetMeshDetectorEnabled) {
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

        const detectedMeshes = frame.detectedMeshes;
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
                    const newMesh: Partial<IWebXRMesh> = {
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
        if (!!this._xrSessionManager.session.trySetMeshDetectorEnabled) {
            this._xrSessionManager.session.trySetMeshDetectorEnabled(true);
        }

        if (!!this._options.preferredDetectorOptions &&
            !!this._xrSessionManager.session.trySetMeshDetectorOptions) {
            this._xrSessionManager.session.trySetMeshDetectorOptions(this._options.preferredDetectorOptions);
        }
    }

    private _updateMeshWithXRMesh(xrMesh: XRMesh, mesh: Partial<IWebXRMesh>, xrFrame: XRFrame): IWebXRMesh {
        mesh.geometryId = this._xrSessionManager.session.tryGetMeshGeometryId(xrMesh);
        mesh.geometryType = this._xrSessionManager.session.tryGetMeshGeometryType(xrMesh);
        return <IWebXRMesh>mesh;
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
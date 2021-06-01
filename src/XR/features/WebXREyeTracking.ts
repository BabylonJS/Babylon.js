import { WebXRFeaturesManager, WebXRFeatureName } from '../webXRFeaturesManager';
import { WebXRAbstractFeature } from './WebXRAbstractFeature';
import { WebXRSessionManager } from '../webXRSessionManager';
import { TransformNode } from '../../Meshes/transformNode';
//import { Nullable } from "../../types";

/**
 * Options used in the mesh detector module
 */
export interface IWebXREyeTrackingOptions {
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
    /**
     * If set to true, WebXREyeTracking will convert coordinate systems for meshes.
     * If not defined, mesh conversions from right handed to left handed coordinate systems won't be conducted.
     * Right handed mesh data will be available through IWebXRVertexData.xrMesh.
     */
    convertCoordinateSystems?: boolean;
}


//let meshIdProvider = 0;

/**
 * The mesh detector is used to detect meshes in the real world when in AR
 */
export class WebXREyeTracking extends WebXRAbstractFeature {
//    private _detectedMeshes: Map<XRMesh, IWebXRVertexData> = new Map<XRMesh, IWebXRVertexData>();
   // private _latestEyeSpace: Nullable<XRSpace>;
    private _IsSpaceDirty: boolean;

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.EYE_TRACKING;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;



    /**
     * Observers registered here will be executed when a new mesh was added to the session
     */
  //  public onMeshAddedObservable: Observable<IWebXRVertexData> = new Observable();
    /**
     * Observers registered here will be executed when a mesh is no longer detected in the session
     */
  //  public onMeshRemovedObservable: Observable<IWebXRVertexData> = new Observable();
    /**
     * Observers registered here will be executed when an existing mesh updates
     */
  //  public onMeshUpdatedObservable: Observable<IWebXRVertexData> = new Observable();



    constructor(_xrSessionManager: WebXRSessionManager, private _options: IWebXREyeTrackingOptions = {}) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "eye-tracking";
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
        if (!!this._xrSessionManager.isNative &&
            !!this._xrSessionManager.session.trySetEyeTrackingEnabled) {
            this._xrSessionManager.session.trySetEyeTrackingEnabled(false);
        }
/*
        if (!this._options.doNotRemoveMeshesOnSessionEnded) {
            this._detectedMeshes.forEach((mesh) => {
                this.onMeshRemovedObservable.notifyObservers(mesh);
            });

            this._detectedMeshes.clear();
        }
*/
        return true;
    }

    public dispose(): void {
        super.dispose();
  //      this.onMeshAddedObservable.clear();
  //      this.onMeshRemovedObservable.clear();
  //      this.onMeshUpdatedObservable.clear();
    }

    protected _onXRFrame(frame: XRFrame) {
        if (!this._IsSpaceDirty) {

        }

        if (!this.attached || !frame) {
            return;
        }
        if (this._options.convertCoordinateSystems) {
            //satisfy the compiler for now
            return;
        }
/*
        const detectedMeshes = frame.worldInformation?.detectedMeshes;
        if (!!detectedMeshes) {
            let toRemove = new Set<XRMesh>();
            this._detectedMeshes.forEach((vertexData, xrMesh) => {
                if (!detectedMeshes.has(xrMesh)) {
                    toRemove.add(xrMesh);
                }
            });
            toRemove.forEach((xrMesh) => {
                const vertexData = this._detectedMeshes.get(xrMesh);
                if (!!vertexData) {
                    this.onMeshRemovedObservable.notifyObservers(vertexData);
                    this._detectedMeshes.delete(xrMesh);
                }
            });

            // now check for new ones
            detectedMeshes.forEach((xrMesh) => {
                if (!this._detectedMeshes.has(xrMesh)) {
                    const partialVertexData: Partial<IWebXRVertexData> = {
                        id: meshIdProvider++,
                        xrMesh: xrMesh,
                    };
                    this._detectedMeshes.set(xrMesh, vertexData);
                    this.onMeshAddedObservable.notifyObservers(vertexData);
                } else {
                    // updated?
                    if (xrMesh.lastChangedTime === this._xrSessionManager.currentTimestamp) {
                        const vertexData = this._detectedMeshes.get(xrMesh);
                        if (!!vertexData) {
                            this.onMeshUpdatedObservable.notifyObservers(vertexData);
                        }
                    }
                }
            });
        }*/
    }

    private _init() {
        // Only supported by BabylonNative
        if (!!this._xrSessionManager.isNative && 
            !!this._xrSessionManager.session.trySetEyeTrackingEnabled) {
                this._xrSessionManager.session.trySetEyeTrackingEnabled(true);
        }
    }
}

WebXRFeaturesManager.AddWebXRFeature(
    WebXREyeTracking.Name,
    (xrSessionManager, options) => {
        return () => new WebXREyeTracking(xrSessionManager, options);
    },
    WebXREyeTracking.Version,
    false
);
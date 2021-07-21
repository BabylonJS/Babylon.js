import { WebXRFeaturesManager, WebXRFeatureName } from '../webXRFeaturesManager';
import { WebXRAbstractFeature } from './WebXRAbstractFeature';
import { WebXRSessionManager } from '../webXRSessionManager';
import { TransformNode } from '../../Meshes/transformNode';
import { Observable } from "../../Misc/observable";
import { Vector3, Quaternion } from "../../Maths/math.vector";
import { Ray } from "../../Culling/ray";
import { Nullable } from "../../types";

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
    private _latestEyeSpace: Nullable<XRSpace>;

    private _gazeRay: Nullable<Ray>;

    private _tmpQuat: Quaternion = new Quaternion();

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
    public onEyeTrackingStartedObservable: Observable<Ray> = new Observable();
    public onEyeTrackingEndedObservable: Observable<void> = new Observable();
    public onEyeTrackingFrameUpdateObservable: Observable<Ray> = new Observable();


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

        return true;
    }

    public dispose(): void {
        super.dispose();

        this.onEyeTrackingStartedObservable.clear();
        this.onEyeTrackingEndedObservable.clear();
        this.onEyeTrackingFrameUpdateObservable.clear();
    }

    public isEyeGazeValid() {
        return !!this._gazeRay;
    }

    public getEyeGaze() {
        return this._gazeRay;
    }

    protected _onXRFrame(frame: XRFrame) {
        if (!this.attached || !frame) {
            return;
        }
        if (this._options.convertCoordinateSystems) {
            //satisfy the compiler for now
            return;
        }

        if (this._latestEyeSpace && this._gazeRay) {
            let pose = frame.getPose(this._latestEyeSpace, this._xrSessionManager.referenceSpace);
            if (pose) {
                this._gazeRay.origin.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
                const quat = pose.transform.orientation;
                this._tmpQuat.set(quat.x, quat.y, quat.z, quat.w);

                if (!this._xrSessionManager.scene.useRightHandedSystem) {
                    this._gazeRay.origin.z *= -1;
                    this._tmpQuat.z *= -1;
                    this._tmpQuat.w *= -1;
                }
                
                Vector3.Forward().rotateByQuaternionToRef(this._tmpQuat, this._gazeRay.direction);
                this.onEyeTrackingFrameUpdateObservable.notifyObservers(this._gazeRay);
            }

        }
    }

    private _init() {
        // Only supported by BabylonNative
        if (!!this._xrSessionManager.isNative) {

            const eyeTrackingStartListener = (event: XREyeTrackingSourceEvent) => {
                this._latestEyeSpace = event.gazeSpace;
                this._gazeRay = new Ray(Vector3.Zero(), Vector3.Forward());
                this.onEyeTrackingStartedObservable.notifyObservers(this._gazeRay);
            };
            const eyeTrackingEndListener = () => {
                this._latestEyeSpace = null;
                this._gazeRay = null;
                this.onEyeTrackingEndedObservable.notifyObservers();
            };

            this._xrSessionManager.session.addEventListener("eyetrackingstart", eyeTrackingStartListener);
            this._xrSessionManager.session.addEventListener("eyetrackingend", eyeTrackingEndListener);
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
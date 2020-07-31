import { WebXRFeaturesManager, WebXRFeatureName } from '../webXRFeaturesManager';
import { TransformNode } from '../../Meshes/transformNode';
import { WebXRSessionManager } from '../webXRSessionManager';
import { Observable } from '../../Misc/observable';
import { Vector3, Matrix } from '../../Maths/math.vector';
import { WebXRAbstractFeature } from './WebXRAbstractFeature';

/**
 * Options used in the plane detector module
 */
export interface IWebXRPlaneDetectorOptions {
    /**
     * The node to use to transform the local results to world coordinates
     */
    worldParentNode?: TransformNode;
}

/**
 * A babylon interface for a WebXR plane.
 * A Plane is actually a polygon, built from N points in space
 *
 * Supported in chrome 79, not supported in canary 81 ATM
 */
export interface IWebXRPlane {
    /**
     * a babylon-assigned ID for this polygon
     */
    id: number;
    /**
     * an array of vector3 points in babylon space. right/left hand system is taken into account.
     */
    polygonDefinition: Array<Vector3>;
    /**
     * A transformation matrix to apply on the mesh that will be built using the polygonDefinition
     * Local vs. World are decided if worldParentNode was provided or not in the options when constructing the module
     */
    transformationMatrix: Matrix;
    /**
     * the native xr-plane object
     */
    xrPlane: XRPlane;
}

let planeIdProvider = 0;

/**
 * The plane detector is used to detect planes in the real world when in AR
 * For more information see https://github.com/immersive-web/real-world-geometry/
 */
export class WebXRPlaneDetector extends WebXRAbstractFeature {
    private _detectedPlanes: Array<IWebXRPlane> = [];
    private _enabled: boolean = false;
    private _lastFrameDetected: XRPlaneSet = new Set();

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.PLANE_DETECTION;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
     * Observers registered here will be executed when a new plane was added to the session
     */
    public onPlaneAddedObservable: Observable<IWebXRPlane> = new Observable();
    /**
     * Observers registered here will be executed when a plane is no longer detected in the session
     */
    public onPlaneRemovedObservable: Observable<IWebXRPlane> = new Observable();
    /**
     * Observers registered here will be executed when an existing plane updates (for example - expanded)
     * This can execute N times every frame
     */
    public onPlaneUpdatedObservable: Observable<IWebXRPlane> = new Observable();

    /**
     * construct a new Plane Detector
     * @param _xrSessionManager an instance of xr Session manager
     * @param _options configuration to use when constructing this feature
     */
    constructor(_xrSessionManager: WebXRSessionManager, private _options: IWebXRPlaneDetectorOptions = {}) {
        super(_xrSessionManager);
        if (this._xrSessionManager.session) {
            this._init();
        } else {
            this._xrSessionManager.onXRSessionInit.addOnce(() => {
                this._init();
            });
        }
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        super.dispose();
        this.onPlaneAddedObservable.clear();
        this.onPlaneRemovedObservable.clear();
        this.onPlaneUpdatedObservable.clear();
    }

    protected _onXRFrame(frame: XRFrame) {
        if (!this.attached || !this._enabled || !frame) { return; }
        // const timestamp = this.xrSessionManager.currentTimestamp;

        const detectedPlanes = frame.worldInformation.detectedPlanes;
        if (detectedPlanes && detectedPlanes.size) {
            this._detectedPlanes.filter((plane) => !detectedPlanes.has(plane.xrPlane)).map((plane) => {
                const index = this._detectedPlanes.indexOf(plane);
                this._detectedPlanes.splice(index, 1);
                this.onPlaneRemovedObservable.notifyObservers(plane);
            });
            // now check for new ones
            detectedPlanes.forEach((xrPlane) => {
                if (!this._lastFrameDetected.has(xrPlane)) {
                    const newPlane: Partial<IWebXRPlane> = {
                        id: planeIdProvider++,
                        xrPlane: xrPlane,
                        polygonDefinition: []
                    };
                    const plane = this._updatePlaneWithXRPlane(xrPlane, newPlane, frame);
                    this._detectedPlanes.push(plane);
                    this.onPlaneAddedObservable.notifyObservers(plane);
                } else {
                    // updated?
                    if (xrPlane.lastChangedTime === this._xrSessionManager.currentTimestamp) {
                        let index = this.findIndexInPlaneArray(xrPlane);
                        const plane = this._detectedPlanes[index];
                        this._updatePlaneWithXRPlane(xrPlane, plane, frame);
                        this.onPlaneUpdatedObservable.notifyObservers(plane);
                    }
                }
            });
            this._lastFrameDetected = detectedPlanes;
        }
    }

    private _init() {
        if (!this._xrSessionManager.session.updateWorldTrackingState) {
            // fail silently
            return;
        }
        this._xrSessionManager.session.updateWorldTrackingState({ planeDetectionState: { enabled: true } });
        this._enabled = true;
        if (this._detectedPlanes.length) {
            this._detectedPlanes = [];
        }
    }

    private _updatePlaneWithXRPlane(xrPlane: XRPlane, plane: Partial<IWebXRPlane>, xrFrame: XRFrame): IWebXRPlane {
        plane.polygonDefinition = xrPlane.polygon.map((xrPoint) => {
            const rightHandedSystem = this._xrSessionManager.scene.useRightHandedSystem ? 1 : -1;
            return new Vector3(xrPoint.x, xrPoint.y, xrPoint.z * rightHandedSystem);
        });
        // matrix
        const pose = xrFrame.getPose(xrPlane.planeSpace, this._xrSessionManager.referenceSpace);
        if (pose) {
            const mat = plane.transformationMatrix || new Matrix();
            Matrix.FromArrayToRef(pose.transform.matrix, 0, mat);
            if (!this._xrSessionManager.scene.useRightHandedSystem) {
                mat.toggleModelMatrixHandInPlace();
            }
            plane.transformationMatrix = mat;
            if (this._options.worldParentNode) {
                mat.multiplyToRef(this._options.worldParentNode.getWorldMatrix(), mat);
            }
        }
        return <IWebXRPlane>plane;
    }

    /**
     * avoiding using Array.find for global support.
     * @param xrPlane the plane to find in the array
     */
    private findIndexInPlaneArray(xrPlane: XRPlane) {
        for (let i = 0; i < this._detectedPlanes.length; ++i) {
            if (this._detectedPlanes[i].xrPlane === xrPlane) {
                return i;
            }
        }
        return -1;
    }
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(WebXRPlaneDetector.Name, (xrSessionManager, options) => {
    return () => new WebXRPlaneDetector(xrSessionManager, options);
}, WebXRPlaneDetector.Version);

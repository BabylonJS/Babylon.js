import { WebXRFeaturesManager, IWebXRFeature } from '../webXRFeaturesManager';
import { TransformNode } from '../../../Meshes/transformNode';
import { WebXRSessionManager } from '../webXRSessionManager';
import { Observable, Observer } from '../../../Misc/observable';
import { Vector3, Matrix } from '../../../Maths/math.vector';
import { Nullable } from '../../../types';

const Name = "xr-plane-detector";

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
 * A babylon interface for a webxr plane.
 * A Plane is actually a polygon, built from N points in space
 */
export interface IWebXRPlane {
    /**
     * a babylon-assigned ID for this polygon
     */
    id: number;
    /**
     * the native xr-plane object
     */
    xrPlane: XRPlane;
    /**
     * an array of vector3 points in babylon space. right/left hand system is taken into account.
     */
    polygonDefinition: Array<Vector3>;
    /**
     * A transformation matrix to apply on the mesh that will be built using the polygonDefinition
     * Local vs. World are decided if worldParentNode was provided or not in the options when constructing the module
     */
    transformationMatrix: Matrix;
}

let planeIdProvider = 0;

/**
 * The plane detector is used to detect planes in the real world when in AR
 * For more information see https://github.com/immersive-web/real-world-geometry/
 */
export class WebXRPlaneDetector implements IWebXRFeature {

    /**
     * The module's name
     */
    public static readonly Name = Name;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the webxr specs version
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

    private _attached: boolean = false;
    /**
     * Is this feature attached
     */
    public get attached() {
        return this._attached;
    }
    private _enabled: boolean = false;
    private _detectedPlanes: Array<IWebXRPlane> = [];
    private _lastFrameDetected: XRPlaneSet = new Set();
    private _observerTracked: Nullable<Observer<XRFrame>>;

    /**
     * construct a new Plane Detector
     * @param _xrSessionManager an instance of xr Session manager
     * @param _options configuration to use when constructing this feature
     */
    constructor(private _xrSessionManager: WebXRSessionManager, private _options: IWebXRPlaneDetectorOptions = {}) {
        if (this._xrSessionManager.session) {
            this._xrSessionManager.session.updateWorldTrackingState({ planeDetectionState: { enabled: true } });
            this._enabled = true;
        } else {
            this._xrSessionManager.onXRSessionInit.addOnce(() => {
                this._xrSessionManager.session.updateWorldTrackingState({ planeDetectionState: { enabled: true } });
                this._enabled = true;
            });
        }
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    attach(): boolean {

        this._observerTracked = this._xrSessionManager.onXRFrameObservable.add(() => {
            const frame = this._xrSessionManager.currentFrame;
            if (!this._attached || !this._enabled || !frame) { return; }
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
        });

        this._attached = true;
        return true;
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    detach(): boolean {
        this._attached = false;

        if (this._observerTracked) {
            this._xrSessionManager.onXRFrameObservable.remove(this._observerTracked);
        }

        return true;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    dispose(): void {
        this.detach();
        this.onPlaneAddedObservable.clear();
        this.onPlaneRemovedObservable.clear();
        this.onPlaneUpdatedObservable.clear();
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

import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { Observable } from "../../Misc/observable";
import { Vector3, TmpVectors } from "../../Maths/math.vector";
import { Ray } from "../../Culling/ray";
import type { Nullable } from "../../types";

/**
 * The WebXR Eye Tracking feature grabs eye data from the device and provides it in an easy-access format.
 * Currently only enabled for BabylonNative applications.
 */
export class WebXREyeTracking extends WebXRAbstractFeature {
    private _latestEyeSpace: Nullable<XRSpace>;
    private _gazeRay: Nullable<Ray>;

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
     * This observable will notify registered observers when eye tracking starts
     */
    public readonly onEyeTrackingStartedObservable: Observable<Ray> = new Observable();
    /**
     * This observable will notify registered observers when eye tracking ends
     */
    public readonly onEyeTrackingEndedObservable: Observable<void> = new Observable();
    /**
     * This observable will notify registered observers on each frame that has valid tracking
     */
    public readonly onEyeTrackingFrameUpdateObservable: Observable<Ray> = new Observable();

    /**
     * Creates a new instance of the XR eye tracking feature.
     * @param _xrSessionManager An instance of WebXRSessionManager.
     */
    constructor(_xrSessionManager: WebXRSessionManager) {
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

    /**
     * Dispose this feature and all of the resources attached.
     */
    public dispose(): void {
        super.dispose();

        this._xrSessionManager.session.removeEventListener("eyetrackingstart", this._eyeTrackingStartListener);
        this._xrSessionManager.session.removeEventListener("eyetrackingend", this._eyeTrackingEndListener);

        this.onEyeTrackingStartedObservable.clear();
        this.onEyeTrackingEndedObservable.clear();
        this.onEyeTrackingFrameUpdateObservable.clear();
    }

    /**
     * Returns whether the gaze data is valid or not
     * @returns true if the data is valid
     */
    public get isEyeGazeValid(): boolean {
        return !!this._gazeRay;
    }

    /**
     * Get a reference to the gaze ray. This data is valid while eye tracking persists, and will be set to null when gaze data is no longer available
     * @returns a reference to the gaze ray if it exists and is valid, returns null otherwise.
     */
    public getEyeGaze(): Nullable<Ray> {
        return this._gazeRay;
    }

    protected _onXRFrame(frame: XRFrame) {
        if (!this.attached || !frame) {
            return;
        }

        if (this._latestEyeSpace && this._gazeRay) {
            const pose = frame.getPose(this._latestEyeSpace, this._xrSessionManager.referenceSpace);
            if (pose) {
                this._gazeRay.origin.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z).scaleInPlace(this._xrSessionManager.worldScalingFactor);
                const quat = pose.transform.orientation;
                TmpVectors.Quaternion[0].set(quat.x, quat.y, quat.z, quat.w);

                if (!this._xrSessionManager.scene.useRightHandedSystem) {
                    this._gazeRay.origin.z *= -1;
                    TmpVectors.Quaternion[0].z *= -1;
                    TmpVectors.Quaternion[0].w *= -1;

                    Vector3.LeftHandedForwardReadOnly.rotateByQuaternionToRef(TmpVectors.Quaternion[0], this._gazeRay.direction);
                } else {
                    Vector3.RightHandedForwardReadOnly.rotateByQuaternionToRef(TmpVectors.Quaternion[0], this._gazeRay.direction);
                }

                this.onEyeTrackingFrameUpdateObservable.notifyObservers(this._gazeRay);
            }
        }
    }

    private _eyeTrackingStartListener = (event: XREyeTrackingSourceEvent) => {
        this._latestEyeSpace = event.gazeSpace;
        this._gazeRay = new Ray(Vector3.Zero(), Vector3.Forward());
        this.onEyeTrackingStartedObservable.notifyObservers(this._gazeRay);
    };

    private _eyeTrackingEndListener = () => {
        this._latestEyeSpace = null;
        this._gazeRay = null;
        this.onEyeTrackingEndedObservable.notifyObservers();
    };

    private _init() {
        // Only supported by BabylonNative
        if (this._xrSessionManager.isNative) {
            this._xrSessionManager.session.addEventListener("eyetrackingstart", this._eyeTrackingStartListener);
            this._xrSessionManager.session.addEventListener("eyetrackingend", this._eyeTrackingEndListener);
        }
    }
}

WebXRFeaturesManager.AddWebXRFeature(
    WebXREyeTracking.Name,
    (xrSessionManager) => {
        return () => new WebXREyeTracking(xrSessionManager);
    },
    WebXREyeTracking.Version,
    false
);

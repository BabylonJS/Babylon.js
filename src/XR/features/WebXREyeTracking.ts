import { WebXRFeaturesManager, WebXRFeatureName } from '../webXRFeaturesManager';
import { WebXRAbstractFeature } from './WebXRAbstractFeature';
import { WebXRSessionManager } from '../webXRSessionManager';
import { Observable } from "../../Misc/observable";
import { Vector3, Quaternion } from "../../Maths/math.vector";
import { Ray } from "../../Culling/ray";
import { Nullable } from "../../types";

/**
 * The WebXR Eye Tracking feature grabs eye data from the device and provides it in an easy-access format.
 * Currently only enabled for BabylonNative applications, developers intending to use this must enable the Gaze Input capability in their appx package manifest for data to flow.
 */
export class WebXREyeTracking extends WebXRAbstractFeature {
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
     * This observable will notify registered observers when eye tracking starts
     */
    public onEyeTrackingStartedObservable: Observable<Ray> = new Observable();
    /**
     * This observable will notify registered observers when eye tracking ends
     */
    public onEyeTrackingEndedObservable: Observable<void> = new Observable();
    /**
     * This observable will notify registered observers on each frame that has valid tracking
     */
    public onEyeTrackingFrameUpdateObservable: Observable<Ray> = new Observable();

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

        this.onEyeTrackingStartedObservable.clear();
        this.onEyeTrackingEndedObservable.clear();
        this.onEyeTrackingFrameUpdateObservable.clear();
    }

    /**
     * Returns whether the gaze data is valid or not
     */
    public isEyeGazeValid() {
        return !!this._gazeRay;
    }

    /**
     * Returns a reference to the gaze ray. This data is valid while eye tracking persists, and will be set to null when gaze data is no longer available
     */
    public getEyeGaze() {
        return this._gazeRay;
    }

    protected _onXRFrame(frame: XRFrame) {
        if (!this.attached || !frame) {
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
        return () => new WebXREyeTracking(xrSessionManager);
    },
    WebXREyeTracking.Version,
    false
);
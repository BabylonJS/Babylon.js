import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import { WebXRSessionManager } from "../webXRSessionManager";
import { Observable } from "../../Misc/observable";
import { Vector3 } from "../../Maths/math.vector";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";

/**
 * A babylon interface for a "WebXR" feature point.
 * Represents the position and confidence value of a given feature point.
 */
export interface IWebXRFeaturePoint {
    /**
     * Represents the position of the feature point in world space.
     */
    position : Vector3;
    /**
     * Represents the confidence value of the feature point in world space. 0 being least confident, and 1 being most confident.
     */
    confidenceValue : number;
    /**
     * The ID of the feature point, stable across frames.
     */
    id : number;
}

/**
 * The feature point system is used to detect feature points from real world geometry.
 * This feature is currently experimental and only supported on BabylonNative, and should not be used in the browser.
 * The newly introduced API can be seen in webxr.nativeextensions.d.ts.
 */
export class WebXRFeaturePointSystem extends WebXRAbstractFeature {
    private _enabled: boolean = false;
    private _featurePoints: Array<IWebXRFeaturePoint> = [];

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.FEATURE_POINTS;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;
    /**
     * Observers registered here will be executed whenever new feature points are available (on XRFrame while the session is tracking).
     */
    public onFeaturePointsUpdatedObservable: Observable<IWebXRFeaturePoint[]> = new Observable();
    /**
     * construct the feature point system
     * @param _xrSessionManager an instance of xr Session manager
     */
    constructor(_xrSessionManager: WebXRSessionManager) {
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
     * Detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public detach(): boolean {
        if (!super.detach()) {
            return false;
        }

        this._featurePoints.length = 0;
        return true;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        super.dispose();

        this._featurePoints.length = 0;
        this.onFeaturePointsUpdatedObservable.clear();
    }

    /**
     * On receiving a new XR frame if this feature is attached notify observers new feature point data is available.
     */
    protected _onXRFrame(frame: XRFrame) {
        if (!this.attached || !this._enabled || !frame) {
            return;
        }
        let featurePointRawData : number[] | undefined = frame.featurePointCloud;
        if (!featurePointRawData || featurePointRawData.length == 0) {
            return;
        } else {
            let numberOfFeaturePoints : number = featurePointRawData.length / 5;
            for (var i = 0; i < numberOfFeaturePoints; i++) {
                let rawIndex : number = i * 5;
                let id = featurePointRawData[rawIndex + 4];

                // IDs should be durable across frames and strictly increasing from 0 up, so use them as indexing into the feature point array.
                if (id == this._featurePoints.length) {
                    this._featurePoints.push({
                        position: new Vector3(
                             featurePointRawData[rawIndex],
                             featurePointRawData[rawIndex + 1],
                             featurePointRawData[rawIndex + 2]),
                        confidenceValue: featurePointRawData[rawIndex + 3],
                        id: id
                        });
                } else {
                    this._featurePoints[id].position.x = featurePointRawData[rawIndex];
                    this._featurePoints[id].position.y = featurePointRawData[rawIndex + 1];
                    this._featurePoints[id].position.z = featurePointRawData[rawIndex + 2];
                    this._featurePoints[id].confidenceValue = featurePointRawData[rawIndex + 3];
                }
            }
        }

        this.onFeaturePointsUpdatedObservable.notifyObservers(this._featurePoints);
    }

    /**
     * Initializes the feature. If the feature point feature is not available for this environment do not mark the feature as enabled.
     */
    private _init() {
        if (!this._xrSessionManager.session.setFeaturePointCloudEnabled || !this._xrSessionManager.session.setFeaturePointCloudEnabled(true)) {
            // fail silently
            return;
        }

        this._enabled = true;
    }
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRFeaturePointSystem.Name,
    (xrSessionManager) => {
        return () => new WebXRFeaturePointSystem(xrSessionManager);
    },
    WebXRFeaturePointSystem.Version
);

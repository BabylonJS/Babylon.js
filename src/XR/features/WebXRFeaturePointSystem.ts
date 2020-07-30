import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import { WebXRSessionManager } from "../webXRSessionManager";
import { Observable } from "../../Misc/observable";
import { Vector3 } from "../../Maths/math.vector";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";

/**
 * A babylon interface for a WebXR feature point.
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
}

/**
 * Callback function type definition for GetPointCloud. If the user requests this goes and fetches the point cloud from.
 */
type GetPointCloud = () => IWebXRFeaturePoint[];

/**
 * The feature point is used to detect feature points from real world geometry.
 * This feature is currently experimental and only supported on BabylonNative, and should not be used in the browser.
 * The newly introduced API can be seen in webxr.nativeextensions.d.ts.
 */
export class WebXRFeaturePointSystem extends WebXRAbstractFeature {
    private _enabled: boolean = false;
    private _featurePoints: Array<IWebXRFeaturePoint> | null = null;

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
    public onFeaturePointsAvailableObservable: Observable<GetPointCloud> = new Observable();
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
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public detach(): boolean {
        if (!super.detach()) {
            return false;
        }

        this._featurePoints = null;
        return true;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        super.dispose();

        this._featurePoints = null;
        this.onFeaturePointsAvailableObservable.clear();
    }

    protected _onXRFrame(frame: XRFrame) {
        if (!this.attached || !this._enabled || !frame) {
            return;
        }

        this._featurePoints = null;
        this.onFeaturePointsAvailableObservable.notifyObservers(() => {
            if (this._featurePoints)
            {
                return this._featurePoints;
            }

            let featurePointRawData : number[] | undefined = frame.featurePointCloud;
            if (!featurePointRawData) {
                return new Array<IWebXRFeaturePoint>();
            }
            else {
                let numberOfFeaturePoints : number = featurePointRawData.length / 4;
                this._featurePoints = new Array<IWebXRFeaturePoint>(featurePointRawData.length / 4);
                for (var i = 0; i < numberOfFeaturePoints; i++) {
                    let rawIndex : number = i * 4;
                    this._featurePoints[i] = {
                        position: new Vector3(
                             featurePointRawData[rawIndex],
                             featurePointRawData[rawIndex + 1],
                             featurePointRawData[rawIndex + 2]),
                        confidenceValue: featurePointRawData[4]
                        };
                }

                return this._featurePoints;
            }
         });
    }

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

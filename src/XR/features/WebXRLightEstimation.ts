import { Tools } from "../../Misc/tools";
import { Nullable } from "../../types";
import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";

/**
 * Options for Light Estimation feature
 */
export interface IWebXRLightEstimationOptions {
    /**
     * Instead of using preferred reflection format use srgba8 to initialize the light probe
     */
     reflectionFormatSRGBA8?: boolean;
}

/**
 * Light Estimation Feature
 *
 * @since 5.0.0
 */
export class WebXRLightEstimation extends WebXRAbstractFeature {

    /**
     * While the estimated cube map is expected to update over time to better reflect the user's environment as they move around those changes are unlikely to happen with every XRFrame.
     * Since creating and processing the cube map is potentially expensive, especially if mip maps are needed, pages can listen to the reflectionchange event on the XRLightProbe to
     * determine when an updated cube map needs to be retrieved.
     *
     * Event Listener to for "reflectionchange" events.
     */
    private _reflectionChangeListener: Nullable<EventListenerOrEventListenerObject> = null;

    private _xrLightProbe: Nullable<XRLightProbe> = null;

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.LIGHT_ESTIMATION;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
    * Creates a new instance of the light-estimation feature
    * @param _xrSessionManager an instance of WebXRSessionManager
    * @param options options to use when constructing this feature
    */
    constructor(
        _xrSessionManager: WebXRSessionManager,
        /**
         * options to use when constructing this feature
         */
        public readonly options: IWebXRLightEstimationOptions
    ) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "light-estimation";

        // https://immersive-web.github.io/lighting-estimation/
        Tools.Warn("light-estimation is an experimental and unstable feature.");
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public attach(): boolean {
        if (!super.attach()) {
            return false;
        }

        this._xrSessionManager.session.requestLightProbe({
            reflectionFormat: this.options.reflectionFormatSRGBA8 ? "srgba8" : this._xrSessionManager.session.preferredReflectionFormat ?? "srgba8"
        }).then((value: XRLightProbe) => {
            this._xrLightProbe = value;
        })
        return true;
    }

    /**
     * The XRLightProbe object created during attach (may not be available for a few frames).
     */
    public get xrLightProbe(): Nullable<XRLightProbe> {
        return this._xrLightProbe;
    }

    /**
     * Dispose this feature and all of the resources attached
     * 
     * TODO: add code to attach the event listener!!
     */
    public dispose(): void {
        super.dispose();
        if (this._xrLightProbe !== null && this._reflectionChangeListener !== null) {
            this._xrLightProbe.removeEventListener('reflectionchange', this._reflectionChangeListener);
        }
    }

    protected _onXRFrame(_xrFrame: XRFrame): void { /* empty */ }
}

// register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRLightEstimation.Name,
    (xrSessionManager, options) => {
        return () => new WebXRLightEstimation(xrSessionManager, options);
    },
    WebXRLightEstimation.Version,
    false
);
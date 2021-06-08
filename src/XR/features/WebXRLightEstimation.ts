import { Observable } from "../../Misc/observable";
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

    private _reflectionCubeMap: Nullable<WebGLTexture> = null;
    private _xrLightEstimate: Nullable<XRLightEstimate> = null;
    private _xrLightProbe: Nullable<XRLightProbe> = null;
    private _xrWebGLBinding: Nullable<XRWebGLBinding> = null;

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
     * This observable will notify when the reflection cube map is updated.
     */
    public onReflectionCubeMapUpdatedObservable: Observable<WebGLTexture> = new Observable();

    /**
    * Creates a new instance of the light estimation feature
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
     * While the estimated cube map is expected to update over time to better reflect the user's environment as they move around those changes are unlikely to happen with every XRFrame.
     * Since creating and processing the cube map is potentially expensive, especially if mip maps are needed, you can listen to the onReflectionCubeMapUpdatedObservable to determine
     * when it has been updated.
     */
    public get reflectionCubeMap(): Nullable<WebGLTexture> {
        return this._reflectionCubeMap;
    }

    /**
     * The XRLightProbe object created during attach (may not be available for a few frames depending on device).
     *
     * The XRLightProbe itself contains no lighting values, but is used to retrieve the current lighting state with each XRFrame.
     * XR Light Probe also contains the probe space, may update it's pose over time as the user moves around their environment.
     */
    public get xrLightProbe(): Nullable<XRLightProbe> {
        return this._xrLightProbe;
    }

    /**
     * The most recent light estimate.  Available starting on the first frame where the device provides a light probe.
     */
    public get xrLightingEstimate(): Nullable<XRLightEstimate> {
        return this._xrLightEstimate;
    }

    private _getXRGLBinding(): XRWebGLBinding {
        if (this._xrWebGLBinding === null) {
            // TODO: find a way that looks less hacky to get webgl context.  try webgl2 and fallback to webgl.
            const canvas: HTMLCanvasElement = this._xrSessionManager.scene.getEngine().getRenderingCanvas()!;
            let context: Nullable<WebGLRenderingContext | WebGL2RenderingContext> = canvas.getContext("webgl2");
            if (!context) {
                context = canvas.getContext("webgl")!;
            }
            this._xrWebGLBinding = new XRWebGLBinding(this._xrSessionManager.session, context);
        }
        return this._xrWebGLBinding;
    }

    /**
     * Event Listener to for "reflectionchange" events.
     */
    private _updateReflectionCubeMap = (): void => {
        this._reflectionCubeMap = this._getXRGLBinding().getReflectionCubeMap(this._xrLightProbe!);
        this.onReflectionCubeMapUpdatedObservable.notifyObservers(this._reflectionCubeMap);
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
            this._xrLightProbe.addEventListener('reflectionchange', this._updateReflectionCubeMap);
            this._reflectionCubeMap = this._getXRGLBinding().getReflectionCubeMap(this._xrLightProbe!);
        });

        return true;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        super.dispose();
        if (this._xrLightProbe !== null) {
            this._xrLightProbe.removeEventListener('reflectionchange', this._updateReflectionCubeMap);
        }

        this._xrLightProbe = null;
    }

    protected _onXRFrame(_xrFrame: XRFrame): void {
        if (this._xrLightProbe !== null) {
            this._xrLightEstimate = _xrFrame.getLightEstimate(this._xrLightProbe);
        }
    }
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
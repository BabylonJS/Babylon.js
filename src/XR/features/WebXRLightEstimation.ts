import { WebGLHardwareTexture } from "../../Engines/WebGL/webGLHardwareTexture";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
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

    private _canvasContext: Nullable<WebGLRenderingContext | WebGL2RenderingContext> = null;
    private _reflectionCubeMap: Nullable<BaseTexture> = null;
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
    public onReflectionCubeMapUpdatedObservable: Observable<BaseTexture> = new Observable();

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
    public get reflectionCubeMap(): Nullable<BaseTexture> {
        return this._reflectionCubeMap;
    }

    // /**
    //  * The XRLightProbe object created during attach (may not be available for a few frames depending on device).
    //  *
    //  * The XRLightProbe itself contains no lighting values, but is used to retrieve the current lighting state with each XRFrame.
    //  * XR Light Probe also contains the probe space, may update it's pose over time as the user moves around their environment.
    //  */
    // public get xrLightProbe(): Nullable<XRLightProbe> {
    //     return this._xrLightProbe;
    // }

    /**
     * The most recent light estimate.  Available starting on the first frame where the device provides a light probe.
     */
    public get xrLightingEstimate(): Nullable<XRLightEstimate> {
        return this._xrLightEstimate;
    }

    private _getCanvasContext(): WebGLRenderingContext | WebGL2RenderingContext {
        if (this._canvasContext === null) {
            this._canvasContext = this._xrSessionManager.scene.getEngine()._gl;
        }
        return this._canvasContext;
    }

    private _getXRGLBinding(): XRWebGLBinding {
        if (this._xrWebGLBinding === null) {
            let context = this._getCanvasContext();
            this._xrWebGLBinding = new XRWebGLBinding(this._xrSessionManager.session, context);
        }
        return this._xrWebGLBinding;
    }

    /**
     * Event Listener to for "reflectionchange" events.
     */
    private _updateReflectionCubeMap = (): void => {
        console.log('updating');
        if (this._reflectionCubeMap === null) {
            this._reflectionCubeMap = new BaseTexture(this._xrSessionManager.scene);
        }
        // else {
        //     this._reflectionCubeMap._texture?.dispose();
        // }
        console.log(this._getXRGLBinding().getReflectionCubeMap(this._xrLightProbe!));
        if (this._getXRGLBinding().getReflectionCubeMap(this._xrLightProbe!)) {
            console.log(this._getXRGLBinding().getReflectionCubeMap(this._xrLightProbe!));
            const internalTexture = new InternalTexture(this._xrSessionManager.scene.getEngine(), InternalTextureSource.CubeRaw, false);
            internalTexture._hardwareTexture = new WebGLHardwareTexture(this._getXRGLBinding().getReflectionCubeMap(this._xrLightProbe!), this._getCanvasContext() as WebGLRenderingContext);
            this._reflectionCubeMap._texture = internalTexture;
            this.onReflectionCubeMapUpdatedObservable.notifyObservers(this._reflectionCubeMap!);
        }
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
            this._updateReflectionCubeMap();
        });

        return true;
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public detach(): boolean {
        const detached = super.detach();

        if (this._xrLightProbe !== null) {
            this._xrLightProbe.removeEventListener('reflectionchange', this._updateReflectionCubeMap);
            this._xrLightProbe = null;
        }

        this._canvasContext = null;
        this._xrLightEstimate = null;
        // When the session ends (on detach) we must clear our XRWebGLBinging instance, which references the ended session.
        this._xrWebGLBinding = null;

        return detached;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        super.dispose();

        if (this._reflectionCubeMap !== null) {
            this._getCanvasContext().deleteTexture(this._reflectionCubeMap);
            this._reflectionCubeMap = null;
        }
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
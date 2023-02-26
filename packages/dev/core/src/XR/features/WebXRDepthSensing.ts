import { RawTexture } from "../../Materials/Textures/rawTexture";
import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { Tools } from "../../Misc/tools";
import { Texture } from "../../Materials/Textures/texture";
import { Engine } from "../../Engines/engine";
import { Observable } from "../../Misc/observable";

/**
 * Options for Depth Sensing feature
 */
export interface IWebXRDepthSensingOptions {
    /**
     *  The desired depth sensing usage for the session
     */
    usagePreference: XRDepthUsage[];
    /**
     * The desired depth sensing data format for the session
     */
    dataFormatPreference: XRDepthDataFormat[];
}

type GetDepthInMetersType = (x: number, y: number) => number;

/**
 * WebXR Feature for WebXR Depth Sensing Module
 */
export class WebXRDepthSensing extends WebXRAbstractFeature {
    private _cachedDepthInfo?: XRDepthInformation;

    /**
     * Width of depth data. If depth data is not exist, returns null.
     */
    public get width(): number | null {
        if (!this._cachedDepthInfo) {
            return null;
        }
        return this._cachedDepthInfo.width;
    }

    /**
     * Height of depth data. If depth data is not exist, returns null.
     */
    public get height(): number | null {
        if (!this._cachedDepthInfo) {
            return null;
        }
        return this._cachedDepthInfo.height;
    }

    /**
     * Scale factor by which the raw depth values must be multiplied in order to get the depths in meters.
     */
    public get rawValueToMeters(): number | null {
        if (!this._cachedDepthInfo) {
            return null;
        }

        return this._cachedDepthInfo.rawValueToMeters;
    }

    /**
     * An XRRigidTransform that needs to be applied when indexing into the depth buffer.
     */
    public get normDepthBufferFromNormView(): XRRigidTransform | null {
        if (!this._cachedDepthInfo) {
            return null;
        }

        return this._cachedDepthInfo.normDepthBufferFromNormView;
    }

    /**
     * Describes which depth-sensing usage ("cpu-optimized" or "gpu-optimized" is used.
     *
     */
    public get depthUsage(): XRDepthUsage {
        return this._xrSessionManager.session.depthUsage;
    }

    /**
     * Describes which depth sensing data format ("luminance-alpha" or "float32") is used.
     */
    public get depthDataFormat(): XRDepthDataFormat {
        return this._xrSessionManager.session.depthDataFormat;
    }

    /**
     * Latest cached WebGLTexture which containing depth buffer information.
     * This can be used when the depth usage is gpu-optimized.
     */
    public get latestWebGLTexture(): WebGLTexture | null {
        if (!this._cachedDepthInfo) {
            return null;
        }

        const webglDepthInfo = this._cachedDepthInfo as XRWebGLDepthInformation;
        if (!webglDepthInfo.texture) {
            return null;
        }

        return webglDepthInfo.texture;
    }

    /**
     * cached depth buffer
     */
    public get latestDepthBuffer(): ArrayBufferView | null {
        if (!this._cachedDepthInfo) {
            return null;
        }

        const { data } = this._cachedDepthInfo as XRCPUDepthInformation;
        if (!data) {
            return null;
        }

        return this.depthDataFormat === "luminance-alpha" ? new Uint16Array(data) : new Float32Array(data);
    }

    /**
     * Event that notify when `DepthInformation.getDepthInMeters` is available.
     * `getDepthInMeters` method needs active XRFrame (not available for cached XRFrame)
     */
    public onGetDepthInMetersAvailable: Observable<GetDepthInMetersType> = new Observable<GetDepthInMetersType>();

    private _cachedDepthImageTexture?: RawTexture;

    /**
     * Latest cached `BaseTexture` of depth image which is made from the depth buffer data.
     */
    public get latestDepthImageTexture(): RawTexture | null {
        if (!this._cachedDepthImageTexture) {
            return null;
        }
        return this._cachedDepthImageTexture;
    }

    /**
     * XRWebGLBinding which is used for acquiring WebGLDepthInformation
     */
    private _glBinding?: XRWebGLBinding;

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.DEPTH_SENSING;

    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
     * Creates a new instance of the depth sensing feature
     * @param _xrSessionManager the WebXRSessionManager
     * @param options options for WebXR Depth Sensing Feature
     */
    constructor(_xrSessionManager: WebXRSessionManager, public readonly options: IWebXRDepthSensingOptions) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "depth-sensing";

        // https://immersive-web.github.io/depth-sensing/
        Tools.Warn("depth-sensing is an experimental and unstable feature.");
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public attach(force?: boolean | undefined): boolean {
        if (!super.attach(force)) {
            return false;
        }

        const isBothDepthUsageAndFormatNull = this._xrSessionManager.session.depthDataFormat == null || this._xrSessionManager.session.depthUsage == null;
        if (isBothDepthUsageAndFormatNull) {
            return false;
        }

        this._glBinding = new XRWebGLBinding(this._xrSessionManager.session, this._xrSessionManager.scene.getEngine()._gl);

        return true;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        this._cachedDepthImageTexture?.dispose();
    }

    protected _onXRFrame(_xrFrame: XRFrame): void {
        const referenceSPace = this._xrSessionManager.referenceSpace;

        const pose = _xrFrame.getViewerPose(referenceSPace);
        if (pose == null) {
            return;
        }

        for (const view of pose.views) {
            switch (this.depthUsage) {
                case "cpu-optimized":
                    this._updateDepthInformationAndTextureCPUDepthUsage(_xrFrame, view, this.depthDataFormat);
                    break;

                case "gpu-optimized":
                    if (!this._glBinding) {
                        break;
                    }

                    this._updateDepthInformationAndTextureWebGLDepthUsage(this._glBinding, view, this.depthDataFormat);
                    break;

                default:
                    Tools.Error("Unknown depth usage");
            }
        }
    }

    private _updateDepthInformationAndTextureCPUDepthUsage(frame: XRFrame, view: XRView, dataFormat: XRDepthDataFormat): void {
        const depthInfo = frame.getDepthInformation(view);
        if (depthInfo === null) {
            return;
        }

        this._cachedDepthInfo = depthInfo;

        const { data, width, height, rawValueToMeters, getDepthInMeters } = depthInfo as XRCPUDepthInformation;

        // to avoid Illegal Invocation error, bind `this`
        this.onGetDepthInMetersAvailable.notifyObservers(getDepthInMeters.bind(depthInfo));

        if (!this._cachedDepthImageTexture) {
            this._cachedDepthImageTexture = RawTexture.CreateRTexture(
                null,
                width,
                height,
                this._xrSessionManager.scene,
                false,
                true,
                Texture.NEAREST_SAMPLINGMODE,
                Engine.TEXTURETYPE_FLOAT
            );
        }

        switch (dataFormat) {
            case "luminance-alpha":
                this._cachedDepthImageTexture.update(Float32Array.from(new Uint16Array(data)).map((value) => value * rawValueToMeters));
                break;

            case "float32":
                this._cachedDepthImageTexture.update(new Float32Array(data).map((value) => value * rawValueToMeters));
                break;

            default:
                break;
        }
    }

    private _updateDepthInformationAndTextureWebGLDepthUsage(webglBinding: XRWebGLBinding, view: XRView, dataFormat: XRDepthDataFormat): void {
        const depthInfo = webglBinding.getDepthInformation(view);
        if (depthInfo === null) {
            return;
        }

        this._cachedDepthInfo = depthInfo;

        const { texture, width, height } = depthInfo as XRWebGLDepthInformation;

        const scene = this._xrSessionManager.scene;
        const engine = scene.getEngine();
        const internalTexture = engine.wrapWebGLTexture(texture);

        if (!this._cachedDepthImageTexture) {
            this._cachedDepthImageTexture = RawTexture.CreateRTexture(
                null,
                width,
                height,
                scene,
                false,
                true,
                Texture.NEAREST_SAMPLINGMODE,
                dataFormat === "luminance-alpha" ? Engine.TEXTURETYPE_UNSIGNED_BYTE : Engine.TEXTURETYPE_FLOAT
            );
        }

        this._cachedDepthImageTexture._texture = internalTexture;
    }

    /**
     * Extends the session init object if needed
     * @returns augmentation object for the xr session init object.
     */
    public getXRSessionInitExtension(): Promise<Partial<XRSessionInit>> {
        const isDepthUsageDeclared = this.options.usagePreference != null && this.options.usagePreference.length !== 0;
        const isDataFormatDeclared = this.options.dataFormatPreference != null && this.options.dataFormatPreference.length !== 0;
        return new Promise((resolve) => {
            if (isDepthUsageDeclared && isDataFormatDeclared) {
                resolve({ depthSensing: this.options });
            } else {
                resolve({});
            }
        });
    }
}

WebXRFeaturesManager.AddWebXRFeature(
    WebXRDepthSensing.Name,
    (xrSessionManager, options) => {
        return () => new WebXRDepthSensing(xrSessionManager, options);
    },
    WebXRDepthSensing.Version,
    false
);

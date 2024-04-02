import { RawTexture } from "../../Materials/Textures/rawTexture";
import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { Tools } from "../../Misc/tools";
import { Texture } from "../../Materials/Textures/texture";
import { Engine } from "../../Engines/engine";
import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import { Constants } from "../../Engines/constants";
import { WebGLHardwareTexture } from "../../Engines/WebGL/webGLHardwareTexture";
import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";

export type WebXRDepthUsage = "cpu" | "gpu";
export type WebXRDepthDataFormat = "ushort" | "float";

/**
 * Options for Depth Sensing feature
 */
export interface IWebXRDepthSensingOptions {
    /**
     *  The desired depth sensing usage for the session
     */
    usagePreference: WebXRDepthUsage[];
    /**
     * The desired depth sensing data format for the session
     */
    dataFormatPreference: WebXRDepthDataFormat[];
}

type GetDepthInMetersType = (x: number, y: number) => number;

/**
 * WebXR Feature for WebXR Depth Sensing Module
 * @since 5.49.1
 */
export class WebXRDepthSensing extends WebXRAbstractFeature {
    private _width: Nullable<number> = null;
    private _height: Nullable<number> = null;
    private _rawValueToMeters: Nullable<number> = null;
    private _normDepthBufferFromNormView: Nullable<XRRigidTransform> = null;
    private _cachedDepthBuffer: Nullable<ArrayBuffer> = null;
    private _cachedWebGLTexture: Nullable<WebGLTexture> = null;
    private _cachedDepthImageTexture: Nullable<RawTexture> = null;

    /**
     * Width of depth data. If depth data is not exist, returns null.
     */
    public get width(): Nullable<number> {
        return this._width;
    }

    /**
     * Height of depth data. If depth data is not exist, returns null.
     */
    public get height(): Nullable<number> {
        return this._height;
    }

    /**
     * Scale factor by which the raw depth values must be multiplied in order to get the depths in meters.
     */
    public get rawValueToMeters(): Nullable<number> {
        return this._rawValueToMeters;
    }

    /**
     * An XRRigidTransform that needs to be applied when indexing into the depth buffer.
     */
    public get normDepthBufferFromNormView(): Nullable<XRRigidTransform> {
        return this._normDepthBufferFromNormView;
    }

    /**
     * Describes which depth-sensing usage ("cpu" or "gpu") is used.
     */
    public get depthUsage(): WebXRDepthUsage {
        switch (this._xrSessionManager.session.depthUsage) {
            case "cpu-optimized":
                return "cpu";
            case "gpu-optimized":
                return "gpu";
        }
    }

    /**
     * Describes which depth sensing data format ("ushort" or "float") is used.
     */
    public get depthDataFormat(): WebXRDepthDataFormat {
        switch (this._xrSessionManager.session.depthDataFormat) {
            case "luminance-alpha":
                return "ushort";
            case "float32":
                return "float";
        }
    }

    /**
     * Latest cached InternalTexture which containing depth buffer information.
     * This can be used when the depth usage is "gpu".
     */
    public get latestInternalTexture(): Nullable<InternalTexture> {
        if (!this._cachedWebGLTexture) {
            return null;
        }

        const engine = this._xrSessionManager.scene.getEngine();
        const internalTexture = new InternalTexture(engine, InternalTextureSource.Unknown);
        internalTexture.isCube = false;
        internalTexture.invertY = false;
        internalTexture._useSRGBBuffer = false;
        internalTexture.format = this.depthDataFormat === "ushort" ? Constants.TEXTUREFORMAT_LUMINANCE_ALPHA : Constants.TEXTUREFORMAT_RGBA;
        internalTexture.generateMipMaps = false;
        internalTexture.type = this.depthDataFormat === "ushort" ? Constants.TEXTURETYPE_UNSIGNED_SHORT : Constants.TEXTURETYPE_FLOAT;
        internalTexture.samplingMode = Constants.TEXTURE_NEAREST_LINEAR;
        internalTexture.width = this.width ?? 0;
        internalTexture.height = this.height ?? 0;
        internalTexture._cachedWrapU = Constants.TEXTURE_WRAP_ADDRESSMODE;
        internalTexture._cachedWrapV = Constants.TEXTURE_WRAP_ADDRESSMODE;
        internalTexture._hardwareTexture = new WebGLHardwareTexture(this._cachedWebGLTexture, engine._gl);

        return internalTexture;
    }

    /**
     * cached depth buffer
     */
    public get latestDepthBuffer(): Nullable<ArrayBufferView> {
        if (!this._cachedDepthBuffer) {
            return null;
        }

        return this.depthDataFormat === "ushort" ? new Uint16Array(this._cachedDepthBuffer) : new Float32Array(this._cachedDepthBuffer);
    }

    /**
     * Event that notify when `DepthInformation.getDepthInMeters` is available.
     * `getDepthInMeters` method needs active XRFrame (not available for cached XRFrame)
     */
    public onGetDepthInMetersAvailable: Observable<GetDepthInMetersType> = new Observable<GetDepthInMetersType>();

    /**
     * Latest cached Texture of depth image which is made from the depth buffer data.
     */
    public get latestDepthImageTexture(): Nullable<RawTexture> {
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
    constructor(
        _xrSessionManager: WebXRSessionManager,
        public readonly options: IWebXRDepthSensingOptions
    ) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "depth-sensing";

        // https://immersive-web.github.io/depth-sensing/
        Tools.Warn("depth-sensing is an experimental and unstable feature.");
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     * @param force should attachment be forced (even when already attached)
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
                case "cpu":
                    this._updateDepthInformationAndTextureCPUDepthUsage(_xrFrame, view, this.depthDataFormat);
                    break;

                case "gpu":
                    if (!this._glBinding) {
                        break;
                    }

                    this._updateDepthInformationAndTextureWebGLDepthUsage(this._glBinding, view, this.depthDataFormat);
                    break;

                default:
                    Tools.Error("Unknown depth usage");
                    this.detach();
                    break;
            }
        }
    }

    private _updateDepthInformationAndTextureCPUDepthUsage(frame: XRFrame, view: XRView, dataFormat: WebXRDepthDataFormat): void {
        const depthInfo = frame.getDepthInformation(view);
        if (depthInfo === null) {
            return;
        }

        const { data, width, height, rawValueToMeters, getDepthInMeters } = depthInfo as XRCPUDepthInformation;

        this._width = width;
        this._height = height;
        this._rawValueToMeters = rawValueToMeters;
        this._cachedDepthBuffer = data;

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
            case "ushort":
                this._cachedDepthImageTexture.update(Float32Array.from(new Uint16Array(data)).map((value) => value * rawValueToMeters));
                break;

            case "float":
                this._cachedDepthImageTexture.update(new Float32Array(data).map((value) => value * rawValueToMeters));
                break;

            default:
                break;
        }
    }

    private _updateDepthInformationAndTextureWebGLDepthUsage(webglBinding: XRWebGLBinding, view: XRView, dataFormat: WebXRDepthDataFormat): void {
        const depthInfo = webglBinding.getDepthInformation(view);
        if (depthInfo === null) {
            return;
        }

        const { texture, width, height } = depthInfo as XRWebGLDepthInformation;

        this._width = width;
        this._height = height;
        this._cachedWebGLTexture = texture;

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
                dataFormat === "ushort" ? Engine.TEXTURETYPE_UNSIGNED_BYTE : Engine.TEXTURETYPE_FLOAT
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
                const usages: XRDepthUsage[] = this.options.usagePreference.map((usage) => {
                    switch (usage) {
                        case "cpu":
                            return "cpu-optimized";
                        case "gpu":
                            return "gpu-optimized";
                    }
                });
                const dataFormats: XRDepthDataFormat[] = this.options.dataFormatPreference.map((format) => {
                    switch (format) {
                        case "ushort":
                            return "luminance-alpha";
                        case "float":
                            return "float32";
                    }
                });

                resolve({
                    depthSensing: {
                        usagePreference: usages,
                        dataFormatPreference: dataFormats,
                    },
                });
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

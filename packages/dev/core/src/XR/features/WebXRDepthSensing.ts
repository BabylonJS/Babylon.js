import { BaseTexture, RawTexture } from "./../../Materials/Textures";
import { WebXRFeatureName, WebXRFeaturesManager } from "./../webXRFeaturesManager";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { Tools } from "../../Misc/tools";
import type { Scene } from "../../scene";

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

    public get rawValueToMeters(): number | null {
        if (!this._cachedDepthInfo) {
            return null;
        }

        return this._cachedDepthInfo.rawValueToMeters;
    }

    public get normDepthBufferFromNormView(): XRRigidTransform | null {
        if (!this._cachedDepthInfo) {
            return null;
        }

        return this._cachedDepthInfo.normDepthBufferFromNormView;
    }

    public get depthUsage(): XRDepthUsage {
        return this._xrSessionManager.session.depthUsage;
    }

    public get depthDataFormat(): XRDepthDataFormat {
        return this._xrSessionManager.session.depthDataFormat;
    }

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

    public getDepthInMeters = (x: number, y: number): number | null => {
        if (!this._cachedDepthInfo) {
            return null;
        }

        const cpuDepthInfo = this._cachedDepthInfo as XRCPUDepthInformation;
        if (!cpuDepthInfo.getDepthInMeters) {
            return null;
        }

        return cpuDepthInfo.getDepthInMeters(x, y);
    };

    private _latestDepthImageTexture?: BaseTexture;

    public get latestDepthImageTexture(): BaseTexture | null {
        if (!this._latestDepthImageTexture) {
            return null;
        }
        return this._latestDepthImageTexture;
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
        this._latestDepthImageTexture?.dispose();
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
                    this._processCPUDepthInformation(_xrFrame, view, this.depthDataFormat);
                    break;

                case "gpu-optimized":
                    if (!this._glBinding) {
                        break;
                    }

                    this._processWebGLDepthInformation(this._glBinding, view);
                    break;

                default:
                    Tools.Error("Unknown depth usage");
            }
        }
    }

    private _processCPUDepthInformation(frame: XRFrame, view: XRView, dataFormat: XRDepthDataFormat): void {
        const depthInfo = frame.getDepthInformation(view);
        if (depthInfo === null) {
            return;
        }

        const cpuDepthInfo = depthInfo as XRCPUDepthInformation;
        const texture = WebXRDepthSensing._GenerateTextureFromCPUDepthInformation(cpuDepthInfo, dataFormat, this._xrSessionManager.scene);
        if (texture === null) {
            return;
        }

        this._cachedDepthInfo = cpuDepthInfo;
        this._latestDepthImageTexture = texture;
    }

    private static _GenerateTextureFromCPUDepthInformation(depthInfo: XRCPUDepthInformation, dataFormat: XRDepthDataFormat, scene: Scene): RawTexture | null {
        switch (dataFormat) {
            case "luminance-alpha":
                return RawTexture.CreateLuminanceAlphaTexture(new Uint16Array(depthInfo.data), depthInfo.width, depthInfo.height, scene);
            case "float32":
                return RawTexture.CreateRGBATexture(new Float32Array(depthInfo.data), depthInfo.width, depthInfo.height, scene);
            default:
                Tools.Error("unknown data format");
                return null;
        }
    }

    private _processWebGLDepthInformation(webglBinding: XRWebGLBinding, view: XRView): void {
        const depthInfo = webglBinding.getDepthInformation(view);
        if (depthInfo === null) {
            return;
        }

        const webglDepthInfo = depthInfo as XRWebGLDepthInformation;
        const texture = WebXRDepthSensing._GenerateTextureFromWebGLDepthInformation(webglDepthInfo, this._xrSessionManager.scene);

        this._latestDepthImageTexture = texture;
        this._cachedDepthInfo = webglDepthInfo;
    }

    private static _GenerateTextureFromWebGLDepthInformation(depthInfo: XRWebGLDepthInformation, scene: Scene): BaseTexture {
        const engine = scene.getEngine();
        const internalTexture = engine.wrapWebGLTexture(depthInfo.texture);
        const baseTexture = new BaseTexture(engine, internalTexture);
        return baseTexture;
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


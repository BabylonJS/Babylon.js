import { WebXRFeatureName, WebXRFeaturesManager } from "./../webXRFeaturesManager";
import { Observable } from "../../Misc/observable";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { Tools } from "../../Misc/tools";

/**
 *
 */
export interface IWebXRDepthSensingOptions {
    /**
     *
     */
    usagePreference: XRDepthUsage[];
    /**
     *
     */
    dataFormatPreference: XRDepthDataFormat[];
}

/**
 *
 */
export class WebXRDepthSensing extends WebXRAbstractFeature {
    /**
     *
     */
    public onCPUDepthInformationObservable: Observable<XRCPUDepthInformation> = new Observable();

    /**
     *
     */
    public onWebGLDepthInformationObservable: Observable<XRWebGLDepthInformation> = new Observable();

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
        Tools.Warn("dom-overlay is an experimental and unstable feature.");
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public attach(force?: boolean | undefined): boolean {
        super.attach(force);
        // todo

        this._glBinding = new XRWebGLBinding(this._xrSessionManager.session, this._xrSessionManager.scene.getEngine()._gl);

        return true;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        this.onCPUDepthInformationObservable.clear();
        this.onWebGLDepthInformationObservable.clear();
    }

    protected _onXRFrame(_xrFrame: XRFrame): void {
        const referenceSPace = this._xrSessionManager.referenceSpace;

        const pose = _xrFrame.getViewerPose(referenceSPace);
        if (pose == null) {
            return;
        }

        for (const view of pose.views) {
            const depthUsage = this._xrSessionManager.session.depthUsage;
            switch (depthUsage) {
                case "cpu-optimized":
                    this._getAndNotifyCPUDepthInformation(_xrFrame, view);
                    break;

                case "gpu-optimized":
                    if (this._glBinding == null) {
                        const context = this._xrSessionManager.scene.getEngine()._gl;
                        this._glBinding = new XRWebGLBinding(this._xrSessionManager.session, context);
                    }

                    this._getAndNotifyWebGLDepthInformation(_xrFrame, view, this._glBinding);
                    break;

                default:
                    Tools.Error("Unknown depth usage");
            }
        }
    }

    private _getAndNotifyCPUDepthInformation(frame: XRFrame, view: XRView): void {
        const cpuDepthInfo = frame.getDepthInformation(view);
        if (cpuDepthInfo == null) {
            return;
        }

        this.onCPUDepthInformationObservable.notifyObservers(cpuDepthInfo);
    }

    private _getAndNotifyWebGLDepthInformation(frame: XRFrame, view: XRView, glBinding: XRWebGLBinding): void {
        const webglDepthInfo = glBinding.getDepthInformation(view);
        if (webglDepthInfo == null) {
            return;
        }

        this.onWebGLDepthInformationObservable.notifyObservers(webglDepthInfo);
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

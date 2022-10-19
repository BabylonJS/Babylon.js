import type { Observable } from "../../Misc/observable";
import type { WebXRSessionManager } from "core/XR";
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
    public onCPUDepthInformationObservable: Observable<XRCPUDepthInformation>;

    /**
     *
     */
    public onWebGLDepthInformationObservable: Observable<XRWebGLDepthInformation>;

    private _glBinding?: XRWebGLBinding;

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
}

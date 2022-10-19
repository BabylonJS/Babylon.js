import { Observable } from '../../Misc/observable';
import { WebXRSessionManager } from 'core/XR';
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { Tools } from "../../Misc/tools"

export interface IWebXRDepthSensingOptions {
  usagePreference: XRDepthUsage[];
  dataFormatPreference: XRDepthDataFormat[];
}

export class WebXRDepthSensing extends WebXRAbstractFeature {

  public onCPUDepthInformationObservable: Observable<XRCPUDepthInformation>;

  public onWebGLDepthInformationObservable: Observable<XRWebGLDepthInformation>;

  private _glBinding?: XRWebGLBinding;

  constructor(
    _xrSessionManager: WebXRSessionManager,
    public readonly options: IWebXRDepthSensingOptions
  ) {
    super(_xrSessionManager);
    this.xrNativeFeatureName = "depth-sensing";

    // https://immersive-web.github.io/depth-sensing/
    Tools.Warn("dom-overlay is an experimental and unstable feature.");

  }

  public attach(force?: boolean | undefined): boolean {
    super.attach(force);
    // todo

    this._glBinding = new XRWebGLBinding(
      this._xrSessionManager.session,
      this._xrSessionManager.scene.getEngine()._gl
    );

    return true;
  }

  protected _onXRFrame(_xrFrame: XRFrame): void {
    const referenceSPace = this._xrSessionManager.referenceSpace;

    const pose = _xrFrame.getViewerPose(referenceSPace)
    if (pose == null) {
      return;
    }

    for (const view of pose.views) {
      const depthUsage = this._xrSessionManager.session.depthUsage;
      switch (depthUsage) {
        case "cpu-optimized":
          const cpuDepthInfo = _xrFrame.getDepthInformation(view);
          if (cpuDepthInfo != null) {

            this.onCPUDepthInformationObservable.notifyObservers(cpuDepthInfo);
          }

          break;

        case "gpu-optimized":
          if (this._glBinding == null) {
            const context = this._xrSessionManager.scene.getEngine()._gl;
            this._glBinding = new XRWebGLBinding(this._xrSessionManager.session, context);
          }

          const webglDepthInfo = this._glBinding.getDepthInformation(view);
          if (webglDepthInfo != null) {
            this.onWebGLDepthInformationObservable.notifyObservers(webglDepthInfo);
          }
          break;
        
        default:
          Tools.Error("Unknown depth usage");
      }
    }

  }
}



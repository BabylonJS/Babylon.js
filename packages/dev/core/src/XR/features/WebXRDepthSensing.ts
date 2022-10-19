import { WebXRSessionManager } from 'core/XR';
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { Tools } from "../../Misc/tools"

export interface IWebXRDepthSensingOptions {
  usagePreference: XRDepthUsage[];
  dataFormatPreference: XRDepthDataFormat[];
}

export class WebXRDepthSensing extends WebXRAbstractFeature {

  constructor(
    _xrSessionManager: WebXRSessionManager,
    public readonly options: IWebXRDepthSensingOptions
  ) {
    super(_xrSessionManager);
    this.xrNativeFeatureName = "depth-sensing";

    // https://immersive-web.github.io/depth-sensing/
    Tools.Warn("dom-overlay is an experimental and unstable feature.");

  }

  protected _onXRFrame(_xrFrame: XRFrame): void {
    throw new Error("Method not implemented.");
  }

}
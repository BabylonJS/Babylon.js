import { Nullable } from "../types";
import { IDisposable } from "../scene";

/**
 * States of the webXR experience
 */
export enum WebXRState {
    /**
     * Transitioning to being in XR mode
     */
    ENTERING_XR,
    /**
     * Transitioning to non XR mode
     */
    EXITING_XR,
    /**
     * In XR mode and presenting
     */
    IN_XR,
    /**
     * Not entered XR mode
     */
    NOT_IN_XR,
}

/**
 * Abstraction of the XR render target
 */
export interface WebXRRenderTarget extends IDisposable {
    /**
     * xrpresent context of the canvas which can be used to display/mirror xr content
     */
    canvasContext: WebGLRenderingContext;

    /**
     * xr layer for the canvas
     */
    xrLayer: Nullable<XRWebGLLayer>;

    /**
     * Initializes the xr layer for the session
     * @param xrSession xr session
     * @returns a promise that will resolve once the XR Layer has been created
     */
    initializeXRLayerAsync(xrSession: XRSession): Promise<XRWebGLLayer>;
}

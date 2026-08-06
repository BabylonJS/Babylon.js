import { type Nullable } from "../types";
import { type IDisposable } from "../scene";

/**
 * States of the webXR experience
 */
export const enum WebXRState {
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
 * The state of the XR camera's tracking
 */
export const enum WebXRTrackingState {
    /**
     * No transformation received, device is not being tracked
     */
    NOT_TRACKING,
    /**
     * Tracking lost - using emulated position
     */
    TRACKING_LOST,
    /**
     * Transformation tracking works normally
     */
    TRACKING,
}

/**
 * Abstraction of the XR render target.
 * The type parameters default to the WebGL context/layer types, so `WebXRRenderTarget`
 * used without type arguments keeps the exact same shape as before. A non-WebGL backend
 * (e.g. a future WebGPU/XRGPUBinding target) can specialize the context and layer types.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface WebXRRenderTarget<TContext = WebGLRenderingContext, TLayer extends XRLayer = XRWebGLLayer> extends IDisposable {
    /**
     * xrpresent context of the canvas which can be used to display/mirror xr content
     */
    canvasContext: TContext;

    /**
     * xr layer for the canvas
     */
    xrLayer: Nullable<TLayer>;

    /**
     * Initializes an XR layer to be used as the session's baseLayer.
     * @param xrSession xr session
     * @returns a promise that will resolve once the XR Layer has been created
     */
    initializeXRLayerAsync(xrSession: XRSession): Promise<TLayer>;
}

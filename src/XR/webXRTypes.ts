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
 * The state of the XR camera's tracking
 */
export enum WebXRTrackingState {
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
    TRACKING
}

/**
 * Wrapper over XRWebGLLayer and XRCompositionLayer.
 */
export class WebXRLayerWrapper {
    private constructor(
        /** The width of the layer's framebuffer. */
        public getWidth: () => number,
        /** The height of the layer's framebuffer. */
        public getHeight: () => number,
        /** The layer's framebuffer. */
        public getFramebuffer: () => WebGLFramebuffer,
        /**
         * Gets the XRWebGLSubImage corresponding to the supplied view.
         * Note that this method is only supported on WebXRLayerWrappers
         * that are wrapped around a projection layer.
         */
        public getViewSubImage: (view: XRView) => XRWebGLSubImage,
        /** The XR layer that this WebXRLayerWrapper wraps. */
        public readonly layer: XRWebGLLayer | XRCompositionLayer,
        /** Whether the xr layer being wrapped inherits from XRCompositionLayer */
        public readonly isCompositionLayer: boolean = false) {}

    /**
     * Creates a WebXRLayerWrapper that wraps around an XRWebGLLayer.
     * @param layer is the layer to be wrapped.
     * @returns a new WebXRLayerWrapper wrapping the provided XRWebGLLayer.
     */
    public static CreateFromXRWebGLLayer(layer: XRWebGLLayer): WebXRLayerWrapper {
        return new WebXRLayerWrapper(
            () => layer.framebufferWidth,
            () => layer.framebufferHeight,
            () => layer.framebuffer,
            (view: XRView) => { throw new Error("Not supported for XRWebGLLayer"); },
            layer,
            false);
    }

    /**
     * Creates a WebXRLayerWrapper that wraps around an XRProjectionLayer.
     * @param layer is the layer to be wrapped.
     * @param framebuffer is the framebuffer to use for the XRProjectionLayer.
     * @param xrGLBinding is the XRWebGLBinding used to create the XRProjectionLayer.
     * @returns a new WebXRLayerWrapper wrapping the provided XRProjectionLayer.
     */
    public static CreateFromXRProjectionLayer(
        layer: XRProjectionLayer,
        framebuffer: WebGLFramebuffer,
        xrGLBinding: XRWebGLBinding): WebXRLayerWrapper {
        return new WebXRLayerWrapper(
            () => layer.textureWidth,
            () => layer.textureHeight,
            () => framebuffer,
            (view: XRView) => xrGLBinding.getViewSubImage(layer, view),
            layer,
            true);
    }
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
    xrLayer: Nullable<WebXRLayerWrapper>;

    /**
     * Initializes the xr layer for the session
     * @param xrSession xr session
     * @returns a promise that will resolve once the XR Layer has been created
     */
    initializeXRLayerAsync(xrSession: XRSession): Promise<WebXRLayerWrapper>;
}
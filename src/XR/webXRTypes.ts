import { Nullable } from "../types";
import { IDisposable } from "../scene";
import { WebXRLayers } from "./features/WebXRLayers";

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
 * A partial version of XRRenderStateInit that only contains relevant data for xr session layers.
 */
export interface WebXRLayerRenderStateInit {
    /** An XRWebGLLayer from which the XR compositor will obtain images */
    baseLayer?: XRWebGLLayer;
    /**
     * An ordered array containing XRLayer objects that are displayed by the XR compositor.
     * The order of the layers is "back-to-front".
     */
    layers?: XRLayer[];
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
    xrLayer: Nullable<XRLayer>;

    /**
     * Initializes a XRWebGLLayer to be used as the session's baseLayer.
     * Note that this method is deprecated in favor of initializeXRLayerRenderStateAsync.
     * @param xrSession xr session
     * @returns a promise that will resolve once the XR Layer has been created
     */
    initializeXRLayerAsync(xrSession: XRSession): Promise<XRWebGLLayer>;

    /**
     * Creates a WebXRLayerRenderStateInit with baseLayer and layers properties filled in.
     * If you provide an instance of WebXRLayers, the layers property will be filled in with an XRProjectionLayer.
     * If no instance of WebXRLayers is provided, the baseLayer property will be filled in with an XRWebGLLayer.
     * @param xrSession xr session
     * @param layersFeature an instance of the WebXRLayers feature created by the features manager
     * @returns a promise that will resolve to the partial render state once the XR layer has been created
     */
    initializeXRLayerRenderStateAsync(xrSession: XRSession, layersFeature?: WebXRLayers): Promise<WebXRLayerRenderStateInit>;
}
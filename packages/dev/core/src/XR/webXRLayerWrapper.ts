import { type Nullable } from "../types";
import { type WebXRLayerRenderTargetTextureProvider } from "./webXRRenderTargetTextureProvider";
import { type WebXRSessionManager } from "./webXRSessionManager";

/** Covers all supported subclasses of WebXR's XRCompositionLayer */
export type WebXRCompositionLayerType = "XRProjectionLayer";

/**
 * The quad-layer type name.
 */
export type WebXRQuadLayerType = "XRQuadLayer";

/** Covers all supported subclasses of WebXR's XRLayer */
export type WebXRLayerType = "XRWebGLLayer" | WebXRCompositionLayerType | WebXRQuadLayerType;

/** Covers the spatial composition-layer types supported by WebXRLayers. */
export type WebXRSpatialLayerType = WebXRQuadLayerType | "XRCylinderLayer" | "XREquirectLayer" | "XRCubeLayer";

/** Covers every native layer type supported by Babylon.js. */
export type WebXRSupportedLayerType = WebXRLayerType | WebXRSpatialLayerType;

/**
 * Wrapper over subclasses of XRLayer.
 * @internal
 */
export class WebXRLayerWrapper<LayerTypeT extends WebXRSupportedLayerType = WebXRLayerType> {
    private _rttWrapper: Nullable<WebXRLayerRenderTargetTextureProvider<LayerTypeT>> = null;

    /**
     * The render target provider created for this layer, or `null` until one is created.
     */
    public get renderTargetTextureProvider(): Nullable<WebXRLayerRenderTargetTextureProvider<LayerTypeT>> {
        return this._rttWrapper;
    }
    /**
     * Check if fixed foveation is supported on this device
     */
    public get isFixedFoveationSupported(): boolean {
        return this.layerType == "XRWebGLLayer" && typeof (this.layer as XRWebGLLayer).fixedFoveation == "number";
    }

    /**
     * Get the fixed foveation currently set, as specified by the webxr specs
     * If this returns null, then fixed foveation is not supported
     */
    public get fixedFoveation(): Nullable<number> {
        if (this.isFixedFoveationSupported) {
            return (this.layer as XRWebGLLayer).fixedFoveation!;
        }
        return null;
    }

    /**
     * Set the fixed foveation to the specified value, as specified by the webxr specs
     * This value will be normalized to be between 0 and 1, 1 being max foveation, 0 being no foveation
     */
    public set fixedFoveation(value: Nullable<number>) {
        if (this.isFixedFoveationSupported) {
            const val = Math.max(0, Math.min(1, value || 0));
            (this.layer as XRWebGLLayer).fixedFoveation = val;
        }
    }

    /**
     * Create a render target provider for the wrapped layer.
     * @param xrSessionManager The XR Session Manager
     * @returns A new render target texture provider for the wrapped layer.
     */
    public createRenderTargetTextureProvider(xrSessionManager: WebXRSessionManager): WebXRLayerRenderTargetTextureProvider<LayerTypeT> {
        this._rttWrapper = this._createRenderTargetTextureProvider(xrSessionManager);
        return this._rttWrapper;
    }

    /**
     * Disposes the render target provider created for this layer.
     */
    public dispose(): void {
        if (this._rttWrapper) {
            this._rttWrapper.dispose();
            this._rttWrapper = null;
        }
    }

    protected constructor(
        /** The width of the layer's framebuffer. */
        public getWidth: () => number,
        /** The height of the layer's framebuffer. */
        public getHeight: () => number,
        /** The XR layer that this WebXRLayerWrapper wraps. */
        public readonly layer: XRLayer,
        /** The type of XR layer that is being wrapped. */
        public readonly layerType: LayerTypeT,
        /** Create a render target provider for the wrapped layer. */
        private _createRenderTargetTextureProvider: (xrSessionManager: WebXRSessionManager) => WebXRLayerRenderTargetTextureProvider<LayerTypeT>
    ) {}
}

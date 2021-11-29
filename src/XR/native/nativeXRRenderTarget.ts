import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { Viewport } from "../../Maths/math.viewport";
import { Nullable } from "../../types";
import { WebXRLayers } from "../features/WebXRLayers";
import { WebXRLayerWrapper, WebXRLayerWrapperProvider } from "../webXRLayerWrapper";
import { WebXRRenderTargetProvider } from "../webXRRenderTargetProvider";
import { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRLayerRenderStateInit, WebXRRenderTarget } from "../webXRTypes";

/** @hidden */
export class NativeXRLayerRenderTargetProvider extends WebXRRenderTargetProvider {
    private _nativeRTTProvider: WebXRRenderTargetProvider;

    constructor(sessionManager: WebXRSessionManager, private readonly _layer: XRWebGLLayer) {
        super(sessionManager.scene, _layer);
        this._nativeRTTProvider = (navigator as any).xr.getNativeRenderTargetProvider(sessionManager.session, this._createRenderTargetTexture.bind(this), this._destroyRenderTargetTexture.bind(this));
    }

    public trySetViewportForView(viewport: Viewport, view: XRView): boolean {
        viewport.x = 0;
        viewport.y = 0;
        viewport.width = 1;
        viewport.height = 1;
        return true;
    }

    public getRenderTargetForEye(eye: XREye): Nullable<RenderTargetTexture> {
        return this._nativeRTTProvider.getRenderTargetForEye(eye);
    }

    public getRenderTargetForView(view: XRView): Nullable<RenderTargetTexture> {
        return this._nativeRTTProvider.getRenderTargetForEye(view.eye);
    }

    public getFramebufferDimensions(): Nullable<{ framebufferWidth: number; framebufferHeight: number; }> {
        return { framebufferWidth: this._layer.framebufferWidth, framebufferHeight: this._layer.framebufferHeight };
    }
}

/** @hidden */
export class NativeXRRenderTarget implements WebXRRenderTarget, WebXRLayerWrapperProvider {
    public canvasContext: WebGLRenderingContext;
    public xrLayer: Nullable<XRLayer>;

    private _nativeRenderTarget: WebXRRenderTarget;

    constructor(private readonly _xrSessionManager: WebXRSessionManager) {
        this._nativeRenderTarget = (navigator as any).xr.getWebXRRenderTarget(_xrSessionManager.scene.getEngine());
        this._xrSessionManager._addLayerWrapperProvider(this);
    }

    public async initializeXRLayerAsync(xrSession: XRSession): Promise<XRWebGLLayer> {
        this.xrLayer = (await this.initializeXRLayerRenderStateAsync(xrSession)).baseLayer!;
        return this.xrLayer as XRWebGLLayer;
    }

    public async initializeXRLayerRenderStateAsync(xrSession: XRSession, layersFeature?: WebXRLayers): Promise<WebXRLayerRenderStateInit> {
        await this._nativeRenderTarget.initializeXRLayerAsync(xrSession);
        this.xrLayer = this._nativeRenderTarget.xrLayer;
        return {
            baseLayer: this.xrLayer as XRWebGLLayer
        };
    }

    public createLayerWrapper(layer: XRWebGLLayer): Nullable<WebXRLayerWrapper> {
        if (layer === this.xrLayer) {
            return new WebXRLayerWrapper(
                () => layer.framebufferWidth,
                () => layer.framebufferHeight,
                layer,
                'XRWebGLLayer',
                (sessionManager) => new NativeXRLayerRenderTargetProvider(sessionManager, layer));
        }
        return null;
    }

    dispose(): void {
        this._xrSessionManager._removeLayerWrapperProvider(this);
    }
}
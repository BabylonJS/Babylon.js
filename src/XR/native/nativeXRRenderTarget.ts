import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { Viewport } from "../../Maths/math.viewport";
import { Nullable } from "../../types";
import { WebXRLayerWrapper } from "../webXRLayerWrapper";
import { WebXRLayerRenderTargetTextureProvider } from "../webXRRenderTargetTextureProvider";
import { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRRenderTarget } from "../webXRTypes";

/**
 * Wraps XRWebGLLayer's created by Babylon Native.
 * @hidden
 */
export class NativeXRLayerWrapper extends WebXRLayerWrapper {
    constructor(public readonly layer: XRWebGLLayer) {
        super(
            () => layer.framebufferWidth,
            () => layer.framebufferHeight,
            layer,
            'XRWebGLLayer',
            (sessionManager) => new NativeXRLayerRenderTargetTextureProvider(sessionManager, this));
    }
}

/**
 * Provides render target textures for layers created by Babylon Native.
 * @hidden
 */
export class NativeXRLayerRenderTargetTextureProvider extends WebXRLayerRenderTargetTextureProvider {
    private _nativeRTTProvider: WebXRLayerRenderTargetTextureProvider;
    private _nativeLayer: XRWebGLLayer;

    constructor(sessionManager: WebXRSessionManager, public readonly layerWrapper: NativeXRLayerWrapper) {
        super(sessionManager.scene, layerWrapper);
        this._nativeRTTProvider = (navigator as any).xr.getNativeRenderTargetProvider(sessionManager.session, this._createRenderTargetTexture.bind(this), this._destroyRenderTargetTexture.bind(this));
        this._nativeLayer = layerWrapper.layer;
    }

    public trySetViewportForView(viewport: Viewport): boolean {
        viewport.x = 0;
        viewport.y = 0;
        viewport.width = 1;
        viewport.height = 1;
        return true;
    }

    public getRenderTargetTextureForEye(eye: XREye): Nullable<RenderTargetTexture> {
        // TODO (rgerd): Update the contract on the BabylonNative side to call this "getRenderTargetTextureForEye"
        return (this._nativeRTTProvider as any).getRenderTargetForEye(eye);
    }

    public getRenderTargetTextureForView(view: XRView): Nullable<RenderTargetTexture> {
        return (this._nativeRTTProvider as any).getRenderTargetForEye(view.eye);
    }

    public getFramebufferDimensions(): Nullable<{ framebufferWidth: number; framebufferHeight: number; }> {
        return {
            framebufferWidth: this._nativeLayer.framebufferWidth,
            framebufferHeight: this._nativeLayer.framebufferHeight
        };
    }
}

/**
 * Creates the xr layer that will be used as the xr session's base layer.
 * @hidden
 */
export class NativeXRRenderTarget implements WebXRRenderTarget {
    public canvasContext: WebGLRenderingContext;
    public xrLayer: Nullable<XRWebGLLayer>;

    private _nativeRenderTarget: WebXRRenderTarget;

    constructor(_xrSessionManager: WebXRSessionManager) {
        this._nativeRenderTarget = (navigator as any).xr.getWebXRRenderTarget(_xrSessionManager.scene.getEngine());
    }

    public async initializeXRLayerAsync(xrSession: XRSession): Promise<XRWebGLLayer> {
        await this._nativeRenderTarget.initializeXRLayerAsync(xrSession);
        this.xrLayer = this._nativeRenderTarget.xrLayer!;
        return this.xrLayer;
    }

    dispose(): void {
        /* empty */
    }
}
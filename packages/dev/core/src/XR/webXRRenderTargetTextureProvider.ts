import { type AbstractEngine } from "../Engines/abstractEngine";
import { type InternalTexture } from "../Materials/Textures/internalTexture";
import { MultiviewRenderTarget } from "../Materials/Textures/MultiviewRenderTarget";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.pure";
import { type Viewport } from "../Maths/math.viewport";
import { type IDisposable, type Scene } from "../scene";
import { type Nullable } from "../types";
import { type WebXRLayerWrapper } from "./webXRLayerWrapper";

/**
 * An interface for objects that provide render target textures for XR rendering.
 */
export interface IWebXRRenderTargetTextureProvider extends IDisposable {
    /**
     * Attempts to set the framebuffer-size-normalized viewport to be rendered this frame for this view.
     * In the event of a failure, the supplied viewport is not updated.
     * @param viewport the viewport to which the view will be rendered
     * @param view the view for which to set the viewport
     * @returns whether the operation was successful
     */
    trySetViewportForView(viewport: Viewport, view: XRView): boolean;
    /**
     * Gets the correct render target texture to be rendered this frame for this eye
     * @param eye the eye for which to get the render target
     * @returns the render target for the specified eye or null if not available
     */
    getRenderTargetTextureForEye(eye: XREye): Nullable<RenderTargetTexture>;
    /**
     * Gets the correct render target texture to be rendered this frame for this view
     * @param view the view for which to get the render target
     * @returns the render target for the specified view or null if not available
     */
    getRenderTargetTextureForView(view: XRView): Nullable<RenderTargetTexture>;
}

/**
 * Provides render target textures and other important rendering information for a given XRLayer.
 * @internal
 */
export abstract class WebXRLayerRenderTargetTextureProvider implements IWebXRRenderTargetTextureProvider {
    public abstract trySetViewportForView(viewport: Viewport, view: XRView): boolean;
    public abstract getRenderTargetTextureForEye(eye: XREye): Nullable<RenderTargetTexture>;
    public abstract getRenderTargetTextureForView(view: XRView): Nullable<RenderTargetTexture>;

    protected _renderTargetTextures = new Array<RenderTargetTexture>();
    protected _framebufferDimensions: Nullable<{ framebufferWidth: number; framebufferHeight: number }>;

    protected _engine: AbstractEngine;

    constructor(
        private readonly _scene: Scene,
        public readonly layerWrapper: WebXRLayerWrapper
    ) {
        this._engine = _scene.getEngine();
    }

    /**
     * Creates the render target texture "shell" (with the correct multiview type and MSAA sample count)
     * without attaching any graphics-API-specific resource. Subclasses attach their own textures.
     * @param width the width of the render target
     * @param height the height of the render target
     * @param multiview whether the render target should be a multiview render target
     * @returns the created (but not yet registered) render target texture
     */
    protected _createRenderTargetTextureShell(width: number, height: number, multiview: boolean): RenderTargetTexture {
        const textureSize = { width, height };
        const renderTargetTexture = multiview ? new MultiviewRenderTarget(this._scene, textureSize) : new RenderTargetTexture("XR renderTargetTexture", textureSize, this._scene);
        renderTargetTexture.renderTarget!._samples = renderTargetTexture.samples;
        return renderTargetTexture;
    }

    /**
     * Builds a render target texture from already-wrapped internal textures, without referencing any
     * graphics-API-specific type. A GPU-based backend (e.g. WebGPU / XRGPUBinding) wraps its native
     * textures with the engine and calls this hook; the WebGL backend has its own typed entry point.
     * @param width the width of the render target
     * @param height the height of the render target
     * @param colorTexture the internal texture to use as the color attachment, if any
     * @param depthStencilTexture the internal texture to use as the depth/stencil attachment, if any
     * @param multiview whether the render target should be a multiview render target
     * @returns the created render target texture
     */
    protected _createRenderTargetTextureInternal(
        width: number,
        height: number,
        colorTexture: Nullable<InternalTexture>,
        depthStencilTexture: Nullable<InternalTexture>,
        multiview: boolean
    ): RenderTargetTexture {
        const renderTargetTexture = this._createRenderTargetTextureShell(width, height, multiview);
        const renderTargetWrapper = renderTargetTexture.renderTarget!;

        if (colorTexture) {
            renderTargetWrapper.setTexture(colorTexture, 0);
            renderTargetTexture._texture = colorTexture;
        }

        if (depthStencilTexture) {
            renderTargetWrapper._depthStencilTexture = depthStencilTexture;
        }

        renderTargetTexture.disableRescaling();

        this._renderTargetTextures.push(renderTargetTexture);

        return renderTargetTexture;
    }

    protected _destroyRenderTargetTexture(renderTargetTexture: RenderTargetTexture) {
        this._renderTargetTextures.splice(this._renderTargetTextures.indexOf(renderTargetTexture), 1);
        renderTargetTexture.dispose();
    }

    public getFramebufferDimensions(): Nullable<{ framebufferWidth: number; framebufferHeight: number }> {
        return this._framebufferDimensions;
    }

    public dispose() {
        for (const rtt of this._renderTargetTextures) {
            rtt.dispose();
        }
        this._renderTargetTextures.length = 0;
    }
}

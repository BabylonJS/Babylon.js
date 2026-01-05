import type { Engine } from "../Engines/engine";
import { WebGLHardwareTexture } from "../Engines/WebGL/webGLHardwareTexture";
import type { WebGLRenderTargetWrapper } from "../Engines/WebGL/webGLRenderTargetWrapper";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { MultiviewRenderTarget } from "../Materials/Textures/MultiviewRenderTarget";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { Viewport } from "../Maths/math.viewport";
import type { IDisposable, Scene } from "../scene";
import type { Nullable } from "../types";
import type { WebXRLayerWrapper } from "./webXRLayerWrapper";

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

    private _engine: Engine;

    constructor(
        private readonly _scene: Scene,
        public readonly layerWrapper: WebXRLayerWrapper
    ) {
        this._engine = _scene.getEngine() as Engine;
    }

    private _createInternalTexture(textureSize: { width: number; height: number }, texture: WebGLTexture): InternalTexture {
        const internalTexture = new InternalTexture(this._engine, InternalTextureSource.Unknown, true);
        internalTexture.width = textureSize.width;
        internalTexture.height = textureSize.height;
        internalTexture._hardwareTexture = new WebGLHardwareTexture(texture, this._engine._gl);
        internalTexture.isReady = true;
        return internalTexture;
    }

    protected _createRenderTargetTexture(
        width: number,
        height: number,
        framebuffer: Nullable<WebGLFramebuffer>,
        colorTexture?: WebGLTexture,
        depthStencilTexture?: WebGLTexture,
        multiview?: boolean
    ): RenderTargetTexture {
        if (!this._engine) {
            throw new Error("Engine is disposed");
        }

        const textureSize = { width, height };

        // Create render target texture from the internal texture
        const renderTargetTexture = multiview ? new MultiviewRenderTarget(this._scene, textureSize) : new RenderTargetTexture("XR renderTargetTexture", textureSize, this._scene);
        const renderTargetWrapper = renderTargetTexture.renderTarget as WebGLRenderTargetWrapper;
        renderTargetWrapper._samples = renderTargetTexture.samples;
        // Set the framebuffer, make sure it works in all scenarios - emulator, no layers and layers
        if (framebuffer || !colorTexture) {
            renderTargetWrapper._framebuffer = framebuffer;
        }

        // Create internal texture
        if (colorTexture) {
            if (multiview) {
                renderTargetWrapper._colorTextureArray = colorTexture;
            } else {
                const internalTexture = this._createInternalTexture(textureSize, colorTexture);
                renderTargetWrapper.setTexture(internalTexture, 0);
                renderTargetTexture._texture = internalTexture;
            }
        }

        if (depthStencilTexture) {
            if (multiview) {
                renderTargetWrapper._depthStencilTextureArray = depthStencilTexture;
            } else {
                renderTargetWrapper._depthStencilTexture = this._createInternalTexture(textureSize, depthStencilTexture);
            }
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

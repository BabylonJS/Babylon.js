import { WebGLHardwareTexture } from "../Engines/WebGL/webGLHardwareTexture";
import { WebGLRenderTargetWrapper } from "../Engines/WebGL/webGLRenderTargetWrapper";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Viewport } from "../Maths/math.viewport";
import { IDisposable, Scene } from "../scene";
import { Nullable } from "../types";
import { WebXRLayerWrapper } from "./webXRLayerWrapper";

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
 * @hidden
 */
export abstract class WebXRLayerRenderTargetTextureProvider implements IWebXRRenderTargetTextureProvider {
    public abstract trySetViewportForView(viewport: Viewport, view: XRView): boolean;
    public abstract getRenderTargetTextureForEye(eye: XREye): Nullable<RenderTargetTexture>;
    public abstract getRenderTargetTextureForView(view: XRView): Nullable<RenderTargetTexture>;

    protected _renderTargetTextures = new Array<RenderTargetTexture>();
    protected _framebufferDimensions: Nullable<{ framebufferWidth: number, framebufferHeight: number }>;

    constructor(
        private readonly _scene: Scene,
        public readonly layerWrapper: WebXRLayerWrapper) { }

    protected _createRenderTargetTexture(
        width: number,
        height: number,
        framebuffer: Nullable<WebGLFramebuffer>,
        colorTexture?: WebGLHardwareTexture,
        depthStencilTexture?: WebGLHardwareTexture): RenderTargetTexture {
        const engine = this._scene.getEngine();
        if (!engine) {
            throw new Error("Engine is disposed");
        }

        // Create render target texture from the internal texture
        const renderTargetTexture = new RenderTargetTexture("XR renderTargetTexture", { width, height }, this._scene);
        const renderTargetWrapper = renderTargetTexture.renderTarget!;
        (renderTargetWrapper as WebGLRenderTargetWrapper)._framebuffer = framebuffer;

        // Create internal texture
        const internalTexture = new InternalTexture(engine, InternalTextureSource.Unknown, true);
        internalTexture.width = width;
        internalTexture.height = height;
        if (!!colorTexture) {
            internalTexture._hardwareTexture = colorTexture;
        }
        renderTargetWrapper.setTexture(internalTexture, 0);
        renderTargetTexture._texture = internalTexture;

        if (!!depthStencilTexture) {
            const internalDSTexture = new InternalTexture(engine, InternalTextureSource.DepthStencil, true);
            internalDSTexture.width = width;
            internalDSTexture.height = height;
            internalDSTexture._hardwareTexture = depthStencilTexture;
            renderTargetWrapper._depthStencilTexture = internalDSTexture;
        }

        renderTargetTexture.disableRescaling();
        // Firefox reality fails if skipInitialClear is set to true, so make sure only modern XR implementations set it.
        if (typeof XRWebGLBinding !== "undefined") {
            // WebXR pre-clears textures
            renderTargetTexture.skipInitialClear = true;
        }

        this._renderTargetTextures.push(renderTargetTexture);

        return renderTargetTexture;
    }

    protected _destroyRenderTargetTexture(renderTargetTexture: RenderTargetTexture) {
        this._renderTargetTextures.splice(this._renderTargetTextures.indexOf(renderTargetTexture), 1);
        renderTargetTexture.dispose();
    }

    public getFramebufferDimensions(): Nullable<{ framebufferWidth: number, framebufferHeight: number }> {
        return this._framebufferDimensions;
    }

    public dispose() {
        this._renderTargetTextures.forEach((rtt) => rtt.dispose());
        this._renderTargetTextures.length = 0;
    }
}
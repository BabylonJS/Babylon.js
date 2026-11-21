import { type ThinEngine } from "../Engines/thinEngine";
import { WebGLHardwareTexture } from "../Engines/WebGL/webGLHardwareTexture";
import { type WebGLRenderTargetWrapper } from "../Engines/WebGL/webGLRenderTargetWrapper";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { type RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.pure";
import { type Nullable } from "../types";
import { WebXRLayerRenderTargetTextureProvider } from "./webXRRenderTargetTextureProvider";
import { type WebXRLayerType, type WebXRSupportedLayerType } from "./webXRLayerWrapper";

/**
 * Provides render target textures for WebGL-backed XR layers. Owns all WebGL-specific
 * framebuffer/texture wiring so the base provider can stay graphics-API-agnostic.
 * @internal
 */
export abstract class WebXRWebGLRenderTargetTextureProvider<LayerTypeT extends WebXRSupportedLayerType = WebXRLayerType> extends WebXRLayerRenderTargetTextureProvider<LayerTypeT> {
    private _createInternalTexture(textureSize: { width: number; height: number }, texture: WebGLTexture): InternalTexture {
        const gl = (this._engine as ThinEngine)._gl;
        if (!gl) {
            throw new Error("WebXRWebGLRenderTargetTextureProvider requires a WebGL-capable engine.");
        }
        const internalTexture = new InternalTexture(this._engine, InternalTextureSource.Unknown, true);
        internalTexture.width = textureSize.width;
        internalTexture.height = textureSize.height;
        internalTexture._hardwareTexture = new WebGLHardwareTexture(texture, gl);
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

        const renderTargetTexture = this._createRenderTargetTextureShell(width, height, !!multiview);
        const renderTargetWrapper = renderTargetTexture.renderTarget as WebGLRenderTargetWrapper;
        // The shell comes with GPU objects of its own: a framebuffer and, for multiview, a color and a depth/stencil
        // texture array. Whichever of them is replaced below by the object the XR layer provides is referenced by
        // nothing else afterwards, so it is deleted here. Otherwise it stays allocated until the context is lost.
        const gl = (this._engine as ThinEngine)._gl as Nullable<WebGL2RenderingContext>;
        // Set the framebuffer, make sure it works in all scenarios - emulator, no layers and layers.
        // This must happen before binding any texture, since setTexture binds it to the framebuffer.
        if (framebuffer || !colorTexture) {
            if (gl && renderTargetWrapper._framebuffer && renderTargetWrapper._framebuffer !== framebuffer) {
                gl.deleteFramebuffer(renderTargetWrapper._framebuffer);
            }
            renderTargetWrapper._framebuffer = framebuffer;
        }

        // Create internal texture
        if (colorTexture) {
            if (multiview) {
                if (gl && renderTargetWrapper._colorTextureArray && renderTargetWrapper._colorTextureArray !== colorTexture) {
                    gl.deleteTexture(renderTargetWrapper._colorTextureArray);
                }
                renderTargetWrapper._colorTextureArray = colorTexture;
            } else {
                const internalTexture = this._createInternalTexture(textureSize, colorTexture);
                renderTargetWrapper.setTexture(internalTexture, 0);
                renderTargetTexture._texture = internalTexture;
            }
        }

        if (depthStencilTexture) {
            if (multiview) {
                if (gl && renderTargetWrapper._depthStencilTextureArray && renderTargetWrapper._depthStencilTextureArray !== depthStencilTexture) {
                    gl.deleteTexture(renderTargetWrapper._depthStencilTextureArray);
                }
                renderTargetWrapper._depthStencilTextureArray = depthStencilTexture;
            } else {
                renderTargetWrapper._depthStencilTexture = this._createInternalTexture(textureSize, depthStencilTexture);
            }
        }

        renderTargetTexture.disableRescaling();

        this._renderTargetTextures.push(renderTargetTexture);

        return renderTargetTexture;
    }
}

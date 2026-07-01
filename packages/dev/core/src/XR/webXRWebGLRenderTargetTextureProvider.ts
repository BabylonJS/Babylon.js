import { type ThinEngine } from "../Engines/thinEngine";
import { WebGLHardwareTexture } from "../Engines/WebGL/webGLHardwareTexture";
import { type WebGLRenderTargetWrapper } from "../Engines/WebGL/webGLRenderTargetWrapper";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { type RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.pure";
import { type Nullable } from "../types";
import { WebXRLayerRenderTargetTextureProvider } from "./webXRRenderTargetTextureProvider";

/**
 * Provides render target textures for WebGL-backed XR layers. Owns all WebGL-specific
 * framebuffer/texture wiring so the base provider can stay graphics-API-agnostic.
 * @internal
 */
export abstract class WebXRWebGLRenderTargetTextureProvider extends WebXRLayerRenderTargetTextureProvider {
    private _createInternalTexture(textureSize: { width: number; height: number }, texture: WebGLTexture): InternalTexture {
        const internalTexture = new InternalTexture(this._engine, InternalTextureSource.Unknown, true);
        internalTexture.width = textureSize.width;
        internalTexture.height = textureSize.height;
        internalTexture._hardwareTexture = new WebGLHardwareTexture(texture, (this._engine as ThinEngine)._gl);
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
        // Set the framebuffer, make sure it works in all scenarios - emulator, no layers and layers.
        // This must happen before binding any texture, since setTexture binds it to the framebuffer.
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
}

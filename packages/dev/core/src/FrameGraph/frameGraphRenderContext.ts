// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, DrawWrapper, IColor4Like, Layer, FrameGraphTextureHandle, Effect, FrameGraphTextureManager, RenderTargetTexture } from "core/index";
import { Constants } from "../Engines/constants";
import { EffectRenderer } from "../Materials/effectRenderer";
import { CopyTextureToTexture } from "../Misc/copyTextureToTexture";
import { FrameGraphContext } from "./frameGraphContext";
import { backbufferColorTextureHandle, backbufferDepthStencilTextureHandle } from "./frameGraphTypes";

/**
 * Frame graph context used render passes.
 * @experimental
 */
export class FrameGraphRenderContext extends FrameGraphContext {
    private readonly _effectRenderer: EffectRenderer;
    private _currentRenderTargetHandle: FrameGraphTextureHandle;
    private _debugMessageWhenTargetBound: string | undefined;
    private _debugMessageHasBeenPushed = false;
    private _renderTargetIsBound = true;
    private readonly _copyTexture: CopyTextureToTexture;

    /** @internal */
    constructor(
        private readonly _engine: AbstractEngine,
        private readonly _textureManager: FrameGraphTextureManager
    ) {
        super();
        this._effectRenderer = new EffectRenderer(this._engine);
        this._copyTexture = new CopyTextureToTexture(this._engine);
        this._currentRenderTargetHandle = backbufferColorTextureHandle;
    }

    /**
     * Checks whether a texture handle points to the backbuffer's color or depth texture
     * @param handle The handle to check
     * @returns True if the handle points to the backbuffer's color or depth texture, otherwise false
     */
    public isBackbuffer(handle: FrameGraphTextureHandle): boolean {
        return this._textureManager.isBackbuffer(handle);
    }

    /**
     * Checks whether a texture handle points to the backbuffer's color texture
     * @param handle The handle to check
     * @returns True if the handle points to the backbuffer's color texture, otherwise false
     */
    public isBackbufferColor(handle: FrameGraphTextureHandle): boolean {
        return this._textureManager.isBackbufferColor(handle);
    }

    /**
     * Checks whether a texture handle points to the backbuffer's depth texture
     * @param handle The handle to check
     * @returns True if the handle points to the backbuffer's depth texture, otherwise false
     */
    public isBackbufferDepthStencil(handle: FrameGraphTextureHandle): boolean {
        return this._textureManager.isBackbufferDepthStencil(handle);
    }

    /**
     * Clears the current render buffer or the current render target (if any is set up)
     * @param color Defines the color to use
     * @param backBuffer Defines if the back buffer must be cleared
     * @param depth Defines if the depth buffer must be cleared
     * @param stencil Defines if the stencil buffer must be cleared
     */
    public clear(color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil?: boolean): void {
        this._applyRenderTarget();
        this._engine.clear(color, backBuffer, depth, stencil);
    }

    /**
     * Clears the color attachments of the current render target
     * @param color Defines the color to use
     * @param attachments The attachments to clear
     */
    public clearColorAttachments(color: Nullable<IColor4Like>, attachments: number[]): void {
        this._applyRenderTarget();
        this._engine.bindAttachments(attachments);
        this._engine.clear(color, true, false, false);
    }

    /**
     * Binds the attachments to the current render target
     * @param attachments The attachments to bind
     */
    public bindAttachments(attachments: number[]): void {
        this._applyRenderTarget();
        this._engine.bindAttachments(attachments);
    }

    /**
     * Generates mipmaps for the current render target
     */
    public generateMipMaps(): void {
        const texture = this._textureManager.getTextureFromHandle(this._currentRenderTargetHandle);
        if (!texture) {
            // Texture is backbuffer, no need to generate mipmaps
            return;
        }
        if (this._renderTargetIsBound) {
            // we can't generate the mipmaps if the texture is bound as a render target
            this._flushDebugMessages();
            this._engine.unBindFramebuffer(texture);
            this._renderTargetIsBound = false;
        }
        this._engine.generateMipmaps(texture.texture!);
    }

    /**
     * Sets the texture sampling mode for a given texture handle
     * @param handle Handle of the texture to set the sampling mode for
     * @param samplingMode Sampling mode to set
     */
    public setTextureSamplingMode(handle: FrameGraphTextureHandle, samplingMode: number): void {
        const internalTexture = this._textureManager.getTextureFromHandle(handle)?.texture!;
        if (internalTexture && internalTexture.samplingMode !== samplingMode) {
            this._engine.updateTextureSamplingMode(samplingMode, internalTexture);
        }
    }

    /**
     * Binds a texture handle to a given effect (resolves the handle to a texture and binds it to the effect)
     * @param effect The effect to bind the texture to
     * @param name The name of the texture in the effect
     * @param handle The handle of the texture to bind
     */
    public bindTextureHandle(effect: Effect, name: string, handle: FrameGraphTextureHandle): void {
        const texture = this._textureManager.getTextureFromHandle(handle);
        if (texture) {
            effect._bindTexture(name, texture.texture!);
        }
    }

    /**
     * Sets the depth states for the current render target
     * @param depthTest If true, depth testing is enabled
     * @param depthWrite If true, depth writing is enabled
     */
    public setDepthStates(depthTest: boolean, depthWrite: boolean): void {
        this._engine.setDepthBuffer(depthTest);
        this._engine.setDepthWrite(depthWrite);
    }

    /**
     * Applies a full-screen effect to the current render target
     * @param drawWrapper The draw wrapper containing the effect to apply
     * @param customBindings The custom bindings to use when applying the effect (optional)
     * @returns True if the effect was applied, otherwise false (effect not ready)
     */
    public applyFullScreenEffect(drawWrapper: DrawWrapper, customBindings?: () => void): boolean {
        if (!drawWrapper.effect?.isReady()) {
            return false;
        }

        this._applyRenderTarget();

        const engineDepthMask = this._engine.getDepthWrite(); // for some reasons, depthWrite is not restored by EffectRenderer.restoreStates

        this._effectRenderer.saveStates();
        this._effectRenderer.setViewport();

        this._engine.enableEffect(drawWrapper);
        this._engine.setState(false);
        this._engine.setDepthBuffer(false);
        this._engine.setDepthWrite(false);

        this._effectRenderer.bindBuffers(drawWrapper.effect);
        customBindings?.();
        this._effectRenderer.draw();
        this._effectRenderer.restoreStates();
        this._engine.setDepthWrite(engineDepthMask);
        this._engine.setAlphaMode(Constants.ALPHA_DISABLE);

        return true;
    }

    /**
     * Copies a texture to the current render target
     * @param sourceTexture The source texture to copy from
     * @param forceCopyToBackbuffer If true, the copy will be done to the back buffer regardless of the current render target
     */
    public copyTexture(sourceTexture: FrameGraphTextureHandle, forceCopyToBackbuffer = false): void {
        if (forceCopyToBackbuffer) {
            this._bindRenderTarget();
        }
        this._applyRenderTarget();
        this._copyTexture.copy(this._textureManager.getTextureFromHandle(sourceTexture)!.texture!);
    }

    /**
     * Renders a RenderTargetTexture or a layer
     * @param object The RenderTargetTexture/Layer to render
     */
    public render(object: Layer | RenderTargetTexture): void {
        this._applyRenderTarget();
        object.render();
    }

    /**
     * Binds a render target texture so that upcoming draw calls will render to it
     * Note: it is a lazy operation, so the render target will only be bound when needed. This way, it is possible to call
     *   this method several times with different render targets without incurring the cost of binding if no draw calls are made
     * @internal
     */
    public _bindRenderTarget(renderTargetHandle: FrameGraphTextureHandle = backbufferColorTextureHandle, debugMessage?: string) {
        if (renderTargetHandle === this._currentRenderTargetHandle) {
            this._flushDebugMessages();
            if (debugMessage !== undefined) {
                this._engine._debugPushGroup?.(debugMessage, 2);
                this._debugMessageWhenTargetBound = undefined;
                this._debugMessageHasBeenPushed = true;
            }
            return;
        }
        this._currentRenderTargetHandle = renderTargetHandle;
        this._debugMessageWhenTargetBound = debugMessage;
        this._renderTargetIsBound = false;
    }

    /** @internal */
    public _flushDebugMessages() {
        if (this._debugMessageHasBeenPushed) {
            this._engine._debugPopGroup?.(2);
            this._debugMessageHasBeenPushed = false;
        }
    }

    /** @internal */
    public _shareDepth(srcRenderTargetHandle: FrameGraphTextureHandle, dstRenderTargetHandle: FrameGraphTextureHandle) {
        const srcTexture = this._textureManager.getTextureFromHandle(srcRenderTargetHandle);
        const dstTexture = this._textureManager.getTextureFromHandle(dstRenderTargetHandle);

        if (srcTexture && dstTexture) {
            srcTexture.shareDepth(dstTexture);
        }
    }

    private _applyRenderTarget() {
        if (this._renderTargetIsBound) {
            return;
        }

        const handle = this._currentRenderTargetHandle;
        const textureSlot = this._textureManager._textures.get(handle)!;

        const renderTarget = textureSlot.texture;

        this._flushDebugMessages();

        if (!renderTarget) {
            if (handle === backbufferColorTextureHandle || textureSlot.refHandle === backbufferColorTextureHandle) {
                this._engine.restoreDefaultFramebuffer();
            } else if (handle === backbufferDepthStencilTextureHandle || textureSlot.refHandle === backbufferDepthStencilTextureHandle) {
                this._engine.restoreDefaultFramebuffer();
            }
        } else {
            this._engine.bindFramebuffer(renderTarget);
        }

        if (this._debugMessageWhenTargetBound !== undefined) {
            this._engine._debugPushGroup?.(this._debugMessageWhenTargetBound, 2);
            this._debugMessageWhenTargetBound = undefined;
            this._debugMessageHasBeenPushed = true;
        }

        this._renderTargetIsBound = true;
    }

    /** @internal */
    public _dispose() {
        this._effectRenderer.dispose();
        this._copyTexture.dispose();
    }
}

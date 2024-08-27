import type { Nullable } from "../types";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { Constants } from "../Engines/constants";
import { EffectRenderer } from "../Materials/effectRenderer";
import type { DrawWrapper } from "../Materials/drawWrapper";
import { CopyTextureToTexture } from "../Misc/copyTextureToTexture";
import type { IColor4Like } from "../Maths/math.like";
import { FrameGraphContext } from "./frameGraphContext";
import type { Layer } from "../Layers/layer";
import type { TextureHandle, FrameGraphTextureManager } from "./frameGraphTextureManager";
import { backbufferColorTextureHandle, backbufferDepthStencilTextureHandle } from "./frameGraphTextureManager";
import type { Effect } from "../Materials/effect";

export class FrameGraphRenderContext extends FrameGraphContext {
    private _effectRenderer: EffectRenderer;
    private _currentRenderTargetHandle: TextureHandle;
    private _debugMessageWhenTargetBound: string | undefined;
    private _debugMessageHasBeenPushed = false;
    private _renderTargetIsBound = true;
    private _copyTexture: CopyTextureToTexture;

    constructor(
        private _engine: AbstractEngine,
        private _textureManager: FrameGraphTextureManager
    ) {
        super();
        this._effectRenderer = new EffectRenderer(this._engine);
        this._copyTexture = new CopyTextureToTexture(this._engine);
        this._currentRenderTargetHandle = backbufferColorTextureHandle;
    }

    public isBackbuffer(handle: TextureHandle): boolean {
        return handle === backbufferColorTextureHandle || handle === backbufferDepthStencilTextureHandle;
    }

    public isBackbufferColor(handle: TextureHandle): boolean {
        return handle === backbufferColorTextureHandle;
    }

    public isBackbufferDepthStencil(handle: TextureHandle): boolean {
        return handle === backbufferDepthStencilTextureHandle;
    }

    /**
     * Clears the current render buffer or the current render target (if any is set up)
     * @param color defines the color to use
     * @param backBuffer defines if the back buffer must be cleared
     * @param depth defines if the depth buffer must be cleared
     * @param stencil defines if the stencil buffer must be cleared
     */
    public clear(color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil?: boolean): void {
        this._applyRenderTarget();
        this._engine.clear(color, backBuffer, depth, stencil);
    }

    public setTextureSamplingMode(handle: TextureHandle, samplingMode: number): void {
        const internalTexture = this._textureManager.getTextureFromHandle(handle)?.texture!;
        if (internalTexture && internalTexture.samplingMode !== samplingMode) {
            this._engine.updateTextureSamplingMode(samplingMode, internalTexture);
        }
    }

    public bindTextureHandle(effect: Effect, name: string, handle: TextureHandle): void {
        const texture = this._textureManager.getTextureFromHandle(handle);
        if (texture) {
            effect._bindTexture(name, texture.texture!);
        }
    }

    /**
     * Applies a fullscreen effect to the current render target
     * @param drawWrapper The draw wrapper containing the effect to apply
     * @param customBindings The custom bindings to use when applying the effect
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
    public copyTexture(sourceTexture: TextureHandle, forceCopyToBackbuffer = false): void {
        if (forceCopyToBackbuffer) {
            this._bindRenderTarget();
        }
        this._applyRenderTarget();
        this._copyTexture.copy(this._textureManager.getTextureFromHandle(sourceTexture)!.texture!);
    }

    /**
     * Renders a layer
     * @param layer The layer to render
     */
    public renderLayer(layer: Layer): void {
        this._applyRenderTarget();
        layer.render();
    }

    /**
     * Binds a render target texture so that upcoming draw calls will render to it
     * Note: it is a lazy operation, so the render target will only be bound when needed. This way, it is possible to call
     *   this method several times with different render targets without incurring the cost of binding if no draw calls are made
     * @internal
     */
    public _bindRenderTarget(renderTargetHandle: TextureHandle = backbufferColorTextureHandle, debugMessage?: string) {
        if (renderTargetHandle === this._currentRenderTargetHandle) {
            this._unbindRenderTarget();
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

    /**
     * @internal
     */
    public _unbindRenderTarget() {
        if (this._debugMessageHasBeenPushed) {
            this._engine._debugPopGroup?.(2);
            this._debugMessageHasBeenPushed = false;
        }
    }

    /** @internal */
    public _shareDepth(srcRenderTargetHandle: TextureHandle, dstRenderTargetHandle: TextureHandle) {
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

        this._unbindRenderTarget();

        if (!renderTarget) {
            if (handle === backbufferColorTextureHandle) {
                this._engine.restoreDefaultFramebuffer();
            } else if (handle === backbufferDepthStencilTextureHandle) {
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

    /**
     * @internal
     */
    public _dispose() {
        this._effectRenderer.dispose();
        this._copyTexture.dispose();
    }
}

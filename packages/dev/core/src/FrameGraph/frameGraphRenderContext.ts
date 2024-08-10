import type { Nullable } from "../types";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import { Constants } from "../Engines/constants";
import { EffectRenderer } from "../Materials/effectRenderer";
import type { DrawWrapper } from "../Materials/drawWrapper";
import { CopyTextureToTexture } from "../Misc/copyTextureToTexture";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import type { ThinTexture } from "../Materials/Textures/thinTexture";
import type { IColor4Like } from "core/Maths/math.like";
import { FrameGraphContext } from "./frameGraphContext";
import type { TextureHandle, FrameGraphTextureManager } from "./frameGraphTextureManager";
import { backbufferColorTextureHandle, FrameGraphTextureSystemType } from "./frameGraphTextureManager";

export class FrameGraphRenderContext extends FrameGraphContext {
    private _effectRenderer: EffectRenderer;
    private _currentRenderTargetHandle: TextureHandle;
    private _renderTargetIsBound = true;
    private _copyTexture: CopyTextureToTexture; // todo: remove

    constructor(
        private _engine: AbstractEngine,
        private _textureManager: FrameGraphTextureManager
    ) {
        super();
        this._effectRenderer = new EffectRenderer(this._engine);
        this._copyTexture = new CopyTextureToTexture(this._engine);
        this._currentRenderTargetHandle = backbufferColorTextureHandle;
    }

    public getTextureFromHandle(handle: TextureHandle): Nullable<RenderTargetWrapper> {
        return this._textureManager._textures[handle]!.texture;
    }

    public isBackbufferColor(handle: TextureHandle) {
        return this._textureManager._textures[handle]!.systemType === FrameGraphTextureSystemType.BackbufferColor;
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

    /**
     * Applies a fullscreen effect to the current render target
     * @param drawWrapper The draw wrapper containing the effect to apply
     * @param customBindings The custom bindings to use when applying the effect
     * @returns True if the effect was applied, otherwise false (effect not ready)
     */
    public applyFullScreenEffect(drawWrapper: DrawWrapper, customBindings?: () => void) {
        if (!drawWrapper.effect?.isReady()) {
            return false;
        }

        this._applyRenderTarget();

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
        this._engine.setAlphaMode(Constants.ALPHA_DISABLE);

        return true;
    }

    /**
     * Copies a texture to the current render target
     * @param sourceTexture The source texture to copy from
     * @param forceCopyToBackbuffer If true, the copy will be done to the back buffer regardless of the current render target
     */
    public copyTexture(sourceTexture: InternalTexture | ThinTexture, forceCopyToBackbuffer = false) {
        if (forceCopyToBackbuffer) {
            this._bindRenderTarget();
        }
        this._applyRenderTarget();
        this._copyTexture.copy(sourceTexture, this._currentRenderTargetHandle ? this.getTextureFromHandle(this._currentRenderTargetHandle) : null);
    }

    /**
     * Binds a render target texture so that upcoming draw calls will render to it
     * Note: it is a lazy operation, so the render target will only be bound when needed. This way, it is possible to call
     *   this method several times with different render targets without incurring the cost of binding if no draw calls are made
     * @param renderTargetHandle The render target texture to bind
     * @internal
     */
    public _bindRenderTarget(renderTargetHandle: TextureHandle = backbufferColorTextureHandle) {
        if (renderTargetHandle === this._currentRenderTargetHandle) {
            return;
        }
        this._currentRenderTargetHandle = renderTargetHandle;
        this._renderTargetIsBound = false;
    }

    private _applyRenderTarget() {
        if (this._renderTargetIsBound) {
            return;
        }

        const textureEntry = this._textureManager._textures[this._currentRenderTargetHandle]!;

        const renderTarget = textureEntry.texture;

        if (!renderTarget) {
            if (textureEntry.systemType === FrameGraphTextureSystemType.BackbufferColor) {
                this._engine.restoreDefaultFramebuffer();
            } else if (textureEntry.systemType === FrameGraphTextureSystemType.BackbufferDepthStencil) {
                throw new Error("Depth/Stencil textures are not supported as render targets");
            }
        } else {
            this._engine.bindFramebuffer(renderTarget);
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

import type {
    Nullable,
    AbstractEngine,
    DrawWrapper,
    IColor4Like,
    Layer,
    FrameGraphTextureHandle,
    Effect,
    FrameGraphTextureManager,
    ObjectRenderer,
    Scene,
    FrameGraphRenderTarget,
    InternalTexture,
    UtilityLayerRenderer,
    IStencilState,
    IStencilStateProperties,
} from "core/index";
import { Constants } from "../Engines/constants";
import { EffectRenderer } from "../Materials/effectRenderer";
import { CopyTextureToTexture } from "../Misc/copyTextureToTexture";
import { FrameGraphContext } from "./frameGraphContext";
import { IsDepthTexture } from "../Materials/Textures/textureHelper.functions";

const SamplingModeHasMipMapFiltering = [
    false, // not used
    false, // TEXTURE_NEAREST_SAMPLINGMODE / TEXTURE_NEAREST_NEAREST
    false, // TEXTURE_BILINEAR_SAMPLINGMODE / TEXTURE_LINEAR_LINEAR
    true, // TEXTURE_TRILINEAR_SAMPLINGMODE / TEXTURE_LINEAR_LINEAR_MIPLINEAR
    true, // TEXTURE_NEAREST_NEAREST_MIPNEAREST
    true, // TEXTURE_NEAREST_LINEAR_MIPNEAREST
    true, // TEXTURE_NEAREST_LINEAR_MIPLINEAR
    false, // TEXTURE_NEAREST_LINEAR
    true, // TEXTURE_NEAREST_NEAREST_MIPLINEAR
    true, // TEXTURE_LINEAR_NEAREST_MIPNEAREST
    true, // TEXTURE_LINEAR_NEAREST_MIPLINEAR
    true, // TEXTURE_LINEAR_LINEAR_MIPNEAREST
    false, // TEXTURE_LINEAR_NEAREST
];

/**
 * Frame graph context used render passes.
 */
export class FrameGraphRenderContext extends FrameGraphContext {
    private readonly _effectRenderer: EffectRenderer;
    private readonly _effectRendererBack: EffectRenderer;
    private _currentRenderTarget: FrameGraphRenderTarget | undefined;
    private _renderTargetIsBound = true;
    private readonly _copyTexture: CopyTextureToTexture;
    private readonly _copyDepthTexture: CopyTextureToTexture;

    private static _IsObjectRenderer(value: Layer | ObjectRenderer | UtilityLayerRenderer): value is ObjectRenderer {
        return (value as ObjectRenderer).initRender !== undefined;
    }

    /** @internal */
    constructor(engine: AbstractEngine, textureManager: FrameGraphTextureManager, scene: Scene) {
        super(engine, textureManager, scene);
        this._effectRenderer = new EffectRenderer(this._engine);
        this._effectRendererBack = new EffectRenderer(this._engine, {
            positions: [1, 1, -1, 1, -1, -1, 1, -1],
            indices: [0, 2, 1, 0, 3, 2],
        });
        this._copyTexture = new CopyTextureToTexture(this._engine);
        this._copyDepthTexture = new CopyTextureToTexture(this._engine, true);
    }

    /**
     * Checks whether a texture handle points to the backbuffer's color or depth texture
     * @param handle The handle to check
     * @returns True if the handle points to the backbuffer's color or depth texture, otherwise false
     */
    public isBackbuffer(handle: FrameGraphTextureHandle): boolean {
        return this._textureManager._isBackbuffer(handle);
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
     * Creates a (frame graph) render target wrapper
     * Note that renderTargets or renderTargetDepth can be undefined, but not both at the same time!
     * @param name Name of the render target wrapper
     * @param renderTargets Render target handles (textures) to use
     * @param renderTargetDepth Render target depth handle (texture) to use
     * @param depthReadOnly If true, the depth buffer will be read-only
     * @param stencilReadOnly If true, the stencil buffer will be read-only
     * @returns The created render target wrapper
     */
    public createRenderTarget(
        name: string,
        renderTargets?: FrameGraphTextureHandle | FrameGraphTextureHandle[],
        renderTargetDepth?: FrameGraphTextureHandle,
        depthReadOnly?: boolean,
        stencilReadOnly?: boolean
    ): FrameGraphRenderTarget {
        return this._textureManager.createRenderTarget(name, renderTargets, renderTargetDepth, depthReadOnly, stencilReadOnly);
    }

    /**
     * Clears the current render buffer or the current render target (if any is set up)
     * @param color Defines the color to use
     * @param backBuffer Defines if the back buffer must be cleared
     * @param depth Defines if the depth buffer must be cleared
     * @param stencil Defines if the stencil buffer must be cleared
     * @param stencilClearValue Defines the value to use to clear the stencil buffer (default is 0)
     */
    public clear(color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil?: boolean, stencilClearValue = 0): void {
        this._applyRenderTarget();
        this._engine.clear(color, backBuffer, depth, stencil, stencilClearValue);
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
     * Clears all attachments (color(s) + depth/stencil) of the current render target
     * @param color Defines the color to use
     * @param attachments The attachments to clear
     * @param backBuffer Defines if the back buffer must be cleared
     * @param depth Defines if the depth buffer must be cleared
     * @param stencil Defines if the stencil buffer must be cleared
     * @param stencilClearValue Defines the value to use to clear the stencil buffer (default is 0)
     */
    public clearAttachments(color: Nullable<IColor4Like>, attachments: number[], backBuffer: boolean, depth: boolean, stencil?: boolean, stencilClearValue = 0): void {
        this._applyRenderTarget();
        this._engine.bindAttachments(attachments);
        this._engine.clear(color, backBuffer, depth, stencil, stencilClearValue);
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
     * @param handle Optional handle of the texture to generate mipmaps for (if not provided, will generate mipmaps for all textures in the current render target)
     */
    public generateMipMaps(handle?: FrameGraphTextureHandle): void {
        if (handle !== undefined) {
            const internalTexture = this._textureManager.getTextureFromHandle(handle);
            if (internalTexture) {
                this._engine.generateMipmaps(internalTexture);
            }
            return;
        }
        if (this._currentRenderTarget?.renderTargetWrapper === undefined) {
            return;
        }

        if (this._engine._currentRenderTarget && (!this._engine.isWebGPU || this._renderTargetIsBound)) {
            // we can't generate the mipmaps if the render target (which is the texture we want to generate mipmaps for) is bound
            // Also, for some reasons, on WebGL2, generating mipmaps doesn't work if a render target is bound, even if it's not the texture we want to generate mipmaps for...
            this._engine.unBindFramebuffer(this._engine._currentRenderTarget);
            this._renderTargetIsBound = false;
        }

        const textures = this._currentRenderTarget.renderTargetWrapper.textures;
        if (textures) {
            for (const texture of textures) {
                this._engine.generateMipmaps(texture);
            }
        }
    }

    /**
     * Sets the texture sampling mode for a given texture handle
     * @param handle Handle of the texture to set the sampling mode for
     * @param samplingMode Sampling mode to set
     */
    public setTextureSamplingMode(handle: FrameGraphTextureHandle, samplingMode: number): void {
        const internalTexture = this._textureManager.getTextureFromHandle(handle);
        if (internalTexture && internalTexture.samplingMode !== samplingMode) {
            internalTexture.useMipMaps = SamplingModeHasMipMapFiltering[samplingMode];
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
        let texture: Nullable<InternalTexture>;

        const historyEntry = this._textureManager._historyTextures.get(handle);
        if (historyEntry) {
            texture = historyEntry.textures[historyEntry.index]; // texture we write to in this frame
            if (
                this._currentRenderTarget !== undefined &&
                this._currentRenderTarget.renderTargetWrapper !== undefined &&
                this._currentRenderTarget.renderTargetWrapper.textures!.includes(texture!)
            ) {
                // If the current render target renders to the history write texture, we bind the read texture instead
                texture = historyEntry.textures[historyEntry.index ^ 1];
            }
        } else {
            texture = this._textureManager._textures.get(handle)!.texture;
        }

        effect._bindTexture(name, texture);
    }

    /**
     * Applies a full-screen effect to the current render target
     * @param drawWrapper The draw wrapper containing the effect to apply
     * @param customBindings The custom bindings to use when applying the effect (optional)
     * @param stencilState The stencil state to use when applying the effect (optional)
     * @param disableColorWrite If true, color write will be disabled when applying the effect (optional)
     * @param drawBackFace If true, the fullscreen quad will be drawn as a back face (in CW - optional)
     * @param depthTest If true, depth testing will be enabled when applying the effect (default is false)
     * @param noViewport If true, the current viewport will be left unchanged (optional). If false or undefined, the viewport will be set to the full render target size.
     * @param alphaMode The alpha mode to use when applying the effect (default is ALPHA_DISABLE)
     * @returns True if the effect was applied, otherwise false (effect not ready)
     */
    public applyFullScreenEffect(
        drawWrapper: DrawWrapper,
        customBindings?: () => void,
        stencilState?: IStencilState | IStencilStateProperties,
        disableColorWrite?: boolean,
        drawBackFace?: boolean,
        depthTest?: boolean,
        noViewport?: boolean,
        alphaMode = Constants.ALPHA_DISABLE
    ): boolean {
        if (!drawWrapper.effect?.isReady()) {
            return false;
        }

        this._applyRenderTarget();

        const engineDepthMask = this._engine.getDepthWrite(); // for some reasons, depthWrite is not restored by EffectRenderer.restoreStates
        const engineDepthFunc = this._engine.getDepthFunction();

        const effectRenderer = drawBackFace ? this._effectRendererBack : this._effectRenderer;

        effectRenderer.saveStates();
        if (!noViewport) {
            effectRenderer.setViewport();
        }

        this._engine.enableEffect(drawWrapper);
        this._engine.setState(false, undefined, undefined, undefined, undefined, stencilState);
        this._engine.setDepthBuffer(!!depthTest);
        if (disableColorWrite) {
            this._engine.setColorWrite(false);
        }
        this._engine.setDepthWrite(false);
        this._engine.setAlphaMode(alphaMode);

        effectRenderer.bindBuffers(drawWrapper.effect);
        customBindings?.();
        effectRenderer.draw();
        effectRenderer.restoreStates();
        if (disableColorWrite) {
            this._engine.setColorWrite(true);
        }
        this._engine.setDepthWrite(engineDepthMask);
        if (engineDepthFunc) {
            this._engine.setDepthFunction(engineDepthFunc);
        }
        this._engine.setAlphaMode(Constants.ALPHA_DISABLE);

        return true;
    }

    /**
     * Copies a texture to the current render target
     * @param sourceTexture The source texture to copy from
     * @param forceCopyToBackbuffer If true, the copy will be done to the back buffer regardless of the current render target
     * @param noViewport If true, the current viewport will be left unchanged (optional). If false or undefined, the viewport will be set to the full render target size.
     * @param lodLevel The LOD level to use when copying the texture (default: 0).
     */
    public copyTexture(sourceTexture: FrameGraphTextureHandle, forceCopyToBackbuffer = false, noViewport?: boolean, lodLevel = 0): void {
        if (forceCopyToBackbuffer) {
            this.bindRenderTarget();
        }

        const texture = this._textureManager.getTextureFromHandle(sourceTexture, true)!;
        const copyTexture = IsDepthTexture(texture.format) ? this._copyDepthTexture : this._copyTexture;

        copyTexture.source = texture;
        copyTexture.lodLevel = lodLevel;

        this.applyFullScreenEffect(
            copyTexture.effectWrapper.drawWrapper,
            () => {
                copyTexture.effectWrapper.onApplyObservable.notifyObservers({});
            },
            undefined,
            undefined,
            undefined,
            undefined,
            noViewport
        );
    }

    /**
     * Renders a RenderTargetTexture or a layer
     * @param object The RenderTargetTexture/Layer to render
     * @param viewportWidth The width of the viewport (optional for Layer, but mandatory for ObjectRenderer)
     * @param viewportHeight The height of the viewport (optional for Layer, but mandatory for ObjectRenderer)
     * @param restoreDefaultFramebuffer If true, the default framebuffer will be restored after rendering (default: false)
     */
    public render(object: Layer | ObjectRenderer | UtilityLayerRenderer, viewportWidth?: number, viewportHeight?: number, restoreDefaultFramebuffer = false): void {
        if (FrameGraphRenderContext._IsObjectRenderer(object)) {
            this._scene._intermediateRendering = true;
            if (object.shouldRender()) {
                this._scene.incrementRenderId();
                this._scene.resetCachedMaterial();

                object.prepareRenderList();

                object.initRender(viewportWidth!, viewportHeight!);

                this._applyRenderTarget();

                object.render();

                object.finishRender();

                if (restoreDefaultFramebuffer) {
                    this.restoreDefaultFramebuffer();
                }
            }
            this._scene._intermediateRendering = false;
        } else {
            this._applyRenderTarget();
            object.render();
        }
    }

    /**
     * Binds a render target texture so that upcoming draw calls will render to it
     * Note: it is a lazy operation, so the render target will only be bound when needed. This way, it is possible to call
     *   this method several times with different render targets without incurring the cost of binding if no draw calls are made
     * @param renderTarget The handle of the render target texture to bind (default: undefined, meaning "back buffer"). Pass an array for MRT rendering.
     * @param applyImmediately If true, the render target will be applied immediately (otherwise it will be applied at first use). Default is false (delayed application).
     */
    public bindRenderTarget(renderTarget?: FrameGraphRenderTarget, applyImmediately = false): void {
        this._currentRenderTarget = renderTarget?.renderTargetWrapper === undefined ? undefined : renderTarget;
        this._renderTargetIsBound = false;
        if (applyImmediately) {
            this._applyRenderTarget();
        }
    }

    /**
     * Restores the default framebuffer (back buffer) as the current render target
     */
    public restoreDefaultFramebuffer(): void {
        this._engine.restoreDefaultFramebuffer();
        this._renderTargetIsBound = false;
        this._currentRenderTarget = undefined;
    }

    /** @internal */
    public _applyRenderTarget() {
        if (this._renderTargetIsBound) {
            return;
        }

        const renderTargetWrapper = this._currentRenderTarget?.renderTargetWrapper;

        if (renderTargetWrapper === undefined) {
            if (this._engine._currentRenderTarget) {
                this._engine.restoreDefaultFramebuffer();
            }
        } else if (this._engine._currentRenderTarget !== renderTargetWrapper) {
            if (this._engine._currentRenderTarget) {
                this._engine.unBindFramebuffer(this._engine._currentRenderTarget);
            }
            this._engine.bindFramebuffer(renderTargetWrapper);
        }

        this._renderTargetIsBound = true;
    }

    /** @internal */
    public _isReady(): boolean {
        return this._copyTexture.isReady() && this._copyDepthTexture.isReady();
    }

    /** @internal */
    public _dispose() {
        this._effectRenderer.dispose();
        this._effectRendererBack.dispose();
        this._copyTexture.dispose();
        this._copyDepthTexture.dispose();
    }
}

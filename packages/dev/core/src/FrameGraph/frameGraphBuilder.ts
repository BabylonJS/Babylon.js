import type { NodeRenderGraphConnectionPoint } from "./Node/nodeRenderGraphBlockConnectionPoint";
import type { Scene } from "../scene";
import { EffectRenderer } from "../Materials/effectRenderer";
import type { DrawWrapper } from "../Materials/drawWrapper";
import type { Nullable } from "../types";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { IRenderTargetTexture, RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import { Constants } from "../Engines/constants";
import { CopyTextureToTexture } from "../Misc/copyTextureToTexture";
import type { RenderTargetCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import type { ThinTexture } from "../Materials/Textures/thinTexture";
import type { IColor4Like } from "core/Maths/math.like";
import { Texture } from "core/Materials/Textures/texture";

interface FrameGraphExecute {
    condition: (() => boolean) | undefined;
    functions: Array<() => void>;
}

/**
 * Class used to implement the frame graph builder
 */
export class FrameGraphBuilder {
    private _engine: AbstractEngine;
    private _copyTexture: CopyTextureToTexture;

    /** Gets or sets the build identifier */
    public buildId: number;

    /**
     * Gets or sets the list of non connected mandatory inputs
     * @internal
     */
    public _notConnectedNonOptionalInputs: NodeRenderGraphConnectionPoint[] = [];

    private _executeFunctions: FrameGraphExecute[] = [];
    private _effectRenderer: EffectRenderer;
    private _currentRenderTarget: Nullable<RenderTargetWrapper> = null;
    private _renderTargetWrappers: RenderTargetWrapper[] = [];
    private _renderTargetIsBound = true;
    private _texturesDebug: Array<Texture> = [];

    /**
     * Gets the current render target (null for the default buffer / swap chain texture)
     */
    public get currentRenderTarget() {
        return this._currentRenderTarget;
    }

    /**
     * Constructs the frame graph builder
     * @param engine defines the hosting engine
     * @param _debugTextures defines a boolean indicating that textures created by the frame graph should be visible in the inspector
     * @param _scene defines the scene in which debugging textures are to be created
     * @param verbose defines a boolean indicating that verbose mode is on
     */
    constructor(
        engine: AbstractEngine,
        private _debugTextures = false,
        private _scene?: Scene,
        public verbose = false
    ) {
        this._engine = engine;
        this._effectRenderer = new EffectRenderer(engine);
        this._copyTexture = new CopyTextureToTexture(engine);

        this.buildId = 0;
    }

    /**
     * Adds a function to execute during the frame graph execution
     * addExecuteFunction should only be called during the build phase!
     * @param func The function to execute
     */
    public addExecuteFunction(func: () => void) {
        this._executeFunctions[this._executeFunctions.length - 1].functions.push(func);
    }

    /**
     * Creates a render target texture
     * Note: the texture returned should not be disposed as its lifecycle is managed by the frame graph!
     * @param name Name of the texture
     * @param size Size of the texture
     * @param options Options used to create the texture
     * @returns The created render target texture
     */
    public createRenderTargetTexture(name: string, size: TextureSize, options: RenderTargetCreationOptions): RenderTargetWrapper {
        const rtt = this._engine.createRenderTargetTexture(size, options);

        if (this._debugTextures && this._scene) {
            const texture = new Texture(null, this._scene);

            texture.name = name;
            texture._texture = rtt.texture!;
            texture._texture.incrementReferences();

            this._texturesDebug.push(texture);
        }

        this._renderTargetWrappers.push(rtt);

        return rtt;
    }

    /**
     * Binds a render target texture so that upcoming draw calls will render to it
     * Note: it is a lazy operation, so the render target will only be bound when needed. This way, it is possible to call
     *   this method several times with different render targets without incurring the cost of binding if no draw calls are made
     * @param renderTarget The render target texture to bind
     */
    public bindRenderTarget(renderTarget: Nullable<RenderTargetWrapper>) {
        if (renderTarget === this._currentRenderTarget) {
            return;
        }
        this._currentRenderTarget = renderTarget;
        this._renderTargetIsBound = false;
    }

    /**
     * Clears the current render buffer or the current render target (if any is set up)
     * @param color defines the color to use
     * @param backBuffer defines if the back buffer must be cleared
     * @param depth defines if the depth buffer must be cleared
     * @param stencil defines if the stencil buffer must be cleared
     */
    public clear(color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil?: boolean): void {
        this._bindRenderTarget();
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

        this._bindRenderTarget();

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
     * Copies a texture to another texture or to the screen
     * @param sourceTexture The source texture to copy from
     * @param destinationTexture The destination texture to copy to. Pass null to copy to the screen / swap chain texture
     */
    public copyTextureToTexture(sourceTexture: InternalTexture | ThinTexture, destinationTexture: Nullable<RenderTargetWrapper | IRenderTargetTexture>) {
        this._bindRenderTarget();
        this._copyTexture.copy(sourceTexture, destinationTexture);
    }

    /**
     * @internal
     */
    public _dispose() {
        this._effectRenderer.dispose();
        this._copyTexture.dispose();
        this._releaseTextures();
    }

    /**
     * @internal
     */
    public _startBuild() {
        this._notConnectedNonOptionalInputs = [];
        this._executeFunctions = [];
        this._releaseTextures();
    }

    public _endBuild(emitErrors = true) {
        const executeFunctions: FrameGraphExecute[] = [];
        for (const execute of this._executeFunctions) {
            if (execute.functions.length > 0) {
                executeFunctions.push(execute);
            }
        }
        this._executeFunctions = executeFunctions;

        if (emitErrors) {
            this._emitErrors();
        }
    }

    /**
     * @internal
     */
    public _addCondition(condition: (() => boolean) | undefined) {
        this._executeFunctions.push({
            condition,
            functions: [],
        });
    }

    /**
     * @internal
     */
    public _execute() {
        this.bindRenderTarget(null);
        this._engine.restoreDefaultFramebuffer();
        for (const execute of this._executeFunctions) {
            if (!execute.condition || execute.condition()) {
                for (const func of execute.functions) {
                    func();
                }
            }
        }
    }

    private _releaseTextures() {
        for (const texture of this._texturesDebug) {
            texture.dispose();
        }
        this._texturesDebug.length = 0;

        for (const wrapper of this._renderTargetWrappers) {
            wrapper.dispose();
        }
        this._renderTargetWrappers.length = 0;
    }

    private _bindRenderTarget() {
        if (this._renderTargetIsBound) {
            return;
        }

        if (!this._currentRenderTarget) {
            this._engine.restoreDefaultFramebuffer();
        } else {
            this._engine.bindFramebuffer(this._currentRenderTarget);
        }

        this._renderTargetIsBound = true;
    }

    private _emitErrors() {
        let errorMessage = "";
        for (const notConnectedInput of this._notConnectedNonOptionalInputs) {
            errorMessage += `input "${notConnectedInput.name}" from block "${
                notConnectedInput.ownerBlock.name
            }"[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.\n`;
        }
        if (errorMessage) {
            throw new Error("Build of frame graph failed:\n" + errorMessage);
        }
    }
}

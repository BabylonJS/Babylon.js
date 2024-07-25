import type { FrameGraphConnectionPoint } from "./frameGraphBlockConnectionPoint";
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

    /** Gets or sets the list of non connected mandatory inputs */
    public notConnectedNonOptionalInputs: FrameGraphConnectionPoint[] = [];

    /** Gets or sets the build identifier */
    public buildId: number;

    /** Gets or sets a boolean indicating that verbose mode is on */
    public verbose: boolean;

    /** Gets or sets a boolean indicating that textures created by the frame graph should be visible in the inspector */
    public debugTextures: boolean;

    /** Scene in which debugging textures are to be created */
    public scene?: Scene;

    public removeFalseBlocks: boolean;

    private _executeFunctions: FrameGraphExecute[] = [];
    private _effectRenderer: EffectRenderer;

    constructor(engine: AbstractEngine) {
        this._engine = engine;
        this.buildId = 0;
        this.verbose = false;
        this.debugTextures = false;
        this._effectRenderer = new EffectRenderer(engine);
        this._copyTexture = new CopyTextureToTexture(engine);
    }

    public addExecuteFunction(func: () => void) {
        this._executeFunctions[this._executeFunctions.length - 1].functions.push(func);
    }

    public bindRenderTargetWrapper(wrapper: Nullable<RenderTargetWrapper>) {
        if (!wrapper) {
            this._engine.restoreDefaultFramebuffer();
        } else {
            this._engine.bindFramebuffer(wrapper);
        }
    }

    public applyFullScreenEffect(drawWrapper: DrawWrapper, customBindings?: () => void) {
        if (!drawWrapper.effect?.isReady()) {
            return false;
        }

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

    public createRenderTargetTexture(size: TextureSize, options: RenderTargetCreationOptions) {
        return this._engine.createRenderTargetTexture(size, options);
    }

    public copyTextureToTexture(sourceTexture: InternalTexture | ThinTexture, destinationTexture: Nullable<RenderTargetWrapper | IRenderTargetTexture>) {
        this._copyTexture.copy(sourceTexture, destinationTexture);
    }

    /**
     * @internal
     */
    public _dispose() {
        this._effectRenderer.dispose();
        this._copyTexture.dispose();
    }

    /**
     * @internal
     */
    public _start() {
        this.notConnectedNonOptionalInputs = [];
        this._executeFunctions = [];
    }

    public _end(emitErrors = true) {
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
        this.bindRenderTargetWrapper(null);
        for (const execute of this._executeFunctions) {
            if (!execute.condition || execute.condition()) {
                for (const func of execute.functions) {
                    func();
                }
            }
        }
    }

    private _emitErrors() {
        let errorMessage = "";
        for (const notConnectedInput of this.notConnectedNonOptionalInputs) {
            errorMessage += `input "${notConnectedInput.name}" from block "${
                notConnectedInput.ownerBlock.name
            }"[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.\n`;
        }
        if (errorMessage) {
            throw new Error("Build of frame graph failed:\n" + errorMessage);
        }
    }
}

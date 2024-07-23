import type { FrameGraphConnectionPoint } from "./frameGraphBlockConnectionPoint";
import type { Scene } from "core/scene";
import { EffectRenderer } from "core/Materials/effectRenderer";
import type { DrawWrapper } from "core/Materials/drawWrapper";
import type { Nullable } from "core/types";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { Constants } from "core/Engines/constants";

interface FrameGraphExecute {
    condition: (() => boolean) | undefined;
    functions: Array<() => void>;
}

/**
 * Class used to implement the frame graph builder
 */
export class FrameGraphBuilder {
    /** Engine used by the frame graph */
    public engine: AbstractEngine;

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
        this.engine = engine;
        this.buildId = 0;
        this.verbose = false;
        this.debugTextures = false;
        this._effectRenderer = new EffectRenderer(engine);
    }

    public addExecuteFunction(func: () => void) {
        this._executeFunctions[this._executeFunctions.length - 1].functions.push(func);
    }

    public bindRenderTargetWrapper(wrapper: Nullable<RenderTargetWrapper>) {
        if (!wrapper) {
            this.engine.restoreDefaultFramebuffer();
        } else {
            this.engine.bindFramebuffer(wrapper);
        }
    }

    public applyFullScreenEffect(drawWrapper: DrawWrapper, customBindings?: () => void) {
        if (!drawWrapper.effect?.isReady()) {
            return false;
        }

        this._effectRenderer.saveStates();
        this._effectRenderer.setViewport();

        this.engine.enableEffect(drawWrapper);
        this.engine.setState(false);
        this.engine.setDepthBuffer(false);
        this.engine.setDepthWrite(false);

        this._effectRenderer.bindBuffers(drawWrapper.effect);
        customBindings?.();
        this._effectRenderer.draw();
        this._effectRenderer.restoreStates();
        this.engine.setAlphaMode(Constants.ALPHA_DISABLE);

        return true;
    }

    /**
     * @internal
     */
    public _dispose() {
        this._effectRenderer.dispose();
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

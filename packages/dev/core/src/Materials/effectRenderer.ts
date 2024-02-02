import type { Nullable } from "../types";
import type { ThinEngine } from "../Engines/thinEngine";
import { VertexBuffer } from "../Buffers/buffer";
import { Viewport } from "../Maths/math.viewport";
import { Constants } from "../Engines/constants";
import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import { Effect } from "./effect";
import type { DataBuffer } from "../Buffers/dataBuffer";
import { DrawWrapper } from "./drawWrapper";
import type { IRenderTargetTexture, RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { ShaderLanguage } from "./shaderLanguage";

// Prevents ES6 Crash if not imported.
import "../Shaders/postprocess.vertex";

/**
 * Effect Render Options
 */
export interface IEffectRendererOptions {
    /**
     * Defines the vertices positions.
     */
    positions?: number[];
    /**
     * Defines the indices.
     */
    indices?: number[];
}

// Fullscreen quad buffers by default.
const defaultOptions = {
    positions: [1, 1, -1, 1, -1, -1, 1, -1],
    indices: [0, 1, 2, 0, 2, 3],
};

/**
 * Helper class to render one or more effects.
 * You can access the previous rendering in your shader by declaring a sampler named textureSampler
 */
export class EffectRenderer {
    /**
     * The engine the effect renderer has been created for.
     */
    public readonly engine: ThinEngine;

    private _vertexBuffers: { [key: string]: VertexBuffer };
    private _indexBuffer: DataBuffer;

    private _fullscreenViewport = new Viewport(0, 0, 1, 1);
    private _onContextRestoredObserver: Nullable<Observer<ThinEngine>>;

    private _savedStateDepthTest: boolean;
    private _savedStateStencilTest: boolean;

    /**
     * Creates an effect renderer
     * @param engine the engine to use for rendering
     * @param options defines the options of the effect renderer
     */
    constructor(engine: ThinEngine, options: IEffectRendererOptions = defaultOptions) {
        const positions = options.positions ?? defaultOptions.positions;
        const indices = options.indices ?? defaultOptions.indices;

        this.engine = engine;
        this._vertexBuffers = {
            [VertexBuffer.PositionKind]: new VertexBuffer(engine, positions, VertexBuffer.PositionKind, false, false, 2),
        };
        this._indexBuffer = engine.createIndexBuffer(indices);

        this._onContextRestoredObserver = engine.onContextRestoredObservable.add(() => {
            this._indexBuffer = engine.createIndexBuffer(indices);

            for (const key in this._vertexBuffers) {
                const vertexBuffer = this._vertexBuffers[key];
                vertexBuffer._rebuild();
            }
        });
    }

    /**
     * Sets the current viewport in normalized coordinates 0-1
     * @param viewport Defines the viewport to set (defaults to 0 0 1 1)
     */
    public setViewport(viewport = this._fullscreenViewport): void {
        this.engine.setViewport(viewport);
    }

    /**
     * Binds the embedded attributes buffer to the effect.
     * @param effect Defines the effect to bind the attributes for
     */
    public bindBuffers(effect: Effect): void {
        this.engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);
    }

    /**
     * Sets the current effect wrapper to use during draw.
     * The effect needs to be ready before calling this api.
     * This also sets the default full screen position attribute.
     * @param effectWrapper Defines the effect to draw with
     */
    public applyEffectWrapper(effectWrapper: EffectWrapper): void {
        this.engine.setState(true);
        this.engine.depthCullingState.depthTest = false;
        this.engine.stencilState.stencilTest = false;
        this.engine.enableEffect(effectWrapper._drawWrapper);
        this.bindBuffers(effectWrapper.effect);
        effectWrapper.onApplyObservable.notifyObservers({});
    }

    /**
     * Saves engine states
     */
    public saveStates(): void {
        this._savedStateDepthTest = this.engine.depthCullingState.depthTest;
        this._savedStateStencilTest = this.engine.stencilState.stencilTest;
    }

    /**
     * Restores engine states
     */
    public restoreStates(): void {
        this.engine.depthCullingState.depthTest = this._savedStateDepthTest;
        this.engine.stencilState.stencilTest = this._savedStateStencilTest;
    }

    /**
     * Draws a full screen quad.
     */
    public draw(): void {
        this.engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, 6);
    }

    private _isRenderTargetTexture(texture: RenderTargetWrapper | IRenderTargetTexture): texture is IRenderTargetTexture {
        return (texture as IRenderTargetTexture).renderTarget !== undefined;
    }

    /**
     * renders one or more effects to a specified texture
     * @param effectWrapper the effect to renderer
     * @param outputTexture texture to draw to, if null it will render to the screen.
     */
    public render(effectWrapper: EffectWrapper, outputTexture: Nullable<RenderTargetWrapper | IRenderTargetTexture> = null) {
        // Ensure effect is ready
        if (!effectWrapper.effect.isReady()) {
            return;
        }

        this.saveStates();

        // Reset state
        this.setViewport();

        const out = outputTexture === null ? null : this._isRenderTargetTexture(outputTexture) ? outputTexture.renderTarget! : outputTexture;

        if (out) {
            this.engine.bindFramebuffer(out);
        }

        this.applyEffectWrapper(effectWrapper);

        this.draw();

        if (out) {
            this.engine.unBindFramebuffer(out);
        }

        this.restoreStates();
    }

    /**
     * Disposes of the effect renderer
     */
    dispose() {
        const vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vertexBuffer) {
            vertexBuffer.dispose();
            delete this._vertexBuffers[VertexBuffer.PositionKind];
        }

        if (this._indexBuffer) {
            this.engine._releaseBuffer(this._indexBuffer);
        }

        if (this._onContextRestoredObserver) {
            this.engine.onContextRestoredObservable.remove(this._onContextRestoredObserver);
            this._onContextRestoredObserver = null;
        }
    }
}

/**
 * Options to create an EffectWrapper
 */
interface EffectWrapperCreationOptions {
    /**
     * Engine to use to create the effect
     */
    engine: ThinEngine;
    /**
     * Fragment shader for the effect
     */
    fragmentShader: string;
    /**
     * Use the shader store instead of direct source code
     */
    useShaderStore?: boolean;
    /**
     * Vertex shader for the effect
     */
    vertexShader?: string;
    /**
     * Attributes to use in the shader
     */
    attributeNames?: Array<string>;
    /**
     * Uniforms to use in the shader
     */
    uniformNames?: Array<string>;
    /**
     * Texture sampler names to use in the shader
     */
    samplerNames?: Array<string>;
    /**
     * Defines to use in the shader
     */
    defines?: Array<string>;
    /**
     * Callback when effect is compiled
     */
    onCompiled?: Nullable<(effect: Effect) => void>;
    /**
     * The friendly name of the effect displayed in Spector.
     */
    name?: string;
    /**
     * The language the shader is written in (default: GLSL)
     */
    shaderLanguage?: ShaderLanguage;
}

/**
 * Wraps an effect to be used for rendering
 */
export class EffectWrapper {
    /**
     * Event that is fired right before the effect is drawn (should be used to update uniforms)
     */
    public onApplyObservable = new Observable<{}>();
    /**
     * The underlying effect
     */
    public get effect(): Effect {
        return this._drawWrapper.effect!;
    }

    public set effect(effect: Effect) {
        this._drawWrapper.effect = effect;
    }

    /** @internal */
    public _drawWrapper: DrawWrapper;

    private _onContextRestoredObserver: Nullable<Observer<ThinEngine>>;

    /**
     * Creates an effect to be renderer
     * @param creationOptions options to create the effect
     */
    constructor(creationOptions: EffectWrapperCreationOptions) {
        let effectCreationOptions: any;
        const uniformNames = creationOptions.uniformNames || [];

        if (creationOptions.vertexShader) {
            effectCreationOptions = {
                fragmentSource: creationOptions.fragmentShader,
                vertexSource: creationOptions.vertexShader,
                spectorName: creationOptions.name || "effectWrapper",
            };
        } else {
            // Default scale to use in post process vertex shader.
            uniformNames.push("scale");

            effectCreationOptions = {
                fragmentSource: creationOptions.fragmentShader,
                vertex: "postprocess",
                spectorName: creationOptions.name || "effectWrapper",
            };

            // Sets the default scale to identity for the post process vertex shader.
            this.onApplyObservable.add(() => {
                this.effect.setFloat2("scale", 1, 1);
            });
        }

        const defines = creationOptions.defines ? creationOptions.defines.join("\n") : "";
        this._drawWrapper = new DrawWrapper(creationOptions.engine);

        if (creationOptions.useShaderStore) {
            effectCreationOptions.fragment = effectCreationOptions.fragmentSource;
            if (!effectCreationOptions.vertex) {
                effectCreationOptions.vertex = effectCreationOptions.vertexSource;
            }

            delete effectCreationOptions.fragmentSource;
            delete effectCreationOptions.vertexSource;

            this.effect = creationOptions.engine.createEffect(
                effectCreationOptions,
                creationOptions.attributeNames || ["position"],
                uniformNames,
                creationOptions.samplerNames,
                defines,
                undefined,
                creationOptions.onCompiled,
                undefined,
                undefined,
                creationOptions.shaderLanguage
            );
        } else {
            this.effect = new Effect(
                effectCreationOptions,
                creationOptions.attributeNames || ["position"],
                uniformNames,
                creationOptions.samplerNames,
                creationOptions.engine,
                defines,
                undefined,
                creationOptions.onCompiled,
                undefined,
                undefined,
                undefined,
                creationOptions.shaderLanguage
            );

            this._onContextRestoredObserver = creationOptions.engine.onContextRestoredObservable.add(() => {
                this.effect._pipelineContext = null; // because _prepareEffect will try to dispose this pipeline before recreating it and that would lead to webgl errors
                this.effect._prepareEffect();
            });
        }
    }

    /**
     * Disposes of the effect wrapper
     */
    public dispose() {
        if (this._onContextRestoredObserver) {
            this.effect.getEngine().onContextRestoredObservable.remove(this._onContextRestoredObserver);
            this._onContextRestoredObserver = null;
        }
        this.effect.dispose();
    }
}

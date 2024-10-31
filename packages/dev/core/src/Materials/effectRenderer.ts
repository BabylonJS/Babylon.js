import type { NonNullableFields, Nullable } from "../types";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { VertexBuffer } from "../Buffers/buffer";
import { Viewport } from "../Maths/math.viewport";
import { Constants } from "../Engines/constants";
import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import type { IShaderPath } from "./effect";
import { Effect } from "./effect";
import type { DataBuffer } from "../Buffers/dataBuffer";
import { DrawWrapper } from "./drawWrapper";
import type { IRenderTargetTexture, RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import { ShaderLanguage } from "./shaderLanguage";

// Prevents ES6 issue if not imported.
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
    public readonly engine: AbstractEngine;

    private _vertexBuffers: { [key: string]: VertexBuffer };
    private _indexBuffer: DataBuffer;

    private _fullscreenViewport = new Viewport(0, 0, 1, 1);
    private _onContextRestoredObserver: Nullable<Observer<AbstractEngine>>;

    private _savedStateDepthTest: boolean;
    private _savedStateStencilTest: boolean;

    /**
     * Creates an effect renderer
     * @param engine the engine to use for rendering
     * @param options defines the options of the effect renderer
     */
    constructor(engine: AbstractEngine, options: IEffectRendererOptions = defaultOptions) {
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
        this.engine.enableEffect(effectWrapper.drawWrapper);
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
     * @param outputTexture texture to draw to, if null it will render to the currently bound frame buffer
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
 * Allows for custom processing of the shader code used by an effect wrapper
 */
export type EffectWrapperCustomShaderCodeProcessing = {
    /**
     * If provided, will be called two times with the vertex and fragment code so that this code can be updated after the #include have been processed
     */
    processCodeAfterIncludes?: (postProcessName: string, shaderType: string, code: string) => string;
    /**
     * If provided, will be called two times with the vertex and fragment code so that this code can be updated before it is compiled by the GPU
     */
    processFinalCode?: (postProcessName: string, shaderType: string, code: string) => string;
    /**
     * If provided, will be called before creating the effect to collect additional custom bindings (defines, uniforms, samplers)
     */
    defineCustomBindings?: (postProcessName: string, defines: Nullable<string>, uniforms: string[], samplers: string[]) => Nullable<string>;
    /**
     * If provided, will be called when binding inputs to the shader code to allow the user to add custom bindings
     */
    bindCustomBindings?: (postProcessName: string, effect: Effect) => void;
};

/**
 * Options to create an EffectWrapper
 */
export interface EffectWrapperCreationOptions {
    /**
     * Engine to use to create the effect
     */
    engine?: AbstractEngine;
    /**
     * Fragment shader for the effect
     */
    fragmentShader?: string;
    /**
     * Use the shader store instead of direct source code
     */
    useShaderStore?: boolean;
    /**
     * Vertex shader for the effect (default: "postprocess")
     */
    vertexShader?: string;
    /**
     * Alias for vertexShader
     */
    vertexUrl?: string;
    /**
     * Attributes to use in the shader (default: ["position"])
     */
    attributeNames?: Array<string>;
    /**
     * Uniforms to use in the shader
     */
    uniformNames?: Array<string>;
    /**
     * Alias for uniformNames. Note that if it is provided, it takes precedence over uniformNames.
     */
    uniforms?: Nullable<string[]>;
    /**
     * Texture sampler names to use in the shader
     */
    samplerNames?: Array<string>;
    /**
     * Alias for samplerNames. Note that if it is provided, it takes precedence over samplerNames.
     */
    samplers?: Nullable<string[]>;
    /**
     * The list of uniform buffers used in the shader (if any)
     */
    uniformBuffers?: Nullable<string[]>;
    /**
     * Defines to use in the shader
     */
    defines?: Nullable<string | Array<string>>;
    /**
     * The index parameters to be used for babylons include syntax "#include<kernelBlurVaryingDeclaration>[0..varyingCount]". (default: undefined)
     * See usage in babylon.blurPostProcess.ts and kernelBlur.vertex.fx
     */
    indexParameters?: any;
    /**
     * If the shader should not be compiled immediately. (default: false)
     */
    blockCompilation?: boolean;
    /**
     * Callback when effect is compiled
     */
    onCompiled?: Nullable<(effect: Effect) => void>;
    /**
     * The friendly name of the effect (default: "effectWrapper")
     */
    name?: string;
    /**
     * The language the shader is written in (default: GLSL)
     */
    shaderLanguage?: ShaderLanguage;
    /**
     * Defines additional code to call to prepare the shader code
     */
    extraInitializations?: (useWebGPU: boolean, list: Promise<any>[]) => void;
    /**
     * Additional async code to run before preparing the effect
     */
    extraInitializationsAsync?: () => Promise<void>;
    /**
     * If the effect should be used as a post process (default: false). If true, the effect will be created with a "scale" uniform and a "textureSampler" sampler
     */
    useAsPostProcess?: boolean;
}

/**
 * Wraps an effect to be used for rendering
 */
export class EffectWrapper {
    /**
     * Force code to compile to glsl even on WebGPU engines.
     * False by default. This is mostly meant for backward compatibility.
     */
    public static ForceGLSL = false;

    private static _CustomShaderCodeProcessing: { [effectWrapperName: string]: EffectWrapperCustomShaderCodeProcessing } = {};

    /**
     * Registers a shader code processing with an effect wrapper name.
     * @param effectWrapperName name of the effect wrapper. Use null for the fallback shader code processing. This is the shader code processing that will be used in case no specific shader code processing has been associated to an effect wrapper name
     * @param customShaderCodeProcessing shader code processing to associate to the effect wrapper name
     */
    public static RegisterShaderCodeProcessing(effectWrapperName: Nullable<string>, customShaderCodeProcessing?: EffectWrapperCustomShaderCodeProcessing) {
        if (!customShaderCodeProcessing) {
            delete EffectWrapper._CustomShaderCodeProcessing[effectWrapperName ?? ""];
            return;
        }

        EffectWrapper._CustomShaderCodeProcessing[effectWrapperName ?? ""] = customShaderCodeProcessing;
    }

    private static _GetShaderCodeProcessing(effectWrapperName: string) {
        return EffectWrapper._CustomShaderCodeProcessing[effectWrapperName] ?? EffectWrapper._CustomShaderCodeProcessing[""];
    }

    /**
     * Gets or sets the name of the effect wrapper
     */
    public get name() {
        return this.options.name;
    }

    public set name(value: string) {
        this.options.name = value;
    }

    /**
     * Type of alpha mode to use when applying the effect (default: Engine.ALPHA_DISABLE)
     */
    public alphaMode = Constants.ALPHA_DISABLE;

    /**
     * Executed when the effect is created
     * @returns effect that was created for this effect wrapper
     */
    public onEffectCreatedObservable = new Observable<Effect>(undefined, true);

    /**
     * Options used to create the effect wrapper
     */
    public readonly options: Required<NonNullableFields<EffectWrapperCreationOptions>>;

    /**
     * Get a value indicating if the effect is ready to be used
     * @returns true if the post-process is ready (shader is compiled)
     */
    public isReady() {
        return this._drawWrapper.effect?.isReady() ?? false;
    }

    /**
     * Get the draw wrapper associated with the effect wrapper
     * @returns the draw wrapper associated with the effect wrapper
     */
    public get drawWrapper() {
        return this._drawWrapper;
    }

    /**
     * Event that is fired (only when the EffectWrapper is used with an EffectRenderer) right before the effect is drawn (should be used to update uniforms)
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

    protected readonly _drawWrapper: DrawWrapper;
    protected _shadersLoaded = false;
    protected readonly _shaderPath: IShaderPath;
    /** @internal */
    public _webGPUReady = false;

    private _onContextRestoredObserver: Nullable<Observer<AbstractEngine>>;

    /**
     * Creates an effect to be rendered
     * @param creationOptions options to create the effect
     */
    constructor(creationOptions: EffectWrapperCreationOptions) {
        this.options = {
            ...creationOptions,
            name: creationOptions.name || "effectWrapper",
            engine: creationOptions.engine!,
            uniforms: creationOptions.uniforms || creationOptions.uniformNames || [],
            uniformNames: undefined as any,
            samplers: creationOptions.samplers || creationOptions.samplerNames || [],
            samplerNames: undefined as any,
            attributeNames: creationOptions.attributeNames || ["position"],
            uniformBuffers: creationOptions.uniformBuffers || [],
            defines: creationOptions.defines || "",
            useShaderStore: creationOptions.useShaderStore || false,
            vertexUrl: creationOptions.vertexUrl || creationOptions.vertexShader || "postprocess",
            vertexShader: undefined as any,
            fragmentShader: creationOptions.fragmentShader || "pass",
            indexParameters: creationOptions.indexParameters,
            blockCompilation: creationOptions.blockCompilation || false,
            shaderLanguage: creationOptions.shaderLanguage || ShaderLanguage.GLSL,
            onCompiled: creationOptions.onCompiled || (undefined as any),
            extraInitializations: creationOptions.extraInitializations || (undefined as any),
            extraInitializationsAsync: creationOptions.extraInitializationsAsync || (undefined as any),
            useAsPostProcess: creationOptions.useAsPostProcess ?? false,
        };

        this.options.uniformNames = this.options.uniforms;
        this.options.samplerNames = this.options.samplers;
        this.options.vertexShader = this.options.vertexUrl;

        if (this.options.useAsPostProcess) {
            if (this.options.samplers.indexOf("textureSampler") === -1) {
                this.options.samplers.push("textureSampler");
            }
            if (this.options.uniforms.indexOf("scale") === -1) {
                this.options.uniforms.push("scale");
            }
        }

        if (creationOptions.vertexUrl || creationOptions.vertexShader) {
            this._shaderPath = {
                vertexSource: this.options.vertexShader,
            };
        } else {
            if (!this.options.useAsPostProcess) {
                this.options.uniforms.push("scale");

                this.onApplyObservable.add(() => {
                    this.effect.setFloat2("scale", 1, 1);
                });
            }

            this._shaderPath = {
                vertex: this.options.vertexShader,
            };
        }

        this._shaderPath.fragmentSource = this.options.fragmentShader;
        this._shaderPath.spectorName = this.options.name;

        if (this.options.useShaderStore) {
            this._shaderPath.fragment = this._shaderPath.fragmentSource;
            if (!this._shaderPath.vertex) {
                this._shaderPath.vertex = this._shaderPath.vertexSource;
            }

            delete this._shaderPath.fragmentSource;
            delete this._shaderPath.vertexSource;
        }

        this.onApplyObservable.add(() => {
            this.bind();
        });

        if (!this.options.useShaderStore) {
            this._onContextRestoredObserver = this.options.engine.onContextRestoredObservable.add(() => {
                this.effect._pipelineContext = null; // because _prepareEffect will try to dispose this pipeline before recreating it and that would lead to webgl errors
                this.effect._prepareEffect();
            });
        }

        this._drawWrapper = new DrawWrapper(this.options.engine);
        this._webGPUReady = this.options.shaderLanguage === ShaderLanguage.WGSL;

        const defines = Array.isArray(this.options.defines) ? this.options.defines.join("\n") : this.options.defines;

        this._postConstructor(this.options.blockCompilation, defines, this.options.extraInitializations);
    }

    protected _gatherImports(useWebGPU = false, list: Promise<any>[]) {
        if (!this.options.useAsPostProcess) {
            return;
        }

        // this._webGPUReady is used to detect when an effect wrapper is intended to be used with WebGPU
        if (useWebGPU && this._webGPUReady) {
            list.push(Promise.all([import("../ShadersWGSL/postprocess.vertex")]));
        } else {
            list.push(Promise.all([import("../Shaders/postprocess.vertex")]));
        }
    }

    private _importPromises: Array<Promise<any>> = [];

    /** @internal */
    public _postConstructor(
        blockCompilation: boolean,
        defines: Nullable<string> = null,
        extraInitializations?: (useWebGPU: boolean, list: Promise<any>[]) => void,
        importPromises?: Array<Promise<any>>
    ) {
        this._importPromises.length = 0;

        if (importPromises) {
            this._importPromises.push(...importPromises);
        }

        const useWebGPU = this.options.engine.isWebGPU && !EffectWrapper.ForceGLSL;

        this._gatherImports(useWebGPU, this._importPromises);
        if (extraInitializations !== undefined) {
            extraInitializations(useWebGPU, this._importPromises);
        }

        if (useWebGPU && this._webGPUReady) {
            this.options.shaderLanguage = ShaderLanguage.WGSL;
        }

        if (!blockCompilation) {
            this.updateEffect(defines);
        }
    }

    /**
     * Updates the effect with the current effect wrapper compile time values and recompiles the shader.
     * @param defines Define statements that should be added at the beginning of the shader. (default: null)
     * @param uniforms Set of uniform variables that will be passed to the shader. (default: null)
     * @param samplers Set of Texture2D variables that will be passed to the shader. (default: null)
     * @param indexParameters The index parameters to be used for babylons include syntax "#include<kernelBlurVaryingDeclaration>[0..varyingCount]". (default: undefined) See usage in babylon.blurPostProcess.ts and kernelBlur.vertex.fx
     * @param onCompiled Called when the shader has been compiled.
     * @param onError Called if there is an error when compiling a shader.
     * @param vertexUrl The url of the vertex shader to be used (default: the one given at construction time)
     * @param fragmentUrl The url of the fragment shader to be used (default: the one given at construction time)
     */
    public updateEffect(
        defines: Nullable<string> = null,
        uniforms: Nullable<string[]> = null,
        samplers: Nullable<string[]> = null,
        indexParameters?: any,
        onCompiled?: (effect: Effect) => void,
        onError?: (effect: Effect, errors: string) => void,
        vertexUrl?: string,
        fragmentUrl?: string
    ) {
        const customShaderCodeProcessing = EffectWrapper._GetShaderCodeProcessing(this.name);
        if (customShaderCodeProcessing?.defineCustomBindings) {
            const newUniforms = uniforms?.slice() ?? [];
            newUniforms.push(...this.options.uniforms);

            const newSamplers = samplers?.slice() ?? [];
            newSamplers.push(...this.options.samplers);

            defines = customShaderCodeProcessing.defineCustomBindings(this.name, defines, newUniforms, newSamplers);
            uniforms = newUniforms;
            samplers = newSamplers;
        }

        this.options.defines = defines || "";

        const waitImportsLoaded =
            this._shadersLoaded || this._importPromises.length === 0
                ? undefined
                : async () => {
                      await Promise.all(this._importPromises);
                      this._shadersLoaded = true;
                  };

        let extraInitializationsAsync: (() => Promise<void>) | undefined;
        if (this.options.extraInitializationsAsync) {
            extraInitializationsAsync = async () => {
                waitImportsLoaded?.();
                await this.options.extraInitializationsAsync;
            };
        } else {
            extraInitializationsAsync = waitImportsLoaded;
        }

        if (this.options.useShaderStore) {
            this._drawWrapper.effect = this.options.engine.createEffect(
                { vertex: vertexUrl ?? this._shaderPath.vertex, fragment: fragmentUrl ?? this._shaderPath.fragment },
                {
                    attributes: this.options.attributeNames,
                    uniformsNames: uniforms || this.options.uniforms,
                    uniformBuffersNames: this.options.uniformBuffers,
                    samplers: samplers || this.options.samplers,
                    defines: defines !== null ? defines : "",
                    fallbacks: null,
                    onCompiled: onCompiled ?? this.options.onCompiled,
                    onError: onError ?? null,
                    indexParameters: indexParameters || this.options.indexParameters,
                    processCodeAfterIncludes: customShaderCodeProcessing?.processCodeAfterIncludes
                        ? (shaderType: string, code: string) => customShaderCodeProcessing!.processCodeAfterIncludes!(this.name, shaderType, code)
                        : null,
                    processFinalCode: customShaderCodeProcessing?.processFinalCode
                        ? (shaderType: string, code: string) => customShaderCodeProcessing!.processFinalCode!(this.name, shaderType, code)
                        : null,
                    shaderLanguage: this.options.shaderLanguage,
                    extraInitializationsAsync,
                },
                this.options.engine
            );
        } else {
            this._drawWrapper.effect = new Effect(
                this._shaderPath,
                this.options.attributeNames,
                uniforms || this.options.uniforms,
                samplers || this.options.samplerNames,
                this.options.engine,
                defines,
                undefined,
                onCompiled || this.options.onCompiled,
                undefined,
                undefined,
                undefined,
                this.options.shaderLanguage,
                extraInitializationsAsync
            );
        }

        this.onEffectCreatedObservable.notifyObservers(this._drawWrapper.effect);
    }

    /**
     * Binds the data to the effect.
     */
    public bind() {
        this.options.engine.setAlphaMode(this.alphaMode);

        if (this.options.useAsPostProcess) {
            this.drawWrapper.effect!.setFloat2("scale", 1, 1);
        }

        EffectWrapper._GetShaderCodeProcessing(this.name)?.bindCustomBindings?.(this.name, this._drawWrapper.effect!);
    }

    /**
     * Disposes of the effect wrapper
     * @param _ignored kept for backward compatibility
     */
    public dispose(_ignored: boolean = false) {
        if (this._onContextRestoredObserver) {
            this.effect.getEngine().onContextRestoredObservable.remove(this._onContextRestoredObserver);
            this._onContextRestoredObserver = null;
        }
        this.onEffectCreatedObservable.clear();
        this.effect.dispose();
    }
}

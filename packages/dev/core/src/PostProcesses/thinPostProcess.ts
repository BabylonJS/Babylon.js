// eslint-disable-next-line import/no-internal-modules
import type { Nullable, Effect, AbstractEngine, NonNullableFields } from "core/index";
import { Constants } from "../Engines/constants";
import { Observable } from "../Misc/observable";
import { DrawWrapper } from "../Materials/drawWrapper";
import { ShaderLanguage } from "../Materials/shaderLanguage";
import { EngineStore } from "core/Engines/engineStore";

/**
 * Allows for custom processing of the shader code used by a post process
 */
export type ThinPostProcessCustomShaderCodeProcessing = {
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
 * Options for the PostProcess constructor
 */
export type ThinPostProcessOptions = {
    /**
     * The list of uniforms used in the shader (if any)
     */
    uniforms?: Nullable<string[]>;
    /**
     * The list of samplers used in the shader (if any)
     */
    samplers?: Nullable<string[]>;
    /**
     * The list of uniform buffers used in the shader (if any)
     */
    uniformBuffers?: Nullable<string[]>;
    /**
     * String of defines that will be set when running the fragment shader. (default: null)
     */
    defines?: Nullable<string>;
    /**
     * The url of the vertex shader to be used. (default: "postprocess")
     */
    vertexUrl?: string;
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
     * The shader language of the shader. (default: GLSL)
     */
    shaderLanguage?: ShaderLanguage;
    /**
     * Defines additional code to call to prepare the shader code
     */
    extraInitializations?: (useWebGPU: boolean, list: Promise<any>[]) => void;
};

export class ThinPostProcess {
    /**
     * Force all the postprocesses to compile to glsl even on WebGPU engines.
     * False by default. This is mostly meant for backward compatibility.
     */
    public static ForceGLSL = false;

    private static _CustomShaderCodeProcessing: { [postProcessName: string]: ThinPostProcessCustomShaderCodeProcessing } = {};

    /**
     * Registers a shader code processing with a post process name.
     * @param postProcessName name of the post process. Use null for the fallback shader code processing. This is the shader code processing that will be used in case no specific shader code processing has been associated to a post process name
     * @param customShaderCodeProcessing shader code processing to associate to the post process name
     */
    public static RegisterShaderCodeProcessing(postProcessName: Nullable<string>, customShaderCodeProcessing?: ThinPostProcessCustomShaderCodeProcessing) {
        if (!customShaderCodeProcessing) {
            delete ThinPostProcess._CustomShaderCodeProcessing[postProcessName ?? ""];
            return;
        }

        ThinPostProcess._CustomShaderCodeProcessing[postProcessName ?? ""] = customShaderCodeProcessing;
    }

    private static _GetShaderCodeProcessing(postProcessName: string) {
        return ThinPostProcess._CustomShaderCodeProcessing[postProcessName] ?? ThinPostProcess._CustomShaderCodeProcessing[""];
    }

    /** Name of the PostProcess. */
    public name: string;

    /**
     * Type of alpha mode to use when performing the post process (default: Engine.ALPHA_DISABLE)
     */
    public alphaMode = Constants.ALPHA_DISABLE;

    /**
     * Executed when the effect was created
     * @returns effect that was created for this post process
     */
    public onEffectCreatedObservable = new Observable<Effect>(undefined, true);

    /**
     * Options used to create the post process
     */
    public readonly options: Required<NonNullableFields<ThinPostProcessOptions>>;

    /**
     * Get a value indicating if the post-process is ready to be used
     * @returns true if the post-process is ready (shader is compiled)
     */
    public isReady() {
        return this._drawWrapper.effect?.isReady() ?? false;
    }

    /**
     * Get the draw wrapper associated with the post process
     * @returns the draw wrapper associated with the post process
     */
    public get drawWrapper() {
        return this._drawWrapper;
    }

    protected _engine: AbstractEngine;
    protected _drawWrapper: DrawWrapper;
    protected _fragmentUrl: string;
    protected _shadersLoaded = false;
    /** @internal */
    public _webGPUReady = false;

    /**
     * Creates a new instance PostProcess
     * @param name The name of the PostProcess.
     * @param fragmentUrl The url of the fragment shader to be used.
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param options The options to be used when constructing the post process.
     */
    constructor(name: string, fragmentUrl: string, engine: Nullable<AbstractEngine> = null, options?: ThinPostProcessOptions) {
        engine = engine || EngineStore.LastCreatedEngine;

        this.name = name;
        this._fragmentUrl = fragmentUrl;
        this._engine = engine!;

        this.options = {
            ...options,
            uniforms: options?.uniforms ?? [],
            samplers: options?.samplers ?? [],
            uniformBuffers: options?.uniformBuffers ?? [],
            defines: options?.defines ?? "",
            vertexUrl: options?.vertexUrl ?? "postprocess",
            indexParameters: options?.indexParameters,
            blockCompilation: options?.blockCompilation ?? false,
            shaderLanguage: options?.shaderLanguage ?? ShaderLanguage.GLSL,
            extraInitializations: options?.extraInitializations ?? (undefined as any),
        };

        if (this.options.uniforms.indexOf("textureSampler") === -1) {
            this.options.samplers.push("textureSampler");
        }
        if (this.options.uniforms.indexOf("scale") === -1) {
            this.options.uniforms.push("scale");
        }

        this._drawWrapper = new DrawWrapper(this._engine);
        this._webGPUReady = this.options.shaderLanguage === ShaderLanguage.WGSL;

        this._postConstructor(this.options.blockCompilation, this.options.defines, this.options.extraInitializations);
    }

    protected _gatherImports(useWebGPU = false, list: Promise<any>[]) {
        // this._webGPUReady is used to detect when a postprocess is intended to be used with WebGPU
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

        const useWebGPU = this._engine.isWebGPU && !ThinPostProcess.ForceGLSL;

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
     * Updates the effect with the current post process compile time values and recompiles the shader.
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
        const customShaderCodeProcessing = ThinPostProcess._GetShaderCodeProcessing(this.name);
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

        this._drawWrapper.effect = this._engine.createEffect(
            { vertex: vertexUrl ?? this.options.vertexUrl, fragment: fragmentUrl ?? this._fragmentUrl },
            {
                attributes: ["position"],
                uniformsNames: uniforms || this.options.uniforms,
                uniformBuffersNames: this.options.uniformBuffers,
                samplers: samplers || this.options.samplers,
                defines: defines !== null ? defines : "",
                fallbacks: null,
                onCompiled: onCompiled ?? null,
                onError: onError ?? null,
                indexParameters: indexParameters || this.options.indexParameters,
                processCodeAfterIncludes: customShaderCodeProcessing?.processCodeAfterIncludes
                    ? (shaderType: string, code: string) => customShaderCodeProcessing!.processCodeAfterIncludes!(this.name, shaderType, code)
                    : null,
                processFinalCode: customShaderCodeProcessing?.processFinalCode
                    ? (shaderType: string, code: string) => customShaderCodeProcessing!.processFinalCode!(this.name, shaderType, code)
                    : null,
                shaderLanguage: this.options.shaderLanguage,
                extraInitializationsAsync: this._shadersLoaded
                    ? undefined
                    : async () => {
                          await Promise.all(this._importPromises);
                          this._shadersLoaded = true;
                      },
            },
            this._engine
        );
        this.onEffectCreatedObservable.notifyObservers(this._drawWrapper.effect);
    }

    /**
     * Binds the data to the effect.
     */
    public bind() {
        this._engine.setAlphaMode(this.alphaMode);

        this.drawWrapper.effect!.setFloat2("scale", 1, 1);

        ThinPostProcess._GetShaderCodeProcessing(this.name)?.bindCustomBindings?.(this.name, this._drawWrapper.effect!);
    }

    /**
     * Disposes the post process.
     */
    public dispose(): void {
        this.onEffectCreatedObservable.clear();
    }
}

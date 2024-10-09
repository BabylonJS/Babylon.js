import type { Nullable } from "../types";
import { Observable } from "../Misc/observable";
import { Vector2 } from "../Maths/math.vector";
import type { Effect } from "../Materials/effect";
import { Constants } from "../Engines/constants";
import type { Color4 } from "../Maths/math.color";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";
import { GetClass } from "../Misc/typeStore";
import { DrawWrapper } from "../Materials/drawWrapper";
import { ShaderLanguage } from "../Materials/shaderLanguage";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { EngineStore } from "core/Engines/engineStore";
import type { IInspectable } from "core/Misc/iInspectable";
import type { Scene } from "core/scene";
import type { Camera } from "core/Cameras/camera";
import type { Animation } from "../Animations/animation";

/**
 * Allows for custom processing of the shader code used by a post process
 */
export type PostProcessCoreCustomShaderCodeProcessing = {
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
export type PostProcessCoreOptions = {
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
     * The size of the post process texture.
     * It is either a ratio to downscale or upscale the texture create for this post process, or an object containing width and height values.
     * Default: 1
     */
    size?: number | { width: number; height: number };
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

type NonNullableFields<T> = {
    [P in keyof T]: NonNullable<T[P]>;
};

export class PostProcessCore {
    /**
     * Force all the postprocesses to compile to glsl even on WebGPU engines.
     * False by default. This is mostly meant for backward compatibility.
     */
    public static ForceGLSL = false;

    private static _CustomShaderCodeProcessing: { [postProcessName: string]: PostProcessCoreCustomShaderCodeProcessing } = {};

    /**
     * Registers a shader code processing with a post process name.
     * @param postProcessName name of the post process. Use null for the fallback shader code processing. This is the shader code processing that will be used in case no specific shader code processing has been associated to a post process name
     * @param customShaderCodeProcessing shader code processing to associate to the post process name
     */
    public static RegisterShaderCodeProcessing(postProcessName: Nullable<string>, customShaderCodeProcessing?: PostProcessCoreCustomShaderCodeProcessing) {
        if (!customShaderCodeProcessing) {
            delete PostProcessCore._CustomShaderCodeProcessing[postProcessName ?? ""];
            return;
        }

        PostProcessCore._CustomShaderCodeProcessing[postProcessName ?? ""] = customShaderCodeProcessing;
    }

    private static _GetShaderCodeProcessing(postProcessName: string) {
        return PostProcessCore._CustomShaderCodeProcessing[postProcessName] ?? PostProcessCore._CustomShaderCodeProcessing[""];
    }

    /** Name of the PostProcess. */
    @serialize()
    public name: string;

    /**
     * Type of alpha mode to use when performing the post process (default: Engine.ALPHA_DISABLE)
     */
    @serialize()
    public alphaMode = Constants.ALPHA_DISABLE;

    /**
     * Sets the setAlphaBlendConstants of the babylon engine
     */
    @serialize()
    public alphaConstants: Color4;

    /**
     * Animations to be used for the post processing
     */
    public animations: Animation[] = [];

    /**
     * List of inspectable custom properties (used by the Inspector)
     * @see https://doc.babylonjs.com/toolsAndResources/inspector#extensibility
     */
    public inspectableCustomProperties: IInspectable[];

    public scaleRatio = new Vector2(1, 1);

    /**
     * Gets a string identifying the name of the class
     * @returns "PostProcessCore" string
     */
    public getClassName(): string {
        return "PostProcessCore";
    }

    /**
     * Gets the engine which this post process belongs to.
     * @returns The engine the post process was enabled with.
     */
    public getEngine(): AbstractEngine {
        return this._engine;
    }

    /**
     * The effect that is created when initializing the post process.
     * @returns The created effect corresponding to the postprocess.
     */
    public getEffect(): Effect {
        return this._drawWrapper.effect!;
    }

    /**
     * The drawWrapper that is created when initializing the post process.
     * @returns The created drawWrapper corresponding to the postprocess.
     */
    public getDrawWrapper(): DrawWrapper {
        return this._drawWrapper;
    }

    /**
     * Returns the fragment url or shader name used in the post process.
     * @returns the fragment url or name in the shader store.
     */
    public getEffectName(): string {
        return this._fragmentUrl;
    }

    /**
     * Gets the shader language type used to generate vertex and fragment source code.
     */
    public get shaderLanguage(): ShaderLanguage {
        return this.options.shaderLanguage;
    }

    /**
     * If the post process is supported.
     */
    public get isSupported(): boolean {
        return this._drawWrapper.effect!.isSupported;
    }

    /**
     * Get a value indicating if the post-process is ready to be used
     * @returns true if the post-process is ready (shader is compiled)
     */
    public isReady(): boolean {
        return this._drawWrapper.effect?.isReady() ?? false;
    }

    public options: Required<NonNullableFields<PostProcessCoreOptions>>;

    /**
     * Executed when the effect was created
     * @returns effect that was created for this post process
     */
    public onEffectCreatedObservable = new Observable<Effect>(undefined, true);

    /**
     * An event triggered when the postprocess applies its effect.
     */
    public onApplyObservable = new Observable<Effect>();

    protected _engine: AbstractEngine;
    protected _fragmentUrl: string;
    protected _drawWrapper: DrawWrapper;
    protected _shadersLoaded = false;
    protected _webGPUReady = false;

    /**
     * Creates a new instance PostProcess
     * @param name The name of the PostProcess.
     * @param fragmentUrl The url of the fragment shader to be used.
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param options The options to be used when constructing the post process.
     */
    constructor(name: string, fragmentUrl: string, engine: Nullable<AbstractEngine> = null, options?: PostProcessCoreOptions) {
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
            size: options?.size ?? 1,
            vertexUrl: options?.vertexUrl ?? "postprocess",
            indexParameters: options?.indexParameters,
            blockCompilation: options?.blockCompilation ?? false,
            shaderLanguage: options?.shaderLanguage ?? ShaderLanguage.GLSL,
            extraInitializations: options?.extraInitializations ?? (undefined as any),
        };

        this.options.samplers.push("textureSampler");
        this.options.uniforms.push("scale");
        this._drawWrapper = new DrawWrapper(this._engine);

        this._webGPUReady = this.options.shaderLanguage === ShaderLanguage.WGSL;

        this._postConstructor();
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

    private _postConstructor() {
        const useWebGPU = this._engine.isWebGPU && !PostProcessCore.ForceGLSL;

        this._gatherImports(useWebGPU, this._importPromises);
        if (this.options.extraInitializations !== undefined) {
            this.options.extraInitializations(useWebGPU, this._importPromises);
        }

        if (useWebGPU && this._webGPUReady) {
            this.options.shaderLanguage = ShaderLanguage.WGSL;
        }

        if (!this.options.blockCompilation) {
            this.updateEffect(this.options.defines);
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
        const customShaderCodeProcessing = PostProcessCore._GetShaderCodeProcessing(this.name);
        if (customShaderCodeProcessing?.defineCustomBindings) {
            const newUniforms = uniforms?.slice() ?? [];
            newUniforms.push(...this.options.uniforms);

            const newSamplers = samplers?.slice() ?? [];
            newSamplers.push(...this.options.samplers);

            defines = customShaderCodeProcessing.defineCustomBindings(this.name, defines, newUniforms, newSamplers);
            uniforms = newUniforms;
            samplers = newSamplers;
        }

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

    public bind() {
        this._engine.setAlphaMode(this.alphaMode, true);
        if (this.alphaConstants) {
            this.getEngine().setAlphaConstants(this.alphaConstants.r, this.alphaConstants.g, this.alphaConstants.b, this.alphaConstants.a);
        }

        this._drawWrapper.effect!.setVector2("scale", this.scaleRatio);

        this.onApplyObservable.notifyObservers(this._drawWrapper.effect!);

        PostProcessCore._GetShaderCodeProcessing(this.name)?.bindCustomBindings?.(this.name, this._drawWrapper.effect!);
    }

    /**
     * Disposes the post process.
     */
    public dispose(): void {
        this.onApplyObservable.clear();
        this.onEffectCreatedObservable.clear();
    }

    /**
     * Serializes the post process to a JSON object
     * @returns the JSON object
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON." + this.getClassName();
        serializationObject.options = { ...this.options };

        return serializationObject;
    }

    /**
     * Clones this post process
     * @returns a new post process similar to this one
     */
    public clone(): Nullable<PostProcessCore> {
        const serializationObject = this.serialize();
        serializationObject._engine = this._engine;

        const result = PostProcessCore.Parse(serializationObject, null, "");

        if (!result) {
            return null;
        }

        result.onApplyObservable = this.onApplyObservable.clone();
        result.onEffectCreatedObservable = this.onEffectCreatedObservable.clone();

        return result;
    }

    /**
     * Creates a post process from parsed post process data
     * @param parsedPostProcess defines parsed post process data
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures
     * @returns a new post process
     */
    public static Parse(parsedPostProcess: any, scene: Nullable<Scene>, rootUrl: string): Nullable<PostProcessCore> {
        const postProcessType = GetClass(parsedPostProcess.customType);

        if (!postProcessType) {
            return null;
        }

        return postProcessType._Parse(parsedPostProcess, null, scene, rootUrl);
    }

    /**
     * @internal
     */
    public static _Parse(parsedPostProcess: any, _targetCamera: Nullable<Camera>, scene: Nullable<Scene>, rootUrl: string): Nullable<PostProcessCore> {
        return SerializationHelper.Parse(
            () => {
                return new PostProcessCore(parsedPostProcess.name, parsedPostProcess.fragmentUrl, parsedPostProcess._engine, parsedPostProcess.options);
            },
            parsedPostProcess,
            scene,
            rootUrl
        );
    }
}

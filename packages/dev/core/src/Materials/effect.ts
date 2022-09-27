import { Observable } from "../Misc/observable";
import type { FloatArray, Nullable } from "../types";
import { Constants } from "../Engines/constants";
import { GetDOMTextContent, IsWindowObjectExist } from "../Misc/domManagement";
import { Logger } from "../Misc/logger";
import type { IDisposable } from "../scene";
import type { IPipelineContext } from "../Engines/IPipelineContext";
import type { DataBuffer } from "../Buffers/dataBuffer";
import { ShaderProcessor } from "../Engines/Processors/shaderProcessor";
import type { ProcessingOptions, ShaderCustomProcessingFunction, ShaderProcessingContext } from "../Engines/Processors/shaderProcessingOptions";
import type { IMatrixLike, IVector2Like, IVector3Like, IVector4Like, IColor3Like, IColor4Like, IQuaternionLike } from "../Maths/math.like";
import type { ThinEngine } from "../Engines/thinEngine";
import type { IEffectFallbacks } from "./iEffectFallbacks";
import { ShaderStore as EngineShaderStore } from "../Engines/shaderStore";
import { ShaderLanguage } from "./shaderLanguage";

declare type Engine = import("../Engines/engine").Engine;
declare type InternalTexture = import("../Materials/Textures/internalTexture").InternalTexture;
declare type ThinTexture = import("../Materials/Textures/thinTexture").ThinTexture;
declare type RenderTargetTexture = import("../Materials/Textures/renderTargetTexture").RenderTargetTexture;
declare type PostProcess = import("../PostProcesses/postProcess").PostProcess;

/**
 * Options to be used when creating an effect.
 */
export interface IEffectCreationOptions {
    /**
     * Attributes that will be used in the shader.
     */
    attributes: string[];
    /**
     * Uniform variable names that will be set in the shader.
     */
    uniformsNames: string[];
    /**
     * Uniform buffer variable names that will be set in the shader.
     */
    uniformBuffersNames: string[];
    /**
     * Sampler texture variable names that will be set in the shader.
     */
    samplers: string[];
    /**
     * Define statements that will be set in the shader.
     */
    defines: any;
    /**
     * Possible fallbacks for this effect to improve performance when needed.
     */
    fallbacks: Nullable<IEffectFallbacks>;
    /**
     * Callback that will be called when the shader is compiled.
     */
    onCompiled: Nullable<(effect: Effect) => void>;
    /**
     * Callback that will be called if an error occurs during shader compilation.
     */
    onError: Nullable<(effect: Effect, errors: string) => void>;
    /**
     * Parameters to be used with Babylons include syntax to iterate over an array (eg. {lights: 10})
     */
    indexParameters?: any;
    /**
     * Max number of lights that can be used in the shader.
     */
    maxSimultaneousLights?: number;
    /**
     * See https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/transformFeedbackVaryings
     */
    transformFeedbackVaryings?: Nullable<string[]>;
    /**
     * If provided, will be called two times with the vertex and fragment code so that this code can be updated before it is compiled by the GPU
     */
    processFinalCode?: Nullable<ShaderCustomProcessingFunction>;
    /**
     * If provided, will be called two times with the vertex and fragment code so that this code can be updated after the #include have been processed
     */
    processCodeAfterIncludes?: Nullable<ShaderCustomProcessingFunction>;
    /**
     * Is this effect rendering to several color attachments ?
     */
    multiTarget?: boolean;
    /**
     * The language the shader is written in (default: GLSL)
     */
    shaderLanguage?: ShaderLanguage;
}

/**
 * Effect containing vertex and fragment shader that can be executed on an object.
 */
export class Effect implements IDisposable {
    /**
     * Gets or sets the relative url used to load shaders if using the engine in non-minified mode
     */
    public static get ShadersRepository(): string {
        return EngineShaderStore.ShadersRepository;
    }
    public static set ShadersRepository(repo: string) {
        EngineShaderStore.ShadersRepository = repo;
    }
    /**
     * Enable logging of the shader code when a compilation error occurs
     */
    public static LogShaderCodeOnCompilationError = true;
    /**
     * Name of the effect.
     */
    public name: any = null;
    /**
     * String container all the define statements that should be set on the shader.
     */
    public defines: string = "";
    /**
     * Callback that will be called when the shader is compiled.
     */
    public onCompiled: Nullable<(effect: Effect) => void> = null;
    /**
     * Callback that will be called if an error occurs during shader compilation.
     */
    public onError: Nullable<(effect: Effect, errors: string) => void> = null;
    /**
     * Callback that will be called when effect is bound.
     */
    public onBind: Nullable<(effect: Effect) => void> = null;
    /**
     * Unique ID of the effect.
     */
    public uniqueId = 0;
    /**
     * Observable that will be called when the shader is compiled.
     * It is recommended to use executeWhenCompile() or to make sure that scene.isReady() is called to get this observable raised.
     */
    public onCompileObservable = new Observable<Effect>();
    /**
     * Observable that will be called if an error occurs during shader compilation.
     */
    public onErrorObservable = new Observable<Effect>();

    /** @internal */
    public _onBindObservable: Nullable<Observable<Effect>> = null;

    /**
     * @internal
     * Specifies if the effect was previously ready
     */
    public _wasPreviouslyReady = false;

    /**
     * @internal
     * Specifies if the effect was previously using instances
     */
    public _wasPreviouslyUsingInstances: Nullable<boolean> = null;

    private _isDisposed = false;

    /**
     * Observable that will be called when effect is bound.
     */
    public get onBindObservable(): Observable<Effect> {
        if (!this._onBindObservable) {
            this._onBindObservable = new Observable<Effect>();
        }

        return this._onBindObservable;
    }

    /** @internal */
    public _bonesComputationForcedToCPU = false;
    /** @internal */
    public _uniformBuffersNames: { [key: string]: number } = {};
    /** @internal */
    public _samplerList: string[];
    /** @internal */
    public _multiTarget: boolean = false;

    private static _UniqueIdSeed = 0;
    /** @internal */
    public _engine: Engine;
    private _uniformBuffersNamesList: string[];
    private _uniformsNames: string[];
    private _samplers: { [key: string]: number } = {};
    private _isReady = false;
    private _compilationError = "";
    private _allFallbacksProcessed = false;
    private _attributesNames: string[];
    private _attributes: number[];
    private _attributeLocationByName: { [name: string]: number };
    private _uniforms: { [key: string]: Nullable<WebGLUniformLocation> } = {};
    /**
     * Key for the effect.
     * @internal
     */
    public _key: string = "";
    private _indexParameters: any;
    private _fallbacks: Nullable<IEffectFallbacks> = null;
    private _vertexSourceCodeOverride: string = "";
    private _fragmentSourceCodeOverride: string = "";
    private _transformFeedbackVaryings: Nullable<string[]> = null;
    private _shaderLanguage: ShaderLanguage;
    /**
     * Compiled shader to webGL program.
     * @internal
     */
    public _pipelineContext: Nullable<IPipelineContext> = null;
    /** @internal */
    public _vertexSourceCode: string = "";
    /** @internal */
    public _fragmentSourceCode: string = "";

    /** @internal */
    private _rawVertexSourceCode: string = "";
    /** @internal */
    private _rawFragmentSourceCode: string = "";

    private static _BaseCache: { [key: number]: DataBuffer } = {};
    private _processingContext: Nullable<ShaderProcessingContext>;

    /**
     * Instantiates an effect.
     * An effect can be used to create/manage/execute vertex and fragment shaders.
     * @param baseName Name of the effect.
     * @param attributesNamesOrOptions List of attribute names that will be passed to the shader or set of all options to create the effect.
     * @param uniformsNamesOrEngine List of uniform variable names that will be passed to the shader or the engine that will be used to render effect.
     * @param samplers List of sampler variables that will be passed to the shader.
     * @param engine Engine to be used to render the effect
     * @param defines Define statements to be added to the shader.
     * @param fallbacks Possible fallbacks for this effect to improve performance when needed.
     * @param onCompiled Callback that will be called when the shader is compiled.
     * @param onError Callback that will be called if an error occurs during shader compilation.
     * @param indexParameters Parameters to be used with Babylons include syntax to iterate over an array (eg. {lights: 10})
     * @param key Effect Key identifying uniquely compiled shader variants
     * @param shaderLanguage the language the shader is written in (default: GLSL)
     */
    constructor(
        baseName: any,
        attributesNamesOrOptions: string[] | IEffectCreationOptions,
        uniformsNamesOrEngine: string[] | ThinEngine,
        samplers: Nullable<string[]> = null,
        engine?: ThinEngine,
        defines: Nullable<string> = null,
        fallbacks: Nullable<IEffectFallbacks> = null,
        onCompiled: Nullable<(effect: Effect) => void> = null,
        onError: Nullable<(effect: Effect, errors: string) => void> = null,
        indexParameters?: any,
        key: string = "",
        shaderLanguage = ShaderLanguage.GLSL
    ) {
        this.name = baseName;
        this._key = key;

        let processCodeAfterIncludes: ShaderCustomProcessingFunction | undefined = undefined;
        let processFinalCode: Nullable<ShaderCustomProcessingFunction> = null;

        if ((<IEffectCreationOptions>attributesNamesOrOptions).attributes) {
            const options = <IEffectCreationOptions>attributesNamesOrOptions;
            this._engine = <Engine>uniformsNamesOrEngine;

            this._attributesNames = options.attributes;
            this._uniformsNames = options.uniformsNames.concat(options.samplers);
            this._samplerList = options.samplers.slice();
            this.defines = options.defines;
            this.onError = options.onError;
            this.onCompiled = options.onCompiled;
            this._fallbacks = options.fallbacks;
            this._indexParameters = options.indexParameters;
            this._transformFeedbackVaryings = options.transformFeedbackVaryings || null;
            this._multiTarget = !!options.multiTarget;
            this._shaderLanguage = options.shaderLanguage ?? ShaderLanguage.GLSL;

            if (options.uniformBuffersNames) {
                this._uniformBuffersNamesList = options.uniformBuffersNames.slice();
                for (let i = 0; i < options.uniformBuffersNames.length; i++) {
                    this._uniformBuffersNames[options.uniformBuffersNames[i]] = i;
                }
            }

            processFinalCode = options.processFinalCode ?? null;
            processCodeAfterIncludes = options.processCodeAfterIncludes ?? undefined;
        } else {
            this._engine = <Engine>engine;
            this.defines = defines == null ? "" : defines;
            this._uniformsNames = (<string[]>uniformsNamesOrEngine).concat(<string[]>samplers);
            this._samplerList = samplers ? <string[]>samplers.slice() : [];
            this._attributesNames = <string[]>attributesNamesOrOptions;
            this._uniformBuffersNamesList = [];
            this._shaderLanguage = shaderLanguage;

            this.onError = onError;
            this.onCompiled = onCompiled;

            this._indexParameters = indexParameters;
            this._fallbacks = fallbacks;
        }

        this._attributeLocationByName = {};

        this.uniqueId = Effect._UniqueIdSeed++;

        let vertexSource: any;
        let fragmentSource: any;

        const hostDocument = IsWindowObjectExist() ? this._engine.getHostDocument() : null;

        if (baseName.vertexSource) {
            vertexSource = "source:" + baseName.vertexSource;
        } else if (baseName.vertexElement) {
            vertexSource = hostDocument ? hostDocument.getElementById(baseName.vertexElement) : null;

            if (!vertexSource) {
                vertexSource = baseName.vertexElement;
            }
        } else {
            vertexSource = baseName.vertex || baseName;
        }

        if (baseName.fragmentSource) {
            fragmentSource = "source:" + baseName.fragmentSource;
        } else if (baseName.fragmentElement) {
            fragmentSource = hostDocument ? hostDocument.getElementById(baseName.fragmentElement) : null;

            if (!fragmentSource) {
                fragmentSource = baseName.fragmentElement;
            }
        } else {
            fragmentSource = baseName.fragment || baseName;
        }

        this._processingContext = this._engine._getShaderProcessingContext(this._shaderLanguage);

        const processorOptions: ProcessingOptions = {
            defines: this.defines.split("\n"),
            indexParameters: this._indexParameters,
            isFragment: false,
            shouldUseHighPrecisionShader: this._engine._shouldUseHighPrecisionShader,
            processor: this._engine._getShaderProcessor(this._shaderLanguage),
            supportsUniformBuffers: this._engine.supportsUniformBuffers,
            shadersRepository: EngineShaderStore.GetShadersRepository(this._shaderLanguage),
            includesShadersStore: EngineShaderStore.GetIncludesShadersStore(this._shaderLanguage),
            version: (this._engine.version * 100).toString(),
            platformName: this._engine.shaderPlatformName,
            processingContext: this._processingContext,
            isNDCHalfZRange: this._engine.isNDCHalfZRange,
            useReverseDepthBuffer: this._engine.useReverseDepthBuffer,
            processCodeAfterIncludes,
        };

        const shaderCodes: [string | undefined, string | undefined] = [undefined, undefined];
        const shadersLoaded = () => {
            if (shaderCodes[0] && shaderCodes[1]) {
                processorOptions.isFragment = true;
                const [migratedVertexCode, fragmentCode] = shaderCodes;
                ShaderProcessor.Process(
                    fragmentCode,
                    processorOptions,
                    (migratedFragmentCode) => {
                        if (processFinalCode) {
                            migratedFragmentCode = processFinalCode("fragment", migratedFragmentCode);
                        }
                        const finalShaders = ShaderProcessor.Finalize(migratedVertexCode, migratedFragmentCode, processorOptions);
                        this._useFinalCode(finalShaders.vertexCode, finalShaders.fragmentCode, baseName);
                    },
                    this._engine
                );
            }
        };
        this._loadShader(vertexSource, "Vertex", "", (vertexCode) => {
            ShaderProcessor.Initialize(processorOptions);
            ShaderProcessor.Process(
                vertexCode,
                processorOptions,
                (migratedVertexCode) => {
                    this._rawVertexSourceCode = vertexCode;
                    if (processFinalCode) {
                        migratedVertexCode = processFinalCode("vertex", migratedVertexCode);
                    }
                    shaderCodes[0] = migratedVertexCode;
                    shadersLoaded();
                },
                this._engine
            );
        });
        this._loadShader(fragmentSource, "Fragment", "Pixel", (fragmentCode) => {
            this._rawFragmentSourceCode = fragmentCode;
            shaderCodes[1] = fragmentCode;
            shadersLoaded();
        });
        const proxyFunction = function (functionName: string) {
            // check if the function exists in the pipelineContext
            return function (this: Effect) {
                if (this._pipelineContext) {
                    const func = this._pipelineContext[functionName as keyof IPipelineContext];
                    (func as (uniformName: string, ...payload: any) => void).apply(this._pipelineContext, arguments);
                }
                return this;
            };
        };
        ["Int?", "IntArray?", "Array?", "Color?", "Vector?", "Float?", "Matrices", "Matrix", "Matrix3x3", "Matrix2x2", "Quaternion", "DirectColor4"].forEach((functionName) => {
            const name = `set${functionName}`;
            if (name.endsWith("?")) {
                ["", 2, 3, 4].forEach((n) => {
                    this[(name.slice(0, -1) + n) as keyof this] = this[(name.slice(0, -1) + n) as keyof this] || proxyFunction(name.slice(0, -1) + n).bind(this);
                });
            } else {
                this[name as keyof this] = this[name as keyof this] || proxyFunction(name).bind(this);
            }
        });
    }

    private _useFinalCode(migratedVertexCode: string, migratedFragmentCode: string, baseName: any) {
        if (baseName) {
            const vertex = baseName.vertexElement || baseName.vertex || baseName.spectorName || baseName;
            const fragment = baseName.fragmentElement || baseName.fragment || baseName.spectorName || baseName;

            this._vertexSourceCode = (this._shaderLanguage === ShaderLanguage.WGSL ? "//" : "") + "#define SHADER_NAME vertex:" + vertex + "\n" + migratedVertexCode;
            this._fragmentSourceCode = (this._shaderLanguage === ShaderLanguage.WGSL ? "//" : "") + "#define SHADER_NAME fragment:" + fragment + "\n" + migratedFragmentCode;
        } else {
            this._vertexSourceCode = migratedVertexCode;
            this._fragmentSourceCode = migratedFragmentCode;
        }
        this._prepareEffect();
    }

    /**
     * Unique key for this effect
     */
    public get key(): string {
        return this._key;
    }

    /**
     * If the effect has been compiled and prepared.
     * @returns if the effect is compiled and prepared.
     */
    public isReady(): boolean {
        try {
            return this._isReadyInternal();
        } catch {
            return false;
        }
    }

    private _isReadyInternal(): boolean {
        if (this._isReady) {
            return true;
        }
        if (this._pipelineContext) {
            return this._pipelineContext.isReady;
        }
        return false;
    }

    /**
     * The engine the effect was initialized with.
     * @returns the engine.
     */
    public getEngine(): Engine {
        return this._engine;
    }

    /**
     * The pipeline context for this effect
     * @returns the associated pipeline context
     */
    public getPipelineContext(): Nullable<IPipelineContext> {
        return this._pipelineContext;
    }

    /**
     * The set of names of attribute variables for the shader.
     * @returns An array of attribute names.
     */
    public getAttributesNames(): string[] {
        return this._attributesNames;
    }

    /**
     * Returns the attribute at the given index.
     * @param index The index of the attribute.
     * @returns The location of the attribute.
     */
    public getAttributeLocation(index: number): number {
        return this._attributes[index];
    }

    /**
     * Returns the attribute based on the name of the variable.
     * @param name of the attribute to look up.
     * @returns the attribute location.
     */
    public getAttributeLocationByName(name: string): number {
        return this._attributeLocationByName[name];
    }

    /**
     * The number of attributes.
     * @returns the number of attributes.
     */
    public getAttributesCount(): number {
        return this._attributes.length;
    }

    /**
     * Gets the index of a uniform variable.
     * @param uniformName of the uniform to look up.
     * @returns the index.
     */
    public getUniformIndex(uniformName: string): number {
        return this._uniformsNames.indexOf(uniformName);
    }

    /**
     * Returns the attribute based on the name of the variable.
     * @param uniformName of the uniform to look up.
     * @returns the location of the uniform.
     */
    public getUniform(uniformName: string): Nullable<WebGLUniformLocation> {
        return this._uniforms[uniformName];
    }

    /**
     * Returns an array of sampler variable names
     * @returns The array of sampler variable names.
     */
    public getSamplers(): string[] {
        return this._samplerList;
    }

    /**
     * Returns an array of uniform variable names
     * @returns The array of uniform variable names.
     */
    public getUniformNames(): string[] {
        return this._uniformsNames;
    }

    /**
     * Returns an array of uniform buffer variable names
     * @returns The array of uniform buffer variable names.
     */
    public getUniformBuffersNames(): string[] {
        return this._uniformBuffersNamesList;
    }

    /**
     * Returns the index parameters used to create the effect
     * @returns The index parameters object
     */
    public getIndexParameters(): any {
        return this._indexParameters;
    }

    /**
     * The error from the last compilation.
     * @returns the error string.
     */
    public getCompilationError(): string {
        return this._compilationError;
    }

    /**
     * Gets a boolean indicating that all fallbacks were used during compilation
     * @returns true if all fallbacks were used
     */
    public allFallbacksProcessed(): boolean {
        return this._allFallbacksProcessed;
    }

    /**
     * Adds a callback to the onCompiled observable and call the callback immediately if already ready.
     * @param func The callback to be used.
     */
    public executeWhenCompiled(func: (effect: Effect) => void): void {
        if (this.isReady()) {
            func(this);
            return;
        }

        this.onCompileObservable.add((effect) => {
            func(effect);
        });

        if (!this._pipelineContext || this._pipelineContext.isAsync) {
            setTimeout(() => {
                this._checkIsReady(null);
            }, 16);
        }
    }

    private _checkIsReady(previousPipelineContext: Nullable<IPipelineContext>) {
        try {
            if (this._isReadyInternal()) {
                return;
            }
        } catch (e) {
            this._processCompilationErrors(e, previousPipelineContext);
            return;
        }

        if (this._isDisposed) {
            return;
        }

        setTimeout(() => {
            this._checkIsReady(previousPipelineContext);
        }, 16);
    }

    private _loadShader(shader: any, key: string, optionalKey: string, callback: (data: any) => void): void {
        if (typeof HTMLElement !== "undefined") {
            // DOM element ?
            if (shader instanceof HTMLElement) {
                const shaderCode = GetDOMTextContent(shader);
                callback(shaderCode);
                return;
            }
        }

        // Direct source ?
        if (shader.substr(0, 7) === "source:") {
            callback(shader.substr(7));
            return;
        }

        // Base64 encoded ?
        if (shader.substr(0, 7) === "base64:") {
            const shaderBinary = window.atob(shader.substr(7));
            callback(shaderBinary);
            return;
        }

        const shaderStore = EngineShaderStore.GetShadersStore(this._shaderLanguage);

        // Is in local store ?
        if (shaderStore[shader + key + "Shader"]) {
            callback(shaderStore[shader + key + "Shader"]);
            return;
        }

        if (optionalKey && shaderStore[shader + optionalKey + "Shader"]) {
            callback(shaderStore[shader + optionalKey + "Shader"]);
            return;
        }

        let shaderUrl;

        if (shader[0] === "." || shader[0] === "/" || shader.indexOf("http") > -1) {
            shaderUrl = shader;
        } else {
            shaderUrl = EngineShaderStore.GetShadersRepository(this._shaderLanguage) + shader;
        }

        // Vertex shader
        this._engine._loadFile(shaderUrl + "." + key.toLowerCase() + ".fx", callback);
    }

    /**
     * Gets the vertex shader source code of this effect
     */
    public get vertexSourceCode(): string {
        return this._vertexSourceCodeOverride && this._fragmentSourceCodeOverride
            ? this._vertexSourceCodeOverride
            : this._pipelineContext?._getVertexShaderCode() ?? this._vertexSourceCode;
    }

    /**
     * Gets the fragment shader source code of this effect
     */
    public get fragmentSourceCode(): string {
        return this._vertexSourceCodeOverride && this._fragmentSourceCodeOverride
            ? this._fragmentSourceCodeOverride
            : this._pipelineContext?._getFragmentShaderCode() ?? this._fragmentSourceCode;
    }

    /**
     * Gets the vertex shader source code before it has been processed by the preprocessor
     */
    public get rawVertexSourceCode(): string {
        return this._rawVertexSourceCode;
    }

    /**
     * Gets the fragment shader source code before it has been processed by the preprocessor
     */
    public get rawFragmentSourceCode(): string {
        return this._rawFragmentSourceCode;
    }

    /**
     * Recompiles the webGL program
     * @param vertexSourceCode The source code for the vertex shader.
     * @param fragmentSourceCode The source code for the fragment shader.
     * @param onCompiled Callback called when completed.
     * @param onError Callback called on error.
     * @internal
     */
    public _rebuildProgram(vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (pipelineContext: IPipelineContext) => void, onError: (message: string) => void) {
        this._isReady = false;

        this._vertexSourceCodeOverride = vertexSourceCode;
        this._fragmentSourceCodeOverride = fragmentSourceCode;
        this.onError = (effect, error) => {
            if (onError) {
                onError(error);
            }
        };
        this.onCompiled = () => {
            const scenes = this.getEngine().scenes;
            if (scenes) {
                for (let i = 0; i < scenes.length; i++) {
                    scenes[i].markAllMaterialsAsDirty(Constants.MATERIAL_AllDirtyFlag);
                }
            }

            this._pipelineContext!._handlesSpectorRebuildCallback(onCompiled);
        };
        this._fallbacks = null;
        this._prepareEffect();
    }

    /**
     * Prepares the effect
     * @internal
     */
    public _prepareEffect() {
        const attributesNames = this._attributesNames;
        const defines = this.defines;

        const previousPipelineContext = this._pipelineContext;

        this._isReady = false;

        try {
            const engine = this._engine;

            this._pipelineContext = engine.createPipelineContext(this._processingContext);
            this._pipelineContext._name = this._key;

            const rebuildRebind = this._rebuildProgram.bind(this);
            if (this._vertexSourceCodeOverride && this._fragmentSourceCodeOverride) {
                engine._preparePipelineContext(
                    this._pipelineContext,
                    this._vertexSourceCodeOverride,
                    this._fragmentSourceCodeOverride,
                    true,
                    this._rawVertexSourceCode,
                    this._rawFragmentSourceCode,
                    rebuildRebind,
                    null,
                    this._transformFeedbackVaryings,
                    this._key
                );
            } else {
                engine._preparePipelineContext(
                    this._pipelineContext,
                    this._vertexSourceCode,
                    this._fragmentSourceCode,
                    false,
                    this._rawVertexSourceCode,
                    this._rawFragmentSourceCode,
                    rebuildRebind,
                    defines,
                    this._transformFeedbackVaryings,
                    this._key
                );
            }

            engine._executeWhenRenderingStateIsCompiled(this._pipelineContext, () => {
                this._attributes = [];
                this._pipelineContext!._fillEffectInformation(
                    this,
                    this._uniformBuffersNames,
                    this._uniformsNames,
                    this._uniforms,
                    this._samplerList,
                    this._samplers,
                    attributesNames,
                    this._attributes
                );

                // Caches attribute locations.
                if (attributesNames) {
                    for (let i = 0; i < attributesNames.length; i++) {
                        const name = attributesNames[i];
                        this._attributeLocationByName[name] = this._attributes[i];
                    }
                }

                engine.bindSamplers(this);

                this._compilationError = "";
                this._isReady = true;
                if (this.onCompiled) {
                    this.onCompiled(this);
                }
                this.onCompileObservable.notifyObservers(this);
                this.onCompileObservable.clear();

                // Unbind mesh reference in fallbacks
                if (this._fallbacks) {
                    this._fallbacks.unBindMesh();
                }

                if (previousPipelineContext) {
                    this.getEngine()._deletePipelineContext(previousPipelineContext);
                }
            });

            if (this._pipelineContext.isAsync) {
                this._checkIsReady(previousPipelineContext);
            }
        } catch (e) {
            this._processCompilationErrors(e, previousPipelineContext);
        }
    }

    private _getShaderCodeAndErrorLine(code: Nullable<string>, error: Nullable<string>, isFragment: boolean): [Nullable<string>, Nullable<string>] {
        const regexp = isFragment ? /FRAGMENT SHADER ERROR: 0:(\d+?):/ : /VERTEX SHADER ERROR: 0:(\d+?):/;

        let errorLine = null;

        if (error && code) {
            const res = error.match(regexp);
            if (res && res.length === 2) {
                const lineNumber = parseInt(res[1]);
                const lines = code.split("\n", -1);
                if (lines.length >= lineNumber) {
                    errorLine = `Offending line [${lineNumber}] in ${isFragment ? "fragment" : "vertex"} code: ${lines[lineNumber - 1]}`;
                }
            }
        }

        return [code, errorLine];
    }

    private _processCompilationErrors(e: any, previousPipelineContext: Nullable<IPipelineContext> = null) {
        this._compilationError = e.message;
        const attributesNames = this._attributesNames;
        const fallbacks = this._fallbacks;

        // Let's go through fallbacks then
        Logger.Error("Unable to compile effect:");
        Logger.Error(
            "Uniforms: " +
                this._uniformsNames.map(function (uniform) {
                    return " " + uniform;
                })
        );
        Logger.Error(
            "Attributes: " +
                attributesNames.map(function (attribute) {
                    return " " + attribute;
                })
        );
        Logger.Error("Defines:\r\n" + this.defines);
        if (Effect.LogShaderCodeOnCompilationError) {
            let lineErrorVertex = null,
                lineErrorFragment = null,
                code = null;
            if (this._pipelineContext?._getVertexShaderCode()) {
                [code, lineErrorVertex] = this._getShaderCodeAndErrorLine(this._pipelineContext._getVertexShaderCode(), this._compilationError, false);
                if (code) {
                    Logger.Error("Vertex code:");
                    Logger.Error(code);
                }
            }
            if (this._pipelineContext?._getFragmentShaderCode()) {
                [code, lineErrorFragment] = this._getShaderCodeAndErrorLine(this._pipelineContext?._getFragmentShaderCode(), this._compilationError, true);
                if (code) {
                    Logger.Error("Fragment code:");
                    Logger.Error(code);
                }
            }
            if (lineErrorVertex) {
                Logger.Error(lineErrorVertex);
            }
            if (lineErrorFragment) {
                Logger.Error(lineErrorFragment);
            }
        }
        Logger.Error("Error: " + this._compilationError);

        const notifyErrors = () => {
            if (this.onError) {
                this.onError(this, this._compilationError);
            }
            this.onErrorObservable.notifyObservers(this);
        };

        // In case a previous compilation was successful, we need to restore the previous pipeline context
        if (previousPipelineContext) {
            this._pipelineContext = previousPipelineContext;
            this._isReady = true;
            notifyErrors();
        }

        // Lets try to compile fallbacks as long as we have some.
        if (fallbacks) {
            this._pipelineContext = null;
            if (fallbacks.hasMoreFallbacks) {
                this._allFallbacksProcessed = false;
                Logger.Error("Trying next fallback.");
                this.defines = fallbacks.reduce(this.defines, this);
                this._prepareEffect();
            } else {
                // Sorry we did everything we can
                this._allFallbacksProcessed = true;
                notifyErrors();
                this.onErrorObservable.clear();

                // Unbind mesh reference in fallbacks
                if (this._fallbacks) {
                    this._fallbacks.unBindMesh();
                }
            }
        } else {
            this._allFallbacksProcessed = true;

            // In case of error, without any prior successful compilation, let s notify observers
            if (!previousPipelineContext) {
                notifyErrors();
            }
        }
    }

    /**
     * Checks if the effect is supported. (Must be called after compilation)
     */
    public get isSupported(): boolean {
        return this._compilationError === "";
    }

    /**
     * Binds a texture to the engine to be used as output of the shader.
     * @param channel Name of the output variable.
     * @param texture Texture to bind.
     * @internal
     */
    public _bindTexture(channel: string, texture: Nullable<InternalTexture>): void {
        this._engine._bindTexture(this._samplers[channel], texture, channel);
    }

    /**
     * Sets a texture on the engine to be used in the shader.
     * @param channel Name of the sampler variable.
     * @param texture Texture to set.
     */
    public setTexture(channel: string, texture: Nullable<ThinTexture>): void {
        this._engine.setTexture(this._samplers[channel], this._uniforms[channel], texture, channel);
    }

    /**
     * Sets a depth stencil texture from a render target on the engine to be used in the shader.
     * @param channel Name of the sampler variable.
     * @param texture Texture to set.
     */
    public setDepthStencilTexture(channel: string, texture: Nullable<RenderTargetTexture>): void {
        this._engine.setDepthStencilTexture(this._samplers[channel], this._uniforms[channel], texture, channel);
    }

    /**
     * Sets an array of textures on the engine to be used in the shader.
     * @param channel Name of the variable.
     * @param textures Textures to set.
     */
    public setTextureArray(channel: string, textures: ThinTexture[]): void {
        const exName = channel + "Ex";
        if (this._samplerList.indexOf(exName + "0") === -1) {
            const initialPos = this._samplerList.indexOf(channel);
            for (let index = 1; index < textures.length; index++) {
                const currentExName = exName + (index - 1).toString();
                this._samplerList.splice(initialPos + index, 0, currentExName);
            }

            // Reset every channels
            let channelIndex = 0;
            for (const key of this._samplerList) {
                this._samplers[key] = channelIndex;
                channelIndex += 1;
            }
        }

        this._engine.setTextureArray(this._samplers[channel], this._uniforms[channel], textures, channel);
    }

    /**
     * Sets a texture to be the input of the specified post process. (To use the output, pass in the next post process in the pipeline)
     * @param channel Name of the sampler variable.
     * @param postProcess Post process to get the input texture from.
     */
    public setTextureFromPostProcess(channel: string, postProcess: Nullable<PostProcess>): void {
        this._engine.setTextureFromPostProcess(this._samplers[channel], postProcess, channel);
    }

    /**
     * (Warning! setTextureFromPostProcessOutput may be desired instead)
     * Sets the input texture of the passed in post process to be input of this effect. (To use the output of the passed in post process use setTextureFromPostProcessOutput)
     * @param channel Name of the sampler variable.
     * @param postProcess Post process to get the output texture from.
     */
    public setTextureFromPostProcessOutput(channel: string, postProcess: Nullable<PostProcess>): void {
        this._engine.setTextureFromPostProcessOutput(this._samplers[channel], postProcess, channel);
    }

    /**
     * Binds a buffer to a uniform.
     * @param buffer Buffer to bind.
     * @param name Name of the uniform variable to bind to.
     */
    public bindUniformBuffer(buffer: DataBuffer, name: string): void {
        const bufferName = this._uniformBuffersNames[name];
        if (bufferName === undefined || (Effect._BaseCache[bufferName] === buffer && this._engine._features.useUBOBindingCache)) {
            return;
        }
        Effect._BaseCache[bufferName] = buffer;
        this._engine.bindUniformBufferBase(buffer, bufferName, name);
    }

    /**
     * Binds block to a uniform.
     * @param blockName Name of the block to bind.
     * @param index Index to bind.
     */
    public bindUniformBlock(blockName: string, index: number): void {
        this._engine.bindUniformBlock(this._pipelineContext!, blockName, index);
    }

    /**
     * Sets an integer value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     * @returns this effect.
     */
    public setInt: (uniformName: string, value: number) => Effect;

    /**
     * Sets an int2 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int2.
     * @param y Second int in int2.
     * @returns this effect.
     */
    public setInt2: (uniformName: string, x: number, y: number) => Effect;

    /**
     * Sets an int3 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int3.
     * @param y Second int in int3.
     * @param z Third int in int3.
     * @returns this effect.
     */
    public setInt3: (uniformName: string, x: number, y: number, z: number) => Effect;

    /**
     * Sets an int4 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int4.
     * @param y Second int in int4.
     * @param z Third int in int4.
     * @param w Fourth int in int4.
     * @returns this effect.
     */
    public setInt4: (uniformName: string, x: number, y: number, z: number, w: number) => Effect;

    /**
     * Sets an int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setIntArray: (uniformName: string, array: Int32Array) => Effect;

    /**
     * Sets an int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setIntArray2: (uniformName: string, array: Int32Array) => Effect;

    /**
     * Sets an int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setIntArray3: (uniformName: string, array: Int32Array) => Effect;

    /**
     * Sets an int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setIntArray4: (uniformName: string, array: Int32Array) => Effect;

    /**
     * Sets an float array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setFloatArray(uniformName: string, array: FloatArray): Effect {
        this._pipelineContext!.setArray(uniformName, array);
        return this;
    }

    /**
     * Sets an float array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setFloatArray2(uniformName: string, array: FloatArray): Effect {
        this._pipelineContext!.setArray2(uniformName, array);
        return this;
    }

    /**
     * Sets an float array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setFloatArray3(uniformName: string, array: FloatArray): Effect {
        this._pipelineContext!.setArray3(uniformName, array);
        return this;
    }

    /**
     * Sets an float array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setFloatArray4(uniformName: string, array: FloatArray): Effect {
        this._pipelineContext!.setArray4(uniformName, array);
        return this;
    }

    /**
     * Sets an array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setArray: (uniformName: string, array: number[]) => Effect;

    /**
     * Sets an array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setArray2: (uniformName: string, array: number[]) => Effect;

    /**
     * Sets an array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setArray3: (uniformName: string, array: number[]) => Effect;

    /**
     * Sets an array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setArray4: (uniformName: string, array: number[]) => Effect;

    /**
     * Sets matrices on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrices matrices to be set.
     * @returns this effect.
     */
    public setMatrices: (uniformName: string, matrices: Float32Array | Array<number>) => Effect;

    /**
     * Sets matrix on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     * @returns this effect.
     */
    public setMatrix: (uniformName: string, matrix: IMatrixLike) => Effect;

    /**
     * Sets a 3x3 matrix on a uniform variable. (Specified as [1,2,3,4,5,6,7,8,9] will result in [1,2,3][4,5,6][7,8,9] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     * @returns this effect.
     */
    public setMatrix3x3: (uniformName: string, matrix: Float32Array | Array<number>) => Effect;

    /**
     * Sets a 2x2 matrix on a uniform variable. (Specified as [1,2,3,4] will result in [1,2][3,4] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     * @returns this effect.
     */
    public setMatrix2x2: (uniformName: string, matrix: Float32Array | Array<number>) => Effect;

    /**
     * Sets a float on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value value to be set.
     * @returns this effect.
     */
    public setFloat: (uniformName: string, value: number) => Effect;

    /**
     * Sets a boolean on a uniform variable.
     * @param uniformName Name of the variable.
     * @param bool value to be set.
     * @returns this effect.
     */
    public setBool(uniformName: string, bool: boolean): Effect {
        this._pipelineContext!.setInt(uniformName, bool ? 1 : 0);
        return this;
    }

    /**
     * Sets a Vector2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector2 vector2 to be set.
     * @returns this effect.
     */
    public setVector2: (uniformName: string, vector2: IVector2Like) => Effect;

    /**
     * Sets a float2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float2.
     * @param y Second float in float2.
     * @returns this effect.
     */
    public setFloat2: (uniformName: string, x: number, y: number) => Effect;

    /**
     * Sets a Vector3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector3 Value to be set.
     * @returns this effect.
     */
    public setVector3: (uniformName: string, vector3: IVector3Like) => Effect;

    /**
     * Sets a float3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float3.
     * @param y Second float in float3.
     * @param z Third float in float3.
     * @returns this effect.
     */
    public setFloat3: (uniformName: string, x: number, y: number, z: number) => Effect;

    /**
     * Sets a Vector4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector4 Value to be set.
     * @returns this effect.
     */
    public setVector4: (uniformName: string, vector4: IVector4Like) => Effect;

    /**
     * Sets a Quaternion on a uniform variable.
     * @param uniformName Name of the variable.
     * @param quaternion Value to be set.
     * @returns this effect.
     */
    public setQuaternion: (uniformName: string, quaternion: IQuaternionLike) => Effect;

    /**
     * Sets a float4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float4.
     * @param y Second float in float4.
     * @param z Third float in float4.
     * @param w Fourth float in float4.
     * @returns this effect.
     */
    public setFloat4: (uniformName: string, x: number, y: number, z: number, w: number) => Effect;

    /**
     * Sets a Color3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     * @returns this effect.
     */
    public setColor3: (uniformName: string, color3: IColor3Like) => Effect;

    /**
     * Sets a Color4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     * @param alpha Alpha value to be set.
     * @returns this effect.
     */
    public setColor4: (uniformName: string, color3: IColor3Like, alpha: number) => Effect;

    /**
     * Sets a Color4 on a uniform variable
     * @param uniformName defines the name of the variable
     * @param color4 defines the value to be set
     * @returns this effect.
     */
    public setDirectColor4: (uniformName: string, color4: IColor4Like) => Effect;

    /**
     * Release all associated resources.
     **/
    public dispose() {
        this._pipelineContext?.dispose();
        this._engine._releaseEffect(this);
        this._isDisposed = true;
    }

    /**
     * This function will add a new shader to the shader store
     * @param name the name of the shader
     * @param pixelShader optional pixel shader content
     * @param vertexShader optional vertex shader content
     * @param shaderLanguage the language the shader is written in (default: GLSL)
     */
    public static RegisterShader(name: string, pixelShader?: string, vertexShader?: string, shaderLanguage = ShaderLanguage.GLSL) {
        if (pixelShader) {
            EngineShaderStore.GetShadersStore(shaderLanguage)[`${name}PixelShader`] = pixelShader;
        }

        if (vertexShader) {
            EngineShaderStore.GetShadersStore(shaderLanguage)[`${name}VertexShader`] = vertexShader;
        }
    }

    /**
     * Store of each shader (The can be looked up using effect.key)
     */
    public static ShadersStore: { [key: string]: string } = EngineShaderStore.ShadersStore;
    /**
     * Store of each included file for a shader (The can be looked up using effect.key)
     */
    public static IncludesShadersStore: { [key: string]: string } = EngineShaderStore.IncludesShadersStore;

    /**
     * Resets the cache of effects.
     */
    public static ResetCache() {
        Effect._BaseCache = {};
    }
}

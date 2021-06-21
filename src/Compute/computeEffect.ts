import { Logger } from "../Misc/logger";
import { Nullable } from "../types";
import { Observable } from "../Misc/observable";
import { IComputePipelineContext } from "./IComputePipelineContext";
import { DomManagement } from "../Misc/domManagement";
import { ShaderProcessor } from "../Engines/Processors/shaderProcessor";
import { ProcessingOptions } from "../Engines/Processors/shaderProcessingOptions";
import { ShaderStore } from '../Engines/shaderStore';

declare type Engine = import("../Engines/engine").Engine;

/**
 * Options to be used when creating a compute effect.
 */
export interface IComputeEffectCreationOptions {
    /**
     * Define statements that will be set in the shader.
     */
    defines: any;
    /**
     * Callback that will be called when the shader is compiled.
     */
    onCompiled: Nullable<(effect: ComputeEffect) => void>;
    /**
     * Callback that will be called if an error occurs during shader compilation.
     */
    onError: Nullable<(effect: ComputeEffect, errors: string) => void>;
    /**
     * If provided, will be called with the shader code so that this code can be updated before it is compiled by the GPU
     */
    processFinalCode?: Nullable<(code: string) => string>;
}

/**
 * Effect wrapping a compute shader and let execute (dispatch) the shader
 */
export class ComputeEffect {
    private static _uniqueIdSeed = 0;

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
     public onCompiled: Nullable<(effect: ComputeEffect) => void> = null;
     /**
      * Callback that will be called if an error occurs during shader compilation.
      */
     public onError: Nullable<(effect: ComputeEffect, errors: string) => void> = null;
     /**
     * Unique ID of the effect.
     */
    public uniqueId = 0;
    /**
     * Observable that will be called when the shader is compiled.
     * It is recommended to use executeWhenCompile() or to make sure that scene.isReady() is called to get this observable raised.
     */
    public onCompileObservable = new Observable<ComputeEffect>();
    /**
     * Observable that will be called if an error occurs during shader compilation.
     */
    public onErrorObservable = new Observable<ComputeEffect>();
    /**
     * Observable that will be called when effect is bound.
     */
    public onBindObservable = new Observable<ComputeEffect>();

    /**
     * @hidden
     * Specifies if the effect was previously ready
     */
    public _wasPreviouslyReady = false;

    private _engine: Engine;
    private _isReady = false;
    private _compilationError = "";
    /** @hidden */
    public _key: string = "";
    private _computeSourceCodeOverride: string = "";
    /** @hidden */
    public _pipelineContext: Nullable<IComputePipelineContext> = null;
    /** @hidden */
    public _computeSourceCode: string = "";
    private _rawComputeSourceCode: string = "";

    /**
     * Creates a compute effect that can be used to execute a compute shader
     * @param baseName Name of the effect
     * @param options Set of all options to create the effect
     * @param engine The engine the effect is created for
     * @param key Effect Key identifying uniquely compiled shader variants
     */
    constructor(baseName: any, options: IComputeEffectCreationOptions, engine: Engine, key = "") {
        this.name = baseName;
        this._key = key;

        this._engine = engine;
        this.uniqueId = ComputeEffect._uniqueIdSeed++;

        this.defines = options.defines ?? "";
        this.onError = options.onError;
        this.onCompiled = options.onCompiled;

        let computeSource: any;

        const hostDocument = DomManagement.IsWindowObjectExist() ? this._engine.getHostDocument() : null;

        if (baseName.computeSource) {
            computeSource = "source:" + baseName.computeSource;
        } else if (baseName.computeElement) {
            computeSource = hostDocument ? hostDocument.getElementById(baseName.computeElement) : null;

            if (!computeSource) {
                computeSource = baseName.computeElement;
            }
        } else {
            computeSource = baseName.compute || baseName;
        }

        const processorOptions: ProcessingOptions = {
            defines: this.defines.split("\n"),
            indexParameters: undefined,
            isFragment: false,
            shouldUseHighPrecisionShader: false,
            processor: null,
            supportsUniformBuffers: this._engine.supportsUniformBuffers,
            shadersRepository: ShaderStore.ShadersRepository,
            includesShadersStore: ShaderStore.IncludesShadersStore,
            version: (this._engine.version * 100).toString(),
            platformName: this._engine.shaderPlatformName,
            processingContext: null,
            isNDCHalfZRange: this._engine.isNDCHalfZRange,
        };

        this._loadShader(computeSource, "Compute", "", (computeCode) => {
            ShaderProcessor.Initialize(processorOptions);
            ShaderProcessor.PreProcess(computeCode, processorOptions, (migratedCommputeCode) => {
                this._rawComputeSourceCode = computeCode;
                if (options.processFinalCode) {
                    migratedCommputeCode = options.processFinalCode(migratedCommputeCode);
                }
                const finalShaders = ShaderProcessor.Finalize(migratedCommputeCode, "", processorOptions);
                this._useFinalCode(finalShaders.vertexCode, baseName);
            }, this._engine);
        });
    }

    private _useFinalCode(migratedCommputeCode: string, baseName: any) {
        if (baseName) {
            const compute = baseName.computeElement || baseName.compute || baseName.spectorName || baseName;

            this._computeSourceCode = "//#define SHADER_NAME compute:" + compute + "\n" + migratedCommputeCode;
        } else {
            this._computeSourceCode = migratedCommputeCode;
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
        }
        catch {
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
    public getPipelineContext(): Nullable<IComputePipelineContext> {
        return this._pipelineContext;
    }

    /**
     * The error from the last compilation.
     * @returns the error string.
     */
     public getCompilationError(): string {
        return this._compilationError;
    }

    /**
     * Adds a callback to the onCompiled observable and call the callback immediately if already ready.
     * @param func The callback to be used.
     */
     public executeWhenCompiled(func: (effect: ComputeEffect) => void): void {
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

    private _checkIsReady(previousPipelineContext: Nullable<IComputePipelineContext>) {
        try {
            if (this._isReadyInternal()) {
                return;
            }
        } catch (e) {
            this._processCompilationErrors(e, previousPipelineContext);
            return;
        }

        setTimeout(() => {
            this._checkIsReady(previousPipelineContext);
        }, 16);
    }

    private _loadShader(shader: any, key: string, optionalKey: string, callback: (data: any) => void): void {
        if (typeof(HTMLElement) !== "undefined") {
            // DOM element ?
            if (shader instanceof HTMLElement) {
                var shaderCode = DomManagement.GetDOMTextContent(shader);
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
            var shaderBinary = window.atob(shader.substr(7));
            callback(shaderBinary);
            return;
        }

        // Is in local store ?
        if (ShaderStore.ShadersStore[shader + key + "Shader"]) {
            callback(ShaderStore.ShadersStore[shader + key + "Shader"]);
            return;
        }

        if (optionalKey && ShaderStore.ShadersStore[shader + optionalKey + "Shader"]) {
            callback(ShaderStore.ShadersStore[shader + optionalKey + "Shader"]);
            return;
        }

        let shaderUrl;

        if (shader[0] === "." || shader[0] === "/" || shader.indexOf("http") > -1) {
            shaderUrl = shader;
        } else {
            shaderUrl = ShaderStore.ShadersRepository + shader;
        }

        this._engine._loadFile(shaderUrl + "." + key.toLowerCase() + ".fx", callback);
    }

    /**
     * Gets the compute shader source code of this effect
     */
    public get computeSourceCode(): string {
        return this._computeSourceCodeOverride ? this._computeSourceCodeOverride : (this._pipelineContext?._getComputeShaderCode() ?? this._computeSourceCode);
    }

    /**
     * Gets the compute shader source code before it has been processed by the preprocessor
     */
    public get rawComputeSourceCode(): string {
        return this._rawComputeSourceCode;
    }

    /**
     * Prepares the effect
     * @hidden
     */
     public _prepareEffect() {
        let defines = this.defines;

        var previousPipelineContext = this._pipelineContext;

        this._isReady = false;

        try {
            let engine = this._engine;

            this._pipelineContext = engine.createComputePipelineContext();
            this._pipelineContext._name = this._key;

            engine._prepareComputePipelineContext(this._pipelineContext, this._computeSourceCodeOverride ? this._computeSourceCodeOverride : this._computeSourceCode, this._rawComputeSourceCode, this._computeSourceCodeOverride ? null : defines);

            engine._executeWhenComputeStateIsCompiled(this._pipelineContext, () => {
                this._compilationError = "";
                this._isReady = true;
                if (this.onCompiled) {
                    this.onCompiled(this);
                }
                this.onCompileObservable.notifyObservers(this);
                this.onCompileObservable.clear();

                if (previousPipelineContext) {
                    this.getEngine()._deleteComputePipelineContext(previousPipelineContext);
                }
            });

            if (this._pipelineContext.isAsync) {
                this._checkIsReady(previousPipelineContext);
            }

        } catch (e) {
           this._processCompilationErrors(e, previousPipelineContext);
        }
    }

    private _getShaderCodeAndErrorLine(code: Nullable<string>, error: Nullable<string>): [Nullable<string>, Nullable<string>] {
        const regexp = /COMPUTE SHADER ERROR: 0:(\d+?):/;

        let errorLine = null;

        if (error && code) {
            const res = error.match(regexp);
            if (res && res.length === 2) {
                const lineNumber = parseInt(res[1]);
                const lines = code.split("\n", -1);
                if (lines.length >= lineNumber) {
                    errorLine = `Offending line [${lineNumber}] in compute code: ${lines[lineNumber - 1]}`;
                }
            }
        }

        return [code, errorLine];
    }

    private _processCompilationErrors(e: any, previousPipelineContext: Nullable<IComputePipelineContext> = null) {
        this._compilationError = e.message;

        // Let's go through fallbacks then
        Logger.Error("Unable to compile compute effect:");
        Logger.Error("Defines:\r\n" + this.defines);
        if (ComputeEffect.LogShaderCodeOnCompilationError) {
            let lineErrorVertex = null, code = null;
            if (this._pipelineContext?._getComputeShaderCode()) {
                [code, lineErrorVertex] = this._getShaderCodeAndErrorLine(this._pipelineContext._getComputeShaderCode(), this._compilationError);
                if (code) {
                    Logger.Error("Compute code:");
                    Logger.Error(code);
                }
            }
            if (lineErrorVertex) {
                Logger.Error(lineErrorVertex);
            }
        }
        Logger.Error("Error: " + this._compilationError);
        if (previousPipelineContext) {
            this._pipelineContext = previousPipelineContext;
            this._isReady = true;
            if (this.onError) {
                this.onError(this, this._compilationError);
            }
            this.onErrorObservable.notifyObservers(this);
        }
    }

    /**
     * Release all associated resources.
     **/
    public dispose() {
        if (this._pipelineContext) {
            this._pipelineContext.dispose();
        }
        this._engine._releaseComputeEffect(this);
    }

    /**
     * This function will add a new compute shader to the shader store
     * @param name the name of the shader
     * @param computeShader compute shader content
     */
    public static RegisterShader(name: string, computeShader: string) {
        ShaderStore.ShadersStore[`${name}ComputeShader`] = computeShader;
    }
}

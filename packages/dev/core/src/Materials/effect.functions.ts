import type { ProcessingOptions, ShaderCustomProcessingFunction, ShaderProcessingContext } from "core/Engines/Processors/shaderProcessingOptions";
import { GetDOMTextContent, IsWindowObjectExist } from "core/Misc/domManagement";
import type { Nullable } from "core/types";
import { ShaderLanguage } from "./shaderLanguage";
import type { WebGLContext } from "core/Engines/thinEngine.functions";
import { getStateObject } from "core/Engines/thinEngine.functions";
import { ShaderStore } from "core/Engines/shaderStore";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { Effect, IShaderPath } from "./effect";
import type { IPipelineContext } from "core/Engines/IPipelineContext";
import { Logger } from "core/Misc/logger";
import { Finalize, Initialize, Process } from "core/Engines/Processors/shaderProcessor";
import { _loadFile } from "core/Engines/abstractEngine.functions";
import type { WebGLPipelineContext } from "core/Engines/WebGL/webGLPipelineContext";

/**
 * Options to be used when creating a pipeline
 */
export interface IPipelineGenerationOptions {
    /**
     * The definition of the shader content.
     * Can be either a unified name, name per vertex and frament or the shader code content itself
     */
    shaderNameOrContent: string | IShaderPath;
    /**
     * Unique key to identify the pipeline.
     * Note that though not mandatory, it's recommended to provide a key to be able to use the automated pipeline loading system.
     */
    key?: string;
    /**
     * The list of defines to be used in the shader
     */
    defines?: string[];

    /**
     * If true, the global defines will be added to the defines array
     */
    addGlobalDefines?: boolean;
    /**
     * The shader language.
     * Defaults to the language suiting the platform name (GLSL for WEBGL2, WGSL for WEBGPU)
     */
    shaderLanguage?: ShaderLanguage;

    /**
     * The name of the platform to be used when processing the shader
     * defaults to WEBGL2
     */
    platformName?: string /* "WEBGL2" | "WEBGL1" | "WEBGPU" */;

    /**
     * extend the processing options when running code processing
     */
    extendedProcessingOptions?: Partial<ProcessingOptions>;

    /**
     * extend the pipeline generation options
     */
    extendedCreatePipelineOptions?: Partial<ICreateAndPreparePipelineContextOptions>;
}

/**
 * @internal
 */
export interface ICreateAndPreparePipelineContextOptions {
    parallelShaderCompile?: { COMPLETION_STATUS_KHR: number };
    shaderProcessingContext: Nullable<ShaderProcessingContext>;
    existingPipelineContext?: Nullable<IPipelineContext>;
    name?: string;
    rebuildRebind?: (vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (pipelineContext: IPipelineContext) => void, onError: (message: string) => void) => void;
    onRenderingStateCompiled?: (pipelineContext?: IPipelineContext) => void;
    context?: WebGL2RenderingContext | WebGLRenderingContext;
    // preparePipeline options
    createAsRaw?: boolean;
    vertex: string;
    fragment: string;
    defines: Nullable<string>;
    transformFeedbackVaryings: Nullable<string[]>;
}

/**
 * Get a cached pipeline context
 * @param name the pipeline name
 * @param context the context to be used when creating the pipeline
 * @returns the cached pipeline context if it exists
 * @internal
 */
export function getCachedPipeline(name: string, context: WebGLContext): IPipelineContext | undefined {
    const stateObject = getStateObject(context);
    return stateObject.cachedPipelines[name];
}

/**
 * @internal
 */
export function resetCachedPipeline(pipeline: IPipelineContext): void {
    const name = pipeline._name;
    const context = (pipeline as WebGLPipelineContext).context;
    if (name && context) {
        const stateObject = getStateObject(context!);
        const cachedPipeline = stateObject.cachedPipelines[name];
        cachedPipeline?.dispose();
        delete stateObject.cachedPipelines[name];
    }
}

/** @internal */
export function _processShaderCode(
    processorOptions: ProcessingOptions,
    baseName: any,
    processFinalCode?: Nullable<ShaderCustomProcessingFunction>,
    onFinalCodeReady?: (vertexCode: string, fragmentCode: string) => void,
    shaderLanguage?: ShaderLanguage,
    engine?: AbstractEngine,
    effectContext?: Effect
) {
    let vertexSource: string | HTMLElement | IShaderPath;
    let fragmentSource: string | HTMLElement | IShaderPath;

    // const baseName = this.name;
    const hostDocument = IsWindowObjectExist() ? engine?.getHostDocument() : null;

    if (typeof baseName === "string") {
        vertexSource = baseName;
    } else if (baseName.vertexSource) {
        vertexSource = "source:" + baseName.vertexSource;
    } else if (baseName.vertexElement) {
        vertexSource = hostDocument?.getElementById(baseName.vertexElement) || baseName.vertexElement;
    } else {
        vertexSource = baseName.vertex || baseName;
    }
    if (typeof baseName === "string") {
        fragmentSource = baseName;
    } else if (baseName.fragmentSource) {
        fragmentSource = "source:" + baseName.fragmentSource;
    } else if (baseName.fragmentElement) {
        fragmentSource = hostDocument?.getElementById(baseName.fragmentElement) || baseName.fragmentElement;
    } else {
        fragmentSource = baseName.fragment || baseName;
    }

    const shaderCodes: [string | undefined, string | undefined] = [undefined, undefined];
    const shadersLoaded = () => {
        if (shaderCodes[0] && shaderCodes[1]) {
            processorOptions.isFragment = true;
            const [migratedVertexCode, fragmentCode] = shaderCodes;
            Process(
                fragmentCode,
                processorOptions,
                (migratedFragmentCode, codeBeforeMigration) => {
                    if (effectContext) {
                        effectContext._fragmentSourceCodeBeforeMigration = codeBeforeMigration;
                    }
                    if (processFinalCode) {
                        migratedFragmentCode = processFinalCode("fragment", migratedFragmentCode);
                    }
                    const finalShaders = Finalize(migratedVertexCode, migratedFragmentCode, processorOptions);
                    processorOptions = null as any;
                    const finalCode = _useFinalCode(finalShaders.vertexCode, finalShaders.fragmentCode, baseName, shaderLanguage);
                    onFinalCodeReady?.(finalCode.vertexSourceCode, finalCode.fragmentSourceCode);
                },
                engine
            );
        }
    };
    _loadShader(
        vertexSource,
        "Vertex",
        "",
        (vertexCode) => {
            Initialize(processorOptions);
            Process(
                vertexCode,
                processorOptions,
                (migratedVertexCode, codeBeforeMigration) => {
                    if (effectContext) {
                        effectContext._rawVertexSourceCode = vertexCode;
                        effectContext._vertexSourceCodeBeforeMigration = codeBeforeMigration;
                    }
                    if (processFinalCode) {
                        migratedVertexCode = processFinalCode("vertex", migratedVertexCode);
                    }
                    shaderCodes[0] = migratedVertexCode;
                    shadersLoaded();
                },
                engine
            );
        },
        shaderLanguage
    );
    _loadShader(
        fragmentSource,
        "Fragment",
        "Pixel",
        (fragmentCode) => {
            if (effectContext) {
                effectContext._rawFragmentSourceCode = fragmentCode;
            }
            shaderCodes[1] = fragmentCode;
            shadersLoaded();
        },
        shaderLanguage
    );
}

function _loadShader(shader: any, key: string, optionalKey: string, callback: (data: any) => void, shaderLanguage?: ShaderLanguage, _loadFileInjection?: typeof _loadFile) {
    if (typeof HTMLElement !== "undefined") {
        // DOM element ?
        if (shader instanceof HTMLElement) {
            const shaderCode = GetDOMTextContent(shader);
            callback(shaderCode);
            return;
        }
    }

    // Direct source ?
    if (shader.substring(0, 7) === "source:") {
        callback(shader.substring(7));
        return;
    }

    // Base64 encoded ?
    if (shader.substring(0, 7) === "base64:") {
        const shaderBinary = window.atob(shader.substring(7));
        callback(shaderBinary);
        return;
    }

    const shaderStore = ShaderStore.GetShadersStore(shaderLanguage);

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
        shaderUrl = ShaderStore.GetShadersRepository(shaderLanguage) + shader;
    }
    _loadFileInjection = _loadFileInjection || _loadFile;
    if (!_loadFileInjection) {
        // we got to this point and loadFile was not injected - throw an error
        throw new Error("loadFileInjection is not defined");
    }
    // Vertex shader
    _loadFileInjection(shaderUrl + "." + key.toLowerCase() + ".fx", callback);
}

function _useFinalCode(migratedVertexCode: string, migratedFragmentCode: string, baseName: any, shaderLanguage?: ShaderLanguage) {
    if (baseName) {
        const vertex = baseName.vertexElement || baseName.vertex || baseName.spectorName || baseName;
        const fragment = baseName.fragmentElement || baseName.fragment || baseName.spectorName || baseName;

        return {
            vertexSourceCode: (shaderLanguage === ShaderLanguage.WGSL ? "//" : "") + "#define SHADER_NAME vertex:" + vertex + "\n" + migratedVertexCode,
            fragmentSourceCode: (shaderLanguage === ShaderLanguage.WGSL ? "//" : "") + "#define SHADER_NAME fragment:" + fragment + "\n" + migratedFragmentCode,
        };
    } else {
        return {
            vertexSourceCode: migratedVertexCode,
            fragmentSourceCode: migratedFragmentCode,
        };
    }
}

/**
 * Creates and prepares a pipeline context
 * @internal
 */
export const createAndPreparePipelineContext = (
    options: ICreateAndPreparePipelineContextOptions,
    createPipelineContext: typeof AbstractEngine.prototype.createPipelineContext,
    _preparePipelineContext: typeof AbstractEngine.prototype._preparePipelineContext,
    _executeWhenRenderingStateIsCompiled: typeof AbstractEngine.prototype._executeWhenRenderingStateIsCompiled
): IPipelineContext => {
    try {
        const pipelineContext: IPipelineContext = options.existingPipelineContext || createPipelineContext(options.shaderProcessingContext);
        pipelineContext._name = options.name;
        if (options.name && options.context) {
            const stateObject = getStateObject(options.context);
            stateObject.cachedPipelines[options.name] = pipelineContext;
        }

        // Flagged as async as we may need to delay load some processing tools
        // This does not break anything as the execution is waiting for _executeWhenRenderingStateIsCompiled
        _preparePipelineContext(
            pipelineContext,
            options.vertex,
            options.fragment,
            !!options.createAsRaw,
            "",
            "",
            options.rebuildRebind,
            options.defines,
            options.transformFeedbackVaryings,
            "",
            () => {
                _executeWhenRenderingStateIsCompiled(pipelineContext, () => {
                    options.onRenderingStateCompiled?.(pipelineContext);
                });
            }
        );

        return pipelineContext;
    } catch (e) {
        Logger.Error("Error compiling effect");
        throw e;
    }
};

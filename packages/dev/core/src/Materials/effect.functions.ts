import type { ProcessingOptions, ShaderCustomProcessingFunction, ShaderProcessingContext } from "core/Engines/Processors/shaderProcessingOptions";
import { GetDOMTextContent, IsWindowObjectExist } from "core/Misc/domManagement";
import type { Nullable } from "core/types";
import { ShaderLanguage } from "./shaderLanguage";
import { _executeWhenRenderingStateIsCompiled } from "core/Engines/thinEngine.functions";
import { ShaderStore } from "core/Engines/shaderStore";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { Effect, IShaderPath } from "./effect";
import type { IPipelineContext } from "core/Engines/IPipelineContext";
import { Logger } from "core/Misc/logger";
import { Finalize, Initialize, Process } from "core/Engines/Processors/shaderProcessor";
import { _getGlobalDefines, _loadFile } from "core/Engines/abstractEngine.functions";

/**
 * If pipelines were created prior to the effect, they can be cached here and be used when creating the effect
 * They will be used automatically.
 */
const cachedPiplines: { [name: string]: IPipelineContext } = {};

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
    extendedCreatePipelineOptions?: Partial<Parameters<typeof createAndPreparePipelineContext>[0]>;
}

/**
 * Generate a pipeline context from the provided options
 * Note - at the moment only WebGL is supported
 * @param options the options to be used when generating the pipeline
 * @param context the context to be used when creating the pipeline
 * @param createPipelineContext the function to create the pipeline context
 * @param _preparePipelineContext the function to prepare the pipeline context
 * @returns a promise that resolves to the pipeline context
 */
export async function generatePipelineContext(
    options: IPipelineGenerationOptions,
    context: WebGL2RenderingContext | WebGLRenderingContext | GPUCanvasContext,
    createPipelineContext: typeof AbstractEngine.prototype.createPipelineContext,
    _preparePipelineContext: typeof AbstractEngine.prototype._preparePipelineContext
): Promise<IPipelineContext> {
    const platformName = options.platformName || "WEBGL2";
    let processor = options.extendedProcessingOptions?.processor;
    const language = options.shaderLanguage || ShaderLanguage.GLSL;
    // auto-populate the processor if not provided
    // Note - async but can be synchronous if we load all dependenceis at the start
    if (!processor) {
        switch (platformName) {
            case "WEBGL1":
                processor = new (await import("core/Engines/WebGL/webGLShaderProcessors")).WebGLShaderProcessor();
                break;
            case "WEBGL2":
            default:
                processor = new (await import("core/Engines/WebGL/webGL2ShaderProcessors")).WebGL2ShaderProcessor();
                break;
        }
    }
    const shaderDef: any = options.shaderNameOrContent;
    const vertex = shaderDef.vertex || shaderDef.vertexSource || shaderDef;
    const fragment = shaderDef.fragment || shaderDef.fragmentSource || shaderDef;
    const globalDefines = _getGlobalDefines()?.split("\n") || [];
    const defines = [...(options.defines || []), ...(options.addGlobalDefines ? globalDefines : [])];
    const key = options.key?.replace(/\r/g, "").replace(/\n/g, "|") || vertex + "+" + fragment + "@" + defines.join("|");
    // defaults, extended with optionally provided options
    const processorOptions: ProcessingOptions = {
        defines,
        indexParameters: undefined,
        isFragment: false,
        shouldUseHighPrecisionShader: true,
        processor,
        supportsUniformBuffers: false,
        shadersRepository: ShaderStore.GetShadersRepository(language),
        includesShadersStore: ShaderStore.GetIncludesShadersStore(language),
        version: platformName === "WEBGL2" ? "200" : "100",
        platformName,
        processingContext: null,
        isNDCHalfZRange: false,
        useReverseDepthBuffer: false,
        ...options.extendedProcessingOptions,
    };
    return new Promise((resolve, reject) => {
        try {
            _processShaderCode(
                processorOptions,
                shaderDef,
                undefined,
                function (vertexCode, fragmentCode) {
                    try {
                        const pipeline = createAndPreparePipelineContext(
                            {
                                name: key,
                                vertex: vertexCode,
                                fragment: fragmentCode,
                                context,
                                defines: defines.length ? defines.join("\n") : null,
                                shaderProcessingContext: options.extendedProcessingOptions?.processingContext || null,
                                transformFeedbackVaryings: null,
                                ...options.extendedCreatePipelineOptions,
                            },
                            createPipelineContext,
                            _preparePipelineContext
                        );
                        resolve(pipeline);
                    } catch (e) {
                        reject(e);
                    }
                },
                language
            );
        } catch (e) {
            reject(e);
        }
    });
}

export function getCachedPipeline(name: string): IPipelineContext | undefined {
    return cachedPiplines[name];
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

function _loadShader(shader: any, key: string, optionalKey: string, callback: (data: any) => void, shaderLanguage?: ShaderLanguage) {
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

    // Vertex shader
    _loadFile(shaderUrl + "." + key.toLowerCase() + ".fx", callback);
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
    options: {
        parallelShaderCompile?: { COMPLETION_STATUS_KHR: number };
        shaderProcessingContext: Nullable<ShaderProcessingContext>;
        existingPipelineContext?: Nullable<IPipelineContext>;
        name?: string;
        rebuildRebind?: (vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (pipelineContext: IPipelineContext) => void, onError: (message: string) => void) => void;
        onRenderingStateCompiled?: (pipelineContext?: IPipelineContext) => void;
        context?: WebGL2RenderingContext | WebGLRenderingContext | GPUCanvasContext;
        // preparePipeline options
        createAsRaw?: boolean;
        vertex: string;
        fragment: string;
        defines: Nullable<string>;
        transformFeedbackVaryings: Nullable<string[]>;
    },
    createPipelineContext: typeof AbstractEngine.prototype.createPipelineContext,
    _preparePipelineContext: typeof AbstractEngine.prototype._preparePipelineContext
) => {
    try {
        const pipelineContext: IPipelineContext = options.existingPipelineContext || createPipelineContext(options.shaderProcessingContext);
        pipelineContext._name = options.name;
        if (options.name) {
            cachedPiplines[options.name] = pipelineContext;
        }

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
            ""
        );

        _executeWhenRenderingStateIsCompiled(pipelineContext, (pipelineContext) => {
            options.onRenderingStateCompiled?.(pipelineContext);
        });

        return pipelineContext;
    } catch (e) {
        Logger.Error("Erro compiling effect");
        throw e;
    }
};

import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { IPipelineGenerationOptions } from "./effect.functions";
import { _processShaderCode, createAndPreparePipelineContext } from "./effect.functions";
import type { IPipelineContext } from "core/Engines/IPipelineContext";
import { _executeWhenRenderingStateIsCompiled, _isRenderingStateCompiled, _preparePipelineContext, createPipelineContext, getStateObject } from "core/Engines/thinEngine.functions";
import { ShaderLanguage } from "./shaderLanguage";
import { _getGlobalDefines } from "core/Engines/abstractEngine.functions";
import type { ProcessingOptions } from "core/Engines/Processors/shaderProcessingOptions";
import { ShaderStore } from "core/Engines/shaderStore";
import { WebGL2ShaderProcessor } from "core/Engines/WebGL/webGL2ShaderProcessors";
import { _retryWithInterval } from "core/Misc/timingTools";

/**
 * Generate a pipeline context from the provided options
 * Note - at the moment only WebGL is supported
 * @param options the options to be used when generating the pipeline
 * @param context the context to be used when creating the pipeline
 * @param createPipelineContextInjection the function to create the pipeline context
 * @param _preparePipelineContextInjection the function to prepare the pipeline context
 * @returns a promise that resolves to the pipeline context
 */
export async function generatePipelineContext(
    options: IPipelineGenerationOptions,
    context: WebGL2RenderingContext | WebGLRenderingContext,
    createPipelineContextInjection: typeof AbstractEngine.prototype.createPipelineContext = createPipelineContext.bind(null, context),
    _preparePipelineContextInjection: typeof AbstractEngine.prototype._preparePipelineContext = _preparePipelineContext
): Promise<IPipelineContext> {
    // make sure the state object exists
    getStateObject(context);
    const platformName = options.platformName || "WEBGL2";
    let processor = options.extendedProcessingOptions?.processor;
    const language = options.shaderLanguage || ShaderLanguage.GLSL;
    // auto-populate the processor if not provided
    // Note - async but can be synchronous if we load all dependencies at the start
    if (!processor) {
        switch (platformName) {
            case "WEBGL1":
                processor = new (await import("core/Engines/WebGL/webGLShaderProcessors")).WebGLShaderProcessor();
                break;
            case "WEBGL2":
            default:
                // default to WebGL2, which is included in the package. Avoid async-load the default.
                processor = new WebGL2ShaderProcessor();
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
                                disableParallelCompilation: options.disableParallelCompilation,
                                ...options.extendedCreatePipelineOptions,
                            },
                            createPipelineContextInjection,
                            _preparePipelineContext,
                            _executeWhenRenderingStateIsCompiled
                        );
                        // the default behavior so far. If not async or no request to wait for isReady, resolve immediately
                        if (!options.waitForIsReady || !pipeline.isAsync) {
                            resolve(pipeline);
                        } else {
                            _retryWithInterval(
                                () => _isRenderingStateCompiled(pipeline, context),
                                () => resolve(pipeline),
                                () => reject(new Error("Timeout while waiting for pipeline to be ready"))
                            );
                        }
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

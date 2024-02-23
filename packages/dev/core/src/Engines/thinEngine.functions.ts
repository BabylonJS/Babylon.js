import type { IOfflineProvider } from "core/Offline/IOfflineProvider";
import type { Nullable } from "../types";
import type { IPipelineContext } from "./IPipelineContext";
import type { ShaderProcessingContext } from "./Processors/shaderProcessingOptions";
import { WebGLPipelineContext } from "./WebGL/webGLPipelineContext";
import type { IFileRequest } from "core/Misc/fileRequest";
import type { WebRequest } from "core/Misc/webRequest";
import type { LoadFileError } from "core/Misc/fileTools";
import type { IWebRequest } from "core/Misc/interfaces/iWebRequest";
import { _WarnImport } from "core/Misc/devTools";
import { IsDocumentAvailable } from "core/Misc/domManagement";

export const _activeRequests: IFileRequest[] = [];

export const EngineFunctionContext: {
    /**
     * Loads a file from a url
     * @param url url to load
     * @param onSuccess callback called when the file successfully loads
     * @param onProgress callback called while file is loading (if the server supports this mode)
     * @param offlineProvider defines the offline provider for caching
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @param onError callback called when the file fails to load
     * @returns a file request object
     * @internal
     */
    loadFile?: (
        url: string,
        onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void,
        onProgress?: (ev: ProgressEvent) => void,
        offlineProvider?: IOfflineProvider,
        useArrayBuffer?: boolean,
        onError?: (request?: WebRequest, exception?: LoadFileError) => void
    ) => IFileRequest;
} = {};

export type WebGLContext = WebGLRenderingContext | WebGL2RenderingContext;
/**
 * Directly creates a webGL program
 * @param pipelineContext  defines the pipeline context to attach to
 * @param vertexCode defines the vertex shader code to use
 * @param fragmentCode defines the fragment shader code to use
 * @param context defines the webGL context to use (if not set, the current one will be used)
 * @param transformFeedbackVaryings defines the list of transform feedback varyings to use
 * @param validateShaderPrograms defines if the shader program should be validated after linking
 * @param _contextWasLost defines if the webgl context was lost
 * @returns the new webGL program
 */
export function createRawShaderProgram(
    pipelineContext: IPipelineContext,
    vertexCode: string,
    fragmentCode: string,
    context: WebGLRenderingContext,
    transformFeedbackVaryings: Nullable<string[]>,
    validateShaderPrograms?: boolean,
    _contextWasLost?: boolean
): WebGLProgram {
    // context = context || gl;

    const vertexShader = _compileRawShader(vertexCode, "vertex", context, _contextWasLost);
    const fragmentShader = _compileRawShader(fragmentCode, "fragment", context, _contextWasLost);

    return _createShaderProgram(pipelineContext as WebGLPipelineContext, vertexShader, fragmentShader, context, transformFeedbackVaryings, validateShaderPrograms);
}

/**
 * Creates a webGL program
 * @param pipelineContext  defines the pipeline context to attach to
 * @param vertexCode  defines the vertex shader code to use
 * @param fragmentCode defines the fragment shader code to use
 * @param defines defines the string containing the defines to use to compile the shaders
 * @param context defines the webGL context to use (if not set, the current one will be used)
 * @param transformFeedbackVaryings defines the list of transform feedback varyings to use
 * @param _webGLVersion defines the webgl version to use
 * @param validateShaderPrograms defines if the shader program should be validated after linking
 * @param _contextWasLost defines if the webgl context was lost
 * @returns the new webGL program
 */
export function createShaderProgram(
    pipelineContext: IPipelineContext,
    vertexCode: string,
    fragmentCode: string,
    defines: Nullable<string>,
    context: WebGLContext,
    transformFeedbackVaryings: Nullable<string[]> = null,
    _webGLVersion: number = 2,
    validateShaderPrograms?: boolean,
    _contextWasLost?: boolean
): WebGLProgram {
    const shaderVersion = _webGLVersion > 1 ? "#version 300 es\n#define WEBGL2 \n" : "";
    const vertexShader = _compileShader(vertexCode, "vertex", defines, shaderVersion, context, _contextWasLost);
    const fragmentShader = _compileShader(fragmentCode, "fragment", defines, shaderVersion, context, _contextWasLost);

    return _createShaderProgram(pipelineContext as WebGLPipelineContext, vertexShader, fragmentShader, context, transformFeedbackVaryings, validateShaderPrograms);
}

/**
 * Creates a new pipeline context. Note, make sure to attach an engine instance to the created context
 * @param _shaderProcessingContext defines the shader processing context used during the processing if available
 * @param parallelShaderCompile defines whether to compile shaders in parallel
 * @param name defines the name of the pipeline context
 * @returns the new pipeline
 */
export function createPipelineContext(
    _shaderProcessingContext: Nullable<ShaderProcessingContext>,
    parallelShaderCompile?: { COMPLETION_STATUS_KHR: number },
    name: string = ""
): IPipelineContext {
    const pipelineContext = new WebGLPipelineContext();
    // pipelineContext.engine = this;

    if (/*this._caps.*/ parallelShaderCompile) {
        pipelineContext.isParallelCompiled = true;
    }
    (pipelineContext as IPipelineContext)._name = name;

    return pipelineContext;
}

/**
 * @internal
 */
export function _createShaderProgram(
    pipelineContext: WebGLPipelineContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
    context: WebGLContext,
    _transformFeedbackVaryings: Nullable<string[]> = null,
    validateShaderPrograms?: boolean
): WebGLProgram {
    const shaderProgram = context.createProgram();
    pipelineContext.program = shaderProgram;

    if (!shaderProgram) {
        throw new Error("Unable to create program");
    }

    context.attachShader(shaderProgram, vertexShader);
    context.attachShader(shaderProgram, fragmentShader);

    context.linkProgram(shaderProgram);

    pipelineContext.context = context;
    pipelineContext.vertexShader = vertexShader;
    pipelineContext.fragmentShader = fragmentShader;

    if (!pipelineContext.isParallelCompiled) {
        _finalizePipelineContext(pipelineContext, context, validateShaderPrograms);
    }

    return shaderProgram;
}

/**
 * @internal
 */
export function _finalizePipelineContext(pipelineContext: WebGLPipelineContext, gl: WebGLContext, validateShaderPrograms?: boolean) {
    const context = pipelineContext.context!;
    const vertexShader = pipelineContext.vertexShader!;
    const fragmentShader = pipelineContext.fragmentShader!;
    const program = pipelineContext.program!;

    const linked = context.getProgramParameter(program, context.LINK_STATUS);
    if (!linked) {
        // Get more info
        // Vertex
        if (gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(vertexShader);
            if (log) {
                pipelineContext.vertexCompilationError = log;
                throw new Error("VERTEX SHADER " + log);
            }
        }

        // Fragment
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(fragmentShader);
            if (log) {
                pipelineContext.fragmentCompilationError = log;
                throw new Error("FRAGMENT SHADER " + log);
            }
        }

        const error = context.getProgramInfoLog(program);
        if (error) {
            pipelineContext.programLinkError = error;
            throw new Error(error);
        }
    }

    if (/*this.*/ validateShaderPrograms) {
        context.validateProgram(program);
        const validated = context.getProgramParameter(program, context.VALIDATE_STATUS);

        if (!validated) {
            const error = context.getProgramInfoLog(program);
            if (error) {
                pipelineContext.programValidationError = error;
                throw new Error(error);
            }
        }
    }

    context.deleteShader(vertexShader);
    context.deleteShader(fragmentShader);

    pipelineContext.vertexShader = undefined;
    pipelineContext.fragmentShader = undefined;

    if (pipelineContext.onCompiled) {
        pipelineContext.onCompiled();
        pipelineContext.onCompiled = undefined;
    }
}

/**
 * @internal
 */
export function _preparePipelineContext(
    pipelineContext: IPipelineContext,
    vertexSourceCode: string,
    fragmentSourceCode: string,
    createAsRaw: boolean,
    rebuildRebind: any,
    defines: Nullable<string>,
    transformFeedbackVaryings: Nullable<string[]>,
    // key: string = "",
    validateShaderPrograms?: boolean,
    _contextWasLost?: boolean,
    _webGLVersion?: number
) {
    const webGLRenderingState = pipelineContext as WebGLPipelineContext;

    if (createAsRaw) {
        webGLRenderingState.program = createRawShaderProgram(
            webGLRenderingState,
            vertexSourceCode,
            fragmentSourceCode,
            webGLRenderingState.context!,
            transformFeedbackVaryings,
            validateShaderPrograms,
            _contextWasLost
        );
    } else {
        webGLRenderingState.program = createShaderProgram(
            webGLRenderingState,
            vertexSourceCode,
            fragmentSourceCode,
            defines,
            webGLRenderingState.context!,
            transformFeedbackVaryings,
            _webGLVersion,
            validateShaderPrograms,
            _contextWasLost
        );
    }
    webGLRenderingState.program.__SPECTOR_rebuildProgram = rebuildRebind;
}

function _compileShader(source: string, type: string, defines: Nullable<string>, shaderVersion: string, gl: WebGLContext, _contextWasLost?: boolean): WebGLShader {
    return _compileRawShader(_ConcatenateShader(source, defines, shaderVersion), type, gl, _contextWasLost);
}

function _compileRawShader(source: string, type: string, gl: WebGLContext, _contextWasLost?: boolean): WebGLShader {
    const shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);

    if (!shader) {
        let error: GLenum = gl.NO_ERROR;
        let tempError: GLenum = gl.NO_ERROR;
        while ((tempError = gl.getError()) !== gl.NO_ERROR) {
            error = tempError;
        }

        throw new Error(
            `Something went wrong while creating a gl ${type} shader object. gl error=${error}, gl isContextLost=${gl.isContextLost()}, _contextWasLost=${_contextWasLost}`
        );
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    return shader;
}

/**
 * Binds an effect to the webGL context
 * @param pipelineContext  defines the pipeline context to use
 * @param samplers defines the list of webGL samplers to bind
 * @param uniforms defines the list of webGL uniforms to bind
 * @returns the webGL program
 */
export function bindSamplers(
    pipelineContext: IPipelineContext,
    samplers: string[],
    uniforms: {
        [key: string]: Nullable<WebGLUniformLocation>;
    }
) {
    const webGLPipelineContext = pipelineContext as WebGLPipelineContext;
    _setProgram(webGLPipelineContext.program!, webGLPipelineContext.context!);
    const _boundUniforms: Nullable<WebGLUniformLocation>[] = [];
    for (let index = 0; index < samplers.length; index++) {
        const uniform = uniforms[samplers[index]];

        if (uniform) {
            _boundUniforms[index] = uniform;
        }
    }
    return _boundUniforms;
}

/**
 * @internal
 */
export function _setProgram(program: WebGLProgram, gl: WebGLContext): void {
    gl.useProgram(program);
}

/**
 * @internal
 */
export function _ConcatenateShader(source: string, defines: Nullable<string>, shaderVersion: string = ""): string {
    return shaderVersion + (defines ? defines + "\n" : "") + source;
}

/**
 * @internal
 */
export function _loadFile(
    url: string,
    onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void,
    onProgress?: (data: any) => void,
    offlineProvider?: IOfflineProvider,
    useArrayBuffer?: boolean,
    onError?: (request?: IWebRequest, exception?: any) => void,
    injectedLoadFile?: (
        url: string,
        onSuccess: (data: string | ArrayBuffer, responseURL?: string | undefined) => void,
        onProgress?: ((ev: ProgressEvent<EventTarget>) => void) | undefined,
        offlineProvider?: IOfflineProvider | undefined,
        useArrayBuffer?: boolean | undefined,
        onError?: ((request?: WebRequest | undefined, exception?: LoadFileError | undefined) => void) | undefined
    ) => IFileRequest
): IFileRequest {
    const loadFile = injectedLoadFile || EngineFunctionContext.loadFile;
    if (loadFile) {
        const request = loadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError);
        _activeRequests.push(request);
        request.onCompleteObservable.add((request) => {
            _activeRequests.splice(_activeRequests.indexOf(request), 1);
        });
        return request;
    }
    throw _WarnImport("FileTools");
}

/**
 * Gets host document
 * @param renderingCanvas if provided, the canvas' owner document will be returned
 * @returns the host document object
 */
export function getHostDocument(renderingCanvas: Nullable<HTMLCanvasElement> = null): Nullable<Document> {
    if (renderingCanvas && renderingCanvas.ownerDocument) {
        return renderingCanvas.ownerDocument;
    }

    return IsDocumentAvailable() ? document : null;
}

/** @internal */
export function _getGlobalDefines(
    defines?: { [key: string]: string },
    isNDCHalfZRange?: boolean,
    useReverseDepthBuffer?: boolean,
    useExactSrgbConversions?: boolean
): string | undefined {
    if (defines) {
        if (isNDCHalfZRange) {
            defines["IS_NDC_HALF_ZRANGE"] = "";
        } else {
            delete defines["IS_NDC_HALF_ZRANGE"];
        }
        if (useReverseDepthBuffer) {
            defines["USE_REVERSE_DEPTHBUFFER"] = "";
        } else {
            delete defines["USE_REVERSE_DEPTHBUFFER"];
        }
        if (useExactSrgbConversions) {
            defines["USE_EXACT_SRGB_CONVERSIONS"] = "";
        } else {
            delete defines["USE_EXACT_SRGB_CONVERSIONS"];
        }
        return;
    } else {
        let s = "";
        if (isNDCHalfZRange) {
            s += "#define IS_NDC_HALF_ZRANGE";
        }
        if (useReverseDepthBuffer) {
            if (s) {
                s += "\n";
            }
            s += "#define USE_REVERSE_DEPTHBUFFER";
        }
        if (useExactSrgbConversions) {
            if (s) {
                s += "\n";
            }
            s += "#define USE_EXACT_SRGB_CONVERSIONS";
        }
        return s;
    }
}

/**
 * @internal
 */
export function _executeWhenRenderingStateIsCompiled(pipelineContext: IPipelineContext, action: (pipelineContext?: IPipelineContext) => void) {
    const webGLPipelineContext = pipelineContext as WebGLPipelineContext;

    if (!webGLPipelineContext.isParallelCompiled) {
        action(pipelineContext);
        return;
    }

    const oldHandler = webGLPipelineContext.onCompiled;

    if (oldHandler) {
        webGLPipelineContext.onCompiled = () => {
            oldHandler!();
            action(pipelineContext);
        };
    } else {
        webGLPipelineContext.onCompiled = action;
    }
}

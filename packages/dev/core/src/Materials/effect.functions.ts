import type { ProcessingOptions, ShaderCustomProcessingFunction } from "core/Engines/Processors/shaderProcessingOptions";
import { ShaderProcessor } from "core/Engines/Processors/shaderProcessor";
import { GetDOMTextContent, IsWindowObjectExist } from "core/Misc/domManagement";
import type { Nullable } from "core/types";
import { ShaderLanguage } from "./shaderLanguage";
import { _executeWhenRenderingStateIsCompiled, _loadFile, _preparePipelineContext, bindSamplers, createPipelineContext, getHostDocument } from "core/Engines/thinEngine.functions";
import { ShaderStore } from "core/Engines/shaderStore";
import type { ThinEngine } from "core/Engines/thinEngine";
import type { Effect } from "./effect";
import { IPipelineContext } from "core/Engines/IPipelineContext";

/** @internal */
export function _processShaderCode(
    processorOptions: ProcessingOptions,
    processFinalCode: Nullable<ShaderCustomProcessingFunction>,
    baseName: any,
    onFinalCodeReady: (vertexCode: string, fragmentCode: string) => void,
    shaderLanguage?: ShaderLanguage,
    engine?: ThinEngine,
    effectContext?: Effect
) {
    let vertexSource: any;
    let fragmentSource: any;

    const hostDocument = IsWindowObjectExist() ? getHostDocument(engine?.getRenderingCanvas()) : null; // TODO - rendering canvas?

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

    const shaderCodes: [string | undefined, string | undefined] = [undefined, undefined];
    const shadersLoaded = () => {
        if (shaderCodes[0] && shaderCodes[1]) {
            processorOptions.isFragment = true;
            const [migratedVertexCode, fragmentCode] = shaderCodes;
            ShaderProcessor.Process(
                fragmentCode,
                processorOptions,
                (migratedFragmentCode, codeBeforeMigration) => {
                    if (effectContext) {
                        effectContext._fragmentSourceCodeBeforeMigration = codeBeforeMigration;
                    }
                    if (processFinalCode) {
                        migratedFragmentCode = processFinalCode("fragment", migratedFragmentCode);
                    }
                    const finalShaders = ShaderProcessor.Finalize(migratedVertexCode, migratedFragmentCode, processorOptions);
                    processorOptions = null as any;
                    const finalCode = _useFinalCode(finalShaders.vertexCode, finalShaders.fragmentCode, baseName, shaderLanguage);
                    onFinalCodeReady(finalCode.vertexSourceCode, finalCode.fragmentSourceCode);
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
            ShaderProcessor.Initialize(processorOptions);
            ShaderProcessor.Process(
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
 * Prepares the effect
 * @internal
 */
export function _prepareEffect(
    keepExistingPipelineContext = false,
    attributesNames,
    defines,
    previousPipelineContext,
    key,
    processingContext,
    rebuildRebind: (vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (pipelineContext: IPipelineContext) => void, onError: (message: string) => void) => void,
    onRenderingStateIsCompiled: () => void,
    onError?: (error: any) => void
) {
    this._isReady = false;

    try {
        const pipelineContext: IPipelineContext = (keepExistingPipelineContext ? previousPipelineContext : undefined) ?? createPipelineContext(processingContext, parallelShaderCompile);
        pipelineContext._name = key.replace(/\r/g, "").replace(/\n/g, "|");

        rebuildRebind = rebuildRebind || (vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (pipelineContext: IPipelineContext) => void, onError: (message: string) => void) =>
            _rebuildProgram(vertexSourceCode, fragmentSourceCode, onCompiled, onError);
        if (this._vertexSourceCodeOverride && this._fragmentSourceCodeOverride) {
            _preparePipelineContext(
                pipelineContext,
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
            _preparePipelineContext(
                pipelineContext,
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

        _executeWhenRenderingStateIsCompiled(pipelineContext, () => {
            this._attributes = [];
            pipelineContext!._fillEffectInformation(
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

            bindSamplers(pipelineContext, this._samplers, this._uniforms);

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

            if (previousPipelineContext && !keepExistingPipelineContext) {
                this.getEngine()._deletePipelineContext(previousPipelineContext);
            }
        });

        if (pipelineContext.isAsync) {
            this._checkIsReady(previousPipelineContext);
        }
    } catch (e) {
        this._processCompilationErrors(e, previousPipelineContext);
    }
}

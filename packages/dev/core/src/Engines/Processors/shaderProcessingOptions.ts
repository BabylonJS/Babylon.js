/* eslint-disable jsdoc/require-jsdoc */
import type { IShaderProcessor } from "./iShaderProcessor";
import type { Nullable } from "../../types";

/**
 * Function for custom code generation
 */
export type ShaderCustomProcessingFunction = (shaderType: string, code: string) => string;

/** @internal */
export interface ShaderProcessingContext {
    // For engines that check for non float vertex buffers, this object is populated only with the vertex kinds known to be FLOAT by the engine (position, uv, ...)
    // and only if the type of the corresponding vertex buffer is an integer type. If the type is a signed integer type, the value is negated.
    vertexBufferKindToNumberOfComponents?: { [kind: string]: number };
}

/** @internal */
export interface ProcessingOptions {
    defines: string[];
    indexParameters: any;
    isFragment: boolean;
    shouldUseHighPrecisionShader: boolean;
    supportsUniformBuffers: boolean;
    shadersRepository: string;
    includesShadersStore: { [key: string]: string };
    processor: Nullable<IShaderProcessor>;
    version: string;
    platformName: string;
    lookForClosingBracketForUniformBuffer?: boolean;
    processingContext: Nullable<ShaderProcessingContext>;
    isNDCHalfZRange: boolean;
    useReverseDepthBuffer: boolean;
    processCodeAfterIncludes?: ShaderCustomProcessingFunction;
}

import { Nullable } from "../../types";
import { ShaderProcessingContext } from "./shaderProcessingOptions";

declare type ThinEngine = import("../thinEngine").ThinEngine;

/**
 * Language of the shader code
 */
export enum ShaderLanguage {
    /** language is GLSL (used by WebGL) */
    GLSL,
    /** language is WGSL (used by WebGPU) */
    WGSL
}

/** @hidden */
export interface IShaderProcessor {
    shaderLanguage: ShaderLanguage;

    uniformRegexp?: RegExp;
    uniformBufferRegexp?: RegExp;
    textureRegexp?: RegExp;
    noPrecision?: boolean;
    removeCommentsBeforeProcessing?: boolean;

    attributeProcessor?: (attribute: string, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) => string;
    varyingProcessor?: (varying: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) => string;
    uniformProcessor?: (uniform: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) => string;
    uniformBufferProcessor?: (uniformBuffer: string, isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>) => string;
    textureProcessor?: (texture: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) => string;
    endOfUniformBufferProcessor?: (closingBracketLine: string, isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>) => string;
    lineProcessor?: (line: string, isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>) => string;
    preProcessor?: (code: string, defines: string[], isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>) => string;
    postProcessor?: (code: string, defines: string[], isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>, engine: ThinEngine) => string;
    initializeShaders?: (processingContext: Nullable<ShaderProcessingContext>) => void;
    finalizeShaders?: (vertexCode: string, fragmentCode: string, processingContext: Nullable<ShaderProcessingContext>) => { vertexCode: string, fragmentCode: string };
}

import type { ShaderLanguage } from "../../Materials/shaderLanguage";
import type { Nullable } from "../../types";
import type { ShaderProcessingContext } from "./shaderProcessingOptions";

import type { AbstractEngine } from "../abstractEngine";

/** @internal */
export interface IShaderProcessor {
    shaderLanguage: ShaderLanguage;

    uniformRegexp?: RegExp;
    uniformBufferRegexp?: RegExp;
    textureRegexp?: RegExp;
    noPrecision?: boolean;
    parseGLES3?: boolean;

    attributeKeywordName?: string;
    varyingVertexKeywordName?: string;
    varyingFragmentKeywordName?: string;

    preProcessShaderCode?: (code: string, isFragment: boolean) => string;
    attributeProcessor?: (attribute: string, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) => string;
    varyingCheck?: (varying: string, isFragment: boolean) => boolean;
    varyingProcessor?: (varying: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) => string;
    uniformProcessor?: (uniform: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) => string;
    uniformBufferProcessor?: (uniformBuffer: string, isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>) => string;
    textureProcessor?: (texture: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<ShaderProcessingContext>) => string;
    endOfUniformBufferProcessor?: (closingBracketLine: string, isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>) => string;
    lineProcessor?: (line: string, isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>) => string;
    preProcessor?: (code: string, defines: string[], isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>) => string;
    postProcessor?: (code: string, defines: string[], isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>, engine: AbstractEngine) => string;
    initializeShaders?: (processingContext: Nullable<ShaderProcessingContext>) => void;
    finalizeShaders?: (vertexCode: string, fragmentCode: string, processingContext: Nullable<ShaderProcessingContext>) => { vertexCode: string; fragmentCode: string };
}

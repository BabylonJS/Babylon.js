import type { ShaderLanguage } from "../../Materials/shaderLanguage";
import type { Nullable } from "../../types";
import type { _IShaderProcessingContext } from "./shaderProcessingOptions";

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
    attributeProcessor?: (attribute: string, preProcessors: { [key: string]: string }, processingContext: Nullable<_IShaderProcessingContext>) => string;
    varyingCheck?: (varying: string, isFragment: boolean) => boolean;
    varyingProcessor?: (varying: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<_IShaderProcessingContext>) => string;
    uniformProcessor?: (uniform: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<_IShaderProcessingContext>) => string;
    uniformBufferProcessor?: (uniformBuffer: string, isFragment: boolean, processingContext: Nullable<_IShaderProcessingContext>) => string;
    textureProcessor?: (texture: string, isFragment: boolean, preProcessors: { [key: string]: string }, processingContext: Nullable<_IShaderProcessingContext>) => string;
    endOfUniformBufferProcessor?: (closingBracketLine: string, isFragment: boolean, processingContext: Nullable<_IShaderProcessingContext>) => string;
    lineProcessor?: (line: string, isFragment: boolean, processingContext: Nullable<_IShaderProcessingContext>) => string;
    preProcessor?: (
        code: string,
        defines: string[],
        preProcessors: { [key: string]: string },
        isFragment: boolean,
        processingContext: Nullable<_IShaderProcessingContext>
    ) => string;
    postProcessor?: (
        code: string,
        defines: string[],
        isFragment: boolean,
        processingContext: Nullable<_IShaderProcessingContext>,
        patameters: {
            [key: string]: number | string | boolean | undefined;
        },
        preProcessors: { [key: string]: string },
        preProcessorsFromCode: { [key: string]: string }
    ) => string;
    initializeShaders?: (processingContext: Nullable<_IShaderProcessingContext>) => void;
    finalizeShaders?: (vertexCode: string, fragmentCode: string, processingContext: Nullable<_IShaderProcessingContext>) => { vertexCode: string; fragmentCode: string };
}

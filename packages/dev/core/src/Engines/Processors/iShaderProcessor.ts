/* eslint-disable jsdoc/require-jsdoc */
import type { ShaderLanguage } from "../../Materials/shaderLanguage";
import type { Nullable } from "../../types";
import type { ShaderProcessingContext } from "./shaderProcessingOptions";

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
    postProcessor?: (
        code: string,
        defines: string[],
        isFragment: boolean,
        processingContext: Nullable<ShaderProcessingContext>,
        patameters: {
            [key: string]: number | string | boolean | undefined;
        }
    ) => string;
    initializeShaders?: (processingContext: Nullable<ShaderProcessingContext>) => void;
    finalizeShaders?: (vertexCode: string, fragmentCode: string, processingContext: Nullable<ShaderProcessingContext>) => { vertexCode: string; fragmentCode: string };
}

/** @internal */
export function injectStartingAndEndingCode(code: string, mainFuncDecl: string, startingCode?: string, endingCode?: string): string {
    let idx = code.indexOf(mainFuncDecl);
    if (idx < 0) {
        return code;
    }
    if (startingCode) {
        // eslint-disable-next-line no-empty
        while (idx++ < code.length && code.charAt(idx) != "{") {}
        if (idx < code.length) {
            const part1 = code.substring(0, idx + 1);
            const part2 = code.substring(idx + 1);
            code = part1 + startingCode + part2;
        }
    }

    if (endingCode) {
        const lastClosingCurly = code.lastIndexOf("}");
        code = code.substring(0, lastClosingCurly);
        code += endingCode + "\n}";
    }

    return code;
}

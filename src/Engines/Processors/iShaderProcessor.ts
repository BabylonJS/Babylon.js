import { Nullable } from "../../types";
import { ShaderProcessingContext } from "./shaderProcessingOptions";

/** @hidden */
export interface IShaderProcessor {
    attributeProcessor?: (attribute: string, processingContext: Nullable<ShaderProcessingContext>) => string;
    varyingProcessor?: (varying: string, isFragment: boolean) => string;
    uniformProcessor?: (uniform: string, isFragment: boolean) => string;
    uniformBufferProcessor?: (uniformBuffer: string, isFragment: boolean) => string;
    endOfUniformBufferProcessor?: (closingBracketLine: string, isFragment: boolean) => string;
    lineProcessor?: (line: string, isFragment: boolean) => string;
    preProcessor?: (code: string, defines: string[], isFragment: boolean) => string;
    postProcessor?: (code: string, defines: string[], isFragment: boolean) => string;
}

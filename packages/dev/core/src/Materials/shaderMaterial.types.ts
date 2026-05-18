/* eslint-disable @typescript-eslint/naming-convention */
import {
    type ShaderMaterialCreateFromSnippetAsync,
    type ShaderMaterialParse,
    type ShaderMaterialParseFromFileAsync,
    type ShaderMaterialParseFromSnippetAsync,
} from "./shaderMaterial.pure";

type ShaderMaterialCreateFromSnippetAsyncType = typeof ShaderMaterialCreateFromSnippetAsync;
type ShaderMaterialParseType = typeof ShaderMaterialParse;
type ShaderMaterialParseFromFileAsyncType = typeof ShaderMaterialParseFromFileAsync;
type ShaderMaterialParseFromSnippetAsyncType = typeof ShaderMaterialParseFromSnippetAsync;

declare module "./shaderMaterial.pure" {
    namespace ShaderMaterial {
        export let Parse: ShaderMaterialParseType;
        export let ParseFromFileAsync: ShaderMaterialParseFromFileAsyncType;
        export let ParseFromSnippetAsync: ShaderMaterialParseFromSnippetAsyncType;
        export let CreateFromSnippetAsync: ShaderMaterialCreateFromSnippetAsyncType;
    }
}

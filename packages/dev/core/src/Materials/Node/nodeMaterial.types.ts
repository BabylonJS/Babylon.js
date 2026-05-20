/* eslint-disable @typescript-eslint/naming-convention */
import {
    type NodeMaterialBlockIsTextureBlock,
    type NodeMaterialCreateDefault,
    type NodeMaterialParse,
    type NodeMaterialParseFromFileAsync,
    type NodeMaterialParseFromSnippetAsync,
} from "./nodeMaterial.pure";

type NodeMaterialBlockIsTextureBlockType = typeof NodeMaterialBlockIsTextureBlock;
type NodeMaterialCreateDefaultType = typeof NodeMaterialCreateDefault;
type NodeMaterialParseType = typeof NodeMaterialParse;
type NodeMaterialParseFromFileAsyncType = typeof NodeMaterialParseFromFileAsync;
type NodeMaterialParseFromSnippetAsyncType = typeof NodeMaterialParseFromSnippetAsync;

declare module "./nodeMaterial.pure" {
    namespace NodeMaterial {
        export let _BlockIsTextureBlock: NodeMaterialBlockIsTextureBlockType;
        export let Parse: NodeMaterialParseType;
        export let ParseFromFileAsync: NodeMaterialParseFromFileAsyncType;
        export let ParseFromSnippetAsync: NodeMaterialParseFromSnippetAsyncType;
        export let CreateDefault: NodeMaterialCreateDefaultType;
    }
}

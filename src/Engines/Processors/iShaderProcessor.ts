/** @hidden */
export interface IShaderProcessor {
    attributeProcessor?: (attribute: string) => string;
    varyingProcessor?: (varying: string, isFragment: boolean) => string;
    postProcessor?: (code: string, defines: string[], isFragment: boolean) => string;
}

import { DecodeBase64UrlToBinary, DecodeBase64UrlToString, FileToolsOptions, IsBase64DataUrl, IsFileURL, LoadFile, LoadImage, ReadFile, RequestFile, SetCorsBehavior } from "./fileTools";

/**
 * `any` serves as a solution to 2 issues:
 * 1) the FileTools should not be imported from the `fileTools` module.
 * 2) FileTools should only be exported after the module was initialized.
 * @hidden
 * @deprecated
 */
export let FileTools: any;
/** @hidden */
export const _injectLTS = () => {
    /**
     * Backwards compatibility.
     * @hidden
     */
    FileTools = {
        DecodeBase64UrlToBinary,
        DecodeBase64UrlToString,
        DefaultRetryStrategy: FileToolsOptions.DefaultRetryStrategy,
        BaseUrl: FileToolsOptions.BaseUrl,
        CorsBehavior: FileToolsOptions.CorsBehavior,
        PreprocessUrl: FileToolsOptions.PreprocessUrl,
        IsBase64DataUrl,
        IsFileURL,
        LoadFile,
        LoadImage,
        ReadFile,
        RequestFile,
        SetCorsBehavior,
    };
};
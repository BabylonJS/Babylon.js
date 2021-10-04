import { DecodeBase64UrlToBinary, DecodeBase64UrlToString, FileToolsOptions, IsBase64DataUrl, IsFileURL, LoadFile, LoadImage, ReadFile, RequestFile, SetCorsBehavior } from "./fileTools";
import { WebRequest } from "./webRequest";

/**
 * @hidden
 * @deprecated
 */
export let FileTools = {};
/** @hidden */
export const _injectLTSFileTools = () => {
    /**
 * Backwards compatibility.
 * @hidden
 * @deprecated
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

    Object.defineProperty(FileTools, "DefaultRetryStrategy", {
        get: function (this: null) {
            return FileToolsOptions.DefaultRetryStrategy;
        },
        set: function (this: null, value: (url: string, request: WebRequest, retryIndex: number) => number) {
            FileToolsOptions.DefaultRetryStrategy = value;
        }
    });

    Object.defineProperty(FileTools, "BaseUrl", {
        get: function (this: null) {
            return FileToolsOptions.BaseUrl;
        },
        set: function (this: null, value: string) {
            FileToolsOptions.BaseUrl = value;
        }
    });

    Object.defineProperty(FileTools, "PreprocessUrl", {
        get: function (this: null) {
            return FileToolsOptions.PreprocessUrl;
        },
        set: function (this: null, value: (url: string) => string) {
            FileToolsOptions.PreprocessUrl = value;
        }
    });

    Object.defineProperty(FileTools, "CorsBehavior", {
        get: function (this: null) {
            return FileToolsOptions.CorsBehavior;
        },
        set: function (this: null, value: string | ((url: string | string[]) => string)) {
            FileToolsOptions.CorsBehavior = value;
        }
    });
};
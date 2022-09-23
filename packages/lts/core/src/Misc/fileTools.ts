/* eslint-disable @typescript-eslint/naming-convention */
import type { IFileRequest } from "core/Misc/fileRequest";
import {
    DecodeBase64UrlToBinary,
    DecodeBase64UrlToString,
    FileToolsOptions,
    IsBase64DataUrl,
    IsFileURL,
    LoadFile,
    LoadImage,
    ReadFile,
    RequestFile,
    SetCorsBehavior,
} from "core/Misc/fileTools";
import type { WebRequest } from "core/Misc/webRequest";
import type { IOfflineProvider } from "core/Offline/IOfflineProvider";
import type { Nullable } from "core/types";

declare type LoadFileError = import("core/Misc/fileTools").LoadFileError;
declare type ReadFileError = import("core/Misc/fileTools").ReadFileError;
declare type RequestFileError = import("core/Misc/fileTools").RequestFileError;

/**
 * FileTools defined as any.
 * This should not be imported or used in future releases or in any module in the framework
 * @internal
 * @deprecated import the needed function from fileTools.ts
 */
export let FileTools: {
    DecodeBase64UrlToBinary: (uri: string) => ArrayBuffer;
    DecodeBase64UrlToString: (uri: string) => string;
    DefaultRetryStrategy: any;
    BaseUrl: any;
    CorsBehavior: any;
    PreprocessUrl: any;
    IsBase64DataUrl: (uri: string) => boolean;
    IsFileURL: () => boolean;
    LoadFile: (
        fileOrUrl: string | File,
        onSuccess: (data: string | ArrayBuffer, responseURL?: string | undefined) => void,
        onProgress?: ((ev: ProgressEvent<EventTarget>) => void) | undefined,
        offlineProvider?: IOfflineProvider | undefined,
        useArrayBuffer?: boolean | undefined,
        onError?: ((request?: WebRequest | undefined, exception?: LoadFileError | undefined) => void) | undefined,
        onOpened?: ((request: WebRequest) => void) | undefined
    ) => IFileRequest;
    LoadImage: (
        input: string | ArrayBuffer | Blob | ArrayBufferView,
        onLoad: (img: HTMLImageElement | ImageBitmap) => void,
        onError: (message?: string | undefined, exception?: any) => void,
        offlineProvider: Nullable<IOfflineProvider>,
        mimeType?: string | undefined,
        imageBitmapOptions?: ImageBitmapOptions | undefined
    ) => Nullable<HTMLImageElement>;
    ReadFile: (
        file: File,
        onSuccess: (data: any) => void,
        onProgress?: ((ev: ProgressEvent<EventTarget>) => any) | undefined,
        useArrayBuffer?: boolean | undefined,
        onError?: ((error: ReadFileError) => void) | undefined
    ) => IFileRequest;
    RequestFile: (
        url: string,
        onSuccess: (data: string | ArrayBuffer, request?: WebRequest | undefined) => void,
        onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined,
        offlineProvider?: IOfflineProvider | undefined,
        useArrayBuffer?: boolean | undefined,
        onError?: ((error: RequestFileError) => void) | undefined,
        onOpened?: ((request: WebRequest) => void) | undefined
    ) => IFileRequest;
    SetCorsBehavior: (url: string | string[], element: { crossOrigin: string | null }) => void;
};
/**
 * @param DecodeBase64UrlToBinary
 * @param DecodeBase64UrlToString
 * @param FileToolsOptions
 * @internal
 */
export const _injectLTSFileTools = (
    DecodeBase64UrlToBinary: (uri: string) => ArrayBuffer,
    DecodeBase64UrlToString: (uri: string) => string,
    FileToolsOptions: { DefaultRetryStrategy: any; BaseUrl: any; CorsBehavior: any; PreprocessUrl: any },
    IsBase64DataUrl: (uri: string) => boolean,
    IsFileURL: () => boolean,
    LoadFile: (
        fileOrUrl: string | File,
        onSuccess: (data: string | ArrayBuffer, responseURL?: string | undefined) => void,
        onProgress?: ((ev: ProgressEvent<EventTarget>) => void) | undefined,
        offlineProvider?: IOfflineProvider | undefined,
        useArrayBuffer?: boolean | undefined,
        onError?: ((request?: WebRequest | undefined, exception?: LoadFileError | undefined) => void) | undefined,
        onOpened?: ((request: WebRequest) => void) | undefined
    ) => IFileRequest,
    LoadImage: (
        input: string | ArrayBuffer | ArrayBufferView | Blob,
        onLoad: (img: HTMLImageElement | ImageBitmap) => void,
        onError: (message?: string | undefined, exception?: any) => void,
        offlineProvider: Nullable<IOfflineProvider>,
        mimeType?: string,
        imageBitmapOptions?: ImageBitmapOptions | undefined
    ) => Nullable<HTMLImageElement>,
    ReadFile: (
        file: File,
        onSuccess: (data: any) => void,
        onProgress?: ((ev: ProgressEvent<EventTarget>) => any) | undefined,
        useArrayBuffer?: boolean | undefined,
        onError?: ((error: ReadFileError) => void) | undefined
    ) => IFileRequest,
    RequestFile: (
        url: string,
        onSuccess: (data: string | ArrayBuffer, request?: WebRequest | undefined) => void,
        onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined,
        offlineProvider?: IOfflineProvider | undefined,
        useArrayBuffer?: boolean | undefined,
        onError?: ((error: RequestFileError) => void) | undefined,
        onOpened?: ((request: WebRequest) => void) | undefined
    ) => IFileRequest,
    SetCorsBehavior: (url: string | string[], element: { crossOrigin: string | null }) => void
) => {
    /**
     * Backwards compatibility.
     * @internal
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
        },
    });

    Object.defineProperty(FileTools, "BaseUrl", {
        get: function (this: null) {
            return FileToolsOptions.BaseUrl;
        },
        set: function (this: null, value: string) {
            FileToolsOptions.BaseUrl = value;
        },
    });

    Object.defineProperty(FileTools, "PreprocessUrl", {
        get: function (this: null) {
            return FileToolsOptions.PreprocessUrl;
        },
        set: function (this: null, value: (url: string) => string) {
            FileToolsOptions.PreprocessUrl = value;
        },
    });

    Object.defineProperty(FileTools, "CorsBehavior", {
        get: function (this: null) {
            return FileToolsOptions.CorsBehavior;
        },
        set: function (this: null, value: string | ((url: string | string[]) => string)) {
            FileToolsOptions.CorsBehavior = value;
        },
    });
};

_injectLTSFileTools(DecodeBase64UrlToBinary, DecodeBase64UrlToString, FileToolsOptions, IsBase64DataUrl, IsFileURL, LoadFile, LoadImage, ReadFile, RequestFile, SetCorsBehavior);

import { WebRequest } from './webRequest';
import { IsWindowObjectExist } from './domManagement';
import { Nullable } from '../types';
import { IOfflineProvider } from '../Offline/IOfflineProvider';
import { IFileRequest } from './fileRequest';
import { Observable } from './observable';
import { FilesInputStore } from './filesInputStore';
import { RetryStrategy } from './retryStrategy';
import { BaseError } from './baseError';
import { DecodeBase64ToBinary, DecodeBase64ToString, EncodeArrayBufferToBase64 } from './stringTools';
import { ShaderProcessor } from '../Engines/Processors/shaderProcessor';
import { ThinEngine } from '../Engines/thinEngine';
import { EngineStore } from '../Engines/engineStore';
import { Logger } from './logger';
import { TimingTools } from './timingTools';

const base64DataUrlRegEx = new RegExp(/^data:([^,]+\/[^,]+)?;base64,/i);

/** @ignore */
export class LoadFileError extends BaseError {
    public request?: WebRequest;
    public file?: File;

    /**
     * Creates a new LoadFileError
     * @param message defines the message of the error
     * @param request defines the optional web request
     * @param file defines the optional file
     */
    constructor(message: string, object?: WebRequest | File) {
        super(message);

        this.name = "LoadFileError";
        BaseError._setPrototypeOf(this, LoadFileError.prototype);

        if (object instanceof WebRequest) {
            this.request = object;
        }
        else {
            this.file = object;
        }
    }
}

/** @ignore */
export class RequestFileError extends BaseError {
    /**
     * Creates a new LoadFileError
     * @param message defines the message of the error
     * @param request defines the optional web request
     */
    constructor(message: string, public request: WebRequest) {
        super(message);
        this.name = "RequestFileError";
        BaseError._setPrototypeOf(this, RequestFileError.prototype);
    }
}

/** @ignore */
export class ReadFileError extends BaseError {
    /**
    * Creates a new ReadFileError
     * @param message defines the message of the error
     * @param file defines the optional file
     */
    constructor(message: string, public file: File) {
        super(message);
        this.name = "ReadFileError";
        BaseError._setPrototypeOf(this, ReadFileError.prototype);
    }
}
/**
 * @hidden
 */
export const FileToolsOptions: {
    DefaultRetryStrategy: (url: string, request: WebRequest, retryIndex: number) => number;
    BaseUrl: string;
    CorsBehavior: string | ((url: string | string[]) => string);
    PreprocessUrl: (url: string) => string;
} = {
    /**
     * Gets or sets the retry strategy to apply when an error happens while loading an asset
     */
    DefaultRetryStrategy: RetryStrategy.ExponentialBackoff(),

    /**
     * Gets or sets the base URL to use to load assets
     */
    BaseUrl: "",

    /**
     * Default behaviour for cors in the application.
     * It can be a string if the expected behavior is identical in the entire app.
     * Or a callback to be able to set it per url or on a group of them (in case of Video source for instance)
     */
    CorsBehavior: "anonymous",

    /**
     * Gets or sets a function used to pre-process url before using them to load assets
     */
    PreprocessUrl: (url: string) => {
        return url;
    }
};

/**
 * Removes unwanted characters from an url
 * @param url defines the url to clean
 * @returns the cleaned url
 */
const _CleanUrl = (url: string): string => {
    url = url.replace(/#/mg, "%23");
    return url;
};

/**
 * Sets the cors behavior on a dom element. This will add the required Tools.CorsBehavior to the element.
 * @param url define the url we are trying
 * @param element define the dom element where to configure the cors policy
 * @hidden
 */
export const SetCorsBehavior = (url: string | string[], element: { crossOrigin: string | null }): void => {
    if (url && url.indexOf("data:") === 0) {
        return;
    }

    if (FileToolsOptions.CorsBehavior) {
        if (typeof (FileToolsOptions.CorsBehavior) === 'string' || FileToolsOptions.CorsBehavior instanceof String) {
            element.crossOrigin = <string>FileToolsOptions.CorsBehavior;
        }
        else {
            var result = FileToolsOptions.CorsBehavior(url);
            if (result) {
                element.crossOrigin = result;
            }
        }
    }
};

/**
 * Loads an image as an HTMLImageElement.
 * @param input url string, ArrayBuffer, or Blob to load
 * @param onLoad callback called when the image successfully loads
 * @param onError callback called when the image fails to load
 * @param offlineProvider offline provider for caching
 * @param mimeType optional mime type
 * @returns the HTMLImageElement of the loaded image
 * @hidden
 */
export const LoadImage = (input: string | ArrayBuffer | ArrayBufferView | Blob, onLoad: (img: HTMLImageElement | ImageBitmap) => void,
    onError: (message?: string, exception?: any) => void, offlineProvider: Nullable<IOfflineProvider>, mimeType: string = "", imageBitmapOptions?: ImageBitmapOptions): Nullable<HTMLImageElement> => {
    let url: string;
    let usingObjectURL = false;

    if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
        if (typeof Blob !== 'undefined') {
            url = URL.createObjectURL(new Blob([input], { type: mimeType }));
            usingObjectURL = true;
        } else {
            url = `data:${mimeType};base64,` + EncodeArrayBufferToBase64(input);
        }
    }
    else if (input instanceof Blob) {
        url = URL.createObjectURL(input);
        usingObjectURL = true;
    }
    else {
        url = _CleanUrl(input);
        url = FileToolsOptions.PreprocessUrl(input);
    }

    const engine = EngineStore.LastCreatedEngine;

    const onErrorHandler = (exception: any) => {
        if (onError) {
            const inputText = url || input.toString();
            onError(`Error while trying to load image: ${((inputText.indexOf('http') === 0 || inputText.length <= 128) ? inputText : inputText.slice(0, 128) + "...")}`, exception);
        }
    };

    if (typeof Image === "undefined" || (engine?._features.forceBitmapOverHTMLImageElement ?? false)) {
        LoadFile(url, (data) => {
            engine!.createImageBitmap(new Blob([data], { type: mimeType }), { premultiplyAlpha: "none", ...imageBitmapOptions }).then((imgBmp) => {
                onLoad(imgBmp);
                if (usingObjectURL) {
                    URL.revokeObjectURL(url);
                }
            }).catch((reason) => {
                if (onError) {
                    onError("Error while trying to load image: " + input, reason);
                }
            });
        }, undefined, offlineProvider || undefined, true, (request, exception) => {
            onErrorHandler(exception);
        });

        return null;
    }

    var img = new Image();
    SetCorsBehavior(url, img);

    const loadHandler = () => {
        img.removeEventListener("load", loadHandler);
        img.removeEventListener("error", errorHandler);

        onLoad(img);

        // Must revoke the URL after calling onLoad to avoid security exceptions in
        // certain scenarios (e.g. when hosted in vscode).
        if (usingObjectURL && img.src) {
            URL.revokeObjectURL(img.src);
        }
    };

    const errorHandler = (err: any) => {
        img.removeEventListener("load", loadHandler);
        img.removeEventListener("error", errorHandler);

        onErrorHandler(err);

        if (usingObjectURL && img.src) {
            URL.revokeObjectURL(img.src);
        }
    };

    img.addEventListener("load", loadHandler);
    img.addEventListener("error", errorHandler);

    var noOfflineSupport = () => {
        img.src = url;
    };

    var loadFromOfflineSupport = () => {
        if (offlineProvider) {
            offlineProvider.loadImage(url, img);
        }
    };

    if (url.substr(0, 5) !== "data:" && offlineProvider && offlineProvider.enableTexturesOffline) {
        offlineProvider.open(loadFromOfflineSupport, noOfflineSupport);
    }
    else {
        if (url.indexOf("file:") !== -1) {
            var textureName = decodeURIComponent(url.substring(5).toLowerCase());
            if (FilesInputStore.FilesToLoad[textureName]) {
                try {
                    var blobURL;
                    try {
                        blobURL = URL.createObjectURL(FilesInputStore.FilesToLoad[textureName]);
                    }
                    catch (ex) {
                        // Chrome doesn't support oneTimeOnly parameter
                        blobURL = URL.createObjectURL(FilesInputStore.FilesToLoad[textureName]);
                    }
                    img.src = blobURL;
                    usingObjectURL = true;
                }
                catch (e) {
                    img.src = "";
                }
                return img;
            }
        }

        noOfflineSupport();
    }

    return img;
};

/**
 * Reads a file from a File object
 * @param file defines the file to load
 * @param onSuccess defines the callback to call when data is loaded
 * @param onProgress defines the callback to call during loading process
 * @param useArrayBuffer defines a boolean indicating that data must be returned as an ArrayBuffer
 * @param onError defines the callback to call when an error occurs
 * @returns a file request object
 * @hidden
 */
export const ReadFile = (file: File, onSuccess: (data: any) => void, onProgress?: (ev: ProgressEvent) => any, useArrayBuffer?: boolean, onError?: (error: ReadFileError) => void): IFileRequest => {
    const reader = new FileReader();
    const fileRequest: IFileRequest = {
        onCompleteObservable: new Observable<IFileRequest>(),
        abort: () => reader.abort(),
    };

    reader.onloadend = (e) => fileRequest.onCompleteObservable.notifyObservers(fileRequest);
    if (onError) {
        reader.onerror = (e) => {
            onError(new ReadFileError(`Unable to read ${file.name}`, file));
        };
    }
    reader.onload = (e) => {
        //target doesn't have result from ts 1.3
        onSuccess((<any>e.target)['result']);
    };
    if (onProgress) {
        reader.onprogress = onProgress;
    }
    if (!useArrayBuffer) {
        // Asynchronous read
        reader.readAsText(file);
    }
    else {
        reader.readAsArrayBuffer(file);
    }

    return fileRequest;
};

/**
 * Loads a file from a url, a data url, or a file url
 * @param fileOrUrl file, url, data url, or file url to load
 * @param onSuccess callback called when the file successfully loads
 * @param onProgress callback called while file is loading (if the server supports this mode)
 * @param offlineProvider defines the offline provider for caching
 * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
 * @param onError callback called when the file fails to load
 * @returns a file request object
 * @hidden
 */
export const LoadFile = (fileOrUrl: File | string, onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void,
    onProgress?: (ev: ProgressEvent) => void, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean,
    onError?: (request?: WebRequest, exception?: LoadFileError) => void, onOpened?: (request: WebRequest) => void): IFileRequest => {
    if ((fileOrUrl as File).name) {
        return ReadFile((fileOrUrl as File), onSuccess, onProgress, useArrayBuffer, onError ? (error: ReadFileError) => {
            onError(undefined, error);
        } : undefined);
    }

    const url = (fileOrUrl as string);

    // If file and file input are set
    if (url.indexOf("file:") !== -1) {
        let fileName = decodeURIComponent(url.substring(5).toLowerCase());
        if (fileName.indexOf('./') === 0) {
            fileName = fileName.substring(2);
        }
        const file = FilesInputStore.FilesToLoad[fileName];
        if (file) {
            return ReadFile(file, onSuccess, onProgress, useArrayBuffer, onError ? (error) => onError(undefined, new LoadFileError(error.message, error.file)) : undefined);
        }
    }

    // For a Base64 Data URL
    if (IsBase64DataUrl(url)) {
        const fileRequest: IFileRequest = {
            onCompleteObservable: new Observable<IFileRequest>(),
            abort: () => () => { },
        };

        try {
            onSuccess(useArrayBuffer ? DecodeBase64UrlToBinary(url) : DecodeBase64UrlToString(url));
        } catch (error) {
            if (onError) {
                onError(undefined, error);
            } else {
                Logger.Error(error.message || "Failed to parse the Data URL");
            }
        }

        TimingTools.SetImmediate(() => {
            fileRequest.onCompleteObservable.notifyObservers(fileRequest);
        });

        return fileRequest;
    }

    return RequestFile(url, (data, request) => {
        onSuccess(data, request ? request.responseURL : undefined);
    }, onProgress, offlineProvider, useArrayBuffer, onError ? (error) => {
        onError(error.request, new LoadFileError(error.message, error.request));
    } : undefined, onOpened);
};

/**
 * Loads a file from a url
 * @param url url to load
 * @param onSuccess callback called when the file successfully loads
 * @param onProgress callback called while file is loading (if the server supports this mode)
 * @param offlineProvider defines the offline provider for caching
 * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
 * @param onError callback called when the file fails to load
 * @param onOpened callback called when the web request is opened
 * @returns a file request object
 * @hidden
 */
export const RequestFile = (url: string, onSuccess: (data: string | ArrayBuffer, request?: WebRequest) => void,
    onProgress?: (event: ProgressEvent) => void, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean,
    onError?: (error: RequestFileError) => void, onOpened?: (request: WebRequest) => void): IFileRequest => {
    url = _CleanUrl(url);
    url = FileToolsOptions.PreprocessUrl(url);

    const loadUrl = FileToolsOptions.BaseUrl + url;

    let aborted = false;
    const fileRequest: IFileRequest = {
        onCompleteObservable: new Observable<IFileRequest>(),
        abort: () => aborted = true,
    };

    const requestFile = () => {
        let request = new WebRequest();
        let retryHandle: Nullable<number> = null;

        fileRequest.abort = () => {
            aborted = true;

            if (request.readyState !== (XMLHttpRequest.DONE || 4)) {
                request.abort();
            }

            if (retryHandle !== null) {
                clearTimeout(retryHandle);
                retryHandle = null;
            }
        };

        const handleError = (error: any) => {
            const message = error.message || "Unknown error";
            if (onError) {
                onError(new RequestFileError(message, request));
            } else {
                Logger.Error(message);
            }
        };

        const retryLoop = (retryIndex: number) => {
            request.open('GET', loadUrl);

            if (onOpened) {
                try {
                    onOpened(request);
                } catch (e) {
                    handleError(e);
                    return;
                }
            }

            if (useArrayBuffer) {
                request.responseType = "arraybuffer";
            }

            if (onProgress) {
                request.addEventListener("progress", onProgress);
            }

            const onLoadEnd = () => {
                request.removeEventListener("loadend", onLoadEnd);
                fileRequest.onCompleteObservable.notifyObservers(fileRequest);
                fileRequest.onCompleteObservable.clear();
            };

            request.addEventListener("loadend", onLoadEnd);

            const onReadyStateChange = () => {
                if (aborted) {
                    return;
                }

                // In case of undefined state in some browsers.
                if (request.readyState === (XMLHttpRequest.DONE || 4)) {
                    // Some browsers have issues where onreadystatechange can be called multiple times with the same value.
                    request.removeEventListener("readystatechange", onReadyStateChange);

                    if ((request.status >= 200 && request.status < 300) || (request.status === 0 && (!IsWindowObjectExist() || IsFileURL()))) {
                        try {
                            onSuccess(useArrayBuffer ? request.response : request.responseText, request);
                        } catch (e) {
                            handleError(e);
                        }
                        return;
                    }

                    let retryStrategy = FileToolsOptions.DefaultRetryStrategy;
                    if (retryStrategy) {
                        let waitTime = retryStrategy(loadUrl, request, retryIndex);
                        if (waitTime !== -1) {
                            // Prevent the request from completing for retry.
                            request.removeEventListener("loadend", onLoadEnd);
                            request = new WebRequest();
                            retryHandle = setTimeout(() => retryLoop(retryIndex + 1), waitTime);
                            return;
                        }
                    }

                    const error = new RequestFileError("Error status: " + request.status + " " + request.statusText + " - Unable to load " + loadUrl, request);
                    if (onError) {
                        onError(error);
                    }
                }
            };

            request.addEventListener("readystatechange", onReadyStateChange);

            request.send();
        };

        retryLoop(0);
    };

    // Caching all files
    if (offlineProvider && offlineProvider.enableSceneOffline) {
        const noOfflineSupport = (request?: any) => {
            if (request && request.status > 400) {
                if (onError) {
                    onError(request);
                }
            } else {
                requestFile();
            }
        };

        const loadFromOfflineSupport = () => {
            // TODO: database needs to support aborting and should return a IFileRequest

            if (offlineProvider) {
                offlineProvider.loadFile(FileToolsOptions.BaseUrl + url, (data) => {
                    if (!aborted) {
                        onSuccess(data);
                    }

                    fileRequest.onCompleteObservable.notifyObservers(fileRequest);
                }, onProgress ? (event) => {
                    if (!aborted) {
                        onProgress(event);
                    }
                } : undefined, noOfflineSupport, useArrayBuffer);
            }
        };

        offlineProvider.open(loadFromOfflineSupport, noOfflineSupport);
    }
    else {
        requestFile();
    }

    return fileRequest;
};

/**
 * Checks if the loaded document was accessed via `file:`-Protocol.
 * @returns boolean
 * @hidden
 */
export const IsFileURL = (): boolean => {
    return typeof location !== "undefined" && location.protocol === "file:";
};

/**
 * Test if the given uri is a valid base64 data url
 * @param uri The uri to test
 * @return True if the uri is a base64 data url or false otherwise
 * @hidden
 */
export const IsBase64DataUrl = (uri: string): boolean => {
    return base64DataUrlRegEx.test(uri);
};

/**
 * Decode the given base64 uri.
 * @param uri The uri to decode
 * @return The decoded base64 data.
 * @hidden
 */
export function DecodeBase64UrlToBinary(uri: string): ArrayBuffer {
    return DecodeBase64ToBinary(uri.split(",")[1]);
}

/**
 * Decode the given base64 uri into a UTF-8 encoded string.
 * @param uri The uri to decode
 * @return The decoded base64 data.
 * @hidden
 */
export const DecodeBase64UrlToString = (uri: string): string => {
    return DecodeBase64ToString(uri.split(",")[1]);
};

/**
 * This will be executed automatically for UMD and es5.
 * If esm dev wants the side effects to execute they will have to run it manually
 * Once we build native modules those need to be exported.
 * @hidden
 */
const initSideEffects = () => {
    ThinEngine._FileToolsLoadImage = LoadImage;
    ThinEngine._FileToolsLoadFile = LoadFile;
    ShaderProcessor._FileToolsLoadFile = LoadFile;
};

initSideEffects();

// LTS. Export FileTools in this module for backward compatibility.
import { _injectLTSFileTools } from './fileTools.lts';
_injectLTSFileTools(DecodeBase64UrlToBinary, DecodeBase64UrlToString, FileToolsOptions, IsBase64DataUrl, IsFileURL, LoadFile, LoadImage, ReadFile, RequestFile, SetCorsBehavior);
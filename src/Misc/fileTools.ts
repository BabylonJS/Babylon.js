import { WebRequest } from './webRequest';
import { DomManagement } from './domManagement';
import { Nullable } from '../types';
import { IOfflineProvider } from '../Offline/IOfflineProvider';
import { IFileRequest } from './fileRequest';
import { Observable } from './observable';
import { FilesInputStore } from './filesInputStore';
import { RetryStrategy } from './retryStrategy';
import { BaseError } from './baseError';
import { StringTools } from './stringTools';
import { ThinEngine } from '../Engines/thinEngine';
import { ShaderProcessor } from '../Engines/Processors/shaderProcessor';

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
export class FileTools {
    /**
     * Gets or sets the retry strategy to apply when an error happens while loading an asset
     */
    public static DefaultRetryStrategy = RetryStrategy.ExponentialBackoff();

    /**
     * Gets or sets the base URL to use to load assets
     */
    public static BaseUrl = "";

    /**
     * Default behaviour for cors in the application.
     * It can be a string if the expected behavior is identical in the entire app.
     * Or a callback to be able to set it per url or on a group of them (in case of Video source for instance)
     */
    public static CorsBehavior: string | ((url: string | string[]) => string) = "anonymous";

    /**
     * Gets or sets a function used to pre-process url before using them to load assets
     */
    public static PreprocessUrl = (url: string) => {
        return url;
    }

    /**
     * Removes unwanted characters from an url
     * @param url defines the url to clean
     * @returns the cleaned url
     */
    private static _CleanUrl(url: string): string {
        url = url.replace(/#/mg, "%23");
        return url;
    }

    /**
     * Sets the cors behavior on a dom element. This will add the required Tools.CorsBehavior to the element.
     * @param url define the url we are trying
     * @param element define the dom element where to configure the cors policy
     */
    public static SetCorsBehavior(url: string | string[], element: { crossOrigin: string | null }): void {
        if (url && url.indexOf("data:") === 0) {
            return;
        }

        if (FileTools.CorsBehavior) {
            if (typeof (FileTools.CorsBehavior) === 'string' || this.CorsBehavior instanceof String) {
                element.crossOrigin = <string>FileTools.CorsBehavior;
            }
            else {
                var result = FileTools.CorsBehavior(url);
                if (result) {
                    element.crossOrigin = result;
                }
            }
        }
    }

    /**
     * Loads an image as an HTMLImageElement.
     * @param input url string, ArrayBuffer, or Blob to load
     * @param onLoad callback called when the image successfully loads
     * @param onError callback called when the image fails to load
     * @param offlineProvider offline provider for caching
     * @param mimeType optional mime type
     * @returns the HTMLImageElement of the loaded image
     */
    public static LoadImage(input: string | ArrayBuffer | ArrayBufferView | Blob, onLoad: (img: HTMLImageElement | ImageBitmap) => void, onError: (message?: string, exception?: any) => void, offlineProvider: Nullable<IOfflineProvider>, mimeType: string = ""): Nullable<HTMLImageElement> {
        let url: string;
        let usingObjectURL = false;

        if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
            if (typeof Blob !== 'undefined') {
                url = URL.createObjectURL(new Blob([input], { type: mimeType }));
                usingObjectURL = true;
            } else {
                url = `data:${mimeType};base64,` + StringTools.EncodeArrayBufferToBase64(input);
            }
        }
        else if (input instanceof Blob) {
            url = URL.createObjectURL(input);
            usingObjectURL = true;
        }
        else {
            url = FileTools._CleanUrl(input);
            url = FileTools.PreprocessUrl(input);
        }

        if (typeof Image === "undefined") {
            FileTools.LoadFile(url, (data) => {
                createImageBitmap(new Blob([data], { type: mimeType })).then((imgBmp) => {
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
                if (onError) {
                    onError("Error while trying to load image: " + input, exception);
                }
            });

            return null;
        }

        var img = new Image();
        FileTools.SetCorsBehavior(url, img);

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

            if (onError) {
                onError("Error while trying to load image: " + input, err);
            }

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
    }

    /**
     * Reads a file from a File object
     * @param file defines the file to load
     * @param onSuccess defines the callback to call when data is loaded
     * @param onProgress defines the callback to call during loading process
     * @param useArrayBuffer defines a boolean indicating that data must be returned as an ArrayBuffer
     * @param onError defines the callback to call when an error occurs
     * @returns a file request object
     */
    public static ReadFile(file: File, onSuccess: (data: any) => void, onProgress?: (ev: ProgressEvent) => any, useArrayBuffer?: boolean, onError?: (error: ReadFileError) => void): IFileRequest {
        let reader = new FileReader();
        let request: IFileRequest = {
            onCompleteObservable: new Observable<IFileRequest>(),
            abort: () => reader.abort(),
        };

        reader.onloadend = (e) => request.onCompleteObservable.notifyObservers(request);
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

        return request;
    }

    /**
     * Loads a file from a url
     * @param url url to load
     * @param onSuccess callback called when the file successfully loads
     * @param onProgress callback called while file is loading (if the server supports this mode)
     * @param offlineProvider defines the offline provider for caching
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @param onError callback called when the file fails to load
     * @returns a file request object
     */
    public static LoadFile(url: string, onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void, onProgress?: (ev: ProgressEvent) => void, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean, onError?: (request?: WebRequest, exception?: LoadFileError) => void): IFileRequest {
        // If file and file input are set
        if (url.indexOf("file:") !== -1) {
            let fileName = decodeURIComponent(url.substring(5).toLowerCase());
            if (fileName.indexOf('./') === 0) {
                fileName = fileName.substring(2);
            }
            const file = FilesInputStore.FilesToLoad[fileName];
            if (file) {
                return FileTools.ReadFile(file, onSuccess, onProgress, useArrayBuffer, onError ? (error) => onError(undefined, new LoadFileError(error.message, error.file)) : undefined);
            }
        }

        return FileTools.RequestFile(url, (data, request) => {
            onSuccess(data, request ? request.responseURL : undefined);
        }, onProgress, offlineProvider, useArrayBuffer, onError ? (error) => {
            onError(error.request, new LoadFileError(error.message, error.request));
        } : undefined);
    }

    /**
     * Loads a file
     * @param url url to load
     * @param onSuccess callback called when the file successfully loads
     * @param onProgress callback called while file is loading (if the server supports this mode)
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @param onError callback called when the file fails to load
     * @param onOpened callback called when the web request is opened
     * @returns a file request object
     */
    public static RequestFile(url: string, onSuccess: (data: string | ArrayBuffer, request?: WebRequest) => void, onProgress?: (event: ProgressEvent) => void, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean, onError?: (error: RequestFileError) => void, onOpened?: (request: WebRequest) => void): IFileRequest {
        url = FileTools._CleanUrl(url);
        url = FileTools.PreprocessUrl(url);

        const loadUrl = FileTools.BaseUrl + url;

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

            const retryLoop = (retryIndex: number) => {
                request.open('GET', loadUrl);

                if (onOpened) {
                    onOpened(request);
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

                        if ((request.status >= 200 && request.status < 300) || (request.status === 0 && (!DomManagement.IsWindowObjectExist() || FileTools.IsFileURL()))) {
                            onSuccess(useArrayBuffer ? request.response : request.responseText, request);
                            return;
                        }

                        let retryStrategy = FileTools.DefaultRetryStrategy;
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
                    offlineProvider.loadFile(FileTools.BaseUrl + url, (data) => {
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
    }

    /**
     * Checks if the loaded document was accessed via `file:`-Protocol.
     * @returns boolean
     */
    public static IsFileURL(): boolean {
        return location.protocol === "file:";
    }
}

ThinEngine._FileToolsLoadImage = FileTools.LoadImage.bind(FileTools);
ThinEngine._FileToolsLoadFile = FileTools.LoadFile.bind(FileTools);
ShaderProcessor._FileToolsLoadFile = FileTools.LoadFile.bind(FileTools);
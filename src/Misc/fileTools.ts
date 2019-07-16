import { WebRequest } from './webRequest';
import { LoadFileError } from './loadFileError';
import { DomManagement } from './domManagement';
import { Nullable } from '../types';
import { IOfflineProvider } from '../Offline/IOfflineProvider';
import { IFileRequest } from './fileRequest';
import { Observable } from './observable';
import { FilesInputStore } from './filesInputStore';
import { RetryStrategy } from './retryStrategy';

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

        if (this.CorsBehavior) {
            if (typeof (this.CorsBehavior) === 'string' || this.CorsBehavior instanceof String) {
                element.crossOrigin = <string>this.CorsBehavior;
            }
            else {
                var result = this.CorsBehavior(url);
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
     * @returns the HTMLImageElement of the loaded image
     */
    public static LoadImage(input: string | ArrayBuffer | Blob, onLoad: (img: HTMLImageElement) => void, onError: (message?: string, exception?: any) => void, offlineProvider: Nullable<IOfflineProvider>): HTMLImageElement {
        let url: string;
        let usingObjectURL = false;

        if (input instanceof ArrayBuffer) {
            url = URL.createObjectURL(new Blob([input]));
            usingObjectURL = true;
        }
        else if (input instanceof Blob) {
            url = URL.createObjectURL(input);
            usingObjectURL = true;
        }
        else {
            url = this._CleanUrl(input);
            url = this.PreprocessUrl(input);
        }

        var img = new Image();
        this.SetCorsBehavior(url, img);

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
     * Loads a file
     * @param fileToLoad defines the file to load
     * @param callback defines the callback to call when data is loaded
     * @param progressCallBack defines the callback to call during loading process
     * @param useArrayBuffer defines a boolean indicating that data must be returned as an ArrayBuffer
     * @returns a file request object
     */
    public static ReadFile(fileToLoad: File, callback: (data: any) => void, progressCallBack?: (ev: ProgressEvent) => any, useArrayBuffer?: boolean): IFileRequest {
        let reader = new FileReader();
        let request: IFileRequest = {
            onCompleteObservable: new Observable<IFileRequest>(),
            abort: () => reader.abort(),
        };

        reader.onloadend = (e) => request.onCompleteObservable.notifyObservers(request);
        reader.onerror = (e) => {
            callback(JSON.stringify({ autoClear: true, clearColor: [1, 0, 0], ambientColor: [0, 0, 0], gravity: [0, -9.807, 0], meshes: [], cameras: [], lights: [] }));
        };
        reader.onload = (e) => {
            //target doesn't have result from ts 1.3
            callback((<any>e.target)['result']);
        };
        if (progressCallBack) {
            reader.onprogress = progressCallBack;
        }
        if (!useArrayBuffer) {
            // Asynchronous read
            reader.readAsText(fileToLoad);
        }
        else {
            reader.readAsArrayBuffer(fileToLoad);
        }

        return request;
    }

    /**
     * Loads a file
     * @param url url string, ArrayBuffer, or Blob to load
     * @param onSuccess callback called when the file successfully loads
     * @param onProgress callback called while file is loading (if the server supports this mode)
     * @param offlineProvider defines the offline provider for caching
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @param onError callback called when the file fails to load
     * @returns a file request object
     */
    public static LoadFile(url: string, onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void, onProgress?: (data: any) => void, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean, onError?: (request?: WebRequest, exception?: any) => void): IFileRequest {
        url = this._CleanUrl(url);

        url = this.PreprocessUrl(url);

        // If file and file input are set
        if (url.indexOf("file:") !== -1) {
            const fileName = decodeURIComponent(url.substring(5).toLowerCase());
            if (FilesInputStore.FilesToLoad[fileName]) {
                return this.ReadFile(FilesInputStore.FilesToLoad[fileName], onSuccess, onProgress, useArrayBuffer);
            }
        }

        const loadUrl = this.BaseUrl + url;

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

                        if ((request.status >= 200 && request.status < 300) || (request.status === 0 && (!DomManagement.IsWindowObjectExist() || this.IsFileURL()))) {
                            onSuccess(!useArrayBuffer ? request.responseText : <ArrayBuffer>request.response, request.responseURL);
                            return;
                        }

                        let retryStrategy = this.DefaultRetryStrategy;
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

                        let e = new LoadFileError("Error status: " + request.status + " " + request.statusText + " - Unable to load " + loadUrl, request);
                        if (onError) {
                            onError(request, e);
                        } else {
                            throw e;
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
                    if (!aborted) {
                        requestFile();
                    }
                }
            };

            const loadFromOfflineSupport = () => {
                // TODO: database needs to support aborting and should return a IFileRequest
                if (aborted) {
                    return;
                }

                if (offlineProvider) {
                    offlineProvider.loadFile(url, (data) => {
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
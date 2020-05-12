import { Nullable, float } from "../types";
import { Observable } from "./observable";
import { DomManagement } from "./domManagement";
import { Logger } from "./logger";
import { _TypeStore } from "./typeStore";
import { DeepCopier } from "./deepCopier";
import { PrecisionDate } from './precisionDate';
import { _DevTools } from './devTools';
import { WebRequest } from './webRequest';
import { IFileRequest } from './fileRequest';
import { EngineStore } from '../Engines/engineStore';
import { FileTools, ReadFileError } from './fileTools';
import { IOfflineProvider } from '../Offline/IOfflineProvider';
import { PromisePolyfill } from './promise';
import { TimingTools } from './timingTools';
import { InstantiationTools } from './instantiationTools';
import { GUID } from './guid';
import { IScreenshotSize } from './interfaces/screenshotSize';

declare type Camera = import("../Cameras/camera").Camera;
declare type Engine = import("../Engines/engine").Engine;

interface IColor4Like {
    r: float;
    g: float;
    b: float;
    a: float;
}

/**
 * Class containing a set of static utilities functions
 */
export class Tools {
    /**
     * Gets or sets the base URL to use to load assets
     */
    public static get BaseUrl() {
        return FileTools.BaseUrl;
    }

    public static set BaseUrl(value: string) {
        FileTools.BaseUrl = value;
    }

    /**
     * Enable/Disable Custom HTTP Request Headers globally.
     * default = false
     * @see CustomRequestHeaders
     */
    public static UseCustomRequestHeaders: boolean = false;

    /**
     * Custom HTTP Request Headers to be sent with XMLHttpRequests
     * i.e. when loading files, where the server/service expects an Authorization header
     */
    public static CustomRequestHeaders = WebRequest.CustomRequestHeaders;

    /**
     * Gets or sets the retry strategy to apply when an error happens while loading an asset
     */
    public static get DefaultRetryStrategy() {
        return FileTools.DefaultRetryStrategy;
    }

    public static set DefaultRetryStrategy(strategy: (url: string, request: WebRequest, retryIndex: number) => number) {
        FileTools.DefaultRetryStrategy = strategy;
    }

    /**
     * Default behaviour for cors in the application.
     * It can be a string if the expected behavior is identical in the entire app.
     * Or a callback to be able to set it per url or on a group of them (in case of Video source for instance)
     */
    public static get CorsBehavior(): string | ((url: string | string[]) => string) {
        return FileTools.CorsBehavior;
    }

    public static set CorsBehavior(value: string | ((url: string | string[]) => string)) {
        FileTools.CorsBehavior = value;
    }

    /**
     * Gets or sets a global variable indicating if fallback texture must be used when a texture cannot be loaded
     * @ignorenaming
     */
    public static get UseFallbackTexture() {
        return EngineStore.UseFallbackTexture;
    }

    public static set UseFallbackTexture(value: boolean) {
        EngineStore.UseFallbackTexture = value;
    }

    /**
     * Use this object to register external classes like custom textures or material
     * to allow the laoders to instantiate them
     */
    public static get RegisteredExternalClasses() {
        return InstantiationTools.RegisteredExternalClasses;
    }

    public static set RegisteredExternalClasses(classes: { [key: string]: Object }) {
        InstantiationTools.RegisteredExternalClasses = classes;
    }

    /**
     * Texture content used if a texture cannot loaded
     * @ignorenaming
     */
    public static get fallbackTexture() {
        return EngineStore.FallbackTexture;
    }

    public static set fallbackTexture(value: string) {
        EngineStore.FallbackTexture = value;
    }

    /**
     * Read the content of a byte array at a specified coordinates (taking in account wrapping)
     * @param u defines the coordinate on X axis
     * @param v defines the coordinate on Y axis
     * @param width defines the width of the source data
     * @param height defines the height of the source data
     * @param pixels defines the source byte array
     * @param color defines the output color
     */
    public static FetchToRef(u: number, v: number, width: number, height: number, pixels: Uint8Array, color: IColor4Like): void {
        let wrappedU = ((Math.abs(u) * width) % width) | 0;
        let wrappedV = ((Math.abs(v) * height) % height) | 0;

        let position = (wrappedU + wrappedV * width) * 4;
        color.r = pixels[position] / 255;
        color.g = pixels[position + 1] / 255;
        color.b = pixels[position + 2] / 255;
        color.a = pixels[position + 3] / 255;
    }

    /**
     * Interpolates between a and b via alpha
     * @param a The lower value (returned when alpha = 0)
     * @param b The upper value (returned when alpha = 1)
     * @param alpha The interpolation-factor
     * @return The mixed value
     */
    public static Mix(a: number, b: number, alpha: number): number {
        return a * (1 - alpha) + b * alpha;
    }

    /**
     * Tries to instantiate a new object from a given class name
     * @param className defines the class name to instantiate
     * @returns the new object or null if the system was not able to do the instantiation
     */
    public static Instantiate(className: string): any {
        return InstantiationTools.Instantiate(className);
    }

    /**
     * Provides a slice function that will work even on IE
     * @param data defines the array to slice
     * @param start defines the start of the data (optional)
     * @param end defines the end of the data (optional)
     * @returns the new sliced array
     */
    public static Slice<T>(data: T, start?: number, end?: number): T {
        if ((data as any).slice) {
            return (data as any).slice(start, end);
        }

        return Array.prototype.slice.call(data, start, end);
    }

    /**
     * Polyfill for setImmediate
     * @param action defines the action to execute after the current execution block
     */
    public static SetImmediate(action: () => void) {
        TimingTools.SetImmediate(action);
    }

    /**
     * Function indicating if a number is an exponent of 2
     * @param value defines the value to test
     * @returns true if the value is an exponent of 2
     */
    public static IsExponentOfTwo(value: number): boolean {
        var count = 1;

        do {
            count *= 2;
        } while (count < value);

        return count === value;
    }

    private static _tmpFloatArray = new Float32Array(1);

    /**
     * Returns the nearest 32-bit single precision float representation of a Number
     * @param value A Number.  If the parameter is of a different type, it will get converted
     * to a number or to NaN if it cannot be converted
     * @returns number
     */
    public static FloatRound(value: number): number {
        if (Math.fround) {
            return Math.fround(value);
        }

        return (Tools._tmpFloatArray[0] = value);
    }

    /**
     * Extracts the filename from a path
     * @param path defines the path to use
     * @returns the filename
     */
    public static GetFilename(path: string): string {
        var index = path.lastIndexOf("/");
        if (index < 0) {
            return path;
        }

        return path.substring(index + 1);
    }

    /**
     * Extracts the "folder" part of a path (everything before the filename).
     * @param uri The URI to extract the info from
     * @param returnUnchangedIfNoSlash Do not touch the URI if no slashes are present
     * @returns The "folder" part of the path
     */
    public static GetFolderPath(uri: string, returnUnchangedIfNoSlash = false): string {
        var index = uri.lastIndexOf("/");
        if (index < 0) {
            if (returnUnchangedIfNoSlash) {
                return uri;
            }
            return "";
        }

        return uri.substring(0, index + 1);
    }

    /**
     * Extracts text content from a DOM element hierarchy
     * Back Compat only, please use DomManagement.GetDOMTextContent instead.
     */
    public static GetDOMTextContent = DomManagement.GetDOMTextContent;

    /**
     * Convert an angle in radians to degrees
     * @param angle defines the angle to convert
     * @returns the angle in degrees
     */
    public static ToDegrees(angle: number): number {
        return angle * 180 / Math.PI;
    }

    /**
     * Convert an angle in degrees to radians
     * @param angle defines the angle to convert
     * @returns the angle in radians
     */
    public static ToRadians(angle: number): number {
        return angle * Math.PI / 180;
    }

    /**
     * Returns an array if obj is not an array
     * @param obj defines the object to evaluate as an array
     * @param allowsNullUndefined defines a boolean indicating if obj is allowed to be null or undefined
     * @returns either obj directly if obj is an array or a new array containing obj
     */
    public static MakeArray(obj: any, allowsNullUndefined?: boolean): Nullable<Array<any>> {
        if (allowsNullUndefined !== true && (obj === undefined || obj == null)) {
            return null;
        }

        return Array.isArray(obj) ? obj : [obj];
    }

    /**
     * Gets the pointer prefix to use
     * @param engine defines the engine we are finding the prefix for
     * @returns "pointer" if touch is enabled. Else returns "mouse"
     */
    public static GetPointerPrefix(engine: Engine): string {
        var eventPrefix = "pointer";

        // Check if pointer events are supported
        if (DomManagement.IsWindowObjectExist() && !window.PointerEvent && DomManagement.IsNavigatorAvailable() && !navigator.pointerEnabled) {
            eventPrefix = "mouse";
        }

        // Special Fallback...
        if (engine._badDesktopOS) {
            eventPrefix = "mouse";
        }

        return eventPrefix;
    }

    /**
     * Sets the cors behavior on a dom element. This will add the required Tools.CorsBehavior to the element.
     * @param url define the url we are trying
     * @param element define the dom element where to configure the cors policy
     */
    public static SetCorsBehavior(url: string | string[], element: { crossOrigin: string | null }): void {
        FileTools.SetCorsBehavior(url, element);
    }

    // External files

    /**
     * Removes unwanted characters from an url
     * @param url defines the url to clean
     * @returns the cleaned url
     */
    public static CleanUrl(url: string): string {
        url = url.replace(/#/mg, "%23");
        return url;
    }

    /**
     * Gets or sets a function used to pre-process url before using them to load assets
     */
    public static get PreprocessUrl() {
        return FileTools.PreprocessUrl;
    }

    public static set PreprocessUrl(processor: (url: string) => string) {
        FileTools.PreprocessUrl = processor;
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
    public static LoadImage(input: string | ArrayBuffer | Blob, onLoad: (img: HTMLImageElement | ImageBitmap) => void, onError: (message?: string, exception?: any) => void, offlineProvider: Nullable<IOfflineProvider>, mimeType?: string): Nullable<HTMLImageElement> {
        return FileTools.LoadImage(input, onLoad, onError, offlineProvider, mimeType);
    }

    /**
     * Loads a file from a url
     * @param url url string, ArrayBuffer, or Blob to load
     * @param onSuccess callback called when the file successfully loads
     * @param onProgress callback called while file is loading (if the server supports this mode)
     * @param offlineProvider defines the offline provider for caching
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @param onError callback called when the file fails to load
     * @returns a file request object
     */
    public static LoadFile(url: string, onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void, onProgress?: (data: any) => void, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean, onError?: (request?: WebRequest, exception?: any) => void): IFileRequest {
        return FileTools.LoadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError);
    }

    /**
     * Loads a file from a url
     * @param url the file url to load
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @returns a promise containing an ArrayBuffer corresponding to the loaded file
     */
    public static LoadFileAsync(url: string, useArrayBuffer: boolean = true): Promise<ArrayBuffer | string> {
        return new Promise((resolve, reject) => {
            FileTools.LoadFile(url, (data) => {
                resolve(data);
            }, undefined, undefined, useArrayBuffer, (request, exception) => {
                reject(exception);
            });
        });
    }

    /**
     * Load a script (identified by an url). When the url returns, the
     * content of this file is added into a new script element, attached to the DOM (body element)
     * @param scriptUrl defines the url of the script to laod
     * @param onSuccess defines the callback called when the script is loaded
     * @param onError defines the callback to call if an error occurs
     * @param scriptId defines the id of the script element
     */
    public static LoadScript(scriptUrl: string, onSuccess: () => void, onError?: (message?: string, exception?: any) => void, scriptId?: string) {
        if (!DomManagement.IsWindowObjectExist()) {
            return;
        }
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', scriptUrl);
        if (scriptId) {
            script.id = scriptId;
        }

        script.onload = () => {
            if (onSuccess) {
                onSuccess();
            }
        };

        script.onerror = (e) => {
            if (onError) {
                onError(`Unable to load script '${scriptUrl}'`, e);
            }
        };

        head.appendChild(script);
    }

    /**
     * Load an asynchronous script (identified by an url). When the url returns, the
     * content of this file is added into a new script element, attached to the DOM (body element)
     * @param scriptUrl defines the url of the script to laod
     * @param scriptId defines the id of the script element
     * @returns a promise request object
     */
    public static LoadScriptAsync(scriptUrl: string, scriptId?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.LoadScript(scriptUrl, () => {
                resolve();
            }, (message, exception) => {
                reject(exception);
            });
        });
    }

    /**
     * Loads a file from a blob
     * @param fileToLoad defines the blob to use
     * @param callback defines the callback to call when data is loaded
     * @param progressCallback defines the callback to call during loading process
     * @returns a file request object
     */
    public static ReadFileAsDataURL(fileToLoad: Blob, callback: (data: any) => void, progressCallback: (ev: ProgressEvent) => any): IFileRequest {
        let reader = new FileReader();

        let request: IFileRequest = {
            onCompleteObservable: new Observable<IFileRequest>(),
            abort: () => reader.abort(),
        };

        reader.onloadend = (e) => {
            request.onCompleteObservable.notifyObservers(request);
        };

        reader.onload = (e) => {
            //target doesn't have result from ts 1.3
            callback((<any>e.target)['result']);
        };

        reader.onprogress = progressCallback;

        reader.readAsDataURL(fileToLoad);

        return request;
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
        return FileTools.ReadFile(file, onSuccess, onProgress, useArrayBuffer, onError);
    }

    /**
     * Creates a data url from a given string content
     * @param content defines the content to convert
     * @returns the new data url link
     */
    public static FileAsURL(content: string): string {
        var fileBlob = new Blob([content]);
        var url = window.URL || window.webkitURL;
        var link: string = url.createObjectURL(fileBlob);
        return link;
    }

    /**
     * Format the given number to a specific decimal format
     * @param value defines the number to format
     * @param decimals defines the number of decimals to use
     * @returns the formatted string
     */
    public static Format(value: number, decimals: number = 2): string {
        return value.toFixed(decimals);
    }

    /**
     * Tries to copy an object by duplicating every property
     * @param source defines the source object
     * @param destination defines the target object
     * @param doNotCopyList defines a list of properties to avoid
     * @param mustCopyList defines a list of properties to copy (even if they start with _)
     */
    public static DeepCopy(source: any, destination: any, doNotCopyList?: string[], mustCopyList?: string[]): void {
        DeepCopier.DeepCopy(source, destination, doNotCopyList, mustCopyList);
    }

    /**
     * Gets a boolean indicating if the given object has no own property
     * @param obj defines the object to test
     * @returns true if object has no own property
     */
    public static IsEmpty(obj: any): boolean {
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Function used to register events at window level
     * @param windowElement defines the Window object to use
     * @param events defines the events to register
     */
    public static RegisterTopRootEvents(windowElement: Window, events: { name: string; handler: Nullable<(e: FocusEvent) => any> }[]): void {
        for (var index = 0; index < events.length; index++) {
            var event = events[index];
            windowElement.addEventListener(event.name, <any>event.handler, false);

            try {
                if (window.parent) {
                    window.parent.addEventListener(event.name, <any>event.handler, false);
                }
            } catch (e) {
                // Silently fails...
            }
        }
    }

    /**
     * Function used to unregister events from window level
     * @param windowElement defines the Window object to use
     * @param events defines the events to unregister
     */
    public static UnregisterTopRootEvents(windowElement: Window, events: { name: string; handler: Nullable<(e: FocusEvent) => any> }[]): void {
        for (var index = 0; index < events.length; index++) {
            var event = events[index];
            windowElement.removeEventListener(event.name, <any>event.handler);

            try {
                if (windowElement.parent) {
                    windowElement.parent.removeEventListener(event.name, <any>event.handler);
                }
            } catch (e) {
                // Silently fails...
            }
        }
    }

    /**
     * @ignore
     */
    public static _ScreenshotCanvas: HTMLCanvasElement;

    /**
     * Dumps the current bound framebuffer
     * @param width defines the rendering width
     * @param height defines the rendering height
     * @param engine defines the hosting engine
     * @param successCallback defines the callback triggered once the data are available
     * @param mimeType defines the mime type of the result
     * @param fileName defines the filename to download. If present, the result will automatically be downloaded
     */
    public static DumpFramebuffer(width: number, height: number, engine: Engine, successCallback?: (data: string) => void, mimeType: string = "image/png", fileName?: string): void {
        // Read the contents of the framebuffer
        var numberOfChannelsByLine = width * 4;
        var halfHeight = height / 2;

        //Reading datas from WebGL
        var data = engine.readPixels(0, 0, width, height);

        //To flip image on Y axis.
        for (var i = 0; i < halfHeight; i++) {
            for (var j = 0; j < numberOfChannelsByLine; j++) {
                var currentCell = j + i * numberOfChannelsByLine;
                var targetLine = height - i - 1;
                var targetCell = j + targetLine * numberOfChannelsByLine;

                var temp = data[currentCell];
                data[currentCell] = data[targetCell];
                data[targetCell] = temp;
            }
        }

        // Create a 2D canvas to store the result
        if (!Tools._ScreenshotCanvas) {
            Tools._ScreenshotCanvas = document.createElement('canvas');
        }
        Tools._ScreenshotCanvas.width = width;
        Tools._ScreenshotCanvas.height = height;
        var context = Tools._ScreenshotCanvas.getContext('2d');

        if (context) {
            // Copy the pixels to a 2D canvas
            var imageData = context.createImageData(width, height);
            var castData = <any>(imageData.data);
            castData.set(data);
            context.putImageData(imageData, 0, 0);

            Tools.EncodeScreenshotCanvasData(successCallback, mimeType, fileName);
        }
    }

    /**
     * Converts the canvas data to blob.
     * This acts as a polyfill for browsers not supporting the to blob function.
     * @param canvas Defines the canvas to extract the data from
     * @param successCallback Defines the callback triggered once the data are available
     * @param mimeType Defines the mime type of the result
     */
    static ToBlob(canvas: HTMLCanvasElement, successCallback: (blob: Nullable<Blob>) => void, mimeType: string = "image/png"): void {
        // We need HTMLCanvasElement.toBlob for HD screenshots
        if (!canvas.toBlob) {
            //  low performance polyfill based on toDataURL (https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
            canvas.toBlob = function(callback, type, quality) {
                setTimeout(() => {
                    var binStr = atob(this.toDataURL(type, quality).split(',')[1]),
                        len = binStr.length,
                        arr = new Uint8Array(len);

                    for (var i = 0; i < len; i++) {
                        arr[i] = binStr.charCodeAt(i);
                    }
                    callback(new Blob([arr]));
                });
            };
        }
        canvas.toBlob(function(blob) {
            successCallback(blob);
        }, mimeType);
    }

    /**
     * Encodes the canvas data to base 64 or automatically download the result if filename is defined
     * @param successCallback defines the callback triggered once the data are available
     * @param mimeType defines the mime type of the result
     * @param fileName defines he filename to download. If present, the result will automatically be downloaded
     */
    static EncodeScreenshotCanvasData(successCallback?: (data: string) => void, mimeType: string = "image/png", fileName?: string): void {
        if (successCallback) {
            var base64Image = Tools._ScreenshotCanvas.toDataURL(mimeType);
            successCallback(base64Image);
        }
        else {
            this.ToBlob(Tools._ScreenshotCanvas, function(blob) {
                //Creating a link if the browser have the download attribute on the a tag, to automatically start download generated image.
                if (("download" in document.createElement("a"))) {
                    if (!fileName) {
                        var date = new Date();
                        var stringDate = (date.getFullYear() + "-" + (date.getMonth() + 1)).slice(2) + "-" + date.getDate() + "_" + date.getHours() + "-" + ('0' + date.getMinutes()).slice(-2);
                        fileName = "screenshot_" + stringDate + ".png";
                    }
                    Tools.Download(blob!, fileName);
                }
                else {
                    var url = URL.createObjectURL(blob);

                    var newWindow = window.open("");
                    if (!newWindow) { return; }
                    var img = newWindow.document.createElement("img");
                    img.onload = function() {
                        // no longer need to read the blob so it's revoked
                        URL.revokeObjectURL(url);
                    };
                    img.src = url;
                    newWindow.document.body.appendChild(img);
                }
            }, mimeType);
        }
    }

    /**
     * Downloads a blob in the browser
     * @param blob defines the blob to download
     * @param fileName defines the name of the downloaded file
     */
    public static Download(blob: Blob, fileName: string): void {
        if (navigator && navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, fileName);
            return;
        }

        var url = window.URL.createObjectURL(blob);
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = fileName;
        a.addEventListener("click", () => {
            if (a.parentElement) {
                a.parentElement.removeChild(a);
            }
        });
        a.click();
        window.URL.revokeObjectURL(url);
    }

    /**
     * Captures a screenshot of the current rendering
     * @see http://doc.babylonjs.com/how_to/render_scene_on_a_png
     * @param engine defines the rendering engine
     * @param camera defines the source camera
     * @param size This parameter can be set to a single number or to an object with the
     * following (optional) properties: precision, width, height. If a single number is passed,
     * it will be used for both width and height. If an object is passed, the screenshot size
     * will be derived from the parameters. The precision property is a multiplier allowing
     * rendering at a higher or lower resolution
     * @param successCallback defines the callback receives a single parameter which contains the
     * screenshot as a string of base64-encoded characters. This string can be assigned to the
     * src parameter of an <img> to display it
     * @param mimeType defines the MIME type of the screenshot image (default: image/png).
     * Check your browser for supported MIME types
     */
    public static CreateScreenshot(engine: Engine, camera: Camera, size: IScreenshotSize | number, successCallback?: (data: string) => void, mimeType: string = "image/png"): void {
        throw _DevTools.WarnImport("ScreenshotTools");
    }

    /**
     * Captures a screenshot of the current rendering
     * @see http://doc.babylonjs.com/how_to/render_scene_on_a_png
     * @param engine defines the rendering engine
     * @param camera defines the source camera
     * @param size This parameter can be set to a single number or to an object with the
     * following (optional) properties: precision, width, height. If a single number is passed,
     * it will be used for both width and height. If an object is passed, the screenshot size
     * will be derived from the parameters. The precision property is a multiplier allowing
     * rendering at a higher or lower resolution
     * @param mimeType defines the MIME type of the screenshot image (default: image/png).
     * Check your browser for supported MIME types
     * @returns screenshot as a string of base64-encoded characters. This string can be assigned
     * to the src parameter of an <img> to display it
     */
    public static CreateScreenshotAsync(engine: Engine, camera: Camera, size: IScreenshotSize | number, mimeType: string = "image/png"): Promise<string> {
        throw _DevTools.WarnImport("ScreenshotTools");
    }

    /**
     * Generates an image screenshot from the specified camera.
     * @see http://doc.babylonjs.com/how_to/render_scene_on_a_png
     * @param engine The engine to use for rendering
     * @param camera The camera to use for rendering
     * @param size This parameter can be set to a single number or to an object with the
     * following (optional) properties: precision, width, height. If a single number is passed,
     * it will be used for both width and height. If an object is passed, the screenshot size
     * will be derived from the parameters. The precision property is a multiplier allowing
     * rendering at a higher or lower resolution
     * @param successCallback The callback receives a single parameter which contains the
     * screenshot as a string of base64-encoded characters. This string can be assigned to the
     * src parameter of an <img> to display it
     * @param mimeType The MIME type of the screenshot image (default: image/png).
     * Check your browser for supported MIME types
     * @param samples Texture samples (default: 1)
     * @param antialiasing Whether antialiasing should be turned on or not (default: false)
     * @param fileName A name for for the downloaded file.
     */
    public static CreateScreenshotUsingRenderTarget(engine: Engine, camera: Camera, size: IScreenshotSize | number, successCallback?: (data: string) => void, mimeType: string = "image/png", samples: number = 1, antialiasing: boolean = false, fileName?: string): void {
        throw _DevTools.WarnImport("ScreenshotTools");
    }

    /**
     * Generates an image screenshot from the specified camera.
     * @see http://doc.babylonjs.com/how_to/render_scene_on_a_png
     * @param engine The engine to use for rendering
     * @param camera The camera to use for rendering
     * @param size This parameter can be set to a single number or to an object with the
     * following (optional) properties: precision, width, height. If a single number is passed,
     * it will be used for both width and height. If an object is passed, the screenshot size
     * will be derived from the parameters. The precision property is a multiplier allowing
     * rendering at a higher or lower resolution
     * @param mimeType The MIME type of the screenshot image (default: image/png).
     * Check your browser for supported MIME types
     * @param samples Texture samples (default: 1)
     * @param antialiasing Whether antialiasing should be turned on or not (default: false)
     * @param fileName A name for for the downloaded file.
     * @returns screenshot as a string of base64-encoded characters. This string can be assigned
     * to the src parameter of an <img> to display it
     */
    public static CreateScreenshotUsingRenderTargetAsync(engine: Engine, camera: Camera, size: IScreenshotSize | number, mimeType: string = "image/png", samples: number = 1, antialiasing: boolean = false, fileName?: string): Promise<string> {
        throw _DevTools.WarnImport("ScreenshotTools");
    }

    /**
     * Implementation from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#answer-2117523
     * Be aware Math.random() could cause collisions, but:
     * "All but 6 of the 128 bits of the ID are randomly generated, which means that for any two ids, there's a 1 in 2^^122 (or 5.3x10^^36) chance they'll collide"
     * @returns a pseudo random id
     */
    public static RandomId(): string {
        return GUID.RandomId();
    }

    /**
    * Test if the given uri is a base64 string
    * @param uri The uri to test
    * @return True if the uri is a base64 string or false otherwise
    */
    public static IsBase64(uri: string): boolean {
        return uri.length < 5 ? false : uri.substr(0, 5) === "data:";
    }

    /**
    * Decode the given base64 uri.
    * @param uri The uri to decode
    * @return The decoded base64 data.
    */
    public static DecodeBase64(uri: string): ArrayBuffer {
        const decodedString = atob(uri.split(",")[1]);
        const bufferLength = decodedString.length;
        const bufferView = new Uint8Array(new ArrayBuffer(bufferLength));

        for (let i = 0; i < bufferLength; i++) {
            bufferView[i] = decodedString.charCodeAt(i);
        }

        return bufferView.buffer;
    }

    /**
     * Gets the absolute url.
     * @param url the input url
     * @return the absolute url
     */
    public static GetAbsoluteUrl(url: string): string {
        const a = document.createElement("a");
        a.href = url;
        return a.href;
    }

    // Logs
    /**
     * No log
     */
    public static readonly NoneLogLevel = Logger.NoneLogLevel;
    /**
     * Only message logs
     */
    public static readonly MessageLogLevel = Logger.MessageLogLevel;
    /**
     * Only warning logs
     */
    public static readonly WarningLogLevel = Logger.WarningLogLevel;
    /**
     * Only error logs
     */
    public static readonly ErrorLogLevel = Logger.ErrorLogLevel;
    /**
     * All logs
     */
    public static readonly AllLogLevel = Logger.AllLogLevel;

    /**
     * Gets a value indicating the number of loading errors
     * @ignorenaming
     */
    public static get errorsCount(): number {
        return Logger.errorsCount;
    }

    /**
     * Callback called when a new log is added
     */
    public static OnNewCacheEntry: (entry: string) => void;

    /**
     * Log a message to the console
     * @param message defines the message to log
     */
    public static Log(message: string): void {
        Logger.Log(message);
    }

    /**
     * Write a warning message to the console
     * @param message defines the message to log
     */
    public static Warn(message: string): void {
        Logger.Warn(message);
    }

    /**
     * Write an error message to the console
     * @param message defines the message to log
     */
    public static Error(message: string): void {
        Logger.Error(message);
    }

    /**
     * Gets current log cache (list of logs)
     */
    public static get LogCache(): string {
        return Logger.LogCache;
    }

    /**
     * Clears the log cache
     */
    public static ClearLogCache(): void {
        Logger.ClearLogCache();
    }

    /**
     * Sets the current log level (MessageLogLevel / WarningLogLevel / ErrorLogLevel)
     */
    public static set LogLevels(level: number) {
        Logger.LogLevels = level;
    }

    /**
     * Checks if the window object exists
     * Back Compat only, please use DomManagement.IsWindowObjectExist instead.
     */
    public static IsWindowObjectExist = DomManagement.IsWindowObjectExist;

    // Performances

    /**
     * No performance log
     */
    public static readonly PerformanceNoneLogLevel = 0;
    /**
     * Use user marks to log performance
     */
    public static readonly PerformanceUserMarkLogLevel = 1;
    /**
     * Log performance to the console
     */
    public static readonly PerformanceConsoleLogLevel = 2;

    private static _performance: Performance;

    /**
     * Sets the current performance log level
     */
    public static set PerformanceLogLevel(level: number) {
        if ((level & Tools.PerformanceUserMarkLogLevel) === Tools.PerformanceUserMarkLogLevel) {
            Tools.StartPerformanceCounter = Tools._StartUserMark;
            Tools.EndPerformanceCounter = Tools._EndUserMark;
            return;
        }

        if ((level & Tools.PerformanceConsoleLogLevel) === Tools.PerformanceConsoleLogLevel) {
            Tools.StartPerformanceCounter = Tools._StartPerformanceConsole;
            Tools.EndPerformanceCounter = Tools._EndPerformanceConsole;
            return;
        }

        Tools.StartPerformanceCounter = Tools._StartPerformanceCounterDisabled;
        Tools.EndPerformanceCounter = Tools._EndPerformanceCounterDisabled;
    }

    private static _StartPerformanceCounterDisabled(counterName: string, condition?: boolean): void {
    }

    private static _EndPerformanceCounterDisabled(counterName: string, condition?: boolean): void {
    }

    private static _StartUserMark(counterName: string, condition = true): void {
        if (!Tools._performance) {
            if (!DomManagement.IsWindowObjectExist()) {
                return;
            }
            Tools._performance = window.performance;
        }

        if (!condition || !Tools._performance.mark) {
            return;
        }
        Tools._performance.mark(counterName + "-Begin");
    }

    private static _EndUserMark(counterName: string, condition = true): void {
        if (!condition || !Tools._performance.mark) {
            return;
        }
        Tools._performance.mark(counterName + "-End");
        Tools._performance.measure(counterName, counterName + "-Begin", counterName + "-End");
    }

    private static _StartPerformanceConsole(counterName: string, condition = true): void {
        if (!condition) {
            return;
        }

        Tools._StartUserMark(counterName, condition);

        if (console.time) {
            console.time(counterName);
        }
    }

    private static _EndPerformanceConsole(counterName: string, condition = true): void {
        if (!condition) {
            return;
        }

        Tools._EndUserMark(counterName, condition);

        console.timeEnd(counterName);
    }

    /**
     * Starts a performance counter
     */
    public static StartPerformanceCounter: (counterName: string, condition?: boolean) => void = Tools._StartPerformanceCounterDisabled;

    /**
     * Ends a specific performance coutner
     */
    public static EndPerformanceCounter: (counterName: string, condition?: boolean) => void = Tools._EndPerformanceCounterDisabled;

    /**
     * Gets either window.performance.now() if supported or Date.now() else
     */
    public static get Now(): number {
        return PrecisionDate.Now;
    }

    /**
     * This method will return the name of the class used to create the instance of the given object.
     * It will works only on Javascript basic data types (number, string, ...) and instance of class declared with the @className decorator.
     * @param object the object to get the class name from
     * @param isType defines if the object is actually a type
     * @returns the name of the class, will be "object" for a custom data type not using the @className decorator
     */
    public static GetClassName(object: any, isType: boolean = false): string {
        let name = null;

        if (!isType && object.getClassName) {
            name = object.getClassName();
        } else {
            if (object instanceof Object) {
                let classObj = isType ? object : Object.getPrototypeOf(object);
                name = classObj.constructor["__bjsclassName__"];
            }
            if (!name) {
                name = typeof object;
            }
        }
        return name;
    }

    /**
     * Gets the first element of an array satisfying a given predicate
     * @param array defines the array to browse
     * @param predicate defines the predicate to use
     * @returns null if not found or the element
     */
    public static First<T>(array: Array<T>, predicate: (item: T) => boolean): Nullable<T> {
        for (let el of array) {
            if (predicate(el)) {
                return el;
            }
        }

        return null;
    }

    /**
     * This method will return the name of the full name of the class, including its owning module (if any).
     * It will works only on Javascript basic data types (number, string, ...) and instance of class declared with the @className decorator or implementing a method getClassName():string (in which case the module won't be specified).
     * @param object the object to get the class name from
     * @param isType defines if the object is actually a type
     * @return a string that can have two forms: "moduleName.className" if module was specified when the class' Name was registered or "className" if there was not module specified.
     * @ignorenaming
     */
    public static getFullClassName(object: any, isType: boolean = false): Nullable<string> {
        let className = null;
        let moduleName = null;

        if (!isType && object.getClassName) {
            className = object.getClassName();
        } else {
            if (object instanceof Object) {
                let classObj = isType ? object : Object.getPrototypeOf(object);
                className = classObj.constructor["__bjsclassName__"];
                moduleName = classObj.constructor["__bjsmoduleName__"];
            }
            if (!className) {
                className = typeof object;
            }
        }

        if (!className) {
            return null;
        }

        return ((moduleName != null) ? (moduleName + ".") : "") + className;
    }

    /**
     * Returns a promise that resolves after the given amount of time.
     * @param delay Number of milliseconds to delay
     * @returns Promise that resolves after the given amount of time
     */
    public static DelayAsync(delay: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, delay);
        });
    }

    /**
     * Utility function to detect if the current user agent is Safari
     * @returns whether or not the current user agent is safari
     */
    public static IsSafari(): boolean {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }
}

/**
 * Use this className as a decorator on a given class definition to add it a name and optionally its module.
 * You can then use the Tools.getClassName(obj) on an instance to retrieve its class name.
 * This method is the only way to get it done in all cases, even if the .js file declaring the class is minified
 * @param name The name of the class, case should be preserved
 * @param module The name of the Module hosting the class, optional, but strongly recommended to specify if possible. Case should be preserved.
 */
export function className(name: string, module?: string): (target: Object) => void {
    return (target: Object) => {
        (<any>target)["__bjsclassName__"] = name;
        (<any>target)["__bjsmoduleName__"] = (module != null) ? module : null;
    };
}

/**
 * An implementation of a loop for asynchronous functions.
 */
export class AsyncLoop {
    /**
     * Defines the current index of the loop.
     */
    public index: number;
    private _done: boolean;
    private _fn: (asyncLoop: AsyncLoop) => void;
    private _successCallback: () => void;

    /**
     * Constructor.
     * @param iterations the number of iterations.
     * @param func the function to run each iteration
     * @param successCallback the callback that will be called upon succesful execution
     * @param offset starting offset.
     */
    constructor(
        /**
         * Defines the number of iterations for the loop
         */
        public iterations: number,
        func: (asyncLoop: AsyncLoop) => void,
        successCallback: () => void,
        offset: number = 0) {

        this.index = offset - 1;
        this._done = false;
        this._fn = func;
        this._successCallback = successCallback;
    }

    /**
     * Execute the next iteration. Must be called after the last iteration was finished.
     */
    public executeNext(): void {
        if (!this._done) {
            if (this.index + 1 < this.iterations) {
                ++this.index;
                this._fn(this);
            } else {
                this.breakLoop();
            }
        }
    }

    /**
     * Break the loop and run the success callback.
     */
    public breakLoop(): void {
        this._done = true;
        this._successCallback();
    }

    /**
     * Create and run an async loop.
     * @param iterations the number of iterations.
     * @param fn the function to run each iteration
     * @param successCallback the callback that will be called upon succesful execution
     * @param offset starting offset.
     * @returns the created async loop object
     */
    public static Run(iterations: number, fn: (asyncLoop: AsyncLoop) => void, successCallback: () => void, offset: number = 0): AsyncLoop {
        var loop = new AsyncLoop(iterations, fn, successCallback, offset);

        loop.executeNext();

        return loop;
    }

    /**
     * A for-loop that will run a given number of iterations synchronous and the rest async.
     * @param iterations total number of iterations
     * @param syncedIterations number of synchronous iterations in each async iteration.
     * @param fn the function to call each iteration.
     * @param callback a success call back that will be called when iterating stops.
     * @param breakFunction a break condition (optional)
     * @param timeout timeout settings for the setTimeout function. default - 0.
     * @returns the created async loop object
     */
    public static SyncAsyncForLoop(iterations: number, syncedIterations: number, fn: (iteration: number) => void, callback: () => void, breakFunction?: () => boolean, timeout: number = 0): AsyncLoop {
        return AsyncLoop.Run(Math.ceil(iterations / syncedIterations), (loop: AsyncLoop) => {
            if (breakFunction && breakFunction()) { loop.breakLoop(); }
            else {
                setTimeout(() => {
                    for (var i = 0; i < syncedIterations; ++i) {
                        var iteration = (loop.index * syncedIterations) + i;
                        if (iteration >= iterations) { break; }
                        fn(iteration);
                        if (breakFunction && breakFunction()) {
                            loop.breakLoop();
                            break;
                        }
                    }
                    loop.executeNext();
                }, timeout);
            }
        }, callback);
    }
}

// Will only be define if Tools is imported freeing up some space when only engine is required
EngineStore.FallbackTexture = "data:image/jpg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QBmRXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAAExAAIAAAAQAAAATgAAAAAAAABgAAAAAQAAAGAAAAABcGFpbnQubmV0IDQuMC41AP/bAEMABAIDAwMCBAMDAwQEBAQFCQYFBQUFCwgIBgkNCw0NDQsMDA4QFBEODxMPDAwSGBITFRYXFxcOERkbGRYaFBYXFv/bAEMBBAQEBQUFCgYGChYPDA8WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFv/AABEIAQABAAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APH6KKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76P//Z";

// Register promise fallback for IE
PromisePolyfill.Apply();
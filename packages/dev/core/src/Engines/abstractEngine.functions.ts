import { _WarnImport } from "core/Misc/devTools";
import { IsDocumentAvailable } from "core/Misc/domManagement";
import type { IFileRequest } from "core/Misc/fileRequest";
import type { LoadFileError } from "core/Misc/fileTools";
import type { IWebRequest } from "core/Misc/interfaces/iWebRequest";
import type { WebRequest } from "core/Misc/webRequest";
import type { IOfflineProvider } from "core/Offline/IOfflineProvider";
import type { Nullable } from "core/types";

export const EngineFunctionContext: {
    /**
     * Loads a file from a url
     * @param url url to load
     * @param onSuccess callback called when the file successfully loads
     * @param onProgress callback called while file is loading (if the server supports this mode)
     * @param offlineProvider defines the offline provider for caching
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @param onError callback called when the file fails to load
     * @returns a file request object
     * @internal
     */
    loadFile?: (
        url: string,
        onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void,
        onProgress?: (ev: ProgressEvent) => void,
        offlineProvider?: IOfflineProvider,
        useArrayBuffer?: boolean,
        onError?: (request?: WebRequest, exception?: LoadFileError) => void
    ) => IFileRequest;
} = {};

/**
 * @internal
 */
export function _ConcatenateShader(source: string, defines: Nullable<string>, shaderVersion: string = ""): string {
    return shaderVersion + (defines ? defines + "\n" : "") + source;
}

/**
 * @internal
 */
export function _loadFile(
    url: string,
    onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void,
    onProgress?: (data: any) => void,
    offlineProvider?: IOfflineProvider,
    useArrayBuffer?: boolean,
    onError?: (request?: IWebRequest, exception?: any) => void,
    injectedLoadFile?: (
        url: string,
        onSuccess: (data: string | ArrayBuffer, responseURL?: string | undefined) => void,
        onProgress?: ((ev: ProgressEvent<EventTarget>) => void) | undefined,
        offlineProvider?: IOfflineProvider | undefined,
        useArrayBuffer?: boolean | undefined,
        onError?: ((request?: WebRequest | undefined, exception?: LoadFileError | undefined) => void) | undefined
    ) => IFileRequest
): IFileRequest {
    const loadFile = injectedLoadFile || EngineFunctionContext.loadFile;
    if (loadFile) {
        const request = loadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError);
        return request;
    }
    throw _WarnImport("FileTools");
}

/**
 * Gets host document
 * @param renderingCanvas if provided, the canvas' owner document will be returned
 * @returns the host document object
 */
export function getHostDocument(renderingCanvas: Nullable<HTMLCanvasElement> = null): Nullable<Document> {
    if (renderingCanvas && renderingCanvas.ownerDocument) {
        return renderingCanvas.ownerDocument;
    }

    return IsDocumentAvailable() ? document : null;
}

/** @internal */
export function _getGlobalDefines(
    defines?: { [key: string]: string },
    isNDCHalfZRange?: boolean,
    useReverseDepthBuffer?: boolean,
    useExactSrgbConversions?: boolean
): string | undefined {
    if (defines) {
        if (isNDCHalfZRange) {
            defines["IS_NDC_HALF_ZRANGE"] = "";
        } else {
            delete defines["IS_NDC_HALF_ZRANGE"];
        }
        if (useReverseDepthBuffer) {
            defines["USE_REVERSE_DEPTHBUFFER"] = "";
        } else {
            delete defines["USE_REVERSE_DEPTHBUFFER"];
        }
        if (useExactSrgbConversions) {
            defines["USE_EXACT_SRGB_CONVERSIONS"] = "";
        } else {
            delete defines["USE_EXACT_SRGB_CONVERSIONS"];
        }
        return;
    } else {
        let s = "";
        if (isNDCHalfZRange) {
            s += "#define IS_NDC_HALF_ZRANGE";
        }
        if (useReverseDepthBuffer) {
            if (s) {
                s += "\n";
            }
            s += "#define USE_REVERSE_DEPTHBUFFER";
        }
        if (useExactSrgbConversions) {
            if (s) {
                s += "\n";
            }
            s += "#define USE_EXACT_SRGB_CONVERSIONS";
        }
        return s;
    }
}

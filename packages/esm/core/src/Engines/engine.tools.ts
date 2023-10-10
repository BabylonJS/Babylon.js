import { PerfCounter } from "@babylonjs/core/Misc/perfCounter.js";
import type { BaseEngineState, BaseEngineStateFull, IBaseEnginePublic } from "./engine.base.js";
import type { IOfflineProvider } from "@babylonjs/core/Offline/IOfflineProvider.js";
import type { IWebRequest } from "@babylonjs/core/Misc/interfaces/iWebRequest.js";
import type { IFileRequest } from "@babylonjs/core/Misc/fileRequest.js";
import { LoadFile } from "@babylonjs/core/Misc/fileTools.js";
/**
 * @internal
 */
export function _reportDrawCall(engineState: IBaseEnginePublic, numDrawCalls = 1) {
    const fes = engineState as BaseEngineState;
    fes._drawCalls?.addCount(numDrawCalls, false);
}

/**
 * initialize the draw calls perf counter
 * @param engineState the engine state object
 */
export function initDrawCallsPerfCounter(engineState: IBaseEnginePublic) {
    (engineState as BaseEngineState)._drawCalls = new PerfCounter();
}

/**
 * @internal
 */
export function _loadFile(
    engineState: IBaseEnginePublic,
    url: string,
    onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void,
    onProgress?: (data: any) => void,
    offlineProvider?: IOfflineProvider,
    useArrayBuffer?: boolean,
    onError?: (request?: IWebRequest, exception?: any) => void
): IFileRequest {
    const fes = engineState as BaseEngineStateFull;
    const request = LoadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError);
    fes._activeRequests.push(request);
    request.onCompleteObservable.add((request) => {
        fes._activeRequests.splice(fes._activeRequests.indexOf(request), 1);
    });
    return request;
}

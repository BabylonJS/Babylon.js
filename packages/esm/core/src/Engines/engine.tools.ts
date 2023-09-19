import { PerfCounter } from "core/Misc/perfCounter";
import type { BaseEngineState, BaseEngineStateFull, IBaseEnginePublic } from "./engine.base";
import type { IOfflineProvider } from "core/Offline/IOfflineProvider";
import type { IWebRequest } from "core/Misc/interfaces/iWebRequest";
import type { IFileRequest } from "core/Misc/fileRequest";
import { LoadFile } from "core/Misc/fileTools";
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

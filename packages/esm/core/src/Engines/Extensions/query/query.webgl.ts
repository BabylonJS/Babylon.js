import { _TimeToken } from "@babylonjs/core/Instrumentation/timeToken";
import { PerfCounter } from "@babylonjs/core/Misc/perfCounter";
import type { Nullable, int } from "@babylonjs/core/types";
import type { IWebGLEnginePublic, WebGLEngineStateFull } from "../../engine.webgl";
import type { OcclusionQuery } from "./query.base";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

export const createQuery = function (engineState: IWebGLEnginePublic): OcclusionQuery {
    const query = (engineState as WebGLEngineStateFull)._gl.createQuery();
    if (!query) {
        throw new Error("Unable to create Occlusion Query");
    }
    return query;
};

export const deleteQuery = function (engineState: IWebGLEnginePublic, query: OcclusionQuery): IWebGLEnginePublic {
    (engineState as WebGLEngineStateFull)._gl.deleteQuery(query);

    return engineState;
};

export const isQueryResultAvailable = function (engineState: IWebGLEnginePublic, query: OcclusionQuery): boolean {
    const fes = engineState as WebGLEngineStateFull;
    return fes._gl.getQueryParameter(query, fes._gl.QUERY_RESULT_AVAILABLE) as boolean;
};

export const getQueryResult = function (engineState: IWebGLEnginePublic, query: OcclusionQuery): number {
    const fes = engineState as WebGLEngineStateFull;
    return fes._gl.getQueryParameter(query, fes._gl.QUERY_RESULT) as number;
};

export const beginOcclusionQuery = function (engineState: IWebGLEnginePublic, algorithmType: number, query: OcclusionQuery): boolean {
    const fes = engineState as WebGLEngineStateFull;
    const glAlgorithm = _getGlAlgorithmType(fes, algorithmType);
    fes._gl.beginQuery(glAlgorithm, query);

    return true;
};

export const endOcclusionQuery = function (engineState: IWebGLEnginePublic, algorithmType: number): IWebGLEnginePublic {
    const fes = engineState as WebGLEngineStateFull;
    const glAlgorithm = _getGlAlgorithmType(fes, algorithmType);
    fes._gl.endQuery(glAlgorithm);

    return fes;
};

export const _createTimeQuery = function (engineState: IWebGLEnginePublic): WebGLQuery {
    const fes = engineState as WebGLEngineStateFull;
    const timerQuery = <EXT_disjoint_timer_query>fes._caps.timerQuery;

    if (timerQuery.createQueryEXT) {
        return timerQuery.createQueryEXT();
    }

    return createQuery(fes);
};

export const _deleteTimeQuery = function (engineState: IWebGLEnginePublic, query: WebGLQuery): void {
    const fes = engineState as WebGLEngineStateFull;
    const timerQuery = <EXT_disjoint_timer_query>fes._caps.timerQuery;

    if (timerQuery.deleteQueryEXT) {
        timerQuery.deleteQueryEXT(query);
        return;
    }

    deleteQuery(fes, query);
};

export const _getTimeQueryResult = function (engineState: IWebGLEnginePublic, query: WebGLQuery): any {
    const fes = engineState as WebGLEngineStateFull;
    const timerQuery = <EXT_disjoint_timer_query>fes._caps.timerQuery;

    if (timerQuery.getQueryObjectEXT) {
        return timerQuery.getQueryObjectEXT(query, timerQuery.QUERY_RESULT_EXT);
    }
    return getQueryResult(fes, query);
};

export const _getTimeQueryAvailability = function (engineState: IWebGLEnginePublic, query: WebGLQuery): any {
    const fes = engineState as WebGLEngineStateFull;
    const timerQuery = <EXT_disjoint_timer_query>fes._caps.timerQuery;

    if (timerQuery.getQueryObjectEXT) {
        return timerQuery.getQueryObjectEXT(query, timerQuery.QUERY_RESULT_AVAILABLE_EXT);
    }
    return isQueryResultAvailable(fes, query);
};

export const startTimeQuery = function (engineState: IWebGLEnginePublic): Nullable<_TimeToken> {
    const fes = engineState as WebGLEngineStateFull;
    const caps = fes._caps;
    const timerQuery = caps.timerQuery;
    if (!timerQuery) {
        return null;
    }

    const token = new _TimeToken();
    fes._gl.getParameter(timerQuery.GPU_DISJOINT_EXT);
    if (caps.canUseTimestampForTimerQuery) {
        token._startTimeQuery = _createTimeQuery(fes);

        timerQuery.queryCounterEXT(token._startTimeQuery, timerQuery.TIMESTAMP_EXT);
    } else {
        if (fes._currentNonTimestampToken) {
            return fes._currentNonTimestampToken;
        }

        token._timeElapsedQuery = _createTimeQuery(fes);
        if (timerQuery.beginQueryEXT) {
            timerQuery.beginQueryEXT(timerQuery.TIME_ELAPSED_EXT, token._timeElapsedQuery);
        } else {
            fes._gl.beginQuery(timerQuery.TIME_ELAPSED_EXT, token._timeElapsedQuery);
        }

        fes._currentNonTimestampToken = token;
    }
    return token;
};

export const endTimeQuery = function (engineState: IWebGLEnginePublic, token: _TimeToken): int {
    const fes = engineState as WebGLEngineStateFull;
    const caps = fes._caps;
    const timerQuery = caps.timerQuery;
    if (!timerQuery || !token) {
        return -1;
    }

    if (caps.canUseTimestampForTimerQuery) {
        if (!token._startTimeQuery) {
            return -1;
        }
        if (!token._endTimeQuery) {
            token._endTimeQuery = _createTimeQuery(fes);
            timerQuery.queryCounterEXT(token._endTimeQuery, timerQuery.TIMESTAMP_EXT);
        }
    } else if (!token._timeElapsedQueryEnded) {
        if (!token._timeElapsedQuery) {
            return -1;
        }
        if (timerQuery.endQueryEXT) {
            timerQuery.endQueryEXT(timerQuery.TIME_ELAPSED_EXT);
        } else {
            fes._gl.endQuery(timerQuery.TIME_ELAPSED_EXT);
            fes._currentNonTimestampToken = null;
        }
        token._timeElapsedQueryEnded = true;
    }

    const disjoint = fes._gl.getParameter(timerQuery.GPU_DISJOINT_EXT);
    let available: boolean = false;
    if (token._endTimeQuery) {
        available = _getTimeQueryAvailability(fes, token._endTimeQuery);
    } else if (token._timeElapsedQuery) {
        available = _getTimeQueryAvailability(fes, token._timeElapsedQuery);
    }

    if (available && !disjoint) {
        let result = 0;
        if (caps.canUseTimestampForTimerQuery) {
            if (!token._startTimeQuery || !token._endTimeQuery) {
                return -1;
            }
            const timeStart = _getTimeQueryResult(fes, token._startTimeQuery);
            const timeEnd = _getTimeQueryResult(fes, token._endTimeQuery);

            result = timeEnd - timeStart;
            _deleteTimeQuery(fes, token._startTimeQuery);
            _deleteTimeQuery(fes, token._endTimeQuery);
            token._startTimeQuery = null;
            token._endTimeQuery = null;
        } else {
            if (!token._timeElapsedQuery) {
                return -1;
            }

            result = _getTimeQueryResult(fes, token._timeElapsedQuery);
            _deleteTimeQuery(fes, token._timeElapsedQuery);
            token._timeElapsedQuery = null;
            token._timeElapsedQueryEnded = false;
        }
        return result;
    }

    return -1;
};

Engine.prototype._captureGPUFrameTime = false;
Engine.prototype._gpuFrameTime = new PerfCounter();

export const getGPUFrameTimeCounter = function (engineState: IWebGLEnginePublic) {
    return (engineState as WebGLEngineStateFull)._gpuFrameTime;
};

export const captureGPUFrameTime = function (engineState: IWebGLEnginePublic, value: boolean) {
    const fes = engineState as WebGLEngineStateFull;
    if (value === fes._captureGPUFrameTime) {
        return;
    }

    fes._captureGPUFrameTime = value;

    if (value) {
        fes._onBeginFrameObserver = fes.onBeginFrameObservable.add(() => {
            if (!fes._gpuFrameTimeToken) {
                fes._gpuFrameTimeToken = startTimeQuery(fes);
            }
        });

        fes._onEndFrameObserver = fes.onEndFrameObservable.add(() => {
            if (!fes._gpuFrameTimeToken) {
                return;
            }
            const time = endTimeQuery(fes, fes._gpuFrameTimeToken);

            if (time > -1) {
                fes._gpuFrameTimeToken = null;
                fes._gpuFrameTime.fetchNewFrame();
                fes._gpuFrameTime.addCount(time, true);
            }
        });
    } else {
        fes.onBeginFrameObservable.remove(fes._onBeginFrameObserver);
        fes._onBeginFrameObserver = null;
        fes.onEndFrameObservable.remove(fes._onEndFrameObserver);
        fes._onEndFrameObserver = null;
    }
};

export const _getGlAlgorithmType = function (engineState: IWebGLEnginePublic, algorithmType: number): number {
    const fes = engineState as WebGLEngineStateFull;
    return algorithmType === AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE ? fes._gl.ANY_SAMPLES_PASSED_CONSERVATIVE : fes._gl.ANY_SAMPLES_PASSED;
};

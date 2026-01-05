import type { Nullable, int } from "../../types";
import { ThinEngine } from "../../Engines/thinEngine";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { _TimeToken } from "../../Instrumentation/timeToken";
import type { Observer } from "../../Misc/observable";
import type { AbstractEngine } from "../abstractEngine";
import type { OcclusionQuery } from "../AbstractEngine/abstractEngine.query";

import "../AbstractEngine/abstractEngine.timeQuery";
import "../AbstractEngine/abstractEngine.query";

declare module "../../Engines/thinEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface ThinEngine {
        /**
         * @internal
         */
        _captureGPUFrameTime: boolean;

        /**
         * Starts a time query (used to measure time spent by the GPU on a specific frame)
         * Please note that only one query can be issued at a time
         * @returns a time token used to track the time span
         */
        startTimeQuery(): Nullable<_TimeToken>;

        /**
         * Ends a time query
         * @param token defines the token used to measure the time span
         * @returns the time spent (in ns)
         */
        endTimeQuery(token: _TimeToken): int;

        /** @internal */
        _currentNonTimestampToken: Nullable<_TimeToken>;
        /** @internal */
        _gpuFrameTimeToken: Nullable<_TimeToken>;
        /** @internal */
        _onBeginFrameObserver: Nullable<Observer<AbstractEngine>>;
        /** @internal */
        _onEndFrameObserver: Nullable<Observer<AbstractEngine>>;

        /** @internal */
        _createTimeQuery(): Nullable<WebGLQuery>;

        /** @internal */
        _deleteTimeQuery(query: WebGLQuery): void;

        /** @internal */
        _getGlAlgorithmType(algorithmType: number): number;

        /** @internal */
        _getTimeQueryResult(query: WebGLQuery): any;

        /** @internal */
        _getTimeQueryAvailability(query: WebGLQuery): any;
    }
}

ThinEngine.prototype.createQuery = function (): OcclusionQuery {
    const query = this._gl.createQuery();
    if (!query) {
        throw new Error("Unable to create Occlusion Query");
    }
    return query;
};

ThinEngine.prototype.deleteQuery = function (query: OcclusionQuery): ThinEngine {
    this._gl.deleteQuery(query);

    return this;
};

ThinEngine.prototype.isQueryResultAvailable = function (query: OcclusionQuery): boolean {
    return this._gl.getQueryParameter(query, this._gl.QUERY_RESULT_AVAILABLE) as boolean;
};

ThinEngine.prototype.getQueryResult = function (query: OcclusionQuery): number {
    return this._gl.getQueryParameter(query, this._gl.QUERY_RESULT) as number;
};

ThinEngine.prototype.beginOcclusionQuery = function (algorithmType: number, query: OcclusionQuery): boolean {
    const glAlgorithm = this._getGlAlgorithmType(algorithmType);
    this._gl.beginQuery(glAlgorithm, query);

    return true;
};

ThinEngine.prototype.endOcclusionQuery = function (algorithmType: number): ThinEngine {
    const glAlgorithm = this._getGlAlgorithmType(algorithmType);
    this._gl.endQuery(glAlgorithm);

    return this;
};

ThinEngine.prototype._createTimeQuery = function (): Nullable<WebGLQuery> {
    const timerQuery = <EXT_disjoint_timer_query>this.getCaps().timerQuery;

    if (timerQuery.createQueryEXT) {
        return timerQuery.createQueryEXT();
    }

    return this.createQuery();
};

ThinEngine.prototype._deleteTimeQuery = function (query: WebGLQuery): void {
    const timerQuery = <EXT_disjoint_timer_query>this.getCaps().timerQuery;

    if (timerQuery.deleteQueryEXT) {
        timerQuery.deleteQueryEXT(query);
        return;
    }

    this.deleteQuery(query);
};

ThinEngine.prototype._getTimeQueryResult = function (query: WebGLQuery): any {
    const timerQuery = <EXT_disjoint_timer_query>this.getCaps().timerQuery;

    if (timerQuery.getQueryObjectEXT) {
        return timerQuery.getQueryObjectEXT(query, timerQuery.QUERY_RESULT_EXT);
    }
    return this.getQueryResult(query);
};

ThinEngine.prototype._getTimeQueryAvailability = function (query: WebGLQuery): any {
    const timerQuery = <EXT_disjoint_timer_query>this.getCaps().timerQuery;

    if (timerQuery.getQueryObjectEXT) {
        return timerQuery.getQueryObjectEXT(query, timerQuery.QUERY_RESULT_AVAILABLE_EXT);
    }
    return this.isQueryResultAvailable(query);
};

ThinEngine.prototype.startTimeQuery = function (): Nullable<_TimeToken> {
    const caps = this.getCaps();
    const timerQuery = caps.timerQuery;
    if (!timerQuery) {
        return null;
    }

    const token = new _TimeToken();
    this._gl.getParameter(timerQuery.GPU_DISJOINT_EXT);
    if (caps.canUseTimestampForTimerQuery) {
        token._startTimeQuery = this._createTimeQuery();

        if (token._startTimeQuery) {
            timerQuery.queryCounterEXT(token._startTimeQuery, timerQuery.TIMESTAMP_EXT);
        }
    } else {
        if (this._currentNonTimestampToken) {
            return this._currentNonTimestampToken;
        }

        token._timeElapsedQuery = this._createTimeQuery();
        if (token._timeElapsedQuery) {
            if (timerQuery.beginQueryEXT) {
                timerQuery.beginQueryEXT(timerQuery.TIME_ELAPSED_EXT, token._timeElapsedQuery);
            } else {
                this._gl.beginQuery(timerQuery.TIME_ELAPSED_EXT, token._timeElapsedQuery);
            }
        }

        this._currentNonTimestampToken = token;
    }
    return token;
};

ThinEngine.prototype.endTimeQuery = function (token: _TimeToken): int {
    const caps = this.getCaps();
    const timerQuery = caps.timerQuery;
    if (!timerQuery || !token) {
        return -1;
    }

    if (caps.canUseTimestampForTimerQuery) {
        if (!token._startTimeQuery) {
            return -1;
        }
        if (!token._endTimeQuery) {
            token._endTimeQuery = this._createTimeQuery();
            if (token._endTimeQuery) {
                timerQuery.queryCounterEXT(token._endTimeQuery, timerQuery.TIMESTAMP_EXT);
            }
        }
    } else if (!token._timeElapsedQueryEnded) {
        if (!token._timeElapsedQuery) {
            return -1;
        }
        if (timerQuery.endQueryEXT) {
            timerQuery.endQueryEXT(timerQuery.TIME_ELAPSED_EXT);
        } else {
            this._gl.endQuery(timerQuery.TIME_ELAPSED_EXT);
            this._currentNonTimestampToken = null;
        }
        token._timeElapsedQueryEnded = true;
    }

    const disjoint = this._gl.getParameter(timerQuery.GPU_DISJOINT_EXT);
    let available: boolean = false;
    if (token._endTimeQuery) {
        available = this._getTimeQueryAvailability(token._endTimeQuery);
    } else if (token._timeElapsedQuery) {
        available = this._getTimeQueryAvailability(token._timeElapsedQuery);
    }

    if (available && !disjoint) {
        let result = 0;
        if (caps.canUseTimestampForTimerQuery) {
            if (!token._startTimeQuery || !token._endTimeQuery) {
                return -1;
            }
            const timeStart = this._getTimeQueryResult(token._startTimeQuery);
            const timeEnd = this._getTimeQueryResult(token._endTimeQuery);

            result = timeEnd - timeStart;
            this._deleteTimeQuery(token._startTimeQuery);
            this._deleteTimeQuery(token._endTimeQuery);
            token._startTimeQuery = null;
            token._endTimeQuery = null;
        } else {
            if (!token._timeElapsedQuery) {
                return -1;
            }

            result = this._getTimeQueryResult(token._timeElapsedQuery);
            this._deleteTimeQuery(token._timeElapsedQuery);
            token._timeElapsedQuery = null;
            token._timeElapsedQueryEnded = false;
        }
        return result;
    }

    return -1;
};

ThinEngine.prototype.captureGPUFrameTime = function (value: boolean) {
    if (value === this._captureGPUFrameTime) {
        return;
    }

    this._captureGPUFrameTime = value;

    if (value) {
        const gpuFrameTime = this.getGPUFrameTimeCounter();

        this._onBeginFrameObserver = this.onBeginFrameObservable.add(() => {
            if (!this._gpuFrameTimeToken) {
                this._gpuFrameTimeToken = this.startTimeQuery();
            }
        });

        this._onEndFrameObserver = this.onEndFrameObservable.add(() => {
            if (!this._gpuFrameTimeToken) {
                return;
            }
            const time = this.endTimeQuery(this._gpuFrameTimeToken);

            if (time > -1) {
                this._gpuFrameTimeToken = null;
                gpuFrameTime.fetchNewFrame();
                gpuFrameTime.addCount(time, true);
            }
        });
    } else {
        this.onBeginFrameObservable.remove(this._onBeginFrameObserver);
        this._onBeginFrameObserver = null;
        this.onEndFrameObservable.remove(this._onEndFrameObserver);
        this._onEndFrameObserver = null;
    }
};

ThinEngine.prototype._getGlAlgorithmType = function (algorithmType: number): number {
    return algorithmType === AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE ? this._gl.ANY_SAMPLES_PASSED_CONSERVATIVE : this._gl.ANY_SAMPLES_PASSED;
};

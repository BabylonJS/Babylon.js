import type { Nullable, int } from "../../types";
import { Engine } from "../../Engines/engine";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { _TimeToken } from "../../Instrumentation/timeToken";
import { PerfCounter } from "../../Misc/perfCounter";
import type { Observer } from "../../Misc/observable";

/** @internal */
export type OcclusionQuery = WebGLQuery | number;

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _OcclusionDataStorage {
    /** @internal */
    public occlusionInternalRetryCounter = 0;

    /** @internal */
    public isOcclusionQueryInProgress = false;

    /** @internal */
    public isOccluded = false;

    /** @internal */
    public occlusionRetryCount = -1;

    /** @internal */
    public occlusionType = AbstractMesh.OCCLUSION_TYPE_NONE;

    /** @internal */
    public occlusionQueryAlgorithmType = AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;

    /** @internal */
    public forceRenderingWhenOccluded = false;
}

declare module "../../Engines/engine" {
    export interface Engine {
        /**
         * Create a new webGL query (you must be sure that queries are supported by checking getCaps() function)
         * @returns the new query
         */
        createQuery(): OcclusionQuery;

        /**
         * Delete and release a webGL query
         * @param query defines the query to delete
         * @returns the current engine
         */
        deleteQuery(query: OcclusionQuery): Engine;

        /**
         * Check if a given query has resolved and got its value
         * @param query defines the query to check
         * @returns true if the query got its value
         */
        isQueryResultAvailable(query: OcclusionQuery): boolean;

        /**
         * Gets the value of a given query
         * @param query defines the query to check
         * @returns the value of the query
         */
        getQueryResult(query: OcclusionQuery): number;

        /**
         * Initiates an occlusion query
         * @param algorithmType defines the algorithm to use
         * @param query defines the query to use
         * @returns the current engine
         * @see https://doc.babylonjs.com/features/occlusionquery
         */
        beginOcclusionQuery(algorithmType: number, query: OcclusionQuery): boolean;

        /**
         * Ends an occlusion query
         * @see https://doc.babylonjs.com/features/occlusionquery
         * @param algorithmType defines the algorithm to use
         * @returns the current engine
         */
        endOcclusionQuery(algorithmType: number): Engine;

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

        /**
         * Get the performance counter associated with the frame time computation
         * @returns the perf counter
         */
        getGPUFrameTimeCounter(): PerfCounter;

        /**
         * Enable or disable the GPU frame time capture
         * @param value True to enable, false to disable
         */
        captureGPUFrameTime(value: boolean): void;

        /** @internal */
        _currentNonTimestampToken: Nullable<_TimeToken>;
        /** @internal */
        _captureGPUFrameTime: boolean;
        /** @internal */
        _gpuFrameTimeToken: Nullable<_TimeToken>;
        /** @internal */
        _gpuFrameTime: PerfCounter;
        /** @internal */
        _onBeginFrameObserver: Nullable<Observer<Engine>>;
        /** @internal */
        _onEndFrameObserver: Nullable<Observer<Engine>>;

        /** @internal */
        _createTimeQuery(): WebGLQuery;

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

Engine.prototype.createQuery = function (): OcclusionQuery {
    const query = this._gl.createQuery();
    if (!query) {
        throw new Error("Unable to create Occlusion Query");
    }
    return query;
};

Engine.prototype.deleteQuery = function (query: OcclusionQuery): Engine {
    this._gl.deleteQuery(query);

    return this;
};

Engine.prototype.isQueryResultAvailable = function (query: OcclusionQuery): boolean {
    return this._gl.getQueryParameter(query, this._gl.QUERY_RESULT_AVAILABLE) as boolean;
};

Engine.prototype.getQueryResult = function (query: OcclusionQuery): number {
    return this._gl.getQueryParameter(query, this._gl.QUERY_RESULT) as number;
};

Engine.prototype.beginOcclusionQuery = function (algorithmType: number, query: OcclusionQuery): boolean {
    const glAlgorithm = this._getGlAlgorithmType(algorithmType);
    this._gl.beginQuery(glAlgorithm, query);

    return true;
};

Engine.prototype.endOcclusionQuery = function (algorithmType: number): Engine {
    const glAlgorithm = this._getGlAlgorithmType(algorithmType);
    this._gl.endQuery(glAlgorithm);

    return this;
};

Engine.prototype._createTimeQuery = function (): WebGLQuery {
    const timerQuery = <EXT_disjoint_timer_query>this.getCaps().timerQuery;

    if (timerQuery.createQueryEXT) {
        return timerQuery.createQueryEXT();
    }

    return this.createQuery();
};

Engine.prototype._deleteTimeQuery = function (query: WebGLQuery): void {
    const timerQuery = <EXT_disjoint_timer_query>this.getCaps().timerQuery;

    if (timerQuery.deleteQueryEXT) {
        timerQuery.deleteQueryEXT(query);
        return;
    }

    this.deleteQuery(query);
};

Engine.prototype._getTimeQueryResult = function (query: WebGLQuery): any {
    const timerQuery = <EXT_disjoint_timer_query>this.getCaps().timerQuery;

    if (timerQuery.getQueryObjectEXT) {
        return timerQuery.getQueryObjectEXT(query, timerQuery.QUERY_RESULT_EXT);
    }
    return this.getQueryResult(query);
};

Engine.prototype._getTimeQueryAvailability = function (query: WebGLQuery): any {
    const timerQuery = <EXT_disjoint_timer_query>this.getCaps().timerQuery;

    if (timerQuery.getQueryObjectEXT) {
        return timerQuery.getQueryObjectEXT(query, timerQuery.QUERY_RESULT_AVAILABLE_EXT);
    }
    return this.isQueryResultAvailable(query);
};

Engine.prototype.startTimeQuery = function (): Nullable<_TimeToken> {
    const caps = this.getCaps();
    const timerQuery = caps.timerQuery;
    if (!timerQuery) {
        return null;
    }

    const token = new _TimeToken();
    this._gl.getParameter(timerQuery.GPU_DISJOINT_EXT);
    if (caps.canUseTimestampForTimerQuery) {
        token._startTimeQuery = this._createTimeQuery();

        timerQuery.queryCounterEXT(token._startTimeQuery, timerQuery.TIMESTAMP_EXT);
    } else {
        if (this._currentNonTimestampToken) {
            return this._currentNonTimestampToken;
        }

        token._timeElapsedQuery = this._createTimeQuery();
        if (timerQuery.beginQueryEXT) {
            timerQuery.beginQueryEXT(timerQuery.TIME_ELAPSED_EXT, token._timeElapsedQuery);
        } else {
            this._gl.beginQuery(timerQuery.TIME_ELAPSED_EXT, token._timeElapsedQuery);
        }

        this._currentNonTimestampToken = token;
    }
    return token;
};

Engine.prototype.endTimeQuery = function (token: _TimeToken): int {
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
            timerQuery.queryCounterEXT(token._endTimeQuery, timerQuery.TIMESTAMP_EXT);
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

Engine.prototype._captureGPUFrameTime = false;
Engine.prototype._gpuFrameTime = new PerfCounter();

Engine.prototype.getGPUFrameTimeCounter = function () {
    return this._gpuFrameTime;
};

Engine.prototype.captureGPUFrameTime = function (value: boolean) {
    if (value === this._captureGPUFrameTime) {
        return;
    }

    this._captureGPUFrameTime = value;

    if (value) {
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
                this._gpuFrameTime.fetchNewFrame();
                this._gpuFrameTime.addCount(time, true);
            }
        });
    } else {
        this.onBeginFrameObservable.remove(this._onBeginFrameObserver);
        this._onBeginFrameObserver = null;
        this.onEndFrameObservable.remove(this._onEndFrameObserver);
        this._onEndFrameObserver = null;
    }
};

Engine.prototype._getGlAlgorithmType = function (algorithmType: number): number {
    return algorithmType === AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE ? this._gl.ANY_SAMPLES_PASSED_CONSERVATIVE : this._gl.ANY_SAMPLES_PASSED;
};

declare module "../../Meshes/abstractMesh" {
    export interface AbstractMesh {
        /**
         * Backing filed
         * @internal
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        __occlusionDataStorage: _OcclusionDataStorage;

        /**
         * Access property
         * @internal
         */
        _occlusionDataStorage: _OcclusionDataStorage;

        /**
         * This number indicates the number of allowed retries before stop the occlusion query, this is useful if the occlusion query is taking long time before to the query result is retrieved, the query result indicates if the object is visible within the scene or not and based on that Babylon.Js engine decides to show or hide the object.
         * The default value is -1 which means don't break the query and wait till the result
         * @see https://doc.babylonjs.com/features/occlusionquery
         */
        occlusionRetryCount: number;

        /**
         * This property is responsible for starting the occlusion query within the Mesh or not, this property is also used to determine what should happen when the occlusionRetryCount is reached. It has supports 3 values:
         * * OCCLUSION_TYPE_NONE (Default Value): this option means no occlusion query within the Mesh.
         * * OCCLUSION_TYPE_OPTIMISTIC: this option is means use occlusion query and if occlusionRetryCount is reached and the query is broken show the mesh.
         * * OCCLUSION_TYPE_STRICT: this option is means use occlusion query and if occlusionRetryCount is reached and the query is broken restore the last state of the mesh occlusion if the mesh was visible then show the mesh if was hidden then hide don't show.
         * @see https://doc.babylonjs.com/features/occlusionquery
         */
        occlusionType: number;

        /**
         * This property determines the type of occlusion query algorithm to run in WebGl, you can use:
         * * AbstractMesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE which is mapped to GL_ANY_SAMPLES_PASSED.
         * * AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE (Default Value) which is mapped to GL_ANY_SAMPLES_PASSED_CONSERVATIVE which is a false positive algorithm that is faster than GL_ANY_SAMPLES_PASSED but less accurate.
         * @see https://doc.babylonjs.com/features/occlusionquery
         */
        occlusionQueryAlgorithmType: number;

        /**
         * Gets or sets whether the mesh is occluded or not, it is used also to set the initial state of the mesh to be occluded or not
         * @see https://doc.babylonjs.com/features/occlusionquery
         */
        isOccluded: boolean;

        /**
         * Flag to check the progress status of the query
         * @see https://doc.babylonjs.com/features/occlusionquery
         */
        isOcclusionQueryInProgress: boolean;

        /**
         * Flag to force rendering the mesh even if occluded
         * @see https://doc.babylonjs.com/features/occlusionquery
         */
        forceRenderingWhenOccluded: boolean;
    }
}
Object.defineProperty(AbstractMesh.prototype, "isOcclusionQueryInProgress", {
    get: function (this: AbstractMesh) {
        return this._occlusionDataStorage.isOcclusionQueryInProgress;
    },
    set: function (this: AbstractMesh, value: boolean) {
        this._occlusionDataStorage.isOcclusionQueryInProgress = value;
    },
    enumerable: false,
    configurable: true,
});

Object.defineProperty(AbstractMesh.prototype, "_occlusionDataStorage", {
    get: function (this: AbstractMesh) {
        if (!this.__occlusionDataStorage) {
            this.__occlusionDataStorage = new _OcclusionDataStorage();
        }
        return this.__occlusionDataStorage;
    },
    enumerable: false,
    configurable: true,
});

Object.defineProperty(AbstractMesh.prototype, "isOccluded", {
    get: function (this: AbstractMesh) {
        return this._occlusionDataStorage.isOccluded;
    },
    set: function (this: AbstractMesh, value: boolean) {
        this._occlusionDataStorage.isOccluded = value;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(AbstractMesh.prototype, "occlusionQueryAlgorithmType", {
    get: function (this: AbstractMesh) {
        return this._occlusionDataStorage.occlusionQueryAlgorithmType;
    },
    set: function (this: AbstractMesh, value: number) {
        this._occlusionDataStorage.occlusionQueryAlgorithmType = value;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(AbstractMesh.prototype, "occlusionType", {
    get: function (this: AbstractMesh) {
        return this._occlusionDataStorage.occlusionType;
    },
    set: function (this: AbstractMesh, value: number) {
        this._occlusionDataStorage.occlusionType = value;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(AbstractMesh.prototype, "occlusionRetryCount", {
    get: function (this: AbstractMesh) {
        return this._occlusionDataStorage.occlusionRetryCount;
    },
    set: function (this: AbstractMesh, value: number) {
        this._occlusionDataStorage.occlusionRetryCount = value;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(AbstractMesh.prototype, "forceRenderingWhenOccluded", {
    get: function (this: AbstractMesh) {
        return this._occlusionDataStorage.forceRenderingWhenOccluded;
    },
    set: function (this: AbstractMesh, value: boolean) {
        this._occlusionDataStorage.forceRenderingWhenOccluded = value;
    },
    enumerable: true,
    configurable: true,
});

// We also need to update AbstractMesh as there is a portion of the code there
AbstractMesh.prototype._checkOcclusionQuery = function () {
    const dataStorage = this._occlusionDataStorage;

    if (dataStorage.occlusionType === AbstractMesh.OCCLUSION_TYPE_NONE) {
        dataStorage.isOccluded = false;
        return false;
    }

    const engine = this.getEngine();

    if (!engine.getCaps().supportOcclusionQuery) {
        dataStorage.isOccluded = false;
        return false;
    }

    if (!engine.isQueryResultAvailable) {
        // Occlusion query where not referenced
        dataStorage.isOccluded = false;
        return false;
    }

    if (this.isOcclusionQueryInProgress && this._occlusionQuery) {
        const isOcclusionQueryAvailable = engine.isQueryResultAvailable(this._occlusionQuery);
        if (isOcclusionQueryAvailable) {
            const occlusionQueryResult = engine.getQueryResult(this._occlusionQuery);

            dataStorage.isOcclusionQueryInProgress = false;
            dataStorage.occlusionInternalRetryCounter = 0;
            dataStorage.isOccluded = occlusionQueryResult > 0 ? false : true;
        } else {
            dataStorage.occlusionInternalRetryCounter++;

            if (dataStorage.occlusionRetryCount !== -1 && dataStorage.occlusionInternalRetryCounter > dataStorage.occlusionRetryCount) {
                dataStorage.isOcclusionQueryInProgress = false;
                dataStorage.occlusionInternalRetryCounter = 0;

                // if optimistic set isOccluded to false regardless of the status of isOccluded. (Render in the current render loop)
                // if strict continue the last state of the object.
                dataStorage.isOccluded = dataStorage.occlusionType === AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC ? false : dataStorage.isOccluded;
            } else {
                return dataStorage.occlusionType === AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC ? false : dataStorage.isOccluded;
            }
        }
    }

    const scene = this.getScene();
    if (scene.getBoundingBoxRenderer) {
        const occlusionBoundingBoxRenderer = scene.getBoundingBoxRenderer();

        if (this._occlusionQuery === null) {
            this._occlusionQuery = engine.createQuery();
        }

        if (engine.beginOcclusionQuery(dataStorage.occlusionQueryAlgorithmType, this._occlusionQuery)) {
            occlusionBoundingBoxRenderer.renderOcclusionBoundingBox(this);
            engine.endOcclusionQuery(dataStorage.occlusionQueryAlgorithmType);
            this._occlusionDataStorage.isOcclusionQueryInProgress = true;
        }
    }

    return dataStorage.isOccluded;
};

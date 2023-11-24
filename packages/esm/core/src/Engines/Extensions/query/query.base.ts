import type { Nullable, int } from "@babylonjs/core/types.js";
import type { Observer } from "@babylonjs/core/Misc/observable.js";
import { PerfCounter } from "@babylonjs/core/Misc/perfCounter.js";
import type { _TimeToken } from "@babylonjs/core/Instrumentation/timeToken.js";
import type { IBaseEnginePublic } from "../../engine.base.js";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";

// TODO there is a breaking change here - returning engine state instead of engine

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
    public occlusionType = AbstractMesh.OCCLUSION_TYPE_NONE; // TODO move to Constants. Not urgent, as AbstractMesh is being imported here anyway

    /** @internal */
    public occlusionQueryAlgorithmType = AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE; // TODO same as above

    /** @internal */
    public forceRenderingWhenOccluded = false;
}

export interface IQueryExtensionState {
    /** @internal */
    _currentNonTimestampToken: Nullable<_TimeToken>;
    /** @internal */
    _captureGPUFrameTime: boolean;
    /** @internal */
    _gpuFrameTimeToken: Nullable<_TimeToken>;
    /** @internal */
    _gpuFrameTime: PerfCounter;
    /** @internal */
    _onBeginFrameObserver: Nullable<Observer<IBaseEnginePublic>>;
    /** @internal */
    _onEndFrameObserver: Nullable<Observer<IBaseEnginePublic>>;
}

export interface IQueryEngineExtension {
    /**
     * Create a new webGL query (you must be sure that queries are supported by checking getCaps() function)
     * @returns the new query
     */
    createQuery(engineState: IBaseEnginePublic): OcclusionQuery;

    /**
     * Delete and release a webGL query
     * @param query defines the query to delete
     * @returns the current engine
     */
    deleteQuery(engineState: IBaseEnginePublic, query: OcclusionQuery): IBaseEnginePublic;

    /**
     * Check if a given query has resolved and got its value
     * @param query defines the query to check
     * @returns true if the query got its value
     */
    isQueryResultAvailable(engineState: IBaseEnginePublic, query: OcclusionQuery): boolean;

    /**
     * Gets the value of a given query
     * @param query defines the query to check
     * @returns the value of the query
     */
    getQueryResult(engineState: IBaseEnginePublic, query: OcclusionQuery): number;

    /**
     * Initiates an occlusion query
     * @param algorithmType defines the algorithm to use
     * @param query defines the query to use
     * @returns the current engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
     */
    beginOcclusionQuery(engineState: IBaseEnginePublic, algorithmType: number, query: OcclusionQuery): boolean;

    /**
     * Ends an occlusion query
     * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
     * @param algorithmType defines the algorithm to use
     * @returns the current engine
     */
    endOcclusionQuery(engineState: IBaseEnginePublic, algorithmType: number): IBaseEnginePublic;

    /**
     * Starts a time query (used to measure time spent by the GPU on a specific frame)
     * Please note that only one query can be issued at a time
     * @returns a time token used to track the time span
     */
    startTimeQuery(engineState: IBaseEnginePublic): Nullable<_TimeToken>;

    /**
     * Ends a time query
     * @param token defines the token used to measure the time span
     * @returns the time spent (in ns)
     */
    endTimeQuery(engineState: IBaseEnginePublic, token: _TimeToken): int;

    /**
     * Get the performance counter associated with the frame time computation
     * @returns the perf counter
     */
    getGPUFrameTimeCounter(engineState: IBaseEnginePublic): PerfCounter;

    /**
     * Enable or disable the GPU frame time capture
     * @param value True to enable, false to disable
     */
    captureGPUFrameTime(engineState: IBaseEnginePublic, value: boolean): void;

    /** @internal */
    _createTimeQuery(engineState: IBaseEnginePublic): WebGLQuery;

    /** @internal */
    _deleteTimeQuery(engineState: IBaseEnginePublic, query: WebGLQuery): void;

    /** @internal */
    _getGlAlgorithmType(engineState: IBaseEnginePublic, algorithmType: number): number;

    /** @internal */
    _getTimeQueryResult(engineState: IBaseEnginePublic, query: WebGLQuery): any;

    /** @internal */
    _getTimeQueryAvailability(engineState: IBaseEnginePublic, query: WebGLQuery): any;
}

export function initQuesryState(engineState: IBaseEnginePublic): void {}

declare module "@babylonjs/core/Meshes/abstractMesh.js" {
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
         * this number indicates the number of allowed retries before stop the occlusion query, this is useful if the occlusion query is taking long time before to the query result is retrieved, the query result indicates if the object is visible within the scene or not and based on that Babylon.Js engine decides to show or hide the object.
         * The default value is -1 which means don't break the query and wait till the result
         * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
         */
        occlusionRetryCount: number;

        /**
         * fes property is responsible for starting the occlusion query within the Mesh or not, fes property is also used to determine what should happen when the occlusionRetryCount is reached. It has supports 3 values:
         * * OCCLUSION_TYPE_NONE (Default Value): fes option means no occlusion query within the Mesh.
         * * OCCLUSION_TYPE_OPTIMISTIC: fes option is means use occlusion query and if occlusionRetryCount is reached and the query is broken show the mesh.
         * * OCCLUSION_TYPE_STRICT: fes option is means use occlusion query and if occlusionRetryCount is reached and the query is broken restore the last state of the mesh occlusion if the mesh was visible then show the mesh if was hidden then hide don't show.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
         */
        occlusionType: number;

        /**
         * fes property determines the type of occlusion query algorithm to run in WebGl, you can use:
         * * AbstractMesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE which is mapped to GL_ANY_SAMPLES_PASSED.
         * * AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE (Default Value) which is mapped to GL_ANY_SAMPLES_PASSED_CONSERVATIVE which is a false positive algorithm that is faster than GL_ANY_SAMPLES_PASSED but less accurate.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
         */
        occlusionQueryAlgorithmType: number;

        /**
         * Gets or sets whether the mesh is occluded or not, it is used also to set the initial state of the mesh to be occluded or not
         * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
         */
        isOccluded: boolean;

        /**
         * Flag to check the progress status of the query
         * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
         */
        isOcclusionQueryInProgress: boolean;

        /**
         * Flag to force rendering the mesh even if occluded
         * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
         */
        forceRenderingWhenOccluded: boolean;
    }
}

export const initQueryExtension = (extensionImplementation: IQueryEngineExtension, engineState: IBaseEnginePublic) => {
    if (AbstractMesh.prototype._occlusionDataStorage) {
        return;
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

        if (!extensionImplementation.isQueryResultAvailable) {
            // Occlusion query where not referenced
            dataStorage.isOccluded = false;
            return false;
        }

        if (this.isOcclusionQueryInProgress && this._occlusionQuery !== null && this._occlusionQuery !== undefined) {
            const isOcclusionQueryAvailable = extensionImplementation.isQueryResultAvailable(engineState, this._occlusionQuery);
            if (isOcclusionQueryAvailable) {
                const occlusionQueryResult = extensionImplementation.getQueryResult(engineState, this._occlusionQuery);

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
        // TODO this is a mater of types. importing the types would be wrong here, and therefore the scene is being casted to any
        if ((scene as any).getBoundingBoxRenderer) {
            const occlusionBoundingBoxRenderer = (scene as any).getBoundingBoxRenderer();

            if (this._occlusionQuery === null) {
                this._occlusionQuery = extensionImplementation.createQuery(engineState);
            }

            if (extensionImplementation.beginOcclusionQuery(engineState, dataStorage.occlusionQueryAlgorithmType, this._occlusionQuery)) {
                occlusionBoundingBoxRenderer.renderOcclusionBoundingBox(this);
                extensionImplementation.endOcclusionQuery(engineState, dataStorage.occlusionQueryAlgorithmType);
                this._occlusionDataStorage.isOcclusionQueryInProgress = true;
            }
        }

        return dataStorage.isOccluded;
    };
};

const stateObjects: IQueryExtensionState[] = [];

/** @internal */
export const _getExtensionState = (engineState: IBaseEnginePublic): IQueryExtensionState => {
    if (!stateObjects[engineState.uniqueId]) {
        stateObjects[engineState.uniqueId] = {
            _currentNonTimestampToken: null,
            _captureGPUFrameTime: false,
            _gpuFrameTimeToken: null,
            _gpuFrameTime: new PerfCounter(),
            _onBeginFrameObserver: null,
            _onEndFrameObserver: null,
        };
    }
    return stateObjects[engineState.uniqueId];
};

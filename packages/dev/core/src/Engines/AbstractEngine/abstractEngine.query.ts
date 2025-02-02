import { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Nullable } from "../../types";
import { AbstractEngine } from "../abstractEngine";

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

declare module "../../Engines/abstractEngine" {
    export interface AbstractEngine {
        /**
         * Create a new webGL query (you must be sure that queries are supported by checking getCaps() function)
         * @returns the new query
         */
        createQuery(): Nullable<OcclusionQuery>;
        /**
         * Delete and release a webGL query
         * @param query defines the query to delete
         * @returns the current engine
         */
        deleteQuery(query: OcclusionQuery): AbstractEngine /**
         * Check if a given query has resolved and got its value
         * @param query defines the query to check
         * @returns true if the query got its value
         */;
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
         * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
         */
        beginOcclusionQuery(algorithmType: number, query: OcclusionQuery): boolean;
        /**
         * Ends an occlusion query
         * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
         * @param algorithmType defines the algorithm to use
         * @returns the current engine
         */
        endOcclusionQuery(algorithmType: number): AbstractEngine;
    }
}

AbstractEngine.prototype.createQuery = function (): Nullable<OcclusionQuery> {
    return null;
};

AbstractEngine.prototype.deleteQuery = function (query: OcclusionQuery): AbstractEngine {
    // Do nothing. Must be implemented by child classes
    return this;
};

AbstractEngine.prototype.isQueryResultAvailable = function (query: OcclusionQuery): boolean {
    // Do nothing. Must be implemented by child classes
    return false;
};

AbstractEngine.prototype.getQueryResult = function (query: OcclusionQuery): number {
    // Do nothing. Must be implemented by child classes
    return 0;
};

AbstractEngine.prototype.beginOcclusionQuery = function (algorithmType: number, query: OcclusionQuery): boolean {
    // Do nothing. Must be implemented by child classes
    return false;
};

AbstractEngine.prototype.endOcclusionQuery = function (algorithmType: number): AbstractEngine {
    // Do nothing. Must be implemented by child classes
    return this;
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
         * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
         */
        occlusionRetryCount: number;

        /**
         * This property is responsible for starting the occlusion query within the Mesh or not, this property is also used to determine what should happen when the occlusionRetryCount is reached. It has supports 3 values:
         * * OCCLUSION_TYPE_NONE (Default Value): this option means no occlusion query within the Mesh.
         * * OCCLUSION_TYPE_OPTIMISTIC: this option is means use occlusion query and if occlusionRetryCount is reached and the query is broken show the mesh.
         * * OCCLUSION_TYPE_STRICT: this option is means use occlusion query and if occlusionRetryCount is reached and the query is broken restore the last state of the mesh occlusion if the mesh was visible then show the mesh if was hidden then hide don't show.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
         */
        occlusionType: number;

        /**
         * This property determines the type of occlusion query algorithm to run in WebGl, you can use:
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

    if (this.isOcclusionQueryInProgress && this._occlusionQuery !== null && this._occlusionQuery !== undefined) {
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

        if (this._occlusionQuery && engine.beginOcclusionQuery(dataStorage.occlusionQueryAlgorithmType, this._occlusionQuery)) {
            occlusionBoundingBoxRenderer.renderOcclusionBoundingBox(this);
            engine.endOcclusionQuery(dataStorage.occlusionQueryAlgorithmType);
            this._occlusionDataStorage.isOcclusionQueryInProgress = true;
        }
    }

    return dataStorage.isOccluded;
};

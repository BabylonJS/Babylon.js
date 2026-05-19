import { type Nullable } from "../../types";
import { type OcclusionQuery, type _OcclusionDataStorage } from "./abstractEngine.query.pure";
declare module "../../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
declare module "../../Meshes/abstractMesh.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
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

        /**
         * This number indicates the render pass id used to run the occlusion query. The default value is -1, which means run the occlusion query in all render passes.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/occlusionQueries
         */
        occlusionForRenderPassId: number;
    }
}

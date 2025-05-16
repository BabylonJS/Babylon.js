import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { IBoundingInfoHelperPlatform } from "./IBoundingInfoHelperPlatform";
import type { ThinEngine } from "core/Engines";
import { Logger } from "core/Misc/logger";

/**
 * Utility class to help with bounding info management
 * Warning: using the BoundingInfoHelper class may be slower than executing calculations on the CPU!
 * This will happen if there are a lot of meshes / few vertices (like with the BrainStem model)
 * The BoundingInfoHelper will perform better if there are few meshes / a lot of vertices
 *  https://playground.babylonjs.com/#QPOERJ#9 : WebGL
 *  https://playground.babylonjs.com/#QPOERJ#10 : WebGPU
 */
export class BoundingInfoHelper {
    private _platform: IBoundingInfoHelperPlatform;
    private _engine: AbstractEngine;

    /**
     * Creates a new BoundingInfoHelper
     * @param engine defines the engine to use
     */
    public constructor(engine: AbstractEngine) {
        this._engine = engine;
    }

    private async _initializePlatformAsync() {
        if (!this._platform) {
            if (this._engine.getCaps().supportComputeShaders) {
                const module = await import("./computeShaderBoundingHelper");
                this._platform = new module.ComputeShaderBoundingHelper(this._engine);
            } else if (this._engine.getCaps().supportTransformFeedbacks) {
                const module = await import("./transformFeedbackBoundingHelper");
                this._platform = new module.TransformFeedbackBoundingHelper(this._engine as ThinEngine);
            } else {
                throw new Error("Your engine does not support Compute Shaders or Transform Feedbacks");
            }
        }
    }

    /**
     * Compute the bounding info of a mesh / array of meshes using shaders
     * @param target defines the mesh(es) to update
     * @returns a promise that resolves when the bounding info is/are computed
     */
    public async computeAsync(target: AbstractMesh | AbstractMesh[]): Promise<void> {
        await this._initializePlatformAsync();
        return await this._platform.processAsync(target);
    }

    /**
     * Register a mesh / array of meshes to be processed per batch
     * This method must be called before calling batchProcess (which can be called several times) and batchFetchResultsAsync
     * @param target defines the mesh(es) to be processed per batch
     * @returns a promise that resolves when the initialization is done
     */
    public async batchInitializeAsync(target: AbstractMesh | AbstractMesh[]): Promise<void> {
        await this._initializePlatformAsync();
        return await this._platform.registerMeshListAsync(target);
    }

    /**
     * Processes meshes registered with batchRegisterAsync
     * If called multiple times, the second, third, etc calls will perform a union of the bounding boxes calculated in the previous calls
     */
    public batchProcess(): void {
        if (this._platform === null) {
            Logger.Warn("Helper is not initialized. Skipping batch.");
            return;
        }
        this._platform.processMeshList();
    }

    /**
     * Update the bounding info of the meshes registered with batchRegisterAsync, after batchProcess has been called once or several times
     * @returns a promise that resolves when the bounding info is/are computed
     */
    public async batchFetchResultsAsync(): Promise<void> {
        await this._initializePlatformAsync();
        return await this._platform.fetchResultsForMeshListAsync();
    }

    /**
     * Dispose and release associated resources
     */
    public dispose(): void {
        if (this._platform) {
            this._platform.dispose();
        }
    }
}

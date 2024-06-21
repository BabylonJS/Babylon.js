import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { GetClass } from "core/Misc/typeStore";
import type { IBoundingInfoHelperPlatform } from "./IBoundingInfoHelperPlatform";

/**
 * Utility class to help with bounding info management
 * #BCNJD4#41 =\> does not use the BoundingInfoHelper class, performs calculations on the CPU
 * #BCNJD4#37 =\> same as #41 but use the BoundingInfoHelper class
 * #BCNJD4#40 =\> example with bones and morphs
 */
export class BoundingInfoHelper {
    private _platform: IBoundingInfoHelperPlatform;

    /**
     * Creates a new BoundingInfoHelper
     * @param engine defines the engine to use
     * @param meshes defines the meshes to work with
     */
    public constructor(engine: AbstractEngine, meshes: AbstractMesh | AbstractMesh[]) {
        if (engine.getCaps().supportComputeShaders) {
            if (!GetClass("BABYLON.ComputeShaderBoundingHelper")) {
                throw new Error("The ComputeShaderBoundingHelper class is not available! Make sure you have imported it.");
            }
            this._platform = new (GetClass("BABYLON.ComputeShaderBoundingHelper") as any)(engine, meshes);
        } else {
            if (!GetClass("BABYLON.TransformFeedbackBoundingHelper")) {
                throw new Error("The TransformFeedbackBoundingHelper class is not available! Make sure you have imported it.");
            }
            this._platform = new (GetClass("BABYLON.TransformFeedbackBoundingHelper") as any)(engine, meshes);
        }
    }

    public registerMeshListAsync(): Promise<void> {
        return this._platform.registerMeshListAsync();
    }

    public processMeshList(): void {
        this._platform.processMeshList();
    }

    /**
     * Compute the bounding info of a mesh / array of meshes using shaders
     * @returns a promise that resolves when the bounding info is/are computed
     */
    public fetchResultsForMeshListAsync(): Promise<void> {
        return this._platform.fetchResultsForMeshListAsync();
    }

    /**
     * Dispose and release associated resources
     */
    public dispose(): void {
        this._platform.dispose();
    }
}

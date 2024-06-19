import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { IBoundingInfoHelperPlatform } from "./IBoundingInfoHelperPlatform";
import type { ThinEngine } from "core/Engines";

/**
 * Utility class to help with bounding info management
 * #BCNJD4#41 =\> does not use the BoundingInfoHelper class, performs calculations on the CPU
 * #BCNJD4#37 =\> same as #41 but use the BoundingInfoHelper class
 * #BCNJD4#40 =\> example with bones and morphs
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

    /**
     * Compute the bounding info of a mesh / array of meshes using shaders
     * @param target defines the mesh(es) to update
     * @returns a promise that resolves when the bounding info is/are computed
     */
    public async computeAsync(target: AbstractMesh | AbstractMesh[]): Promise<void> {
        if (this._engine.getCaps().supportComputeShaders) {
            const module = await import("./computeShaderBoundingHelper");
            this._platform = new module.ComputeShaderBoundingHelper(this._engine);
        } else {
            const module = await import("./transformFeedbackBoundingHelper");
            this._platform = new module.TransformFeedbackBoundingHelper(this._engine as ThinEngine);
        }

        return this._platform.processAsync(target);
    }

    /**
     * Dispose and release associated resources
     */
    public dispose(): void {
        this._platform.dispose();
    }
}

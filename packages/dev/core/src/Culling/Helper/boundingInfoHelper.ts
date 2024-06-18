import type { Mesh } from "core/Meshes/mesh";
import { VertexBuffer } from "core/Buffers/buffer";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { GetClass } from "core/Misc/typeStore";
import type { IBoundingInfoHelperPlatform } from "./IBoundingInfoHelperPlatform";

/**
 * Utility class to help with bounding info management
 * #BCNJD4#5
 * #BCNJD4#14
 * #BCNJD4#15
 * #BCNJD4#33
 */
export class BoundingInfoHelper {
    private _platform: IBoundingInfoHelperPlatform;

    /**
     * Creates a new BoundingInfoHelper
     * @param engine defines the engine to use
     */
    public constructor(engine: AbstractEngine) {
        if (engine.getCaps().supportComputeShaders) {
            if (!GetClass("BABYLON.ComputeShaderBoundingHelper")) {
                throw new Error("The ComputeShaderBoundingHelper class is not available! Make sure you have imported it.");
            }
            this._platform = new (GetClass("BABYLON.ComputeShaderBoundingHelper") as any)(engine);
        } else {
            if (!GetClass("BABYLON.TransformFeedbackBoundingHelper")) {
                throw new Error("The TransformFeedbackBoundingHelper class is not available! Make sure you have imported it.");
            }
            this._platform = new (GetClass("BABYLON.TransformFeedbackBoundingHelper") as any)(engine);
        }
    }

    /**
     * Compute the bounding info of a mesh using shaders
     * @param mesh defines the mesh to update
     * @returns a promise that resolves when the bounding info is computed
     */
    public computeAsync(mesh: Mesh): Promise<void> {
        const source = mesh.getVertexBuffer(VertexBuffer.PositionKind);

        if (!source) {
            return Promise.resolve();
        }

        return this._platform.processAsync(mesh);
    }

    /**
     * Dispose and release associated resources
     */
    public dispose(): void {
        this._platform.dispose();
    }
}

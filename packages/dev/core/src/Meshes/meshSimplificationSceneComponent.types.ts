import { type SimplificationQueue } from "./meshSimplification";
import { type ISimplificationSettings, type SimplificationType } from "./meshSimplification.common";
declare module "../scene.pure" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _simplificationQueue: SimplificationQueue;

        /**
         * Gets or sets the simplification queue attached to the scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/simplifyingMeshes
         */
        simplificationQueue: SimplificationQueue;
    }
}
declare module "../Meshes/mesh.pure" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Mesh {
        /**
         * Simplify the mesh according to the given array of settings.
         * Function will return immediately and will simplify async
         * @param settings a collection of simplification settings
         * @param parallelProcessing should all levels calculate parallel or one after the other
         * @param simplificationType the type of simplification to run
         * @param successCallback optional success callback to be called after the simplification finished processing all settings
         * @returns the current mesh
         */
        simplify(
            settings: Array<ISimplificationSettings>,
            parallelProcessing?: boolean,
            simplificationType?: SimplificationType,
            successCallback?: (mesh?: Mesh, submeshIndex?: number) => void
        ): Mesh;
    }
}

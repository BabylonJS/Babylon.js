import type { AbstractMesh } from "core/Meshes/abstractMesh";

/**
 * Interface used to define a platform support for BoundingInfoHelper class
 */
export interface IBoundingInfoHelperPlatform {
    processAsync(mesh: AbstractMesh): Promise<void>;
    dispose(): void;
}

import type { AbstractMesh } from "core/Meshes/abstractMesh";

/**
 * Interface used to define a platform support for BoundingInfoHelper class
 * @internal
 */
export interface IBoundingInfoHelperPlatform {
    processAsync(mesh: AbstractMesh | AbstractMesh[]): Promise<void>;

    registerMeshListAsync(mesh: AbstractMesh | AbstractMesh[]): Promise<void>;
    processMeshList(): void;
    fetchResultsForMeshListAsync(): Promise<void>;

    dispose(): void;
}

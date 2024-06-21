/**
 * Interface used to define a platform support for BoundingInfoHelper class
 */
export interface IBoundingInfoHelperPlatform {
    registerMeshListAsync(): Promise<void>;
    processMeshList(): void;
    fetchResultsForMeshListAsync(): Promise<void>;
    dispose(): void;
}

/**
 * Interface used to define a platform support for BoundingInfoHelper class
 */
export interface IBoundingInfoHelperPlatform {
    initializeAsync(): Promise<void>;
    compute(): void;
    finalizeAsync(): Promise<void>;
    dispose(): void;
}

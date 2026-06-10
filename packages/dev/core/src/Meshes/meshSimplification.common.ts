/**
 * Expected simplification settings.
 * Quality should be between 0 and 1 (1 being 100%, 0 being 0%)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/simplifyingMeshes
 */
export interface ISimplificationSettings {
    /**
     * Gets or sets the expected quality
     */
    quality: number;
    /**
     * Gets or sets the distance when this optimized version should be used
     */
    distance: number;
    /**
     * Gets an already optimized mesh
     */
    optimizeMesh?: boolean | undefined;
}

/**
 * Class used to specify simplification options
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/simplifyingMeshes
 */
export class SimplificationSettings implements ISimplificationSettings {
    /**
     * Creates a SimplificationSettings
     * @param quality expected quality
     * @param distance distance when this optimized version should be used
     * @param optimizeMesh already optimized mesh
     */
    constructor(
        /** expected quality */
        public quality: number,
        /** distance when this optimized version should be used */
        public distance: number,
        /** already optimized mesh  */
        public optimizeMesh?: boolean
    ) {}
}

/**
 * The implemented types of simplification
 * At the moment only Quadratic Error Decimation is implemented
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/simplifyingMeshes
 */
export const enum SimplificationType {
    /** Quadratic error decimation */
    QUADRATIC,
}

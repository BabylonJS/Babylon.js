/**
 * Options for loading BVH files
 */
export type BVHLoadingOptions = {
    /**
     * Defines the name of the animation to load.
     */
    animationName: string;

    /**
     * Defines the loop mode of the animation to load.
     */
    loopMode: number;

    /**
     * Defines the name of the skeleton to load.
     */
    skeletonName: string;

    /**
     * Defines the id of the skeleton to load.
     */
    skeletonId: string;
};

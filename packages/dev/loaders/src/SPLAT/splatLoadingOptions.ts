/**
 * Options for loading Gaussian Splatting and PLY files
 */
export type SPLATLoadingOptions = {
    /**
     * Defines if buffers should be kept in memory for editing purposes
     */
    keepInRam?: boolean;
    /**
     * Spatial Y Flip for splat position and orientation
     */
    flipY?: boolean;
};

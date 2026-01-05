import type { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";

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
    /**
     * URL to load fflate from. If null or undefined, will load from unpkg.com
     * (https://unpkg.com/fflate/umd/index.js)
     */
    deflateURL?: string;
    /**
     * Instance of [fflate](https://github.com/101arrowz/fflate) to avoid
     * dynamically loading of the lib to global if needed, useful for bundler users.
     * @example import * as fflate from 'fflate';
     */
    fflate?: unknown;

    /**
     * Disable automatic camera limits from being applied if they exist in the splat file
     */
    disableAutoCameraLimits?: boolean;

    /**
     * Mesh that will be used to load data instead of creating a new one
     */
    gaussianSplattingMesh?: GaussianSplattingMesh;
};

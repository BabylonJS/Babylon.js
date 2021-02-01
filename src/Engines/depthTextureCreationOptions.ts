/**
 * Define options used to create a depth texture
 */
export class DepthTextureCreationOptions {
    /** Specifies whether or not a stencil should be allocated in the texture */
    generateStencil?: boolean;
    /** Specifies whether or not bilinear filtering is enable on the texture */
    bilinearFiltering?: boolean;
    /** Specifies the comparison function to set on the texture. If 0 or undefined, the texture is not in comparison mode */
    comparisonFunction?: number;
    /** Specifies if the created texture is a cube texture */
    isCube?: boolean;
    /** Specifies the sample count of the depth/stencil texture texture */
    samples?: number;
}
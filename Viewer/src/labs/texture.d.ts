/**
 * WebGL Pixel Formats
 */
export declare const enum PixelFormat {
    DEPTH_COMPONENT = 6402,
    ALPHA = 6406,
    RGB = 6407,
    RGBA = 6408,
    LUMINANCE = 6409,
    LUMINANCE_ALPHA = 6410,
}
/**
 * WebGL Pixel Types
 */
export declare const enum PixelType {
    UNSIGNED_BYTE = 5121,
    UNSIGNED_SHORT_4_4_4_4 = 32819,
    UNSIGNED_SHORT_5_5_5_1 = 32820,
    UNSIGNED_SHORT_5_6_5 = 33635,
}
/**
 * WebGL Texture Magnification Filter
 */
export declare const enum TextureMagFilter {
    NEAREST = 9728,
    LINEAR = 9729,
}
/**
 * WebGL Texture Minification Filter
 */
export declare const enum TextureMinFilter {
    NEAREST = 9728,
    LINEAR = 9729,
    NEAREST_MIPMAP_NEAREST = 9984,
    LINEAR_MIPMAP_NEAREST = 9985,
    NEAREST_MIPMAP_LINEAR = 9986,
    LINEAR_MIPMAP_LINEAR = 9987,
}
/**
 * WebGL Texture Wrap Modes
 */
export declare const enum TextureWrapMode {
    REPEAT = 10497,
    CLAMP_TO_EDGE = 33071,
    MIRRORED_REPEAT = 33648,
}
/**
 * Raw texture data and descriptor sufficient for WebGL texture upload
 */
export interface TextureData {
    /**
     * Width of image
     */
    width: number;
    /**
     * Height of image
     */
    height: number;
    /**
     * Format of pixels in data
     */
    format: PixelFormat;
    /**
     * Row byte alignment of pixels in data
     */
    alignment: number;
    /**
     * Pixel data
     */
    data: ArrayBufferView;
}
/**
 * Wraps sampling parameters for a WebGL texture
 */
export interface SamplingParameters {
    /**
     * Magnification mode when upsampling from a WebGL texture
     */
    magFilter?: TextureMagFilter;
    /**
     * Minification mode when upsampling from a WebGL texture
     */
    minFilter?: TextureMinFilter;
    /**
     * X axis wrapping mode when sampling out of a WebGL texture bounds
     */
    wrapS?: TextureWrapMode;
    /**
     * Y axis wrapping mode when sampling out of a WebGL texture bounds
     */
    wrapT?: TextureWrapMode;
    /**
    * Anisotropic filtering samples
    */
    maxAnisotropy?: number;
}
/**
 * Represents a valid WebGL texture source for use in texImage2D
 */
export declare type TextureSource = TextureData | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
/**
 * A generic set of texture mipmaps (where index 0 has the largest dimension)
 */
export declare type Mipmaps<T> = Array<T>;
/**
 * A set of 6 cubemap arranged in the order [+x, -x, +y, -y, +z, -z]
 */
export declare type Faces<T> = Array<T>;
/**
 * A set of texture mipmaps specifically for 2D textures in WebGL (where index 0 has the largest dimension)
 */
export declare type Mipmaps2D = Mipmaps<TextureSource>;
/**
 * A set of texture mipmaps specifically for cubemap textures in WebGL (where index 0 has the largest dimension)
 */
export declare type MipmapsCube = Mipmaps<Faces<TextureSource>>;
/**
 * A minimal WebGL cubemap descriptor
 */
export declare class TextureCube {
    internalFormat: PixelFormat;
    type: PixelType;
    source: MipmapsCube;
    /**
     * Returns the width of a face of the texture or 0 if not available
     */
    readonly Width: number;
    /**
     * Returns the height of a face of the texture or 0 if not available
     */
    readonly Height: number;
    /**
     * constructor
     * @param internalFormat WebGL pixel format for the texture on the GPU
     * @param type WebGL pixel type of the supplied data and texture on the GPU
     * @param source An array containing mipmap levels of faces, where each mipmap level is an array of faces and each face is a TextureSource object
     */
    constructor(internalFormat: PixelFormat, type: PixelType, source?: MipmapsCube);
}
/**
     * A static class providing methods to aid working with Bablyon textures.
     */
export declare class TextureUtils {
    /**
     * A prefix used when storing a babylon texture object reference on a Spectre texture object
     */
    static BabylonTextureKeyPrefix: string;
    /**
     * Controls anisotropic filtering for deserialized textures.
     */
    static MaxAnisotropy: number;
    /**
     * Returns a BabylonCubeTexture instance from a Spectre texture cube, subject to sampling parameters.
     * If such a texture has already been requested in the past, this texture will be returned, otherwise a new one will be created.
     * The advantage of this is to enable working with texture objects without the need to initialize on the GPU until desired.
     * @param scene A Babylon Scene instance
     * @param textureCube A Spectre TextureCube object
     * @param parameters WebGL texture sampling parameters
     * @param automaticMipmaps Pass true to enable automatic mipmap generation where possible (requires power of images)
     * @param environment Specifies that the texture will be used as an environment
     * @param singleLod Specifies that the texture will be a singleLod (for environment)
     * @return Babylon cube texture
     */
    static GetBabylonCubeTexture(scene: BABYLON.Scene, textureCube: TextureCube, automaticMipmaps: boolean, environment?: boolean, singleLod?: boolean): BABYLON.CubeTexture;
    /**
     * Applies Spectre SamplingParameters to a Babylon texture by directly setting texture parameters on the internal WebGLTexture as well as setting Babylon fields
     * @param babylonTexture Babylon texture to apply texture to (requires the Babylon texture has an initialize _texture field)
     * @param parameters Spectre SamplingParameters to apply
     */
    static ApplySamplingParameters(babylonTexture: BABYLON.BaseTexture, parameters: SamplingParameters): void;
    private static _EnvironmentSampling;
    private static _EnvironmentSingleMipSampling;
    /**
     * Environment preprocessing dedicated value (Internal Use or Advanced only).
     */
    static EnvironmentLODScale: number;
    /**
     * Environment preprocessing dedicated value (Internal Use or Advanced only)..
     */
    static EnvironmentLODOffset: number;
}

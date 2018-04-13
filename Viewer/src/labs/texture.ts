/**
 * WebGL Pixel Formats
 */
export const enum PixelFormat {
    DEPTH_COMPONENT = 0x1902,
    ALPHA = 0x1906,
    RGB = 0x1907,
    RGBA = 0x1908,
    LUMINANCE = 0x1909,
    LUMINANCE_ALPHA = 0x190a,
}

/**
 * WebGL Pixel Types
 */
export const enum PixelType {
    UNSIGNED_BYTE = 0x1401,
    UNSIGNED_SHORT_4_4_4_4 = 0x8033,
    UNSIGNED_SHORT_5_5_5_1 = 0x8034,
    UNSIGNED_SHORT_5_6_5 = 0x8363,
}

/**
 * WebGL Texture Magnification Filter
 */
export const enum TextureMagFilter {
    NEAREST = 0x2600,
    LINEAR = 0x2601,
}

/**
 * WebGL Texture Minification Filter
 */
export const enum TextureMinFilter {
    NEAREST = 0x2600,
    LINEAR = 0x2601,
    NEAREST_MIPMAP_NEAREST = 0x2700,
    LINEAR_MIPMAP_NEAREST = 0x2701,
    NEAREST_MIPMAP_LINEAR = 0x2702,
    LINEAR_MIPMAP_LINEAR = 0x2703,
}

/**
 * WebGL Texture Wrap Modes
 */
export const enum TextureWrapMode {
    REPEAT = 0x2901,
    CLAMP_TO_EDGE = 0x812f,
    MIRRORED_REPEAT = 0x8370,
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
export type TextureSource = TextureData | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;

/**
 * A generic set of texture mipmaps (where index 0 has the largest dimension)
 */
export type Mipmaps<T> = Array<T>;

/**
 * A set of 6 cubemap arranged in the order [+x, -x, +y, -y, +z, -z]
 */
export type Faces<T> = Array<T>;

/**
 * A set of texture mipmaps specifically for 2D textures in WebGL (where index 0 has the largest dimension)
 */
export type Mipmaps2D = Mipmaps<TextureSource>;

/**
 * A set of texture mipmaps specifically for cubemap textures in WebGL (where index 0 has the largest dimension)
 */
export type MipmapsCube = Mipmaps<Faces<TextureSource>>;

/**
 * A minimal WebGL cubemap descriptor
 */
export class TextureCube {

    /**
     * Returns the width of a face of the texture or 0 if not available
     */
    public get Width(): number {
        return (this.source && this.source[0] && this.source[0][0]) ? this.source[0][0].width : 0;
    }

    /**
     * Returns the height of a face of the texture or 0 if not available
     */
    public get Height(): number {
        return (this.source && this.source[0] && this.source[0][0]) ? this.source[0][0].height : 0;
    }

    /**
     * constructor
     * @param internalFormat WebGL pixel format for the texture on the GPU
     * @param type WebGL pixel type of the supplied data and texture on the GPU
     * @param source An array containing mipmap levels of faces, where each mipmap level is an array of faces and each face is a TextureSource object
     */
    constructor(public internalFormat: PixelFormat, public type: PixelType, public source: MipmapsCube = []) { }
}
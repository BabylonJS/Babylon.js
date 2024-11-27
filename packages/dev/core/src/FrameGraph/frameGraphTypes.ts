// eslint-disable-next-line import/no-internal-modules
import type { Nullable, TextureSize, FrameGraphContext } from "core/index";

/**
 * Represents a texture handle in the frame graph.
 */
export type FrameGraphTextureHandle = number;

/**
 * Represents a texture handle for the backbuffer color texture.
 */
export const backbufferColorTextureHandle: FrameGraphTextureHandle = 0;

/**
 * Represents a texture handle for the backbuffer depth/stencil texture.
 */
export const backbufferDepthStencilTextureHandle: FrameGraphTextureHandle = 1;

/**
 * Options used to describe a texture to be created in the frame graph.
 */
export type FrameGraphTextureOptions = {
    /** Specifies if mipmaps must be created for the textures (default: false) */
    createMipMaps?: boolean;

    /** Defines sample count (default: 1) */
    samples?: number;

    /** Defines the types of the textures */
    types?: number[];

    /** Defines the format of the textures (RED, RG, RGB, RGBA, ALPHA...) */
    formats?: number[];

    /** Defines if sRGB format should be used for each of texture */
    useSRGBBuffers?: boolean[];

    /** Defines the creation flags of the textures (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg) */
    creationFlags?: number[];

    /** Defines the names of the textures (used for debugging purpose) */
    labels?: string[];
};

/**
 * Options used to create a texture / list of textures in the frame graph.
 */
export type FrameGraphTextureCreationOptions = {
    /** Size of the textures. If sizeIsPercentage is true, these are percentages relative to the screen size (100 = 100%) */
    size: TextureSize;

    /** Options used to create the textures */
    options: FrameGraphTextureOptions;

    /** If true, indicates that "size" is percentages relative to the screen size */
    sizeIsPercentage: boolean;

    /** Indicates that the texture is a history texture (default: false) */
    isHistoryTexture?: boolean;
};

/**
 * Represents a texture description in the frame graph.
 * This is basically the same thing than FrameGraphTextureCreationOptions, but the size is never in percentage and always in pixels.
 */
export type FrameGraphTextureDescription = {
    /** Size of the texture */
    size: { width: number; height: number };

    /** Options used to create the texture */
    options: FrameGraphTextureOptions;
};

/**
 * Defines a pass in the frame graph.
 */
export interface IFrameGraphPass {
    /**
     * The name of the pass.
     */
    name: string;

    /**
     * Sets the function to execute when the pass is executed
     * @param func The function to execute when the pass is executed
     */
    setExecuteFunc(func: (context: FrameGraphContext) => void): void;

    /** @internal */
    _execute(): void;

    /** @internal */
    _isValid(): Nullable<string>;
}

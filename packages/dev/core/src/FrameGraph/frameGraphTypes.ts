// eslint-disable-next-line import/no-internal-modules
import type { Nullable, TextureSize, FrameGraphContext, IMultiRenderTargetOptions } from "core/index";

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
 * Options used to create a texture in the frame graph.
 */
export type FrameGraphTextureCreationOptions = {
    /** Size of the texture. If sizeIsPercentage is true, these are percentages relative to the screen size */
    size: TextureSize;

    /** Options used to create the (multi) render target texture */
    options: IMultiRenderTargetOptions;

    /** If true, indicates that "size" is percentages relative to the screen size */
    sizeIsPercentage: boolean;

    /** Indicates that the texture is a history texture */
    isHistoryTexture?: boolean;
};

/**
 * Represents a texture description in the frame graph.
 * This is basically the same thing than FrameGraphTextureCreationOptions, but the size is never in percentage and always in pixels.
 */
export type FrameGraphTextureDescription = {
    /**
     * Size of the texture.
     */
    size: { width: number; height: number };

    /**
     * Options used when the (multi) render target texture had been created.
     */
    options: IMultiRenderTargetOptions;
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

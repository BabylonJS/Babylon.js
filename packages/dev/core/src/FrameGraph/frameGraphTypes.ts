import type { Nullable } from "../types";
import type { TextureSize } from "../Materials/Textures/textureCreationOptions";
import type { FrameGraphContext } from "./frameGraphContext";
import type { IMultiRenderTargetOptions } from "../Materials/Textures/multiRenderTarget";

export type FrameGraphTextureHandle = number;

export const backbufferColorTextureHandle: FrameGraphTextureHandle = 0;

export const backbufferDepthStencilTextureHandle: FrameGraphTextureHandle = 1;

export type FrameGraphTextureCreationOptions = {
    /** Size of the render target texture. If sizeIsPercentage is true, these are percentages relative to the screen size */
    size: TextureSize;
    /** Options used to create the (multi) render target texture */
    options: IMultiRenderTargetOptions;
    /** If true, indicates that "size" is percentages relative to the screen size */
    sizeIsPercentage: boolean;
};

export type FrameGraphTextureDescription = {
    size: { width: number; height: number };
    options: IMultiRenderTargetOptions;
};

export interface IFrameGraphPass {
    name: string;
    setExecuteFunc(func: (context: FrameGraphContext) => void): void;
    _execute(): void;
    _isValid(): Nullable<string>;
}

import type { FrameGraphTextureType } from "../Enums/frameGraphTextureType";

/**
 * Handle to a texture
 */
export interface IFrameGraphTextureHandle {
    /** Texture handle */
    handle: number;
    /** Texture type */
    type: FrameGraphTextureType;
}

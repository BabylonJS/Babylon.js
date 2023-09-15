/* eslint-disable @typescript-eslint/naming-convention */
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { GlobalState } from "./components/globalState";
import { TextureTools } from "core/Misc/textureTools";
import "./lod";
import "./lodCube";

/**
 * Defines which channels of the texture to retrieve with {@link TextureHelper.GetTextureDataAsync}.
 */
export interface TextureChannelsToDisplay {
    /**
     * True if the red channel should be included.
     */
    R: boolean;
    /**
     * True if the green channel should be included.
     */
    G: boolean;
    /**
     * True if the blue channel should be included.
     */
    B: boolean;
    /**
     * True if the alpha channel should be included.
     */
    A: boolean;
}

/**
 * Helper class for retrieving texture data.
 */
export class TextureHelper {
    /**
     * Gets the data of the specified texture by rendering it to an intermediate RGBA texture and retreiving the bytes from it.
     * This is convienent to get 8-bit RGBA values for a texture in a GPU compressed format.
     * @param texture the source texture
     * @param width the width of the result, which does not have to match the source texture width
     * @param height the height of the result, which does not have to match the source texture height
     * @param face if the texture has multiple faces, the face index to use for the source
     * @param channels a filter for which of the RGBA channels to return in the result
     * @param lod if the texture has multiple LODs, the lod index to use for the source
     * @returns the 8-bit texture data
     */
    public static async GetTextureDataAsync(
        texture: BaseTexture,
        width: number,
        height: number,
        face: number,
        channels: TextureChannelsToDisplay,
        globalState?: GlobalState,
        lod: number = 0
    ): Promise<Uint8Array> {
        if (globalState) {
            globalState.blockMutationUpdates = true;
        }
        try {
            const result = await TextureTools.GetTextureDataAsync(texture, width, height, face, channels, lod);
            return result;
        } finally {
            if (globalState) {
                globalState.blockMutationUpdates = true;
            }
        }
    }
}

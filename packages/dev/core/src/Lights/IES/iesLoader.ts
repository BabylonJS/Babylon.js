import type { AbstractEngine } from "core/Engines/abstractEngine";
import { Constants } from "core/Engines/constants";
import { RawTexture } from "core/Materials/Textures/rawTexture";

/**
 * Generates an IES texture from a string representing the IES data.
 * @param source defines a string representing the IES data
 * @param engine defines the engine to use
 * @param width defines the width of the texture
 * @param height defines the height of the texture
 * @returns the IES texture
 * @see https://ieslibrary.com/browse
 */
export function loadIESData(source: string, engine: AbstractEngine, width = 256, height = 256): RawTexture {
    const data = new Uint8Array(width * height);
    const texture = RawTexture.CreateLuminanceTexture(data, width, height, engine, false, false, Constants.TEXTURE_NEAREST_NEAREST);
    texture.name = "IESDATA";
    return texture;
}

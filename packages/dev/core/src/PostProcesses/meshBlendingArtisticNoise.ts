import { type AbstractEngine } from "../Engines/abstractEngine.pure";
import { Constants } from "../Engines/constants";
import { RawTexture } from "../Materials/Textures/rawTexture";
import { Texture } from "../Materials/Textures/texture.pure";

/**
 * Creates the neutral fallback bound when no user artistic-noise texture is selected.
 * @param engine Engine that owns the texture.
 * @returns A one-pixel mid-gray texture that produces zero centered noise.
 * @internal
 */
export function _CreateMeshBlendNeutralArtisticNoiseTexture(engine: AbstractEngine): RawTexture {
    const texture = new RawTexture(
        new Uint8Array([128]),
        1,
        1,
        Constants.TEXTUREFORMAT_RED,
        engine,
        false,
        false,
        Constants.TEXTURE_NEAREST_SAMPLINGMODE,
        Constants.TEXTURETYPE_UNSIGNED_BYTE
    );
    texture.name = "MeshBlendNeutralArtisticNoise";
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    return texture;
}

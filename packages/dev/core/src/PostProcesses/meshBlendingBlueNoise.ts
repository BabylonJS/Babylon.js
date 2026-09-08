import { type AbstractEngine } from "../Engines/abstractEngine.pure";
import { Constants } from "../Engines/constants";
import { RawTexture } from "../Materials/Textures/rawTexture";
import { Texture } from "../Materials/Textures/texture.pure";

const _TextureSize = 128;
let _BlueNoiseData: Uint8Array | undefined;

function _HashPixel(x: number, y: number, seed: number): number {
    let value = Math.imul(x ^ seed, 0x45d9f3b) ^ Math.imul(y + seed, 0x119de1f3);
    value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
    value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
    return (value ^ (value >>> 16)) & 0xff;
}

function _CreateBlueNoiseData(): Uint8Array {
    const data = new Uint8Array(_TextureSize * _TextureSize * 2);
    let offset = 0;

    // Differencing deterministic white-noise samples suppresses low spatial frequencies while preserving a uniform byte distribution.
    for (let y = 0; y < _TextureSize; y++) {
        const nextY = (y + 1) & (_TextureSize - 1);
        for (let x = 0; x < _TextureSize; x++) {
            const nextX = (x + 1) & (_TextureSize - 1);
            data[offset++] = (_HashPixel(x, y, 0x68bc21eb) - _HashPixel(nextX, y, 0x68bc21eb)) & 0xff;
            data[offset++] = (_HashPixel(x, y, 0x2f6e2b1d) - _HashPixel(x, nextY, 0x2f6e2b1d)) & 0xff;
        }
    }

    return data;
}

/**
 * Creates the deterministic, spatially stable RG8 blue-noise texture used by mesh blending.
 * @param engine Engine that owns the texture.
 * @returns The blue-noise texture.
 * @internal
 */
export function _CreateMeshBlendBlueNoiseTexture(engine: AbstractEngine): RawTexture {
    const texture = new RawTexture(
        (_BlueNoiseData ??= _CreateBlueNoiseData()),
        _TextureSize,
        _TextureSize,
        Constants.TEXTUREFORMAT_RG,
        engine,
        false,
        false,
        Constants.TEXTURE_NEAREST_SAMPLINGMODE,
        Constants.TEXTURETYPE_UNSIGNED_BYTE
    );
    texture.name = "MeshBlendStableBlueNoise";
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    return texture;
}

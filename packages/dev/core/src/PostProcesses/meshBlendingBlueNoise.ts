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
    return ((value ^ (value >>> 16)) >>> 0) / 0x100000000;
}

function _FillBlueNoiseChannel(data: Uint8Array, channel: number, seed: number): void {
    const pixelCount = _TextureSize * _TextureSize;
    const whiteNoise = new Float32Array(pixelCount);
    const highPassNoise = new Float32Array(pixelCount);
    const rankedIndices = new Array<number>(pixelCount);

    for (let y = 0; y < _TextureSize; y++) {
        for (let x = 0; x < _TextureSize; x++) {
            const index = y * _TextureSize + x;
            whiteNoise[index] = _HashPixel(x, y, seed);
            rankedIndices[index] = index;
        }
    }

    for (let y = 0; y < _TextureSize; y++) {
        const previousY = (y - 1) & (_TextureSize - 1);
        const nextY = (y + 1) & (_TextureSize - 1);
        for (let x = 0; x < _TextureSize; x++) {
            const previousX = (x - 1) & (_TextureSize - 1);
            const nextX = (x + 1) & (_TextureSize - 1);
            const index = y * _TextureSize + x;
            const neighborAverage =
                (whiteNoise[y * _TextureSize + previousX] +
                    whiteNoise[y * _TextureSize + nextX] +
                    whiteNoise[previousY * _TextureSize + x] +
                    whiteNoise[nextY * _TextureSize + x] +
                    whiteNoise[previousY * _TextureSize + previousX] +
                    whiteNoise[previousY * _TextureSize + nextX] +
                    whiteNoise[nextY * _TextureSize + previousX] +
                    whiteNoise[nextY * _TextureSize + nextX]) *
                0.125;
            highPassNoise[index] = whiteNoise[index] - neighborAverage;
        }
    }

    // Ranking the toroidal high-pass signal preserves its spectral shape while restoring a uniform byte distribution.
    rankedIndices.sort((left, right) => highPassNoise[left] - highPassNoise[right] || left - right);
    for (let rank = 0; rank < pixelCount; rank++) {
        data[rankedIndices[rank] * 2 + channel] = Math.floor((rank * 256) / pixelCount);
    }
}

/**
 * Gets the deterministic RG8 blue-noise data used by mesh blending.
 * @returns The shared blue-noise byte data.
 * @internal
 */
export function _GetMeshBlendBlueNoiseData(): Uint8Array {
    if (_BlueNoiseData) {
        return _BlueNoiseData;
    }

    const data = new Uint8Array(_TextureSize * _TextureSize * 2);
    _FillBlueNoiseChannel(data, 0, 0x68bc21eb);
    _FillBlueNoiseChannel(data, 1, 0x2f6e2b1d);
    _BlueNoiseData = data;
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
        _GetMeshBlendBlueNoiseData(),
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

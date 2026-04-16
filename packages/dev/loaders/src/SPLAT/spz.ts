/* eslint-disable @typescript-eslint/promise-function-async */
import { Scalar } from "core/Maths/math.scalar";
import { type Scene } from "core/scene";
import { runCoroutineAsync, createYieldingScheduler, type Coroutine } from "core/Misc/coroutine";
import { _LoadScriptModuleAsync } from "core/Misc/tools.internals";
import { type SPLATLoadingOptions } from "./splatLoadingOptions";
import { Mode, type IParsedSplat } from "./splatDefs";
import { type GaussianCloud, type SpzModule, type SpzExtensionSafeOrbitCameraAdobe } from "@adobe/spz";

const _SpzConversionBatchSize = 32768;
const _SH_C0 = 0.28209479177387814;

// Cached WASM module promise — initialized once, reused across all SPZ loads.
let _SpzModulePromise: Promise<SpzModule> | null = null;
let _SpzModuleUrl: string | null = null;

/**
 * Parses SPZ data and returns a promise resolving to an IParsedSplat object.
 * @param data The ArrayBuffer containing SPZ data.
 * @param scene The Babylon.js scene.
 * @param _loadingOptions Options for loading Gaussian Splatting files.
 * @returns A promise resolving to the parsed SPZ data.
 */
export function ParseSpz(data: ArrayBuffer, scene: Scene, _loadingOptions: SPLATLoadingOptions): Promise<IParsedSplat> {
    const ubuf = new Uint8Array(data);
    const ubufu32 = new Uint32Array(data.slice(0, 12)); // Only need ubufu32[0] to [2]
    // debug infos
    const splatCount = ubufu32[2];

    const shDegree = ubuf[12];
    const fractionalBits = ubuf[13];
    const flags = ubuf[14];
    const reserved = ubuf[15];
    const version = ubufu32[1];

    // check magic and version
    if (reserved || ubufu32[0] != 0x5053474e || version < 2 || version > 4) {
        // reserved must be 0
        return new Promise((resolve) => {
            resolve({ mode: Mode.Reject, data: new ArrayBuffer(0), hasVertexColors: false });
        });
    }

    const rowOutputLength = 3 * 4 + 3 * 4 + 4 + 4; // 32
    const buffer = new ArrayBuffer(rowOutputLength * splatCount);

    const positionScale = 1.0 / (1 << fractionalBits);

    const int32View = new Int32Array(1);
    const uint8View = new Uint8Array(int32View.buffer);
    const read24bComponent = function (u8: Uint8Array, offset: number) {
        uint8View[0] = u8[offset + 0];
        uint8View[1] = u8[offset + 1];
        uint8View[2] = u8[offset + 2];
        uint8View[3] = u8[offset + 2] & 0x80 ? 0xff : 0x00;
        return int32View[0] * positionScale;
    };

    let byteOffset = 16;

    const position = new Float32Array(buffer);
    const scale = new Float32Array(buffer);
    const rgba = new Uint8ClampedArray(buffer);
    const rot = new Uint8ClampedArray(buffer);

    // positions
    for (let i = 0; i < splatCount; i++) {
        position[i * 8 + 0] = read24bComponent(ubuf, byteOffset + 0);
        position[i * 8 + 1] = read24bComponent(ubuf, byteOffset + 3);
        position[i * 8 + 2] = read24bComponent(ubuf, byteOffset + 6);
        byteOffset += 9;
    }

    // colors
    for (let i = 0; i < splatCount; i++) {
        for (let component = 0; component < 3; component++) {
            const byteValue = ubuf[byteOffset + splatCount + i * 3 + component];
            // 0.15 is hard coded value from spz
            // Scale factor for DC color components. To convert to RGB, we should multiply by 0.282, but it can
            // be useful to represent base colors that are out of range if the higher spherical harmonics bands
            // bring them back into range so we multiply by a smaller value.
            const value = (byteValue - 127.5) / (0.15 * 255);
            rgba[i * 32 + 24 + component] = Scalar.Clamp((0.5 + _SH_C0 * value) * 255, 0, 255);
        }

        rgba[i * 32 + 24 + 3] = ubuf[byteOffset + i];
    }
    byteOffset += splatCount * 4;

    // scales
    for (let i = 0; i < splatCount; i++) {
        scale[i * 8 + 3 + 0] = Math.exp(ubuf[byteOffset + 0] / 16.0 - 10.0);
        scale[i * 8 + 3 + 1] = Math.exp(ubuf[byteOffset + 1] / 16.0 - 10.0);
        scale[i * 8 + 3 + 2] = Math.exp(ubuf[byteOffset + 2] / 16.0 - 10.0);
        byteOffset += 3;
    }

    // convert quaternion
    if (version >= 3) {
        /*
            In version 3, rotations are represented as the smallest three components of the normalized rotation quaternion, for optimal rotation accuracy.
            The largest component can be derived from the others and is not stored. Its index is stored on 2 bits
            and each of the smallest three components is encoded as a 10-bit signed integer.
        */
        const sqrt12 = Math.SQRT1_2;
        for (let i = 0; i < splatCount; i++) {
            const r = [ubuf[byteOffset + 0], ubuf[byteOffset + 1], ubuf[byteOffset + 2], ubuf[byteOffset + 3]];

            const comp = r[0] + (r[1] << 8) + (r[2] << 16) + (r[3] << 24);

            const cmask = (1 << 9) - 1;
            const rotation = [];
            const iLargest = comp >>> 30;
            let remaining = comp;
            let sumSquares = 0;

            for (let i = 3; i >= 0; --i) {
                if (i !== iLargest) {
                    const mag = remaining & cmask;
                    const negbit = (remaining >>> 9) & 0x1;
                    remaining = remaining >>> 10;

                    rotation[i] = sqrt12 * (mag / cmask);
                    if (negbit === 1) {
                        rotation[i] = -rotation[i];
                    }

                    // accumulate the sum of squares
                    sumSquares += rotation[i] * rotation[i];
                }
            }

            const square = 1 - sumSquares;
            rotation[iLargest] = Math.sqrt(Math.max(square, 0));

            const shuffle = [3, 0, 1, 2]; // shuffle to match the order of the quaternion components in the splat file
            for (let j = 0; j < 4; j++) {
                rot[i * 32 + 28 + j] = Math.round(127.5 + rotation[shuffle[j]] * 127.5);
            }

            byteOffset += 4;
        }
    } else {
        /*
            In version 2, rotations are represented as the `(x, y, z)` components of the normalized rotation quaternion. The
            `w` component can be derived from the others and is not stored. Each component is encoded as an
            8-bit signed integer.
        */
        for (let i = 0; i < splatCount; i++) {
            const x = ubuf[byteOffset + 0];
            const y = ubuf[byteOffset + 1];
            const z = ubuf[byteOffset + 2];
            const nx = x / 127.5 - 1;
            const ny = y / 127.5 - 1;
            const nz = z / 127.5 - 1;
            rot[i * 32 + 28 + 1] = x;
            rot[i * 32 + 28 + 2] = y;
            rot[i * 32 + 28 + 3] = z;
            const v = 1 - (nx * nx + ny * ny + nz * nz);
            rot[i * 32 + 28 + 0] = 127.5 + Math.sqrt(v < 0 ? 0 : v) * 127.5;

            byteOffset += 3;
        }
    }

    // SH
    if (shDegree) {
        // shVectorCount is : 3 for degree 1, 8 for degree 2, 15 for degree 3, 24 for degree 4
        // number of vec3 vectors needed per splat
        const shVectorCount = (shDegree + 1) * (shDegree + 1) - 1; // minus 1 because sh0 is color
        // number of scalar component values: 3 per vec3
        const shComponentCount = shVectorCount * 3;

        const textureCount = Math.ceil(shComponentCount / 16); // 4 components can be stored per texture, 4 sh per component
        let shIndexRead = byteOffset;

        // sh is an array of uint8array that will be used to create sh textures
        const sh: Uint8Array[] = [];

        const engine = scene.getEngine();
        const width = engine.getCaps().maxTextureSize;
        const height = Math.ceil(splatCount / width);
        // create array for the number of textures needed.
        for (let textureIndex = 0; textureIndex < textureCount; textureIndex++) {
            const texture = new Uint8Array(height * width * 4 * 4); // 4 components per texture, 4 sh per component
            sh.push(texture);
        }

        for (let i = 0; i < splatCount; i++) {
            for (let shIndexWrite = 0; shIndexWrite < shComponentCount; shIndexWrite++) {
                const shValue = ubuf[shIndexRead++];

                const textureIndex = Math.floor(shIndexWrite / 16);
                const shArray = sh[textureIndex];

                const byteIndexInTexture = shIndexWrite % 16; // [0..15]
                const offsetPerSplat = i * 16; // 16 sh values per texture per splat.
                shArray[byteIndexInTexture + offsetPerSplat] = shValue;
            }
        }

        return new Promise((resolve) => {
            resolve({ mode: Mode.Splat, data: buffer, hasVertexColors: false, sh: sh, shDegree: shDegree, trainedWithAntialiasing: !!flags });
        });
    }

    return new Promise((resolve) => {
        resolve({ mode: Mode.Splat, data: buffer, hasVertexColors: false, trainedWithAntialiasing: !!flags });
    });
}

/**
 * Returns the initialized spz WASM module loaded from the given URL, loading it on first call.
 * @param url URL to the spz WASM ES module (its default export should be a factory function)
 * @returns A promise resolving to the initialized spz WASM module
 */
export async function GetSpzModule(url: string): Promise<SpzModule> {
    if (_SpzModulePromise && _SpzModuleUrl === url) {
        return await _SpzModulePromise;
    }

    const spzModulePromise = _LoadScriptModuleAsync(
        `import createSpzModule from '${url}';
         const module = await createSpzModule();
         const returnedValue = module;`
    );

    _SpzModuleUrl = url;
    _SpzModulePromise = spzModulePromise;

    return await spzModulePromise;
}

/**
 * Converts a GaussianCloud object (from the spz WASM module) into the packed 32-byte-per-splat
 * ArrayBuffer and SH texture arrays expected by GaussianSplattingMeshBase.updateData.
 *
 * Packed layout per splat (32 bytes):
 *   [0-11]  position xyz   (float32 x3)
 *   [12-23] scale xyz      (float32 x3)
 *   [24-27] color RGBA     (uint8 x4, colors in [0,255], alpha in [0,255])
 *   [28-31] quaternion wxyz (uint8 x4, encoded as q * 127.5 + 127.5)
 *
 * SH coefficients from the cloud (Float32, range ~[-1,1]) are encoded to bytes
 * using the SPZ convention (load-spz.cc unquantizeSH): byte = coeff * 128 + 128.
 *
 * @param cloud The GaussianCloud returned by spz.loadSpzFromBuffer
 * @param scene The Babylon.js scene (used to query maxTextureSize for SH textures)
 * @param useCoroutine If true, yields periodically to avoid blocking the main thread
 * @returns A coroutine returning an IParsedSplat ready to be passed to updateData
 */
export function* ConvertSpzToSplat(cloud: GaussianCloud, scene: Scene, useCoroutine = false): Coroutine<IParsedSplat> {
    const splatCount: number = cloud.numPoints;
    const rowOutputLength = 3 * 4 + 3 * 4 + 4 + 4; // 32 bytes
    const buffer = new ArrayBuffer(rowOutputLength * splatCount);
    const fBuffer = new Float32Array(buffer);
    const uBuffer = new Uint8Array(buffer);

    const positions: Float32Array = cloud.positions;
    const scales: Float32Array = cloud.scales;
    const colors: Float32Array = cloud.colors;
    const alphas: Float32Array = cloud.alphas;
    const rotations: Float32Array = cloud.rotations;

    // Build SH texture arrays upfront so both main and SH data can be written in a single pass
    let sh: Uint8Array[] | null = null;
    const shDegree: number = cloud.shDegree;
    let cloudSh: Float32Array | null = null;
    let shComponentCount = 0;
    let chunkStarts: Int32Array | null = null;
    let chunkEnds: Int32Array | null = null;
    let shArrays: Uint8Array[] | null = null;

    if (shDegree > 0 && cloud.sh.length > 0) {
        const shVectorCount = (shDegree + 1) * (shDegree + 1) - 1;
        shComponentCount = shVectorCount * 3;
        const textureCount = Math.ceil(shComponentCount / 16);

        const engine = scene.getEngine();
        const width = engine.getCaps().maxTextureSize;
        const height = Math.ceil(splatCount / width);
        sh = [];
        for (let t = 0; t < textureCount; t++) {
            sh.push(new Uint8Array(height * width * 4 * 4));
        }

        // Precompute chunk start/end and hoist texture references out of the per-splat loop
        chunkStarts = new Int32Array(textureCount);
        chunkEnds = new Int32Array(textureCount);
        for (let t = 0; t < textureCount; t++) {
            chunkStarts[t] = t * 16;
            chunkEnds[t] = Math.min((t + 1) * 16, shComponentCount);
        }
        shArrays = sh;
        cloudSh = cloud.sh;
    }

    // Single pass: write packed splat data and SH textures together to halve iteration count
    for (let i = 0; i < splatCount; i++) {
        const fBase = i * 8;
        const uBase = i * 32;
        const p = i * 3;
        const r = i * 4;

        // Position (float32 x3, bytes 0-11)
        fBuffer[fBase + 0] = positions[p + 0];
        fBuffer[fBase + 1] = positions[p + 1];
        fBuffer[fBase + 2] = positions[p + 2];

        // Scale (float32 x3, bytes 12-23) — cloud scales are in log space, convert to linear
        fBuffer[fBase + 3] = Math.exp(scales[p + 0]);
        fBuffer[fBase + 4] = Math.exp(scales[p + 1]);
        fBuffer[fBase + 5] = Math.exp(scales[p + 2]);

        // Color RGB: cloud gives raw SH DC coefficients, convert to [0,255] display value
        const c0 = (0.5 + _SH_C0 * colors[p + 0]) * 255;
        const c1 = (0.5 + _SH_C0 * colors[p + 1]) * 255;
        const c2 = (0.5 + _SH_C0 * colors[p + 2]) * 255;
        uBuffer[uBase + 24] = c0 <= 0 ? 0 : c0 >= 255 ? 255 : (c0 + 0.5) | 0;
        uBuffer[uBase + 25] = c1 <= 0 ? 0 : c1 >= 255 ? 255 : (c1 + 0.5) | 0;
        uBuffer[uBase + 26] = c2 <= 0 ? 0 : c2 >= 255 ? 255 : (c2 + 0.5) | 0;
        // Alpha: cloud gives raw logit opacity, apply sigmoid to get [0,255]
        uBuffer[uBase + 27] = ((1.0 / (1.0 + Math.exp(-alphas[i]))) * 255 + 0.5) | 0;

        // Rotation: cloud is xyzw, packed buffer expects wxyz
        const rw = rotations[r + 3] * 127.5 + 127.5;
        const rx = rotations[r + 0] * 127.5 + 127.5;
        const ry = rotations[r + 1] * 127.5 + 127.5;
        const rz = rotations[r + 2] * 127.5 + 127.5;
        uBuffer[uBase + 28] = rw <= 0 ? 0 : rw >= 255 ? 255 : (rw + 0.5) | 0; // w
        uBuffer[uBase + 29] = rx <= 0 ? 0 : rx >= 255 ? 255 : (rx + 0.5) | 0; // x
        uBuffer[uBase + 30] = ry <= 0 ? 0 : ry >= 255 ? 255 : (ry + 0.5) | 0; // y
        uBuffer[uBase + 31] = rz <= 0 ? 0 : rz >= 255 ? 255 : (rz + 0.5) | 0; // z

        // SH: process all texture chunks for this splat in the same iteration
        if (cloudSh && shArrays && chunkStarts && chunkEnds) {
            const shSplatBase = i * shComponentCount;
            const offsetPerSplat = i * 16;
            for (let t = 0; t < shArrays.length; t++) {
                const shT = shArrays[t];
                const chunkStart = chunkStarts[t];
                const chunkEnd = chunkEnds[t];
                for (let j = chunkStart; j < chunkEnd; j++) {
                    const v = cloudSh[shSplatBase + j] * 128.0 + 128.0;
                    shT[offsetPerSplat + j - chunkStart] = v <= 0 ? 0 : v >= 255 ? 255 : (v + 0.5) | 0;
                }
            }
        }

        if (i % _SpzConversionBatchSize === 0 && useCoroutine) {
            yield;
        }
    }

    // Extract safe-orbit-camera extension if present
    let safeOrbitCameraRadiusMin: number | undefined;
    let safeOrbitCameraElevationMinMax: [number, number] | undefined;
    if (cloud.extensions) {
        for (const ext of cloud.extensions) {
            const safeOrbitExt = ext as SpzExtensionSafeOrbitCameraAdobe;
            if (safeOrbitExt.safeOrbitRadiusMin !== undefined) {
                safeOrbitCameraRadiusMin = safeOrbitExt.safeOrbitRadiusMin;
                safeOrbitCameraElevationMinMax = [safeOrbitExt.safeOrbitElevationMin, safeOrbitExt.safeOrbitElevationMax];
                break;
            }
        }
    }

    return {
        mode: Mode.Splat,
        data: buffer,
        hasVertexColors: false,
        sh: sh !== null ? sh : undefined,
        shDegree: shDegree > 0 ? shDegree : undefined,
        trainedWithAntialiasing: !!cloud.antialiased,
        safeOrbitCameraRadiusMin,
        safeOrbitCameraElevationMinMax,
    };
}

/**
 * Async version of ConvertSpzToSplat that yields periodically to avoid blocking the main thread.
 * @param cloud The GaussianCloud returned by spz.loadSpzFromBuffer
 * @param scene The Babylon.js scene
 * @returns A promise resolving to an IParsedSplat
 */
export async function ConvertSpzToSplatAsync(cloud: any, scene: Scene): Promise<IParsedSplat> {
    return await runCoroutineAsync(ConvertSpzToSplat(cloud, scene, true), createYieldingScheduler());
}

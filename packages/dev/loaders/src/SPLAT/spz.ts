import { type Scene } from "core/scene";
import { runCoroutineAsync, createYieldingScheduler, type Coroutine } from "core/Misc/coroutine";
import { Mode, type IParsedSplat } from "./splatDefs";

const _SpzConversionBatchSize = 32768;
const _SH_C0 = 0.28209479177387814;

// Cached WASM module promise — initialized once, reused across all SPZ loads.
let _SpzModulePromise: Promise<any> | null = null;

/**
 * Returns the initialized \@adobe/spz WASM module, loading it on first call.
 * @returns A promise resolving to the initialized spz WASM module
 */
export async function GetSpzModule(): Promise<any> {
    if (!_SpzModulePromise) {
        _SpzModulePromise = (async () => {
            const { default: createSpzModule } = await import("@adobe/spz");
            return await createSpzModule();
        })();
    }
    return await _SpzModulePromise;
}

/**
 * Converts a GaussianCloud object (from \@adobe/spz) into the packed 32-byte-per-splat
 * ArrayBuffer and SH texture arrays expected by GaussianSplattingMeshBase.updateData.
 *
 * Packed layout per splat (32 bytes):
 *   [0-11]  position xyz   (float32 x3)
 *   [12-23] scale xyz      (float32 x3)
 *   [24-27] color RGBA     (uint8 x4, colors in [0,255], alpha in [0,255])
 *   [28-31] quaternion wxyz (uint8 x4, encoded as q * 127.5 + 127.5)
 *
 * SH coefficients from the cloud (Float32, range ~[-1,1]) are encoded to bytes
 * using the same convention as the PLY converter: byte = coeff * 127.5 + 127.5.
 *
 * @param cloud The GaussianCloud returned by spz.loadSpzFromBuffer
 * @param scene The Babylon.js scene (used to query maxTextureSize for SH textures)
 * @param useCoroutine If true, yields periodically to avoid blocking the main thread
 * @returns A coroutine returning an IParsedSplat ready to be passed to updateData
 */
export function* ConvertSpzToSplat(cloud: any, scene: Scene, useCoroutine = false): Coroutine<IParsedSplat> {
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
                    const v = cloudSh[shSplatBase + j] * 127.5 + 127.5;
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
            if (ext.safeOrbitRadiusMin !== undefined) {
                safeOrbitCameraRadiusMin = ext.safeOrbitRadiusMin;
                safeOrbitCameraElevationMinMax = [ext.safeOrbitElevationMin, ext.safeOrbitElevationMax];
                break;
            }
        }
    }

    return {
        mode: Mode.Splat,
        data: buffer,
        hasVertexColors: false,
        sh: sh ?? undefined,
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

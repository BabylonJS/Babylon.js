import { Scalar } from "core/Maths/math.scalar";
import { type Scene } from "core/scene";
import { runCoroutineAsync, createYieldingScheduler, type Coroutine } from "core/Misc/coroutine";
import { Mode, type IParsedSplat } from "./splatDefs";

const _SpzConversionBatchSize = 32768;
const _SH_C0 = 0.28209479177387814;

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
 * @param useCoroutine yield periodically to avoid blocking the main thread
 * @returns A coroutine yielding an IParsedSplat ready to be passed to updateData
 */
export function* ConvertSpzToSplat(cloud: any, scene: Scene, useCoroutine = false): Coroutine<IParsedSplat> {
    const splatCount: number = cloud.numPoints;
    const rowOutputLength = 3 * 4 + 3 * 4 + 4 + 4; // 32 bytes
    const buffer = new ArrayBuffer(rowOutputLength * splatCount);
    const fBuffer = new Float32Array(buffer);
    const uBuffer = new Uint8Array(buffer);

    for (let i = 0; i < splatCount; i++) {
        // Position (float32 x3, bytes 0-11)
        fBuffer[i * 8 + 0] = cloud.positions[i * 3 + 0];
        fBuffer[i * 8 + 1] = cloud.positions[i * 3 + 1];
        fBuffer[i * 8 + 2] = cloud.positions[i * 3 + 2];

        // Scale (float32 x3, bytes 12-23) — cloud scales are in log space, convert to linear
        fBuffer[i * 8 + 3] = Math.exp(cloud.scales[i * 3 + 0]);
        fBuffer[i * 8 + 4] = Math.exp(cloud.scales[i * 3 + 1]);
        fBuffer[i * 8 + 5] = Math.exp(cloud.scales[i * 3 + 2]);

        // Color RGB: cloud gives raw SH DC coefficients, convert to [0,255] display value
        uBuffer[i * 32 + 24] = Math.round(Scalar.Clamp((0.5 + _SH_C0 * cloud.colors[i * 3 + 0]) * 255, 0, 255));
        uBuffer[i * 32 + 25] = Math.round(Scalar.Clamp((0.5 + _SH_C0 * cloud.colors[i * 3 + 1]) * 255, 0, 255));
        uBuffer[i * 32 + 26] = Math.round(Scalar.Clamp((0.5 + _SH_C0 * cloud.colors[i * 3 + 2]) * 255, 0, 255));
        // Alpha: cloud gives raw logit opacity, apply sigmoid to get [0,255]
        uBuffer[i * 32 + 27] = Math.round((1.0 / (1.0 + Math.exp(-cloud.alphas[i]))) * 255);

        // Rotation: cloud is xyzw, packed buffer expects wxyz
        uBuffer[i * 32 + 28] = Math.round(Scalar.Clamp(cloud.rotations[i * 4 + 3] * 127.5 + 127.5, 0, 255)); // w
        uBuffer[i * 32 + 29] = Math.round(Scalar.Clamp(cloud.rotations[i * 4 + 0] * 127.5 + 127.5, 0, 255)); // x
        uBuffer[i * 32 + 30] = Math.round(Scalar.Clamp(cloud.rotations[i * 4 + 1] * 127.5 + 127.5, 0, 255)); // y
        uBuffer[i * 32 + 31] = Math.round(Scalar.Clamp(cloud.rotations[i * 4 + 2] * 127.5 + 127.5, 0, 255)); // z

        if (i % _SpzConversionBatchSize === 0 && useCoroutine) {
            yield;
        }
    }

    // Build SH texture arrays (same layout as ConvertPLYWithSHToSplat)
    let sh: Uint8Array[] | null = null;
    const shDegree: number = cloud.shDegree;
    if (shDegree > 0 && cloud.sh.length > 0) {
        const shVectorCount = (shDegree + 1) * (shDegree + 1) - 1;
        const shComponentCount = shVectorCount * 3;
        const textureCount = Math.ceil(shComponentCount / 16);

        const engine = scene.getEngine();
        const width = engine.getCaps().maxTextureSize;
        const height = Math.ceil(splatCount / width);
        sh = [];
        for (let t = 0; t < textureCount; t++) {
            sh.push(new Uint8Array(height * width * 4 * 4));
        }

        for (let i = 0; i < splatCount; i++) {
            for (let shIndexWrite = 0; shIndexWrite < shComponentCount; shIndexWrite++) {
                const coeff: number = cloud.sh[i * shComponentCount + shIndexWrite];
                const byteValue = Math.round(Scalar.Clamp(coeff * 127.5 + 127.5, 0, 255));
                const textureIndex = Math.floor(shIndexWrite / 16);
                const byteIndexInTexture = shIndexWrite % 16;
                const offsetPerSplat = i * 16;
                sh[textureIndex][byteIndexInTexture + offsetPerSplat] = byteValue;
            }

            if (i % _SpzConversionBatchSize === 0 && useCoroutine) {
                yield;
            }
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

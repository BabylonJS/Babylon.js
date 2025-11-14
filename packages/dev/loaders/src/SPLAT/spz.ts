/* eslint-disable @typescript-eslint/promise-function-async */
import { Scalar } from "core/Maths/math.scalar";
import type { Scene } from "core/scene";
import type { SPLATLoadingOptions } from "./splatLoadingOptions";
import { Mode } from "./splatDefs";
import type { IParsedPLY } from "./splatDefs";

/**
 * Parses SPZ data and returns a promise resolving to an IParsedPLY object.
 * @param data The ArrayBuffer containing SPZ data.
 * @param scene The Babylon.js scene.
 * @param loadingOptions Options for loading Gaussian Splatting files.
 * @returns A promise resolving to the parsed SPZ data.
 */
export function ParseSpz(data: ArrayBuffer, scene: Scene, loadingOptions: SPLATLoadingOptions): Promise<IParsedPLY> {
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
    if (reserved || ubufu32[0] != 0x5053474e || (version != 2 && version != 3)) {
        // reserved must be 0
        return new Promise((resolve) => {
            resolve({ mode: Mode.Reject, data: buffer, hasVertexColors: false });
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

    let coordinateSign = 1;
    let quaternionOffset = 0;
    if (!loadingOptions.flipY) {
        coordinateSign = -1;
        quaternionOffset = 255;
    }
    // positions
    for (let i = 0; i < splatCount; i++) {
        position[i * 8 + 0] = read24bComponent(ubuf, byteOffset + 0);
        position[i * 8 + 1] = coordinateSign * read24bComponent(ubuf, byteOffset + 3);
        position[i * 8 + 2] = coordinateSign * read24bComponent(ubuf, byteOffset + 6);
        byteOffset += 9;
    }

    // colors
    const shC0 = 0.282;
    for (let i = 0; i < splatCount; i++) {
        for (let component = 0; component < 3; component++) {
            const byteValue = ubuf[byteOffset + splatCount + i * 3 + component];
            // 0.15 is hard coded value from spz
            // Scale factor for DC color components. To convert to RGB, we should multiply by 0.282, but it can
            // be useful to represent base colors that are out of range if the higher spherical harmonics bands
            // bring them back into range so we multiply by a smaller value.
            const value = (byteValue - 127.5) / (0.15 * 255);
            rgba[i * 32 + 24 + component] = Scalar.Clamp((0.5 + shC0 * value) * 255, 0, 255);
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

            rotation[1] *= coordinateSign;
            rotation[2] *= coordinateSign;

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
            const y = ubuf[byteOffset + 1] * coordinateSign + quaternionOffset;
            const z = ubuf[byteOffset + 2] * coordinateSign + quaternionOffset;
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

    //SH
    if (shDegree) {
        // shVectorCount is : 3 for dim = 1, 8 for dim = 2 and 15 for dim = 3
        // number of vec3 vector needed per splat
        const shVectorCount = (shDegree + 1) * (shDegree + 1) - 1; // minus 1 because sh0 is color
        // number of component values : 3 per vector3 (45)
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
            resolve({ mode: Mode.Splat, data: buffer, hasVertexColors: false, sh: sh, trainedWithAntialiasing: !!flags });
        });
    }

    return new Promise((resolve) => {
        resolve({ mode: Mode.Splat, data: buffer, hasVertexColors: false, trainedWithAntialiasing: !!flags });
    });
}

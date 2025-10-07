import type { Scene } from "core/scene";
import type { IParsedPLY } from "./splatDefs";
import { Mode } from "./splatDefs";
import { Scalar } from "core/Maths/math.scalar";
import type { AbstractEngine } from "core/Engines";

/**
 * Definition of a SOG data file
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface SOGDataFile {
    /**
     * index 0 is number of splats index 1 is number of components per splat (3 for vec3, 4 for vec4, etc.)
     */
    shape: number[];
    /**
     * type of components
     */
    dtype: string;
    /**
     * min range of data
     */
    mins?: number | number[];
    /**
     * max range of data
     */
    maxs?: number | number[];
    /**
     * palette for indexed data (quantized)
     */
    codebook?: number[]; // Only for version 2
    /**
     * type of encoding
     */
    encoding?: string;
    /**
     * number of bits for quantization (if any)
     */
    quantization?: number;
    /**
     * webp file names
     */
    files: string[];
    /**
     * SH band count (if applicable)
     */
    bands?: number;
}

/**
 * Definition of the root SOG data file
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface SOGRootData {
    /**
     * version of the SOG format
     */
    version?: number;
    /**
     * mean positions of the splats
     */
    means: SOGDataFile;
    /**
     * scales of the splats
     */
    scales: SOGDataFile;
    /**
     * quaternions of the splats
     */
    quats: SOGDataFile;
    /**
     * SH0 coefficients of the splats (base color)
     */
    sh0: SOGDataFile;
    /**
     *  Optional higher order SH coefficients of the splats (lighting information)
     */
    shN?: SOGDataFile;
    /**
     * number of splats (optional, can be inferred from means.shape[0])
     */
    count?: number;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
interface IWebPImage {
    bits: Uint8Array;
    width: number;
}
const SH_C0 = 0.28209479177387814;

async function LoadWebpImageData(rootUrlOrData: string | Uint8Array, filename: string, engine: AbstractEngine): Promise<IWebPImage> {
    const promise = new Promise<IWebPImage>((resolve, reject) => {
        const image = engine.createCanvasImage();
        if (!image) {
            throw new Error("Failed to create ImageBitmap");
        }
        image.onload = () => {
            try {
                // Draw to canvas
                const canvas = engine.createCanvas(image.width, image.height);
                if (!canvas) {
                    throw new Error("Failed to create canvas");
                }
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    throw new Error("Failed to get 2D context");
                }
                ctx.drawImage(image, 0, 0);

                // Extract pixel data (RGBA per pixel)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                resolve({ bits: new Uint8Array(imageData.data.buffer), width: imageData.width });
            } catch (error) {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject(`Error loading image ${image.src} with exception: ${error}`);
            }
        };
        image.onerror = (error) => {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(`Error loading image ${image.src} with exception: ${error}`);
        };

        image.crossOrigin = "anonymous"; // To avoid CORS issues
        let objectUrl: string | undefined;
        if (typeof rootUrlOrData === "string") {
            // old behavior: URL + filename
            if (!filename) {
                throw new Error("filename is required when using a URL");
            }
            image.src = rootUrlOrData + filename;
        } else {
            // new behavior: Uint8Array
            const blob = new Blob([rootUrlOrData as any], { type: "image/webp" });
            objectUrl = URL.createObjectURL(blob);
            image.src = objectUrl;
        }
    });
    return await promise;
}

async function ParseSogDatas(data: SOGRootData, imageDataArrays: IWebPImage[], scene: Scene): Promise<IParsedPLY> {
    const splatCount = data.count ? data.count : data.means.shape[0];
    const rowOutputLength = 3 * 4 + 3 * 4 + 4 + 4; // 32
    const buffer = new ArrayBuffer(rowOutputLength * splatCount);

    const position = new Float32Array(buffer);
    const scale = new Float32Array(buffer);
    const rgba = new Uint8ClampedArray(buffer);
    const rot = new Uint8ClampedArray(buffer);

    // Undo the symmetric log transform used at encode time:
    const unlog = (n: number) => Math.sign(n) * (Math.exp(Math.abs(n)) - 1);

    const meansl = imageDataArrays[0].bits;
    const meansu = imageDataArrays[1].bits;
    // Check that data.means.mins is an array
    if (!Array.isArray(data.means.mins) || !Array.isArray(data.means.maxs)) {
        throw new Error("Missing arrays in SOG data.");
    }

    // --- Positions
    for (let i = 0; i < splatCount; i++) {
        const index = i * 4;
        for (let j = 0; j < 3; j++) {
            const meansMin = data.means.mins[j];
            const meansMax = data.means.maxs[j];
            const meansup = meansu[index + j];
            const meanslow = meansl[index + j];
            const q = (meansup << 8) | meanslow;
            const n = Scalar.Lerp(meansMin, meansMax, q / 65535);
            position[i * 8 + j] = unlog(n);
        }
    }

    // --- Scales
    const scales = imageDataArrays[2].bits;
    if (data.version === 2) {
        if (!data.scales.codebook) {
            throw new Error("Missing codebook in SOG version 2 scales data.");
        }
        for (let i = 0; i < splatCount; i++) {
            const index = i * 4;
            for (let j = 0; j < 3; j++) {
                const sc = data.scales.codebook[scales[index + j]];
                const sce = Math.exp(sc);
                scale[i * 8 + 3 + j] = sce;
            }
        }
    } else {
        if (!Array.isArray(data.scales.mins) || !Array.isArray(data.scales.maxs)) {
            throw new Error("Missing arrays in SOG scales data.");
        }

        for (let i = 0; i < splatCount; i++) {
            const index = i * 4;
            for (let j = 0; j < 3; j++) {
                const sc = scales[index + j];
                const lsc = Scalar.Lerp(data.scales.mins[j], data.scales.maxs[j], sc / 255);
                const lsce = Math.exp(lsc);
                scale[i * 8 + 3 + j] = lsce;
            }
        }
    }

    // --- Colors/SH0
    const colors = imageDataArrays[4].bits;
    if (data.version === 2) {
        if (!data.sh0.codebook) {
            throw new Error("Missing codebook in SOG version 2 sh0 data.");
        }
        for (let i = 0; i < splatCount; i++) {
            const index = i * 4;
            for (let j = 0; j < 3; j++) {
                const component = 0.5 + data.sh0.codebook[colors[index + j]] * SH_C0;
                rgba[i * 32 + 24 + j] = Math.max(0, Math.min(255, Math.round(255 * component)));
            }
            rgba[i * 32 + 24 + 3] = colors[index + 3];
        }
    } else {
        if (!Array.isArray(data.sh0.mins) || !Array.isArray(data.sh0.maxs)) {
            throw new Error("Missing arrays in SOG sh0 data.");
        }
        for (let i = 0; i < splatCount; i++) {
            const index = i * 4;
            for (let j = 0; j < 4; j++) {
                const colorsMin = data.sh0.mins[j];
                const colorsMax = data.sh0.maxs[j];

                const colort = colors[index + j];
                const c = Scalar.Lerp(colorsMin, colorsMax, colort / 255);

                let csh;
                if (j < 3) {
                    csh = 0.5 + c * SH_C0;
                } else {
                    csh = 1.0 / (1.0 + Math.exp(-c));
                }

                rgba[i * 32 + 24 + j] = Math.max(0, Math.min(255, Math.round(255 * csh)));
            }
        }
    }

    // --- Rotations
    // Dequantize the stored three components:
    const toComp = (c: number) => ((c / 255 - 0.5) * 2.0) / Math.SQRT2;

    const quatArray = imageDataArrays[3].bits;
    for (let i = 0; i < splatCount; i++) {
        const quatsr = quatArray[i * 4 + 0];
        const quatsg = quatArray[i * 4 + 1];
        const quatsb = quatArray[i * 4 + 2];
        const quatsa = quatArray[i * 4 + 3];

        const a = toComp(quatsr);
        const b = toComp(quatsg);
        const c = toComp(quatsb);

        const mode = quatsa - 252; // 0..3 (R,G,B,A is one of the four components)

        // Reconstruct the omitted component so that ||q|| = 1 and w.l.o.g. the omitted one is non-negative
        const t = a * a + b * b + c * c;
        const d = Math.sqrt(Math.max(0, 1 - t));

        // Place components according to mode
        let q: [number, number, number, number];
        switch (mode) {
            case 0:
                q = [d, a, b, c];
                break; // omitted = x
            case 1:
                q = [a, d, b, c];
                break; // omitted = y
            case 2:
                q = [a, b, d, c];
                break; // omitted = z
            case 3:
                q = [a, b, c, d];
                break; // omitted = w
            default:
                throw new Error("Invalid quaternion mode");
        }

        rot[i * 32 + 28 + 0] = q[0] * 127.5 + 127.5;
        rot[i * 32 + 28 + 1] = q[1] * 127.5 + 127.5;
        rot[i * 32 + 28 + 2] = q[2] * 127.5 + 127.5;
        rot[i * 32 + 28 + 3] = q[3] * 127.5 + 127.5;
    }

    // --- SH
    if (data.shN) {
        const coeffCounts = [0, 3, 8, 15];
        const coeffs = data.shN.bands ? coeffCounts[data.shN.bands] : data.shN.shape[1] / 3; // 3 components per coeff
        const shCentroids = imageDataArrays[5].bits;
        const shLabelsData = imageDataArrays[6].bits;
        const shCentroidsWidth = imageDataArrays[5].width;

        const shComponentCount = coeffs * 3;

        const textureCount = Math.ceil(shComponentCount / 16); // 4 components can be stored per texture, 4 sh per component
        //let shIndexRead = byteOffset;

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

        if (data.version === 2) {
            if (!data.shN.codebook) {
                throw new Error("Missing codebook in SOG version 2 shN data.");
            }

            for (let i = 0; i < splatCount; i++) {
                const n = shLabelsData[i * 4 + 0] + (shLabelsData[i * 4 + 1] << 8);
                const u = (n % 64) * coeffs;
                const v = Math.floor(n / 64);

                for (let k = 0; k < coeffs; k++) {
                    for (let j = 0; j < 3; j++) {
                        const shIndexWrite = k * 3 + j;
                        const textureIndex = Math.floor(shIndexWrite / 16);
                        const shArray = sh[textureIndex];
                        const byteIndexInTexture = shIndexWrite % 16; // [0..15]
                        const offsetPerSplat = i * 16; // 16 sh values per texture per splat.

                        const shValue = data.shN.codebook[shCentroids[(u + k) * 4 + j + v * shCentroidsWidth * 4]] * 127.5 + 127.5;
                        shArray[byteIndexInTexture + offsetPerSplat] = Math.max(0, Math.min(255, shValue));
                    }
                }
            }
        } else {
            for (let i = 0; i < splatCount; i++) {
                const n = shLabelsData[i * 4 + 0] + (shLabelsData[i * 4 + 1] << 8);
                const u = (n % 64) * coeffs;
                const v = Math.floor(n / 64);
                const shMin = data.shN.mins as number;
                const shMax = data.shN.maxs as number;

                for (let j = 0; j < 3; j++) {
                    for (let k = 0; k < coeffs / 3; k++) {
                        const shIndexWrite = k * 3 + j;
                        const textureIndex = Math.floor(shIndexWrite / 16);
                        const shArray = sh[textureIndex];
                        const byteIndexInTexture = shIndexWrite % 16; // [0..15]
                        const offsetPerSplat = i * 16; // 16 sh values per texture per splat.

                        const shValue = Scalar.Lerp(shMin, shMax, shCentroids[(u + k) * 4 + j + v * shCentroidsWidth * 4] / 255) * 127.5 + 127.5;
                        shArray[byteIndexInTexture + offsetPerSplat] = Math.max(0, Math.min(255, shValue));
                    }
                }
            }
        }
        return await new Promise((resolve) => {
            resolve({ mode: Mode.Splat, data: buffer, hasVertexColors: false, sh: sh });
        });
    }

    return await new Promise((resolve) => {
        resolve({ mode: Mode.Splat, data: buffer, hasVertexColors: false });
    });
}

/**
 * Parse SOG data from either a SOGRootData object (with webp files loaded from rootUrl) or from a Map of filenames to Uint8Array file data (including meta.json)
 * @param dataOrFiles Either the SOGRootData or a Map of filenames to Uint8Array file data (including meta.json)
 * @param rootUrl Base URL to load webp files from (if dataOrFiles is SOGRootData)
 * @param scene The Babylon.js scene
 * @returns Parsed data
 */
export async function ParseSogMeta(dataOrFiles: SOGRootData | Map<string, Uint8Array>, rootUrl: string, scene: Scene): Promise<IParsedPLY> {
    let data: SOGRootData;
    let files: Map<string, Uint8Array> | undefined;

    if (dataOrFiles instanceof Map) {
        files = dataOrFiles;

        const metaFile = files.get("meta.json");
        if (!metaFile) {
            throw new Error("meta.json not found in files Map");
        }

        data = JSON.parse(new TextDecoder().decode(metaFile)) as SOGRootData;
    } else {
        data = dataOrFiles;
    }

    // Collect all file names
    const urls = [...data.means.files, ...data.scales.files, ...data.quats.files, ...data.sh0.files];
    if (data.shN) {
        urls.push(...data.shN.files);
    }

    // Load webp images in parallel
    const imageDataArrays: IWebPImage[] = await Promise.all(
        urls.map(async (fileName) => {
            if (files && files.has(fileName)) {
                // load from in-memory Uint8Array
                const fileData = files.get(fileName)!;
                return await LoadWebpImageData(fileData, fileName, scene.getEngine());
            } else {
                // fallback: load from URL
                return await LoadWebpImageData(rootUrl, fileName, scene.getEngine());
            }
        })
    );

    return await ParseSogDatas(data, imageDataArrays, scene);
}

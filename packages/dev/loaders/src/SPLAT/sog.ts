import { type Scene } from "core/scene";
import { type IParsedSplat, type ISogTexturePack, Mode } from "./splatDefs";
import { AllocateShBuffers } from "core/Meshes/GaussianSplatting/gaussianSplattingMeshBase";
import { Scalar } from "core/Maths/math.scalar";
import { type AbstractEngine } from "core/Engines";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";

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

async function ParseSogDatas(data: SOGRootData, imageDataArrays: IWebPImage[], scene: Scene): Promise<IParsedSplat> {
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
        const coeffs = data.shN.bands ? (data.shN.bands + 1) ** 2 - 1 : data.shN.shape[1] / 3; // 3 components per coeff
        const shDegree = data.shN.bands !== undefined && data.shN.bands !== null ? data.shN.bands : Math.round(Math.sqrt(coeffs + 1) - 1);
        const shCentroids = imageDataArrays[5].bits;
        const shLabelsData = imageDataArrays[6].bits;
        const shCentroidsWidth = imageDataArrays[5].width;

        const shComponentCount = coeffs * 3;

        const textureCount = Math.ceil(shComponentCount / 16); // 4 components can be stored per texture, 4 sh per component
        //let shIndexRead = byteOffset;

        const engine = scene.getEngine();
        const width = engine.getCaps().maxTextureSize;
        const height = Math.ceil(splatCount / width);

        // sh is an array of uint8array that will be used to create sh textures
        const sh = AllocateShBuffers(textureCount, height * width * 4 * 4);

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
            resolve({ mode: Mode.Splat, data: buffer, hasVertexColors: false, sh: sh, shDegree: shDegree });
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
export async function ParseSogMeta(dataOrFiles: SOGRootData | Map<string, Uint8Array>, rootUrl: string, scene: Scene): Promise<IParsedSplat> {
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

function CreateSogTexture(scene: Scene, bits: Uint8Array, width: number, height: number): RawTexture {
    const tex = new RawTexture(bits, width, height, Constants.TEXTUREFORMAT_RGBA, scene, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE, Constants.TEXTURETYPE_UNSIGNED_BYTE);
    tex.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    tex.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    return tex;
}

function DecodeSogPositions(data: SOGRootData, meansl: Uint8Array, meansu: Uint8Array, splatCount: number): Float32Array {
    const unlog = (n: number) => Math.sign(n) * (Math.exp(Math.abs(n)) - 1);
    if (!Array.isArray(data.means.mins) || !Array.isArray(data.means.maxs)) {
        throw new Error("Missing arrays in SOG data.");
    }
    // Stride-4 layout (x,y,z,w) expected by the depth-sort worker and the centers texture.
    const positions = new Float32Array(splatCount * 4);
    for (let i = 0; i < splatCount; i++) {
        const index = i * 4;
        for (let j = 0; j < 3; j++) {
            const q = (meansu[index + j] << 8) | meansl[index + j];
            const n = Scalar.Lerp(data.means.mins[j], data.means.maxs[j], q / 65535);
            positions[i * 4 + j] = unlog(n);
        }
        positions[i * 4 + 3] = 1.0;
    }
    return positions;
}

/**
 * Parse SOG data and produce a set of GPU textures + dequantization parameters.
 * The shader will sample these raw RGBA8 textures and reconstruct positions/scales/rotations/colors/SH on the GPU.
 * @param dataOrFiles Either the SOGRootData or a Map of filenames to Uint8Array file data (including meta.json)
 * @param rootUrl Base URL to load webp files from (if dataOrFiles is SOGRootData)
 * @param scene The Babylon.js scene
 * @returns Parsed splat info with `sogTextures` populated.
 */
// eslint-disable-next-line @typescript-eslint/no-restricted-types
export async function ParseSogMetaAsTextures(dataOrFiles: SOGRootData | Map<string, Uint8Array>, rootUrl: string, scene: Scene): Promise<IParsedSplat> {
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

    const urls = [...data.means.files, ...data.scales.files, ...data.quats.files, ...data.sh0.files];
    if (data.shN) {
        urls.push(...data.shN.files);
    }

    const images: IWebPImage[] = await Promise.all(
        urls.map(async (fileName) => {
            if (files && files.has(fileName)) {
                return await LoadWebpImageData(files.get(fileName)!, fileName, scene.getEngine());
            }
            return await LoadWebpImageData(rootUrl, fileName, scene.getEngine());
        })
    );

    const splatCount = data.count ?? data.means.shape[0];
    const engine = scene.getEngine();
    const splatTextureWidth = Math.min(splatCount, engine.getCaps().maxTextureSize);
    const splatTextureHeight = Math.ceil(splatCount / splatTextureWidth);

    // means_l, means_u, scales, quats, sh0 share the same (w,h)
    const meansL = CreateSogTexture(scene, images[0].bits, splatTextureWidth, splatTextureHeight);
    const meansU = CreateSogTexture(scene, images[1].bits, splatTextureWidth, splatTextureHeight);
    const scales = CreateSogTexture(scene, images[2].bits, splatTextureWidth, splatTextureHeight);
    const quats = CreateSogTexture(scene, images[3].bits, splatTextureWidth, splatTextureHeight);
    const sh0 = CreateSogTexture(scene, images[4].bits, splatTextureWidth, splatTextureHeight);

    let shCentroids: RawTexture | undefined;
    let shLabels: RawTexture | undefined;
    let shCoeffCount = 0;
    let shDegree = 0;

    if (data.shN && images.length >= 7) {
        const centroidsImage = images[5];
        const labelsImage = images[6];
        const centroidsHeight = centroidsImage.bits.length / 4 / centroidsImage.width;
        shCentroids = CreateSogTexture(scene, centroidsImage.bits, centroidsImage.width, centroidsHeight);
        const labelsHeight = labelsImage.bits.length / 4 / labelsImage.width;
        shLabels = CreateSogTexture(scene, labelsImage.bits, labelsImage.width, labelsHeight);

        shCoeffCount = data.shN.bands ? (data.shN.bands + 1) ** 2 - 1 : data.shN.shape[1] / 3;
        shDegree = data.shN.bands ?? Math.round(Math.sqrt(shCoeffCount + 1) - 1);
    }

    // Optional codebook packed into a 1D R32F texture: [scales(256) | sh0(256) | shN(256)]
    let codebookTexture: RawTexture | undefined;
    if (data.version === 2) {
        const codebookSize = 256;
        const packed = new Float32Array(codebookSize * 3);
        if (data.scales.codebook) {
            packed.set(data.scales.codebook.slice(0, codebookSize), 0);
        }
        if (data.sh0.codebook) {
            packed.set(data.sh0.codebook.slice(0, codebookSize), codebookSize);
        }
        if (data.shN?.codebook) {
            packed.set(data.shN.codebook.slice(0, codebookSize), codebookSize * 2);
        }
        codebookTexture = new RawTexture(
            packed,
            codebookSize * 3,
            1,
            Constants.TEXTUREFORMAT_R,
            scene,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_FLOAT
        );
        codebookTexture.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        codebookTexture.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    }

    const meansMins = data.means.mins as number[];
    const meansMaxs = data.means.maxs as number[];

    const pack: ISogTexturePack = {
        version: (data.version === 2 ? 2 : 1) as 1 | 2,
        splatCount,
        shDegree,
        meansTextureL: meansL,
        meansTextureU: meansU,
        scalesTexture: scales,
        quatsTexture: quats,
        sh0Texture: sh0,
        shCentroidsTexture: shCentroids,
        shLabelsTexture: shLabels,
        codebookTexture,
        meansMin: [meansMins[0], meansMins[1], meansMins[2]],
        meansMax: [meansMaxs[0], meansMaxs[1], meansMaxs[2]],
        scalesMin: Array.isArray(data.scales.mins) ? [data.scales.mins[0], data.scales.mins[1], data.scales.mins[2]] : undefined,
        scalesMax: Array.isArray(data.scales.maxs) ? [data.scales.maxs[0], data.scales.maxs[1], data.scales.maxs[2]] : undefined,
        sh0Min: Array.isArray(data.sh0.mins) ? [data.sh0.mins[0], data.sh0.mins[1], data.sh0.mins[2], data.sh0.mins[3]] : undefined,
        sh0Max: Array.isArray(data.sh0.maxs) ? [data.sh0.maxs[0], data.sh0.maxs[1], data.sh0.maxs[2], data.sh0.maxs[3]] : undefined,
        shnMin: typeof data.shN?.mins === "number" ? data.shN.mins : undefined,
        shnMax: typeof data.shN?.maxs === "number" ? data.shN.maxs : undefined,
        shCoeffCount,
        positions: DecodeSogPositions(data, images[0].bits, images[1].bits, splatCount),
    };

    return { mode: Mode.Splat, data: new ArrayBuffer(0), hasVertexColors: false, shDegree, sogTextures: pack };
}

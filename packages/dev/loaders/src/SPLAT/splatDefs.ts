import { type BaseTexture } from "core/Materials/Textures/baseTexture.pure";

/**
 * Indicator of the parsed ply buffer. A standard ready to use splat or an array of positions for a point cloud
 */
export const enum Mode {
    Splat = 0,
    PointCloud = 1,
    Mesh = 2,
    Reject = 3,
}

/**
 * SOG (Self-Organized Gaussians) raw texture set + decoding parameters.
 * Used when SOG webp textures are fed directly to the GPU and dequantized in the shader.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ISogTexturePack {
    /** SOG file version (1 or 2). */
    version: 1 | 2;
    /** Number of splats. */
    splatCount: number;
    /** SH degree (0..3+). */
    shDegree: number;

    /** Raw webp textures, all RGBA8 with nearest sampling. */
    meansTextureL: BaseTexture;
    meansTextureU: BaseTexture;
    scalesTexture: BaseTexture;
    quatsTexture: BaseTexture;
    sh0Texture: BaseTexture;
    shCentroidsTexture?: BaseTexture;
    shLabelsTexture?: BaseTexture;

    /** Optional codebook (v2) packed into a 1D R32F texture. Encoding:
     *  - texels [0..255]   : scales codebook
     *  - texels [256..511] : sh0 codebook
     *  - texels [512..767] : shN codebook
     */
    codebookTexture?: BaseTexture;

    /** Mins/maxs (v1) used as uniforms. */
    meansMin: [number, number, number];
    meansMax: [number, number, number];
    scalesMin?: [number, number, number];
    scalesMax?: [number, number, number];
    sh0Min?: [number, number, number, number];
    sh0Max?: [number, number, number, number];
    shnMin?: number;
    shnMax?: number;

    /** SH layout info. */
    shCoeffCount: number;

    /** CPU-side decoded positions for the depth-sort worker. */
    positions: Float32Array;
}

/**
 * A parsed buffer and how to use it
 */
export interface IParsedSplat {
    data: ArrayBuffer;
    mode: Mode;
    faces?: number[];
    hasVertexColors?: boolean;
    sh?: Uint8Array[];
    shDegree?: number;
    trainedWithAntialiasing?: boolean;
    compressed?: boolean;
    rawSplat?: boolean;
    safeOrbitCameraRadiusMin?: number;
    safeOrbitCameraElevationMinMax?: [number, number];
    upAxis?: "X" | "Y" | "Z";
    chirality?: "LeftHanded" | "RightHanded";
    /** When set, the splats are to be uploaded as raw SOG textures and dequantized in the shader. */
    sogTextures?: ISogTexturePack;
}

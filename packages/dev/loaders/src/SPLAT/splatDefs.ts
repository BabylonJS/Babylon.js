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
 * A parsed buffer and how to use it
 */
export interface IParsedPLY {
    data: ArrayBuffer;
    mode: Mode;
    faces?: number[];
    hasVertexColors?: boolean;
    sh?: Uint8Array[];
    trainedWithAntialiasing?: boolean;
    compressed?: boolean;
    rawSplat?: boolean;
}

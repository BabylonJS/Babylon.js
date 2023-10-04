import type { Nullable } from "core/types";

/**
 * Interface used to define texture data
 */
export interface INodeGeometryTextureData {
    data: Nullable<Float32Array>;
    width: number;
    height: number;
}

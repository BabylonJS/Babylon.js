import type { Nullable } from "core/types";

/**
 * Interface used to define texture data
 */
export interface INodeGeometryTextureData {
    /** @internal */
    data: Nullable<Float32Array>;
    /** @internal */
    width: number;
    /** @internal */
    height: number;
}

import { Vector3 } from "core/Maths/math.vector";
import { Color4 } from "core/Maths/math.color";
import type { Mesh } from "core/Meshes/mesh";
import type { Material } from "core/Materials/material";

/**
 * Interface for SPS init block data
 */
export interface ISPSInitData {
    position?: Vector3 | (() => Vector3);
    velocity?: Vector3 | (() => Vector3);
    color?: Color4 | (() => Color4);
    scaling?: Vector3 | (() => Vector3);
    rotation?: Vector3 | (() => Vector3);
}

/**
 * Interface for SPS update block data
 */
export interface ISPSUpdateData {
    position?: Vector3 | (() => Vector3);
    velocity?: Vector3 | (() => Vector3);
    color?: Color4 | (() => Color4);
    scaling?: Vector3 | (() => Vector3);
    rotation?: Vector3 | (() => Vector3);
}

/**
 * Interface for SPS create block data
 */
export interface ISPSCreateData {
    mesh: Mesh;
    count: number;
    material?: Material;
    initBlock?: ISPSInitData;
    updateBlock?: ISPSUpdateData;
}

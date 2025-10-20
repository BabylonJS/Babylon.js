import { Vector3 } from "core/Maths/math.vector";
import { Color4 } from "core/Maths/math.color";
import type { Mesh } from "core/Meshes/mesh";
import type { Material } from "core/Materials/material";

/**
 * Interface for SPS update block data
 */
export interface ISPSUpdateData {
    position: () => Vector3;
    velocity: () => Vector3;
    color: () => Color4;
    scaling: () => Vector3;
    rotation: () => Vector3;
}

/**
 * Interface for SPS create block data
 */
export interface ISPSCreateData {
    mesh: Mesh;
    count: number;
    material?: Material;
    initBlock?: ISPSUpdateData;
    updateBlock?: ISPSUpdateData;
    shapeId?: number;
}

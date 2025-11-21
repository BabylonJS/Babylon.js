import type { Vector3 } from "core/Maths/math.vector";
import type { Color4 } from "core/Maths/math.color";
import type { Material } from "core/Materials/material";
import type { VertexData } from "core/Meshes/mesh.vertexData";

export interface ISpsMeshSourceData {
    customMeshName?: string;
    vertexData?: VertexData;
}

/**
 * Interface for SPS update block data
 */
export interface ISpsUpdateData {
    position?: () => Vector3;
    velocity?: () => Vector3;
    color?: () => Color4;
    scaling?: () => Vector3;
    rotation?: () => Vector3;
}

/**
 * Interface for SPS create block data
 */
export interface ISpsParticleConfigData {
    meshData: ISpsMeshSourceData | null;
    count: number;
    material?: Material;
    initBlock?: ISpsUpdateData;
    updateBlock?: ISpsUpdateData;
}

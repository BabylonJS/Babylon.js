import type { Vector3 } from "core/Maths/math.vector";
import type { Color4 } from "core/Maths/math.color";
import type { Material } from "core/Materials/material";
import type { VertexData } from "core/Meshes/mesh.vertexData";

/**
 *  Interface for solid particle mesh source data
 */
export interface ISolidParticleMeshSourceData {
    customMeshName?: string;
    vertexData?: VertexData;
}

/**
 * Interface for solid particle update block data
 */
export interface ISolidParticleUpdateData {
    position?: () => Vector3;
    velocity?: () => Vector3;
    color?: () => Color4;
    scaling?: () => Vector3;
    rotation?: () => Vector3;
}

/**
 * Interface for solid particle create block data
 */
export interface ISolidParticleInitData {
    meshData: ISolidParticleMeshSourceData | null;
    count: number;
    material?: Material;
    position?: () => Vector3;
    velocity?: () => Vector3;
    color?: () => Color4;
    scaling?: () => Vector3;
    rotation?: () => Vector3;
    lifeTime?: () => number;
    updateData?: ISolidParticleUpdateData | null;
}

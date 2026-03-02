import type { Effect } from "./effect";
import type { Nullable } from "../types";
import type { Geometry } from "../Meshes/geometry";

/**
 * Interface representing metadata for vertex pulling
 */
export interface IVertexPullingMetadata {
    /**
     * Offset in vertex buffer where data starts
     */
    offset: number;

    /**
     * Stride between elements in the vertex buffer
     */
    stride: number;

    /**
     * Type of the vertex buffer (e.g., float, int)
     */
    type: number; // VertexBuffer type constant

    /**
     * Whether integer data should be normalized when read
     */
    normalized: boolean;
}

// Store vertex pulling metadata per geometry
const _VertexPullingMetadataCache = new WeakMap<Geometry, Map<string, IVertexPullingMetadata>>();

/**
 * Prepares vertex pulling uniforms for the given attributes and mesh
 * @param geometry The geometry containing the vertex buffers
 * @returns A map of attribute names to their metadata, or null if unavailable
 */
export function PrepareVertexPullingUniforms(geometry: Geometry): Nullable<Map<string, IVertexPullingMetadata>> {
    const vertexBuffers = geometry.getVertexBuffers();
    if (!vertexBuffers) {
        return null;
    }

    // Check cache first
    let metadata = _VertexPullingMetadataCache.get(geometry);
    if (!metadata) {
        metadata = new Map<string, IVertexPullingMetadata>();
        _VertexPullingMetadataCache.set(geometry, metadata);
    } else {
        // Return cached metadata if it exists and hasn't changed
        let needsUpdate = false;
        for (const vb in vertexBuffers) {
            if (!metadata.has(vb)) {
                needsUpdate = true;
                break;
            }
        }
        if (!needsUpdate) {
            return metadata;
        }
    }

    // Build or update metadata
    for (const vb in vertexBuffers) {
        const vertexBuffer = vertexBuffers[vb];
        if (vertexBuffer) {
            const offset = vertexBuffer.byteOffset;
            const stride = vertexBuffer.byteStride;
            const type = vertexBuffer.type;
            const normalized = vertexBuffer.normalized;

            metadata.set(vb, {
                offset: offset,
                stride: stride,
                type: type,
                normalized: normalized,
            });
        }
    }

    return metadata;
}

/**
 * Bind vertex pulling uniforms to the effect
 * @param effect The effect to bind the uniforms to
 * @param metadata The vertex pulling metadata
 */
export function BindVertexPullingUniforms(effect: Effect, metadata: Map<string, IVertexPullingMetadata>): void {
    metadata.forEach((data, attribute) => {
        const uniformName = `vp_${attribute}_info`;
        // Pack into vec4: (offset, stride, type, normalized)
        effect.setFloat4(uniformName, data.offset, data.stride, data.type, data.normalized ? 1 : 0);
    });
}

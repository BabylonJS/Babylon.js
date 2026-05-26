/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXNode, findChildByName, getPropertyValue, cleanFBXName } from "../types/fbxTypes";

import { type FBXObjectMap, getChildren } from "./connections";

/** A single morph target (shape) within a blend shape channel */
export interface FBXShapeData {
    /** Sparse vertex indices affected by this shape */
    indices: Uint32Array;
    /** Absolute vertex positions for affected vertices [x,y,z,...] */
    vertices: Float64Array;
    /** Normals for affected vertices [x,y,z,...] (optional) */
    normals: Float64Array | null;
}

export interface FBXBlendShapeDiagnostic {
    type: "full-weights-mismatch" | "missing-full-weights";
    message: string;
    channelId: number;
    channelName: string;
}

/** A blend shape channel (one animatable morph target) */
export interface FBXBlendShapeChannelData {
    /** Channel name */
    name: string;
    /** Channel node ID */
    id: number;
    /** Default weight (0-100 in FBX) */
    deformPercent: number;
    /** Shape geometry (typically one per channel, but FBX supports in-between shapes) */
    shapes: FBXShapeData[];
    /** In-between full weights in FBX DeformPercent units (0-100), one per shape when present */
    fullWeights: number[] | null;
    /** Recoverable blend-shape diagnostics */
    diagnostics: FBXBlendShapeDiagnostic[];
}

/** A blend shape deformer attached to a geometry */
export interface FBXBlendShapeData {
    /** Deformer ID */
    id: number;
    /** Geometry ID this blend shape is attached to */
    geometryId: number;
    /** Channels (each is an animatable morph target) */
    channels: FBXBlendShapeChannelData[];
}

/**
 * Extract all blend shape deformers from the FBX scene.
 */
export function extractBlendShapes(objectMap: FBXObjectMap): FBXBlendShapeData[] {
    const blendShapes: FBXBlendShapeData[] = [];

    for (const [id, node] of Array.from(objectMap.objects)) {
        if (node.name === "Deformer" && getPropertyValue<string>(node, 2) === "BlendShape") {
            const bs = extractBlendShape(id, node, objectMap);
            if (bs) {
                blendShapes.push(bs);
            }
        }
    }

    return blendShapes;
}

function extractBlendShape(deformerId: number, _deformerNode: FBXNode, objectMap: FBXObjectMap): FBXBlendShapeData | null {
    // Find the geometry this blend shape is attached to
    const parent = objectMap.parentOf.get(deformerId);
    if (!parent) {
        return null;
    }

    const parentNode = objectMap.objects.get(parent.id);
    if (!parentNode || parentNode.name !== "Geometry") {
        return null;
    }

    const geometryId = parent.id;

    // Find BlendShapeChannel children
    const channels: FBXBlendShapeChannelData[] = [];
    const channelChildren = getChildren(objectMap, deformerId, "Deformer");

    for (const { id: channelId, node: channelNode } of channelChildren) {
        const subType = getPropertyValue<string>(channelNode, 2);
        if (subType !== "BlendShapeChannel") {
            continue;
        }

        const channelName = cleanFBXName(getPropertyValue<string>(channelNode, 1) ?? "MorphTarget");

        // Read DeformPercent from Properties70
        let deformPercent = 0;
        const props70 = findChildByName(channelNode, "Properties70");
        if (props70) {
            for (const p of props70.children) {
                if (p.name !== "P") {
                    continue;
                }
                const pName = getPropertyValue<string>(p, 0);
                if (pName === "DeformPercent") {
                    const val = p.properties[4]?.value;
                    if (typeof val === "number") {
                        deformPercent = val;
                    }
                }
            }
        }

        const rawFullWeights = extractFullWeights(channelNode);

        // Find connected Shape geometries
        const shapes: FBXShapeData[] = [];
        const shapeChildren = getChildren(objectMap, channelId, "Geometry");

        for (const { node: shapeNode } of shapeChildren) {
            const shapeSubType = getPropertyValue<string>(shapeNode, 2);
            if (shapeSubType !== "Shape") {
                continue;
            }

            const shape = extractShape(shapeNode);
            if (shape) {
                shapes.push(shape);
            }
        }

        if (shapes.length > 0) {
            const diagnostics: FBXBlendShapeDiagnostic[] = [];
            const fullWeights = normalizeFullWeights(rawFullWeights, shapes, channelId, channelName, diagnostics);
            channels.push({
                name: channelName,
                id: channelId,
                deformPercent,
                shapes: sortShapesByFullWeight(shapes, fullWeights),
                fullWeights: fullWeights ? [...fullWeights].sort((a, b) => a - b) : null,
                diagnostics,
            });
        }
    }

    if (channels.length === 0) {
        return null;
    }

    return {
        id: deformerId,
        geometryId,
        channels,
    };
}

function extractFullWeights(channelNode: FBXNode): number[] | null {
    const fullWeightsNode = findChildByName(channelNode, "FullWeights");
    const rawFullWeights = fullWeightsNode?.properties[0]?.value;
    if (!rawFullWeights) {
        return null;
    }

    if (rawFullWeights instanceof Float64Array || rawFullWeights instanceof Float32Array || rawFullWeights instanceof Int32Array) {
        return Array.from(rawFullWeights, (value) => Number(value));
    }
    return null;
}

function normalizeFullWeights(
    fullWeights: number[] | null,
    shapes: FBXShapeData[],
    channelId: number,
    channelName: string,
    diagnostics: FBXBlendShapeDiagnostic[]
): number[] | null {
    if (!fullWeights) {
        if (shapes.length > 1) {
            diagnostics.push({
                type: "missing-full-weights",
                message: "Blend shape channel has multiple shapes but no FullWeights; using the first shape for compatibility.",
                channelId,
                channelName,
            });
        }
        return null;
    }

    if (fullWeights.length !== shapes.length) {
        if (shapes.length === 1) {
            return null;
        }

        diagnostics.push({
            type: "full-weights-mismatch",
            message: `FullWeights length ${fullWeights.length} does not match shape count ${shapes.length}; using the first shape for compatibility.`,
            channelId,
            channelName,
        });
        return null;
    }

    return fullWeights;
}

function sortShapesByFullWeight(shapes: FBXShapeData[], fullWeights: number[] | null): FBXShapeData[] {
    if (!fullWeights || fullWeights.length !== shapes.length) {
        return shapes.length > 1 ? [shapes[0]] : shapes;
    }

    return shapes
        .map((shape, index) => ({ shape, weight: fullWeights[index] }))
        .sort((a, b) => a.weight - b.weight)
        .map((entry) => entry.shape);
}

function extractShape(shapeNode: FBXNode): FBXShapeData | null {
    // Shape has: Indexes (sparse vertex indices), Vertices (delta offsets from base), Normals (optional delta)
    const indexesNode = findChildByName(shapeNode, "Indexes");
    const verticesNode = findChildByName(shapeNode, "Vertices");

    if (!indexesNode || !verticesNode) {
        return null;
    }

    const rawIndices = indexesNode.properties[0]?.value;
    const rawVertices = verticesNode.properties[0]?.value;

    if (!rawIndices || !rawVertices) {
        return null;
    }

    const indices = toUint32Array(rawIndices);
    if (!indices) {
        return null;
    }

    // Convert vertices
    let vertices: Float64Array;
    if (rawVertices instanceof Float64Array) {
        vertices = rawVertices;
    } else if (rawVertices instanceof Float32Array) {
        vertices = new Float64Array(rawVertices);
    } else {
        return null;
    }

    // Optional normals
    let normals: Float64Array | null = null;
    const normalsNode = findChildByName(shapeNode, "Normals");
    if (normalsNode) {
        const rawNormals = normalsNode.properties[0]?.value;
        if (rawNormals instanceof Float64Array) {
            normals = rawNormals;
        } else if (rawNormals instanceof Float32Array) {
            normals = new Float64Array(rawNormals);
        }
    }

    return { indices, vertices, normals };
}

function toUint32Array(value: unknown): Uint32Array | null {
    if (value instanceof Uint32Array) {
        return value;
    }
    if (value instanceof Int32Array || value instanceof Float32Array || value instanceof Float64Array) {
        const result = new Uint32Array(value.length);
        for (let i = 0; i < value.length; i++) {
            result[i] = value[i];
        }
        return result;
    }
    return null;
}

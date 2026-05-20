/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXNode, findChildByName, findChildrenByName, getPropertyValue, cleanFBXName } from "../types/fbxTypes";

/** A named UV set */
export interface FBXUVSet {
    /** UV set name (e.g. "UVMap", "lightmap") */
    name: string;
    /** Per-vertex UV data [u,v, ...] (expanded to match triangle vertices) */
    data: Float64Array;
}

export interface FBXGeometryDiagnostic {
    type: "degenerate-polygon" | "triangulation-fallback" | "layer-index-out-of-bounds" | "layer-data-too-short";
    message: string;
    polygonIndex?: number;
    layerName?: string;
    index?: number;
}

/** Parsed geometry data ready for Babylon consumption */
export interface FBXGeometryData {
    /** Node ID from the FBX document */
    id: number;
    /** Geometry name */
    name: string;
    /** Flat array of vertex positions [x,y,z, x,y,z, ...] */
    positions: Float64Array;
    /** Triangle indices (already triangulated from n-gons) */
    indices: Uint32Array;
    /** Per-vertex normals [x,y,z, ...] (expanded to match triangle vertices) */
    normals: Float64Array | null;
    /** Per-vertex UVs [u,v, ...] (expanded to match triangle vertices) — first UV set for convenience */
    uvs: Float64Array | null;
    /** All UV sets (including the first) */
    uvSets: FBXUVSet[];
    /** Per-vertex colors [r,g,b,a, ...] (expanded to match triangle vertices) */
    colors: Float32Array | null;
    /** Per-vertex tangents [x,y,z,w, ...] expanded to match triangle vertices */
    tangents: Float64Array | null;
    /** Per-vertex binormals [x,y,z, ...] expanded to match triangle vertices */
    binormals: Float64Array | null;
    /** Control point index for each polygon-vertex (for skinning lookup) */
    controlPointIndices: Uint32Array | null;
    /** Per-triangle material index (which material each triangle belongs to) */
    materialIndices: Int32Array | null;
    /** Recoverable geometry import issues */
    diagnostics: FBXGeometryDiagnostic[];
}

/**
 * Extract geometry data from an FBX Geometry node.
 * Handles polygon triangulation and layer element expansion.
 */
export function extractGeometry(geometryNode: FBXNode, nodeId: number): FBXGeometryData {
    const name = cleanFBXName(getPropertyValue<string>(geometryNode, 1) ?? "Geometry");

    // Extract raw vertices
    const verticesNode = findChildByName(geometryNode, "Vertices");
    if (!verticesNode) {
        throw new Error(`Geometry '${name}' has no Vertices node`);
    }
    const rawPositions = toFloat64Array(getNodeArrayValue(verticesNode));

    // Extract polygon vertex indices
    const pviNode = findChildByName(geometryNode, "PolygonVertexIndex");
    if (!pviNode) {
        throw new Error(`Geometry '${name}' has no PolygonVertexIndex node`);
    }
    const rawIndices = toInt32Array(getNodeArrayValue(pviNode));
    const diagnostics: FBXGeometryDiagnostic[] = [];

    // Parse polygons from the FBX negative-index convention
    const polygons = parsePolygons(rawIndices);

    // Triangulate polygons while preserving polygon-vertex indices for layer data.
    const triangles = triangulatePolygons(polygons, rawPositions, diagnostics);

    // Build the list of polygon-vertex pairs for layer element expansion
    const polyVertexList = buildPolygonVertexList(polygons);

    // Extract normals
    const normalNode = findChildByName(geometryNode, "LayerElementNormal");
    let normals: Float64Array | null = null;
    if (normalNode) {
        normals = expandLayerElement(normalNode, "Normals", "NormalsIndex", polyVertexList, rawPositions.length / 3, 3, diagnostics);
    }

    // Extract all UV sets
    const uvNodes = findChildrenByName(geometryNode, "LayerElementUV");
    const uvSets: FBXUVSet[] = [];
    for (const uvNode of uvNodes) {
        const nameNode = findChildByName(uvNode, "Name");
        const setName = nameNode ? (getPropertyValue<string>(nameNode, 0) ?? `UVSet${uvSets.length}`) : `UVSet${uvSets.length}`;
        const data = expandLayerElement(uvNode, "UV", "UVIndex", polyVertexList, rawPositions.length / 3, 2, diagnostics);
        if (data) {
            uvSets.push({ name: setName, data });
        }
    }
    const uvs = uvSets.length > 0 ? uvSets[0].data : null;

    // Extract vertex colors
    const colorNode = findChildByName(geometryNode, "LayerElementColor");
    let colors: Float32Array | null = null;
    if (colorNode) {
        const colorData = expandLayerElement(colorNode, "Colors", "ColorIndex", polyVertexList, rawPositions.length / 3, 4, diagnostics);
        if (colorData) {
            colors = new Float32Array(colorData.length);
            for (let i = 0; i < colorData.length; i++) {
                colors[i] = colorData[i];
            }
        }
    }

    const tangentNode = findChildByName(geometryNode, "LayerElementTangent");
    const binormalNode = findChildByName(geometryNode, "LayerElementBinormal");
    const binormals = binormalNode ? expandLayerElement(binormalNode, "Binormals", "BinormalsIndex", polyVertexList, rawPositions.length / 3, 3, diagnostics) : null;
    const tangents = tangentNode ? expandTangentLayer(tangentNode, polyVertexList, rawPositions.length / 3, normals, binormals, diagnostics) : null;

    // Extract per-polygon material indices
    const matNode = findChildByName(geometryNode, "LayerElementMaterial");
    let polyMaterialIndices: Int32Array | null = null;
    if (matNode) {
        polyMaterialIndices = extractMaterialIndices(matNode, polygons.length);
    }

    // Build final indexed mesh with expanded per-triangle-vertex attributes
    const result = buildTriangleMesh(rawPositions, triangles, polyVertexList, normals, uvs, uvSets, colors, tangents, binormals);

    // Expand per-polygon material indices to per-triangle
    let materialIndices: Int32Array | null = null;
    if (polyMaterialIndices) {
        // Check if all polygons use the same material (optimization)
        let allSame = true;
        const firstMat = polyMaterialIndices[0];
        for (let i = 1; i < polyMaterialIndices.length; i++) {
            if (polyMaterialIndices[i] !== firstMat) {
                allSame = false;
                break;
            }
        }

        if (!allSame) {
            const triCount = result.indices.length / 3;
            materialIndices = new Int32Array(triCount);
            for (let ti = 0; ti < triangles.length; ti++) {
                materialIndices[ti] = polyMaterialIndices[triangles[ti].polyIndex] ?? 0;
            }
        }
    }

    return {
        id: nodeId,
        name,
        positions: result.positions,
        indices: result.indices,
        normals: result.normals,
        uvs: result.uvs,
        uvSets: result.uvSets,
        colors: result.colors,
        tangents: result.tangents,
        binormals: result.binormals,
        controlPointIndices: result.controlPointIndices,
        materialIndices,
        diagnostics,
    };
}

// ── Polygon Parsing ────────────────────────────────────────────────────────────

interface Polygon {
    /** Control point indices for this polygon */
    indices: number[];
    /** Starting index in the original PolygonVertexIndex array */
    startIndex: number;
}

interface Triangle {
    vertices: [number, number, number];
    polyIndex: number;
}

function parsePolygons(rawIndices: Int32Array): Polygon[] {
    const polygons: Polygon[] = [];
    let currentPoly: number[] = [];
    let startIndex = 0;

    for (let i = 0; i < rawIndices.length; i++) {
        const idx = rawIndices[i];
        if (idx < 0) {
            // End of polygon: actual index is -(idx + 1)
            currentPoly.push(-(idx + 1));
            polygons.push({ indices: currentPoly, startIndex });
            currentPoly = [];
            startIndex = i + 1;
        } else {
            currentPoly.push(idx);
        }
    }

    return polygons;
}

function triangulatePolygons(polygons: Polygon[], rawPositions: Float64Array, diagnostics: FBXGeometryDiagnostic[]): Triangle[] {
    const triangles: Triangle[] = [];

    for (let polyIndex = 0; polyIndex < polygons.length; polyIndex++) {
        const poly = polygons[polyIndex];
        triangles.push(...triangulatePolygon(poly, polyIndex, rawPositions, diagnostics));
    }

    return triangles;
}

function triangulatePolygon(poly: Polygon, polyIndex: number, rawPositions: Float64Array, diagnostics: FBXGeometryDiagnostic[]): Triangle[] {
    if (poly.indices.length < 3) {
        diagnostics.push({
            type: "degenerate-polygon",
            message: `Polygon ${polyIndex} has fewer than three vertices.`,
            polygonIndex: polyIndex,
        });
        return [];
    }
    if (poly.indices.length === 3) {
        return [{ vertices: [poly.startIndex, poly.startIndex + 1, poly.startIndex + 2], polyIndex }];
    }

    const projected = projectPolygonTo2D(poly, rawPositions);
    if (!projected) {
        diagnostics.push({
            type: "degenerate-polygon",
            message: `Polygon ${polyIndex} has a near-zero normal; using fan triangulation.`,
            polygonIndex: polyIndex,
        });
        return fanTriangulate(poly, polyIndex);
    }

    const polygonArea = signedArea2D(projected);
    if (Math.abs(polygonArea) < 1e-12) {
        diagnostics.push({
            type: "degenerate-polygon",
            message: `Polygon ${polyIndex} projects to near-zero area; using fan triangulation.`,
            polygonIndex: polyIndex,
        });
        return fanTriangulate(poly, polyIndex);
    }

    const isCCW = polygonArea > 0;
    const remaining = poly.indices.map((_, i) => i);
    const clipped: Triangle[] = [];
    let guard = 0;

    while (remaining.length > 3 && guard++ < poly.indices.length * poly.indices.length) {
        let clippedEar = false;

        for (let i = 0; i < remaining.length; i++) {
            const prev = remaining[(i + remaining.length - 1) % remaining.length];
            const curr = remaining[i];
            const next = remaining[(i + 1) % remaining.length];

            if (!isConvex(projected[prev], projected[curr], projected[next], isCCW)) {
                continue;
            }
            if (containsAnyPoint(projected, remaining, prev, curr, next)) {
                continue;
            }

            clipped.push({
                vertices: [poly.startIndex + prev, poly.startIndex + curr, poly.startIndex + next],
                polyIndex,
            });
            remaining.splice(i, 1);
            clippedEar = true;
            break;
        }

        if (!clippedEar) {
            diagnostics.push({
                type: "triangulation-fallback",
                message: `Polygon ${polyIndex} could not be fully ear-clipped; using fan triangulation.`,
                polygonIndex: polyIndex,
            });
            return fanTriangulate(poly, polyIndex);
        }
    }

    clipped.push({
        vertices: [poly.startIndex + remaining[0], poly.startIndex + remaining[1], poly.startIndex + remaining[2]],
        polyIndex,
    });
    return clipped;
}

function fanTriangulate(poly: Polygon, polyIndex: number): Triangle[] {
    const triangles: Triangle[] = [];
    for (let i = 1; i < poly.indices.length - 1; i++) {
        triangles.push({
            vertices: [poly.startIndex, poly.startIndex + i, poly.startIndex + i + 1],
            polyIndex,
        });
    }
    return triangles;
}

function projectPolygonTo2D(poly: Polygon, rawPositions: Float64Array): [number, number][] | null {
    const normal = computeNewellNormal(poly, rawPositions);
    const ax = Math.abs(normal[0]);
    const ay = Math.abs(normal[1]);
    const az = Math.abs(normal[2]);
    if (ax + ay + az < 1e-12) {
        return null;
    }

    const dropAxis = ax > ay && ax > az ? 0 : ay > az ? 1 : 2;
    return poly.indices.map((cp) => {
        const x = rawPositions[cp * 3];
        const y = rawPositions[cp * 3 + 1];
        const z = rawPositions[cp * 3 + 2];
        if (dropAxis === 0) {
            return normal[0] >= 0 ? [y, z] : [z, y];
        }
        if (dropAxis === 1) {
            return normal[1] >= 0 ? [z, x] : [x, z];
        }
        return normal[2] >= 0 ? [x, y] : [y, x];
    });
}

function computeNewellNormal(poly: Polygon, rawPositions: Float64Array): [number, number, number] {
    let nx = 0;
    let ny = 0;
    let nz = 0;
    for (let i = 0; i < poly.indices.length; i++) {
        const current = poly.indices[i] * 3;
        const next = poly.indices[(i + 1) % poly.indices.length] * 3;
        const x0 = rawPositions[current];
        const y0 = rawPositions[current + 1];
        const z0 = rawPositions[current + 2];
        const x1 = rawPositions[next];
        const y1 = rawPositions[next + 1];
        const z1 = rawPositions[next + 2];
        nx += (y0 - y1) * (z0 + z1);
        ny += (z0 - z1) * (x0 + x1);
        nz += (x0 - x1) * (y0 + y1);
    }
    return [nx, ny, nz];
}

function signedArea2D(points: [number, number][]): number {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        area += a[0] * b[1] - b[0] * a[1];
    }
    return area / 2;
}

function isConvex(a: [number, number], b: [number, number], c: [number, number], isCCW: boolean): boolean {
    const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    return isCCW ? cross > 1e-12 : cross < -1e-12;
}

function containsAnyPoint(points: [number, number][], remaining: number[], prev: number, curr: number, next: number): boolean {
    for (const index of remaining) {
        if (index === prev || index === curr || index === next) {
            continue;
        }
        if (pointInTriangle(points[index], points[prev], points[curr], points[next])) {
            return true;
        }
    }
    return false;
}

function pointInTriangle(p: [number, number], a: [number, number], b: [number, number], c: [number, number]): boolean {
    const area = Math.abs(cross2D(a, b, c));
    const area1 = Math.abs(cross2D(p, a, b));
    const area2 = Math.abs(cross2D(p, b, c));
    const area3 = Math.abs(cross2D(p, c, a));
    return Math.abs(area - (area1 + area2 + area3)) < 1e-10;
}

function cross2D(a: [number, number], b: [number, number], c: [number, number]): number {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

/** Build a flat list of (polygonIndex, vertexInPolygon, controlPointIndex) for each polygon vertex */
interface PolyVertex {
    polyIndex: number;
    vertexInPoly: number;
    controlPointIndex: number;
    /** Global polygon-vertex index (position in the original PolygonVertexIndex array) */
    globalIndex: number;
}

function buildPolygonVertexList(polygons: Polygon[]): PolyVertex[] {
    const list: PolyVertex[] = [];
    for (let pi = 0; pi < polygons.length; pi++) {
        const poly = polygons[pi];
        for (let vi = 0; vi < poly.indices.length; vi++) {
            list.push({
                polyIndex: pi,
                vertexInPoly: vi,
                controlPointIndex: poly.indices[vi],
                globalIndex: poly.startIndex + vi,
            });
        }
    }
    return list;
}

// ── Layer Element Expansion ────────────────────────────────────────────────────

/**
 * Extract per-polygon material indices from LayerElementMaterial.
 * Returns an Int32Array with one material index per polygon.
 */
function extractMaterialIndices(matNode: FBXNode, polygonCount: number): Int32Array | null {
    const mappingNode = findChildByName(matNode, "MappingInformationType");
    const referenceNode = findChildByName(matNode, "ReferenceInformationType");

    if (!mappingNode || !referenceNode) {
        return null;
    }

    const mapping = getPropertyValue<string>(mappingNode, 0) ?? "";
    const reference = getPropertyValue<string>(referenceNode, 0) ?? "";

    if (mapping === "AllSame") {
        // All polygons use material index 0
        const indices = new Int32Array(polygonCount);
        return indices; // already filled with 0
    }

    if (mapping === "ByPolygon") {
        const materialsNode = findChildByName(matNode, "Materials");
        if (!materialsNode) {
            return null;
        }
        const rawIndices = toInt32Array(getNodeArrayValue(materialsNode));
        // For Direct reference, the Materials array has one index per polygon
        if (reference === "Direct" || reference === "IndexToDirect") {
            return rawIndices;
        }
    }

    return null;
}

function expandLayerElement(
    layerNode: FBXNode,
    dataChildName: string,
    indexChildName: string,
    polyVertexList: PolyVertex[],
    controlPointCount: number,
    stride: number,
    diagnostics: FBXGeometryDiagnostic[]
): Float64Array | null {
    const mappingNode = findChildByName(layerNode, "MappingInformationType");
    const referenceNode = findChildByName(layerNode, "ReferenceInformationType");

    if (!mappingNode || !referenceNode) {
        return null;
    }

    const mapping = getPropertyValue<string>(mappingNode, 0) ?? "";
    const reference = getPropertyValue<string>(referenceNode, 0) ?? "";

    const dataNode = findChildByName(layerNode, dataChildName);
    if (!dataNode) {
        return null;
    }
    const data = toFloat64Array(getNodeArrayValue(dataNode));

    let indexData: Int32Array | null = null;
    if (reference === "IndexToDirect") {
        const indexNode = findChildByName(layerNode, indexChildName);
        if (indexNode) {
            indexData = toInt32Array(getNodeArrayValue(indexNode));
        }
    }

    // Expand to per-polygon-vertex
    const result = new Float64Array(polyVertexList.length * stride);

    for (let i = 0; i < polyVertexList.length; i++) {
        const pv = polyVertexList[i];
        let dataIndex: number;

        if (mapping === "ByPolygonVertex") {
            if (reference === "IndexToDirect" && indexData) {
                dataIndex = indexData[pv.globalIndex];
            } else {
                // Direct
                dataIndex = pv.globalIndex;
            }
        } else if (mapping === "ByControlPoint" || mapping === "ByVertice") {
            if (reference === "IndexToDirect" && indexData) {
                dataIndex = indexData[pv.controlPointIndex];
            } else {
                dataIndex = pv.controlPointIndex;
            }
        } else if (mapping === "ByPolygon") {
            if (reference === "IndexToDirect" && indexData) {
                dataIndex = indexData[pv.polyIndex];
            } else {
                dataIndex = pv.polyIndex;
            }
        } else if (mapping === "AllSame") {
            dataIndex = 0;
        } else {
            dataIndex = pv.globalIndex;
        }

        for (let s = 0; s < stride; s++) {
            const sourceIndex = dataIndex * stride + s;
            if (dataIndex < 0 || sourceIndex >= data.length) {
                diagnostics.push({
                    type: sourceIndex >= data.length ? "layer-data-too-short" : "layer-index-out-of-bounds",
                    message: `Layer '${layerNode.name}' references unavailable element ${dataIndex}.`,
                    layerName: layerNode.name,
                    index: dataIndex,
                });
                result[i * stride + s] = 0;
            } else {
                result[i * stride + s] = data[sourceIndex];
            }
        }
    }

    return result;
}

function expandTangentLayer(
    tangentNode: FBXNode,
    polyVertexList: PolyVertex[],
    controlPointCount: number,
    normals: Float64Array | null,
    binormals: Float64Array | null,
    diagnostics: FBXGeometryDiagnostic[]
): Float64Array | null {
    const sourceStride = inferLayerElementStride(tangentNode, "Tangents", "TangentsIndex", polyVertexList, controlPointCount, diagnostics);
    const expanded = expandLayerElement(tangentNode, "Tangents", "TangentsIndex", polyVertexList, controlPointCount, sourceStride, diagnostics);
    if (!expanded) {
        return null;
    }

    const tangents = new Float64Array(polyVertexList.length * 4);
    for (let i = 0; i < polyVertexList.length; i++) {
        const sourceOffset = i * sourceStride;
        const destOffset = i * 4;
        tangents[destOffset] = expanded[sourceOffset];
        tangents[destOffset + 1] = expanded[sourceOffset + 1];
        tangents[destOffset + 2] = expanded[sourceOffset + 2];
        tangents[destOffset + 3] = sourceStride >= 4 ? expanded[sourceOffset + 3] : computeTangentHandedness(i, tangents, normals, binormals);
    }
    return tangents;
}

function inferLayerElementStride(
    layerNode: FBXNode,
    dataChildName: string,
    indexChildName: string,
    polyVertexList: PolyVertex[],
    controlPointCount: number,
    diagnostics: FBXGeometryDiagnostic[]
): number {
    const dataNode = findChildByName(layerNode, dataChildName);
    if (!dataNode) {
        return 3;
    }
    const data = toFloat64Array(getNodeArrayValue(dataNode));
    const mapping = getPropertyValue<string>(findChildByName(layerNode, "MappingInformationType") ?? { name: "", properties: [], children: [] }, 0) ?? "";
    const reference = getPropertyValue<string>(findChildByName(layerNode, "ReferenceInformationType") ?? { name: "", properties: [], children: [] }, 0) ?? "";
    const indexNode = findChildByName(layerNode, indexChildName);
    const indexData = indexNode ? toInt32Array(getNodeArrayValue(indexNode)) : null;
    const directCount =
        reference === "IndexToDirect" && indexData
            ? Math.max(...Array.from(indexData), 0) + 1
            : mapping === "ByControlPoint" || mapping === "ByVertice"
              ? controlPointCount
              : mapping === "AllSame"
                ? 1
                : polyVertexList.length;

    if (directCount > 0 && data.length % directCount === 0) {
        const stride = data.length / directCount;
        if (stride === 3 || stride === 4) {
            return stride;
        }
    }

    diagnostics.push({
        type: "layer-data-too-short",
        message: `Could not infer stride for layer '${layerNode.name}', defaulting to 3.`,
        layerName: layerNode.name,
    });
    return 3;
}

function computeTangentHandedness(vertexIndex: number, tangents: Float64Array, normals: Float64Array | null, binormals: Float64Array | null): number {
    if (!normals || !binormals) {
        return 1;
    }
    const to = vertexIndex * 4;
    const no = vertexIndex * 3;
    const nx = normals[no];
    const ny = normals[no + 1];
    const nz = normals[no + 2];
    const tx = tangents[to];
    const ty = tangents[to + 1];
    const tz = tangents[to + 2];
    const bx = binormals[no];
    const by = binormals[no + 1];
    const bz = binormals[no + 2];
    const cx = ny * tz - nz * ty;
    const cy = nz * tx - nx * tz;
    const cz = nx * ty - ny * tx;
    return cx * bx + cy * by + cz * bz < 0 ? -1 : 1;
}

// ── Final Mesh Assembly ────────────────────────────────────────────────────────

interface TriangleMeshData {
    positions: Float64Array;
    indices: Uint32Array;
    normals: Float64Array | null;
    uvs: Float64Array | null;
    uvSets: FBXUVSet[];
    colors: Float32Array | null;
    tangents: Float64Array | null;
    binormals: Float64Array | null;
    controlPointIndices: Uint32Array;
}

/**
 * Build the final triangle mesh. Since normals/UVs are per-polygon-vertex,
 * we need to create unique vertices for each polygon-vertex combination.
 */
function buildTriangleMesh(
    rawPositions: Float64Array,
    triangles: Triangle[],
    polyVertexList: PolyVertex[],
    expandedNormals: Float64Array | null,
    expandedUVs: Float64Array | null,
    expandedUVSets: FBXUVSet[],
    expandedColors: Float32Array | null,
    expandedTangents: Float64Array | null,
    expandedBinormals: Float64Array | null
): TriangleMeshData {
    // Each polygon-vertex becomes a unique vertex in the output
    const vertexCount = polyVertexList.length;
    const positions = new Float64Array(vertexCount * 3);
    const controlPointIndices = new Uint32Array(vertexCount);

    // Copy positions — keep in original RH space (root node handles RH→LH conversion)
    for (let i = 0; i < polyVertexList.length; i++) {
        const cp = polyVertexList[i].controlPointIndex;
        positions[i * 3] = rawPositions[cp * 3];
        positions[i * 3 + 1] = rawPositions[cp * 3 + 1];
        positions[i * 3 + 2] = rawPositions[cp * 3 + 2];
        controlPointIndices[i] = cp;
    }

    // Normals stay in RH space (root node handles conversion)
    if (expandedNormals) {
        // No transformation needed
    }

    // Keep original winding order — Z negation handles handedness
    const indexCount = triangles.length * 3;
    const indices = new Uint32Array(indexCount);
    for (let i = 0; i < triangles.length; i++) {
        indices[i * 3] = triangles[i].vertices[0];
        indices[i * 3 + 1] = triangles[i].vertices[1];
        indices[i * 3 + 2] = triangles[i].vertices[2];
    }

    return {
        positions,
        indices,
        normals: expandedNormals,
        uvs: expandedUVs,
        uvSets: expandedUVSets,
        colors: expandedColors,
        tangents: expandedTangents,
        binormals: expandedBinormals,
        controlPointIndices,
    };
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function toFloat64Array(value: unknown): Float64Array {
    if (value instanceof Float64Array) {
        return value;
    }
    if (value instanceof Float32Array) {
        return new Float64Array(value);
    }
    if (value instanceof Int32Array) {
        return new Float64Array(value);
    }
    if (Array.isArray(value)) {
        const result = new Float64Array(value.length);
        for (let i = 0; i < value.length; i++) {
            result[i] = Number(value[i]);
        }
        return result;
    }
    throw new Error(`Cannot convert ${typeof value} to Float64Array`);
}

function toInt32Array(value: unknown): Int32Array {
    if (value instanceof Int32Array) {
        return value;
    }
    if (value instanceof Float64Array) {
        const result = new Int32Array(value.length);
        for (let i = 0; i < value.length; i++) {
            result[i] = Math.round(value[i]);
        }
        return result;
    }
    if (value instanceof Float32Array) {
        const result = new Int32Array(value.length);
        for (let i = 0; i < value.length; i++) {
            result[i] = Math.round(value[i]);
        }
        return result;
    }
    if (Array.isArray(value)) {
        const result = new Int32Array(value.length);
        for (let i = 0; i < value.length; i++) {
            result[i] = Math.round(Number(value[i]));
        }
        return result;
    }
    throw new Error(`Cannot convert ${typeof value} to Int32Array`);
}

function getNodeArrayValue(node: FBXNode): unknown {
    if (node.properties.length === 1) {
        return node.properties[0].value;
    }
    return node.properties.map((property) => property.value);
}

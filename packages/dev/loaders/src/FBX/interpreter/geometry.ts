/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXNode, findChildByName, findChildrenByName, getPropertyValue, cleanFBXName, getNodeArray } from "../types/fbxTypes";

/** A named UV set */
export interface FBXUVSet {
    /** UV set name (e.g. "UVMap", "lightmap") */
    name: string;
    /** Per-vertex UV data [u,v, ...] (expanded to match triangle vertices) */
    data: Float64Array;
}

/** Recoverable geometry import issue. */
export interface FBXGeometryDiagnostic {
    /** Diagnostic category. */
    type:
        "degenerate-polygon" | "triangulation-fallback" | "layer-index-out-of-bounds" | "layer-data-too-short" | "nurbs-invalid" | "nurbs-trim-ignored" | "nurbs-deformer-ignored";
    /** Human-readable diagnostic message. */
    message: string;
    /** Polygon index associated with the diagnostic, if applicable. */
    polygonIndex?: number;
    /** Layer element name associated with the diagnostic, if applicable. */
    layerName?: string;
    /** Source data index associated with the diagnostic, if applicable. */
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
    // Edge-only meshes (e.g. Blender edge circles) and empty placeholders have no vertices or polygons; they
    // become geometry with zero triangles rather than errors.
    const verticesNode = findChildByName(geometryNode, "Vertices");
    const rawPositions = verticesNode ? toFloat64Array(getNodeArrayValue(verticesNode)) : new Float64Array(0);

    // Extract polygon vertex indices
    const pviNode = findChildByName(geometryNode, "PolygonVertexIndex");
    const rawIndices = pviNode ? toInt32Array(getNodeArrayValue(pviNode)) : new Int32Array(0);
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

        if (!allSame || firstMat !== 0) {
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
    const clipped = earClip(projected, isCCW, polygonArea);
    if (!clipped) {
        diagnostics.push({
            type: "triangulation-fallback",
            message: `Polygon ${polyIndex} could not be fully ear-clipped; using fan triangulation.`,
            polygonIndex: polyIndex,
        });
        return fanTriangulate(poly, polyIndex);
    }
    return clipped.map(([a, b, c]) => ({ vertices: [poly.startIndex + a, poly.startIndex + b, poly.startIndex + c] as [number, number, number], polyIndex }));
}

/**
 * Ear clipping on a doubly linked vertex ring. Only reflex vertices can lie inside a candidate ear, so the
 * containment test walks the reflex vertices alone, and the scan resumes after the last clipped ear instead of
 * restarting, which keeps large n-gons (thousands of vertices) at roughly quadratic cost in the reflex count.
 * @returns triangles as local vertex indices, or null when no ear can be found (self-intersecting input)
 */
function earClip(points: [number, number][], isCCW: boolean, polygonArea: number): [number, number, number][] | null {
    const n = points.length;
    const prev = new Int32Array(n);
    const next = new Int32Array(n);
    for (let i = 0; i < n; i++) {
        prev[i] = (i + n - 1) % n;
        next[i] = (i + 1) % n;
    }
    // Tolerances scale with the polygon so huge and tiny coordinates behave the same.
    const eps = Math.abs(polygonArea) * 1e-12 + 1e-300;
    const sign = isCCW ? 1 : -1;
    const turn = (i: number): number => sign * cross2D(points[prev[i]], points[i], points[next[i]]);
    const reflex = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        reflex[i] = turn(i) < -eps ? 1 : 0;
    }
    const inside = (p: [number, number], a: [number, number], b: [number, number], c: [number, number]): boolean => {
        // Inside or on the boundary of the (consistently oriented) triangle
        return sign * cross2D(a, b, p) >= -eps && sign * cross2D(b, c, p) >= -eps && sign * cross2D(c, a, p) >= -eps;
    };

    const triangles: [number, number, number][] = [];
    let remaining = n;
    let i = 0;
    let visitedSinceClip = 0;
    while (remaining > 3) {
        const a = prev[i];
        const c = next[i];
        let clip = false;
        if (!reflex[i]) {
            const t = turn(i);
            if (t <= eps) {
                // Collinear vertex: its ear is a zero-area sliver, kept so every n-gon still yields n - 2 triangles.
                clip = true;
                triangles.push([a, i, c]);
            } else {
                clip = true;
                for (let j = next[c]; j !== a; j = next[j]) {
                    if (reflex[j] && inside(points[j], points[a], points[i], points[c])) {
                        clip = false;
                        break;
                    }
                }
                if (clip) {
                    triangles.push([a, i, c]);
                }
            }
        }
        if (clip) {
            next[a] = c;
            prev[c] = a;
            remaining--;
            reflex[a] = turn(a) < -eps ? 1 : 0;
            reflex[c] = turn(c) < -eps ? 1 : 0;
            i = c;
            visitedSinceClip = 0;
            continue;
        }
        i = c;
        if (++visitedSinceClip > remaining) {
            return null;
        }
    }
    const last = i;
    triangles.push([prev[last], last, next[last]]);
    return triangles;
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
        const materialsNode = findChildByName(matNode, "Materials");
        const rawIndices = materialsNode ? toInt32Array(getNodeArrayValue(materialsNode)) : null;
        const materialIndex = rawIndices && rawIndices.length > 0 ? rawIndices[0] : 0;
        const indices = new Int32Array(polygonCount);
        if (materialIndex !== 0) {
            indices.fill(materialIndex);
        }
        return indices;
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
    // FBX stores every attribute per polygon-vertex. Polygon-vertices that share the control point and all attribute
    // values are welded into one output vertex (this is what every DCC does on import); polygon-vertices that differ
    // in any attribute (hard edges, UV seams) stay separate. Skinning and blend shapes index by control point, so
    // welding is transparent to them.
    const polyVertexCount = polyVertexList.length;
    const remap = new Uint32Array(polyVertexCount);
    const unique: number[] = [];
    const keyToIndex = new Map<string, number>();
    const uvSetCount = expandedUVSets.length;
    for (let i = 0; i < polyVertexCount; i++) {
        let key = String(polyVertexList[i].controlPointIndex);
        if (expandedNormals) {
            key += `|${expandedNormals[i * 3]},${expandedNormals[i * 3 + 1]},${expandedNormals[i * 3 + 2]}`;
        }
        for (let u = 0; u < uvSetCount; u++) {
            const d = expandedUVSets[u].data;
            key += `|${d[i * 2]},${d[i * 2 + 1]}`;
        }
        if (expandedColors) {
            key += `|${expandedColors[i * 4]},${expandedColors[i * 4 + 1]},${expandedColors[i * 4 + 2]},${expandedColors[i * 4 + 3]}`;
        }
        if (expandedTangents) {
            key += `|${expandedTangents[i * 4]},${expandedTangents[i * 4 + 1]},${expandedTangents[i * 4 + 2]},${expandedTangents[i * 4 + 3]}`;
        }
        let index = keyToIndex.get(key);
        if (index === undefined) {
            index = unique.length;
            keyToIndex.set(key, index);
            unique.push(i);
        }
        remap[i] = index;
    }

    const vertexCount = unique.length;
    const positions = new Float64Array(vertexCount * 3);
    const controlPointIndices = new Uint32Array(vertexCount);
    const gather = (src: Float64Array | Float32Array | null, stride: number, ctor: typeof Float64Array | typeof Float32Array) => {
        if (!src) {
            return null;
        }
        const out = new ctor(vertexCount * stride);
        for (let v = 0; v < vertexCount; v++) {
            const srcIndex = unique[v] * stride;
            for (let k = 0; k < stride; k++) {
                out[v * stride + k] = src[srcIndex + k];
            }
        }
        return out;
    };

    // Positions come from control points — keep in original RH space (root node handles RH→LH conversion)
    for (let v = 0; v < vertexCount; v++) {
        const cp = polyVertexList[unique[v]].controlPointIndex;
        positions[v * 3] = rawPositions[cp * 3];
        positions[v * 3 + 1] = rawPositions[cp * 3 + 1];
        positions[v * 3 + 2] = rawPositions[cp * 3 + 2];
        controlPointIndices[v] = cp;
    }

    // Keep original winding order — Z negation handles handedness
    const indexCount = triangles.length * 3;
    const indices = new Uint32Array(indexCount);
    for (let i = 0; i < triangles.length; i++) {
        indices[i * 3] = remap[triangles[i].vertices[0]];
        indices[i * 3 + 1] = remap[triangles[i].vertices[1]];
        indices[i * 3 + 2] = remap[triangles[i].vertices[2]];
    }

    const uvSets: FBXUVSet[] = expandedUVSets.map((set) => ({ name: set.name, data: gather(set.data, 2, Float64Array) as Float64Array }));

    return {
        positions,
        indices,
        normals: gather(expandedNormals, 3, Float64Array) as Float64Array | null,
        uvs: uvSets.length > 0 ? uvSets[0].data : (gather(expandedUVs, 2, Float64Array) as Float64Array | null),
        uvSets,
        colors: gather(expandedColors, 4, Float32Array) as Float32Array | null,
        tangents: gather(expandedTangents, 4, Float64Array) as Float64Array | null,
        binormals: gather(expandedBinormals, 3, Float64Array) as Float64Array | null,
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
    if (value instanceof Int32Array || value instanceof Uint8Array) {
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
    if (value instanceof Float32Array || value instanceof Uint8Array) {
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
    return getNodeArray(node) ?? new Float64Array(0);
}

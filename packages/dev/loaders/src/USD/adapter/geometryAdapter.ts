import { Material } from "core/Materials/material.pure";
import { Mesh } from "core/Meshes/mesh.pure";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { SubMesh } from "core/Meshes/subMesh.pure";
import { type Scene } from "core/scene";
import { type IResolvedGeomSubset, type IResolvedMesh } from "../resolution/resolvedStage";

interface IGeometryBuffers {
    positions: Float32Array;
    indices: Uint32Array;
    normals?: Float32Array;
    uvSets?: Float32Array[];
    colors?: Float32Array;
    geomSubsets?: IResolvedGeomSubset[];
    faceVertexCounts?: Uint32Array;
    faceVertexResolvedIndices?: Uint32Array;
}

interface ISubdivisionFace {
    vertices: number[];
    sourceIndexOffset: number;
    sourceIndexCount: number;
}

interface IEdgeInfo {
    a: number;
    b: number;
    faces: number[];
}

interface IVertexWeight {
    index: number;
    weight: number;
}

interface ISubdivisionTarget {
    positions: number[];
    uvSets?: number[][];
    colors?: number[];
}

interface IOutputSpan {
    sourceIndexOffset: number;
    sourceIndexCount: number;
    outputIndexOffset: number;
    outputIndexCount: number;
}

/**
 * Builds a Babylon {@link Mesh} from resolved, vertex-ready geometry. The resolution layer has
 * already expanded primvar interpolation to one value per vertex and triangulated the topology.
 *
 * Subdivision schemes are tessellated before creating Babylon buffers. Catmull-Clark uses one
 * loader-side subdivision level by default and reconstructs only adjacent triangle pairs that look
 * like triangulated quads because the resolved contract no longer carries original face counts.
 *
 * The loader keeps raw USD coordinates and winding. USD `rightHanded` orientation maps to Babylon's
 * counter-clockwise front faces; `leftHanded` maps to clockwise front faces. `doubleSided` cannot be
 * fully applied without the material, so the scene walk must disable material back-face culling (and
 * enable two-sided lighting when needed) for meshes whose resolved source is double-sided.
 *
 * Geom subsets create Babylon submeshes with `SubMesh.materialIndex` set to the resolved subset
 * `materialIndex`. The walk can bind a `MultiMaterial` whose slots match those resolved material
 * indices, or remap the submesh material indices after assigning materials.
 *
 * @param name the name to give the created mesh
 * @param resolved the resolved mesh geometry
 * @param scene the scene to create the mesh in
 * @returns the created mesh
 */
export function CreateMeshFromResolved(name: string, resolved: IResolvedMesh, scene: Scene): Mesh {
    const mesh = new Mesh(name, scene);
    const geometry = TessellateResolvedMesh(resolved);

    const vertexData = new VertexData();
    vertexData.positions = geometry.positions as unknown as number[];
    vertexData.indices = geometry.indices as unknown as number[];
    vertexData.normals = (geometry.normals ?? ComputeUsdWindingNormals(geometry.positions, geometry.indices, resolved.orientation)) as unknown as number[];

    if (geometry.uvSets && geometry.uvSets.length > 0) {
        vertexData.uvs = geometry.uvSets[0] as unknown as number[];
        if (geometry.uvSets.length > 1) {
            vertexData.uvs2 = geometry.uvSets[1] as unknown as number[];
        }
    }

    if (geometry.colors) {
        vertexData.colors = geometry.colors as unknown as number[];
    }

    vertexData.applyToMesh(mesh);
    mesh.sideOrientation = resolved.orientation === "rightHanded" ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;

    ApplyGeomSubsets(mesh, geometry.geomSubsets);

    return mesh;
}

/**
 * Tessellates resolved USD mesh buffers when a subdivision scheme is authored.
 *
 * Catmull-Clark is implemented as a compact one-level CPU tessellator over the resolved indexed
 * mesh. Because `IResolvedMesh.indices` are already triangulated and the frozen contract does not
 * include USD `faceVertexCounts`, it reconstructs only consecutive, consistently wound triangle
 * pairs into quads. Other triangles are subdivided as triangular Catmull-Clark faces. Bilinear and
 * Loop currently use uniform triangle midpoint splitting; Loop is therefore topologically useful
 * but not a full smoothing implementation.
 *
 * UV sets and vertex colors are linearly interpolated for generated edge/face vertices. Normals are
 * intentionally omitted from tessellation output so the mesh adapter recomputes them from the final
 * topology.
 *
 * @param resolved the resolved mesh to tessellate
 * @param levels the number of tessellation levels to apply; values below 1 return the input buffers
 * @returns tessellated geometry buffers
 */
function TessellateResolvedMesh(resolved: IResolvedMesh, levels = 1): IGeometryBuffers {
    const base: IGeometryBuffers = {
        positions: resolved.positions,
        indices: resolved.indices,
        normals: resolved.normals,
        uvSets: resolved.uvSets,
        colors: resolved.colors,
        geomSubsets: resolved.geomSubsets ? resolved.geomSubsets.map(CloneGeomSubset) : undefined,
        faceVertexCounts: resolved.faceVertexCounts,
        faceVertexResolvedIndices: resolved.faceVertexResolvedIndices,
    };

    if (resolved.subdivisionScheme === "none" || levels < 1) {
        return base;
    }

    let geometry = base;
    for (let level = 0; level < levels; level++) {
        if (resolved.subdivisionScheme === "catmullClark") {
            geometry = SubdivideCatmullClarkOnce(geometry);
        } else {
            geometry = SplitTrianglesUniformly(geometry);
        }
    }

    return { ...geometry, normals: undefined };
}

function ApplyGeomSubsets(mesh: Mesh, geomSubsets: IResolvedGeomSubset[] | undefined): void {
    if (!geomSubsets || geomSubsets.length === 0) {
        return;
    }

    mesh.subMeshes = [];
    const verticesCount = mesh.getTotalVertices();
    for (const subset of geomSubsets) {
        new SubMesh(subset.materialIndex, 0, verticesCount, subset.indexOffset, subset.indexCount, mesh);
    }
}

function CloneGeomSubset(subset: IResolvedGeomSubset): IResolvedGeomSubset {
    return {
        materialIndex: subset.materialIndex,
        indexOffset: subset.indexOffset,
        indexCount: subset.indexCount,
    };
}

function ComputeUsdWindingNormals(positions: Float32Array, indices: Uint32Array, orientation: IResolvedMesh["orientation"]): Float32Array {
    const normals = new Float32Array(positions.length);

    for (let index = 0; index < indices.length; index += 3) {
        const a = indices[index] * 3;
        const b = indices[index + 1] * 3;
        const c = indices[index + 2] * 3;

        const abx = positions[b] - positions[a];
        const aby = positions[b + 1] - positions[a + 1];
        const abz = positions[b + 2] - positions[a + 2];
        const acx = positions[c] - positions[a];
        const acy = positions[c + 1] - positions[a + 1];
        const acz = positions[c + 2] - positions[a + 2];

        const orientationSign = orientation === "leftHanded" ? -1 : 1;
        const nx = (aby * acz - abz * acy) * orientationSign;
        const ny = (abz * acx - abx * acz) * orientationSign;
        const nz = (abx * acy - aby * acx) * orientationSign;

        AddNormal(normals, a, nx, ny, nz);
        AddNormal(normals, b, nx, ny, nz);
        AddNormal(normals, c, nx, ny, nz);
    }

    for (let index = 0; index < normals.length; index += 3) {
        const x = normals[index];
        const y = normals[index + 1];
        const z = normals[index + 2];
        const length = Math.sqrt(x * x + y * y + z * z);
        if (length > 0) {
            normals[index] = x / length;
            normals[index + 1] = y / length;
            normals[index + 2] = z / length;
        }
    }

    return normals;
}

function AddNormal(normals: Float32Array, offset: number, x: number, y: number, z: number): void {
    normals[offset] += x;
    normals[offset + 1] += y;
    normals[offset + 2] += z;
}

function SplitTrianglesUniformly(source: IGeometryBuffers): IGeometryBuffers {
    const target = CreateSubdivisionTarget(source);
    const outputIndices: number[] = [];
    const copiedVertices = new Int32Array(source.positions.length / 3);
    copiedVertices.fill(-1);
    const edgeVertices = new Map<string, number>();
    const spans: IOutputSpan[] = [];

    const getCopiedVertex = (sourceIndex: number) => {
        const existing = copiedVertices[sourceIndex];
        if (existing >= 0) {
            return existing;
        }

        const created = PushVertex(target, source, GetPosition(source, sourceIndex), [{ index: sourceIndex, weight: 1 }]);
        copiedVertices[sourceIndex] = created;
        return created;
    };

    const getEdgeVertex = (a: number, b: number) => {
        const key = GetEdgeKey(a, b);
        const existing = edgeVertices.get(key);
        if (existing !== undefined) {
            return existing;
        }

        const created = PushVertex(target, source, AveragePosition(source, [a, b]), [
            { index: a, weight: 0.5 },
            { index: b, weight: 0.5 },
        ]);
        edgeVertices.set(key, created);
        return created;
    };

    for (let sourceIndexOffset = 0; sourceIndexOffset < source.indices.length; sourceIndexOffset += 3) {
        const outputIndexOffset = outputIndices.length;
        const a = source.indices[sourceIndexOffset];
        const b = source.indices[sourceIndexOffset + 1];
        const c = source.indices[sourceIndexOffset + 2];

        const va = getCopiedVertex(a);
        const vb = getCopiedVertex(b);
        const vc = getCopiedVertex(c);
        const ab = getEdgeVertex(a, b);
        const bc = getEdgeVertex(b, c);
        const ca = getEdgeVertex(c, a);

        PushTriangle(outputIndices, va, ab, ca);
        PushTriangle(outputIndices, ab, vb, bc);
        PushTriangle(outputIndices, ca, bc, vc);
        PushTriangle(outputIndices, ab, bc, ca);

        spans.push({
            sourceIndexOffset,
            sourceIndexCount: 3,
            outputIndexOffset,
            outputIndexCount: 12,
        });
    }

    return CreateGeometryFromTarget(target, outputIndices, RemapGeomSubsets(source.geomSubsets, spans));
}

function SubdivideCatmullClarkOnce(source: IGeometryBuffers): IGeometryBuffers {
    const faces = BuildSubdivisionFaces(source);
    const edges = new Map<string, IEdgeInfo>();
    const edgeKeys: string[] = [];
    const vertexFaces: number[][] = CreateNestedIndexArray(source.positions.length / 3);
    const vertexEdges: string[][] = CreateNestedStringArray(source.positions.length / 3);
    const facePositions = faces.map((face) => AveragePosition(source, face.vertices));

    for (let faceIndex = 0; faceIndex < faces.length; faceIndex++) {
        const face = faces[faceIndex];
        for (const vertex of face.vertices) {
            vertexFaces[vertex].push(faceIndex);
        }

        for (let vertexOffset = 0; vertexOffset < face.vertices.length; vertexOffset++) {
            const a = face.vertices[vertexOffset];
            const b = face.vertices[(vertexOffset + 1) % face.vertices.length];
            const key = GetEdgeKey(a, b);
            let edge = edges.get(key);
            if (!edge) {
                edge = { a: Math.min(a, b), b: Math.max(a, b), faces: [] };
                edges.set(key, edge);
                edgeKeys.push(key);
                vertexEdges[a].push(key);
                vertexEdges[b].push(key);
            }
            edge.faces.push(faceIndex);
        }
    }

    const target = CreateSubdivisionTarget(source);
    const originalVertexMap = CreateOriginalCatmullClarkVertices(source, target, edges, vertexFaces, vertexEdges, facePositions);
    const edgeVertexStart = target.positions.length / 3;
    const edgeVertexMap = CreateCatmullClarkEdgeVertices(source, target, edges, edgeKeys, facePositions);
    const faceVertexStart = edgeVertexStart + edgeKeys.length;
    CreateCatmullClarkFaceVertices(source, target, faces);

    const outputIndices: number[] = [];
    const spans: IOutputSpan[] = [];
    for (let faceIndex = 0; faceIndex < faces.length; faceIndex++) {
        const face = faces[faceIndex];
        const outputIndexOffset = outputIndices.length;
        const facePoint = faceVertexStart + faceIndex;

        for (let vertexOffset = 0; vertexOffset < face.vertices.length; vertexOffset++) {
            const current = face.vertices[vertexOffset];
            const next = face.vertices[(vertexOffset + 1) % face.vertices.length];
            const previous = face.vertices[(vertexOffset + face.vertices.length - 1) % face.vertices.length];
            const a = originalVertexMap[current];
            const b = edgeVertexMap.get(GetEdgeKey(current, next))!;
            const d = edgeVertexMap.get(GetEdgeKey(previous, current))!;
            PushTriangle(outputIndices, a, b, facePoint);
            PushTriangle(outputIndices, a, facePoint, d);
        }

        spans.push({
            sourceIndexOffset: face.sourceIndexOffset,
            sourceIndexCount: face.sourceIndexCount,
            outputIndexOffset,
            outputIndexCount: outputIndices.length - outputIndexOffset,
        });
    }

    return CreateGeometryFromTarget(target, outputIndices, RemapGeomSubsets(source.geomSubsets, spans));
}

function CreateOriginalCatmullClarkVertices(
    source: IGeometryBuffers,
    target: ISubdivisionTarget,
    edges: Map<string, IEdgeInfo>,
    vertexFaces: number[][],
    vertexEdges: string[][],
    facePositions: number[][]
): number[] {
    const vertexCount = source.positions.length / 3;
    const vertexMap: number[] = [];

    for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
        const newPosition = ComputeCatmullClarkVertexPosition(source, vertexIndex, edges, vertexFaces[vertexIndex], vertexEdges[vertexIndex], facePositions);
        vertexMap.push(PushVertex(target, source, newPosition, [{ index: vertexIndex, weight: 1 }]));
    }

    return vertexMap;
}

function ComputeCatmullClarkVertexPosition(
    source: IGeometryBuffers,
    vertexIndex: number,
    edges: Map<string, IEdgeInfo>,
    faceIndices: number[],
    edgeKeys: string[],
    facePositions: number[][]
): number[] {
    const original = GetPosition(source, vertexIndex);
    const boundaryNeighbors: number[] = [];

    for (const edgeKey of edgeKeys) {
        const edge = edges.get(edgeKey)!;
        if (edge.faces.length === 1) {
            boundaryNeighbors.push(edge.a === vertexIndex ? edge.b : edge.a);
        }
    }

    if (boundaryNeighbors.length > 0) {
        const first = GetPosition(source, boundaryNeighbors[0]);
        const second = GetPosition(source, boundaryNeighbors[Math.min(1, boundaryNeighbors.length - 1)]);
        return [original[0] * 0.75 + (first[0] + second[0]) * 0.125, original[1] * 0.75 + (first[1] + second[1]) * 0.125, original[2] * 0.75 + (first[2] + second[2]) * 0.125];
    }

    const faceCount = faceIndices.length;
    if (faceCount === 0) {
        return original;
    }

    const faceAverage = AverageVectors(faceIndices.map((faceIndex) => facePositions[faceIndex]));
    const edgeAverage = AverageVectors(
        edgeKeys.map((edgeKey) => {
            const edge = edges.get(edgeKey)!;
            return AveragePosition(source, [edge.a, edge.b]);
        })
    );

    return [
        (faceAverage[0] + 2 * edgeAverage[0] + (faceCount - 3) * original[0]) / faceCount,
        (faceAverage[1] + 2 * edgeAverage[1] + (faceCount - 3) * original[1]) / faceCount,
        (faceAverage[2] + 2 * edgeAverage[2] + (faceCount - 3) * original[2]) / faceCount,
    ];
}

function CreateCatmullClarkEdgeVertices(
    source: IGeometryBuffers,
    target: ISubdivisionTarget,
    edges: Map<string, IEdgeInfo>,
    edgeKeys: string[],
    facePositions: number[][]
): Map<string, number> {
    const edgeVertexMap = new Map<string, number>();

    for (const edgeKey of edgeKeys) {
        const edge = edges.get(edgeKey)!;
        let position: number[];
        if (edge.faces.length === 2) {
            const firstFace = facePositions[edge.faces[0]];
            const secondFace = facePositions[edge.faces[1]];
            const first = GetPosition(source, edge.a);
            const second = GetPosition(source, edge.b);
            position = [
                (first[0] + second[0] + firstFace[0] + secondFace[0]) * 0.25,
                (first[1] + second[1] + firstFace[1] + secondFace[1]) * 0.25,
                (first[2] + second[2] + firstFace[2] + secondFace[2]) * 0.25,
            ];
        } else {
            position = AveragePosition(source, [edge.a, edge.b]);
        }

        edgeVertexMap.set(
            edgeKey,
            PushVertex(target, source, position, [
                { index: edge.a, weight: 0.5 },
                { index: edge.b, weight: 0.5 },
            ])
        );
    }

    return edgeVertexMap;
}

function CreateCatmullClarkFaceVertices(source: IGeometryBuffers, target: ISubdivisionTarget, faces: ISubdivisionFace[]): void {
    for (const face of faces) {
        const weight = 1 / face.vertices.length;
        PushVertex(
            target,
            source,
            AveragePosition(source, face.vertices),
            face.vertices.map((index) => ({ index, weight }))
        );
    }
}

function BuildSubdivisionFaces(source: IGeometryBuffers): ISubdivisionFace[] {
    if (source.faceVertexCounts && source.faceVertexResolvedIndices) {
        const faces: ISubdivisionFace[] = [];
        let faceVertexOffset = 0;
        let sourceIndexOffset = 0;
        for (const count of source.faceVertexCounts) {
            const sourceIndexCount = Math.max(0, count - 2) * 3;
            faces.push({
                vertices: Array.from(source.faceVertexResolvedIndices.subarray(faceVertexOffset, faceVertexOffset + count)),
                sourceIndexOffset,
                sourceIndexCount,
            });
            faceVertexOffset += count;
            sourceIndexOffset += sourceIndexCount;
        }
        return faces;
    }

    const indices = source.indices;
    const faces: ISubdivisionFace[] = [];
    for (let indexOffset = 0; indexOffset < indices.length; indexOffset += 3) {
        const first = [indices[indexOffset], indices[indexOffset + 1], indices[indexOffset + 2]];
        if (indexOffset + 5 < indices.length) {
            const second = [indices[indexOffset + 3], indices[indexOffset + 4], indices[indexOffset + 5]];
            const quad = TryReconstructQuad(first, second);
            if (quad) {
                faces.push({ vertices: quad, sourceIndexOffset: indexOffset, sourceIndexCount: 6 });
                indexOffset += 3;
                continue;
            }
        }

        faces.push({ vertices: first, sourceIndexOffset: indexOffset, sourceIndexCount: 3 });
    }

    return faces;
}

function TryReconstructQuad(first: number[], second: number[]): number[] | undefined {
    const unique = new Set([...first, ...second]);
    if (unique.size !== 4) {
        return undefined;
    }

    for (let firstOffset = 0; firstOffset < 3; firstOffset++) {
        const u = first[firstOffset];
        const v = first[(firstOffset + 1) % 3];
        for (let secondOffset = 0; secondOffset < 3; secondOffset++) {
            if (second[secondOffset] === v && second[(secondOffset + 1) % 3] === u) {
                return [v, first[(firstOffset + 2) % 3], u, second[(secondOffset + 2) % 3]];
            }
        }
    }

    return undefined;
}

function RemapGeomSubsets(subsets: IResolvedGeomSubset[] | undefined, spans: IOutputSpan[]): IResolvedGeomSubset[] | undefined {
    if (!subsets || subsets.length === 0) {
        return undefined;
    }

    const remapped: IResolvedGeomSubset[] = [];
    for (const subset of subsets) {
        const subsetEnd = subset.indexOffset + subset.indexCount;
        let outputStart = -1;
        let outputEnd = -1;

        for (const span of spans) {
            const spanEnd = span.sourceIndexOffset + span.sourceIndexCount;
            const fullyCovered = span.sourceIndexOffset >= subset.indexOffset && spanEnd <= subsetEnd;
            const overlaps = span.sourceIndexOffset < subsetEnd && spanEnd > subset.indexOffset;
            if (!fullyCovered && overlaps) {
                return undefined;
            }
            if (fullyCovered) {
                if (outputStart < 0) {
                    outputStart = span.outputIndexOffset;
                }
                outputEnd = span.outputIndexOffset + span.outputIndexCount;
            }
        }

        if (outputStart >= 0) {
            remapped.push({
                materialIndex: subset.materialIndex,
                indexOffset: outputStart,
                indexCount: outputEnd - outputStart,
            });
        }
    }

    return remapped.length > 0 ? remapped : undefined;
}

function CreateNestedIndexArray(length: number): number[][] {
    const arrays: number[][] = [];
    for (let index = 0; index < length; index++) {
        arrays.push([]);
    }
    return arrays;
}

function CreateNestedStringArray(length: number): string[][] {
    const arrays: string[][] = [];
    for (let index = 0; index < length; index++) {
        arrays.push([]);
    }
    return arrays;
}

function CreateSubdivisionTarget(source: IGeometryBuffers): ISubdivisionTarget {
    return {
        positions: [],
        uvSets: source.uvSets?.map(() => []),
        colors: source.colors ? [] : undefined,
    };
}

function CreateGeometryFromTarget(target: ISubdivisionTarget, indices: number[], geomSubsets: IResolvedGeomSubset[] | undefined): IGeometryBuffers {
    return {
        positions: new Float32Array(target.positions),
        indices: new Uint32Array(indices),
        uvSets: target.uvSets?.map((uvSet) => new Float32Array(uvSet)),
        colors: target.colors ? new Float32Array(target.colors) : undefined,
        geomSubsets,
    };
}

function PushVertex(target: ISubdivisionTarget, source: IGeometryBuffers, position: number[], weights: IVertexWeight[]): number {
    const vertexIndex = target.positions.length / 3;
    target.positions.push(position[0], position[1], position[2]);

    if (target.uvSets && source.uvSets) {
        for (let uvSetIndex = 0; uvSetIndex < target.uvSets.length; uvSetIndex++) {
            PushWeightedAttribute(target.uvSets[uvSetIndex], source.uvSets[uvSetIndex], 2, weights);
        }
    }

    if (target.colors && source.colors) {
        PushWeightedAttribute(target.colors, source.colors, 4, weights);
    }

    return vertexIndex;
}

function PushWeightedAttribute(target: number[], source: Float32Array, stride: number, weights: IVertexWeight[]): void {
    for (let component = 0; component < stride; component++) {
        let value = 0;
        for (const weight of weights) {
            value += source[weight.index * stride + component] * weight.weight;
        }
        target.push(value);
    }
}

function GetPosition(source: IGeometryBuffers, vertexIndex: number): number[] {
    const offset = vertexIndex * 3;
    return [source.positions[offset], source.positions[offset + 1], source.positions[offset + 2]];
}

function AveragePosition(source: IGeometryBuffers, vertices: number[]): number[] {
    const sum = [0, 0, 0];
    for (const vertex of vertices) {
        const position = GetPosition(source, vertex);
        sum[0] += position[0];
        sum[1] += position[1];
        sum[2] += position[2];
    }
    return [sum[0] / vertices.length, sum[1] / vertices.length, sum[2] / vertices.length];
}

function AverageVectors(vectors: number[][]): number[] {
    if (vectors.length === 0) {
        return [0, 0, 0];
    }

    const sum = [0, 0, 0];
    for (const vector of vectors) {
        sum[0] += vector[0];
        sum[1] += vector[1];
        sum[2] += vector[2];
    }
    return [sum[0] / vectors.length, sum[1] / vectors.length, sum[2] / vectors.length];
}

function GetEdgeKey(a: number, b: number): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function PushTriangle(indices: number[], a: number, b: number, c: number): void {
    indices.push(a, b, c);
}

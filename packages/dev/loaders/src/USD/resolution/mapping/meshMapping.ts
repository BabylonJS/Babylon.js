import { type IResolvedGeomSubset, type IResolvedMesh, type Vec2, type Vec3 } from "../resolvedStage";
import { type ISdfAttributeSpec, type ISdfPrimSpec, type SdfInterpolation } from "../sdf/index";
import { ResolveMaterialBinding } from "./materialMapping";
import { type IStageMappingContext } from "./mappingContext";
import { AsNumber, AsNumberArray, AsToken, AsVec2, AsVec2Array, AsVec3, AsVec3Array, GetAttribute, GetAttributeValue } from "./valueAccess";

interface ITriangulatedCorner {
    readonly faceIndex: number;
    readonly faceVertexOffset: number;
    readonly pointIndex: number;
}

interface IFaceIndexRange {
    readonly indexOffset: number;
    readonly indexCount: number;
}

interface IPrimvarSource<T> {
    readonly name: string;
    readonly values: T[];
    readonly indices?: number[];
    readonly interpolation: SdfInterpolation;
}

interface IMeshTopology {
    readonly corners: ITriangulatedCorner[];
    readonly faceRanges: IFaceIndexRange[];
}

interface IResolvedVertex {
    readonly pointIndex: number;
    readonly corner: ITriangulatedCorner;
}

type ProjectedPoint = readonly [number, number];

const MaxEarClippingChecks = 1_000_000;

/**
 * Maps a Mesh prim into a resolved mesh with triangulated topology and expanded primvars.
 * @param prim Mesh prim to map
 * @param context mapping context used for diagnostics and subset material resolution
 * @returns resolved mesh, or undefined when required topology is missing
 */
export function ResolveMesh(prim: ISdfPrimSpec, context: IStageMappingContext): IResolvedMesh | undefined {
    const points = AsVec3Array(GetAttributeValue(GetAttribute(prim, "points")));
    const faceVertexCounts = AsNumberArray(GetAttributeValue(GetAttribute(prim, "faceVertexCounts")))?.map((value) => Math.trunc(value));
    const faceVertexIndices = AsNumberArray(GetAttributeValue(GetAttribute(prim, "faceVertexIndices")))?.map((value) => Math.trunc(value));

    if (!points || !faceVertexCounts || !faceVertexIndices) {
        context.diagnostics.push({ severity: "error", path: prim.path, message: "Mesh is missing points, faceVertexCounts, or faceVertexIndices and was skipped." });
        return undefined;
    }

    const topology = TriangulateTopology(points, faceVertexCounts, faceVertexIndices, prim.path, context);
    const normalSource = ResolveVec3Primvar(prim, "normals", points.length, faceVertexCounts.length, faceVertexIndices.length);
    const uvSources = ResolveUvSources(prim, points.length, faceVertexCounts.length, faceVertexIndices.length);
    const displayColorSource = ResolveVec3Primvar(prim, "primvars:displayColor", points.length, faceVertexCounts.length, faceVertexIndices.length);
    const displayOpacitySource = ResolveNumberPrimvar(prim, "primvars:displayOpacity", points.length, faceVertexCounts.length, faceVertexIndices.length);

    const vertices: IResolvedVertex[] = [];
    const vertexByKey = new Map<string, number>();
    const indices: number[] = [];
    const faceVertexResolvedIndices = new Uint32Array(faceVertexIndices.length);

    for (const corner of topology.corners) {
        const key = BuildVertexKey(corner, normalSource, uvSources, displayColorSource, displayOpacitySource);
        let vertexIndex = vertexByKey.get(key);
        if (vertexIndex === undefined) {
            vertexIndex = vertices.length;
            vertexByKey.set(key, vertexIndex);
            vertices.push({ pointIndex: corner.pointIndex, corner });
        }
        indices.push(vertexIndex);
        faceVertexResolvedIndices[corner.faceVertexOffset] = vertexIndex;
    }

    const subdivisionScheme = ResolveSubdivisionScheme(prim);
    EmitSubdivisionDiagnostic(prim, subdivisionScheme, context);

    return {
        positions: BuildPositionBuffer(vertices, points),
        indices: new Uint32Array(indices),
        normals: normalSource ? BuildVec3Buffer(vertices, normalSource) : undefined,
        uvSets: uvSources.length > 0 ? uvSources.map((source) => BuildVec2Buffer(vertices, source)) : undefined,
        colors: displayColorSource ? BuildColorBuffer(vertices, displayColorSource, displayOpacitySource) : undefined,
        subdivisionScheme,
        faceVertexCounts: new Uint32Array(faceVertexCounts),
        faceVertexIndices: new Uint32Array(faceVertexIndices),
        sourcePointIndices: new Uint32Array(vertices.map((vertex) => vertex.pointIndex)),
        faceVertexResolvedIndices,
        doubleSided: AsNumber(GetAttributeValue(GetAttribute(prim, "doubleSided"))) === 1 || GetAttributeValue(GetAttribute(prim, "doubleSided"))?.value === true,
        orientation: AsToken(GetAttributeValue(GetAttribute(prim, "orientation"))) === "leftHanded" ? "leftHanded" : "rightHanded",
        geomSubsets: ResolveGeomSubsets(prim, topology.faceRanges, context),
    };
}

/**
 * Builds a deterministic key for pooling identical resolved mesh geometry.
 * @param mesh resolved mesh to key
 * @returns deterministic mesh-pool key
 */
export function BuildMeshPoolKey(mesh: IResolvedMesh): string {
    return [
        Array.from(mesh.positions).join(","),
        Array.from(mesh.indices).join(","),
        mesh.normals ? Array.from(mesh.normals).join(",") : "",
        mesh.uvSets?.map((uv) => Array.from(uv).join(",")).join("|") ?? "",
        mesh.colors ? Array.from(mesh.colors).join(",") : "",
        mesh.subdivisionScheme,
        mesh.faceVertexCounts ? Array.from(mesh.faceVertexCounts).join(",") : "",
        mesh.faceVertexIndices ? Array.from(mesh.faceVertexIndices).join(",") : "",
        mesh.sourcePointIndices ? Array.from(mesh.sourcePointIndices).join(",") : "",
        mesh.faceVertexResolvedIndices ? Array.from(mesh.faceVertexResolvedIndices).join(",") : "",
        mesh.geomSubsets?.map((subset) => `${subset.materialIndex}:${subset.indexOffset}:${subset.indexCount}`).join("|") ?? "",
        mesh.doubleSided ? "1" : "0",
        mesh.orientation,
    ].join(";");
}

function TriangulateTopology(points: Vec3[], faceVertexCounts: number[], faceVertexIndices: number[], path: string, context: IStageMappingContext): IMeshTopology {
    const corners: ITriangulatedCorner[] = [];
    const faceRanges: IFaceIndexRange[] = [];
    let faceVertexOffset = 0;

    for (let faceIndex = 0; faceIndex < faceVertexCounts.length; faceIndex++) {
        const count = faceVertexCounts[faceIndex];
        const indexOffset = corners.length;
        if (count < 3) {
            context.diagnostics.push({ severity: "warning", path, message: `Degenerate face ${faceIndex} with ${count} vertices was skipped.` });
            faceRanges.push({ indexOffset, indexCount: 0 });
            faceVertexOffset += count;
            continue;
        }
        const triangulatedCorners = TriangulateFace(points, faceVertexIndices, faceVertexOffset, count);
        const cornerIndices = triangulatedCorners ?? BuildTriangleFan(count);
        if (!triangulatedCorners) {
            context.diagnostics.push({ severity: "warning", path, message: `Face ${faceIndex} could not be robustly triangulated; a triangle fan fallback was used.` });
        }
        for (let corner = 0; corner < cornerIndices.length; corner += 3) {
            corners.push(
                CreateTriangulatedCorner(faceIndex, faceVertexOffset, cornerIndices[corner], faceVertexIndices),
                CreateTriangulatedCorner(faceIndex, faceVertexOffset, cornerIndices[corner + 1], faceVertexIndices),
                CreateTriangulatedCorner(faceIndex, faceVertexOffset, cornerIndices[corner + 2], faceVertexIndices)
            );
        }
        faceRanges.push({ indexOffset, indexCount: corners.length - indexOffset });
        faceVertexOffset += count;
    }

    return { corners, faceRanges };
}

function CreateTriangulatedCorner(faceIndex: number, faceVertexOffset: number, localCornerIndex: number, faceVertexIndices: number[]): ITriangulatedCorner {
    const cornerOffset = faceVertexOffset + localCornerIndex;
    return { faceIndex, faceVertexOffset: cornerOffset, pointIndex: faceVertexIndices[cornerOffset] ?? 0 };
}

function BuildTriangleFan(count: number): number[] {
    const corners: number[] = [];
    for (let corner = 1; corner < count - 1; corner++) {
        corners.push(0, corner, corner + 1);
    }
    return corners;
}

function TriangulateFace(points: Vec3[], faceVertexIndices: number[], faceVertexOffset: number, count: number): number[] | undefined {
    if (count === 3) {
        return [0, 1, 2];
    }

    const facePoints = Array.from({ length: count }, (_, index) => points[faceVertexIndices[faceVertexOffset + index]] ?? ([0, 0, 0] as Vec3));
    const projected = ProjectFace(facePoints);
    if (!projected) {
        return undefined;
    }

    const area = SignedArea(projected);
    let minimumX = projected[0][0];
    let maximumX = minimumX;
    let minimumY = projected[0][1];
    let maximumY = minimumY;
    for (let index = 1; index < projected.length; index++) {
        minimumX = Math.min(minimumX, projected[index][0]);
        maximumX = Math.max(maximumX, projected[index][0]);
        minimumY = Math.min(minimumY, projected[index][1]);
        maximumY = Math.max(maximumY, projected[index][1]);
    }
    const scale = Math.max(maximumX - minimumX, maximumY - minimumY, Number.EPSILON);
    const epsilon = scale * scale * 1e-12;
    if (Math.abs(area) <= epsilon) {
        return undefined;
    }

    const orientation = area > 0 ? 1 : -1;
    if (IsConvexPolygon(projected, orientation, epsilon)) {
        return BuildTriangleFan(count);
    }

    const remaining = Array.from({ length: count }, (_, index) => index);
    const triangles: number[] = [];
    let checks = 0;
    while (remaining.length > 3) {
        let earFound = false;
        for (let index = 0; index < remaining.length; index++) {
            if (++checks > MaxEarClippingChecks) {
                return undefined;
            }
            const previous = remaining[(index + remaining.length - 1) % remaining.length];
            const current = remaining[index];
            const next = remaining[(index + 1) % remaining.length];
            if (orientation * Cross2D(projected[previous], projected[current], projected[next]) <= epsilon) {
                continue;
            }
            let containsVertex = false;
            for (const candidate of remaining) {
                if (candidate === previous || candidate === current || candidate === next) {
                    continue;
                }
                if (++checks > MaxEarClippingChecks) {
                    return undefined;
                }
                if (IsPointInTriangle(projected[candidate], projected[previous], projected[current], projected[next], orientation, epsilon)) {
                    containsVertex = true;
                    break;
                }
            }
            if (containsVertex) {
                continue;
            }

            triangles.push(previous, current, next);
            remaining.splice(index, 1);
            earFound = true;
            break;
        }
        if (!earFound) {
            return undefined;
        }
    }

    triangles.push(remaining[0], remaining[1], remaining[2]);
    return triangles;
}

function ProjectFace(points: Vec3[]): ProjectedPoint[] | undefined {
    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;
    for (let index = 0; index < points.length; index++) {
        const current = points[index];
        const next = points[(index + 1) % points.length];
        normalX += (current[1] - next[1]) * (current[2] + next[2]);
        normalY += (current[2] - next[2]) * (current[0] + next[0]);
        normalZ += (current[0] - next[0]) * (current[1] + next[1]);
    }

    const absoluteX = Math.abs(normalX);
    const absoluteY = Math.abs(normalY);
    const absoluteZ = Math.abs(normalZ);
    const normalMagnitude = Math.max(absoluteX, absoluteY, absoluteZ);
    if (normalMagnitude === 0 || !Number.isFinite(normalMagnitude)) {
        return undefined;
    }
    if (absoluteX >= absoluteY && absoluteX >= absoluteZ) {
        return points.map((point) => [point[1], point[2]]);
    }
    if (absoluteY >= absoluteZ) {
        return points.map((point) => [point[0], point[2]]);
    }
    return points.map((point) => [point[0], point[1]]);
}

function SignedArea(points: ProjectedPoint[]): number {
    let doubledArea = 0;
    for (let index = 0; index < points.length; index++) {
        const current = points[index];
        const next = points[(index + 1) % points.length];
        doubledArea += current[0] * next[1] - next[0] * current[1];
    }
    return doubledArea / 2;
}

function IsConvexPolygon(points: ProjectedPoint[], orientation: number, epsilon: number): boolean {
    for (let index = 0; index < points.length; index++) {
        const previous = points[(index + points.length - 1) % points.length];
        const current = points[index];
        const next = points[(index + 1) % points.length];
        if (orientation * Cross2D(previous, current, next) < -epsilon) {
            return false;
        }
    }
    return true;
}

function IsPointInTriangle(point: ProjectedPoint, first: ProjectedPoint, second: ProjectedPoint, third: ProjectedPoint, orientation: number, epsilon: number): boolean {
    return (
        orientation * Cross2D(first, second, point) >= -epsilon && orientation * Cross2D(second, third, point) >= -epsilon && orientation * Cross2D(third, first, point) >= -epsilon
    );
}

function Cross2D(first: ProjectedPoint, second: ProjectedPoint, third: ProjectedPoint): number {
    return (second[0] - first[0]) * (third[1] - first[1]) - (second[1] - first[1]) * (third[0] - first[0]);
}

function ResolveUvSources(prim: ISdfPrimSpec, pointCount: number, faceCount: number, faceVertexCount: number): IPrimvarSource<Vec2>[] {
    return Object.keys(prim.properties)
        .filter((name) => /^primvars:st\d*$/.test(name))
        .sort(CompareUvPrimvarNames)
        .map((name) => ResolveVec2Primvar(prim, name, pointCount, faceCount, faceVertexCount))
        .filter((source): source is IPrimvarSource<Vec2> => source !== undefined);
}

function ResolveVec2Primvar(prim: ISdfPrimSpec, name: string, pointCount: number, faceCount: number, faceVertexCount: number): IPrimvarSource<Vec2> | undefined {
    const attribute = GetAttribute(prim, name);
    const values = AsVec2Array(GetAttributeValue(attribute)) ?? AsSingleVec2Array(GetAttributeValue(attribute));
    return values ? BuildPrimvarSource(prim, name, attribute, values, pointCount, faceCount, faceVertexCount) : undefined;
}

function ResolveVec3Primvar(prim: ISdfPrimSpec, name: string, pointCount: number, faceCount: number, faceVertexCount: number): IPrimvarSource<Vec3> | undefined {
    const attribute = GetAttribute(prim, name);
    const values = AsVec3Array(GetAttributeValue(attribute)) ?? AsSingleVec3Array(GetAttributeValue(attribute));
    return values ? BuildPrimvarSource(prim, name, attribute, values, pointCount, faceCount, faceVertexCount) : undefined;
}

function ResolveNumberPrimvar(prim: ISdfPrimSpec, name: string, pointCount: number, faceCount: number, faceVertexCount: number): IPrimvarSource<number> | undefined {
    const attribute = GetAttribute(prim, name);
    const single = AsNumber(GetAttributeValue(attribute));
    const values = AsNumberArray(GetAttributeValue(attribute)) ?? (single !== undefined ? [single] : undefined);
    return values ? BuildPrimvarSource(prim, name, attribute, values, pointCount, faceCount, faceVertexCount) : undefined;
}

function BuildPrimvarSource<T>(
    prim: ISdfPrimSpec,
    name: string,
    attribute: ISdfAttributeSpec | undefined,
    values: T[],
    pointCount: number,
    faceCount: number,
    faceVertexCount: number
): IPrimvarSource<T> {
    return {
        name,
        values,
        indices: AsNumberArray(GetAttributeValue(GetAttribute(prim, `${name}:indices`)))?.map((value) => Math.trunc(value)),
        interpolation: attribute?.interpolation ?? InferInterpolation(values.length, pointCount, faceCount, faceVertexCount),
    };
}

function InferInterpolation(valueCount: number, pointCount: number, faceCount: number, faceVertexCount: number): SdfInterpolation {
    if (valueCount === faceVertexCount) {
        return "faceVarying";
    }
    if (valueCount === pointCount) {
        return "vertex";
    }
    if (valueCount === faceCount) {
        return "uniform";
    }
    return "constant";
}

function BuildVertexKey(
    corner: ITriangulatedCorner,
    normalSource: IPrimvarSource<Vec3> | undefined,
    uvSources: IPrimvarSource<Vec2>[],
    displayColorSource: IPrimvarSource<Vec3> | undefined,
    displayOpacitySource: IPrimvarSource<number> | undefined
): string {
    const pieces = [String(corner.pointIndex)];
    if (normalSource) {
        pieces.push(FormatPrimvarValue(ResolvePrimvarValue(normalSource, corner)));
    }
    for (const source of uvSources) {
        pieces.push(FormatPrimvarValue(ResolvePrimvarValue(source, corner)));
    }
    if (displayColorSource) {
        pieces.push(FormatPrimvarValue(ResolvePrimvarValue(displayColorSource, corner)));
    }
    if (displayOpacitySource) {
        pieces.push(String(ResolvePrimvarValue(displayOpacitySource, corner) ?? 1));
    }
    return pieces.join("|");
}

function ResolvePrimvarValue<T>(source: IPrimvarSource<T>, corner: ITriangulatedCorner): T | undefined {
    const authoredIndex = ResolveAuthoredPrimvarIndex(source.interpolation, corner);
    const valueIndex = source.indices?.[authoredIndex] ?? authoredIndex;
    return source.values[valueIndex] ?? source.values[0];
}

function ResolveAuthoredPrimvarIndex(interpolation: SdfInterpolation, corner: ITriangulatedCorner): number {
    switch (interpolation) {
        case "uniform":
            return corner.faceIndex;
        case "varying":
        case "vertex":
            return corner.pointIndex;
        case "faceVarying":
            return corner.faceVertexOffset;
        case "constant":
        default:
            return 0;
    }
}

function BuildPositionBuffer(vertices: IResolvedVertex[], points: Vec3[]): Float32Array {
    const buffer = new Float32Array(vertices.length * 3);
    vertices.forEach((vertex, index) => WriteVec3(buffer, index, points[vertex.pointIndex] ?? [0, 0, 0]));
    return buffer;
}

function BuildVec3Buffer(vertices: IResolvedVertex[], source: IPrimvarSource<Vec3>): Float32Array {
    const buffer = new Float32Array(vertices.length * 3);
    vertices.forEach((vertex, index) => WriteVec3(buffer, index, ResolvePrimvarValue(source, vertex.corner) ?? [0, 0, 0]));
    return buffer;
}

function BuildVec2Buffer(vertices: IResolvedVertex[], source: IPrimvarSource<Vec2>): Float32Array {
    const buffer = new Float32Array(vertices.length * 2);
    vertices.forEach((vertex, index) => {
        const value = ResolvePrimvarValue(source, vertex.corner) ?? [0, 0];
        buffer[index * 2] = value[0];
        buffer[index * 2 + 1] = value[1];
    });
    return buffer;
}

function BuildColorBuffer(vertices: IResolvedVertex[], colorSource: IPrimvarSource<Vec3>, opacitySource: IPrimvarSource<number> | undefined): Float32Array {
    const buffer = new Float32Array(vertices.length * 4);
    vertices.forEach((vertex, index) => {
        const color = ResolvePrimvarValue(colorSource, vertex.corner) ?? [1, 1, 1];
        buffer[index * 4] = color[0];
        buffer[index * 4 + 1] = color[1];
        buffer[index * 4 + 2] = color[2];
        buffer[index * 4 + 3] = opacitySource ? (ResolvePrimvarValue(opacitySource, vertex.corner) ?? 1) : 1;
    });
    return buffer;
}

function ResolveGeomSubsets(prim: ISdfPrimSpec, faceRanges: IFaceIndexRange[], context: IStageMappingContext): IResolvedGeomSubset[] | undefined {
    const subsets: IResolvedGeomSubset[] = [];
    for (const child of prim.children) {
        if (child.typeName !== "GeomSubset" || AsToken(GetAttributeValue(GetAttribute(child, "elementType"))) !== "face") {
            continue;
        }
        const materialBinding = ResolveMaterialBinding(child, context);
        const materialIndex = materialBinding?.materialIndex;
        const faceIndices = AsNumberArray(GetAttributeValue(GetAttribute(child, "indices")))?.map((value) => Math.trunc(value)) ?? [];
        if (materialIndex === undefined || faceIndices.length === 0) {
            continue;
        }
        for (const range of BuildSubsetRanges(faceIndices, faceRanges)) {
            subsets.push({ materialIndex, indexOffset: range.indexOffset, indexCount: range.indexCount });
        }
    }
    return subsets.length > 0 ? subsets : undefined;
}

function BuildSubsetRanges(faceIndices: number[], faceRanges: IFaceIndexRange[]): IFaceIndexRange[] {
    const ranges = faceIndices
        .map((faceIndex) => faceRanges[faceIndex])
        .filter((range): range is IFaceIndexRange => !!range && range.indexCount > 0)
        .sort((left, right) => left.indexOffset - right.indexOffset);
    const merged: IFaceIndexRange[] = [];
    for (const range of ranges) {
        const previous = merged[merged.length - 1];
        if (previous && previous.indexOffset + previous.indexCount === range.indexOffset) {
            merged[merged.length - 1] = { indexOffset: previous.indexOffset, indexCount: previous.indexCount + range.indexCount };
        } else {
            merged.push(range);
        }
    }
    return merged;
}

function ResolveSubdivisionScheme(prim: ISdfPrimSpec): IResolvedMesh["subdivisionScheme"] {
    const scheme = AsToken(GetAttributeValue(GetAttribute(prim, "subdivisionScheme")));
    return scheme === "none" || scheme === "loop" || scheme === "bilinear" ? scheme : "catmullClark";
}

// Subdivision is only ever approximated by this loader (a single Catmull-Clark refinement, or uniform
// triangle splitting for loop/bilinear), and USD's default scheme for an unauthored Mesh is
// catmullClark. Surface an honest, non-fatal diagnostic whenever a mesh is subdivided so the caller
// knows the geometry is not the exact USD limit surface. The unauthored default applies to most poly
// meshes, so it is reported once per stage; explicitly authored schemes are reported per mesh.
const UnauthoredSubdivisionMessage =
    "Mesh has no authored subdivisionScheme; USD's default 'catmullClark' subdivision is applied as an approximation. Set subdivisionScheme to 'none' to import it as a polygon mesh.";

function EmitSubdivisionDiagnostic(prim: ISdfPrimSpec, scheme: IResolvedMesh["subdivisionScheme"], context: IStageMappingContext): void {
    if (scheme === "none") {
        return;
    }
    const authored = AsToken(GetAttributeValue(GetAttribute(prim, "subdivisionScheme")));
    if (authored === undefined) {
        // O(1) once-per-stage guard so a large poly stage that omits subdivisionScheme does not log the
        // same advisory per mesh.
        if (!context.emittedUnauthoredSubdivisionDiagnostic) {
            context.emittedUnauthoredSubdivisionDiagnostic = true;
            context.diagnostics.push({ severity: "info", path: prim.path, message: UnauthoredSubdivisionMessage });
        }
        return;
    }
    const known = authored === "catmullClark" || authored === "loop" || authored === "bilinear";
    const message = !known
        ? `Mesh has an unknown subdivisionScheme '${authored}'; it was treated as the default 'catmullClark' approximation.`
        : authored === "catmullClark"
          ? "Mesh subdivisionScheme 'catmullClark' is approximated by a single Catmull-Clark refinement; the true limit surface is not produced."
          : `Mesh subdivisionScheme '${authored}' is approximated by uniform triangle subdivision; true '${authored}' subdivision is not supported.`;
    context.diagnostics.push({ severity: "info", path: prim.path, message });
}

function CompareUvPrimvarNames(left: string, right: string): number {
    return UvPrimvarOrder(left) - UvPrimvarOrder(right);
}

function UvPrimvarOrder(name: string): number {
    if (name === "primvars:st" || name === "primvars:st0") {
        return 0;
    }
    const match = /^primvars:st(\d+)$/.exec(name);
    return match ? Number(match[1]) : 0;
}

function WriteVec3(buffer: Float32Array, index: number, value: Vec3): void {
    buffer[index * 3] = value[0];
    buffer[index * 3 + 1] = value[1];
    buffer[index * 3 + 2] = value[2];
}

function FormatPrimvarValue(value: unknown): string {
    return Array.isArray(value) ? value.join(",") : String(value);
}

function AsSingleVec2Array(value: ReturnType<typeof GetAttributeValue>): Vec2[] | undefined {
    const vec = AsVec2(value);
    return vec ? [vec] : undefined;
}

function AsSingleVec3Array(value: ReturnType<typeof GetAttributeValue>): Vec3[] | undefined {
    const vec = AsVec3(value);
    return vec ? [vec] : undefined;
}

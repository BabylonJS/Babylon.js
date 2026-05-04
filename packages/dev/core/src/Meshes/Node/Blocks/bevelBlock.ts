import { editableInPropertyPage, PropertyTypeForEdition } from "../../../Decorators/nodeDecorator";
import { Vector3 } from "../../../Maths/math.vector";
import { RegisterClass } from "../../../Misc/typeStore";
import { VertexData, VertexDataMaterialInfo } from "../../mesh.vertexData";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { type NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import { type NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";

const PositionEpsilon = 1e-5;
const OutputPositionEpsilon = 1e-4;
const NormalEpsilon = 1e-8;
const AngleEpsilon = 1e-7;
const TriangleAreaEpsilon = PositionEpsilon * PositionEpsilon * PositionEpsilon * PositionEpsilon;

type BevelFaceEdgeSegment = {
    edgeKey: string;
    faceIndex: number;
    inward: Vector3;
    tMin: number;
    tMax: number;
    minPoint: Vector3;
    maxPoint: Vector3;
    minNormal: Vector3;
    maxNormal: Vector3;
    minAttributes: number[];
    maxAttributes: number[];
    materialIndex: number;
};

type BevelPolygonPoint = {
    position: Vector3;
    normal: Vector3;
    attributes: number[];
    materialIndex: number;
};

type BevelCapPoint = Vector3 | BevelPolygonPoint;

type BevelPreparedFace = {
    faceIndex: number;
    polygon: BevelPolygonPoint[];
    selectedFaceEdges: BevelFaceClipEdge[];
    isFlat: boolean;
};

type BevelEdgeInterval = {
    tStart: number;
    tEnd: number;
};

type BevelFaceClipEdge = {
    key: string;
    start: number;
    end: number;
    inward: Vector3;
};

type BevelFace = {
    indices: [number, number, number];
    originalIndices: [number, number, number];
    normal: Vector3;
    cornerNormals: [Vector3, Vector3, Vector3];
    materialIndex: number;
};

type BevelEdgeFace = {
    faceIndex: number;
};

type BevelEdge = {
    key: string;
    v0: number;
    v1: number;
    faces: BevelEdgeFace[];
};

type BevelTopology = {
    positions: Vector3[];
    faces: BevelFace[];
    edges: Map<string, BevelEdge>;
    vertexFaces: Map<number, number[]>;
};

type BevelAttributeName =
    | "tangents"
    | "uvs"
    | "uvs2"
    | "uvs3"
    | "uvs4"
    | "uvs5"
    | "uvs6"
    | "colors"
    | "matricesIndices"
    | "matricesWeights"
    | "matricesIndicesExtra"
    | "matricesWeightsExtra";

type BevelAttributeDescriptor = {
    name: BevelAttributeName;
    source: ArrayLike<number>;
    stride: number;
    offset: number;
    output: number[];
};

function _Quantize(value: number) {
    const quantized = Math.round(value / PositionEpsilon);
    return quantized === 0 ? 0 : quantized;
}

function _PositionKey(x: number, y: number, z: number) {
    return `${_Quantize(x)}:${_Quantize(y)}:${_Quantize(z)}`;
}

function _VectorKey(position: Vector3) {
    return _PositionKey(position.x, position.y, position.z);
}

function _OutputQuantize(value: number) {
    const quantized = Math.round(value / OutputPositionEpsilon);
    return quantized === 0 ? 0 : quantized;
}

function _OutputPositionKey(x: number, y: number, z: number) {
    return `${x}:${y}:${z}`;
}

function _EdgeKey(v0: number, v1: number) {
    return v0 < v1 ? `${v0}:${v1}` : `${v1}:${v0}`;
}

function _CloneVertexData(vertexData: VertexData) {
    const clone = vertexData.clone();
    if (!clone.normals && clone.positions && clone.indices) {
        const normals: number[] = [];
        VertexData.ComputeNormals(clone.positions, clone.indices, normals);
        clone.normals = normals;
    }

    return clone;
}

function _NormalizeNormalOrFallback(normal: Vector3, fallback: Vector3) {
    return normal.lengthSquared() > NormalEpsilon ? normal.normalizeToNew() : fallback.normalizeToNew();
}

function _BuildAttributeDescriptors(vertexData: VertexData, vertexCount: number) {
    const descriptors: BevelAttributeDescriptor[] = [];
    const addDescriptor = (name: BevelAttributeName, stride: number) => {
        const source = vertexData[name];

        if (!source || source.length < vertexCount * stride) {
            return;
        }

        descriptors.push({
            name,
            source,
            stride,
            offset: descriptors.reduce((sum, descriptor) => sum + descriptor.stride, 0),
            output: [],
        });
    };

    addDescriptor("tangents", 4);
    addDescriptor("uvs", 2);
    addDescriptor("uvs2", 2);
    addDescriptor("uvs3", 2);
    addDescriptor("uvs4", 2);
    addDescriptor("uvs5", 2);
    addDescriptor("uvs6", 2);
    if (vertexData.colors) {
        addDescriptor("colors", vertexData.colors.length === vertexData.positions!.length ? 3 : 4);
    }
    addDescriptor("matricesIndices", 4);
    addDescriptor("matricesWeights", 4);
    addDescriptor("matricesIndicesExtra", 4);
    addDescriptor("matricesWeightsExtra", 4);

    return descriptors;
}

function _GetAttributeLength(descriptors: BevelAttributeDescriptor[]) {
    return descriptors.reduce((sum, descriptor) => sum + descriptor.stride, 0);
}

function _GetVertexAttributes(descriptors: BevelAttributeDescriptor[], vertexIndex: number) {
    const attributes: number[] = [];

    for (const descriptor of descriptors) {
        const sourceOffset = vertexIndex * descriptor.stride;
        for (let index = 0; index < descriptor.stride; index++) {
            attributes.push(descriptor.source[sourceOffset + index]);
        }
    }

    return attributes;
}

function _InterpolateAttributes(start: number[], end: number[], amount: number) {
    if (!start.length) {
        return start;
    }

    return start.map((value, index) => value + (end[index] - value) * amount);
}

function _AverageAttributes(attributes: number[][], length: number) {
    if (!length || !attributes.length) {
        return [];
    }

    const result = new Array<number>(length).fill(0);

    for (const attribute of attributes) {
        for (let index = 0; index < length; index++) {
            result[index] += attribute[index] ?? 0;
        }
    }

    for (let index = 0; index < length; index++) {
        result[index] /= attributes.length;
    }

    return result;
}

function _AttributesMatch(left: number[], right: number[]) {
    if (left.length !== right.length) {
        return false;
    }

    for (let index = 0; index < left.length; index++) {
        if (Math.abs(left[index] - right[index]) > OutputPositionEpsilon) {
            return false;
        }
    }

    return true;
}

function _AssignAttributeOutputs(result: VertexData, descriptors: BevelAttributeDescriptor[], vertexAttributes: number[][]) {
    for (const descriptor of descriptors) {
        descriptor.output.length = 0;

        for (const attributes of vertexAttributes) {
            for (let index = 0; index < descriptor.stride; index++) {
                descriptor.output.push(attributes[descriptor.offset + index] ?? 0);
            }
        }

        switch (descriptor.name) {
            case "tangents":
                result.tangents = descriptor.output;
                break;
            case "uvs":
                result.uvs = descriptor.output;
                break;
            case "uvs2":
                result.uvs2 = descriptor.output;
                break;
            case "uvs3":
                result.uvs3 = descriptor.output;
                break;
            case "uvs4":
                result.uvs4 = descriptor.output;
                break;
            case "uvs5":
                result.uvs5 = descriptor.output;
                break;
            case "uvs6":
                result.uvs6 = descriptor.output;
                break;
            case "colors":
                result.colors = descriptor.output;
                break;
            case "matricesIndices":
                result.matricesIndices = descriptor.output;
                break;
            case "matricesWeights":
                result.matricesWeights = descriptor.output;
                break;
            case "matricesIndicesExtra":
                result.matricesIndicesExtra = descriptor.output;
                break;
            case "matricesWeightsExtra":
                result.matricesWeightsExtra = descriptor.output;
                break;
        }
    }
}

function _GetMaterialIndex(vertexData: VertexData, indexStart: number) {
    if (!vertexData.materialInfos) {
        return 0;
    }

    for (const materialInfo of vertexData.materialInfos) {
        if (indexStart >= materialInfo.indexStart && indexStart < materialInfo.indexStart + materialInfo.indexCount) {
            return materialInfo.materialIndex;
        }
    }

    return 0;
}

function _BuildMaterialInfoResult(vertexData: VertexData, indices: number[], materialIndices: number[], vertexCount: number) {
    if (!vertexData.materialInfos?.length) {
        return { indices, materialInfos: null };
    }

    const materialOrder = vertexData.materialInfos.map((materialInfo) => materialInfo.materialIndex);
    const groups = new Map<number, number[]>();

    for (let triangleIndex = 0; triangleIndex < materialIndices.length; triangleIndex++) {
        const materialIndex = materialIndices[triangleIndex];
        let group = groups.get(materialIndex);

        if (!group) {
            group = [];
            groups.set(materialIndex, group);
            if (!materialOrder.includes(materialIndex)) {
                materialOrder.push(materialIndex);
            }
        }

        const indexOffset = triangleIndex * 3;
        group.push(indices[indexOffset], indices[indexOffset + 1], indices[indexOffset + 2]);
    }

    const groupedIndices: number[] = [];
    const materialInfos: VertexDataMaterialInfo[] = [];

    for (const materialIndex of materialOrder) {
        const group = groups.get(materialIndex);

        if (!group?.length) {
            continue;
        }

        const materialInfo = new VertexDataMaterialInfo();
        materialInfo.materialIndex = materialIndex;
        materialInfo.indexStart = groupedIndices.length;
        materialInfo.indexCount = group.length;
        materialInfo.verticesStart = 0;
        materialInfo.verticesCount = vertexCount;
        groupedIndices.push(...group);
        materialInfos.push(materialInfo);
    }

    return { indices: groupedIndices, materialInfos };
}

function _IsFlatFace(face: BevelFace) {
    return face.cornerNormals.every((normal) => Vector3.Dot(normal, face.normal) > 1 - PositionEpsilon);
}

function _IsBevelPolygonPoint(point: BevelCapPoint): point is BevelPolygonPoint {
    return (point as BevelPolygonPoint).position !== undefined;
}

function _GetCapPointPosition(point: BevelCapPoint) {
    return _IsBevelPolygonPoint(point) ? point.position : point;
}

function _GetCapPointNormal(point: BevelCapPoint, fallback: Vector3) {
    return _IsBevelPolygonPoint(point) ? point.normal : fallback;
}

function _GetCapPointAttributes(point: BevelCapPoint) {
    return _IsBevelPolygonPoint(point) ? point.attributes : [];
}

function _GetCapPointMaterialIndex(point: BevelCapPoint) {
    return _IsBevelPolygonPoint(point) ? point.materialIndex : 0;
}

function _BuildTopology(vertexData: VertexData): BevelTopology | null {
    const positions = vertexData.positions;
    const normals = vertexData.normals;

    if (!positions || positions.length < 9) {
        return null;
    }

    const vertexCount = positions.length / 3;
    const indices = vertexData.indices && vertexData.indices.length ? Array.from(vertexData.indices) : Array.from({ length: vertexCount }, (_, index) => index);
    const weldedPositionMap = new Map<string, number>();
    const originalToWelded: number[] = [];
    const weldedPositions: Vector3[] = [];

    for (let index = 0; index < vertexCount; index++) {
        const x = positions[index * 3];
        const y = positions[index * 3 + 1];
        const z = positions[index * 3 + 2];
        const key = _PositionKey(x, y, z);
        let weldedIndex = weldedPositionMap.get(key);

        if (weldedIndex === undefined) {
            weldedIndex = weldedPositions.length;
            weldedPositionMap.set(key, weldedIndex);
            weldedPositions.push(new Vector3(x, y, z));
        }

        originalToWelded[index] = weldedIndex;
    }

    const faces: BevelFace[] = [];
    const edges = new Map<string, BevelEdge>();
    const vertexFaces = new Map<number, number[]>();
    const edge0 = new Vector3();
    const edge1 = new Vector3();
    const normal = new Vector3();

    for (let index = 0; index < indices.length; index += 3) {
        let originalIndices: [number, number, number] = [indices[index], indices[index + 1], indices[index + 2]];
        const i0 = originalToWelded[originalIndices[0]];
        const i1 = originalToWelded[originalIndices[1]];
        const i2 = originalToWelded[originalIndices[2]];

        if (i0 === i1 || i1 === i2 || i2 === i0) {
            continue;
        }

        let faceIndices: [number, number, number] = [i0, i1, i2];
        const p0 = weldedPositions[faceIndices[0]];
        const p1 = weldedPositions[faceIndices[1]];
        const p2 = weldedPositions[faceIndices[2]];

        p1.subtractToRef(p0, edge0);
        p2.subtractToRef(p0, edge1);
        Vector3.CrossToRef(edge0, edge1, normal);

        if (normal.lengthSquared() < NormalEpsilon) {
            continue;
        }

        let cornerNormals: [Vector3, Vector3, Vector3] = normals
            ? [
                  _NormalizeNormalOrFallback(Vector3.FromArray(normals, originalIndices[0] * 3), normal),
                  _NormalizeNormalOrFallback(Vector3.FromArray(normals, originalIndices[1] * 3), normal),
                  _NormalizeNormalOrFallback(Vector3.FromArray(normals, originalIndices[2] * 3), normal),
              ]
            : [normal.normalizeToNew(), normal.normalizeToNew(), normal.normalizeToNew()];

        const averageCornerNormal = _NormalizeNormalOrFallback(cornerNormals[0].add(cornerNormals[1]).addInPlace(cornerNormals[2]), normal);

        if (normals && Vector3.Dot(normal, averageCornerNormal) < 0) {
            faceIndices = [i0, i2, i1];
            originalIndices = [originalIndices[0], originalIndices[2], originalIndices[1]];
            cornerNormals = [cornerNormals[0], cornerNormals[2], cornerNormals[1]];
            normal.scaleInPlace(-1);
        }

        const faceNormal = normal.normalizeToNew();

        if (!normals) {
            cornerNormals = [faceNormal.clone(), faceNormal.clone(), faceNormal.clone()];
        }

        const faceIndex = faces.length;
        faces.push({
            indices: faceIndices,
            originalIndices,
            normal: faceNormal,
            cornerNormals,
            materialIndex: _GetMaterialIndex(vertexData, index),
        });

        for (const vertexIndex of faceIndices) {
            let faceList = vertexFaces.get(vertexIndex);
            if (!faceList) {
                faceList = [];
                vertexFaces.set(vertexIndex, faceList);
            }
            faceList.push(faceIndex);
        }

        for (let edgeIndex = 0; edgeIndex < 3; edgeIndex++) {
            const v0 = faceIndices[edgeIndex];
            const v1 = faceIndices[(edgeIndex + 1) % 3];
            const key = _EdgeKey(v0, v1);
            let edge = edges.get(key);

            if (!edge) {
                edge = {
                    key,
                    v0: Math.min(v0, v1),
                    v1: Math.max(v0, v1),
                    faces: [],
                };
                edges.set(key, edge);
            }

            edge.faces.push({ faceIndex });
        }
    }

    if (!faces.length) {
        return null;
    }

    return {
        positions: weldedPositions,
        faces,
        edges,
        vertexFaces,
    };
}

function _ClonePolygonPoint(point: BevelPolygonPoint): BevelPolygonPoint {
    return {
        position: point.position.clone(),
        normal: point.normal.clone(),
        attributes: point.attributes.slice(),
        materialIndex: point.materialIndex,
    };
}

function _InterpolatePolygonPoint(start: BevelPolygonPoint, end: BevelPolygonPoint, amount: number): BevelPolygonPoint {
    return {
        position: Vector3.Lerp(start.position, end.position, amount),
        normal: _NormalizeNormalOrFallback(Vector3.Lerp(start.normal, end.normal, amount), start.normal),
        attributes: _InterpolateAttributes(start.attributes, end.attributes, amount),
        materialIndex: start.materialIndex,
    };
}

function _InterpolateSegmentNormal(segment: BevelFaceEdgeSegment, t: number) {
    const denominator = segment.tMax - segment.tMin;

    if (denominator <= PositionEpsilon) {
        return segment.minNormal.clone();
    }

    const amount = Math.min(1, Math.max(0, (t - segment.tMin) / denominator));
    return _NormalizeNormalOrFallback(Vector3.Lerp(segment.minNormal, segment.maxNormal, amount), segment.minNormal);
}

function _InterpolateSegmentPoint(segment: BevelFaceEdgeSegment, t: number) {
    if (t <= segment.tMin + PositionEpsilon) {
        return segment.minPoint;
    }

    if (t >= segment.tMax - PositionEpsilon) {
        return segment.maxPoint;
    }

    return Vector3.Lerp(segment.minPoint, segment.maxPoint, (t - segment.tMin) / (segment.tMax - segment.tMin));
}

function _InterpolateSegmentAttributes(segment: BevelFaceEdgeSegment, t: number) {
    if (t <= segment.tMin + PositionEpsilon) {
        return segment.minAttributes;
    }

    if (t >= segment.tMax - PositionEpsilon) {
        return segment.maxAttributes;
    }

    return _InterpolateAttributes(segment.minAttributes, segment.maxAttributes, (t - segment.tMin) / (segment.tMax - segment.tMin));
}

function _ClipPolygonAgainstEdge(polygon: BevelPolygonPoint[], edgeStart: Vector3, inward: Vector3, amount: number) {
    if (!polygon.length) {
        return polygon;
    }

    const output: BevelPolygonPoint[] = [];
    let previous = polygon[polygon.length - 1];
    let previousDistance = Vector3.Dot(previous.position.subtract(edgeStart), inward) - amount;
    let previousInside = previousDistance >= -PositionEpsilon;

    for (const current of polygon) {
        const currentDistance = Vector3.Dot(current.position.subtract(edgeStart), inward) - amount;
        const currentInside = currentDistance >= -PositionEpsilon;

        if (currentInside !== previousInside) {
            const denominator = previousDistance - currentDistance;
            if (Math.abs(denominator) > NormalEpsilon) {
                const t = previousDistance / denominator;
                output.push(_InterpolatePolygonPoint(previous, current, t));
            }
        }

        if (currentInside) {
            output.push(_ClonePolygonPoint(current));
        }

        previous = current;
        previousDistance = currentDistance;
        previousInside = currentInside;
    }

    return output;
}

function _SlerpDirections(start: Vector3, end: Vector3, amount: number) {
    const dot = Math.min(1, Math.max(-1, Vector3.Dot(start, end)));

    if (dot > 1 - PositionEpsilon) {
        return Vector3.Lerp(start, end, amount).normalize();
    }

    const theta = Math.acos(dot);
    const sinTheta = Math.sin(theta);

    if (Math.abs(sinTheta) < NormalEpsilon) {
        return Vector3.Lerp(start, end, amount).normalize();
    }

    const startScale = Math.sin((1 - amount) * theta) / sinTheta;
    const endScale = Math.sin(amount * theta) / sinTheta;
    const result = start.scale(startScale).addInPlace(end.scale(endScale));

    if (result.lengthSquared() < NormalEpsilon) {
        return Vector3.Lerp(start, end, amount).normalize();
    }

    return result.normalize();
}

function _AddUniquePoint(points: BevelCapPoint[], point: Vector3, normal: Vector3, attributes: number[], materialIndex: number) {
    const key = _VectorKey(point);
    const normalizedNormal = _NormalizeNormalOrFallback(normal, normal);

    for (const existing of points) {
        if (_VectorKey(_GetCapPointPosition(existing)) === key) {
            if (_IsBevelPolygonPoint(existing)) {
                existing.normal.addInPlace(normalizedNormal).normalize();
                existing.attributes = _AverageAttributes([existing.attributes, attributes], attributes.length);
            }
            return;
        }
    }

    points.push({
        position: point.clone(),
        normal: normalizedNormal,
        attributes: attributes.slice(),
        materialIndex,
    });
}

function _AddUniqueNormal(normals: Vector3[], normal: Vector3) {
    for (const existing of normals) {
        if (Vector3.Dot(existing, normal) > 1 - PositionEpsilon) {
            return;
        }
    }

    normals.push(normal.clone());
}

function _SolveThreePlaneIntersection(normals: Vector3[], distances: number[]) {
    const cross12 = Vector3.Cross(normals[1], normals[2]);
    const denominator = Vector3.Dot(normals[0], cross12);

    if (Math.abs(denominator) < NormalEpsilon) {
        return null;
    }

    const result = cross12.scale(distances[0]);
    result.addInPlace(Vector3.Cross(normals[2], normals[0]).scale(distances[1]));
    result.addInPlace(Vector3.Cross(normals[0], normals[1]).scale(distances[2]));
    result.scaleInPlace(1 / denominator);

    return result;
}

function _BuildCoplanarFaceClipEdges(topology: BevelTopology, selectedEdges: Set<string>) {
    const result = new Map<number, BevelFaceClipEdge[]>();
    const visitedFaces = new Set<number>();

    for (let startFaceIndex = 0; startFaceIndex < topology.faces.length; startFaceIndex++) {
        if (visitedFaces.has(startFaceIndex)) {
            continue;
        }

        const group: number[] = [];
        const stack = [startFaceIndex];
        const groupNormal = topology.faces[startFaceIndex].normal;
        visitedFaces.add(startFaceIndex);

        while (stack.length) {
            const faceIndex = stack.pop()!;
            const face = topology.faces[faceIndex];
            group.push(faceIndex);

            for (let edgeIndex = 0; edgeIndex < 3; edgeIndex++) {
                const key = _EdgeKey(face.indices[edgeIndex], face.indices[(edgeIndex + 1) % 3]);
                const edge = topology.edges.get(key);

                if (!edge) {
                    continue;
                }

                for (const edgeFace of edge.faces) {
                    if (visitedFaces.has(edgeFace.faceIndex)) {
                        continue;
                    }

                    if (Vector3.Dot(groupNormal, topology.faces[edgeFace.faceIndex].normal) < 1 - PositionEpsilon) {
                        continue;
                    }

                    visitedFaces.add(edgeFace.faceIndex);
                    stack.push(edgeFace.faceIndex);
                }
            }
        }

        const clipEdges: BevelFaceClipEdge[] = [];
        const addedClipEdges = new Set<string>();

        for (const faceIndex of group) {
            const face = topology.faces[faceIndex];

            for (let edgeIndex = 0; edgeIndex < 3; edgeIndex++) {
                const start = face.indices[edgeIndex];
                const end = face.indices[(edgeIndex + 1) % 3];
                const key = _EdgeKey(start, end);

                if (!selectedEdges.has(key) || addedClipEdges.has(key)) {
                    continue;
                }

                const edgeStart = topology.positions[start];
                const edgeEnd = topology.positions[end];
                const edgeDirection = edgeEnd.subtract(edgeStart).normalize();
                const inward = Vector3.Cross(face.normal, edgeDirection).normalize();
                clipEdges.push({ key, start, end, inward });
                addedClipEdges.add(key);
            }
        }

        for (const faceIndex of group) {
            result.set(faceIndex, clipEdges);
        }
    }

    return result;
}

function _InsertPointOnPolygonBoundary(polygon: BevelPolygonPoint[], point: Vector3) {
    for (const existing of polygon) {
        if (existing.position.subtract(point).lengthSquared() <= PositionEpsilon * PositionEpsilon) {
            return;
        }
    }

    let bestEdgeIndex = -1;
    let bestDistanceSquared = Number.MAX_VALUE;
    let bestProjection = 0;

    for (let index = 0; index < polygon.length; index++) {
        const start = polygon[index].position;
        const end = polygon[(index + 1) % polygon.length].position;
        const edge = end.subtract(start);
        const edgeLengthSquared = edge.lengthSquared();

        if (edgeLengthSquared < PositionEpsilon * PositionEpsilon) {
            continue;
        }

        const projection = Vector3.Dot(point.subtract(start), edge) / edgeLengthSquared;

        if (projection < -PositionEpsilon || projection > 1 + PositionEpsilon) {
            continue;
        }

        const closest = start.add(edge.scale(projection));
        const distanceSquared = closest.subtract(point).lengthSquared();

        if (distanceSquared < bestDistanceSquared) {
            bestDistanceSquared = distanceSquared;
            bestEdgeIndex = index;
            bestProjection = projection;
        }
    }

    if (bestEdgeIndex !== -1 && bestDistanceSquared <= OutputPositionEpsilon * OutputPositionEpsilon) {
        const insertedPoint = _InterpolatePolygonPoint(polygon[bestEdgeIndex], polygon[(bestEdgeIndex + 1) % polygon.length], bestProjection);
        insertedPoint.position = point.clone();
        polygon.splice(bestEdgeIndex + 1, 0, insertedPoint);
    }
}

function _BuildMergedBoundaryPolygon(polygons: BevelPolygonPoint[][]) {
    const points = new Map<string, BevelPolygonPoint>();
    const edgeUseCounts = new Map<string, { count: number; key0: string; key1: string }>();

    for (const polygon of polygons) {
        for (const point of polygon) {
            const key = _VectorKey(point.position);
            const existing = points.get(key);

            if (existing) {
                existing.normal.addInPlace(point.normal).normalize();
            } else {
                points.set(key, _ClonePolygonPoint(point));
            }
        }

        for (let index = 0; index < polygon.length; index++) {
            const key0 = _VectorKey(polygon[index].position);
            const key1 = _VectorKey(polygon[(index + 1) % polygon.length].position);

            if (key0 === key1) {
                continue;
            }

            const edgeKey = key0 < key1 ? `${key0}|${key1}` : `${key1}|${key0}`;
            const edgeUseCount = edgeUseCounts.get(edgeKey);

            if (edgeUseCount) {
                edgeUseCount.count++;
            } else {
                edgeUseCounts.set(edgeKey, { count: 1, key0, key1 });
            }
        }
    }

    const adjacency = new Map<string, string[]>();
    for (const edge of Array.from(edgeUseCounts.values())) {
        if (edge.count !== 1) {
            continue;
        }

        let adjacency0 = adjacency.get(edge.key0);
        if (!adjacency0) {
            adjacency0 = [];
            adjacency.set(edge.key0, adjacency0);
        }
        adjacency0.push(edge.key1);

        let adjacency1 = adjacency.get(edge.key1);
        if (!adjacency1) {
            adjacency1 = [];
            adjacency.set(edge.key1, adjacency1);
        }
        adjacency1.push(edge.key0);
    }

    if (!adjacency.size || Array.from(adjacency.values()).some((neighbors) => neighbors.length !== 2)) {
        return null;
    }

    const startKey = Array.from(adjacency.keys()).sort()[0];
    const orderedKeys: string[] = [];
    let previousKey = "";
    let currentKey = startKey;

    do {
        orderedKeys.push(currentKey);
        const neighbors = adjacency.get(currentKey)!;
        const nextKey = neighbors[0] === previousKey ? neighbors[1] : neighbors[0];
        previousKey = currentKey;
        currentKey = nextKey;

        if (orderedKeys.length > adjacency.size) {
            return null;
        }
    } while (currentKey !== startKey);

    if (orderedKeys.length !== adjacency.size) {
        return null;
    }

    return orderedKeys.map((key) => points.get(key)!);
}

function _BevelVertexData(vertexData: VertexData, amount: number, segments: number, angle: number) {
    const topology = _BuildTopology(vertexData);

    if (!topology || amount <= PositionEpsilon || segments <= 0) {
        return _CloneVertexData(vertexData);
    }

    const selectedEdges = new Set<string>();
    const selectedVertices = new Set<number>();
    const selectedEdgeCountPerVertex = new Map<number, number>();
    const threshold = Math.cos(angle + AngleEpsilon);
    let shortestSelectedEdgeLength = Number.MAX_VALUE;

    for (const edge of Array.from(topology.edges.values())) {
        if (edge.faces.length !== 2) {
            continue;
        }

        const face0 = topology.faces[edge.faces[0].faceIndex];
        const face1 = topology.faces[edge.faces[1].faceIndex];

        if (Vector3.Dot(face0.normal, face1.normal) < threshold) {
            selectedEdges.add(edge.key);
            selectedVertices.add(edge.v0);
            selectedVertices.add(edge.v1);
            selectedEdgeCountPerVertex.set(edge.v0, (selectedEdgeCountPerVertex.get(edge.v0) ?? 0) + 1);
            selectedEdgeCountPerVertex.set(edge.v1, (selectedEdgeCountPerVertex.get(edge.v1) ?? 0) + 1);
            shortestSelectedEdgeLength = Math.min(shortestSelectedEdgeLength, Vector3.Distance(topology.positions[edge.v0], topology.positions[edge.v1]));
        }
    }

    if (!selectedEdges.size) {
        return _CloneVertexData(vertexData);
    }

    const bevelAmount = Math.min(amount, shortestSelectedEdgeLength * 0.5);

    if (bevelAmount <= PositionEpsilon) {
        return _CloneVertexData(vertexData);
    }

    const faceClipEdges = _BuildCoplanarFaceClipEdges(topology, selectedEdges);
    const attributeDescriptors = _BuildAttributeDescriptors(vertexData, vertexData.positions!.length / 3);
    const attributeLength = _GetAttributeLength(attributeDescriptors);
    const outputPositions: number[] = [];
    const outputNormals: Vector3[] = [];
    const outputNormalContributions: Vector3[][] = [];
    const outputVertexAttributes: number[][] = [];
    const outputIndices: number[] = [];
    const outputTriangleMaterialIndices: number[] = [];
    const outputVertexBuckets = new Map<string, number[]>();
    const outputVertexGroups: string[] = [];
    const faceEdgeSegments = new Map<string, BevelFaceEdgeSegment>();
    const capPoints = new Map<number, BevelCapPoint[]>();
    const preparedFaces: BevelPreparedFace[] = [];
    const edgeIntervals = new Map<string, BevelEdgeInterval>();

    const getOrCreateVertex = (position: Vector3, normal: Vector3, smoothingGroup: string, attributes: number[]) => {
        const normalizedNormal = normal.normalizeToNew();
        const vertexAttributes = attributeLength ? (attributes.length === attributeLength ? attributes : new Array<number>(attributeLength).fill(0)) : [];
        const qx = _OutputQuantize(position.x);
        const qy = _OutputQuantize(position.y);
        const qz = _OutputQuantize(position.z);
        let canonicalIndex = -1;

        for (let dz = -1; dz <= 1; dz++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const bucket = outputVertexBuckets.get(_OutputPositionKey(qx + dx, qy + dy, qz + dz));

                    if (!bucket) {
                        continue;
                    }

                    for (const index of bucket) {
                        const outputIndex = index * 3;
                        const deltaX = outputPositions[outputIndex] - position.x;
                        const deltaY = outputPositions[outputIndex + 1] - position.y;
                        const deltaZ = outputPositions[outputIndex + 2] - position.z;

                        if (deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ <= OutputPositionEpsilon * OutputPositionEpsilon) {
                            if (canonicalIndex === -1) {
                                canonicalIndex = index;
                            }

                            if (outputVertexGroups[index] !== smoothingGroup) {
                                continue;
                            }

                            if (!_AttributesMatch(outputVertexAttributes[index], vertexAttributes)) {
                                continue;
                            }

                            const normalContributions = outputNormalContributions[index];
                            if (!normalContributions.some((normal) => Vector3.Dot(normal, normalizedNormal) > 1 - PositionEpsilon)) {
                                normalContributions.push(normalizedNormal);
                                outputNormals[index].addInPlace(normalizedNormal);
                            }
                            return index;
                        }
                    }
                }
            }
        }

        const index = outputPositions.length / 3;
        const outputX = canonicalIndex === -1 ? position.x : outputPositions[canonicalIndex * 3];
        const outputY = canonicalIndex === -1 ? position.y : outputPositions[canonicalIndex * 3 + 1];
        const outputZ = canonicalIndex === -1 ? position.z : outputPositions[canonicalIndex * 3 + 2];
        const key = _OutputPositionKey(_OutputQuantize(outputX), _OutputQuantize(outputY), _OutputQuantize(outputZ));
        let bucket = outputVertexBuckets.get(key);

        if (!bucket) {
            bucket = [];
            outputVertexBuckets.set(key, bucket);
        }

        bucket.push(index);
        outputPositions.push(outputX, outputY, outputZ);
        outputNormals.push(normalizedNormal);
        outputNormalContributions.push([normalizedNormal.clone()]);
        outputVertexAttributes.push(vertexAttributes.slice());
        outputVertexGroups.push(smoothingGroup);

        return index;
    };

    const addCapPoint = (vertexIndex: number, point: Vector3, normal: Vector3, attributes: number[], materialIndex: number) => {
        let points = capPoints.get(vertexIndex);
        if (!points) {
            points = [];
            capPoints.set(vertexIndex, points);
        }
        _AddUniquePoint(points, point, normal, attributes, materialIndex);
    };

    const addTriangle = (
        p0: Vector3,
        p1: Vector3,
        p2: Vector3,
        targetNormal: Vector3,
        n0 = targetNormal,
        n1 = targetNormal,
        n2 = targetNormal,
        smoothingGroup = "smooth",
        p0Attributes: number[] = [],
        p1Attributes: number[] = [],
        p2Attributes: number[] = [],
        materialIndex = 0
    ) => {
        const edge0 = p1.subtract(p0);
        const edge1 = p2.subtract(p0);
        const normal = Vector3.Cross(edge0, edge1);

        if (normal.lengthSquared() < TriangleAreaEpsilon) {
            return;
        }

        let v1 = p1;
        let v2 = p2;
        let vn1 = n1;
        let vn2 = n2;
        let va1 = p1Attributes;
        let va2 = p2Attributes;

        if (Vector3.Dot(normal, targetNormal) > 0) {
            v1 = p2;
            v2 = p1;
            vn1 = n2;
            vn2 = n1;
            va1 = p2Attributes;
            va2 = p1Attributes;
        }

        const i0 = getOrCreateVertex(p0, n0, smoothingGroup, p0Attributes);
        const i1 = getOrCreateVertex(v1, vn1, smoothingGroup, va1);
        const i2 = getOrCreateVertex(v2, vn2, smoothingGroup, va2);

        if (i0 === i1 || i1 === i2 || i2 === i0) {
            return;
        }

        outputIndices.push(i0, i1, i2);
        outputTriangleMaterialIndices.push(materialIndex);
    };

    const addFacePolygon = (polygon: BevelPolygonPoint[], normal: Vector3, smoothingGroup: string, useFlatNormals: boolean) => {
        const center = new Vector3();
        const centerAttributes = _AverageAttributes(
            polygon.map((point) => point.attributes),
            attributeLength
        );
        const materialIndex = polygon[0]?.materialIndex ?? 0;
        const centerNormal = useFlatNormals
            ? normal
            : _NormalizeNormalOrFallback(
                  polygon.reduce((accumulator, point) => accumulator.addInPlace(point.normal), new Vector3()),
                  normal
              );

        for (const point of polygon) {
            center.addInPlace(point.position);
        }
        center.scaleInPlace(1 / polygon.length);

        for (let index = 0; index < polygon.length; index++) {
            const nextIndex = (index + 1) % polygon.length;
            addTriangle(
                center,
                polygon[index].position,
                polygon[nextIndex].position,
                normal,
                centerNormal,
                useFlatNormals ? normal : polygon[index].normal,
                useFlatNormals ? normal : polygon[nextIndex].normal,
                smoothingGroup,
                centerAttributes,
                polygon[index].attributes,
                polygon[nextIndex].attributes,
                materialIndex
            );
        }
    };

    for (let faceIndex = 0; faceIndex < topology.faces.length; faceIndex++) {
        const face = topology.faces[faceIndex];
        const isFlat = _IsFlatFace(face);
        let polygon = face.indices.map((index, cornerIndex) => ({
            position: topology.positions[index].clone(),
            normal: face.cornerNormals[cornerIndex].clone(),
            attributes: _GetVertexAttributes(attributeDescriptors, face.originalIndices[cornerIndex]),
            materialIndex: face.materialIndex,
        }));
        const selectedFaceEdges: BevelFaceClipEdge[] = [];

        for (let edgeIndex = 0; edgeIndex < 3; edgeIndex++) {
            const start = face.indices[edgeIndex];
            const end = face.indices[(edgeIndex + 1) % 3];
            const key = _EdgeKey(start, end);

            if (!selectedEdges.has(key)) {
                continue;
            }

            const edgeStart = topology.positions[start];
            const edgeEnd = topology.positions[end];
            const edgeDirection = edgeEnd.subtract(edgeStart).normalize();
            const inward = Vector3.Cross(face.normal, edgeDirection).normalize();
            selectedFaceEdges.push({ key, start, end, inward });
        }

        const clipEdges = faceClipEdges.get(faceIndex) ?? selectedFaceEdges;

        for (const clipEdge of clipEdges) {
            polygon = _ClipPolygonAgainstEdge(polygon, topology.positions[clipEdge.start], clipEdge.inward, bevelAmount);
        }

        if (isFlat) {
            for (const point of polygon) {
                point.normal = face.normal.clone();
            }
        }

        preparedFaces.push({ faceIndex, polygon, selectedFaceEdges, isFlat });

        for (const selectedFaceEdge of selectedFaceEdges) {
            const edge = topology.edges.get(selectedFaceEdge.key)!;
            const edgeStart = topology.positions[edge.v0];
            const edgeEnd = topology.positions[edge.v1];
            const axis = edgeEnd.subtract(edgeStart);
            const edgeLength = axis.length();

            if (edgeLength < PositionEpsilon) {
                continue;
            }

            axis.normalize();

            const pointsOnLine: Array<{ point: BevelPolygonPoint; t: number }> = [];
            const orientedEdgeStart = topology.positions[selectedFaceEdge.start];

            for (const point of polygon) {
                const distance = Vector3.Dot(point.position.subtract(orientedEdgeStart), selectedFaceEdge.inward);

                if (Math.abs(distance - bevelAmount) < PositionEpsilon * 10) {
                    const t = Vector3.Dot(point.position.subtract(edgeStart), axis);
                    if (t >= -PositionEpsilon && t <= edgeLength + PositionEpsilon) {
                        pointsOnLine.push({ point, t: Math.min(edgeLength, Math.max(0, t)) });
                    }
                }
            }

            if (pointsOnLine.length < 2) {
                continue;
            }

            pointsOnLine.sort((a, b) => a.t - b.t);

            const minPoint = pointsOnLine[0].point.position;
            const maxPoint = pointsOnLine[pointsOnLine.length - 1].point.position;
            const minNormal = pointsOnLine[0].point.normal;
            const maxNormal = pointsOnLine[pointsOnLine.length - 1].point.normal;
            const minAttributes = pointsOnLine[0].point.attributes;
            const maxAttributes = pointsOnLine[pointsOnLine.length - 1].point.attributes;
            const segment: BevelFaceEdgeSegment = {
                edgeKey: selectedFaceEdge.key,
                faceIndex,
                inward: selectedFaceEdge.inward,
                tMin: pointsOnLine[0].t,
                tMax: pointsOnLine[pointsOnLine.length - 1].t,
                minPoint,
                maxPoint,
                minNormal,
                maxNormal,
                minAttributes,
                maxAttributes,
                materialIndex: face.materialIndex,
            };

            faceEdgeSegments.set(`${faceIndex}|${selectedFaceEdge.key}`, segment);
            addCapPoint(edge.v0, minPoint, pointsOnLine[0].point.normal, minAttributes, face.materialIndex);
            addCapPoint(edge.v1, maxPoint, pointsOnLine[pointsOnLine.length - 1].point.normal, maxAttributes, face.materialIndex);
        }
    }

    for (const edgeKey of Array.from(selectedEdges)) {
        const edge = topology.edges.get(edgeKey)!;
        const face0 = edge.faces[0].faceIndex;
        const face1 = edge.faces[1].faceIndex;
        const segment0 = faceEdgeSegments.get(`${face0}|${edgeKey}`);
        const segment1 = faceEdgeSegments.get(`${face1}|${edgeKey}`);

        if (!segment0 || !segment1) {
            continue;
        }

        const edgeStart = topology.positions[edge.v0];
        const edgeEnd = topology.positions[edge.v1];
        const axis = edgeEnd.subtract(edgeStart);
        const edgeLength = axis.length();

        if (edgeLength < PositionEpsilon) {
            continue;
        }

        axis.normalize();

        const tStart = Math.max(segment0.tMin, segment1.tMin);
        const tEnd = Math.min(segment0.tMax, segment1.tMax);

        if (tEnd - tStart <= PositionEpsilon) {
            continue;
        }

        edgeIntervals.set(edgeKey, { tStart, tEnd });
    }

    for (const preparedFace of preparedFaces) {
        for (const selectedFaceEdge of preparedFace.selectedFaceEdges) {
            const edge = topology.edges.get(selectedFaceEdge.key)!;
            const interval = edgeIntervals.get(selectedFaceEdge.key);
            const segment = faceEdgeSegments.get(`${preparedFace.faceIndex}|${selectedFaceEdge.key}`);

            if (!interval || !segment) {
                continue;
            }

            const edgeStart = topology.positions[edge.v0];
            const edgeEnd = topology.positions[edge.v1];
            const axis = edgeEnd.subtract(edgeStart);
            const edgeLength = axis.length();

            if (edgeLength < PositionEpsilon) {
                continue;
            }

            axis.normalize();

            for (const t of [interval.tStart, interval.tEnd]) {
                if (t <= segment.tMin + PositionEpsilon || t >= segment.tMax - PositionEpsilon) {
                    continue;
                }

                _InsertPointOnPolygonBoundary(preparedFace.polygon, edgeStart.add(axis.scale(t)).addInPlace(segment.inward.scale(bevelAmount)));
            }
        }
    }

    const emittedMergedFaces = new Set<number>();
    const preparedFacesByPlane = new Map<string, BevelPreparedFace[]>();

    for (const preparedFace of preparedFaces) {
        if (!preparedFace.selectedFaceEdges.length || !preparedFace.isFlat) {
            continue;
        }

        const face = topology.faces[preparedFace.faceIndex];
        const distance = Vector3.Dot(topology.positions[face.indices[0]], face.normal);
        const planeKey = `${_PositionKey(face.normal.x, face.normal.y, face.normal.z)}:${_Quantize(distance)}`;
        let group = preparedFacesByPlane.get(planeKey);

        if (!group) {
            group = [];
            preparedFacesByPlane.set(planeKey, group);
        }

        group.push(preparedFace);
    }

    for (const group of Array.from(preparedFacesByPlane.values())) {
        if (group.length < 2) {
            continue;
        }

        const mergedPolygon = _BuildMergedBoundaryPolygon(group.map((preparedFace) => preparedFace.polygon));

        if (!mergedPolygon || mergedPolygon.length < 3) {
            continue;
        }

        const face = topology.faces[group[0].faceIndex];
        addFacePolygon(mergedPolygon, face.normal, `face-flat:${_PositionKey(face.normal.x, face.normal.y, face.normal.z)}`, true);

        for (const preparedFace of group) {
            emittedMergedFaces.add(preparedFace.faceIndex);
        }
    }

    for (const preparedFace of preparedFaces) {
        if (emittedMergedFaces.has(preparedFace.faceIndex)) {
            continue;
        }

        const face = topology.faces[preparedFace.faceIndex];
        const smoothingGroup = preparedFace.selectedFaceEdges.length && !preparedFace.isFlat ? "smooth" : `face-flat:${_PositionKey(face.normal.x, face.normal.y, face.normal.z)}`;

        if (preparedFace.polygon.length >= 3) {
            if (smoothingGroup === "smooth") {
                addFacePolygon(preparedFace.polygon, face.normal, smoothingGroup, false);
            } else {
                for (let index = 1; index < preparedFace.polygon.length - 1; index++) {
                    addTriangle(
                        preparedFace.polygon[0].position,
                        preparedFace.polygon[index].position,
                        preparedFace.polygon[index + 1].position,
                        face.normal,
                        face.normal,
                        face.normal,
                        face.normal,
                        smoothingGroup,
                        preparedFace.polygon[0].attributes,
                        preparedFace.polygon[index].attributes,
                        preparedFace.polygon[index + 1].attributes,
                        face.materialIndex
                    );
                }
            }
        }
    }

    for (const edgeKey of Array.from(selectedEdges)) {
        const edge = topology.edges.get(edgeKey)!;
        const face0 = edge.faces[0].faceIndex;
        const face1 = edge.faces[1].faceIndex;
        const segment0 = faceEdgeSegments.get(`${face0}|${edgeKey}`);
        const segment1 = faceEdgeSegments.get(`${face1}|${edgeKey}`);
        const interval = edgeIntervals.get(edgeKey);

        if (!segment0 || !segment1 || !interval) {
            continue;
        }

        const edgeStart = topology.positions[edge.v0];
        const edgeEnd = topology.positions[edge.v1];
        const axis = edgeEnd.subtract(edgeStart);
        const edgeLength = axis.length();

        if (edgeLength < PositionEpsilon) {
            continue;
        }

        axis.normalize();

        const { tStart, tEnd } = interval;
        const faceNormal0 = topology.faces[segment0.faceIndex].normal;
        const faceNormal1 = topology.faces[segment1.faceIndex].normal;
        const segment0Start = _InterpolateSegmentPoint(segment0, tStart);
        const segment1Start = _InterpolateSegmentPoint(segment1, tStart);
        const segment0End = _InterpolateSegmentPoint(segment0, tEnd);
        const segment1End = _InterpolateSegmentPoint(segment1, tEnd);
        const segment0StartNormal = _InterpolateSegmentNormal(segment0, tStart);
        const segment1StartNormal = _InterpolateSegmentNormal(segment1, tStart);
        const segment0EndNormal = _InterpolateSegmentNormal(segment0, tEnd);
        const segment1EndNormal = _InterpolateSegmentNormal(segment1, tEnd);
        const segment0StartAttributes = _InterpolateSegmentAttributes(segment0, tStart);
        const segment1StartAttributes = _InterpolateSegmentAttributes(segment1, tStart);
        const segment0EndAttributes = _InterpolateSegmentAttributes(segment0, tEnd);
        const segment1EndAttributes = _InterpolateSegmentAttributes(segment1, tEnd);
        const centerStart = segment0Start
            .subtract(faceNormal0.scale(bevelAmount))
            .addInPlace(segment1Start.subtract(faceNormal1.scale(bevelAmount)))
            .scaleInPlace(0.5);
        const centerEnd = segment0End
            .subtract(faceNormal0.scale(bevelAmount))
            .addInPlace(segment1End.subtract(faceNormal1.scale(bevelAmount)))
            .scaleInPlace(0.5);
        const startProfilePoints: Vector3[] = [];
        const endProfilePoints: Vector3[] = [];
        const startProfileNormals: Vector3[] = [];
        const endProfileNormals: Vector3[] = [];
        const startProfileAttributes: number[][] = [];
        const endProfileAttributes: number[][] = [];

        for (let segmentIndex = 0; segmentIndex <= segments; segmentIndex++) {
            const profileAmount = segmentIndex / segments;
            const profileNormal = _SlerpDirections(faceNormal0, faceNormal1, profileAmount);
            const startNormal = _SlerpDirections(segment0StartNormal, segment1StartNormal, profileAmount);
            const endNormal = _SlerpDirections(segment0EndNormal, segment1EndNormal, profileAmount);
            const startAttributes = _InterpolateAttributes(segment0StartAttributes, segment1StartAttributes, profileAmount);
            const endAttributes = _InterpolateAttributes(segment0EndAttributes, segment1EndAttributes, profileAmount);
            let startPoint = centerStart.add(profileNormal.scale(bevelAmount));
            let endPoint = centerEnd.add(profileNormal.scale(bevelAmount));

            if (segmentIndex === 0) {
                startPoint = segment0Start;
                endPoint = segment0End;
            } else if (segmentIndex === segments) {
                startPoint = segment1Start;
                endPoint = segment1End;
            }

            startProfilePoints.push(startPoint);
            endProfilePoints.push(endPoint);
            startProfileNormals.push(startNormal);
            endProfileNormals.push(endNormal);
            startProfileAttributes.push(startAttributes);
            endProfileAttributes.push(endAttributes);
            addCapPoint(edge.v0, startPoint, startNormal, startAttributes, segment0.materialIndex);
            addCapPoint(edge.v1, endPoint, endNormal, endAttributes, segment0.materialIndex);
        }

        for (let segmentIndex = 0; segmentIndex < segments; segmentIndex++) {
            const normalTarget = _SlerpDirections(faceNormal0, faceNormal1, (segmentIndex + 0.5) / segments);

            addTriangle(
                startProfilePoints[segmentIndex],
                endProfilePoints[segmentIndex],
                endProfilePoints[segmentIndex + 1],
                normalTarget,
                startProfileNormals[segmentIndex],
                endProfileNormals[segmentIndex],
                endProfileNormals[segmentIndex + 1],
                "smooth",
                startProfileAttributes[segmentIndex],
                endProfileAttributes[segmentIndex],
                endProfileAttributes[segmentIndex + 1],
                segment0.materialIndex
            );
            addTriangle(
                startProfilePoints[segmentIndex],
                endProfilePoints[segmentIndex + 1],
                startProfilePoints[segmentIndex + 1],
                normalTarget,
                startProfileNormals[segmentIndex],
                endProfileNormals[segmentIndex + 1],
                startProfileNormals[segmentIndex + 1],
                "smooth",
                startProfileAttributes[segmentIndex],
                endProfileAttributes[segmentIndex + 1],
                startProfileAttributes[segmentIndex + 1],
                segment0.materialIndex
            );
        }
    }

    const addSphericalCornerPatch = (vertexIndex: number) => {
        if ((selectedEdgeCountPerVertex.get(vertexIndex) ?? 0) < 3) {
            return false;
        }

        const incidentNormals: Vector3[] = [];
        const vertexPosition = topology.positions[vertexIndex];
        const cornerCapPoints = capPoints.get(vertexIndex) ?? [];
        const cornerAttributes = _AverageAttributes(
            cornerCapPoints.map((point) => _GetCapPointAttributes(point)),
            attributeLength
        );
        const materialIndex = cornerCapPoints.length ? _GetCapPointMaterialIndex(cornerCapPoints[0]) : 0;

        for (const edgeKey of Array.from(selectedEdges)) {
            const edge = topology.edges.get(edgeKey)!;

            if (edge.v0 !== vertexIndex && edge.v1 !== vertexIndex) {
                continue;
            }

            for (const edgeFace of edge.faces) {
                _AddUniqueNormal(incidentNormals, topology.faces[edgeFace.faceIndex].normal);
            }
        }

        if (incidentNormals.length !== 3) {
            return false;
        }

        const averageNormal = incidentNormals[0].add(incidentNormals[1]).addInPlace(incidentNormals[2]).normalize();
        const tangent = incidentNormals[0].subtract(averageNormal.scale(Vector3.Dot(incidentNormals[0], averageNormal))).normalize();
        const bitangent = Vector3.Cross(averageNormal, tangent).normalize();
        incidentNormals.sort((a, b) => Math.atan2(Vector3.Dot(a, bitangent), Vector3.Dot(a, tangent)) - Math.atan2(Vector3.Dot(b, bitangent), Vector3.Dot(b, tangent)));

        const distances = incidentNormals.map((normal) => Vector3.Dot(vertexPosition, normal) - bevelAmount);
        const center = _SolveThreePlaneIntersection(incidentNormals, distances);

        if (!center) {
            return false;
        }

        const rows: BevelPolygonPoint[][] = [];
        for (let rowIndex = 0; rowIndex <= segments; rowIndex++) {
            const rowAmount = rowIndex / segments;
            const left = _SlerpDirections(incidentNormals[0], incidentNormals[1], rowAmount);
            const right = _SlerpDirections(incidentNormals[0], incidentNormals[2], rowAmount);
            const row: BevelPolygonPoint[] = [];

            for (let columnIndex = 0; columnIndex <= rowIndex; columnIndex++) {
                const columnAmount = rowIndex === 0 ? 0 : columnIndex / rowIndex;
                const direction = rowIndex === 0 ? incidentNormals[0].clone() : _SlerpDirections(left, right, columnAmount);
                row.push({
                    position: center.add(direction.scale(bevelAmount)),
                    normal: direction,
                    attributes: cornerAttributes,
                    materialIndex,
                });
            }

            rows.push(row);
        }

        for (let rowIndex = 0; rowIndex < segments; rowIndex++) {
            const row = rows[rowIndex];
            const nextRow = rows[rowIndex + 1];

            for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
                const targetNormal0 = row[columnIndex].position.subtract(center).normalize();
                const targetNormal1 = nextRow[columnIndex].position.subtract(center).normalize();
                const targetNormal2 = nextRow[columnIndex + 1].position.subtract(center).normalize();
                const targetNormal = targetNormal0.addInPlace(targetNormal1).addInPlace(targetNormal2).normalize();

                addTriangle(
                    row[columnIndex].position,
                    nextRow[columnIndex].position,
                    nextRow[columnIndex + 1].position,
                    targetNormal,
                    targetNormal0,
                    targetNormal1,
                    targetNormal2,
                    "smooth",
                    row[columnIndex].attributes,
                    nextRow[columnIndex].attributes,
                    nextRow[columnIndex + 1].attributes,
                    materialIndex
                );

                if (columnIndex < row.length - 1) {
                    const secondTargetNormal0 = row[columnIndex].position.subtract(center).normalize();
                    const secondTargetNormal1 = nextRow[columnIndex + 1].position.subtract(center).normalize();
                    const secondTargetNormal2 = row[columnIndex + 1].position.subtract(center).normalize();
                    const secondTargetNormal = secondTargetNormal0.add(secondTargetNormal1).addInPlace(secondTargetNormal2).normalize();

                    addTriangle(
                        row[columnIndex].position,
                        nextRow[columnIndex + 1].position,
                        row[columnIndex + 1].position,
                        secondTargetNormal,
                        secondTargetNormal0,
                        secondTargetNormal1,
                        secondTargetNormal2,
                        "smooth",
                        row[columnIndex].attributes,
                        nextRow[columnIndex + 1].attributes,
                        row[columnIndex + 1].attributes,
                        materialIndex
                    );
                }
            }
        }

        return true;
    };

    const verticesWithSphericalPatch = new Set<number>();
    for (const vertexIndex of Array.from(selectedVertices)) {
        if (addSphericalCornerPatch(vertexIndex)) {
            verticesWithSphericalPatch.add(vertexIndex);
        }
    }

    for (const [vertexIndex, points] of Array.from(capPoints)) {
        if (points.length < 3) {
            continue;
        }

        if (verticesWithSphericalPatch.has(vertexIndex)) {
            continue;
        }

        const center = new Vector3();
        for (const point of points) {
            center.addInPlace(_GetCapPointPosition(point));
        }
        center.scaleInPlace(1 / points.length);

        let normal = new Vector3();
        const incidentFaces = topology.vertexFaces.get(vertexIndex) || [];
        for (const faceIndex of incidentFaces) {
            normal.addInPlace(topology.faces[faceIndex].normal);
        }

        if (normal.lengthSquared() < NormalEpsilon) {
            normal = topology.positions[vertexIndex].subtract(center);
        }

        if (normal.lengthSquared() < NormalEpsilon) {
            continue;
        }

        normal.normalize();

        const reference = Math.abs(normal.y) < 0.9 ? Vector3.Up() : Vector3.Right();
        const tangent = Vector3.Cross(reference, normal).normalize();
        const bitangent = Vector3.Cross(normal, tangent).normalize();
        const sortedPoints = points.slice().sort((a, b) => {
            const da = _GetCapPointPosition(a).subtract(center);
            const db = _GetCapPointPosition(b).subtract(center);
            const angleA = Math.atan2(Vector3.Dot(da, bitangent), Vector3.Dot(da, tangent));
            const angleB = Math.atan2(Vector3.Dot(db, bitangent), Vector3.Dot(db, tangent));
            return angleA - angleB;
        });

        if ((selectedEdgeCountPerVertex.get(vertexIndex) ?? 0) === 2) {
            const polygonPoints = sortedPoints.map((point) => ({
                position: _GetCapPointPosition(point),
                normal: _GetCapPointNormal(point, normal),
                attributes: _GetCapPointAttributes(point),
                materialIndex: _GetCapPointMaterialIndex(point),
            }));
            const addPatchTriangle = (point0: BevelPolygonPoint, point1: BevelPolygonPoint, point2: BevelPolygonPoint) => {
                const targetNormal = _NormalizeNormalOrFallback(point0.normal.add(point1.normal).addInPlace(point2.normal), normal);
                addTriangle(
                    point0.position,
                    point1.position,
                    point2.position,
                    targetNormal,
                    point0.normal,
                    point1.normal,
                    point2.normal,
                    "smooth",
                    point0.attributes,
                    point1.attributes,
                    point2.attributes,
                    point0.materialIndex
                );
            };

            while (polygonPoints.length > 3) {
                let bestIndex = -1;
                let bestScore = Number.MAX_VALUE;

                for (let index = 0; index < polygonPoints.length; index++) {
                    const previous = polygonPoints[(index + polygonPoints.length - 1) % polygonPoints.length];
                    const current = polygonPoints[index];
                    const next = polygonPoints[(index + 1) % polygonPoints.length];
                    const edge0 = current.position.subtract(previous.position);
                    const edge1 = next.position.subtract(previous.position);
                    const triangleNormal = Vector3.Cross(edge0, edge1);

                    if (triangleNormal.lengthSquared() < TriangleAreaEpsilon) {
                        continue;
                    }

                    const score = previous.position.subtract(next.position).lengthSquared();
                    if (score < bestScore) {
                        bestScore = score;
                        bestIndex = index;
                    }
                }

                if (bestIndex === -1) {
                    break;
                }

                addPatchTriangle(
                    polygonPoints[(bestIndex + polygonPoints.length - 1) % polygonPoints.length],
                    polygonPoints[bestIndex],
                    polygonPoints[(bestIndex + 1) % polygonPoints.length]
                );
                polygonPoints.splice(bestIndex, 1);
            }

            if (polygonPoints.length === 3) {
                addPatchTriangle(polygonPoints[0], polygonPoints[1], polygonPoints[2]);
            }

            continue;
        }

        const centerAttributes = _AverageAttributes(
            sortedPoints.map((point) => _GetCapPointAttributes(point)),
            attributeLength
        );
        const centerMaterialIndex = sortedPoints.length ? _GetCapPointMaterialIndex(sortedPoints[0]) : 0;
        for (let index = 0; index < sortedPoints.length; index++) {
            const point0 = sortedPoints[index];
            const point1 = sortedPoints[(index + 1) % sortedPoints.length];
            const point0Position = _GetCapPointPosition(point0);
            const point1Position = _GetCapPointPosition(point1);

            addTriangle(
                center,
                point0Position,
                point1Position,
                normal,
                normal,
                _GetCapPointNormal(point0, normal),
                _GetCapPointNormal(point1, normal),
                "smooth",
                centerAttributes,
                _GetCapPointAttributes(point0),
                _GetCapPointAttributes(point1),
                centerMaterialIndex
            );
        }
    }

    if (!outputPositions.length || !outputIndices.length) {
        return _CloneVertexData(vertexData);
    }

    const result = new VertexData();
    result.positions = outputPositions;
    result.normals = [];

    for (let index = 0; index < outputNormals.length; index++) {
        const normal = outputNormals[index];
        normal.normalize();

        result.normals.push(normal.x, normal.y, normal.z);
    }

    _AssignAttributeOutputs(result, attributeDescriptors, outputVertexAttributes);

    const materialResult = _BuildMaterialInfoResult(vertexData, outputIndices, outputTriangleMaterialIndices, outputPositions.length / 3);
    result.indices = materialResult.indices;
    result.materialInfos = materialResult.materialInfos;

    return result;
}

/**
 * Block used to bevel sharp edges in a geometry.
 */
export class BevelBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context.
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change.
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = false;

    /**
     * Creates a new BevelBlock.
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("amount", NodeGeometryBlockConnectionPointTypes.Float, true, 0.1, 0, 1);
        this.registerInput("segments", NodeGeometryBlockConnectionPointTypes.Int, true, 1, 1, 64);
        this.registerInput("angle", NodeGeometryBlockConnectionPointTypes.Float, true, 30, 0, 180);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name.
     * @returns the class name
     */
    public override getClassName() {
        return "BevelBlock";
    }

    /**
     * Gets the geometry input component.
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the bevel amount input component.
     */
    public get amount(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the bevel segment count input component.
     */
    public get segments(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the angle threshold input component in degrees.
     */
    public get angle(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the geometry output component.
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            const source = this.geometry.getConnectedValue(state) as VertexData;

            if (!source || !source.positions) {
                return null;
            }

            const amount = Math.min(1, Math.max(0, this.amount.getConnectedValue(state) ?? 0.1));
            const segments = Math.min(64, Math.max(1, Math.floor(this.segments.getConnectedValue(state) ?? 1)));
            const angleDegrees = Math.max(0, Math.min(180, this.angle.getConnectedValue(state) ?? 30));
            const angle = (angleDegrees * Math.PI) / 180;

            return _BevelVertexData(source, amount, segments, angle);
        };

        if (this.evaluateContext) {
            this.output._storedFunction = func;
        } else {
            this.output._storedFunction = null;
            this.output._storedValue = func(state);
        }
    }

    protected override _dumpPropertiesCode() {
        return super._dumpPropertiesCode() + `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
    }

    /**
     * Serializes this block in a JSON representation.
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.evaluateContext = this.evaluateContext;

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        if (serializationObject.evaluateContext !== undefined) {
            this.evaluateContext = serializationObject.evaluateContext;
        }
    }
}

RegisterClass("BABYLON.BevelBlock", BevelBlock);

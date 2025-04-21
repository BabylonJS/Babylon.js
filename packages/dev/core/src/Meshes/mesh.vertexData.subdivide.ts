import { Vector3 } from "core/Maths/math.vector";
import { VertexData } from "./mesh.vertexData";
import { Scalar } from "core/Maths/math.scalar";
import type { FloatArray } from "core/types";

/**
 * Inspired by https://github.com/stevinz/three-subdivide
 * Thanks a lot to https://github.com/stevinz
 */

/**
 * Interface used to configure the subdivision process
 */
export interface ISubdivideOptions {
    /** Apply only flat subdivision - false by default */
    flatOnly?: boolean;
    /** Split all triangles at edges shared by coplanar triangles - true by default*/
    split?: boolean;
    /**  Should UV values be averaged during subdivision - false by default */
    uvSmooth?: boolean;
    /** Should edges / breaks in geometry be ignored during subdivision? - false by default */
    preserveEdges?: boolean;
    /** How much to weigh favoring heavy corners vs favoring Loop's formula - 1 by default*/
    weight?: number;
}

const _positionShift = Math.pow(10, 4);

/**
 * Rounds a number (simulate integer rounding)
 * @internal
 */
function round(x: number): number {
    return (x + (x > 0 ? 0.5 : -0.5)) << 0;
}

/**
 * Generates a hash string from a number
 * @internal
 */
function hashFromNumber(num: number, shift = _positionShift): string {
    let roundedNumber = round(num * shift);
    if (roundedNumber === 0) {
        roundedNumber = 0; // prevent -0
    }
    return `${roundedNumber}`;
}

/**
 * Generates a hash string from a Vector3
 * @internal
 */
function hashFromVector(v: Vector3, shift = _positionShift): string {
    return `${hashFromNumber(v.x, shift)},${hashFromNumber(v.y, shift)},${hashFromNumber(v.z, shift)}`;
}

/**
 * Gathers attribute names from a VertexData object
 * @internal
 */
function gatherAttributes(vertexData: VertexData): string[] {
    const desired = ["positions", "normals", "uvs"];
    const available = Object.keys(vertexData).filter((k) => Array.isArray((vertexData as any)[k]));
    return Array.from(new Set([...desired, ...available]));
}

/**
 * Sets triangle data into an attribute array
 * @internal
 */
function setTriangle(arr: number[], index: number, itemSize: number, vec0: number[], vec1: number[], vec2: number[]): void {
    for (let i = 0; i < itemSize; i++) {
        arr[index + i] = vec0[i];
        arr[index + itemSize + i] = vec1[i];
        arr[index + 2 * itemSize + i] = vec2[i];
    }
}

/**
 * Converts indexed VertexData to a non-indexed form
 * @internal
 */
function toNonIndexed(vertexData: VertexData): VertexData {
    if (!vertexData.indices || vertexData.indices.length === 0) {
        return vertexData; // already non-indexed
    }
    const newPositions: number[] = [];
    const newNormals: number[] = [];
    const newUVs: number[] = [];
    const indices = vertexData.indices;
    const pos = vertexData.positions!;
    const norm = vertexData.normals;
    const uv = vertexData.uvs;

    for (let i = 0; i < indices.length; i++) {
        const idx = indices[i];
        newPositions.push(pos[3 * idx], pos[3 * idx + 1], pos[3 * idx + 2]);
        if (norm) {
            newNormals.push(norm[3 * idx], norm[3 * idx + 1], norm[3 * idx + 2]);
        }
        if (uv) {
            newUVs.push(uv[2 * idx], uv[2 * idx + 1]);
        }
    }

    const newVertexData = new VertexData();
    newVertexData.positions = newPositions;
    if (newNormals.length) {
        newVertexData.normals = newNormals;
    }
    if (newUVs.length) {
        newVertexData.uvs = newUVs;
    }
    return newVertexData;
}

/** Helper to read a Vector3 from an attribute array
 * @internal
 */
function readVector(destination: Vector3, attribute: FloatArray, index: number, itemSize: number) {
    if (itemSize === 3) {
        destination.fromArray(attribute, index * 3);
        return;
    }
    // For uvs (itemSize 2), return a Vector3 with z = 0.
    destination.set(attribute[index * 2], attribute[index * 2 + 1], 0);
}

function processFlatAttribute(source: FloatArray, vertexCount: number, output: number[]) {
    const v0 = new Vector3();
    const v1 = new Vector3();
    const v2 = new Vector3();
    const m01 = new Vector3();
    const m12 = new Vector3();
    const m20 = new Vector3();

    for (let i = 0; i < vertexCount; i += 3) {
        const j = i * 3;
        v0.set(source[j], source[j + 1], source[j + 2]);
        v1.set(source[j + 3], source[j + 4], source[j + 5]);
        v2.set(source[j + 6], source[j + 7], source[j + 8]);
        v0.addToRef(v1, m01);
        m01.scaleInPlace(0.5);
        v1.addToRef(v2, m12);
        m12.scaleInPlace(0.5);
        v2.addToRef(v0, m20);
        m20.scaleInPlace(0.5);

        // Positions
        output.push(v0.x, v0.y, v0.z, m01.x, m01.y, m01.z, m20.x, m20.y, m20.z);
        output.push(v1.x, v1.y, v1.z, m12.x, m12.y, m12.z, m01.x, m01.y, m01.z);
        output.push(v2.x, v2.y, v2.z, m20.x, m20.y, m20.z, m12.x, m12.y, m12.z);
        output.push(m01.x, m01.y, m01.z, m12.x, m12.y, m12.z, m20.x, m20.y, m20.z);
    }
}

/**
 * Applies one iteration of flat subdivision (each triangle becomes 4).
 * @internal
 */
function flat(vertexData: VertexData): VertexData {
    const data = toNonIndexed(vertexData);
    const positions = data.positions!;
    const normals = data.normals;
    const uvs = data.uvs;
    const vertexCount = positions.length / 3;

    const newPositions: number[] = [];
    const newNormals: number[] = [];
    const newUVs: number[] = [];
    processFlatAttribute(positions, vertexCount, newPositions);

    if (normals && normals.length) {
        processFlatAttribute(normals, vertexCount, newNormals);
    }

    if (uvs && uvs.length) {
        for (let i = 0; i < vertexCount; i += 3) {
            const j = i * 2;
            const uv0 = [uvs[j], uvs[j + 1]];
            const uv1 = [uvs[j + 2], uvs[j + 3]];
            const uv2 = [uvs[j + 4], uvs[j + 5]];

            const uv01 = [(uv0[0] + uv1[0]) / 2, (uv0[1] + uv1[1]) / 2];
            const uv12 = [(uv1[0] + uv2[0]) / 2, (uv1[1] + uv2[1]) / 2];
            const uv20 = [(uv2[0] + uv0[0]) / 2, (uv2[1] + uv0[1]) / 2];

            newUVs.push(...uv0, ...uv01, ...uv20);
            newUVs.push(...uv1, ...uv12, ...uv01);
            newUVs.push(...uv2, ...uv20, ...uv12);
            newUVs.push(...uv01, ...uv12, ...uv20);
        }
    }

    const newVertexCount = newPositions.length / 3;
    const newIndices: number[] = [];
    for (let i = 0; i < newVertexCount; i++) {
        newIndices.push(i);
    }

    const newVertexData = new VertexData();
    newVertexData.positions = newPositions;
    if (newNormals.length) {
        newVertexData.normals = newNormals;
    }
    if (newUVs.length) {
        newVertexData.uvs = newUVs;
    }
    newVertexData.indices = newIndices;
    return newVertexData;
}

/**
 * Applies one iteration of smooth subdivision with vertex averaging.
 * This function uses the subdivideAttribute routine to adjust vertex data.
 * @internal
 */
function smooth(vertexData: VertexData, options: ISubdivideOptions): VertexData {
    // Convert to non-indexed and apply flat subdivision first.
    const sourceData = toNonIndexed(vertexData);
    const flatData = flat(sourceData);

    const attributeList = gatherAttributes(sourceData);
    const origPositions = sourceData.positions!;
    const flatPositions = flatData.positions!;
    const vertexCount = origPositions.length / 3;

    // Build connectivity maps from the original geometry.
    const hashToIndex: { [hash: string]: number[] } = {};
    const existingNeighbors: { [hash: string]: { [neighborHash: string]: number[] } } = {};
    const flatOpposites: { [hash: string]: number[] } = {};
    const existingEdges: { [hash: string]: Set<string> } = {};

    function addNeighbor(posHash: string, neighborHash: string, index: number): void {
        if (!existingNeighbors[posHash]) {
            existingNeighbors[posHash] = {};
        }
        if (!existingNeighbors[posHash][neighborHash]) {
            existingNeighbors[posHash][neighborHash] = [];
        }
        existingNeighbors[posHash][neighborHash].push(index);
    }
    function addOpposite(posHash: string, index: number): void {
        if (!flatOpposites[posHash]) {
            flatOpposites[posHash] = [];
        }
        flatOpposites[posHash].push(index);
    }
    function addEdgePoint(posHash: string, edgeHash: string): void {
        if (!existingEdges[posHash]) {
            existingEdges[posHash] = new Set<string>();
        }
        existingEdges[posHash].add(edgeHash);
    }

    const temp = new Vector3();
    const v0 = new Vector3();
    const v1 = new Vector3();
    const v2 = new Vector3();
    const m01 = new Vector3();
    const m12 = new Vector3();
    const m20 = new Vector3();

    // Process original positions
    for (let i = 0; i < vertexCount; i += 3) {
        readVector(v0, origPositions, i, 3);
        readVector(v1, origPositions, i + 1, 3);
        readVector(v2, origPositions, i + 2, 3);
        const h0 = hashFromVector(v0);
        const h1 = hashFromVector(v1);
        const h2 = hashFromVector(v2);
        addNeighbor(h0, h1, i + 1);
        addNeighbor(h0, h2, i + 2);
        addNeighbor(h1, h0, i);
        addNeighbor(h1, h2, i + 2);
        addNeighbor(h2, h0, i);
        addNeighbor(h2, h1, i + 1);

        // Opposites from flat subdivision: calculate midpoints.
        v0.addToRef(v1, m01);
        m01.scaleInPlace(0.5);
        v1.addToRef(v2, m12);
        m12.scaleInPlace(0.5);
        v2.addToRef(v0, m20);
        m20.scaleInPlace(0.5);

        addOpposite(hashFromVector(m01), i + 2);
        addOpposite(hashFromVector(m12), i);
        addOpposite(hashFromVector(m20), i + 1);

        // Track edges for preserveEdges.
        addEdgePoint(h0, hashFromVector(m01));
        addEdgePoint(h0, hashFromVector(m20));
        addEdgePoint(h1, hashFromVector(m01));
        addEdgePoint(h1, hashFromVector(m12));
        addEdgePoint(h2, hashFromVector(m12));
        addEdgePoint(h2, hashFromVector(m20));
    }

    // Build map from flat positions to indices.
    for (let i = 0; i < flatPositions.length / 3; i++) {
        readVector(temp, flatPositions, i, 3);
        const h = hashFromVector(temp);
        if (!hashToIndex[h]) {
            hashToIndex[h] = [];
        }
        hashToIndex[h].push(i);
    }

    // Prepare temporary vectors for subdivideAttribute.
    const _vertex: Vector3[] = [new Vector3(), new Vector3(), new Vector3()];
    const _position: Vector3[] = [new Vector3(), new Vector3(), new Vector3()];
    const _average = new Vector3();
    const _temp = new Vector3();

    // subdivideAttribute: adjusts vertex attributes using Loop’s averaging rules.
    function subdivideAttribute(attributeName: string, existingAttribute: number[], flattenedAttribute: number[]): number[] {
        const itemSize = attributeName === "uvs" ? 2 : 3;
        const flatVertexCount = flatPositions.length / 3;
        const floatArray = new Array(flatVertexCount * itemSize);
        let index = 0;
        for (let i = 0; i < flatVertexCount; i += 3) {
            for (let v = 0; v < 3; v++) {
                if (attributeName === "uvs" && !options.uvSmooth) {
                    // Simply copy UVs.
                    readVector(_vertex[v], flattenedAttribute, i + v, 2);
                } else if (attributeName === "normals") {
                    readVector(_position[v], flatPositions, i + v, 3);
                    const positionHash = hashFromVector(_position[v]);
                    const positionsArr = hashToIndex[positionHash] || [];
                    const k = positionsArr.length;
                    const beta = 0.75 / k;
                    const startWeight = 1.0 - beta * k;
                    readVector(_vertex[v], flattenedAttribute, i + v, 3);
                    _vertex[v].scaleInPlace(startWeight);
                    for (const positionIndex of positionsArr) {
                        readVector(_average, flattenedAttribute, positionIndex, 3);
                        _average.scaleInPlace(beta);
                        _vertex[v].addInPlace(_average);
                    }
                } else {
                    // 'positions', 'colors', etc.
                    readVector(_vertex[v], flattenedAttribute, i + v, itemSize);
                    readVector(_position[v], flatPositions, i + v, 3);
                    const positionHash = hashFromVector(_position[v]);
                    const neighbors = existingNeighbors[positionHash];
                    const opposites = flatOpposites[positionHash];
                    if (neighbors) {
                        if (options.preserveEdges) {
                            const edgeSet = existingEdges[positionHash];
                            let hasPair = true;
                            edgeSet.forEach((edgeHash) => {
                                if (flatOpposites[edgeHash] && flatOpposites[edgeHash].length % 2 !== 0) {
                                    hasPair = false;
                                }
                            });
                            if (!hasPair) {
                                // If edges aren't paired, skip adjustment.
                                continue;
                            }
                        }
                        const neighborKeys = Object.keys(neighbors);
                        const k = neighborKeys.length;
                        const beta = (1 / k) * (5 / 8 - Math.pow(3 / 8 + (1 / 4) * Math.cos((2 * Math.PI) / k), 2));
                        const heavy = 1 / k / k;
                        const weight = Scalar.Lerp(heavy, beta, options.weight!);
                        const startWeight = 1.0 - weight * k;
                        _vertex[v].scaleInPlace(startWeight);
                        for (const neighborHash in neighbors) {
                            const neighborIndices = neighbors[neighborHash];
                            _average.set(0, 0, 0);
                            for (const neighborIndex of neighborIndices) {
                                readVector(_temp, existingAttribute, neighborIndex, itemSize);
                                _average.addInPlace(_temp);
                            }
                            _average.scaleInPlace(1 / neighborIndices.length);
                            _average.scaleInPlace(weight);
                            _vertex[v].addInPlace(_average);
                        }
                    } else if (opposites && opposites.length === 2) {
                        const k = opposites.length;
                        const beta = 0.125; // 1/8
                        const startWeight = 1.0 - beta * k;
                        _vertex[v].scaleInPlace(startWeight);
                        for (const oppositeIndex of opposites) {
                            readVector(_average, existingAttribute, oppositeIndex, itemSize);
                            _average.scaleInPlace(beta);
                            _vertex[v].addInPlace(_average);
                        }
                    }
                }
            }
            // Write out new triangle vertices.
            setTriangle(floatArray, index, itemSize, _vertex[0].asArray(), _vertex[1].asArray(), _vertex[2].asArray());
            index += itemSize * 3;
        }
        return floatArray;
    }

    // Build new attributes for the smoothed geometry.
    const smoothData = new VertexData();
    for (const attributeName of attributeList) {
        if (attributeName === "indices") {
            continue;
        }
        const existingAttribute = (sourceData as any)[attributeName] as number[];
        const flattenedAttribute = (flatData as any)[attributeName] as number[];
        if (!existingAttribute || !flattenedAttribute) {
            continue;
        }
        const newArray = subdivideAttribute(attributeName, existingAttribute, flattenedAttribute);
        (smoothData as any)[attributeName] = newArray;
    }

    // Rebuild indices sequentially.
    const newPositions = smoothData.positions!;
    const newIndices: number[] = [];
    for (let i = 0; i < newPositions.length / 3; i++) {
        newIndices.push(i);
    }
    smoothData.indices = newIndices;
    return smoothData;
}

/**
 * Subdivide a vertexData using Loop algorithm
 * @param vertexData The vertexData to subdivide
 * @param level The number of times to subdivide
 * @param options The options to use when subdividing
 * @returns The subdivided vertexData
 */
export function Subdivide(vertexData: VertexData, level: number, options?: Partial<ISubdivideOptions>): VertexData {
    options = {
        flatOnly: false,
        uvSmooth: false,
        preserveEdges: false,
        weight: 1,
        ...options,
    };

    if (!vertexData.positions || vertexData.positions.length === 0 || level <= 0) {
        return vertexData;
    }

    // Clone the input
    let modified = vertexData.clone();

    for (let i = 0; i < level; i++) {
        if (options.flatOnly) {
            modified = flat(modified);
        } else {
            modified = smooth(modified, options);
        }
    }

    return modified;
}

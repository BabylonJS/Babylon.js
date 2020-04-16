import { Vector2, Vector3, Matrix } from "../Maths/math";
import { Nullable } from "../types";
import { Mesh } from "../meshes/mesh";
import { VertexData } from "../meshes/mesh.vertexdata";
import { IndicesArray, FloatArray } from "../types";
import { VertexBuffer } from "../meshes/buffer";

/**
 * Face with 3 vertices
 */
class Face {
    /**
     * Face area
     */
    area: number;
    /**
     * Face uvs (length = 3 * 2)
     */
    uv: Vector2[];
    /**
     * Vertices, with index embedding
     */
    v: {
        v: Vector3,
        index: number
    }[];
    /**
     * Normals
     */
    vNormals: Nullable<FloatArray[]>;
    /**
     * Tangents
     */
    vTangents: Nullable<FloatArray[]>;
    /**
     * UV
     */
    vUv: Nullable<FloatArray[]>;
    /**
     * UV2
     */
    vUv2: Nullable<FloatArray[]>;
    /**
     * UV3
     */
    vUv3: Nullable<FloatArray[]>;
    /**
     * UV4
     */
    vUv4: Nullable<FloatArray[]>;
    /**
     * UV5
     */
    vUv5: Nullable<FloatArray[]>;
    /**
     * UV6
     */
    vUv6: Nullable<FloatArray[]>;
    /**
     * Colors
     */
    vColors: Nullable<FloatArray[]>;
    /**
     * Matrices indices
     */
    vMatricesIndices: Nullable<FloatArray[]>;
    /**
     * Matrices weights
     */
    vMatricesWeights: Nullable<FloatArray[]>;
    /**
     * Matrices indices extra
     */
    vMatricesIndicesExtra: Nullable<FloatArray[]>;
    /**
     * Matrices weights extra
     */
    vMatricesWeightsExtra: Nullable<FloatArray[]>;
    /**
     * Edge key for edge dictionnary
     */
    edgeKeys: string[];
    /**
     * Face normal
     */
    no: Vector3;
    /**
     * Face index
     */
    index: number;
    /**
     * Mesh index
     */
    meshIndex: number;

    /**
    * Creates a Face from a specific index in a vertex data object
    * @param indexBegin First index in the list of indices
    * @param vertexData Vertex data
    * @param offset Mesh offset when uv mapping several meshes on the same uv layout
    * @param matrix World matrix of the mesh. If not specified, identity matrix is taken
    * @param equivalencies A list of vertex equivalencies
    * in case 2 vertices share the same position, it's useful to group them out in the uv layout
    */
    constructor(indexBegin: number,
        vertexData: VertexData,
        offset: number = 0,
        matrix: Nullable<Matrix>,
        equivalencies?: number[][]) {
        let indices = vertexData.indices as IndicesArray;
        let positions = vertexData.positions as FloatArray;

        this.v = [];
        this.uv = [];
        this.vNormals = [];
        this.edgeKeys = [];
        this.index = indexBegin;
        this.meshIndex = offset;
        for (let i = 0; i < 3; i++) {
            Face.ExtractVertex(this,
                i + indexBegin,
                matrix,
                indices,
                positions,
                vertexData.normals,
                vertexData.tangents,
                vertexData.uvs,
                vertexData.uvs2,
                vertexData.uvs3,
                vertexData.uvs4,
                vertexData.uvs5,
                vertexData.uvs6,
                vertexData.colors,
                vertexData.matricesIndices,
                vertexData.matricesWeights,
                vertexData.matricesIndicesExtra,
                vertexData.matricesWeightsExtra
            );

            this.uv.push(new Vector2());
            let firstIndex, secondIndex;
            if (equivalencies) {
                firstIndex = sortAndGetFirst(equivalencies, indices[i + indexBegin]);
                secondIndex = sortAndGetFirst(equivalencies, indices[(i + 1) % 3 + indexBegin]);
            } else {
                firstIndex = indices[i + indexBegin];
                secondIndex = indices[(i + 1) % 3 + indexBegin];
            }

            if (firstIndex > secondIndex) {
                let t = firstIndex;
                firstIndex = secondIndex;
                secondIndex = t;
            }

            this.edgeKeys.push(offset + "_" + firstIndex + "_" + secondIndex);
        }

        let faceNormal = Vector3.Cross(this.v[0].v.subtract(this.v[1].v), this.v[2].v.subtract(this.v[1].v));
        let area = faceNormal.length() / 2;
        faceNormal.scaleInPlace(1 / (area * 2));
        this.no = faceNormal;
        this.area = area;
    }

    /**
     * Pushes a vertex from this face to a vertex data object
     * @param vertexData The vertex data
     * @param idx the vertex index, between 0 and 2 included
     */
    public pushVertexToVertexData(vertexData: VertexData, idx: number) {
        if (this.vNormals) {
            for (let i = 0; i < this.vNormals[idx].length; i++) {
                (<number[]>vertexData.normals).push(this.vNormals[idx][i]);
            }
        }

        if (this.vTangents) {
            for (let i = 0; i < this.vTangents[idx].length; i++) {
                (<number[]>vertexData.tangents).push(this.vTangents[idx][i]);
            }
        }

        if (this.vUv) {
            for (let i = 0; i < this.vUv[idx].length; i++) {
                (<number[]>vertexData.uvs).push(this.vUv[idx][i]);
            }
        }

        if (this.vUv2) {
            for (let i = 0; i < this.vUv2[idx].length; i++) {
                (<number[]>vertexData.uvs2).push(this.vUv2[idx][i]);
            }
        }

        if (this.vUv3) {
            for (let i = 0; i < this.vUv3[idx].length; i++) {
                (<number[]>vertexData.uvs3).push(this.vUv3[idx][i]);
            }
        }

        if (this.vUv4) {
            for (let i = 0; i < this.vUv4[idx].length; i++) {
                (<number[]>vertexData.uvs4).push(this.vUv4[idx][i]);
            }
        }

        if (this.vUv5) {
            for (let i = 0; i < this.vUv5[idx].length; i++) {
                (<number[]>vertexData.uvs5).push(this.vUv5[idx][i]);
            }
        }

        if (this.vUv6) {
            for (let i = 0; i < this.vUv6[idx].length; i++) {
                (<number[]>vertexData.uvs6).push(this.vUv6[idx][i]);
            }
        }

        if (this.vColors) {
            for (let i = 0; i < this.vColors[idx].length; i++) {
                (<number[]>vertexData.colors).push(this.vColors[idx][i]);
            }
        }

        if (this.vMatricesIndices) {
            for (let i = 0; i < this.vMatricesIndices[idx].length; i++) {
                (<number[]>vertexData.matricesIndices).push(this.vMatricesIndices[idx][i]);
            }
        }

        if (this.vMatricesWeights) {
            for (let i = 0; i < this.vMatricesWeights[idx].length; i++) {
                (<number[]>vertexData.matricesWeights).push(this.vMatricesWeights[idx][i]);
            }
        }

        if (this.vMatricesIndicesExtra) {
            for (let i = 0; i < this.vMatricesIndicesExtra[idx].length; i++) {
                (<number[]>vertexData.matricesIndicesExtra).push(this.vMatricesIndicesExtra[idx][i]);
            }
        }

        if (this.vMatricesWeightsExtra) {
            for (let i = 0; i < this.vMatricesWeightsExtra[idx].length; i++) {
                (<number[]>vertexData.matricesWeightsExtra).push(this.vMatricesWeightsExtra[idx][i]);
            }
        }
    }

    /**
     * Helper function to extract a slice from a float array.
     * @param vb The array
     * @param kind The kind of float array we are dealing with
     * @param idx The index at which we want the slice
     * @returns the slice
     */
    public static ExtractSlice(vb: FloatArray, kind: string, idx: number) : FloatArray {
        let stride = VertexBuffer.DeduceStride(kind);
        let sl = vb.slice(idx * stride, idx * stride + stride);
        return sl;
    }

    /**
     * Adds a vertex to a face from multiple arrays that are inside a vertex data object
     * @param f Face to push the vertex to
     * @param i Index in the indices array
     * @param matrix World matrix. If null, identity is used.
     * @param indices indices
     * @param positions positions
     * @param normals normals
     * @param tangents tangents
     * @param uvs uvs
     * @param uvs2 uvs2
     * @param uvs3 uvs3
     * @param uvs4 uvs4
     * @param uvs5 uvs5
     * @param uvs6 uvs6
     * @param colors colors
     * @param matricesIndices matrices Indices
     * @param matricesWeights matrices Weights
     * @param matricesIndicesExtra matrices Indices extra
     * @param matricesWeightsExtra matrices Weights extra
     */
    public static ExtractVertex(
        f: Face,
        i: number,
        matrix: Nullable<Matrix>,
        indices: IndicesArray,
        positions: FloatArray,
        normals: Nullable<FloatArray>,
        tangents: Nullable<FloatArray>,
        uvs: Nullable<FloatArray>,
        uvs2: Nullable<FloatArray>,
        uvs3: Nullable<FloatArray>,
        uvs4: Nullable<FloatArray>,
        uvs5: Nullable<FloatArray>,
        uvs6: Nullable<FloatArray>,
        colors: Nullable<FloatArray>,
        matricesIndices: Nullable<FloatArray>,
        matricesWeights: Nullable<FloatArray>,
        matricesIndicesExtra: Nullable<FloatArray>,
        matricesWeightsExtra: Nullable<FloatArray>) {
        let idx = indices[i];
        let vertex = new Vector3(positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2]);
        if (matrix) {
            vertex = Vector3.TransformCoordinates(vertex, matrix);
        }

        f.v.push({
            v: vertex,
            index: idx
        });

        if (normals) {
            let sl = Face.ExtractSlice(normals, VertexBuffer.NormalKind, idx);
            f.vNormals = f.vNormals || [];
            f.vNormals.push(sl);
        }

        if (tangents) {
            let sl = Face.ExtractSlice(tangents, VertexBuffer.TangentKind, idx);
            f.vTangents = f.vTangents || [];
            f.vTangents.push(sl);
        }

        if (uvs) {
            let sl = Face.ExtractSlice(uvs, VertexBuffer.UVKind, idx);
            f.vUv = f.vUv || [];
            f.vUv.push(sl);
        }

        if (uvs2) {
            let sl = Face.ExtractSlice(uvs2, VertexBuffer.UV2Kind, idx);
            f.vUv2 = f.vUv2 || [];
            f.vUv2.push(sl);
        }

        if (uvs3) {
            let sl = Face.ExtractSlice(uvs3, VertexBuffer.UV3Kind, idx);
            f.vUv3 = f.vUv3 || [];
            f.vUv3.push(sl);
        }

        if (uvs4) {
            let sl = Face.ExtractSlice(uvs4, VertexBuffer.UV4Kind, idx);
            f.vUv4 = f.vUv4 || [];
            f.vUv4.push(sl);
        }

        if (uvs5) {
            let sl = Face.ExtractSlice(uvs5, VertexBuffer.UV5Kind, idx);
            f.vUv5 = f.vUv5 || [];
            f.vUv5.push(sl);
        }

        if (uvs6) {
            let sl = Face.ExtractSlice(uvs6, VertexBuffer.UV6Kind, idx);
            f.vUv6 = f.vUv6 || [];
            f.vUv6.push(sl);
        }

        if (colors) {
            let sl = Face.ExtractSlice(colors, VertexBuffer.ColorKind, idx);
            f.vColors = f.vColors || [];
            f.vColors.push(sl);
        }

        if (matricesIndices) {
            let sl = Face.ExtractSlice(matricesIndices, VertexBuffer.MatricesIndicesKind, idx);
            f.vMatricesIndices = f.vMatricesIndices || [];
            f.vMatricesIndices.push(sl);
        }

        if (matricesWeights) {
            let sl = Face.ExtractSlice(matricesWeights, VertexBuffer.MatricesWeightsKind, idx);
            f.vMatricesWeights = f.vMatricesWeights || [];
            f.vMatricesWeights.push(sl);
        }

        if (matricesIndicesExtra) {
            let sl = Face.ExtractSlice(matricesIndicesExtra, VertexBuffer.MatricesIndicesExtraKind, idx);
            f.vMatricesIndicesExtra = f.vMatricesIndicesExtra || [];
            f.vMatricesIndicesExtra.push(sl);
        }

        if (matricesWeightsExtra) {
            let sl = Face.ExtractSlice(matricesWeightsExtra, VertexBuffer.MatricesWeightsExtraKind, idx);
            f.vMatricesWeightsExtra = f.vMatricesWeightsExtra || [];
            f.vMatricesWeightsExtra.push(sl);
        }
    }
}

/**
 * An edge in an uv layout
 */
declare interface Edge {
    v0: Vector2;
    v1: Vector2;
}

/**
 * Basic vertex information
 */
declare interface VertexInfo {
    vertex: Vector3;
    normal: Nullable<Vector3>;
    index: number;
}

/**
 * An edge with its embedded length
 */
declare interface MeasuredEdge { l: number; e: Nullable<Edge>; }

/**
 * An UV Island (array of faces)
 */
declare type Island = Face[];

// 0: island
// 1: totFaceArea
// 2: efficiency
// 3: islandBoundsArea
// 4: w
// 5: h
// 6: edges
// 7: uniqueEdgesPoints
/**
 * Island info, in an array for performance storage
 */
declare type IslandInfo = any[];

/**
 * Helper
 */
let sortAndGetFirst = function(arr: number[][], idx: number) {
    if (arr[idx] && arr[idx].length) {
        arr[idx].sort((a, b) => a - b);

        return arr[idx][0];
    }

    return idx;
};

/**
 * Helper
 */
let intersectLineLine2d = function() {

    var r, s,
        denominator,
        BAx, BAy, DCx, DCy;

    return function(A: Vector2, B: Vector2, C: Vector2, D: Vector2) {
                BAx = B.x - A.x;
                BAy = B.y - A.y;
                DCx = D.x - C.x;
                DCy = D.y - C.y;
                denominator = BAx * DCy - BAy * DCx;

                if (Math.abs(denominator) < 1e-6) { return null; }
                denominator = 1 / denominator;

                r = ((A.y - C.y) * DCx - (A.x - C.x) * DCy) * denominator;
                s = ((A.y - C.y) * BAx - (A.x - C.x) * BAy) * denominator;

                var P = new Vector2(A.x + r * BAx, A.y + r * BAy);

                if ((0 <= r) && (r <= 1) && (0 <= s) && (s <= 1)) {
                    return P;
                }

                return null;
            };
}();

/**
 * Helper
 */
function cross(a: Vector2, b: Vector2, o: Vector2) {
   return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/**
 * Helper
 */
function roundTo(a: number, precision: number) {
    if (!precision) {
        return a;
    }
    return Math.round(a / precision) * precision;
}

/**
 * Helper
 * Avoid doing:
 *
 * angle = atan2f(dvec[0], dvec[1]);
 * angle_to_mat2(mat, angle);
 *
 * instead use a vector as a matrix.
 */
function mulV2V2Cw(mat: Vector2, vec: Vector2)
{
    return new Vector2(
        mat.x * vec.x + mat.y * vec.y,
        mat.y * vec.x - mat.x * vec.y
    );
}

/**
 * Helper
 */
function projectMat(vector: Vector3) {
    let lastAxis = vector.clone().normalize();

    let firstAxis: Vector3;

    if (Math.abs(lastAxis.x) < SMALL_NUM && Math.abs(lastAxis.y) < SMALL_NUM) {
        firstAxis = new Vector3(0, 1, 0);
    } else {
        firstAxis = new Vector3(0, 0, 1);
    }

    firstAxis = Vector3.Cross(lastAxis, firstAxis);
    firstAxis.normalize();
    let secondAxis = Vector3.Cross(lastAxis, firstAxis);
    secondAxis.normalize();
    let mat = new Matrix();

    Matrix.FromXYZAxesToRef(firstAxis, secondAxis, lastAxis, mat);

    return mat.transpose();
}

const USER_FILL_HOLES = 0;
const USER_FILL_HOLES_QUALITY = 1;
const USER_ISLAND_MARGIN = 0;
const SMALL_NUM = 1e-12;

/**
* UV Mapper for lightmaps
* Ported from Blender by Benjamin Guignabert (https://github.com/CraigFeldspar)
*
* Original license can be found below :
*
* This program is free software; you can redistribute it and/or
* modify it under the terms of the GNU General Public License
* as published by the Free Software Foundation; either version 2
* of the License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program; if not, write to the Free Software Foundation,
* Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
*
*/
export class UvMapper {

    private toV3(v: Vector2) {
        return new Vector3(v.x, v.y, 0);
    }

    // Straight port from blender, not memory efficient, can be improved
    private pointInTri2D(v: Vector3, v1: Vector3, v2: Vector3, v3: Vector3) {
        let side1 = v2.subtract(v1);
        let side2 = v3.subtract(v1);

        let nor = Vector3.Cross(side1, side2);
        let mtx = Matrix.FromValues(side1.x, side1.y, side1.z, 0,
                                    side2.x, side2.y, side2.z, 0,
                                    nor.x, nor.y, nor.z, 0,
                                    0, 0, 0, 1);

        let det = mtx.determinant();
        if (!det) {
            return false;
        }

        mtx.invert();
        let uvw = Vector3.TransformCoordinates(v.subtract(v1), mtx);
        return 0 <= uvw.x && 0 <= uvw.y && uvw.x + uvw.y <= 1;
    }

    private boundsIslands(faces: Face[]) {
        let minx = faces[0].uv[0].x;
        let maxx = minx;
        let miny = faces[0].uv[0].y;
        let maxy = miny;

        for (let i = 0; i < faces.length; i++) {
            let f = faces[i];
            for (let j = 0; j < f.uv.length; j++) {
                let uv = f.uv[j];
                let x = uv.x;
                let y = uv.y;
                if (x < minx) {
                    minx = x;
                }
                if (y < miny) {
                    miny = y;
                }
                if (x > maxx) {
                    maxx = x;
                }
                if (y > maxy) {
                    maxy = y;
                }
            }
        }

        return [minx, miny, maxx, maxy];
    }

    private island2Edge(island: Island) {
        let edges: Map<string, MeasuredEdge> = new Map();
        let uniquePointsMap: Map<string, Vector2> = new Map();
        let i1, i2;

        for (let i = 0; i < island.length; i++) {
            let f = island[i];
            let fUvkey = f.uv;

            let l = fUvkey.length;
            for (let vIdx = 0; vIdx < l; vIdx++) {
                uniquePointsMap.set(fUvkey[vIdx].x + "_" + fUvkey[vIdx].y, f.uv[vIdx]);

                if (f.v[vIdx].index > f.v[(vIdx - 1 + l) % l].index) {
                    i1 = (vIdx - 1 + l) % l;
                    i2 = vIdx;
                } else {
                    i1 = vIdx;
                    i2 = (vIdx - 1 + l) % l;
                }

                let key = fUvkey[i1].x + "_" + fUvkey[i1].y + "_" + fUvkey[i2].x + "_" + fUvkey[i2].y;

                if (typeof(edges.get(key)) === "undefined") {
                    edges.set(key, {
                        l: f.uv[i2].subtract(f.uv[i1]).length(),
                        e: {
                            v0: f.uv[i1],
                            v1: f.uv[i2]
                        }
                    });
                } else {
                    edges.set(key, {
                        l: 0,
                        e: null
                    });
                }
            }
        }

        let lengthSortedEdges: MeasuredEdge[] = [];

        let keys = edges.keys();
        let k = keys.next();
        while (!k.done) {
            let o = edges.get(k.value) as MeasuredEdge;

            let i = 0;
            while (i < lengthSortedEdges.length && lengthSortedEdges[i].l > o.l) {
                i++;
            }
            lengthSortedEdges.splice(i, 0, o);
            k = keys.next();
        }

        let uniquePoints = [];
        let values = uniquePointsMap.values();
        let iter = values.next();
        while (!iter.done) {
            uniquePoints.push(this.toV3(iter.value));
            iter = values.next();
        }

        return {
            lengthSortedEdges,
            uniquePoints
        };
    }

    private pointInIsland(pt: Vector3, island: Island) : boolean {
        let vec1 = new Vector3();
        let vec2 = new Vector3();
        let vec3 = new Vector3();

        for (let i = 0; i < island.length; i++) {
            let f = island[i];

            // Why this copy ? could be optimised
            vec1.copyFromFloats(f.uv[0].x, f.uv[0].y, 0);
            vec2.copyFromFloats(f.uv[1].x, f.uv[1].y, 0);
            vec3.copyFromFloats(f.uv[2].x, f.uv[2].y, 0);

            if (this.pointInTri2D(pt, vec1, vec2, vec3)) {
                return true;
            }
        }

        return false;
    }

    // box is (left,bottom, right, top)
    private islandIntersectUvIsland(source: IslandInfo, target: IslandInfo, SourceOffset: Vector2) : number {
        let edgeLoopsSource = source[6] as MeasuredEdge[];
        let edgeLoopsTarget = target[6] as MeasuredEdge[];

        for (let i = 0; i < edgeLoopsSource.length; i++) {
            let ed = edgeLoopsSource[i];
            if (!ed.e) {
                continue;
            }
            for (let j = 0; j < edgeLoopsTarget.length; j++) {
                let seg = edgeLoopsTarget[j];
                if (!seg.e) {
                    continue;
                }
                let inter = intersectLineLine2d((<Edge>seg.e).v0,
                    (<Edge>seg.e).v1,
                    SourceOffset.add((<Edge>ed.e).v0),
                    SourceOffset.add((<Edge>ed.e).v1));

                if (inter) {
                    return 1; // LINE INTERSECTION
                }
            }
        }

        // 1 test for source being totally inside target
        let SourceOffsetV3 = this.toV3(SourceOffset);
        for (let i = 0; i < source[7].length; i++) {
            let pv = source[7][i];
            if (this.pointInIsland(pv.add(SourceOffsetV3), target[0])) {
                return 2; // SOURCE INSIDE TARGET
            }
        }

        // 2 test for a part of the target being totally inside the source.
        for (let i = 0; i < target[7].length; i++) {
            let pv = target[7][i];
            if (this.pointInIsland(pv.subtract(SourceOffsetV3), source[0])) {
                return 3; // PART OF TARGET INSIDE SOURCE.
            }
        }

        return 0; // NO INTERSECTION
    }

    private rotateUvs(uvPoints: Vector2[], angle: number) {
        // Unefficient v2 -> v3
        if (angle !== 0) {
            let mat = Matrix.RotationZ(-angle);
            for (let i = 0; i < uvPoints.length; i++) {
                let vec = this.toV3(uvPoints[i]);
                let res = Vector3.TransformCoordinates(vec, mat);
                uvPoints[i].copyFromFloats(res.x, res.y);
            }
        }
    }

    private convexhull2d(points: Vector2[]) : Vector2[] {
        if (points.length < 3) {
            return [];
        }

        points.sort((a: Vector2, b: Vector2) => a.x === b.x ? a.y - b.y : a.x - b.x);

        let lower: Vector2[] = [];

        for (let i = 0; i < points.length; i++) {
           while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
              lower.pop();
           }
           lower.push(points[i]);
        }
        let upper: Vector2[] = [];

        for (let i = points.length - 1; i >= 0; i--) {
           while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
              upper.pop();
           }
           upper.push(points[i]);
        }

        upper.pop();
        lower.pop();

        return lower.concat(upper);
    }

    private fitAabb2d(hull: Vector2[]) {
        let areaBest = +Infinity;
        let area = +Infinity;
        let dvecBest = new Vector2();
        let dvec = new Vector2();
        let min = new Vector2(+Infinity, +Infinity);
        let max = new Vector2(-Infinity, -Infinity);
        let minBest = new Vector2(+Infinity, +Infinity);
        let maxBest = new Vector2(-Infinity, -Infinity);
        let n = hull.length;

        let iPrev = n - 1;

        let evA, evB;
        for (let i = 0; i < n; i++) {
            evA = hull[i];
            evB = hull[iPrev];

            dvec.copyFrom(evA).subtractInPlace(evB);

            dvec.normalize();

            if (dvec.length() > 1e-6) {
                min.copyFromFloats(+Infinity, +Infinity);
                max.copyFromFloats(-Infinity, -Infinity);

                for (let j = 0; j < n; j++) {
                    let tvec = mulV2V2Cw(dvec, hull[j]);

                    min.x = Math.min(min.x, tvec.x);
                    min.y = Math.min(min.y, tvec.y);

                    max.x = Math.max(max.x, tvec.x);
                    max.y = Math.max(max.y, tvec.y);

                    area = (max.x - min.x) * (max.y - min.y);

                    if (area > areaBest) {
                        break;
                    }
                }

                if (area < areaBest) {
                    areaBest = area;
                    dvecBest.copyFrom(dvec);
                    minBest.copyFrom(min);
                    maxBest.copyFrom(max);
                }
            }

            iPrev = i;
        }

        let angle = (areaBest !== +Infinity) ? Math.atan2(dvecBest.y, dvecBest.x) : 0;

        return {
            angle,
            min: minBest,
            max: maxBest
        };
    }

    private boxFit2D(points: Vector2[]) {
        let hull = this.convexhull2d(points);
        let { angle } = this.fitAabb2d(hull);

        return angle;
    }

    // private debugFitAABB() {
    //     let canvas = document.createElement("canvas");
    //     let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    //     document.body.appendChild(canvas);
    //     canvas.width = 300;
    //     canvas.height = 300;
    //     canvas.style.position = "absolute";
    //     canvas.style.zIndex = "10";
    //     canvas.style.top = "0px";
    //     canvas.style.left = "0px";

    //     ctx.clearRect(0, 0, 300, 300);
    //     ctx.fillStyle = "white";
    //     ctx.fillRect(0, 0, 300, 300);
    //     ctx.fillStyle = "red";
    //     ctx.translate(150, 150);

    //     let points0 = [
    //         // new Vector2(0, 0),
    //         // new Vector2(25, 25),
    //         // new Vector2(-50, -35),
    //         // new Vector2(125, 32),
    //         // new Vector2(-85, 82),
    //         // new Vector2(0, 100),
    //     ];

    //     for (let i = 0; i < 16; i++) {
    //         points0.push(new Vector2(Math.random() * 200 - 100, Math.random() * 200 - 100));
    //     }

    //     // Draw points
    //     for (let i = 0; i < points0.length; i++) {
    //         ctx.moveTo(points0[i].x, points0[i].y);
    //         ctx.arc(points0[i].x, points0[i].y, 3, 0, 2 * Math.PI);
    //         ctx.fill();
    //     }

    //     let hull = this.convexhull2d(points0);
    //     let { angle, min, max } = this.fitAabb2d(hull);
    //     let rotation = new Vector2(Math.cos(angle), Math.sin(angle));

    //     ctx.strokeStyle = "green";
    //     ctx.beginPath();
    //     ctx.moveTo(hull[0].x, hull[0].y);
    //     for (let i = 1; i < hull.length; i++) {
    //         ctx.lineTo(hull[i].x, hull[i].y);
    //     }
    //     ctx.lineTo(hull[0].x, hull[0].y);

    //     ctx.stroke();

    //     ctx.strokeStyle = "blue";

    //     let tl = new Vector2(min.x, min.y);
    //     let bl = new Vector2(min.x, max.y);
    //     let br = new Vector2(max.x, max.y);
    //     let tr = new Vector2(max.x, min.y);
    //     let base = new Vector2(0, 0);
    //     let tip = new Vector2(50, 0);

    //     tip = mulV2V2Cw(rotation, tip); //.addInPlace(offset);
    //     tl = mulV2V2Cw(rotation, tl); //.addInPlace(offset);
    //     bl = mulV2V2Cw(rotation, bl); //.addInPlace(offset);
    //     br = mulV2V2Cw(rotation, br); //.addInPlace(offset);
    //     tr = mulV2V2Cw(rotation, tr); //.addInPlace(offset);

    //     ctx.beginPath();
    //     ctx.moveTo(tip.x, tip.y);
    //     ctx.lineTo(base.x, base.y);
    //     ctx.stroke();

    //     ctx.moveTo(tl.x, tl.y);
    //     ctx.lineTo(bl.x, bl.y);
    //     ctx.lineTo(br.x, br.y);
    //     ctx.lineTo(tr.x, tr.y);
    //     ctx.lineTo(tl.x, tl.y);
    //     ctx.stroke();
    // }

    // private debugUvs(uvsArray: FloatArray[], indicesArray: IndicesArray[]) {
    //     let canvas = document.createElement("canvas");
    //     let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    //     document.body.appendChild(canvas);
    //     canvas.width = 300;
    //     canvas.height = 300;
    //     canvas.style.position = "absolute";
    //     canvas.style.zIndex = "10";
    //     canvas.style.top = "0px";
    //     canvas.style.left = "0px";
    //     canvas.onclick = () => {
    //         canvas.style.display = "none";
    //     }

    //     ctx.clearRect(0, 0, 300, 300);
    //     ctx.fillStyle = "white";
    //     ctx.fillRect(0, 0, 300, 300);
    //     ctx.fillStyle = "red";
    //     ctx.scale(300, 300);
    //     ctx.lineWidth = 0.001;

    //     ctx.strokeStyle = "green";
    //     for (let j = 0; j < uvsArray.length; j++) {
    //         let uvs = uvsArray[j];
    //         let indices = indicesArray[j];
    //         for (let i = 0; i < indices.length; i += 3) {
    //             let lessThanZeroCount = 0;
    //             if (uvs[indices[i] * 2] < 0) {
    //                 lessThanZeroCount++;
    //             }
    //             if (uvs[indices[i + 1] * 2] < 0) {
    //                 lessThanZeroCount++;
    //             }
    //             if (uvs[indices[i + 2] * 2] < 0) {
    //                 lessThanZeroCount++;
    //             }

    //             if (lessThanZeroCount > 1) {
    //                 debugger;
    //             } else if (lessThanZeroCount === 1) {
    //                 debugger;
    //             }

    //             ctx.beginPath();
    //             ctx.moveTo(uvs[indices[i] * 2], uvs[indices[i] * 2 + 1]);
    //             ctx.lineTo(uvs[indices[i + 1] * 2], uvs[indices[i + 1] * 2 + 1]);
    //             ctx.lineTo(uvs[indices[i + 2] * 2], uvs[indices[i + 2] * 2 + 1]);
    //             ctx.lineTo(uvs[indices[i] * 2], uvs[indices[i] * 2 + 1]);
    //             ctx.stroke();
    //             // ctx.fill();
    //         }
    //     }

    // }

    private optiRotateUvIsland(faces: Face[]) {
        let uvPoints: Vector2[] = [];
        for (let i = 0; i < faces.length; i++) {
            for (let j = 0; j < faces[i].uv.length; j++) {
                uvPoints.push(faces[i].uv[j]);
            }
        }

        let angle = this.boxFit2D(uvPoints);

        if (angle !== 0) {
            this.rotateUvs(uvPoints, angle);
        }

        let [minx, miny, maxx, maxy] = this.boundsIslands(faces);
        let w = maxx - minx;
        let h = maxy - miny;

        if (h + 1e-5 < w) {
            angle = Math.PI / 2;
            this.rotateUvs(uvPoints, angle);
        }
    }

    private mergeUvIslands(islandList: Island[]) {
        let decoratedIslandList: IslandInfo[] = [];

        let islandIdx = islandList.length;

        while (islandIdx) {
            islandIdx--;
            let [minx, miny, maxx, maxy] = this.boundsIslands(islandList[islandIdx]);
            let w = maxx - minx;
            let h = maxy - miny;

            let totFaceArea = 0;
            let offset = new Vector2(minx, miny);
            for (let i = 0; i < islandList[islandIdx].length; i++) {
                for (let j = 0; j < islandList[islandIdx][i].uv.length; j++) {
                    islandList[islandIdx][i].uv[j].subtractInPlace(offset);
                }

                totFaceArea += islandList[islandIdx][i].area;
            }

            if (totFaceArea < SMALL_NUM) {
                islandList.splice(islandIdx, 1);
                continue;
            }

            let islandBoundsArea = w * h;
            let efficiency = Math.abs(islandBoundsArea - totFaceArea);

            // UV Edge list used for intersections as well as unique points.
            let o = this.island2Edge(islandList[islandIdx]);
            let edges = o.lengthSortedEdges;
            let uniqueEdgePoints = o.uniquePoints;

            decoratedIslandList.push([islandList[islandIdx], totFaceArea, efficiency, islandBoundsArea, w, h, edges, uniqueEdgePoints]);
        }

        // Sort by island bounding box area, smallest face area first.
        // no.. chance that to most simple edge loop first.

        let decoratedIslandListAreaSort = decoratedIslandList.slice();
        decoratedIslandListAreaSort.sort((a, b) => a[3] - b[3]);

        let decoratedIslandListEfficSort = decoratedIslandList.slice();
        decoratedIslandListEfficSort.sort((a, b) => b[2] - a[2]);

        const USER_STEP_QUALITY = ((USER_FILL_HOLES_QUALITY - 1) / 25) + 1;
        const USER_FREE_SPACE_TO_TEST_QUALITY = 1 + (((100 - USER_FILL_HOLES_QUALITY) / 100.0) * 5);

        // let removedCount = 0;
        let areaIslandIdx = 0;
        let BREAK = false;

        while (areaIslandIdx < decoratedIslandListAreaSort.length && !BREAK) {
            let sourceIsland = decoratedIslandListAreaSort[areaIslandIdx];

            if (!sourceIsland[0]) {
                areaIslandIdx++;
            } else {
                let efficIslandIdx = 0;
                while (efficIslandIdx < decoratedIslandListEfficSort.length && !BREAK) {
                    let targetIsland = decoratedIslandListEfficSort[efficIslandIdx];

                    if (sourceIsland[0] === targetIsland[0] || !targetIsland[0] || !sourceIsland[0]) {
                        // pass
                    } else {
                        // ([island, totFaceArea, efficiency, islandArea, w,h])
                        // Wasted space on target is greater then UV bounding island area.

                        if (targetIsland[2] > (sourceIsland[1] * USER_FREE_SPACE_TO_TEST_QUALITY) &&
                            targetIsland[4] > sourceIsland[4] &&
                            targetIsland[5] > sourceIsland[5]) {
                            let blockTestXUnit = targetIsland[4] / sourceIsland[4];
                            let blockTestYUnit = targetIsland[5] / sourceIsland[5];

                            let boxLeft = 0;

                            let testWidth = targetIsland[4] - sourceIsland[4];
                            let testHeight = targetIsland[5] - sourceIsland[5];

                            let xIncrement = testWidth / (blockTestXUnit * ((USER_STEP_QUALITY / 50) + 0.1));
                            let yIncrement = testHeight / (blockTestYUnit * ((USER_STEP_QUALITY / 50) + 0.1));

                            // Make sure were not moving less then a 3rg of our width/height
                            if (xIncrement < sourceIsland[4] / 3) {
                                xIncrement = sourceIsland[4];
                            }
                            if (yIncrement < sourceIsland[5] / 3) {
                                yIncrement = sourceIsland[5];
                            }

                            boxLeft = 0;
                            let boxBottom = 0;

                            while (boxBottom < testHeight) {
                                let Intersect = this.islandIntersectUvIsland(sourceIsland, targetIsland, new Vector2(boxLeft, boxBottom));
                                if (Intersect === 1) {
                                    // pass
                                }
                                if (Intersect === 2) {
                                    boxLeft += sourceIsland[4];
                                }
                                else if (Intersect === 0) {
                                    // removedCount++;

                                    for (let h = 0; h < sourceIsland[0].length; h++) {
                                        targetIsland[0].push(sourceIsland[0][h]);
                                    }
                                    let offset = new Vector2(boxLeft, boxBottom);

                                    for (let faceIdx = 0; faceIdx < sourceIsland[0].length; faceIdx++) {
                                        for (let uvIdx = 0; uvIdx < sourceIsland[0][faceIdx].uv.length; uvIdx++) {
                                            sourceIsland[0][faceIdx].uv[uvIdx].addInPlace(offset);
                                        }
                                    }

                                    sourceIsland[0].length = 0;
                                    sourceIsland[0] = null;

                                    for (let k = 0; k < sourceIsland[6].length; k++) {
                                        let e = sourceIsland[6][k] as MeasuredEdge;
                                        if (!e.e) {
                                            continue;
                                        }
                                        targetIsland[6].push(<MeasuredEdge>{
                                            e: {
                                                v0: (<Edge>e.e).v0.add(offset),
                                                v1: (<Edge>e.e).v1.add(offset)
                                                },
                                            l: e.l
                                        });
                                    }

                                    sourceIsland[6].length = 0;
                                    sourceIsland[6] = null;

                                    // Sort by edge length, reverse so biggest are first.
                                    targetIsland[6].sort((a: MeasuredEdge, b: MeasuredEdge) => b.l - a.l);

                                    for (let h = 0; h < sourceIsland[7].length; h++) {
                                        targetIsland[7].push(sourceIsland[7][h]);
                                    }
                                    let offsetV3 = new Vector3(boxLeft, boxBottom, 0);

                                    for (let k = 0; k < sourceIsland[7].length; k++) {
                                        sourceIsland[7][k].addInPlace(offsetV3);
                                    }

                                    sourceIsland[7].length = 0;
                                    sourceIsland[7] = null;

                                    targetIsland[1] += sourceIsland[1];
                                    targetIsland[2] -= sourceIsland[1];

                                    sourceIsland[2] = 0;

                                    break;
                                }

                                if (boxLeft > testWidth) {
                                    boxBottom += yIncrement;
                                    boxLeft = 0;
                                } else {
                                    boxLeft += xIncrement;
                                }
                            }
                        }
                    }
                    efficIslandIdx++;
                }
            }

            areaIslandIdx++;
        }

        let i = islandList.length;

        while (i) {
            i--;
            if (!islandList[i] || !islandList[i].length) {
                islandList.splice(i, 1);
            }
        }
    }

    private getUvIslands(faceGroups: Face[][], deletedFaces: Face[]) {
        let islandList: Island[] = [];

        let faceGroupIdx = faceGroups.length;

        while (faceGroupIdx) {
            faceGroupIdx--;
            let faces = faceGroups[faceGroupIdx].concat(deletedFaces);

            if (!faces) {
                continue;
            }

            let edgeUsers: {[key: string] : number[]} = {};

            for (let i = 0; i < faces.length; i++) {
                let f = faces[i];

                for (let j = 0; j < f.edgeKeys.length; j++) {
                    let edKey = f.edgeKeys[j];
                    edgeUsers[edKey] = edgeUsers[edKey] || [];
                    edgeUsers[edKey].push(i);
                }
            }

            let faceModes = new Uint8Array(faces.length);
            faceModes[0] = 1;

            let newIsland: Island = [];
            newIsland.push(faces[0]);

            let ok = true;

            // Build connexity groups
            while (ok) {
                ok = true;
                while (ok) {
                    ok = false;
                    for (let i = 0; i < faces.length; i++) {
                        if (faceModes[i] === 1) {
                            for (let j = 0; j < faces[i].edgeKeys.length; j++) {
                                let edKey = faces[i].edgeKeys[j];
                                for (let k = 0; k < edgeUsers[edKey].length; k++) {
                                    let ii = edgeUsers[edKey][k];

                                    if (i !== ii && faceModes[ii] === 0) {
                                        faceModes[ii] = 1;
                                        ok = true;
                                        newIsland.push(faces[ii]);
                                    }
                                }
                            }
                            faceModes[i] = 2;
                        }
                    }
                }

                islandList.push(newIsland);

                ok = false;

                for (let i = 0; i < faces.length; i++) {
                    if (faceModes[i] === 0) {
                        newIsland = [];
                        newIsland.push(faces[i]);

                        faceModes[i] = 1;
                        ok = true;
                        break;
                    }
                }
            }
        }

        for (let i = 0; i < islandList.length; i++) {
            this.optiRotateUvIsland(islandList[i]);
        }

        return islandList;
    }

    private removeDoubles(mesh: Mesh) {
        // memory footprint seems huge, but it's better to have speed here
        const PRECISION = 1e-12;
        let indices = mesh.getIndices() as IndicesArray;
        let vertices = Array.from(mesh.getVerticesData(VertexBuffer.PositionKind) as FloatArray);
        let normals = mesh.isVerticesDataPresent(VertexBuffer.NormalKind) ? Array.from(mesh.getVerticesData(VertexBuffer.NormalKind) as FloatArray) : null;
        // let uvs = mesh.isVerticesDataPresent(VertexBuffer.UVKind) ? Array.from(mesh.getVerticesData(VertexBuffer.UVKind) as FloatArray) : null;

        let vertexMap: { [key: string] : { [key: string] : { [key: string] : VertexInfo[] }}} = {};

        for (let i = 0; i < vertices.length; i += 3) {
            let vertex = new Vector3(roundTo(vertices[i], PRECISION), roundTo(vertices[i + 1], PRECISION), roundTo(vertices[i + 2], PRECISION));
            let normal = normals ? new Vector3(roundTo(normals[i], PRECISION), roundTo(normals[i + 1], PRECISION), roundTo(normals[i + 2], PRECISION)) : null;

            let xMap = vertexMap[vertex.x];

            if (!xMap) {
                vertexMap[vertex.x] = {};
            }

            let yMap = vertexMap[vertex.x][vertex.y];

            if (!yMap) {
                vertexMap[vertex.x][vertex.y] = {};
            }

            let zMap = vertexMap[vertex.x][vertex.y][vertex.z];

            if (!zMap) {
                zMap = [];
                vertexMap[vertex.x][vertex.y][vertex.z] = zMap;
            }

            zMap.push({
                vertex,
                normal,
                index: i / 3,
            });
        }

        let verticesToRemove = [];
        let equivalencies: number[][] = [];
        let xValues = Object.keys(vertexMap);

        for (let i = 0; i < xValues.length; i++) {
            let yValues = Object.keys(vertexMap[xValues[i]]);
            for (let j = 0; j < yValues.length; j++) {
                let zValues = Object.keys(vertexMap[xValues[i]][yValues[j]]);

                for (let k = 0; k < zValues.length; k++) {
                    let arr = vertexMap[xValues[i]][yValues[j]][zValues[k]];

                    if (arr.length > 1) {
                        let mainVI = arr[0];
                        equivalencies[mainVI.index] = equivalencies[mainVI.index] || [mainVI.index];

                        for (let h = 1; h < arr.length; h++) {
                            let otherVI = arr[h];
                            verticesToRemove.push(otherVI.index);
                            equivalencies[otherVI.index] = equivalencies[otherVI.index] || [otherVI.index];
                            equivalencies[mainVI.index].push(otherVI.index);
                            equivalencies[otherVI.index].push(mainVI.index);
                        }
                    }
                }
            }
        }

        return {
            indices,
            equivalencies
        };
    }

    private initVertexDataFromAvailableData(oldVertexData: VertexData) : VertexData {
        let vertexData = new VertexData();

        if (oldVertexData.normals) {
            vertexData.normals = [];
        }
        if (oldVertexData.tangents) {
            vertexData.tangents = [];
        }
        if (oldVertexData.uvs) {
            vertexData.uvs = [];
        }
        if (oldVertexData.uvs2) {
            vertexData.uvs2 = [];
        }
        if (oldVertexData.uvs3) {
            vertexData.uvs3 = [];
        }
        if (oldVertexData.uvs4) {
            vertexData.uvs4 = [];
        }
        if (oldVertexData.uvs5) {
            vertexData.uvs5 = [];
        }
        if (oldVertexData.uvs6) {
            vertexData.uvs6 = [];
        }
        if (oldVertexData.colors) {
            vertexData.colors = [];
        }
        if (oldVertexData.matricesIndices) {
            vertexData.matricesIndices = [];
        }
        if (oldVertexData.matricesIndicesExtra) {
            vertexData.matricesIndicesExtra = [];
        }
        if (oldVertexData.matricesWeights) {
            vertexData.matricesWeights = [];
        }
        if (oldVertexData.matricesWeightsExtra) {
            vertexData.matricesWeightsExtra = [];
        }

        return vertexData;
    }

    /**
     * Builds unique uvs in texture space, ready for lightmapping
     * @param obList All the meshes to pack in the same uv space
     * @param islandMargin Relative margin between islands
     * @param projectionLimit Angle limit (in deg) to create a seam
     * @param userAreaWeight Add a weight on triangle areas to limit distortion
     * @param useAspect Unused parameter (TODO)
     * @param strechToBounds Unused parameter (TODO)
     * @param removeDoubles If some vertices share the same position, mergin them reduces the number of islands in uv space, thus saving space and reducing seams
     * set to true to activate the vertex merging.
     * @returns An average world space to uv space ratio, resulting of the uv layout.
     */
    public map(obList: Mesh[],
        islandMargin: number = 0,
        projectionLimit: number = 89,
        userAreaWeight: number = 0,
        useAspect: boolean = false, // TODO
        strechToBounds: boolean = false, // TODO
        removeDoubles: boolean = true) : number {
        const USER_PROJECTION_LIMIT_CONVERTED = Math.cos(projectionLimit * Math.PI / 180);
        const USER_PROJECTION_LIMIT_HALF_CONVERTED = Math.cos(projectionLimit / 2 * Math.PI / 180);
        const USER_SHARE_SPACE = true;

        let collectedIslandList: Island[] = [];
        let deletedFaces: Face[] = [];
        let equivalencies = [];
        let worldToUVRatio = 0;

        if (USER_SHARE_SPACE) {
            // Sort by name so we get consistent results
            obList.sort((a: Mesh, b: Mesh) => a.name.localeCompare(b.name));
        }

        for (let i = 0; i < obList.length; i++) {
            let meshFaces: Face[] = [];
            let m = obList[i];

            if (!m.isVerticesDataPresent(VertexBuffer.PositionKind)) {
                continue;
            }

            let indices = m.getIndices() as IndicesArray;

            if (removeDoubles) {
                let o = this.removeDoubles(m);
                equivalencies[i] = o.equivalencies;
            } else {
                equivalencies[i] = [];
            }

            let matrix = m.getWorldMatrix();
            let vertexData = VertexData.ExtractFromMesh(obList[i]);
            for (let j = 0; j < indices.length; j += 3) {
                meshFaces.push(new Face(j, vertexData, i, matrix, equivalencies[i]));
            }

            meshFaces.sort((a, b) => b.area - a.area);

            while (meshFaces.length && meshFaces[meshFaces.length - 1].area <= SMALL_NUM) {
                for (let j = 0; j < meshFaces[meshFaces.length - 1].uv.length; j++) {
                    let uv = meshFaces[meshFaces.length - 1].uv[j];
                    uv.copyFromFloats(0, 0);
                }
                deletedFaces.push(meshFaces.pop() as Face);
            }

            if (!meshFaces.length) {
                continue;
            }

            let projectVecs: Vector3[] = [];
            let newProjectVec: Vector3 = meshFaces[0].no;
            let newProjectMeshFaces: Face[] = [];

            let mostUniqueAngle: number = -1;
            let mostUniqueIndex: number;

            let tempMeshFaces = meshFaces.slice();

            // This while only gathers projection vecs, faces are assigned later on.
            while (true) {
                for (let fIdx = tempMeshFaces.length - 1; fIdx >= 0; fIdx--) {
                    if (Vector3.Dot(newProjectVec, tempMeshFaces[fIdx].no) > USER_PROJECTION_LIMIT_HALF_CONVERTED) {
                        newProjectMeshFaces.push(tempMeshFaces.splice(fIdx, 1)[0]);
                    }
                }

                let averageVec = new Vector3(0, 0, 0);
                if (userAreaWeight === 0) {
                    for (let j = 0; j < newProjectMeshFaces.length; j++) {
                        averageVec.addInPlace(newProjectMeshFaces[j].no);
                    }
                } else if (userAreaWeight === 1) {
                    for (let j = 0; j < newProjectMeshFaces.length; j++) {
                        averageVec.addInPlace(newProjectMeshFaces[j].no.scale(newProjectMeshFaces[j].area));
                    }
                } else {
                    for (let j = 0; j < newProjectMeshFaces.length; j++) {
                        averageVec.addInPlace(
                            newProjectMeshFaces[j].no.scale(
                                newProjectMeshFaces[j].area * userAreaWeight + (1 - userAreaWeight)));
                    }
                }

                if (averageVec.x !== 0 || averageVec.y !== 0 || averageVec.z !== 0) {
                    // avoid NAN
                    projectVecs.push(averageVec.normalize());
                }

                mostUniqueAngle = 1;
                mostUniqueIndex = 0;

                for (let fIdx = tempMeshFaces.length - 1; fIdx >= 0; fIdx--) {
                    let angleDifference = -1; // 180° difference

                    // Get the closest vec angle we are to.
                    for (let j = 0; j < projectVecs.length; j++) {
                        let p = projectVecs[j];
                        let tempAngleDiff = Vector3.Dot(p, tempMeshFaces[fIdx].no);

                        if (angleDifference < tempAngleDiff) {
                            angleDifference = tempAngleDiff;
                        }
                    }

                    if (angleDifference < mostUniqueAngle) {
                        // We have a new most different angle
                        mostUniqueIndex = fIdx;
                        mostUniqueAngle = angleDifference;
                    }
                }

                if (mostUniqueAngle < USER_PROJECTION_LIMIT_CONVERTED) {
                    newProjectVec = tempMeshFaces[mostUniqueIndex].no;
                    newProjectMeshFaces = tempMeshFaces.splice(mostUniqueIndex, 1);
                } else {
                    if (projectVecs.length) {
                        break;
                    }
                }
            }

            if (!projectVecs.length) {
                // Error
                console.log("error, no projection vecs where generated, 0 area faces can cause this.");
            }

            let faceProjectionGroupList: Face[][] = [];
            for (let i = 0; i < projectVecs.length; i++) {
                faceProjectionGroupList.push([]);
            }

            for (let fIdx = meshFaces.length - 1; fIdx >= 0; fIdx--) {
                let fvec = meshFaces[fIdx].no;
                let i = projectVecs.length;

                let bestAng = Vector3.Dot(fvec, projectVecs[0]);
                let bestAngIdx = 0;

                while (i - 1) {
                    i--;

                    let newAng = Vector3.Dot(fvec, projectVecs[i]);
                    if (newAng > bestAng) {
                        bestAng = newAng;
                        bestAngIdx = i;
                    }
                }

                faceProjectionGroupList[bestAngIdx].push(meshFaces[fIdx]);
            }

            for (let i = 0; i < projectVecs.length; i++) {
                if (!faceProjectionGroupList[i].length) {
                    continue;
                }

                let mat = projectMat(projectVecs[i]);

                for (let j = 0; j < faceProjectionGroupList[i].length; j++) {
                    let f = faceProjectionGroupList[i][j];
                    for (let k = 0; k < f.uv.length; k++) {
                        let proj = Vector3.TransformCoordinates(f.v[k].v, mat);
                        f.uv[k].copyFromFloats(proj.x, proj.y);
                    }
                }
            }

            if (USER_SHARE_SPACE) {
                let islandList = this.getUvIslands(faceProjectionGroupList, deletedFaces);
                collectedIslandList = collectedIslandList.concat(islandList);
            } else {
                collectedIslandList = this.getUvIslands(faceProjectionGroupList, deletedFaces);
                worldToUVRatio = this.packIslands(collectedIslandList);
            }
        }

        if (USER_SHARE_SPACE) {
            worldToUVRatio = this.packIslands(collectedIslandList);
        }

        let newUvs: FloatArray[] = [];
        let indices: IndicesArray[] = [];
        let vertices: FloatArray[] = [];
        let additionnalVertexData: VertexData[] = [];
        let additionnalUvs : Vector2[][] = [];
        let additionnalVertices : Vector3[][] = [];

        for (let i = 0; i < obList.length; i++) {
            newUvs.push(new Float32Array(obList[i].getTotalVertices() * 2));
            // Init to -1
            for (let j = 0; j < newUvs[newUvs.length - 1].length; j++) {
                newUvs[newUvs.length - 1][j] = -1;
            }
            indices.push(<IndicesArray>obList[i].getIndices());
            vertices.push(<FloatArray>obList[i].getVerticesData(VertexBuffer.PositionKind));
            additionnalVertexData.push(this.initVertexDataFromAvailableData(VertexData.ExtractFromMesh(obList[i])));
            additionnalUvs.push([]);
            additionnalVertices.push([]);
        }

        for (let i = 0; i < collectedIslandList.length; i++) {
            for (let j = 0; j < collectedIslandList[i].length; j++) {
                let f = collectedIslandList[i][j];
                for (let k = 0; k < 3; k++) {
                    if (newUvs[f.meshIndex][indices[f.meshIndex][(f.index + k)] * 2] < 0) {
                        // this vertex doesn't have uv yet, we assign them
                        newUvs[f.meshIndex][indices[f.meshIndex][(f.index + k)] * 2] = f.uv[k].x;
                        newUvs[f.meshIndex][indices[f.meshIndex][(f.index + k)] * 2 + 1] = f.uv[k].y;
                    } else {
                        // This vertex already has uvs, we create a seam

                        // Search existing created vertices
                        let newUv = new Vector2(f.uv[k].x, f.uv[k].y);
                        let newPosition = new Vector3(f.v[k].v.x, f.v[k].v.y, f.v[k].v.z);
                        let index = -1;
                        for (let h = 0; h < additionnalUvs[f.meshIndex].length; h++) {
                            if (additionnalUvs[f.meshIndex][h].equals(newUv) &&
                                additionnalVertices[f.meshIndex][h].equals(newPosition)) {
                                index = h;
                                break;
                            }
                        }

                        if (index === -1) {
                            // could not find one, we add to the list
                            additionnalUvs[f.meshIndex].push(newUv);
                            additionnalVertices[f.meshIndex].push(newPosition);
                            f.pushVertexToVertexData(additionnalVertexData[f.meshIndex], k);
                            index = additionnalUvs[f.meshIndex].length - 1;
                        }

                        indices[f.meshIndex][f.index + k] = index + vertices[f.meshIndex].length / 3;
                    }
                }
            }
        }

        // Adding created vertices to the list
        for (let meshIndex = 0; meshIndex < additionnalUvs.length; meshIndex++) {
            if (additionnalUvs[meshIndex].length) {
                let tempUvs = new Float32Array(additionnalUvs[meshIndex].length * 2);
                let tempVertices = new Float32Array(additionnalUvs[meshIndex].length * 3);

                let mat = obList[meshIndex].getWorldMatrix();
                mat = mat.clone().invert();

                for (let i = 0; i < additionnalUvs[meshIndex].length; i++) {
                    tempUvs[i * 2] = additionnalUvs[meshIndex][i].x;
                    tempUvs[i * 2 + 1] = additionnalUvs[meshIndex][i].y;
                }

                for (let i = 0; i < additionnalVertices[meshIndex].length; i++) {
                    additionnalVertices[meshIndex][i] = Vector3.TransformCoordinates(additionnalVertices[meshIndex][i], mat);
                    tempVertices[i * 3] = additionnalVertices[meshIndex][i].x;
                    tempVertices[i * 3 + 1] = additionnalVertices[meshIndex][i].y;
                    tempVertices[i * 3 + 2] = additionnalVertices[meshIndex][i].z;
                }

                additionnalVertexData[meshIndex].positions = tempVertices;
                additionnalVertexData[meshIndex].uvs2 = tempUvs; // TODO let the possibility to choose which uv channel to replace, or straight return uv array
                additionnalVertexData[meshIndex].indices = [];
            }

            let verticesData = VertexData.ExtractFromMesh(obList[meshIndex]);
            verticesData.indices = indices[meshIndex];
            verticesData.uvs2 = newUvs[meshIndex];
            if (additionnalUvs[meshIndex].length) {
                verticesData.merge(additionnalVertexData[meshIndex]);
            }

            verticesData.applyToMesh(obList[meshIndex]);
            newUvs[meshIndex] = verticesData.uvs2;
        }

        // this.debugUvs(newUvs, indices);

        return worldToUVRatio;
    }

    private packIslands(islandList: Island[]) : number {
        if (USER_FILL_HOLES) {
            this.mergeUvIslands(islandList);
        }

        let packBoxes = [];
        let islandOffsetList = [];
        let islandIdx = 0;

        while (islandIdx < islandList.length) {
            let [minx, miny, maxx, maxy] = this.boundsIslands(islandList[islandIdx]);

            let w = maxx - minx;
            let h = maxy - miny;

            if (USER_ISLAND_MARGIN) {
                minx -= USER_ISLAND_MARGIN * w / 2;
                miny -= USER_ISLAND_MARGIN * h / 2;
                maxx += USER_ISLAND_MARGIN * w / 2;
                maxy += USER_ISLAND_MARGIN * h / 2;

                w = maxx - minx;
                h = maxy - miny;
            }

            if (w < SMALL_NUM) {
                w = SMALL_NUM;
            }
            if (h < SMALL_NUM) {
                h = SMALL_NUM;
            }

            islandOffsetList.push(new Vector2(minx, miny));

            // Legacy uv packer
            // packBoxes.push({
            //     x: 0,
            //     y: 0,
            //     w,
            //     h,
            //     islandIdx: islandIdx
            // });
            packBoxes.push(new BoxBlender(0, 0, w, h, islandIdx));
            islandIdx++;
        }

        // Legacy uv packer
        // let packDimension = BoxPacker.BoxPack2d(packBoxes);
        let packDimension = BoxPacker.BoxPack2dBlender(packBoxes);

        islandIdx = islandList.length;
        let xFactor = 1, yFactor = 1;

        if (islandIdx) {
            xFactor = 1.0 / Math.max(packDimension.w, packDimension.h);
            yFactor = xFactor;
        }

        for (let boxIdx = 0; boxIdx < packBoxes.length; boxIdx++) {
            let box = packBoxes[boxIdx];
            let islandIdx = box.index;

            // Legacy uv packer
            // let islandIdx = box.islandIdx

            let xOffset = box.x - islandOffsetList[islandIdx].x;
            let yOffset = box.y - islandOffsetList[islandIdx].y;

            for (let i = 0; i < islandList[islandIdx].length; i++) {
                let f = islandList[islandIdx][i];
                for (let j = 0; j < f.uv.length; j++) {
                    let uv = f.uv[j];
                    uv.x = (uv.x + xOffset) * xFactor;
                    uv.y = (uv.y + yOffset) * yFactor;
                }
            }

        }

        return xFactor;
    }
}

declare interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
    islandIdx?: number;
}

class BoxBlender {
    x: number;
    y: number;
    w: number;
    h: number;

    // Box vertices
    v: BoxVert[] = [ new BoxVert(), new BoxVert(), new BoxVert(), new BoxVert()];

    index: number;

    constructor(x: number, y: number, w: number, h: number, index: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.index = index;
    }

    // Change original names
    public v34x_update()
    {
        this.v[CORNERINDEX.TL].x = this.v[CORNERINDEX.BL].x;
        this.v[CORNERINDEX.BR].x = this.v[CORNERINDEX.TR].x;
    }

    public v34y_update()
    {
        this.v[CORNERINDEX.TL].y = this.v[CORNERINDEX.TR].y;
        this.v[CORNERINDEX.BR].y = this.v[CORNERINDEX.BL].y;
    }

    public xmin_set(f: number)
    {
        this.v[CORNERINDEX.TR].x = f + this.w;
        this.v[CORNERINDEX.BL].x = f;
        this.v34x_update();
    }

    public xmax_set(f: number)
    {
        this.v[CORNERINDEX.BL].x = f - this.w;
        this.v[CORNERINDEX.TR].x = f;
        this.v34x_update();
    }

    public ymin_set(f: number)
    {
        this.v[CORNERINDEX.TR].y = f + this.h;
        this.v[CORNERINDEX.BL].y = f;
        this.v34y_update();
    }

    public ymax_set(f: number)
    {
        this.v[CORNERINDEX.BL].y = f - this.h;
        this.v[CORNERINDEX.TR].y = f;
        this.v34y_update();
    }

    public xmin_get() : number
    {
        return this.v[CORNERINDEX.BL].x;
    }

    public xmax_get() : number
    {
        return this.v[CORNERINDEX.TR].x;
    }

    public ymin_get() : number
    {
        return this.v[CORNERINDEX.BL].y;
    }

    public ymax_get() : number
    {
        return this.v[CORNERINDEX.TR].y;
    }

    public intersect(box: BoxBlender) {
        return !(this.xmin_get() + 1e-7 >= box.xmax_get() ||
            this.ymin_get() + 1e-7 >= box.ymax_get() ||
            this.xmax_get() - 1e-7 <= box.xmin_get() ||
            this.ymax_get() - 1e-7 <= box.ymin_get());
    }
}

// Corner indices
enum CORNERINDEX {
    BL = 0,
    TR = 1,
    TL = 2,
    BR = 3,
    MAX = 4,
}

// BLF bottom left flag
enum CORNERFLAGS {
    BLF = 1,
    TRF = 2,
    TLF = 4,
    BRF = 8,
    MAX = 15,
}

/**
 * Convert the index of a vertex ranging from 0 to 3, to it's corresponding CORNERFLAG
 * @param {number} index
 * @returns {number} the flag
 */
function toFlag(index: number) : number {
    return 1 << index;
}

class BoxVert {
    x: number;
    y: number;

    free : number = CORNERFLAGS.MAX;  /* vert status */
    used : boolean = false;
    _pad : number = 23;
    index : number;

    trb : BoxBlender; /* top right box */
    blb : BoxBlender; /* bottom left box */
    brb : BoxBlender; /* bottom right box */
    tlb : BoxBlender; /* top left box */

    /* Store last intersecting boxes here
     * speedup intersection testing */
    intersection_cache: Nullable<BoxBlender>[] = [
        null,
        null,
        null,
        null,
    ];

// #ifdef USE_PACK_BIAS
    bias : number = 0;
    _pad2 : number;
// #endif

    public updateBias() {
        if (!this.used) {
            console.warn("Vertex must be used before updating it's biad !");
        }

        this.bias = this.x * this.y * 1e-6;
    }
}

/**
 * Helper that pack boxes into texture space
 */
class BoxPacker {

    /**
     * Pack boxes into texture space
     * @param boxes Boxes
     */
    public static BoxPack2d(boxes: Box[]) {
        // calculate total box area and maximum box width
        let area = 0;
        let maxWidth = 0;

        for (const box of boxes) {
            area += box.w * box.h;
            maxWidth = Math.max(maxWidth, box.w);
        }

        // sort the boxes for insertion by height, descending
        boxes.sort((a, b) => b.h - a.h);

        // aim for a squarish resulting container,
        // slightly adjusted for sub-100% space utilization
        const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth);

        // start with a single empty space, unbounded at the bottom
        const spaces : Box[] = [{x: 0, y: 0, w: startWidth, h: Infinity}];

        let width = 0;
        let height = 0;

        for (const box of boxes) {
            // look through spaces backwards so that we check smaller spaces first
            for (let i = spaces.length - 1; i >= 0; i--) {
                const space = spaces[i];

                // look for empty spaces that can accommodate the current box
                if (box.w > space.w || box.h > space.h) { continue; }

                // found the space; add the box to its top-left corner
                // |-------|-------|
                // |  box  |       |
                // |_______|       |
                // |         space |
                // |_______________|
                box.x = space.x;
                box.y = space.y;

                height = Math.max(height, box.y + box.h);
                width = Math.max(width, box.x + box.w);

                if (box.w === space.w && box.h === space.h) {
                    // space matches the box exactly; remove it
                    const last = spaces.pop();
                    if (i < spaces.length) { spaces[i] = last as Box; }

                } else if (box.h === space.h) {
                    // space matches the box height; update it accordingly
                    // |-------|---------------|
                    // |  box  | updated space |
                    // |_______|_______________|
                    space.x += box.w;
                    space.w -= box.w;

                } else if (box.w === space.w) {
                    // space matches the box width; update it accordingly
                    // |---------------|
                    // |      box      |
                    // |_______________|
                    // | updated space |
                    // |_______________|
                    space.y += box.h;
                    space.h -= box.h;

                } else {
                    // otherwise the box splits the space into two spaces
                    // |-------|-----------|
                    // |  box  | new space |
                    // |_______|___________|
                    // | updated space     |
                    // |___________________|
                    spaces.push({
                        x: space.x + box.w,
                        y: space.y,
                        w: space.w - box.w,
                        h: box.h
                    });
                    space.y += box.h;
                    space.h -= box.h;
                }
                break;
            }
        }

        return {
            w: width, // container width
            h: height, // container height
            fill: (area / (width * height)) || 0 // space utilization
        };
    }

    /**
     * Pack boxes to the lower left hand corner
     * TODO : use must be fixed
     */
    static BoxPack2dBlender(boxes: BoxBlender[], usePackBias: boolean = true, useFreeStrip: boolean = true, useMerge: boolean = false) {
        // Sort boxes by area
        boxes.sort((a, b) => (b.w * b.h) - (a.w * a.h));

        // total
        let tot = Vector2.Zero();

        const vertices: BoxVert[] = [];
        const vertexPackIndices : number[] = [];

        // Initialize boxes vertices, and vertices boxes
        let index = 0;
        for (const box of boxes) {
            const topRightVertex = new BoxVert();
            topRightVertex.index = index++;
            topRightVertex.trb = box;
            topRightVertex.free &= ~CORNERFLAGS.TRF;
            box.v[CORNERINDEX.BL] = topRightVertex;
            vertices.push(topRightVertex);

            const bottomLeftVertex = new BoxVert();
            bottomLeftVertex.index = index++;
            bottomLeftVertex.blb = box;
            bottomLeftVertex.free &= ~CORNERFLAGS.BLF;
            box.v[CORNERINDEX.TR] = bottomLeftVertex;
            vertices.push(bottomLeftVertex);

            const bottomRightVertex = new BoxVert();
            bottomRightVertex.index = index++;
            bottomRightVertex.brb = box;
            bottomRightVertex.free &= ~CORNERFLAGS.BRF;
            box.v[CORNERINDEX.TL] = bottomRightVertex;
            vertices.push(bottomRightVertex);

            const topLeftVertex = new BoxVert();
            topLeftVertex.index = index++;
            topLeftVertex.tlb = box;
            topLeftVertex.free &= ~CORNERFLAGS.TLF;
            box.v[CORNERINDEX.BR] = topLeftVertex;
            vertices.push(topLeftVertex);
        }

        // Fit the first before entering the firstBox fitting loop
        let firstBox = boxes[0];

        // Update free neighboors state
        firstBox.v[CORNERINDEX.BL].free = 0; // No more adjacent space
        // This vextex stick to the left border
        firstBox.v[CORNERINDEX.TL].free &= ~(CORNERFLAGS.TLF | CORNERFLAGS.BLF);
        // This vextex stick to the bottom border
        firstBox.v[CORNERINDEX.BR].free &= ~(CORNERFLAGS.BLF | CORNERFLAGS.BRF);

        // Total used space
        tot.x = firstBox.w;
        tot.y = firstBox.h;

        // Set firstBox vertices position
        firstBox.xmin_set(0);
        firstBox.ymin_set(0);
        firstBox.x = 0;
        firstBox.y = 0;

        for (const boxVertex of firstBox.v) {
            boxVertex.used = true;

            if (usePackBias) {
                boxVertex.updateBias();
            }
        }

        for (let cornerIndex = 0; cornerIndex < CORNERINDEX.MAX - 1; cornerIndex++) {
            vertexPackIndices.push(firstBox.v[cornerIndex + 1].index);
        }

        // Main firstBox fitting loop
        // for (const box of boxes) {
        for (let boxIndex = 1; boxIndex < boxes.length; boxIndex++) {
            const box = boxes[boxIndex];

            const vertexSort = (index1: number, index2: number) => {
                const v1 = vertices[index1];
                const v2 = vertices[index2];
                let a1, a2;

                if (useFreeStrip) {
                    /* push free verts to the end so we can strip */
                    if (v1.free == 0 && v2.free == 0) {
                        return  0;
                    } else if (v1.free == 0) {
                        return  1;
                    } else if (v2.free == 0) {
                        return -1;
                    }
                }

                a1 = Math.max(v1.x + box.w, v1.y + box.h);
                a2 = Math.max(v2.x + box.w, v2.y + box.h);

                if (usePackBias) {
                    a1 += v1.bias;
                    a2 += v2.bias;
                }

                /* sort largest to smallest */
                if (a1 > a2) {
                    return 1;
                } else if (a1 < a2) {
                    return -1;
                }
                return 0;
            };

            vertexPackIndices.sort(vertexSort);

            // Find vertices fully used and remove them from the vertex pack to speed up vertices loop
            if (useFreeStrip) {
                let index = vertexPackIndices.length - 1;

                while (index != 0 && vertices[vertexPackIndices[index]].free == 0) {
                    vertexPackIndices.pop();
                    index--;
                }
            }

            let intersection = true;

            for (let i = 0; i < vertexPackIndices.length && intersection; i++) {
                const vertex = vertices[vertexPackIndices[i]];

                /**
                 * This vert has a free quadrant
                 * Test if we can place the firstBox here
                 * vert->free & quad_flags[cornerIndex] - Checks
                 */
                for (let quadrantIndex = 0; quadrantIndex < CORNERINDEX.MAX && intersection; quadrantIndex++) {
                    if (vertex.free & toFlag(quadrantIndex)) {
                        switch (quadrantIndex) {
                            case CORNERINDEX.BL: {
                                box.xmax_set(vertex.x);
                                box.ymax_set(vertex.y);
                                break;
                            }
                            case CORNERINDEX.TR: {
                                box.xmin_set(vertex.x);
                                box.ymin_set(vertex.y);
                                break;
                            }
                            case CORNERINDEX.TL: {
                                box.xmax_set(vertex.x);
                                box.ymin_set(vertex.y);
                                break;
                            }
                            case CORNERINDEX.BR: {
                                box.xmin_set(vertex.x);
                                box.ymax_set(vertex.y);
                                break;
                            }
                        }

                        /**
                         * Now we need to check that the firstBox intersects
                         * with any other boxes
                         * Assume no intersection...
                         */
                        intersection = false;
                        if (box.xmin_get() < 0 || box.ymin_get() < 0
                            || (vertex.intersection_cache[quadrantIndex] && box.intersect(vertex.intersection_cache[quadrantIndex]!))) {
                            /**
                             * Here we check that the last intersected
                             * firstBox will intersect with this one using
                             * isect_cache that can store a pointer to a
                             * firstBox for each quadrant
                             * big speedup
                             */
                            intersection = true;
                        } else {
                            /**
                             * do a full search for colliding firstBox
                             * this is really slow, some spatially divided
                             * data-structure would be better
                             */
                            // As boxes are sorted we know that only previous boxes already placed, so we can break once we find the current firstBox
                            for (let testBoxIndex = 0; boxes[testBoxIndex].index !== box.index; testBoxIndex++) {
                                if (box.intersect(boxes[testBoxIndex])) {
                                    vertex.intersection_cache[quadrantIndex] = boxes[testBoxIndex];
                                    intersection = true;
                                    break;
                                }
                            }
                        }

                        if (!intersection) {
                            tot = Vector2.Maximize(tot, new Vector2(box.xmax_get(), box.ymax_get()));

                            // Update the free quadrants states
                            vertex.free &= ~toFlag(quadrantIndex);

                            switch (quadrantIndex) {
                                case CORNERINDEX.TR: {
                                    box.v[CORNERINDEX.BL] = vertex;
                                    vertex.trb = box;
                                    break;
                                }
                                case CORNERINDEX.TL: {
                                    box.v[CORNERINDEX.BR] = vertex;
                                    vertex.tlb = box;
                                    break;
                                }
                                case CORNERINDEX.BR: {
                                    box.v[CORNERINDEX.TL] = vertex;
                                    vertex.brb = box;
                                    break;
                                }
                                case CORNERINDEX.BL: {
                                    box.v[CORNERINDEX.TR] = vertex;
                                    vertex.blb = box;
                                    break;
                                }
                            }

                            /**
                             * Mask free flags for verts that are
                             * on the bottom or side so we don't get
                             * boxes outside the given rectangle ares
                             *
                             * We can do an else/if here because only the first
                             * firstBox can be at the very bottom left corner
                             */
                            if (box.xmin_get() <= 0) {
                                box.v[CORNERINDEX.TL].free &= ~(CORNERFLAGS.TLF | CORNERFLAGS.BLF);
                                box.v[CORNERINDEX.BL].free &= ~(CORNERFLAGS.TLF | CORNERFLAGS.BLF);
                            }
                            else if (box.ymin_get() <= 0) {
                                box.v[CORNERINDEX.BL].free &= ~(CORNERFLAGS.BRF | CORNERFLAGS.BLF);
                                box.v[CORNERINDEX.BR].free &= ~(CORNERFLAGS.BRF | CORNERFLAGS.BLF);
                            }

                            /**
                             * The following block of code does a logical
                             * check with 2 adjacent boxes, its possible to
                             * flag verts on one or both of the boxes
                             * as being used by checking the width or
                             * height of both boxes
                             *
                             * Vertically
                             */
                            if (vertex.trb && vertex.tlb && (box === vertex.trb || box === vertex.tlb)) {
                                if (Math.abs(vertex.tlb.h - vertex.trb.h) < 1e-6) {
                                    if (useMerge) {
                                        const mask = CORNERFLAGS.BLF | CORNERFLAGS.BRF;

                                        if (vertex.trb.v[CORNERINDEX.TL].used != vertex.tlb.v[CORNERINDEX.TR].used) {
                                            console.warn("One of those vertices must not be used before merging them !");
                                            console.log(boxIndex);
                                        }

                                        if (vertex.trb.v[CORNERINDEX.TL].used) {
                                            vertex.trb.v[CORNERINDEX.TL].free &= vertex.tlb.v[CORNERINDEX.TR].free & ~mask;
                                            vertex.tlb.v[CORNERINDEX.TR] = vertex.trb.v[CORNERINDEX.TL];
                                        } else {
                                            vertex.tlb.v[CORNERINDEX.TR].free &= vertex.trb.v[CORNERINDEX.TL].free & ~mask;
                                            vertex.trb.v[CORNERINDEX.TL] = vertex.tlb.v[CORNERINDEX.TR];
                                        }
                                    } else {
                                        vertex.tlb.v[CORNERINDEX.TR].free &= ~CORNERFLAGS.BLF;
                                        vertex.trb.v[CORNERINDEX.TL].free &= ~CORNERFLAGS.BRF;
                                    }
                                } else if (vertex.tlb.h > vertex.trb.h) {
                                    vertex.trb.v[CORNERINDEX.TL].free &= ~(CORNERFLAGS.BLF | CORNERFLAGS.TLF);
                                } else {
                                    vertex.tlb.v[CORNERINDEX.TR].free &= ~(CORNERFLAGS.BRF | CORNERFLAGS.TRF);
                                }
                            }

                            else if (vertex.brb && vertex.blb && (box === vertex.brb || box === vertex.blb)) {
                                if (Math.abs(vertex.blb.h - vertex.brb.h) < 1e-6) {
                                    if (useMerge) {
                                        const mask = CORNERFLAGS.TLF | CORNERFLAGS.TRF;

                                        if (vertex.brb.v[CORNERINDEX.BL].used != vertex.blb.v[CORNERINDEX.BR].used) {
                                            console.warn("One of those vertices must not be used before merging them !");
                                            console.log(boxIndex);
                                        }

                                        if (vertex.blb.v[CORNERINDEX.BR].used) {
                                            vertex.blb.v[CORNERINDEX.BR].free &= vertex.brb.v[CORNERINDEX.BL].free & ~mask;
                                            vertex.brb.v[CORNERINDEX.BL] = vertex.blb.v[CORNERINDEX.BR];
                                        } else {
                                            vertex.brb.v[CORNERINDEX.BL].free &= vertex.blb.v[CORNERINDEX.BR].free & ~mask;
                                            vertex.blb.v[CORNERINDEX.BR] = vertex.brb.v[CORNERINDEX.BL];
                                        }
                                    } else {
                                        vertex.blb.v[CORNERINDEX.BR].free &= ~CORNERFLAGS.TRF;
                                        vertex.brb.v[CORNERINDEX.BL].free &= ~CORNERFLAGS.TLF;
                                    }
                                } else if (vertex.blb.h > vertex.brb.h) {
                                    vertex.brb.v[CORNERINDEX.BL].free &= ~(CORNERFLAGS.BLF | CORNERFLAGS.TLF);
                                } else {
                                    vertex.blb.v[CORNERINDEX.BR].free &= ~(CORNERFLAGS.BRF | CORNERFLAGS.TRF);
                                }
                            }

                            // Horizontally
                            else if (vertex.tlb && vertex.blb && (box === vertex.tlb || box === vertex.blb)) {
                                if (Math.abs(vertex.tlb.w - vertex.blb.w) < 1e-6) {
                                    if (useMerge) {
                                        const mask = CORNERFLAGS.TRF | CORNERFLAGS.BRF;

                                        if (vertex.tlb.v[CORNERINDEX.TL].used != vertex.blb.v[CORNERINDEX.BL].used) {
                                            console.warn("One of those vertices must not be used before merging them !");
                                            console.log(boxIndex);
                                        }

                                        if (vertex.blb.v[CORNERINDEX.TL].used) {
                                            vertex.blb.v[CORNERINDEX.TL].free &= vertex.tlb.v[CORNERINDEX.BL].free & ~mask;
                                            vertex.tlb.v[CORNERINDEX.BL] = vertex.blb.v[CORNERINDEX.TL];
                                        } else {
                                            vertex.tlb.v[CORNERINDEX.BL].free &= vertex.blb.v[CORNERINDEX.TL].free & ~mask;
                                            vertex.blb.v[CORNERINDEX.TL] = vertex.tlb.v[CORNERINDEX.BL];
                                        }
                                    } else {
                                        vertex.blb.v[CORNERINDEX.TL].free &= ~CORNERFLAGS.TRF;
                                        vertex.tlb.v[CORNERINDEX.BL].free &= ~CORNERFLAGS.BRF;
                                    }
                                } else if (vertex.tlb.w > vertex.blb.w) {
                                    vertex.blb.v[CORNERINDEX.TL].free &= ~(CORNERFLAGS.TLF | CORNERFLAGS.TRF);
                                } else {
                                    vertex.tlb.v[CORNERINDEX.BL].free &= ~(CORNERFLAGS.BLF | CORNERFLAGS.BRF);
                                }
                            }
                            else if (vertex.trb && vertex.brb && (box === vertex.trb || box === vertex.brb)) {
                                if (Math.abs(vertex.trb.w - vertex.brb.w) < 1e-6) {
                                    if (useMerge) {
                                        const mask = CORNERFLAGS.TLF | CORNERFLAGS.BLF;

                                        if (vertex.trb.v[CORNERINDEX.TR].used != vertex.brb.v[CORNERINDEX.BR].used) {
                                            console.warn("One of those vertices must not be used before merging them !");
                                            console.log(boxIndex);
                                        }

                                        if (vertex.brb.v[CORNERINDEX.TR].used) {
                                            vertex.brb.v[CORNERINDEX.TR].free &= vertex.trb.v[CORNERINDEX.BR].free & ~mask;
                                            vertex.trb.v[CORNERINDEX.BR] = vertex.brb.v[CORNERINDEX.TR];
                                        } else {
                                            vertex.trb.v[CORNERINDEX.BR].free &= vertex.brb.v[CORNERINDEX.TR].free & ~mask;
                                            vertex.brb.v[CORNERINDEX.TR] = vertex.trb.v[CORNERINDEX.BR];
                                        }
                                    } else {
                                        vertex.brb.v[CORNERINDEX.TR].free &= ~CORNERFLAGS.TLF;
                                        vertex.trb.v[CORNERINDEX.BR].free &= ~CORNERFLAGS.BLF;
                                    }
                                } else if (vertex.trb.w > vertex.brb.w) {
                                    vertex.brb.v[CORNERINDEX.TR].free &= ~(CORNERFLAGS.TLF | CORNERFLAGS.TRF);
                                } else {
                                    vertex.trb.v[CORNERINDEX.BR].free &= ~(CORNERFLAGS.BLF | CORNERFLAGS.BRF);
                                }
                            }

                            for (const boxVertex of box.v) {
                                if (!boxVertex.used) {
                                    boxVertex.used = true;

                                    if (usePackBias) {
                                        boxVertex.updateBias();
                                    }

                                    vertexPackIndices.push(boxVertex.index);
                                }
                            }

                            box.x = box.xmin_get();
                            box.y = box.ymin_get();
                        }
                    }
                }
            }
        }

        // BoxPacker.debugFitAABB(boxes, tot.x, tot.y);

        return {
            w: tot.x,
            h: tot.y,
            fill: 1
        };
    }

    static debugFitAABB(boxes: BoxBlender[], w: number, h: number) {
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        const width = 900;
        const height = 900;

        document.body.appendChild(canvas);
        canvas.width = width;
        canvas.height = height;
        canvas.style.position = "absolute";
        canvas.style.zIndex = "10";
        canvas.style.top = "0px";
        canvas.style.left = "0px";
        canvas.onclick = () => {
            canvas.style.display = "none";
        };

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        ctx.scale(width, height);
        ctx.lineWidth = 0.001;

        for (const box of boxes) {
            ctx.beginPath();
            ctx.moveTo((box.x / w), (box.y / h));

            ctx.lineTo(((box.x + box.w) / w), (box.y / h));
            ctx.moveTo(((box.x + box.w) / w), (box.y / h));

            ctx.lineTo(((box.x + box.w) / w), ((box.y + box.h) / h));
            ctx.moveTo(((box.x + box.w) / w), ((box.y + box.h) / h));

            ctx.lineTo((box.x / w), ((box.y + box.h) / h));
            ctx.moveTo((box.x / w), ((box.y + box.h) / h));

            ctx.lineTo((box.x / w), (box.y / h));
            ctx.closePath();

            ctx.strokeStyle = "green";
            ctx.stroke();
        }
    }
}

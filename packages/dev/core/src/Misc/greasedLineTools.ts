import { Curve3 } from "../Maths/math.path";
import { VertexBuffer } from "../Buffers/buffer";
import { TmpVectors, Vector3 } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { IFontData } from "../Meshes/Builders/textBuilder";
import { CreateTextShapePaths } from "../Meshes/Builders/textBuilder";
import type { FloatArray, IndicesArray } from "../types";
import type { GreasedLinePoints } from "../Meshes/GreasedLine/greasedLineBaseMesh";
import type { Color3 } from "../Maths/math.color";
import { RawTexture } from "../Materials/Textures/rawTexture";
import type { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { GreasedLineMaterialDefaults } from "../Materials/GreasedLine/greasedLineMaterialDefaults";

/**
 * Tool functions for GreasedLine
 */
export class GreasedLineTools {
    /**
     * Converts GreasedLinePoints to number[][]
     * @param points GreasedLinePoints
     * @returns number[][] with x, y, z coordinates of the points, like [[x, y, z, x, y, z, ...], [x, y, z, ...]]
     */
    public static ConvertPoints(points: GreasedLinePoints): number[][] {
        if (points.length && Array.isArray(points) && typeof points[0] === "number") {
            return [<number[]>points];
        } else if (points.length && Array.isArray(points[0]) && typeof points[0][0] === "number") {
            return <number[][]>points;
        } else if (points.length && !Array.isArray(points[0]) && points[0] instanceof Vector3) {
            const positions: number[] = [];
            for (let j = 0; j < points.length; j++) {
                const p = points[j] as Vector3;
                positions.push(p.x, p.y, p.z);
            }
            return [positions];
        } else if (points.length > 0 && Array.isArray(points[0]) && points[0].length > 0 && points[0][0] instanceof Vector3) {
            const positions: number[][] = [];
            const vectorPoints = points as Vector3[][];
            vectorPoints.forEach((p) => {
                positions.push(p.flatMap((p2) => [p2.x, p2.y, p2.z]));
            });
            return positions;
        } else if (points instanceof Float32Array) {
            return [Array.from(points)];
        } else if (points.length && points[0] instanceof Float32Array) {
            const positions: number[][] = [];
            points.forEach((p) => {
                positions.push(Array.from(p as Float32Array));
            });
            return positions;
        }

        return [];
    }

    /**
     * Omit zero length lines predicate for the MeshesToLines function
     * @param p1 point1 position of the face
     * @param p2 point2 position of the face
     * @param p3 point3 position of the face
     * @returns original points or null if any edge length is zero
     */
    public static OmitZeroLengthPredicate(p1: Vector3, p2: Vector3, p3: Vector3) {
        const fileredPoints = [];
        // edge1
        if (p2.subtract(p1).lengthSquared() > 0) {
            fileredPoints.push([p1, p2]);
        }
        // edge2
        if (p3.subtract(p2).lengthSquared() > 0) {
            fileredPoints.push([p2, p3]);
        }
        // edge3
        if (p1.subtract(p3).lengthSquared() > 0) {
            fileredPoints.push([p3, p1]);
        }
        return fileredPoints.length === 0 ? null : fileredPoints;
    }

    /**
     * Omit duplicate lines predicate for the MeshesToLines function
     * @param p1 point1 position of the face
     * @param p2 point2 position of the face
     * @param p3 point3 position of the face
     * @param points array of points to search in
     * @returns original points or null if any edge length is zero
     */
    public static OmitDuplicatesPredicate(p1: Vector3, p2: Vector3, p3: Vector3, points: Vector3[][]) {
        const fileredPoints = [];
        // edge1
        if (!GreasedLineTools._SearchInPoints(p1, p2, points)) {
            fileredPoints.push([p1, p2]);
        }
        // edge2
        if (!GreasedLineTools._SearchInPoints(p2, p3, points)) {
            fileredPoints.push([p2, p3]);
        }
        // edge3
        if (!GreasedLineTools._SearchInPoints(p3, p1, points)) {
            fileredPoints.push([p3, p1]);
        }
        return fileredPoints.length === 0 ? null : fileredPoints;
    }

    private static _SearchInPoints(p1: Vector3, p2: Vector3, points: Vector3[][]) {
        for (const ps of points) {
            for (let i = 0; i < ps.length; i++) {
                if (ps[i]?.equals(p1)) {
                    // find the first point
                    // if it has a sibling of p2 the line already exists
                    if (ps[i + 1]?.equals(p2) || ps[i - 1]?.equals(p2)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Gets mesh triangles as line positions
     * @param meshes array of meshes
     * @param predicate predicate function which decides whether to include the mesh triangle/face in the ouput
     * @returns array of arrays of points
     */
    public static MeshesToLines(
        meshes: AbstractMesh[],
        predicate?: (
            p1: Vector3,
            p2: Vector3,
            p3: Vector3,
            points: Vector3[][],
            indiceIndex: number,
            vertexIndex: number,
            mesh: AbstractMesh,
            meshIndex: number,
            vertices: FloatArray,
            indices: IndicesArray
        ) => Vector3[][]
    ) {
        const points: Vector3[][] = [];

        meshes.forEach((m, meshIndex) => {
            const vertices = m.getVerticesData(VertexBuffer.PositionKind);
            const indices = m.getIndices();
            if (vertices && indices) {
                for (let i = 0, ii = 0; i < indices.length; i++) {
                    const vi1 = indices[ii++] * 3;
                    const vi2 = indices[ii++] * 3;
                    const vi3 = indices[ii++] * 3;

                    const p1 = new Vector3(vertices[vi1], vertices[vi1 + 1], vertices[vi1 + 2]);
                    const p2 = new Vector3(vertices[vi2], vertices[vi2 + 1], vertices[vi2 + 2]);
                    const p3 = new Vector3(vertices[vi3], vertices[vi3 + 1], vertices[vi3 + 2]);

                    if (predicate) {
                        const pointsFromPredicate = predicate(p1, p2, p3, points, i, vi1, m, meshIndex, vertices, indices);
                        if (pointsFromPredicate) {
                            for (const p of pointsFromPredicate) {
                                points.push(p);
                            }
                        }
                    } else {
                        points.push([p1, p2], [p2, p3], [p3, p1]);
                    }
                }
            }
        });

        return points;
    }

    /**
     * Converts number coordinates to Vector3s
     * @param points number array of x, y, z, x, y z, ... coordinates
     * @returns Vector3 array
     */
    public static ToVector3Array(points: number[] | number[][]) {
        if (Array.isArray(points[0])) {
            const array: Vector3[][] = [];
            const inputArray = points as number[][];
            for (const subInputArray of inputArray) {
                const subArray: Vector3[] = [];
                for (let i = 0; i < subInputArray.length; i += 3) {
                    subArray.push(new Vector3(subInputArray[i], subInputArray[i + 1], subInputArray[i + 2]));
                }
                array.push(subArray);
            }
            return array;
        }

        const inputArray = points as number[];
        const array: Vector3[] = [];
        for (let i = 0; i < inputArray.length; i += 3) {
            array.push(new Vector3(inputArray[i], inputArray[i + 1], inputArray[i + 2]));
        }
        return array;
    }

    /**
     * Gets a number array from a Vector3 array.
     * You can you for example to convert your Vector3[] offsets to the required number[] for the offsets option.
     * @param points Vector3 array
     * @returns an array of x, y, z coordinates as numbers [x, y, z, x, y, z, x, y, z, ....]
     */
    public static ToNumberArray(points: Vector3[]) {
        return points.flatMap((v) => [v.x, v.y, v.z]);
    }

    /**
     * Calculates the sum of points of every line and the number of points in each line.
     * This function is useful when you are drawing multiple lines in one mesh and you want
     * to know the counts. For example for creating an offsets table.
     * @param points point array
     * @returns points count info
     */
    public static GetPointsCountInfo(points: number[][]): { total: number; counts: number[] } {
        const counts = new Array(points.length);
        let total = 0;
        for (let n = points.length; n--; ) {
            counts[n] = points[n].length / 3;
            total += counts[n];
        }
        return { total, counts };
    }

    /**
     * Gets the length of the line counting all it's segments length
     * @param data array of line points
     * @returns length of the line
     */
    public static GetLineLength(data: Vector3[] | number[]): number {
        if (data.length === 0) {
            return 0;
        }

        let points: Vector3[];
        if (typeof data[0] === "number") {
            points = GreasedLineTools.ToVector3Array(<number[]>data) as Vector3[];
        } else {
            points = data as Vector3[];
        }

        const tmp = TmpVectors.Vector3[0];
        let length = 0;
        for (let index = 0; index < points.length - 1; index++) {
            const point1 = points[index];
            const point2 = points[index + 1];
            length += point2.subtractToRef(point1, tmp).length();
        }
        return length;
    }

    /**
     * Divides a segment into smaller segments.
     * A segment is a part of the line between it's two points.
     * @param point1 first point of the line
     * @param point2 second point of the line
     * @param segmentCount number of segments we want to have in the divided line
     * @returns
     */
    public static SegmentizeSegmentByCount(point1: Vector3, point2: Vector3, segmentCount: number): Vector3[] {
        const dividedLinePoints: Vector3[] = [];
        const diff = point2.subtract(point1);
        const divisor = TmpVectors.Vector3[0];
        divisor.setAll(segmentCount);
        const segmentVector = TmpVectors.Vector3[1];
        diff.divideToRef(divisor, segmentVector);

        let nextPoint = point1.clone();
        dividedLinePoints.push(nextPoint);
        for (let index = 0; index < segmentCount; index++) {
            nextPoint = nextPoint.clone();
            dividedLinePoints.push(nextPoint.addInPlace(segmentVector));
        }

        return dividedLinePoints;
    }

    /**
     * Divides a line into segments.
     * A segment is a part of the line between it's two points.
     * @param what line points
     * @param segmentLength length of each segment of the resulting line (distance between two line points)
     * @returns line point
     */
    public static SegmentizeLineBySegmentLength(what: Vector3[] | number[] | { point1: Vector3; point2: Vector3; length: number }[], segmentLength: number): Vector3[] {
        const subLines =
            what[0] instanceof Vector3
                ? GreasedLineTools.GetLineSegments(what as Vector3[])
                : typeof what[0] === "number"
                  ? GreasedLineTools.GetLineSegments(GreasedLineTools.ToVector3Array(what as number[]) as Vector3[])
                  : (what as { point1: Vector3; point2: Vector3; length: number }[]);
        const points: Vector3[] = [];
        subLines.forEach((s) => {
            if (s.length > segmentLength) {
                const segments = GreasedLineTools.SegmentizeSegmentByCount(s.point1, s.point2, Math.ceil(s.length / segmentLength));
                segments.forEach((seg) => {
                    points.push(seg);
                });
            } else {
                points.push(s.point1);
                points.push(s.point2);
            }
        });
        return points;
    }

    /**
     * Divides a line into segments.
     * A segment is a part of the line between it's two points.
     * @param what line points
     * @param segmentCount number of segments
     * @returns line point
     */
    public static SegmentizeLineBySegmentCount(what: Vector3[] | number[], segmentCount: number): Vector3[] {
        const points = <Vector3[]>(typeof what[0] === "number" ? GreasedLineTools.ToVector3Array(<number[]>what) : what);
        const segmentLength = GreasedLineTools.GetLineLength(points) / segmentCount;
        return GreasedLineTools.SegmentizeLineBySegmentLength(points, segmentLength);
    }
    /**
     * Gets line segments.
     * A segment is a part of the line between it's two points.
     * @param points line points
     * @returns segments information of the line segment including starting point, ending point and the distance between them
     */
    public static GetLineSegments(points: Vector3[]): { point1: Vector3; point2: Vector3; length: number }[] {
        const segments = [];
        for (let index = 0; index < points.length - 1; index++) {
            const point1 = points[index];
            const point2 = points[index + 1];
            const length = point2.subtract(point1).length();
            segments.push({ point1, point2, length });
        }

        return segments;
    }

    /**
     * Gets the minimum and the maximum length of a line segment in the line.
     * A segment is a part of the line between it's two points.
     * @param points line points
     * @returns
     */
    public static GetMinMaxSegmentLength(points: Vector3[]): { min: number; max: number } {
        const subLines = GreasedLineTools.GetLineSegments(points);
        const sorted = subLines.sort((s) => s.length);
        return {
            min: sorted[0].length,
            max: sorted[sorted.length - 1].length,
        };
    }

    /**
     * Finds the last visible position in world space of the line according to the visibility parameter
     * @param lineSegments segments of the line
     * @param lineLength total length of the line
     * @param visbility normalized value of visibility
     * @param localSpace if true the result will be in local space (default is false)
     * @returns world space coordinate of the last visible piece of the line
     */
    public static GetPositionOnLineByVisibility(lineSegments: { point1: Vector3; point2: Vector3; length: number }[], lineLength: number, visbility: number, localSpace = false) {
        const lengthVisibilityRatio = lineLength * visbility;
        let sumSegmentLengths = 0;
        let segmentIndex = 0;

        const lineSegmentsLength = lineSegments.length;
        for (let i = 0; i < lineSegmentsLength; i++) {
            if (lengthVisibilityRatio <= sumSegmentLengths + lineSegments[i].length) {
                segmentIndex = i;
                break;
            }
            sumSegmentLengths += lineSegments[i].length;
        }

        const s = (lengthVisibilityRatio - sumSegmentLengths) / lineSegments[segmentIndex].length;

        lineSegments[segmentIndex].point2.subtractToRef(lineSegments[segmentIndex].point1, TmpVectors.Vector3[0]);
        TmpVectors.Vector3[1] = TmpVectors.Vector3[0].multiplyByFloats(s, s, s);
        if (!localSpace) {
            TmpVectors.Vector3[1].addInPlace(lineSegments[segmentIndex].point1);
        }

        return TmpVectors.Vector3[1].clone();
    }

    /**
     * Creates lines in a shape of circle/arc.
     * A segment is a part of the line between it's two points.
     * @param radiusX radiusX of the circle
     * @param segments number of segments in the circle
     * @param z z coordinate of the points. Defaults to 0.
     * @param radiusY radiusY of the circle - you can draw an oval if using different values
     * @param segmentAngle angle offset of the segments. Defaults to Math.PI * 2 / segments. Change this value to draw a part of the circle.
     * @returns line points
     */
    public static GetCircleLinePoints(radiusX: number, segments: number, z = 0, radiusY = radiusX, segmentAngle = (Math.PI * 2) / segments) {
        const points: Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            points.push(new Vector3(Math.cos(i * segmentAngle) * radiusX, Math.sin(i * segmentAngle) * radiusY, z));
        }
        return points;
    }

    /**
     * Gets line points in a shape of a bezier curve
     * @param p0 bezier point0
     * @param p1 bezier point1
     * @param p2 bezier point2
     * @param segments number of segments in the curve
     * @returns
     */
    public static GetBezierLinePoints(p0: Vector3, p1: Vector3, p2: Vector3, segments: number) {
        return Curve3.CreateQuadraticBezier(p0, p1, p2, segments)
            .getPoints()
            .flatMap((v) => [v.x, v.y, v.z]);
    }

    /**
     *
     * @param position position of the arrow cap (mainly you want to create a triangle, set widthUp and widthDown to the same value and omit widthStartUp and widthStartDown)
     * @param direction direction which the arrow points to
     * @param length length (size) of the arrow cap itself
     * @param widthUp the arrow width above the line
     * @param widthDown the arrow width belove the line
     * @param widthStartUp the arrow width at the start of the arrow above the line. In most scenarios this is 0.
     * @param widthStartDown the arrow width at the start of the arrow below the line. In most scenarios this is 0.
     * @returns
     */
    public static GetArrowCap(position: Vector3, direction: Vector3, length: number, widthUp: number, widthDown: number, widthStartUp = 0, widthStartDown = 0) {
        const points = [position.clone(), position.add(direction.multiplyByFloats(length, length, length))];
        const widths = [widthUp, widthDown, widthStartUp, widthStartDown];

        return {
            points,
            widths,
        };
    }

    /**
     * Gets 3D positions of points from a text and font
     * @param text Text
     * @param size Size of the font
     * @param resolution Resolution of the font
     * @param fontData defines the font data (can be generated with http://gero3.github.io/facetype.js/)
     * @param z z coordinate
     * @param includeInner include the inner parts of the font in the result. Default true. If false, only the outlines will be returned.
     * @returns number[][] of 3D positions
     */
    public static GetPointsFromText(text: string, size: number, resolution: number, fontData: IFontData, z = 0, includeInner = true) {
        const allPoints = [];
        const shapePaths = CreateTextShapePaths(text, size, resolution, fontData);

        for (const sp of shapePaths) {
            for (const p of sp.paths) {
                const points = [];
                const points2d = p.getPoints();
                for (const p2d of points2d) {
                    points.push(p2d.x, p2d.y, z);
                }
                allPoints.push(points);
            }

            if (includeInner) {
                for (const h of sp.holes) {
                    const holes = [];
                    const points2d = h.getPoints();
                    for (const p2d of points2d) {
                        holes.push(p2d.x, p2d.y, z);
                    }
                    allPoints.push(holes);
                }
            }
        }

        return allPoints;
    }

    /**
     * Converts an array of Color3 to Uint8Array
     * @param colors Arrray of Color3
     * @returns Uin8Array of colors [r, g, b, a, r, g, b, a, ...]
     */
    public static Color3toRGBAUint8(colors: Color3[]) {
        const colorTable: Uint8Array = new Uint8Array(colors.length * 4);
        for (let i = 0, j = 0; i < colors.length; i++) {
            colorTable[j++] = colors[i].r * 255;
            colorTable[j++] = colors[i].g * 255;
            colorTable[j++] = colors[i].b * 255;
            colorTable[j++] = 255;
        }

        return colorTable;
    }

    /**
     * Creates a RawTexture from an RGBA color array and sets it on the plugin material instance.
     * @param name name of the texture
     * @param colors Uint8Array of colors
     * @param colorsSampling sampling mode of the created texture
     * @param scene Scene
     * @returns the colors texture
     */
    public static CreateColorsTexture(name: string, colors: Color3[], colorsSampling: number, scene: Scene) {
        const colorsArray = GreasedLineTools.Color3toRGBAUint8(colors);
        const colorsTexture = new RawTexture(colorsArray, colors.length, 1, Engine.TEXTUREFORMAT_RGBA, scene, false, true, colorsSampling);
        colorsTexture.name = name;
        return colorsTexture;
    }

    /**
     * A minimum size texture for the colors sampler2D when there is no colors texture defined yet.
     * For fast switching using the useColors property without the need to use defines.
     * @param scene Scene
     * @returns empty colors texture
     */
    public static PrepareEmptyColorsTexture(scene: Scene) {
        if (!GreasedLineMaterialDefaults.EmptyColorsTexture) {
            const colorsArray = new Uint8Array(4);
            GreasedLineMaterialDefaults.EmptyColorsTexture = new RawTexture(colorsArray, 1, 1, Engine.TEXTUREFORMAT_RGBA, scene, false, false, RawTexture.NEAREST_NEAREST);
            GreasedLineMaterialDefaults.EmptyColorsTexture.name = "grlEmptyColorsTexture";
        }

        return GreasedLineMaterialDefaults.EmptyColorsTexture;
    }

    /**
     * Diposes the shared empty colors texture
     */
    public static DisposeEmptyColorsTexture() {
        GreasedLineMaterialDefaults.EmptyColorsTexture?.dispose();
        GreasedLineMaterialDefaults.EmptyColorsTexture = null;
    }

    /**
     * Converts boolean to number.
     * @param bool the bool value
     * @returns 1 if true, 0 if false.
     */
    public static BooleanToNumber(bool?: boolean) {
        return bool ? 1 : 0;
    }
}

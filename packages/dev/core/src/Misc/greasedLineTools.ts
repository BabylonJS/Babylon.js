import { Curve3 } from "../Maths/math.path";
import { VertexBuffer } from "../Buffers/buffer";
import { TmpVectors, Vector3 } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { IFontData } from "core/Meshes/Builders/textBuilder";
import { CreateTextShapePaths } from "core/Meshes/Builders/textBuilder";

/**
 * Tool functions for GreasedLine
 */
export class GreasedLineTools {
    /**
     * Gets mesh triangles as line positions
     * @param meshes array of meshes
     * @param omitZeroLengthLines do not generate a line when the distance if the vertices in the triangle equals to zero
     * @returns array of arrays of points
     */
    public static MeshesToLines(meshes: AbstractMesh[], omitZeroLengthLines = true) {
        const points: Vector3[][] = [];

        meshes.forEach((m) => {
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

                    if (omitZeroLengthLines && p1.lengthSquared() + p2.lengthSquared() + p3.lengthSquared() === 0) {
                        continue;
                    }
                    points.push([p1, p2, p3, p1]);
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
    public static ToVector3Array(points: number[]) {
        const array: Vector3[] = [];
        for (let i = 0; i < points.length; i += 3) {
            array.push(new Vector3(points[i], points[i + 1], points[i + 2]));
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
            points = GreasedLineTools.ToVector3Array(<number[]>data);
        } else {
            points = <Vector3[]>data;
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
        const subLines = what[0] instanceof Vector3 ? GreasedLineTools.GetLineSegments(what as Vector3[]) : (what as { point1: Vector3; point2: Vector3; length: number }[]);
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
    public static SegmentizeLineBySegmentCount(what: Vector3[], segmentCount: number): Vector3[] {
        const segmentLength = GreasedLineTools.GetLineLength(what) / segmentCount;
        return GreasedLineTools.SegmentizeLineBySegmentLength(what, segmentLength);
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
     * @returns number[] of 3D positions
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
}

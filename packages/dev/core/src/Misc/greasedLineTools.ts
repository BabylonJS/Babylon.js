import { VertexBuffer } from "./../Buffers/buffer";
import { Vector3 } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";

export namespace GreasedLineTools {
    export function MeshesToLines(meshes: AbstractMesh[], omitZeroLengthLines = true) {
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

                    if (omitZeroLengthLines && p1.length() + p2.length() + p3.length() === 0) {
                        continue;
                    }
                    points.push([p1, p2, p3, p1]);
                }
            }
        });

        return points;
    }

    export function GetLineLength(points: Vector3[]): number {
        let length = 0;
        for (let index = 0; index < points.length - 1; index++) {
            const point1 = points[index];
            const point2 = points[index + 1];
            length += point2.subtract(point1).length();
        }
        return length;
    }

    export function DivideLine(point1: Vector3, point2: Vector3, segmentCount: number): Vector3[] {
        const dividedLinePoints: Vector3[] = [];
        const diff = point2.subtract(point1);
        const segmentVector = diff.divide(new Vector3(segmentCount, segmentCount, segmentCount));

        let nextPoint = point1.clone();
        dividedLinePoints.push(nextPoint);
        for (let index = 0; index < segmentCount; index++) {
            nextPoint = nextPoint.clone();
            dividedLinePoints.push(nextPoint.addInPlace(segmentVector));
        }

        return dividedLinePoints;
    }

    export function GetSubLines(points: Vector3[]): { point1: Vector3; point2: Vector3; length: number }[] {
        const subLines = [];
        for (let index = 0; index < points.length - 1; index++) {
            const point1 = points[index];
            const point2 = points[index + 1];
            const length = point2.subtract(point1).length();
            subLines.push({ point1, point2, length });
        }

        return subLines;
    }

    export function GetMinMaxSubLineLength(points: Vector3[]): { min: number; max: number } {
        const subLines = GetSubLines(points);
        const sorted = subLines.sort((s) => s.length);
        return {
            min: sorted[0].length,
            max: sorted[sorted.length - 1].length,
        };
    }

    export function segmentize(what: Vector3[] | { point1: Vector3; point2: Vector3; length: number }[], segmentLength: number): Vector3[] {
        const subLines = what[0] instanceof Vector3 ? GetSubLines(what as Vector3[]) : (what as { point1: Vector3; point2: Vector3; length: number }[]);
        const points: Vector3[] = [];
        subLines.forEach((s) => {
            if (s.length > segmentLength) {
                const segments = DivideLine(s.point1, s.point2, Math.ceil(s.length / segmentLength));
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

    export function Circle(radius: number, segments: number, segmentAngle?: number, z = 0) {
        const points: Vector3[] = [];
        const add = segmentAngle ?? (Math.PI * 2) / segments;
        for (let i = 0; i <= segments; i++) {
            points.push(new Vector3(Math.cos(i * add) * radius, Math.sin(i * add) * radius, z));
        }
        return points;
    }

    export function bezier(p0: Vector3, p1: Vector3, p2: Vector3, segments: number) {
        const points: number[] = [];

        for (let i = 0; i < segments; i++) {
            const point = GetBezierPoint(i / segments, p0, p1, p2);
            points.push(point.x, point.y, point.z);
        }

        return points;
    }

    export function GetBezierPoint(percent: number, p0: Vector3, p1: Vector3, p2: Vector3) {
        const a0 = (1 - percent) ** 2,
            a1 = 2 * percent * (1 - percent),
            a2 = percent ** 2;
        return {
            x: a0 * p0.x + a1 * p1.x + a2 * p2.x,
            y: a0 * p0.y + a1 * p1.y + a2 * p2.y,
            z: a0 * p0.z + a1 * p1.z + a2 * p2.z,
        };
    }

    export function GetArrowCap(position: Vector3, direction: Vector3, length: number, widthUp: number, widthDown: number, widthStartUp = 0, widthStartDown = 0) {
        const points = [position.clone(), position.add(direction.multiplyByFloats(length, length, length))];
        const widths = [widthUp, widthDown, widthStartUp, widthStartDown];

        return {
            points,
            widths,
        };
    }

    export function GetCircleCap(position: Vector3, direction: Vector3, radiusA: number, radiusB: number, segments: number) {
        const points: Vector3[] = [];
        const widths: number[] = [];

        const segmentLength = (radiusA * 4) / segments;
        for (let i = 0, j = 0; i < segments + 1; i++, j += Math.PI / segments / 2) {
            const s = segmentLength * Math.cos(j);
            console.log(s);
            const p = position.add(direction.multiplyByFloats(s, s, s));
            points.push(p.clone());
            const w = Math.ceil(radiusB * Math.sin(j)) + radiusB;
            widths.push(w, w);
        }

        return {
            points,
            widths,
        };
    }
}

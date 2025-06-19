/* eslint-disable jsdoc/require-jsdoc */
import { Vector2 } from "core/Maths";
import type { RawBezier, RawGroupShape, RawPathShape, RawRectangleShape } from "./types/rawLottie";

export type BoundingBox = {
    height: number;
    width: number;
    centerX: number;
    centerY: number;
};

export function GetBoundingBox(rawGroup: RawGroupShape): BoundingBox {
    const vertices: Vector2[] = [];
    for (const shape of rawGroup.it || []) {
        if (shape.ty == "rc") {
            GetRectangleVertices(vertices, shape as RawRectangleShape);
        }

        if (shape.ty == "sh") {
            GetPathVertices(vertices, shape as RawPathShape);
        }
    }

    return GetBoundingBoxFromVertices(vertices);
}

function GetRectangleVertices(vertices: Vector2[], rect: RawRectangleShape): void {
    const size = rect.s.k as number[];
    const position = rect.p.k as number[];

    // Calculate the four corners of the rectangle
    vertices.push(new Vector2(position[0] - size[0] / 2, position[1] - size[1] / 2));
    vertices.push(new Vector2(position[0] + size[0] / 2, position[1] - size[1] / 2));
    vertices.push(new Vector2(position[0] + size[0] / 2, position[1] + size[1] / 2));
    vertices.push(new Vector2(position[0] - size[0] / 2, position[1] + size[1] / 2));
}

function GetPathVertices(boxVertices: Vector2[], path: RawPathShape): void {
    const bezier = path.ks.k as RawBezier;
    const vertices = bezier.v;
    const inTangents = bezier.i;
    const outTangents = bezier.o;

    for (const vertex of vertices) {
        boxVertices.push(new Vector2(vertex[0], vertex[1]));
    }

    for (let i = 0; i < vertices.length - 1; i++) {
        const start = vertices[i];
        const end = vertices[i + 1];
        const outTangent = outTangents[i];
        const inTangent = inTangents[i + 1];

        boxVertices.push(
            ...CalculateTangentZeroPoints(start[0], start[1], end[0], end[1], start[0] + outTangent[0], start[1] + outTangent[1], end[0] + inTangent[0], end[1] + inTangent[1])
        );
    }
}

function CalculateTangentZeroPoints(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    controlPoint1X: number,
    controlPoint1Y: number,
    controlPoint2X: number,
    controlPoint2Y: number
): Vector2[] {
    const tangentZeroPoints: Vector2[] = [];

    // Calculate the derivative of the bezier formula for X and Y components
    // For X component:
    const ax = 3 * (endX - 3 * controlPoint2X + 3 * controlPoint1X - startX);
    const bx = 6 * (controlPoint2X - 2 * controlPoint1X + startX);
    const cx = 3 * (controlPoint1X - startX);

    // For Y component:
    const ay = 3 * (endY - 3 * controlPoint2Y + 3 * controlPoint1Y - startY);
    const by = 6 * (controlPoint2Y - 2 * controlPoint1Y + startY);
    const cy = 3 * (controlPoint1Y - startY);

    // Solve the quadratic equation where dt/dt = 0 (tangent is zero)
    const rootsX = SolveCuadratic(ax, bx, cx);
    const rootsY = SolveCuadratic(ay, by, cy);

    // Evaluate the bezier at the calculated t values to find the points of the curve where the tangent is zero
    const allTs = new Set<number>(rootsX.concat(rootsY));
    for (const t of allTs) {
        // Only the values of t in the range [0, 1] are inside the bezier curve segment
        if (t >= 0 && t <= 1) {
            const u = 1 - t;
            const u2 = u * u;
            const u3 = u2 * u;
            const t2 = t * t;
            const t3 = t2 * t;

            const x = u3 * startX + 3 * u2 * t * controlPoint1X + 3 * u * t2 * controlPoint2X + t3 * endX;
            const y = u3 * startY + 3 * u2 * t * controlPoint1Y + 3 * u * t2 * controlPoint2Y + t3 * endY;
            tangentZeroPoints.push(new Vector2(x, y));
        }
    }

    return tangentZeroPoints;
}

function SolveCuadratic(a: number, b: number, c: number): number[] {
    const roots: number[] = [];

    // Handle the case where a is zero (linear equation)
    // Linear equation: bx + c = 0 => x = -c / b
    if (Math.abs(a) < 1e-10) {
        if (Math.abs(b) > 1e-10) {
            const root = -c / b;
            roots.push(root);
        }

        return roots;
    }

    // Solve the quadratic equation ax^2 + bx + c = 0
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
        return roots; // No real roots
    }

    if (Math.abs(discriminant) < 1e-10) {
        const root = -b / (2 * a);
        roots.push(root);
    } else {
        const sqrtD = Math.sqrt(discriminant);
        const root1 = (-b + sqrtD) / (2 * a);
        const root2 = (-b - sqrtD) / (2 * a);
        roots.push(root1);
        roots.push(root2);
    }

    return roots;
}

function GetBoundingBoxFromVertices(vertices: Vector2[]): BoundingBox {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const vertex of vertices) {
        minX = Math.min(minX, vertex.x);
        minY = Math.min(minY, vertex.y);
        maxX = Math.max(maxX, vertex.x);
        maxY = Math.max(maxY, vertex.y);
    }

    return {
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
    };
}

import type { RawBezier, RawGroupShape, RawPathShape, RawRectangleShape } from "../lottie/rawTypes";

/**
 * Represents a bounding box for a shape in the animation.
 */
export type BoundingBox = {
    /**
     * Height of the bounding box
     */
    height: number;
    /**
     * Width of the bounding box
     */
    width: number;
    /**
     * X coordinate of the center of the bounding box
     */
    centerX: number;
    /**
     * Y coordinate of the center of the bounding box
     */
    centerY: number;
};

// Corners of the bounding box
type Corners = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
};

/**
 * Calculates the bounding box for a group shape in a Lottie animation.
 * @param rawGroup The raw group shape to calculate the bounding box for
 * @returns The bounding box for the group shape
 */
export function GetBoundingBox(rawGroup: RawGroupShape): BoundingBox {
    const boxCorners: Corners = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
    };

    if (rawGroup.it !== undefined) {
        for (let i = 0; i < rawGroup.it.length; i++) {
            if (rawGroup.it[i].ty === "rc") {
                GetRectangleVertices(boxCorners, rawGroup.it[i] as RawRectangleShape);
            } else if (rawGroup.it[i].ty === "sh") {
                GetPathVertices(boxCorners, rawGroup.it[i] as RawPathShape);
            }
        }
    }

    return {
        width: Math.ceil(boxCorners.maxX - boxCorners.minX),
        height: Math.ceil(boxCorners.maxY - boxCorners.minY),
        centerX: Math.ceil((boxCorners.maxX + boxCorners.minX) / 2),
        centerY: Math.ceil((boxCorners.maxY + boxCorners.minY) / 2),
    };
}

function GetRectangleVertices(boxCorners: Corners, rect: RawRectangleShape): void {
    const size = rect.s.k as number[];
    const position = rect.p.k as number[];

    // Calculate the four corners of the rectangle
    UpdateBoxCorners(boxCorners, position[0] - size[0] / 2, position[1] - size[1] / 2);
    UpdateBoxCorners(boxCorners, position[0] + size[0] / 2, position[1] - size[1] / 2);
    UpdateBoxCorners(boxCorners, position[0] + size[0] / 2, position[1] + size[1] / 2);
    UpdateBoxCorners(boxCorners, position[0] - size[0] / 2, position[1] + size[1] / 2);
}

function GetPathVertices(boxCorners: Corners, path: RawPathShape): void {
    const bezier = path.ks.k as RawBezier;
    const vertices = bezier.v;
    const inTangents = bezier.i;
    const outTangents = bezier.o;

    // Check the control points of the path
    for (let i = 0; i < vertices.length; i++) {
        UpdateBoxCorners(boxCorners, vertices[i][0], vertices[i][1]);
    }

    for (let i = 0; i < vertices.length; i++) {
        // Skip last point if the path is not closed
        if (!bezier.c && i === vertices.length - 1) {
            continue;
        }

        const start = vertices[i];
        const end = i === vertices.length - 1 ? vertices[0] : vertices[i + 1];
        const outTangent = outTangents[i];
        const inTangent = i === vertices.length - 1 ? inTangents[0] : inTangents[i + 1];

        // Calculate the points where the tangent is zero
        CalculatePointsWithTangentZero(
            boxCorners,
            start[0],
            start[1],
            end[0],
            end[1],
            start[0] + outTangent[0],
            start[1] + outTangent[1],
            end[0] + inTangent[0],
            end[1] + inTangent[1]
        );
    }
}

function CalculatePointsWithTangentZero(
    boxCorners: Corners,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    controlPoint1X: number,
    controlPoint1Y: number,
    controlPoint2X: number,
    controlPoint2Y: number
): void {
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
    const rootsX = SolveQuadratic(ax, bx, cx);
    const rootsY = SolveQuadratic(ay, by, cy);

    // Merge + dedupe (roots arrays are tiny: <=2 each)
    const candidateTs = rootsX.slice(); // copy
    for (let i = 0; i < rootsY.length; i++) {
        const ty = rootsY[i];
        let exists = false;
        for (let j = 0; j < candidateTs.length; j++) {
            if (candidateTs[j] === ty) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            candidateTs.push(ty);
        }
    }

    // Evaluate the bezier at the calculated t values to find the points of the curve where the tangent is zero
    for (let i = 0; i < candidateTs.length; i++) {
        const t = candidateTs[i];
        if (t >= 0 && t <= 1) {
            const x = BezierPoint(t, startX, controlPoint1X, controlPoint2X, endX);
            const y = BezierPoint(t, startY, controlPoint1Y, controlPoint2Y, endY);
            UpdateBoxCorners(boxCorners, x, y);
        }
    }
}

// Alternative implementation for bounding box calculation using sampling of the bezier curve instead of finding points where the tangent is zero.
// function bezierBoundingBoxSampled(boxCorners: Corners, start:IVector2Like, outTangent:IVector2Like, inTangent:IVector2Like, end:IVector2Like) {
//     for (let i = 0; i <= SamplingSteps; i++) {
//         const t = i / SamplingSteps;

//         const x = bezierPoint(t, start.x, outTangent.x, inTangent.x, end.x);
//         const y = bezierPoint(t, start.y, outTangent.y, inTangent.y, end.y);
//         updateBoxCorners(boxCorners, x, y);
//     }
// }

function SolveQuadratic(a: number, b: number, c: number): number[] {
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

function BezierPoint(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function UpdateBoxCorners(boxCorners: Corners, x: number, y: number): void {
    if (x < boxCorners.minX) {
        boxCorners.minX = x;
    }
    if (x > boxCorners.maxX) {
        boxCorners.maxX = x;
    }
    if (y < boxCorners.minY) {
        boxCorners.minY = y;
    }
    if (y > boxCorners.maxY) {
        boxCorners.maxY = y;
    }
}

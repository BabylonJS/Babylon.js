import type { RawBezier, RawElement, RawFont, RawPathShape, RawRectangleShape, RawStrokeShape, RawTextData, RawTextDocument } from "../parsing/rawTypes";

/**
 * Represents a bounding box for a shape in the animation.
 */
export type BoundingBox = {
    /** Height of the bounding box */
    height: number;
    /** Width of the bounding box */
    width: number;
    /** X coordinate of the center of the bounding box */
    centerX: number;
    /** Y coordinate of the center of the bounding box */
    centerY: number;
    /** Box X offset, as the box may not be centered around (0,0) */
    offsetX: number;
    /** Box Y offset, as the box may not be centered around (0,0) */
    offsetY: number;
    /** Inset for the stroke, if applicable. */
    strokeInset: number;
    /** Optional: Canvas2D text metrics for precise vertical alignment */
    actualBoundingBoxAscent?: number;
    /** Optional: Canvas2D text metrics for precise vertical alignment */
    actualBoundingBoxDescent?: number;
};

// Corners of the bounding box
type Corners = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
};

/**
 * Calculates the bounding box for a group of graphic elements in a Lottie animation.
 * @param rawElements The elements to calculate the bounding box for
 * @returns The bounding box for the elements
 */
export function GetShapesBoundingBox(rawElements: RawElement[]): BoundingBox {
    const boxCorners: Corners = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
    };

    let strokeWidth = 0;
    for (let i = 0; i < rawElements.length; i++) {
        if (rawElements[i].ty === "rc") {
            GetRectangleVertices(boxCorners, rawElements[i] as RawRectangleShape);
        } else if (rawElements[i].ty === "sh") {
            GetPathVertices(boxCorners, rawElements[i] as RawPathShape);
        } else if (rawElements[i].ty === "st") {
            strokeWidth = Math.max(strokeWidth, GetStrokeInset(rawElements[i] as RawStrokeShape));
        }
    }

    const width = Math.ceil(Math.abs(boxCorners.maxX)) + Math.ceil(Math.abs(boxCorners.minX));
    const height = Math.ceil(Math.abs(boxCorners.maxY)) + Math.ceil(Math.abs(boxCorners.minY));

    const offsetX = (Math.abs(boxCorners.maxX) - Math.abs(boxCorners.minX)) / 2;
    const offsetY = (Math.abs(boxCorners.maxY) - Math.abs(boxCorners.minY)) / 2;

    return {
        width: width + strokeWidth,
        height: height + strokeWidth,
        // The center of the box is the center of its width and height, modified by its offset and the stroke width
        centerX: width / 2 - offsetX + strokeWidth / 2,
        centerY: height / 2 - offsetY + strokeWidth / 2,
        offsetX: offsetX,
        offsetY: offsetY,
        strokeInset: 0,
    };
}

/**
 * Calculates the bounding box for a group of graphic elements in a Lottie animation.
 * @param spritesCanvasContext The OffscreenCanvasRenderingContext2D or CanvasRenderingContext2D to use for text measurement
 * @param textData The text to calculate the bounding box for
 * @param rawFonts A map of font names to their raw font data
 * @param variables A map of variables to be used in the animation as text can be a variable which will affect its length
 * @returns The bounding box for the text
 */
export function GetTextBoundingBox(
    spritesCanvasContext: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    textData: RawTextData,
    rawFonts: Map<string, RawFont>,
    variables: Map<string, string>
): BoundingBox | undefined {
    spritesCanvasContext.save();
    let textInfo: RawTextDocument | undefined = undefined;
    if (textData.d && textData.d.k && textData.d.k.length > 0) {
        textInfo = textData.d.k[0].s as RawTextDocument;
    }

    if (!textInfo) {
        spritesCanvasContext.restore();
        return undefined;
    }

    const fontSize = textInfo.s;
    const fontFamily = textInfo.f;
    const finalFont = rawFonts.get(fontFamily);
    if (!finalFont) {
        spritesCanvasContext.restore();
        return undefined;
    }

    const weight = finalFont.fWeight || "400"; // Default to normal weight if not specified
    spritesCanvasContext.font = `${weight} ${fontSize}px ${finalFont.fFamily}`;

    if (textInfo.sc !== undefined && textInfo.sc.length >= 3 && textInfo.sw !== undefined && textInfo.sw > 0) {
        spritesCanvasContext.lineWidth = textInfo.sw;
    }

    // Text is supported as a possible variable (for localization for example)
    // Check if the text is a variable and replace it if it is
    let text = textInfo.t;
    const variableText = variables.get(text);
    if (variableText !== undefined) {
        text = variableText;
    }
    const metrics = spritesCanvasContext.measureText(text);

    const widthPx = Math.ceil(metrics.width);
    const heightPx = Math.ceil(metrics.actualBoundingBoxAscent) + Math.ceil(metrics.actualBoundingBoxDescent);

    return {
        width: widthPx,
        height: heightPx,
        centerX: widthPx / 2,
        centerY: heightPx / 2,
        offsetX: 0, // The bounding box calculated by the canvas for the text is always centered in (0, 0)
        offsetY: 0, // The bounding box calculated by the canvas for the text is always centered in (0, 0)
        strokeInset: 0, // Text bounding box ignores stroke padding here
        actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
        actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
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

function GetStrokeInset(stroke: RawStrokeShape): number {
    return Math.ceil(stroke.w?.k as number) ?? 1;
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

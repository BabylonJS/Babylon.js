// Geometry: morph a path's bezier contour into a flat screen-space polyline.
// Cubic segments are adaptively subdivided (de Casteljau) until flat to ~0.25px.

import { type IShapeData } from "./lottieRaw";
import { type Mat2D, TransformPoint } from "./matrix2D";

const Flatness = 0.25; // px
const MaxDepth = 14;
const TransformedStart: [number, number] = [0, 0];
const P0: [number, number] = [0, 0];
const P1: [number, number] = [0, 0];
const P2: [number, number] = [0, 0];
const P3: [number, number] = [0, 0];

function FlattenCubic(p0x: number, p0y: number, p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number, out: number[], depth: number): void {
    // Flatness = summed perpendicular deviation of control points from the chord p0->p3.
    // The squared cross-product form breaks down when the chord length is ~0 (cusps and
    // closed loops produced by the morph), so fall back to an absolute control-arm test
    // there — otherwise such segments recurse to MaxDepth and blow up the vertex count.
    const dx = p3x - p0x;
    const dy = p3y - p0y;
    const chord2 = dx * dx + dy * dy;
    let flat: boolean;
    if (chord2 > 1e-6) {
        const d1 = Math.abs((p1x - p3x) * dy - (p1y - p3y) * dx);
        const d2 = Math.abs((p2x - p3x) * dy - (p2y - p3y) * dx);
        flat = (d1 + d2) * (d1 + d2) <= Flatness * Flatness * chord2;
    } else {
        const a1 = (p1x - p0x) * (p1x - p0x) + (p1y - p0y) * (p1y - p0y);
        const a2 = (p2x - p0x) * (p2x - p0x) + (p2y - p0y) * (p2y - p0y);
        flat = a1 <= Flatness * Flatness && a2 <= Flatness * Flatness;
    }
    if (depth >= MaxDepth || flat) {
        out.push(p3x, p3y);
        return;
    }
    // Subdivide at t = 0.5.
    const p01x = (p0x + p1x) * 0.5;
    const p01y = (p0y + p1y) * 0.5;
    const p12x = (p1x + p2x) * 0.5;
    const p12y = (p1y + p2y) * 0.5;
    const p23x = (p2x + p3x) * 0.5;
    const p23y = (p2y + p3y) * 0.5;
    const ax = (p01x + p12x) * 0.5;
    const ay = (p01y + p12y) * 0.5;
    const bx = (p12x + p23x) * 0.5;
    const by = (p12y + p23y) * 0.5;
    const mx = (ax + bx) * 0.5;
    const my = (ay + by) * 0.5;
    FlattenCubic(p0x, p0y, p01x, p01y, ax, ay, mx, my, out, depth + 1);
    FlattenCubic(mx, my, bx, by, p23x, p23y, p3x, p3y, out, depth + 1);
}

/**
 * Flattens a shape contour into screen-space polyline points (x,y pairs appended to `out`).
 * @param shape The bezier contour to flatten.
 * @param m Maps shape-local space to screen pixels.
 * @param out Receives the flattened points, appended as interleaved x,y pairs.
 * @returns The number of points appended.
 */
export function BuildContourPoints(shape: IShapeData, m: Mat2D, out: number[]): number {
    const n = shape.v.length;
    if (n < 2) {
        return 0;
    }
    const start = out.length;
    TransformPoint(m, shape.v[0][0], shape.v[0][1], TransformedStart);
    out.push(TransformedStart[0], TransformedStart[1]);

    const segCount = shape.c ? n : n - 1;
    for (let j = 0; j < segCount; j++) {
        const j1 = (j + 1) % n;
        const v0x = shape.v[j][0];
        const v0y = shape.v[j][1];
        const v1x = shape.v[j1][0];
        const v1y = shape.v[j1][1];
        // Absolute control points (tangents are relative in Lottie).
        TransformPoint(m, v0x, v0y, P0);
        TransformPoint(m, v0x + shape.o[j][0], v0y + shape.o[j][1], P1);
        TransformPoint(m, v1x + shape.i[j1][0], v1y + shape.i[j1][1], P2);
        TransformPoint(m, v1x, v1y, P3);
        FlattenCubic(P0[0], P0[1], P1[0], P1[1], P2[0], P2[1], P3[0], P3[1], out, 0);
    }
    return (out.length - start) / 2;
}

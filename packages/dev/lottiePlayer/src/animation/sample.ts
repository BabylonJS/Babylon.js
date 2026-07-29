// Per-frame sampling of raw Lottie properties (scalars, vectors, and morphing shapes),
// with standard Lottie cubic-bezier keyframe easing. All functions are pure.

import { type IEasing, type IKeyframe, type IProp, type IShapeData } from "./lottieRaw";

function GetEasingComponent(e: IEasing | undefined, axis: "x" | "y", fallback: number): number {
    if (!e) {
        return fallback;
    }
    const val = e[axis];
    return Array.isArray(val) ? val[0] : val;
}

// CSS-style cubic-bezier solve: control points (x1,y1),(x2,y2); endpoints (0,0),(1,1).
// Given the linear fraction `x`, return the eased fraction `y`.
function SolveCubicBezier(x: number, x1: number, y1: number, x2: number, y2: number): number {
    if (x <= 0) {
        return 0;
    }
    if (x >= 1) {
        return 1;
    }
    const ax = 1 - 3 * x2 + 3 * x1;
    const bx = 3 * x2 - 6 * x1;
    const cx = 3 * x1;
    const ay = 1 - 3 * y2 + 3 * y1;
    const by = 3 * y2 - 6 * y1;
    const cy = 3 * y1;
    // Newton-Raphson to invert X(t) = x.
    let t = x;
    for (let i = 0; i < 8; i++) {
        const xt = ((ax * t + bx) * t + cx) * t - x;
        if (Math.abs(xt) < 1e-6) {
            break;
        }
        const d = (3 * ax * t + 2 * bx) * t + cx;
        if (Math.abs(d) < 1e-6) {
            break;
        }
        t -= xt / d;
    }
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return ((ay * t + by) * t + cy) * t;
}

interface ISegment {
    k: IKeyframe | null;
    next: IKeyframe | null;
    /** Eased interpolation fraction in [0,1]. */
    f: number;
}

const SegmentScratch: ISegment = { k: null, next: null, f: 0 };
const EmptyShape: IShapeData = { v: [], i: [], o: [], c: false };
const PointScratch = [0, 0];
const SizeScratch = [0, 0];

function PrepareShape(out: IShapeData | undefined, pointCount: number): IShapeData {
    const shape = out ?? { v: [], i: [], o: [], c: false };
    shape.v.length = pointCount;
    shape.i.length = pointCount;
    shape.o.length = pointCount;
    for (let i = 0; i < pointCount; i++) {
        shape.v[i] ??= [0, 0];
        shape.i[i] ??= [0, 0];
        shape.o[i] ??= [0, 0];
    }
    return shape;
}

function SetShapePoint(shape: IShapeData, index: number, vx: number, vy: number, ix: number, iy: number, ox: number, oy: number): void {
    shape.v[index][0] = vx;
    shape.v[index][1] = vy;
    shape.i[index][0] = ix;
    shape.i[index][1] = iy;
    shape.o[index][0] = ox;
    shape.o[index][1] = oy;
}

function FindSegment(keys: IKeyframe[], frame: number, out: ISegment): void {
    if (frame <= keys[0].t) {
        out.k = keys[0];
        out.next = keys[1] ?? null;
        out.f = 0;
        return;
    }
    const last = keys[keys.length - 1];
    if (frame >= last.t) {
        out.k = last;
        out.next = null;
        out.f = 0;
        return;
    }
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1].t <= frame) {
        i++;
    }
    const k = keys[i];
    const next = keys[i + 1];
    if (k.h === 1) {
        out.k = k;
        out.next = next;
        out.f = 0;
        return;
    }
    const duration = next.t - k.t;
    const lin = duration > 0 ? (frame - k.t) / duration : 0;
    out.k = k;
    out.next = next;
    out.f = SolveCubicBezier(lin, GetEasingComponent(k.o, "x", 0), GetEasingComponent(k.o, "y", 0), GetEasingComponent(k.i, "x", 1), GetEasingComponent(k.i, "y", 1));
}

function AsNumber(v: unknown): number {
    return Array.isArray(v) ? (v[0] as number) : (v as number);
}

/**
 * Samples a scalar property (e.g. opacity, rotation) at a frame.
 * @param prop The property to sample. When undefined, `fallback` is returned.
 * @param frame The comp frame to sample at.
 * @param fallback The value to use when the property is absent.
 * @returns The sampled value.
 */
export function SampleScalar(prop: IProp | undefined, frame: number, fallback: number): number {
    if (!prop) {
        return fallback;
    }
    if (prop.a !== 1) {
        return AsNumber(prop.k);
    }
    const keys = prop.k as IKeyframe[];
    if (keys.length === 0) {
        return fallback;
    }
    FindSegment(keys, frame, SegmentScratch);
    const { k, next, f } = SegmentScratch;
    if (!k) {
        return fallback;
    }
    const v0 = AsNumber(k.s);
    if (!next || f === 0) {
        return v0;
    }
    const v1 = AsNumber(k.e !== undefined ? k.e : next.s);
    return v0 + (v1 - v0) * f;
}

/**
 * Samples a multi-dimensional property (e.g. position, scale, anchor, color) into `out`.
 * @param prop The property to sample. When undefined, `out` is returned untouched.
 * @param frame The comp frame to sample at.
 * @param out Receives the sampled components. Pre-fill it to supply per-component defaults.
 * @returns The `out` array.
 */
export function SampleMulti(prop: IProp | undefined, frame: number, out: number[]): number[] {
    if (!prop) {
        return out;
    }
    // Separate-dimensions position (`{ s: true, x, y }`): each axis is its own scalar property.
    if (prop.s === true) {
        out[0] = SampleScalar(prop.x, frame, 0);
        out[1] = SampleScalar(prop.y, frame, 0);
        return out;
    }
    if (prop.a !== 1) {
        const k = prop.k as number[];
        for (let i = 0; i < k.length; i++) {
            out[i] = k[i];
        }
        return out;
    }
    const keys = prop.k as IKeyframe[];
    if (keys.length === 0) {
        return out;
    }
    FindSegment(keys, frame, SegmentScratch);
    const { k, next, f } = SegmentScratch;
    if (!k) {
        return out;
    }
    const s0 = k.s as number[];
    if (!next || f === 0) {
        for (let i = 0; i < s0.length; i++) {
            out[i] = s0[i];
        }
        return out;
    }
    const s1 = (k.e !== undefined ? k.e : next.s) as number[];
    for (let i = 0; i < s0.length; i++) {
        out[i] = s0[i] + (s1[i] - s0[i]) * f;
    }
    return out;
}

/**
 * Samples a morphing shape property. Lottie guarantees a constant vertex count across a
 * path's keyframes, so morphing is a straight per-vertex lerp of vertices + in/out tangents.
 * @param prop The shape property to sample.
 * @param frame The comp frame to sample at.
 * @param out Optional reusable contour for interpolated shapes.
 * @returns The contour at that frame. May alias the source data when the property is static.
 */
export function SampleShape(prop: IProp, frame: number, out?: IShapeData): IShapeData {
    if (prop.a !== 1) {
        return prop.k as IShapeData;
    }
    const keys = prop.k as IKeyframe[];
    if (keys.length === 0) {
        return EmptyShape;
    }
    FindSegment(keys, frame, SegmentScratch);
    const { k, next, f } = SegmentScratch;
    if (!k) {
        return EmptyShape;
    }
    const s0 = (k.s as IShapeData[])[0];
    if (!next || f === 0) {
        return s0;
    }
    const s1 = ((k.e !== undefined ? k.e : next.s) as IShapeData[])[0];
    const n = s0.v.length;
    const result = PrepareShape(out, n);
    result.c = s0.c;
    for (let j = 0; j < n; j++) {
        SetShapePoint(
            result,
            j,
            s0.v[j][0] + (s1.v[j][0] - s0.v[j][0]) * f,
            s0.v[j][1] + (s1.v[j][1] - s0.v[j][1]) * f,
            s0.i[j][0] + (s1.i[j][0] - s0.i[j][0]) * f,
            s0.i[j][1] + (s1.i[j][1] - s0.i[j][1]) * f,
            s0.o[j][0] + (s1.o[j][0] - s0.o[j][0]) * f,
            s0.o[j][1] + (s1.o[j][1] - s0.o[j][1]) * f
        );
    }
    return result;
}

/**
 * Samples a rect primitive into a contour. Sharp corners (roundness ~ 0) produce 4
 * straight-edged vertices; rounded corners produce 8 vertices with bezier tangents
 * approximating the quarter-circle arcs.
 * @param rect The rect source: `p` center, `s` size, `r` corner roundness.
 * @param frame The comp frame to sample at.
 * @param out Optional reusable contour.
 * @returns The rect as a closed contour.
 */
export function SampleRect(rect: { p: IProp; s: IProp; r?: IProp }, frame: number, out?: IShapeData): IShapeData {
    SampleMulti(rect.p, frame, PointScratch);
    const cx = PointScratch[0];
    const cy = PointScratch[1];
    SampleMulti(rect.s, frame, SizeScratch);
    const size = SizeScratch;
    const hw = size[0] / 2;
    const hh = size[1] / 2;
    let round = rect.r ? SampleScalar(rect.r, frame, 0) : 0;
    round = Math.min(round, hw, hh);

    if (round <= 0.01) {
        const result = PrepareShape(out, 4);
        result.c = true;
        // Sharp rect: 4 corners, clockwise from top-right (Lottie's rect winding), zero tangents.
        SetShapePoint(result, 0, cx + hw, cy - hh, 0, 0, 0, 0);
        SetShapePoint(result, 1, cx + hw, cy + hh, 0, 0, 0, 0);
        SetShapePoint(result, 2, cx - hw, cy + hh, 0, 0, 0, 0);
        SetShapePoint(result, 3, cx - hw, cy - hh, 0, 0, 0, 0);
        return result;
    }

    // Rounded rect: 8 vertices (2 per corner) with bezier tangents approximating the arcs.
    // Bezier handle length for a circular quarter-arc of radius `round`.
    const k = round * 0.5523;
    const result = PrepareShape(out, 8);
    result.c = true;
    // Clockwise from the right edge. Each corner contributes two anchors with arc tangents.
    SetShapePoint(result, 0, cx + hw, cy - hh + round, 0, -k, 0, 0); // right edge, top
    SetShapePoint(result, 1, cx + hw, cy + hh - round, 0, 0, 0, k); // right edge, bottom
    SetShapePoint(result, 2, cx + hw - round, cy + hh, k, 0, 0, 0); // bottom edge, right
    SetShapePoint(result, 3, cx - hw + round, cy + hh, 0, 0, -k, 0); // bottom edge, left
    SetShapePoint(result, 4, cx - hw, cy + hh - round, 0, k, 0, 0); // left edge, bottom
    SetShapePoint(result, 5, cx - hw, cy - hh + round, 0, 0, 0, -k); // left edge, top
    SetShapePoint(result, 6, cx - hw + round, cy - hh, -k, 0, 0, 0); // top edge, left
    SetShapePoint(result, 7, cx + hw - round, cy - hh, 0, 0, k, 0); // top edge, right
    return result;
}

/**
 * Samples an ellipse primitive into a contour: 4 anchor points (top, right, bottom, left)
 * with bezier tangents (handle length 0.5523 × radius) that approximate the arc.
 * @param ellipse The ellipse source: `p` center, `s` size (diameters).
 * @param frame The comp frame to sample at.
 * @param out Optional reusable contour.
 * @returns The ellipse as a closed contour.
 */
export function SampleEllipse(ellipse: { p: IProp; s: IProp }, frame: number, out?: IShapeData): IShapeData {
    SampleMulti(ellipse.p, frame, PointScratch);
    const cx = PointScratch[0];
    const cy = PointScratch[1];
    SampleMulti(ellipse.s, frame, SizeScratch);
    const size = SizeScratch;
    const rx = size[0] / 2;
    const ry = size[1] / 2;
    const kx = rx * 0.5523;
    const ky = ry * 0.5523;
    const result = PrepareShape(out, 4);
    result.c = true;
    // Clockwise from the top: top, right, bottom, left.
    SetShapePoint(result, 0, cx, cy - ry, -kx, 0, kx, 0);
    SetShapePoint(result, 1, cx + rx, cy, 0, -ky, 0, ky);
    SetShapePoint(result, 2, cx, cy + ry, kx, 0, -kx, 0);
    SetShapePoint(result, 3, cx - rx, cy, 0, ky, 0, -ky);
    return result;
}

// Stroke geometry — expand a flattened polyline into stroke triangles (a thick line).
//
// Each segment becomes a quad offset ±halfWidth perpendicular to the segment direction.
// Round joins/caps are added as small triangle fans at vertices, which keeps the outline
// gap-free at corners regardless of turn direction. The fill renderer stencils the UNION of
// these triangles (winding-independent increment-clamp) and covers once, so a semi-transparent
// stroke paints at a single uniform alpha instead of accumulating where the triangles overlap.

// Triangle-fan density for round joins/caps, scaled to the stroke radius in screen pixels.
// Dash caps are far more prominent than interior joins, so a fixed low count visibly facets them.
function GetJoinSegments(halfWidth: number): number {
    return Math.max(8, Math.min(32, Math.ceil(halfWidth * 1.2)));
}

/** Reused across dash spans so the render loop does not allocate per dash. */
const TrimmedSpan: number[] = [];
const DashSpan: number[] = [];

// Shorten a polyline by `trim` at both ends, writing into `out`. Round caps then extend the
// result back out to its original length, so a dash keeps the pattern's spacing instead of
// growing by the cap radius at each end. Returns false when nothing survives the trim.
function TrimSpanEnds(span: number[], trim: number, out: number[]): boolean {
    out.length = 0;
    let total = 0;
    for (let i = 0; i + 3 < span.length; i += 2) {
        total += Math.hypot(span[i + 2] - span[i], span[i + 3] - span[i + 1]);
    }
    if (total <= trim * 2 + 1e-6) {
        return false;
    }
    const keepFrom = trim;
    const keepTo = total - trim;
    let travelled = 0;
    for (let i = 0; i + 3 < span.length; i += 2) {
        const ax = span[i];
        const ay = span[i + 1];
        const dx = span[i + 2] - ax;
        const dy = span[i + 3] - ay;
        const len = Math.hypot(dx, dy);
        if (len < 1e-9) {
            continue;
        }
        const segStart = travelled;
        const segEnd = travelled + len;
        travelled = segEnd;
        const from = Math.max(segStart, keepFrom);
        const to = Math.min(segEnd, keepTo);
        if (to <= from) {
            continue;
        }
        if (out.length === 0) {
            out.push(ax + (dx * (from - segStart)) / len, ay + (dy * (from - segStart)) / len);
        }
        out.push(ax + (dx * (to - segStart)) / len, ay + (dy * (to - segStart)) / len);
    }
    return out.length >= 4;
}

function FlushDashSpan(span: number[], halfWidth: number, out: number[], roundCaps: boolean): number {
    let added = 0;
    if (span.length >= 4) {
        if (roundCaps) {
            // Inset so the round caps bring the dash back to its nominal length.
            if (TrimSpanEnds(span, halfWidth, TrimmedSpan)) {
                added = BuildStrokePoints(TrimmedSpan, TrimmedSpan.length / 2, halfWidth, false, out, true);
            }
        } else {
            added = BuildStrokePoints(span, span.length / 2, halfWidth, false, out, false);
        }
    }
    span.length = 0;
    return added;
}

/**
 * Appends stroke triangles (x,y pairs, 3 verts per triangle) to `out`.
 * @param poly The flattened contour, as `count` interleaved screen-space x,y pairs.
 * @param count The number of points in `poly`.
 * @param halfWidth Half the stroke width, in screen pixels.
 * @param closed When true, adds the wrap-around segment and treats every vertex as a join.
 * @param out Receives the stroke triangles, appended as interleaved x,y pairs.
 * @param roundCaps When false, the two endpoints of an open path get butt caps instead of round
 * ones. Interior joins stay round either way. Ignored for closed paths, which have no endpoints.
 * @returns The number of vertices appended.
 */
export function BuildStrokePoints(poly: number[], count: number, halfWidth: number, closed: boolean, out: number[], roundCaps = true): number {
    if (count < 2 || halfWidth <= 0) {
        return 0;
    }
    const start = out.length;
    const segs = closed ? count : count - 1;

    // Segment quads.
    for (let i = 0; i < segs; i++) {
        const i1 = (i + 1) % count;
        const ax = poly[i * 2];
        const ay = poly[i * 2 + 1];
        const bx = poly[i1 * 2];
        const by = poly[i1 * 2 + 1];
        let dx = bx - ax;
        let dy = by - ay;
        const len = Math.hypot(dx, dy);
        if (len < 1e-6) {
            continue;
        }
        dx /= len;
        dy /= len;
        // Perpendicular, scaled to half width.
        const nx = -dy * halfWidth;
        const ny = dx * halfWidth;
        const p0x = ax + nx;
        const p0y = ay + ny;
        const p1x = bx + nx;
        const p1y = by + ny;
        const p2x = bx - nx;
        const p2y = by - ny;
        const p3x = ax - nx;
        const p3y = ay - ny;
        out.push(p0x, p0y, p1x, p1y, p2x, p2y, p0x, p0y, p2x, p2y, p3x, p3y);
    }

    // Round joins (and, unless butt caps were requested, round caps) at every vertex.
    const joinSegments = GetJoinSegments(halfWidth);
    const firstJoin = closed || roundCaps ? 0 : 1;
    const lastJoin = closed || roundCaps ? count - 1 : count - 2;
    for (let i = firstJoin; i <= lastJoin; i++) {
        const cx = poly[i * 2];
        const cy = poly[i * 2 + 1];
        for (let k = 0; k < joinSegments; k++) {
            const a0 = (k / joinSegments) * Math.PI * 2;
            const a1 = ((k + 1) / joinSegments) * Math.PI * 2;
            out.push(cx, cy, cx + Math.cos(a0) * halfWidth, cy + Math.sin(a0) * halfWidth, cx + Math.cos(a1) * halfWidth, cy + Math.sin(a1) * halfWidth);
        }
    }

    return (out.length - start) / 2;
}

/**
 * Appends the triangles for a dashed stroke: walks the contour by arc length, slicing it into the
 * pattern's "on" spans, and expands each span as its own open sub-stroke.
 * @param poly The flattened contour, as `count` interleaved screen-space x,y pairs.
 * @param count The number of points in `poly`.
 * @param halfWidth Half the stroke width, in screen pixels.
 * @param closed When true, the wrap-around segment is dashed too.
 * @param dashLength Length of each dash, in screen pixels.
 * @param gapLength Length of each gap, in screen pixels.
 * @param dashOffset Distance the pattern is shifted along the path, in screen pixels.
 * @param out Receives the stroke triangles, appended as interleaved x,y pairs.
 * @param roundCaps When false, each dash gets butt caps instead of round ones.
 * @returns The number of vertices appended.
 */
export function BuildDashedStrokePoints(
    poly: number[],
    count: number,
    halfWidth: number,
    closed: boolean,
    dashLength: number,
    gapLength: number,
    dashOffset: number,
    out: number[],
    roundCaps = true
): number {
    // A missing dash or gap means there is nothing to break up.
    if (dashLength <= 0 || gapLength <= 0) {
        return BuildStrokePoints(poly, count, halfWidth, closed, out, roundCaps);
    }

    const period = dashLength + gapLength;
    let phase = dashOffset % period;
    if (phase < 0) {
        phase += period;
    }

    const span = DashSpan;
    span.length = 0;
    let added = 0;

    const segs = closed ? count : count - 1;
    for (let i = 0; i < segs; i++) {
        const i1 = (i + 1) % count;
        const ax = poly[i * 2];
        const ay = poly[i * 2 + 1];
        const dx = poly[i1 * 2] - ax;
        const dy = poly[i1 * 2 + 1] - ay;
        const len = Math.hypot(dx, dy);
        if (len < 1e-6) {
            continue;
        }
        let travelled = 0;
        while (travelled < len - 1e-9) {
            const inDash = phase < dashLength;
            // Distance to the next dash/gap boundary.
            const toBoundary = inDash ? dashLength - phase : period - phase;
            const step = Math.min(toBoundary, len - travelled);
            if (inDash) {
                if (span.length === 0) {
                    span.push(ax + (dx * travelled) / len, ay + (dy * travelled) / len);
                }
                const end = travelled + step;
                span.push(ax + (dx * end) / len, ay + (dy * end) / len);
            }
            travelled += step;
            phase += step;
            if (phase >= period - 1e-9) {
                phase = 0;
            } else if (inDash && phase >= dashLength - 1e-9) {
                added += FlushDashSpan(span, halfWidth, out, roundCaps);
            }
        }
    }
    added += FlushDashSpan(span, halfWidth, out, roundCaps);
    return added;
}

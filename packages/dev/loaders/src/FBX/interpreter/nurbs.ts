/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
/**
 * NURBS curves and surfaces, and polyline ("Line") geometry.
 *
 * The basis evaluation and tessellation follow the FBX SDK conventions as implemented by ufbx: knot spans are
 * subdivided uniformly, closed and periodic curves wrap their control points, and surfaces are tessellated into
 * quads (degenerate quads at poles become triangles) with welded positions along the wrapped edges.
 */
import { type FBXNode, findChildByName, getPropertyValue, cleanFBXName, getNodeArray } from "../types/fbxTypes";
import { type FBXGeometryData, type FBXGeometryDiagnostic } from "./geometry";
import { getPropertyEntries } from "./propertyTemplates";

export type FBXNurbsTopology = "open" | "closed" | "periodic";

/** Knot vector and derived data of one parametric direction. */
export interface FBXNurbsBasis {
    order: number;
    topology: FBXNurbsTopology;
    knots: Float64Array;
    /** Parameter range that the curve is defined on */
    tMin: number;
    tMax: number;
    /** Distinct knot values inside [tMin, tMax], i.e. the boundaries of the non-empty spans */
    spans: Float64Array;
    /** False when the knot vector is too short or not monotonic */
    valid: boolean;
}

/** NURBS curve: homogeneous control points (x, y, z, w) and a basis. */
export interface FBXNurbsCurveData {
    basis: FBXNurbsBasis;
    /** Control points as x,y,z,w */
    controlPoints: Float64Array;
    numControlPoints: number;
}

/** NURBS surface: control points laid out as `v * numU + u`. */
export interface FBXNurbsSurfaceData {
    basisU: FBXNurbsBasis;
    basisV: FBXNurbsBasis;
    numU: number;
    numV: number;
    /** Control points as x,y,z,w */
    controlPoints: Float64Array;
    flipNormals: boolean;
    /** Span subdivision stored in the file (Step), 0 when absent */
    stepU: number;
    stepV: number;
}

/** Polyline geometry ready for a lines mesh: one or more open or closed point runs. */
export interface FBXCurveGeometryData {
    id: number;
    name: string;
    kind: "line" | "nurbsCurve";
    /** Each polyline as x,y,z triples; closed runs repeat their first point at the end */
    polylines: Float64Array[];
    /** Display colour from the geometry's Color property */
    color: [number, number, number] | null;
    diagnostics: FBXGeometryDiagnostic[];
}

const MAX_NURBS_ORDER = 128;
const DEFAULT_SPAN_SUBDIVISION = 4;
const MAX_FILE_SPAN_SUBDIVISION = 16;
const MAX_SPAN_SUBDIVISION = 64;

function readTopology(form: string | undefined): FBXNurbsTopology {
    return form === "Closed" ? "closed" : form === "Periodic" ? "periodic" : "open";
}

export function createNurbsBasis(order: number, form: string | undefined, knots: Float64Array): FBXNurbsBasis {
    const basis: FBXNurbsBasis = { order, topology: readTopology(form), knots, tMin: 0, tMax: 0, spans: new Float64Array(0), valid: false };
    if (order > 1 && order <= MAX_NURBS_ORDER) {
        const degree = order - 1;
        if (knots.length >= 2 * degree + 1) {
            basis.tMin = knots[degree];
            basis.tMax = knots[knots.length - degree - 1];
            const maxSpans = knots.length - 2 * degree;
            const spans: number[] = [];
            let prev = -Infinity;
            for (let i = 0; i < maxSpans; i++) {
                const t = knots[degree + i];
                if (t !== prev) {
                    spans.push(t);
                    prev = t;
                }
            }
            basis.spans = Float64Array.from(spans);
            basis.valid = true;
            for (let i = 1; i < knots.length; i++) {
                if (!(knots[i - 1] <= knots[i])) {
                    basis.valid = false;
                    break;
                }
            }
        }
    }
    return basis;
}

function nurbsWeight(knots: Float64Array, knot: number, degree: number, u: number): number {
    if (knot < 0 || knot >= knots.length || knots.length - knot < degree) {
        return 0;
    }
    const prevU = knots[knot];
    const nextU = knots[knot + degree];
    if (prevU >= nextU) {
        return 0;
    }
    if (u <= prevU) {
        return 0;
    }
    if (u >= nextU) {
        return 1;
    }
    return (u - prevU) / (nextU - prevU);
}

function nurbsDeriv(knots: Float64Array, knot: number, degree: number): number {
    if (knot < 0 || knot >= knots.length || knots.length - knot < degree) {
        return 0;
    }
    const prevU = knots[knot];
    const nextU = knots[knot + degree];
    if (prevU >= nextU) {
        return 0;
    }
    return degree / (nextU - prevU);
}

/**
 * Evaluates the basis functions (and their derivatives) that are non-zero at `u`.
 * @returns index of the first influencing control point, or -1 when the basis cannot be evaluated
 */
export function evaluateNurbsBasis(basis: FBXNurbsBasis, u: number, weights: Float64Array, derivatives: Float64Array | null): number {
    if (basis.order <= 1 || !basis.valid) {
        return -1;
    }
    const degree = basis.order - 1;
    const knots = basis.knots;
    let knot: number;
    if (u <= basis.tMin) {
        knot = degree;
        u = basis.tMin;
    } else if (u >= basis.tMax) {
        knot = knots.length - degree - 2;
        u = basis.tMax;
    } else {
        // Knot span [knots[knot], knots[knot + 1]) containing u
        let lo = 0;
        let hi = knots.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (knots[mid + 1] <= u) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        if (!(knots[lo] <= u && u < knots[lo + 1])) {
            return -1;
        }
        knot = lo;
    }
    if (knot < degree) {
        return -1;
    }

    weights[0] = 1;
    for (let p = 1; p <= degree; p++) {
        let prev = 0;
        let g = 1 - nurbsWeight(knots, knot - p + 1, p, u);
        let dg = 0;
        const last = derivatives !== null && p === degree;
        if (last) {
            dg = nurbsDeriv(knots, knot - p + 1, p);
        }
        for (let i = p; i > 0; i--) {
            const f = nurbsWeight(knots, knot - p + i, p, u);
            const weight = weights[i - 1];
            weights[i] = f * weight + g * prev;
            if (last) {
                const df = nurbsDeriv(knots, knot - p + i, p);
                derivatives![i] = df * weight - dg * prev;
                dg = df;
            }
            prev = weight;
            g = 1 - f;
        }
        weights[0] = g * prev;
        if (last) {
            derivatives![0] = -dg * prev;
        }
    }
    return knot - degree;
}

/** Evaluates a curve point; `out` receives position (0..2) and derivative (3..5). */
export function evaluateNurbsCurve(curve: FBXNurbsCurveData, u: number, out: Float64Array, weights: Float64Array, derivs: Float64Array): boolean {
    const base = evaluateNurbsBasis(curve.basis, u, weights, derivs);
    if (base < 0 || curve.numControlPoints === 0) {
        return false;
    }
    const order = curve.basis.order;
    let px = 0,
        py = 0,
        pz = 0,
        pw = 0,
        dx = 0,
        dy = 0,
        dz = 0,
        dw = 0;
    const cp = curve.controlPoints;
    for (let i = 0; i < order; i++) {
        const ix = ((base + i) % curve.numControlPoints) * 4;
        const w = weights[i] * cp[ix + 3];
        const d = derivs[i] * cp[ix + 3];
        px += cp[ix] * w;
        py += cp[ix + 1] * w;
        pz += cp[ix + 2] * w;
        pw += w;
        dx += cp[ix] * d;
        dy += cp[ix + 1] * d;
        dz += cp[ix + 2] * d;
        dw += d;
    }
    const rcp = pw !== 0 ? 1 / pw : 0;
    out[0] = px * rcp;
    out[1] = py * rcp;
    out[2] = pz * rcp;
    out[3] = (dx - dw * out[0]) * rcp;
    out[4] = (dy - dw * out[1]) * rcp;
    out[5] = (dz - dw * out[2]) * rcp;
    return true;
}

/** Evaluates a surface point; `out` receives position (0..2), du (3..5) and dv (6..8). */
export function evaluateNurbsSurface(
    surface: FBXNurbsSurfaceData,
    u: number,
    v: number,
    out: Float64Array,
    scratch: { wu: Float64Array; wv: Float64Array; du: Float64Array; dv: Float64Array }
): boolean {
    const baseU = evaluateNurbsBasis(surface.basisU, u, scratch.wu, scratch.du);
    const baseV = evaluateNurbsBasis(surface.basisV, v, scratch.wv, scratch.dv);
    if (baseU < 0 || baseV < 0 || surface.numU === 0 || surface.numV === 0) {
        return false;
    }
    const orderU = surface.basisU.order;
    const orderV = surface.basisV.order;
    const cp = surface.controlPoints;
    let px = 0,
        py = 0,
        pz = 0,
        pw = 0;
    let ux = 0,
        uy = 0,
        uz = 0,
        uw = 0;
    let vx = 0,
        vy = 0,
        vz = 0,
        vw = 0;
    for (let vi = 0; vi < orderV; vi++) {
        const vix = (baseV + vi) % surface.numV;
        const weightV = scratch.wv[vi];
        const derivV = scratch.dv[vi];
        for (let ui = 0; ui < orderU; ui++) {
            const uix = (baseU + ui) % surface.numU;
            const weightU = scratch.wu[ui];
            const derivU = scratch.du[ui];
            const ix = (vix * surface.numU + uix) * 4;
            const cw = cp[ix + 3];
            const w = weightU * weightV * cw;
            const wdu = derivU * weightV * cw;
            const wdv = derivV * weightU * cw;
            const x = cp[ix],
                y = cp[ix + 1],
                z = cp[ix + 2];
            px += x * w;
            py += y * w;
            pz += z * w;
            pw += w;
            ux += x * wdu;
            uy += y * wdu;
            uz += z * wdu;
            uw += wdu;
            vx += x * wdv;
            vy += y * wdv;
            vz += z * wdv;
            vw += wdv;
        }
    }
    const rcp = pw !== 0 ? 1 / pw : 0;
    out[0] = px * rcp;
    out[1] = py * rcp;
    out[2] = pz * rcp;
    out[3] = (ux - uw * out[0]) * rcp;
    out[4] = (uy - uw * out[1]) * rcp;
    out[5] = (uz - uw * out[2]) * rcp;
    out[6] = (vx - vw * out[0]) * rcp;
    out[7] = (vy - vw * out[1]) * rcp;
    out[8] = (vz - vw * out[2]) * rcp;
    return true;
}

/**
 * Tessellates a curve into a polyline with `subdivision` segments per knot span. Closed and periodic curves
 * end on a copy of their first point.
 */
export function tessellateNurbsCurve(curve: FBXNurbsCurveData, subdivision: number = DEFAULT_SPAN_SUBDIVISION): Float64Array | null {
    const basis = curve.basis;
    if (!basis.valid || curve.numControlPoints === 0 || basis.spans.length === 0) {
        return null;
    }
    const numSub = Math.max(1, Math.floor(subdivision));
    const numSpans = basis.spans.length;
    const isOpen = basis.topology === "open";
    const numIndices = numSpans + (numSpans - 1) * (numSub - 1);
    const numVertices = numIndices - (isOpen ? 0 : 1);
    const points = new Float64Array(numIndices * 3);
    const weights = new Float64Array(basis.order + 1);
    const derivs = new Float64Array(basis.order + 1);
    const out = new Float64Array(6);
    for (let spanIx = 0; spanIx < numSpans; spanIx++) {
        const numSplits = spanIx + 1 === numSpans ? 1 : numSub;
        for (let subIx = 0; subIx < numSplits; subIx++) {
            const ix = spanIx * numSub + subIx;
            if (ix < numVertices) {
                let u = basis.spans[spanIx];
                if (subIx > 0) {
                    const t = subIx / numSub;
                    u = u * (1 - t) + t * basis.spans[spanIx + 1];
                }
                if (evaluateNurbsCurve(curve, u, out, weights, derivs)) {
                    points[ix * 3] = out[0];
                    points[ix * 3 + 1] = out[1];
                    points[ix * 3 + 2] = out[2];
                }
            } else {
                points[ix * 3] = points[0];
                points[ix * 3 + 1] = points[1];
                points[ix * 3 + 2] = points[2];
            }
        }
    }
    return points;
}

/** Span subdivision to use for a surface direction: an explicit override, else the file's Step, else 4. */
export function resolveSpanSubdivision(fileStep: number, override: number | undefined): number {
    if (override !== undefined && Number.isFinite(override) && override > 0) {
        return Math.min(MAX_SPAN_SUBDIVISION, Math.max(1, Math.floor(override)));
    }
    if (fileStep > 0) {
        return Math.min(MAX_FILE_SPAN_SUBDIVISION, Math.floor(fileStep));
    }
    return DEFAULT_SPAN_SUBDIVISION;
}

/**
 * Tessellates a surface into triangles. Positions on wrapped (closed/periodic) edges and at poles are welded
 * exactly like the FBX SDK does, so degenerate quads collapse into triangles.
 */
export function tessellateNurbsSurface(
    surface: FBXNurbsSurfaceData,
    subU: number,
    subV: number
): { positions: Float64Array; indices: Uint32Array; normals: Float64Array; uvs: Float64Array } | null {
    const basisU = surface.basisU;
    const basisV = surface.basisV;
    if (!basisU.valid || !basisV.valid || surface.numU === 0 || surface.numV === 0 || basisU.spans.length < 2 || basisV.spans.length < 2) {
        return null;
    }
    const openU = basisU.topology === "open";
    const openV = basisV.topology === "open";
    const spansU = basisU.spans.length;
    const spansV = basisV.spans.length;
    const facesU = (spansU - 1) * subU;
    const facesV = (spansV - 1) * subV;
    const indicesU = spansU + (spansU - 1) * (subU - 1);
    const indicesV = spansV + (spansV - 1) * (subV - 1);
    const numAttribs = indicesU * indicesV;
    const numFaces = facesU * facesV;
    if (numAttribs > 0x3fffffff || numFaces > 0x3fffffff) {
        return null;
    }

    // Unique (welded) positions and per-attribute-vertex data
    const positionIx = new Uint32Array(numAttribs);
    const welded = new Float64Array(numAttribs * 3);
    let numPositions = 0;
    const attribUv = new Float64Array(numAttribs * 2);
    const scratch = {
        wu: new Float64Array(basisU.order + 1),
        wv: new Float64Array(basisV.order + 1),
        du: new Float64Array(basisU.order + 1),
        dv: new Float64Array(basisV.order + 1),
    };
    const out = new Float64Array(9);

    for (let spanV = 0; spanV < spansV; spanV++) {
        const splitsV = spanV + 1 === spansV ? 1 : subV;
        for (let splitV = 0; splitV < splitsV; splitV++) {
            const ixV = spanV * subV + splitV;
            let v = basisV.spans[spanV];
            if (splitV > 0) {
                const t = splitV / splitsV;
                v = v * (1 - t) + t * basisV.spans[spanV + 1];
            }
            const originalV = v;
            if (spanV + 1 === spansV && !openV) {
                v = basisV.spans[0];
            }
            for (let spanU = 0; spanU < spansU; spanU++) {
                const splitsU = spanU + 1 === spansU ? 1 : subU;
                for (let splitU = 0; splitU < splitsU; splitU++) {
                    const ixU = spanU * subU + splitU;
                    let u = basisU.spans[spanU];
                    if (splitU > 0) {
                        const t = splitU / splitsU;
                        u = u * (1 - t) + t * basisU.spans[spanU + 1];
                    }
                    const originalU = u;
                    if (spanU + 1 === spansU && !openU) {
                        u = basisU.spans[0];
                    }

                    let px = 0,
                        py = 0,
                        pz = 0;
                    if (evaluateNurbsSurface(surface, u, v, out, scratch)) {
                        px = out[0];
                        py = out[1];
                        pz = out[2];
                    }

                    // Positions that wrap around to an already emitted neighbour are welded.
                    const neighbors: number[] = [];
                    if ((spanV === 0 && (spanU > 0 || splitU > 0)) || (spanU === 0 && (spanV > 0 || splitV > 0))) {
                        neighbors.push(0);
                    }
                    if (spanV + 1 === spansV) {
                        neighbors.push(ixU);
                        if (spanU > 0 || splitU > 0) {
                            neighbors.push(ixV * indicesU);
                        }
                    }
                    if (spanU + 1 === spansU) {
                        neighbors.push(ixV * indicesU);
                        if (spanV > 0 || splitV > 0) {
                            neighbors.push(indicesU - 1);
                        }
                    }

                    const ix = ixV * indicesU + ixU;
                    let posIx = numPositions;
                    for (const nb of neighbors) {
                        if (nb >= ix) {
                            continue;
                        }
                        const nbPos = positionIx[nb];
                        const dx = welded[nbPos * 3] - px;
                        const dy = welded[nbPos * 3 + 1] - py;
                        const dz = welded[nbPos * 3 + 2] - pz;
                        if (dx * dx + dy * dy + dz * dz < 0.0000001) {
                            posIx = nbPos;
                            break;
                        }
                    }
                    positionIx[ix] = posIx;
                    if (posIx === numPositions) {
                        welded[posIx * 3] = px;
                        welded[posIx * 3 + 1] = py;
                        welded[posIx * 3 + 2] = pz;
                        numPositions++;
                    }
                    attribUv[ix * 2] = originalU;
                    attribUv[ix * 2 + 1] = originalV;
                }
            }
        }
    }

    // Faces: quads, or triangles where two consecutive corners share a welded position
    const triangles: number[] = [];
    const faceCorners = [0, 0, 0, 0];
    const faceVerts = [0, 0, 0, 0];
    for (let faceV = 0; faceV < facesV; faceV++) {
        for (let faceU = 0; faceU < facesU; faceU++) {
            faceCorners[0] = faceV * indicesU + faceU;
            faceCorners[1] = faceV * indicesU + faceU + 1;
            faceCorners[2] = (faceV + 1) * indicesU + faceU + 1;
            faceCorners[3] = (faceV + 1) * indicesU + faceU;
            for (let i = 0; i < 4; i++) {
                faceVerts[i] = positionIx[faceCorners[i]];
            }
            let count = 4;
            for (let prev = 0; prev < 4; prev++) {
                const next = (prev + 1) % 4;
                if (faceVerts[prev] === faceVerts[next]) {
                    for (let i = next; i < 3; i++) {
                        faceCorners[i] = faceCorners[i + 1];
                        faceVerts[i] = faceVerts[i + 1];
                    }
                    count = 3;
                    break;
                }
            }
            triangles.push(faceCorners[0], faceCorners[1], faceCorners[2]);
            if (count === 4) {
                triangles.push(faceCorners[0], faceCorners[2], faceCorners[3]);
            }
        }
    }

    // Smooth normals: area-weighted face normals accumulated per welded position
    const posNormals = new Float64Array(numPositions * 3);
    for (let t = 0; t < triangles.length; t += 3) {
        const a = positionIx[triangles[t]] * 3;
        const b = positionIx[triangles[t + 1]] * 3;
        const c = positionIx[triangles[t + 2]] * 3;
        const e1x = welded[b] - welded[a],
            e1y = welded[b + 1] - welded[a + 1],
            e1z = welded[b + 2] - welded[a + 2];
        const e2x = welded[c] - welded[a],
            e2y = welded[c + 1] - welded[a + 1],
            e2z = welded[c + 2] - welded[a + 2];
        const nx = e1y * e2z - e1z * e2y;
        const ny = e1z * e2x - e1x * e2z;
        const nz = e1x * e2y - e1y * e2x;
        for (const p of [a, b, c]) {
            posNormals[p] += nx;
            posNormals[p + 1] += ny;
            posNormals[p + 2] += nz;
        }
    }
    const flip = surface.flipNormals ? -1 : 1;
    for (let p = 0; p < numPositions; p++) {
        const x = posNormals[p * 3],
            y = posNormals[p * 3 + 1],
            z = posNormals[p * 3 + 2];
        const len = Math.hypot(x, y, z);
        if (len > 0) {
            posNormals[p * 3] = (x / len) * flip;
            posNormals[p * 3 + 1] = (y / len) * flip;
            posNormals[p * 3 + 2] = (z / len) * flip;
        }
    }

    const positions = new Float64Array(numAttribs * 3);
    const normals = new Float64Array(numAttribs * 3);
    for (let ix = 0; ix < numAttribs; ix++) {
        const p = positionIx[ix] * 3;
        positions[ix * 3] = welded[p];
        positions[ix * 3 + 1] = welded[p + 1];
        positions[ix * 3 + 2] = welded[p + 2];
        normals[ix * 3] = posNormals[p];
        normals[ix * 3 + 1] = posNormals[p + 1];
        normals[ix * 3 + 2] = posNormals[p + 2];
    }
    return { positions, indices: Uint32Array.from(triangles), normals, uvs: attribUv };
}

function readFloatArray(node: FBXNode, name: string): Float64Array | null {
    const child = findChildByName(node, name);
    if (!child) {
        return null;
    }
    const array = getNodeArray(child);
    if (!array) {
        return null;
    }
    return array instanceof Float64Array ? array : Float64Array.from(array as ArrayLike<number>);
}

function readColor(node: FBXNode): [number, number, number] | null {
    const entry = getPropertyEntries(node).find((e) => e.name === "Color");
    if (!entry || typeof entry.values[0] !== "number" || typeof entry.values[1] !== "number" || typeof entry.values[2] !== "number") {
        return null;
    }
    return [entry.values[0], entry.values[1], entry.values[2]];
}

/** Reads a NurbsCurve geometry node. */
export function extractNurbsCurve(node: FBXNode): FBXNurbsCurveData | null {
    const orderNode = findChildByName(node, "Order");
    const formNode = findChildByName(node, "Form");
    const order = orderNode ? (getPropertyValue<number>(orderNode, 0) ?? 0) : 0;
    const form = formNode ? getPropertyValue<string>(formNode, 0) : undefined;
    const points = readFloatArray(node, "Points");
    const knots = readFloatArray(node, "KnotVector");
    if (!points || !knots || points.length % 4 !== 0) {
        return null;
    }
    return { basis: createNurbsBasis(order, form, knots), controlPoints: points, numControlPoints: points.length / 4 };
}

/** Reads a NurbsSurface geometry node. */
export function extractNurbsSurface(node: FBXNode): FBXNurbsSurfaceData | null {
    const orderNode = findChildByName(node, "NurbsSurfaceOrder");
    const dimensionsNode = findChildByName(node, "Dimensions");
    const stepNode = findChildByName(node, "Step");
    const formNode = findChildByName(node, "Form");
    const flipNode = findChildByName(node, "FlipNormals");
    const orderU = orderNode ? (getPropertyValue<number>(orderNode, 0) ?? 0) : 0;
    const orderV = orderNode ? (getPropertyValue<number>(orderNode, 1) ?? 0) : 0;
    const numU = dimensionsNode ? (getPropertyValue<number>(dimensionsNode, 0) ?? 0) : 0;
    const numV = dimensionsNode ? (getPropertyValue<number>(dimensionsNode, 1) ?? 0) : 0;
    const stepU = stepNode ? (getPropertyValue<number>(stepNode, 0) ?? 0) : 0;
    const stepV = stepNode ? (getPropertyValue<number>(stepNode, 1) ?? 0) : 0;
    const formU = formNode ? getPropertyValue<string>(formNode, 0) : undefined;
    const formV = formNode ? getPropertyValue<string>(formNode, 1) : undefined;
    const flipValue = flipNode ? getPropertyValue<number | boolean>(flipNode, 0) : 0;
    const points = readFloatArray(node, "Points");
    const knotsU = readFloatArray(node, "KnotVectorU");
    const knotsV = readFloatArray(node, "KnotVectorV");
    if (!points || !knotsU || !knotsV || points.length % 4 !== 0 || points.length / 4 !== numU * numV || numU <= 0 || numV <= 0) {
        return null;
    }
    return {
        basisU: createNurbsBasis(orderU, formU, knotsU),
        basisV: createNurbsBasis(orderV, formV, knotsV),
        numU,
        numV,
        controlPoints: points,
        flipNormals: flipValue === true || flipValue === 1,
        stepU: typeof stepU === "number" ? stepU : 0,
        stepV: typeof stepV === "number" ? stepV : 0,
    };
}

/** Tessellates a NurbsSurface geometry node into mesh geometry. */
export function nurbsSurfaceToGeometry(node: FBXNode, geometryId: number, subdivisionOverride: number | undefined): FBXGeometryData | null {
    const name = cleanFBXName(getPropertyValue<string>(node, 1) ?? "NurbsSurface");
    const surface = extractNurbsSurface(node);
    const diagnostics: FBXGeometryDiagnostic[] = [];
    if (!surface) {
        return null;
    }
    const subU = resolveSpanSubdivision(surface.stepU, subdivisionOverride);
    const subV = resolveSpanSubdivision(surface.stepV, subdivisionOverride);
    const tess = tessellateNurbsSurface(surface, subU, subV);
    if (!tess) {
        diagnostics.push({ type: "nurbs-invalid", message: `NURBS surface '${name}' has an invalid basis and was skipped.` });
        return {
            id: geometryId,
            name,
            positions: new Float64Array(0),
            indices: new Uint32Array(0),
            normals: null,
            uvs: null,
            uvSets: [],
            colors: null,
            tangents: null,
            binormals: null,
            controlPointIndices: null,
            materialIndices: null,
            diagnostics,
        };
    }
    return {
        id: geometryId,
        name,
        positions: tess.positions,
        indices: tess.indices,
        normals: tess.normals,
        uvs: tess.uvs,
        uvSets: [{ name: "map1", data: tess.uvs }],
        colors: null,
        tangents: null,
        binormals: null,
        controlPointIndices: null,
        materialIndices: null,
        diagnostics,
    };
}

/** Reads a NurbsCurve geometry node into a tessellated polyline. */
export function extractNurbsCurveGeometry(node: FBXNode, geometryId: number, subdivision: number = DEFAULT_SPAN_SUBDIVISION): FBXCurveGeometryData {
    const name = cleanFBXName(getPropertyValue<string>(node, 1) ?? "NurbsCurve");
    const diagnostics: FBXGeometryDiagnostic[] = [];
    const curve = extractNurbsCurve(node);
    const polyline = curve ? tessellateNurbsCurve(curve, subdivision) : null;
    if (!polyline) {
        diagnostics.push({ type: "nurbs-invalid", message: `NURBS curve '${name}' has an invalid basis and was skipped.` });
    }
    return { id: geometryId, name, kind: "nurbsCurve", polylines: polyline ? [polyline] : [], color: readColor(node), diagnostics };
}

/**
 * Reads a Line geometry node: Points plus PointsIndex where a negative index (~index) ends a segment, as in
 * polygon vertex indices.
 */
export function extractLineGeometry(node: FBXNode, geometryId: number): FBXCurveGeometryData {
    const name = cleanFBXName(getPropertyValue<string>(node, 1) ?? "Line");
    const diagnostics: FBXGeometryDiagnostic[] = [];
    const points = readFloatArray(node, "Points");
    const indexNode = findChildByName(node, "PointsIndex");
    const rawIndices = indexNode ? getNodeArray(indexNode) : null;
    const polylines: Float64Array[] = [];
    if (points && points.length % 3 === 0) {
        const numPoints = points.length / 3;
        const indices: number[] = rawIndices ? Array.from(rawIndices as ArrayLike<number>) : Array.from({ length: numPoints }, (_, i) => i);
        let current: number[] = [];
        const flush = () => {
            if (current.length >= 2) {
                polylines.push(Float64Array.from(current));
            } else if (current.length === 1) {
                diagnostics.push({ type: "degenerate-polygon", message: `Line '${name}' has a single-point segment that was skipped.` });
            }
            current = [];
        };
        for (let i = 0; i < indices.length; i++) {
            let ix = indices[i];
            const ends = ix < 0;
            if (ends) {
                ix = ~ix;
            }
            if (ix >= 0 && ix < numPoints) {
                current.push(points[ix * 3], points[ix * 3 + 1], points[ix * 3 + 2]);
            } else {
                diagnostics.push({ type: "layer-index-out-of-bounds", message: `Line '${name}' references point ${ix} outside its ${numPoints} points.`, index: i });
            }
            if (ends) {
                flush();
            }
        }
        flush();
    }
    return { id: geometryId, name, kind: "line", polylines, color: readColor(node), diagnostics };
}

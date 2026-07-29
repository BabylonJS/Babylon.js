// Vector fill renderer — stencil-then-cover, packaged as a ILayerRenderer for shape layers.
//
// For each compound path, per frame:
//   1. STENCIL pass — draw a triangle fan (contour center → polyline edge) writing the
//      nonzero winding number into the stencil buffer with no triangulation, so concave /
//      self-intersecting / holey shapes (glyph counters) fill correctly.
//   2. COVER pass  — draw the path's bounding quad where stencil != 0, evaluating the
//      solid / linear / radial gradient in the fragment shader, and reset stencil to 0 so
//      the next path starts clean.
//
// STROKES share this renderer. A stroke is expanded (stroke-geometry.ts) into self-overlapping
// segment quads + round-join fans; those are stencilled as a winding-INDEPENDENT union
// (increment-clamp, no culling) and covered once, so a semi-transparent stroke paints at a
// single uniform alpha instead of accumulating where the expanded triangles overlap.
//
// NONZERO WINDING VIA TWO-SIDED STENCIL. The fan is drawn ONCE with face culling disabled,
// incrementing the stencil on front faces (INCR_WRAP) and decrementing it on back faces
// (DECR_WRAP) in the same draw — Babylon's StencilStateComposer emits stencilOpSeparate, so the
// front/back ops are independent. The shader's Y-flip inverts facing consistently, and the cover
// test is the sign-agnostic `!= 0`, so winding direction does not affect fill coverage.
//
// Rendering targets the default framebuffer (MSAA + stencil via engine creation options), so this
// renderer only issues imperative draws — there is no render pass object.

import "core/Engines/Extensions/engine.alpha";
import "core/Engines/Extensions/engine.dynamicBuffer";

import { Constants } from "core/Engines/constants";
import { type DataBuffer } from "core/Buffers/dataBuffer";
import { type Nullable } from "core/types";
import { type ThinEngine } from "core/Engines/thinEngine";

import { type ILayerRenderContext, type ILayerRenderer } from "./layerRenderer";
import { type IContour, type IDrawOp, type IParsedLayer, type IParsedMask, type IStrokeStyle, type ITransform } from "../../animation/parse";
import { type IProp, type IShapeData } from "../../animation/lottieRaw";
import { TransformPoint, BuildLottieMatrixInto, MultiplyMat2DInto, type Mat2D } from "../../animation/matrix2D";
import { SampleEllipse, SampleMulti, SampleRect, SampleScalar, SampleShape } from "../../animation/sample";
import { BuildContourPoints } from "../../animation/geometry";
import { BuildDashedStrokePoints, BuildStrokePoints } from "./strokeGeometry";

const MaxGradientStops = 16; // Max gradient stops
const WindingMask = 0x3f;
const MatteBit = 0x40;
const MaskBit = 0x80;

const StencilVertexShader = `#version 300 es
layout(location = 0) in vec2 position;
uniform vec2 uScreen;
void main() {
  gl_Position = vec4(position.x / uScreen.x * 2.0 - 1.0, 1.0 - position.y / uScreen.y * 2.0, 0.0, 1.0);
}`;

const StencilFragmentShader = `#version 300 es
precision highp float;
layout(location = 0) out vec4 fragColor;
void main() { fragColor = vec4(0.0); }`;

const CoverVertexShader = `#version 300 es
layout(location = 0) in vec2 position;
uniform vec2 uScreen;
out vec2 vScr;
void main() {
  vScr = position;
  gl_Position = vec4(position.x / uScreen.x * 2.0 - 1.0, 1.0 - position.y / uScreen.y * 2.0, 0.0, 1.0);
}`;

const CoverFragmentShader = `#version 300 es
precision highp float;
in vec2 vScr;
layout(location = 0) out vec4 fragColor;
uniform int uKind;        // 0 solid, 1 linear, 2 radial
uniform float uAlpha;
uniform vec4 uSolid;
uniform vec4 uGrad;       // start.xy, end.xy (screen space)
uniform int uStopCount;
uniform float uOffsets[${MaxGradientStops}];
uniform vec4 uColors[${MaxGradientStops}];
vec4 ramp(float t) {
  int n = uStopCount;
  if (t <= uOffsets[0]) { return uColors[0]; }
  for (int i = 0; i + 1 < n; i++) {
    float a = uOffsets[i];
    float b = uOffsets[i + 1];
    if (t >= a && t <= b) {
      float f = (t - a) / max(b - a, 1e-6);
      return mix(uColors[i], uColors[i + 1], f);
    }
  }
  return uColors[n - 1];
}
void main() {
  vec4 rgba;
  if (uKind == 0) {
    rgba = uSolid;
  } else {
    vec2 s = uGrad.xy;
    vec2 e = uGrad.zw;
    float t;
    if (uKind == 1) {
      vec2 d = e - s;
      t = clamp(dot(vScr - s, d) / max(dot(d, d), 1e-6), 0.0, 1.0);
    } else {
      t = clamp(length(vScr - s) / max(length(e - s), 1e-6), 0.0, 1.0);
    }
    rgba = ramp(t);
  }
  float a = rgba.a * uAlpha;
  fragColor = vec4(rgba.rgb * a, a);
}`;

interface IFillDraw {
    /** Stroke draws stencil a winding-independent union; fills use nonzero winding. */
    stroke: boolean;
    fanFirst: number;
    fanCount: number;
    coverFirst: number;
    coverCount: number;
    paintIndex: number;
}

function SamplePoint(prop: IProp | undefined, frame: number, dx: number, dy: number, out: number[]): void {
    out[0] = dx;
    out[1] = dy;
    SampleMulti(prop, frame, out);
}

function BuildTransformMatrixInto(t: ITransform, frame: number, a: number[], p: number[], s: number[], out: Mat2D): void {
    SamplePoint(t.a, frame, 0, 0, a);
    SamplePoint(t.p, frame, 0, 0, p);
    SamplePoint(t.s, frame, 100, 100, s);
    const rot = SampleScalar(t.r, frame, 0);
    BuildLottieMatrixInto(a, p, s, rot, out);
}

// Sample a contour's source (bezier path, rect, or ellipse) into an IShapeData, or null.
function SampleContour(contour: IContour, frame: number, out: IShapeData): IShapeData | null {
    return contour.rect
        ? SampleRect(contour.rect, frame, out)
        : contour.ellipse
          ? SampleEllipse(contour.ellipse, frame, out)
          : contour.path
            ? SampleShape(contour.path, frame, out)
            : null;
}

// Push the 6-vertex cover quad (the 1px-inflated bounds rect) that drives the cover /
// mask-resolve / teardown stencil passes.
function PushCoverQuad(verts: number[], minx: number, miny: number, maxx: number, maxy: number): void {
    verts.push(minx - 1, miny - 1, maxx + 1, miny - 1, minx - 1, maxy + 1, minx - 1, maxy + 1, maxx + 1, miny - 1, maxx + 1, maxy + 1);
}

// Append one contour's winding fan (contour center -> each polyline edge) to `verts`, expanding
// the running union bounds `[minx, miny, maxx, maxy]`. Returns the fan's vertex count.
function EmitWindingFan(pts: number[], np: number, verts: number[], bounds: number[]): number {
    let cMinx = Infinity;
    let cMiny = Infinity;
    let cMaxx = -Infinity;
    let cMaxy = -Infinity;
    for (let k = 0; k < np; k++) {
        const x = pts[k * 2];
        const y = pts[k * 2 + 1];
        if (x < cMinx) {
            cMinx = x;
        }
        if (y < cMiny) {
            cMiny = y;
        }
        if (x > cMaxx) {
            cMaxx = x;
        }
        if (y > cMaxy) {
            cMaxy = y;
        }
    }
    const cx = (cMinx + cMaxx) * 0.5;
    const cy = (cMiny + cMaxy) * 0.5;
    for (let k = 0; k < np - 1; k++) {
        verts.push(cx, cy, pts[k * 2], pts[k * 2 + 1], pts[(k + 1) * 2], pts[(k + 1) * 2 + 1]);
    }
    if (cMinx < bounds[0]) {
        bounds[0] = cMinx;
    }
    if (cMiny < bounds[1]) {
        bounds[1] = cMiny;
    }
    if (cMaxx > bounds[2]) {
        bounds[2] = cMaxx;
    }
    if (cMaxy > bounds[3]) {
        bounds[3] = cMaxy;
    }
    return (np - 1) * 3;
}

/** Create the vector (shape-layer) renderer. Renders fills and strokes, each painted with a solid
 *  color or a linear / radial gradient.
 * @param engine The engine to render with. Must have been created with a stencil buffer.
 * @returns A layer renderer for Lottie shape layers (`ty === 4`).
 */
export function CreateFillRenderer(engine: ThinEngine): ILayerRenderer {
    const stencilEffect = engine.createEffect({ vertexSource: StencilVertexShader, fragmentSource: StencilFragmentShader }, ["position"], ["uScreen"], []);
    const coverEffect = engine.createEffect(
        { vertexSource: CoverVertexShader, fragmentSource: CoverFragmentShader },
        ["position"],
        ["uScreen", "uKind", "uAlpha", "uSolid", "uGrad", "uStopCount", "uOffsets", "uColors"],
        []
    );
    const stencil = engine.stencilState;

    // Per-frame accumulation + scratch (reused across frames to avoid GC churn).
    const verts: number[] = [];
    const draws: IFillDraw[] = [];
    const ranges: number[] = []; // token -> (drawStart, drawCount) pairs
    const pts: number[] = [];
    const a = [0, 0];
    const p = [0, 0];
    const s = [100, 100];
    const g0 = [0, 0, 0, 1];
    const g1 = [0, 0];
    const gradientStart: [number, number] = [0, 0];
    const gradientEnd: [number, number] = [0, 0];
    const groupMatrix: Mat2D = [1, 0, 0, 1, 0, 0];
    const transformMatrix: Mat2D = [1, 0, 0, 1, 0, 0];
    const shapeScratch: IShapeData = { v: [], i: [], o: [], c: false };
    let drawCount = 0;

    // Flat per-draw paint store (indexed by IFillDraw.paintIndex).
    const pKind: number[] = [];
    const pAlpha: number[] = [];
    const pSolid: number[] = []; // 4 per draw
    const pGrad: number[] = []; // 4 per draw
    const pStopCount: number[] = [];
    const pOff: number[] = []; // MAX_GRADIENT_STOPS per draw
    const pCol: number[] = []; // MAX_GRADIENT_STOPS * 4 per draw

    // Uniform upload scratch (avoid per-draw allocation).
    const offScratch = new Float32Array(MaxGradientStops);
    const colScratch = new Float32Array(MaxGradientStops * 4);

    // Per-token mask geometry (parallel to `ranges`, indexed by token). maskHas gates the masked
    // render path; the fan is the mask path's winding triangles and the bbox quad drives the
    // resolve + teardown stencil passes.
    const maskHas: boolean[] = [];
    const maskFanFirst: number[] = [];
    const maskFanCount: number[] = [];
    const maskBboxFirst: number[] = [];

    let vbo: Nullable<DataBuffer> = null;
    let vertData = new Float32Array(0);
    let vertCapacity = 0; // in floats
    // `bindBuffersDirectly` binds an index buffer alongside the attributes, but every draw here is
    // a `drawArraysType` over a tightly packed vertex stream. One tiny throwaway index buffer
    // satisfies the binding API without paying for a per-vertex identity index array.
    let unusedIb: Nullable<DataBuffer> = null;

    // Scratch union bounds [minx, miny, maxx, maxy] for the current emit, reset at each emit's start.
    const bnds = [0, 0, 0, 0];

    function writePaintBlock(op: IDrawOp, m: Mat2D, frame: number, alpha: number): number {
        const idx = pKind.length;
        const paint = op.paint;
        if (paint.kind === "solid") {
            pKind.push(0);
            pAlpha.push(alpha);
            g0[0] = 0;
            g0[1] = 0;
            g0[2] = 0;
            g0[3] = 1;
            SampleMulti(paint.color, frame, g0);
            pSolid.push(g0[0], g0[1], g0[2], g0[3]);
            pGrad.push(0, 0, 0, 0);
            pStopCount.push(0);
            for (let i = 0; i < MaxGradientStops; i++) {
                pOff.push(0);
            }
            for (let i = 0; i < MaxGradientStops * 4; i++) {
                pCol.push(0);
            }
            return idx;
        }
        // Linear / radial gradient.
        pKind.push(paint.kind === "radial" ? 2 : 1);
        pAlpha.push(alpha);
        pSolid.push(0, 0, 0, 0);
        SamplePoint(paint.start, frame, 0, 0, g0);
        SamplePoint(paint.end, frame, 0, 0, g1);
        TransformPoint(m, g0[0], g0[1], gradientStart);
        TransformPoint(m, g1[0], g1[1], gradientEnd);
        pGrad.push(gradientStart[0], gradientStart[1], gradientEnd[0], gradientEnd[1]);
        const sourceStopCount = paint.stops.count;
        const stopCount = Math.min(sourceStopCount, MaxGradientStops);
        pStopCount.push(stopCount);
        for (let i = 0; i < MaxGradientStops; i++) {
            const sourceIndex = sourceStopCount > MaxGradientStops && i < stopCount ? Math.round((i * (sourceStopCount - 1)) / (stopCount - 1)) : i;
            pOff.push(i < stopCount ? paint.stops.offsets[sourceIndex] : 0);
        }
        for (let i = 0; i < MaxGradientStops; i++) {
            if (i < stopCount) {
                const sourceIndex = sourceStopCount > MaxGradientStops ? Math.round((i * (sourceStopCount - 1)) / (stopCount - 1)) : i;
                const c = paint.stops.colors[sourceIndex];
                pCol.push(c[0], c[1], c[2], c[3]);
            } else {
                pCol.push(0, 0, 0, 0);
            }
        }
        return idx;
    }

    function storeDraw(stroke: boolean, fanFirst: number, fanCount: number, coverFirst: number, paintIndex: number): void {
        let draw = draws[drawCount];
        if (!draw) {
            draw = { stroke, fanFirst, fanCount, coverFirst, coverCount: 6, paintIndex };
            draws.push(draw);
        } else {
            draw.stroke = stroke;
            draw.fanFirst = fanFirst;
            draw.fanCount = fanCount;
            draw.coverFirst = coverFirst;
            draw.paintIndex = paintIndex;
        }
        drawCount++;
    }

    function emitOp(op: IDrawOp, worldLayer: Mat2D, frame: number, layerAlpha: number): void {
        // Compose the enclosing groups outermost-first; each contributes its transform and opacity.
        for (let i = 0; i < 6; i++) {
            groupMatrix[i] = worldLayer[i];
        }
        let groupOpacity = 1;
        for (const groupTransform of op.groupTransforms) {
            BuildTransformMatrixInto(groupTransform, frame, a, p, s, transformMatrix);
            MultiplyMat2DInto(groupMatrix, transformMatrix, groupMatrix);
            groupOpacity *= SampleScalar(groupTransform.o, frame, 100) / 100;
        }
        const m = groupMatrix;
        const paintOpacity = SampleScalar(op.paintOpacity, frame, 100) / 100;
        const alpha = layerAlpha * groupOpacity * paintOpacity;
        if (alpha <= 0.0001) {
            return;
        }

        if (op.stroke) {
            emitStroke(op, op.stroke, m, frame, alpha);
            return;
        }

        // Fill: stencil ALL contours of the compound path together so opposite-winding
        // counters (glyph holes) cancel in the overlap region (nonzero winding), then cover once.
        const fanFirst = verts.length / 2;
        let fanCount = 0;
        bnds[0] = Infinity;
        bnds[1] = Infinity;
        bnds[2] = -Infinity;
        bnds[3] = -Infinity;
        for (const contour of op.contours) {
            const shape = SampleContour(contour, frame, shapeScratch);
            if (!shape) {
                continue;
            }
            pts.length = 0;
            const np = BuildContourPoints(shape, m, pts);
            if (np < 2) {
                continue;
            }
            fanCount += EmitWindingFan(pts, np, verts, bnds);
        }
        if (fanCount === 0) {
            return;
        }

        const coverFirst = verts.length / 2;
        PushCoverQuad(verts, bnds[0], bnds[1], bnds[2], bnds[3]);

        const paintIndex = writePaintBlock(op, m, frame, alpha);
        storeDraw(false, fanFirst, fanCount, coverFirst, paintIndex);
    }

    function emitStroke(op: IDrawOp, style: IStrokeStyle, m: Mat2D, frame: number, alpha: number): void {
        // Stroke width and dash lengths scale with the transform; work in screen pixels.
        const scale = Math.hypot(m[0], m[1]);
        const halfWidth = (SampleScalar(style.width, frame, 0) * scale) / 2;
        if (halfWidth <= 0) {
            return;
        }
        // Lottie line caps: 1 butt (the spec default when absent), 2 round, 3 square. Square is
        // approximated as butt.
        const roundCaps = style.lineCap === 2;
        const dashLength = style.dash ? SampleScalar(style.dash.dash, frame, 0) * scale : 0;
        const gapLength = style.dash ? SampleScalar(style.dash.gap, frame, 0) * scale : 0;
        const dashOffset = style.dash ? SampleScalar(style.dash.offset, frame, 0) * scale : 0;
        const dashed = dashLength > 0 && gapLength > 0;
        const fanFirst = verts.length / 2;
        let fanCount = 0;
        bnds[0] = Infinity;
        bnds[1] = Infinity;
        bnds[2] = -Infinity;
        bnds[3] = -Infinity;
        for (const contour of op.contours) {
            const shape = SampleContour(contour, frame, shapeScratch);
            if (!shape) {
                continue;
            }
            pts.length = 0;
            const np = BuildContourPoints(shape, m, pts);
            if (np < 2) {
                continue;
            }
            const before = verts.length;
            fanCount += dashed
                ? BuildDashedStrokePoints(pts, np, halfWidth, shape.c, dashLength, gapLength, dashOffset, verts, roundCaps)
                : BuildStrokePoints(pts, np, halfWidth, shape.c, verts, roundCaps);
            // The expanded stroke triangles bound the cover quad.
            for (let vi = before; vi < verts.length; vi += 2) {
                const x = verts[vi];
                const y = verts[vi + 1];
                if (x < bnds[0]) {
                    bnds[0] = x;
                }
                if (y < bnds[1]) {
                    bnds[1] = y;
                }
                if (x > bnds[2]) {
                    bnds[2] = x;
                }
                if (y > bnds[3]) {
                    bnds[3] = y;
                }
            }
        }
        if (fanCount === 0) {
            return;
        }
        const coverFirst = verts.length / 2;
        PushCoverQuad(verts, bnds[0], bnds[1], bnds[2], bnds[3]);
        const paintIndex = writePaintBlock(op, m, frame, alpha);
        storeDraw(true, fanFirst, fanCount, coverFirst, paintIndex);
    }

    // Build a layer's mask geometry into `verts`: a winding fan for each supported (add-mode,
    // non-inverted) mask path, plus a union bounding quad used by the resolve + teardown stencil
    // passes. Returns the fan/bbox offsets, or null when the layer has no renderable mask. Other
    // mask modes (subtract / intersect / inverted) are intentionally ignored for now, so the layer
    // renders unclipped rather than wrongly clipped.
    function emitMask(masks: IParsedMask[], world: Mat2D, frame: number): { fanFirst: number; fanCount: number; bboxFirst: number } | null {
        const fanFirst = verts.length / 2;
        let fanCount = 0;
        bnds[0] = Infinity;
        bnds[1] = Infinity;
        bnds[2] = -Infinity;
        bnds[3] = -Infinity;
        for (const mask of masks) {
            if (mask.mode !== "a" || mask.inverted) {
                continue;
            }
            const shape = SampleShape(mask.path, frame, shapeScratch);
            pts.length = 0;
            const np = BuildContourPoints(shape, world, pts);
            if (np < 2) {
                continue;
            }
            fanCount += EmitWindingFan(pts, np, verts, bnds);
        }
        if (fanCount === 0) {
            return null;
        }
        const bboxFirst = verts.length / 2;
        PushCoverQuad(verts, bnds[0], bnds[1], bnds[2], bnds[3]);
        return { fanFirst, fanCount, bboxFirst };
    }

    function ensureBuffers(vec2Count: number): void {
        const neededFloats = Math.max(vec2Count * 2, 2);
        if (!vbo || vertCapacity < neededFloats) {
            if (vbo) {
                engine._releaseBuffer(vbo);
            }
            vertCapacity = Math.max(neededFloats, Math.ceil((vertCapacity || 8192) * 1.5));
            vertData = new Float32Array(vertCapacity);
            vbo = engine.createDynamicVertexBuffer(vertData);
        }
        if (!unusedIb) {
            unusedIb = engine.createIndexBuffer(new Uint16Array([0, 1, 2]));
        }
    }

    const isReady = (): boolean => stencilEffect.isReady() && coverEffect.isReady();

    // Bind the shared single-vec2 attribute layout. Both programs pin `position` to location 0,
    // so one binding serves the stencil and cover passes alike.
    function bindGeometry(): void {
        if (vbo && unusedIb) {
            engine.bindBuffersDirectly(vbo, unusedIb, [2], 2 * Float32Array.BYTES_PER_ELEMENT, stencilEffect);
        }
    }

    // Apply a stencil configuration. The composer defers the GL calls until the next draw.
    function setStencil(func: number, ref: number, funcMask: number, writeMask: number, opPass: number, backOpPass: number): void {
        stencil.stencilTest = true;
        stencil.stencilMask = writeMask;
        stencil.stencilFunc = func;
        stencil.stencilBackFunc = func;
        stencil.stencilFuncRef = ref;
        stencil.stencilFuncMask = funcMask;
        stencil.stencilOpStencilFail = Constants.KEEP;
        stencil.stencilOpDepthFail = Constants.KEEP;
        stencil.stencilOpStencilDepthPass = opPass;
        stencil.stencilBackOpStencilFail = Constants.KEEP;
        stencil.stencilBackOpDepthFail = Constants.KEEP;
        stencil.stencilBackOpStencilDepthPass = backOpPass;
    }

    function stencilGeometry(stroke: boolean, fanFirst: number, fanCount: number, func: number, ref: number, funcMask: number): void {
        engine.enableEffect(stencilEffect);
        engine.setColorWrite(false);
        engine.setState(false);
        if (stroke) {
            // Strokes are a winding-INDEPENDENT union: the expanded segment quads self-overlap, so
            // increment-with-clamp on both faces keeps coverage binary and paints one flat alpha.
            setStencil(func, ref, funcMask, WindingMask, Constants.INCR, Constants.INCR);
        } else {
            // Nonzero winding in a single draw: front faces wind up, back faces wind down.
            setStencil(func, ref, funcMask, WindingMask, Constants.INCR_WRAP, Constants.DECR_WRAP);
        }
        engine.drawArraysType(Constants.MATERIAL_TriangleFillMode, fanFirst, fanCount);
    }

    function resolveClip(coverFirst: number, bit: number): void {
        engine.setState(false);
        setStencil(Constants.NOTEQUAL, bit, WindingMask, WindingMask | bit, Constants.REPLACE, Constants.REPLACE);
        engine.drawArraysType(Constants.MATERIAL_TriangleFillMode, coverFirst, 6);
    }

    function setupLayerMask(token: number): void {
        stencilGeometry(false, maskFanFirst[token], maskFanCount[token], Constants.ALWAYS, 0, WindingMask);
        resolveClip(maskBboxFirst[token], MaskBit);
    }

    function clearLayerMask(token: number): void {
        engine.enableEffect(stencilEffect);
        engine.setColorWrite(false);
        engine.setState(false);
        setStencil(Constants.ALWAYS, 0, 0xff, MaskBit, Constants.REPLACE, Constants.REPLACE);
        engine.drawArraysType(Constants.MATERIAL_TriangleFillMode, maskBboxFirst[token], 6);
    }

    function setupMatte(token: number): void {
        const drawStart = ranges[token * 2];
        const drawCount = ranges[token * 2 + 1];
        if (maskHas[token]) {
            setupLayerMask(token);
        }
        for (let i = 0; i < drawCount; i++) {
            const d = draws[drawStart + i];
            stencilGeometry(
                d.stroke,
                d.fanFirst,
                d.fanCount,
                maskHas[token] ? Constants.EQUAL : Constants.ALWAYS,
                maskHas[token] ? MaskBit : 0,
                maskHas[token] ? MaskBit : WindingMask
            );
            resolveClip(d.coverFirst, MatteBit);
        }
        if (maskHas[token]) {
            clearLayerMask(token);
        }
    }

    function clearMatte(token: number): void {
        const drawStart = ranges[token * 2];
        const drawCount = ranges[token * 2 + 1];
        engine.enableEffect(stencilEffect);
        engine.setColorWrite(false);
        engine.setState(false);
        setStencil(Constants.ALWAYS, 0, 0xff, MatteBit, Constants.REPLACE, Constants.REPLACE);
        for (let i = 0; i < drawCount; i++) {
            const d = draws[drawStart + i];
            engine.drawArraysType(Constants.MATERIAL_TriangleFillMode, d.coverFirst, d.coverCount);
        }
    }

    return {
        kind: 4,
        isReady,
        beginFrame() {
            verts.length = 0;
            drawCount = 0;
            ranges.length = 0;
            pKind.length = 0;
            pAlpha.length = 0;
            pSolid.length = 0;
            pGrad.length = 0;
            pStopCount.length = 0;
            pOff.length = 0;
            pCol.length = 0;
            maskHas.length = 0;
            maskFanFirst.length = 0;
            maskFanCount.length = 0;
            maskBboxFirst.length = 0;
        },
        emitLayer(layer: IParsedLayer, world: Mat2D, layerAlpha: number, ctx: ILayerRenderContext): number {
            const drawStart = drawCount;
            // Lottie renders shape items back-to-front: iterate in reverse array order.
            for (let oi = layer.ops.length - 1; oi >= 0; oi--) {
                emitOp(layer.ops[oi], world, ctx.frame, layerAlpha);
            }
            const count = drawCount - drawStart;
            if (count === 0) {
                return -1;
            }
            // Build mask geometry AFTER content, so a layer that emits nothing pays nothing for it.
            const mask = layer.masks ? emitMask(layer.masks, world, ctx.frame) : null;
            const token = ranges.length / 2;
            ranges.push(drawStart, count);
            maskHas[token] = mask !== null;
            maskFanFirst[token] = mask ? mask.fanFirst : 0;
            maskFanCount[token] = mask ? mask.fanCount : 0;
            maskBboxFirst[token] = mask ? mask.bboxFirst : 0;
            return token;
        },
        flush(ctx: ILayerRenderContext) {
            const vertexCount = verts.length / 2;
            ensureBuffers(Math.max(vertexCount, 1));
            if (vertexCount > 0 && vbo) {
                vertData.set(verts);
                engine.updateDynamicVertexBuffer(vbo, vertData, 0, verts.length * Float32Array.BYTES_PER_ELEMENT);
            }
            // uScreen is constant per frame; Effect caches uniform values, so set on both programs.
            engine.enableEffect(stencilEffect);
            stencilEffect.setFloat2("uScreen", ctx.screenW, ctx.screenH);
            engine.enableEffect(coverEffect);
            coverEffect.setFloat2("uScreen", ctx.screenW, ctx.screenH);
        },
        recordLayer(token: number, matteToken?: number) {
            const drawStart = ranges[token * 2];
            const drawCount = ranges[token * 2 + 1];
            if (drawCount === 0 || !vbo || !unusedIb) {
                return;
            }
            // (Re)bind our single position attribute. Sibling renderers (text / image) bind their
            // own interleaved layouts and layers interleave by z-order, so restore ours before
            // each layer's draws rather than once per frame.
            bindGeometry();
            const masked = maskHas[token];
            const matted = matteToken !== undefined;

            if (matted) {
                setupMatte(matteToken);
            }
            if (masked) {
                setupLayerMask(token);
            }

            const clipBits = (masked ? MaskBit : 0) | (matted ? MatteBit : 0);
            const cFunc = clipBits ? Constants.EQUAL : Constants.ALWAYS;
            const cFuncMask = clipBits || WindingMask;

            for (let i = 0; i < drawCount; i++) {
                const d = draws[drawStart + i];
                stencilGeometry(d.stroke, d.fanFirst, d.fanCount, cFunc, clipBits, cFuncMask);

                // ── COVER pass: paint where winding (low bits) != 0, reset the winding to 0 while
                //    preserving the mask/matte bits, blend premultiplied.
                engine.enableEffect(coverEffect);
                const pi = d.paintIndex;
                coverEffect.setInt("uKind", pKind[pi]);
                coverEffect.setFloat("uAlpha", pAlpha[pi]);
                coverEffect.setFloat4("uSolid", pSolid[pi * 4], pSolid[pi * 4 + 1], pSolid[pi * 4 + 2], pSolid[pi * 4 + 3]);
                coverEffect.setFloat4("uGrad", pGrad[pi * 4], pGrad[pi * 4 + 1], pGrad[pi * 4 + 2], pGrad[pi * 4 + 3]);
                coverEffect.setInt("uStopCount", pStopCount[pi]);
                for (let k = 0; k < MaxGradientStops; k++) {
                    offScratch[k] = pOff[pi * MaxGradientStops + k];
                }
                for (let k = 0; k < MaxGradientStops * 4; k++) {
                    colScratch[k] = pCol[pi * MaxGradientStops * 4 + k];
                }
                coverEffect.setFloatArray("uOffsets", offScratch);
                coverEffect.setFloatArray4("uColors", colScratch);
                engine.setColorWrite(true);
                engine.setState(false);
                engine.setAlphaMode(Constants.ALPHA_PREMULTIPLIED);
                setStencil(Constants.NOTEQUAL, 0, WindingMask, WindingMask, Constants.ZERO, Constants.ZERO);
                engine.drawArraysType(Constants.MATERIAL_TriangleFillMode, d.coverFirst, d.coverCount);
            }

            if (masked) {
                clearLayerMask(token);
            }
            if (matted) {
                clearMatte(matteToken);
            }
        },
        dispose() {
            if (vbo) {
                engine._releaseBuffer(vbo);
                vbo = null;
            }
            if (unusedIb) {
                engine._releaseBuffer(unusedIb);
                unusedIb = null;
            }
            stencilEffect.dispose();
            coverEffect.dispose();
        },
    };
}

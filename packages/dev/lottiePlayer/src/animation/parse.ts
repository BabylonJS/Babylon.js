// Parse: walk a Lottie document's shape layers into a flat, plain-data draw list.
// We keep animatable values as raw props (sampled per frame); only the static
// gradient stops are pre-parsed.

import { type IColor4Like } from "core/Maths/math.like";
import { type IAsset, type IFontDef, type ILayer, type ILottieFile, type IProp, type IShapeItem, type IStrokeDashEntry } from "./lottieRaw";

/** A map of placeholder text → replacement string, applied at parse time to text-layer content for
 *  runtime localization. A text layer whose raw content EXACTLY matches a key is rendered with the
 *  mapped value instead (whole-string match, mirroring the original Babylon.js Lottie player). */
export type LottieVariables = Readonly<Record<string, string>>;

/** Options for the Lottie player factory. */
export interface ILottiePlayerOptions {
    /** Runtime text substitutions for localization — see {@link LottieVariables}. */
    variables?: LottieVariables;
    /** Color the canvas is cleared to before each frame. Defaults to opaque black, matching
     *  the sprite renderer's `AnimationConfiguration.backgroundColor`. Use an alpha of 0 for a
     *  transparent canvas. */
    backgroundColor?: IColor4Like;
}

export interface IGradientStops {
    count: number;
    /** Stop offsets in [0,1], length `count`. */
    offsets: number[];
    /** Stop colors as [r,g,b,a] in [0,1], length `count`. */
    colors: number[][];
}

export interface ISolidPaint {
    kind: "solid";
    /** rgba color prop (components 0–1). */
    color: IProp;
}

export interface IGradientPaint {
    kind: "linear" | "radial";
    /** Gradient start point (shape-local). */
    start: IProp;
    /** Gradient end point (shape-local). */
    end: IProp;
    stops: IGradientStops;
}

/** Dash pattern for a stroked path. Lengths are in shape-local units. */
export interface IDashPattern {
    dash: IProp;
    gap: IProp;
    /** Distance the pattern is shifted along the path. */
    offset?: IProp;
}

/** Stroke styling for a draw op. Present on stroke ops (`st` / `gs`), absent on fills. */
export interface IStrokeStyle {
    /** Stroke width prop (shape-local units). */
    width: IProp;
    dash?: IDashPattern;
    /** Line cap: 1 butt, 2 round, 3 square. */
    lineCap?: number;
}

/** How a draw op's coverage is colored. Independent of whether that coverage is a fill or a stroke. */
export type Paint = ISolidPaint | IGradientPaint;

/** A rectangle primitive source (center, size, corner roundness). */
export interface IRectSource {
    /** Center position. */
    p: IProp;
    /** Size [w, h]. */
    s: IProp;
    /** Corner roundness (radius). */
    r?: IProp;
}

/** An ellipse primitive source (center, size). */
export interface IEllipseSource {
    /** Center position. */
    p: IProp;
    /** Size [w, h] (diameters). */
    s: IProp;
}

/** One contour of a (possibly compound) shape: a bezier path, a rect, or an ellipse. */
export interface IContour {
    path?: IProp;
    rect?: IRectSource;
    ellipse?: IEllipseSource;
}

/** Lottie transform fields (anchor, position, scale, rotation, opacity). */
export interface ITransform {
    a?: IProp;
    p?: IProp;
    s?: IProp;
    r?: IProp;
    o?: IProp;
}

export interface IDrawOp {
    /**
     * Contours filled together as ONE compound path. Multiple contours with opposite winding
     * (e.g. a glyph outline + its counter) produce holes via the nonzero winding rule — they
     * are stencilled together before a single cover pass.
     */
    contours: IContour[];
    /** The enclosing groups' transforms, outermost first. Applied in order under the layer transform. */
    groupTransforms: ITransform[];
    paint: Paint;
    /** When set, the contours are stroked with this style instead of filled. */
    stroke?: IStrokeStyle;
    /** Paint opacity (0–100), if any. */
    paintOpacity?: IProp;
}

/** A decoded reference to an image asset (resolved from a layer's `refId`). */
export interface IParsedImage {
    /** Index into `IParsedAnimation.assets`. */
    assetIndex: number;
    width: number;
    height: number;
}

/** A parsed text document (resolved to a CSS-ready font). */
export interface IParsedText {
    text: string;
    /** CSS font family (e.g. "Segoe UI"). */
    family: string;
    /** CSS font weight (e.g. 400, 600, 700). */
    weight: number;
    /** CSS font style ("normal" | "italic"). */
    style: string;
    /** Font size in px. */
    size: number;
    /** Fill color [r,g,b,a] in 0–1. */
    color: [number, number, number, number];
    /** Justify: 0 left, 1 right, 2 center. */
    justify: number;
    /** Letter spacing in px. */
    letterSpacing: number;
    /** Line height in px. */
    lineHeight: number;
    /** Box width (boxed/paragraph text wraps within this; undefined for point text). */
    boxW?: number;
    /** Box height. */
    boxH?: number;
    /** Box top-left X in layer-local space. */
    boxX?: number;
    /** Box top-left Y in layer-local space. */
    boxY?: number;
}

/** An image asset with its (possibly embedded) source URI. */
export interface IParsedAsset {
    id: string;
    width: number;
    height: number;
    /** Path or `data:` URI. */
    src: string;
}

/** A parsed layer mask. The path is sampled per frame (it can morph). */
export interface IParsedMask {
    /** Mask mode: "a" add, "s" subtract, "i" intersect, etc. Only "a" (add) is rendered today. */
    mode: string;
    /** Inverted (mask the OUTSIDE of the path). */
    inverted: boolean;
    /** Mask path (animatable shape). */
    path: IProp;
    /** Mask opacity prop (0–100), if any. */
    opacity?: IProp;
}

export interface IParsedLayer {
    /** Lottie layer type (`4` shape, `2` image, `3` null/transform-only). Renderers dispatch on this. */
    kind: number;
    /** ILayer index (`ind`), used to resolve parent references. */
    ind: number;
    /** Parent layer index, for transform chaining. */
    parent?: number;
    name: string;
    transform: ITransform;
    ip: number;
    op: number;
    st: number;
    /** Shape draw ops in Lottie array order (render back-to-front == iterate in reverse). */
    ops: IDrawOp[];
    /** Image reference, for image layers. */
    image?: IParsedImage;
    /** Text document, for text layers. */
    text?: IParsedText;
    /** ILayer masks (clip the layer's content). Undefined when the layer has none. */
    masks?: IParsedMask[];
    /** Track-matte mode on this consumer. Only alpha (`1`) is rendered today. */
    matteMode?: number;
    /** `ind` of the matte source layer. */
    matteSource?: number;
    /** This layer supplies matte coverage and is not painted independently. */
    matteOnly?: boolean;
}

export interface IParsedAnimation {
    width: number;
    height: number;
    ip: number;
    op: number;
    fr: number;
    layers: IParsedLayer[];
    assets: IParsedAsset[];
}

function ParseStops(g: { p: number; k: IProp }): IGradientStops {
    const raw = (g.k.a === 1 ? (g.k.k as { s: number[] }[])[0].s : g.k.k) as number[];
    const count = g.p;
    const offsets: number[] = [];
    const colors: number[][] = [];
    for (let i = 0; i < count; i++) {
        offsets.push(raw[i * 4]);
        colors.push([raw[i * 4 + 1], raw[i * 4 + 2], raw[i * 4 + 3], 1]);
    }
    // Optional alpha stops follow the color stops as [offset, alpha] pairs.
    const alphaStart = count * 4;
    if (raw.length > alphaStart) {
        const alphaCount = Math.floor((raw.length - alphaStart) / 2);
        for (let i = 0; i < alphaCount && i < count; i++) {
            colors[i][3] = raw[alphaStart + i * 2 + 1];
        }
    }
    return { count, offsets, colors };
}

function ParseGradient(it: IShapeItem): IGradientPaint {
    return {
        kind: it.t === 2 ? "radial" : "linear",
        start: it.s as IProp,
        end: it.e as IProp,
        stops: ParseStops(it.g as { p: number; k: IProp }),
    };
}

// Dash entries are role-tagged rather than positional: "d" dash, "g" gap, "o" offset.
// A pattern needs both a dash and a gap to mean anything, so anything else renders solid.
function ParseDash(entries: IStrokeDashEntry[] | undefined): IDashPattern | undefined {
    if (!Array.isArray(entries)) {
        return undefined;
    }
    let dash: IProp | undefined;
    let gap: IProp | undefined;
    let offset: IProp | undefined;
    for (const entry of entries) {
        if (entry.n === "d") {
            dash = entry.v;
        } else if (entry.n === "g") {
            gap = entry.v;
        } else if (entry.n === "o") {
            offset = entry.v;
        }
    }
    return dash && gap ? { dash, gap, offset } : undefined;
}

function ParseStrokeStyle(it: IShapeItem): IStrokeStyle {
    return { width: it.w as IProp, dash: ParseDash(it.d), lineCap: it.lc };
}

/** A paint collected from a shape group, with the stroke style when it is a stroke. */
interface IGroupPaint {
    paint: Paint;
    opacity?: IProp;
    stroke?: IStrokeStyle;
}

// Walk a shape tree level. Two passes, because Lottie puts a group's transform and its layer-level
// decorators AFTER the nested groups they apply to: the first pass collects this level's contours,
// transform and paints, the second recurses with them in hand.
function WalkGroup(items: IShapeItem[], ops: IDrawOp[], parentTransforms: ITransform[], inheritedPaints: IGroupPaint[]): void {
    // A group's paths/rects combine into one compound shape that its fill(s) paint together.
    const contours: IContour[] = [];
    let transform: ITransform | undefined;
    const paints: IGroupPaint[] = [];

    for (const it of items) {
        if (it.hd) {
            continue;
        }
        switch (it.ty) {
            case "sh":
                if (it.ks) {
                    contours.push({ path: it.ks });
                }
                break;
            case "rc":
                // Rect primitive: p center, s size, r corner roundness (IShapeItem.r is typed as fill rule).
                contours.push({ rect: { p: it.p as IProp, s: it.s as IProp, r: it.r as unknown as IProp | undefined } });
                break;
            case "el":
                // Ellipse primitive: p center, s size (diameters).
                contours.push({ ellipse: { p: it.p as IProp, s: it.s as IProp } });
                break;
            case "tr": {
                // On a transform item `r` is the rotation prop (IShapeItem.r is typed as the fill rule).
                const rotation = it.r as unknown as IProp | undefined;
                transform = { a: it.a, p: it.p, s: it.s, r: rotation, o: it.o };
                break;
            }
            case "fl":
                paints.push({ paint: { kind: "solid", color: it.c as IProp }, opacity: it.o });
                break;
            case "gf":
                paints.push({ paint: ParseGradient(it), opacity: it.o });
                break;
            case "st":
                if (it.w) {
                    paints.push({ paint: { kind: "solid", color: it.c as IProp }, opacity: it.o, stroke: ParseStrokeStyle(it) });
                }
                break;
            case "gs":
                if (it.w) {
                    paints.push({ paint: ParseGradient(it), opacity: it.o, stroke: ParseStrokeStyle(it) });
                }
                break;
        }
    }

    const transforms = transform ? [...parentTransforms, transform] : parentTransforms;
    // A nested group without its own paints inherits this level's, which is how a layer-level fill
    // paints its sibling groups.
    const effectivePaints = paints.length > 0 ? paints : inheritedPaints;

    for (const it of items) {
        if (!it.hd && it.ty === "gr") {
            WalkGroup(it.it ?? [], ops, transforms, effectivePaints);
        }
    }

    if (contours.length > 0) {
        for (const pt of effectivePaints) {
            ops.push({ contours, groupTransforms: transforms, paint: pt.paint, stroke: pt.stroke, paintOpacity: pt.opacity });
        }
    }
}

// Derive a CSS weight + style from a Lottie font definition (name + style string).
function GetFontWeightStyle(def: IFontDef | undefined, fontName: string): { weight: number; style: string } {
    // Match against the style string and font name together (either may carry the weight/italic hint);
    // the space keeps tokens from fusing across the boundary (e.g. "…semi" + "bold…").
    const s = ((def?.fStyle ?? "") + " " + (def?.fName ?? fontName)).toLowerCase();
    let weight = 400;
    if (/black|heavy/.test(s)) {
        weight = 900;
    } else if (/semibold|demibold/.test(s)) {
        weight = 600;
    } else if (/bold/.test(s)) {
        weight = 700;
    } else if (/medium/.test(s)) {
        weight = 500;
    } else if (/light/.test(s)) {
        weight = 300;
    }
    const italic = /italic|oblique/.test(s);
    return { weight, style: italic ? "italic" : "normal" };
}

function ParseText(layer: ILayer, fonts: Map<string, IFontDef>, variables?: LottieVariables): IParsedText | undefined {
    const doc = layer.t?.d?.k?.[0]?.s;
    if (!doc) {
        return undefined;
    }
    const def = fonts.get(doc.f);
    const { weight, style } = GetFontWeightStyle(def, doc.f);
    const family = def?.fFamily?.split(",")[0]?.replace(/['"]/g, "").trim() || "sans-serif";
    const fc = doc.fc ?? [0, 0, 0];
    const size = doc.s ?? 16;
    const boxed = Array.isArray(doc.sz) && doc.sz[0] > 0;
    // Runtime localization: if the raw text EXACTLY matches a variable key, substitute its value
    // (whole-string match, mirroring the original Babylon.js player). `hasOwnProperty` guards against
    // inherited keys (e.g. a placeholder literally named "toString") and preserves empty-string values.
    const raw = doc.t ?? "";
    const text = variables && Object.prototype.hasOwnProperty.call(variables, raw) ? variables[raw] : raw;
    return {
        text,
        family,
        weight,
        style,
        size,
        color: [fc[0], fc[1], fc[2], 1],
        justify: doc.j ?? 0,
        // Lottie tracking is 1/1000 em; convert to px letter spacing.
        letterSpacing: ((doc.tr ?? 0) / 1000) * size,
        lineHeight: doc.lh ?? size * 1.2,
        boxW: boxed ? doc.sz![0] : undefined,
        boxH: boxed ? doc.sz![1] : undefined,
        boxX: boxed && doc.ps ? doc.ps[0] : undefined,
        boxY: boxed && doc.ps ? doc.ps[1] : undefined,
    };
}

// Build a static (non-animated) property holding a constant value.
function CreateStaticProp(value: unknown): IProp {
    return { a: 0, k: value };
}

// Parse a hex color string (#rgb / #rrggbb) into [r,g,b,a] in 0-1.
function ParseHexColor(hex: string): [number, number, number, number] {
    let h = hex.replace("#", "");
    if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    const n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

// Synthesize a draw op for a solid layer: a `sw`x`sh` rect (top-left origin) filled with `sc`.
function CreateSolidLayerOp(layer: ILayer): IDrawOp {
    const w = layer.sw ?? 0;
    const h = layer.sh ?? 0;
    const color = ParseHexColor(layer.sc ?? "#000000");
    return {
        // Rect centered at (w/2, h/2) so its top-left is the layer origin (Lottie solid convention).
        contours: [{ rect: { p: CreateStaticProp([w / 2, h / 2]), s: CreateStaticProp([w, h]) } }],
        groupTransforms: [],
        paint: { kind: "solid", color: CreateStaticProp(color) },
    };
}

// Parse a layer's `masksProperties` into a flat list. Masks with no path are skipped. Returns
// undefined when the layer has no masks (so the renderer can skip the masked path entirely).
function ParseMasks(layer: ILayer): IParsedMask[] | undefined {
    const raw = layer.masksProperties;
    if (!Array.isArray(raw) || raw.length === 0) {
        return undefined;
    }
    const masks: IParsedMask[] = [];
    for (const m of raw) {
        if (!m.pt) {
            continue;
        }
        masks.push({ mode: m.mode ?? "a", inverted: !!m.inv, path: m.pt, opacity: m.o });
    }
    return masks.length > 0 ? masks : undefined;
}

function ParseLayer(layer: ILayer, ind: number, assetIndex: Map<string, number>, assets: IParsedAsset[], fonts: Map<string, IFontDef>, variables?: LottieVariables): IParsedLayer {
    const ops: IDrawOp[] = [];
    let image: IParsedImage | undefined;
    let text: IParsedText | undefined;
    if (layer.ty === 4 && layer.shapes) {
        WalkGroup(layer.shapes, ops, [], []);
    } else if (layer.ty === 1) {
        // Solid layer: a full-size colored rectangle (rendered through the vector fill path).
        ops.push(CreateSolidLayerOp(layer));
    } else if (layer.ty === 2 && layer.refId !== undefined) {
        const idx = assetIndex.get(layer.refId);
        if (idx !== undefined) {
            image = { assetIndex: idx, width: assets[idx].width, height: assets[idx].height };
        }
    } else if (layer.ty === 5 && layer.t) {
        text = ParseText(layer, fonts, variables);
    }
    return {
        // Solid layers (ty 1) render through the vector fill path, so report them as kind 4.
        kind: layer.ty === 1 ? 4 : layer.ty,
        ind,
        parent: layer.parent,
        name: layer.nm ?? "",
        transform: layer.ks,
        ip: layer.ip ?? 0,
        op: layer.op ?? Number.MAX_SAFE_INTEGER,
        st: layer.st ?? 0,
        ops,
        image,
        text,
        masks: ParseMasks(layer),
        matteMode: layer.tt,
        matteOnly: !!layer.td,
    };
}

function ParseAssets(raw: IAsset[] | undefined): IParsedAsset[] {
    const assets: IParsedAsset[] = [];
    for (const a of raw ?? []) {
        assets.push({
            id: a.id,
            width: a.w ?? 0,
            height: a.h ?? 0,
            src: (a.u ?? "") + (a.p ?? ""),
        });
    }
    return assets;
}

/**
 * Parses a Lottie document into a flat draw list. Keeps shape (`ty 4`), image (`ty 2`),
 * text (`ty 5`), and null (`ty 3`, transform-only) layers.
 * @param file The raw Lottie document.
 * @param variables Runtime text substitutions applied to text layers, matched on the whole
 * string — see {@link LottieVariables}.
 * @returns The parsed animation.
 */
export function ParseAnimation(file: ILottieFile, variables?: LottieVariables): IParsedAnimation {
    const assets = ParseAssets(file.assets);
    const assetIndex = new Map<string, number>();
    for (let i = 0; i < assets.length; i++) {
        assetIndex.set(assets[i].id, i);
    }
    const fonts = new Map<string, IFontDef>();
    for (const f of file.fonts?.list ?? []) {
        fonts.set(f.fName, f);
    }
    const layers: IParsedLayer[] = [];
    const parsedByInd = new Map<number, IParsedLayer>();
    // `ind` is optional in the spec. Layers that omit it get a unique synthetic index, otherwise they
    // would all collide in the parent lookup, the matte pairing and the per-frame world cache.
    let syntheticInd = Number.MIN_SAFE_INTEGER;
    const indexOf = new Map<ILayer, number>();
    for (const layer of file.layers) {
        indexOf.set(layer, layer.ind ?? syntheticInd++);
    }
    // Keep the layer kinds the renderers handle: shape (4, with shapes), solid (1), image (2, with a
    // refId), text (5, with a doc), and null (3, kept so children can resolve it as a transform parent).
    // ParseLayer dispatches on the same kinds, so one filter here avoids duplicating that logic.
    for (const layer of file.layers) {
        if ((layer.ty === 4 && layer.shapes) || layer.ty === 1 || (layer.ty === 2 && layer.refId !== undefined) || (layer.ty === 5 && layer.t) || layer.ty === 3) {
            const parsed = ParseLayer(layer, indexOf.get(layer) as number, assetIndex, assets, fonts, variables);
            layers.push(parsed);
            parsedByInd.set(parsed.ind, parsed);
        }
    }
    for (let i = 0; i < file.layers.length; i++) {
        const layer = file.layers[i];
        if (!layer.tt) {
            continue;
        }
        const consumer = parsedByInd.get(indexOf.get(layer) as number);
        const previous = file.layers[i - 1];
        const source = parsedByInd.get(layer.tp ?? (previous ? (indexOf.get(previous) as number) : Number.NaN));
        if (consumer && source) {
            consumer.matteSource = source.ind;
            source.matteOnly = true;
        }
    }
    return { width: file.w, height: file.h, ip: file.ip, op: file.op, fr: file.fr, layers, assets };
}

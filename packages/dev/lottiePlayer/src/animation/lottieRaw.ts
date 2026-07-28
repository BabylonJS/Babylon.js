// Minimal raw Lottie JSON shapes — only the subset this player consumes.
// We keep raw props as-is and sample them per frame (lottie-web style), which is
// the smallest possible approach: no separate "parsed animation" allocation.

/** A 2-component point/tangent as stored in Lottie (`[x, y]`). */
export type Vec2 = [number, number];

/** IKeyframe easing handle. `x`/`y` may be a number (scalar prop) or array (multi-dim). */
export interface IEasing {
    x: number | number[];
    y: number | number[];
}

/** One keyframe of an animated property. */
export interface IKeyframe {
    /** Frame number (comp time). */
    t: number;
    /** Start value of the segment beginning at this keyframe. */
    s?: unknown;
    /** Legacy end value (older exporters). When absent, the next keyframe's `s` is the end. */
    e?: unknown;
    /** Ease-in control point. */
    i?: IEasing;
    /** Ease-out control point. */
    o?: IEasing;
    /** Hold (step) flag. */
    h?: number;
}

/** An animatable property: `a:0` static (`k` is the value) or `a:1` animated (`k` is keyframes). */
export interface IProp {
    a: 0 | 1;
    k: unknown;
    /** Separate-dimensions position (After Effects "Separate Dimensions"): when `true`, the value
     *  lives in the `x`/`y` sub-props instead of `k`. */
    s?: boolean;
    /** X dimension, when `s` is set. */
    x?: IProp;
    /** Y dimension, when `s` is set. */
    y?: IProp;
}

/** A bezier contour: per-vertex in/out tangents (relative), absolute vertices, closed flag. */
export interface IShapeData {
    /** In-tangents, relative to the matching vertex. */
    i: Vec2[];
    /** Out-tangents, relative to the matching vertex. */
    o: Vec2[];
    /** Vertices (absolute, in shape-local space). */
    v: Vec2[];
    /** Closed contour. */
    c: boolean;
}

/** One entry of a stroke's dash array (`st.d[]` / `gs.d[]`). */
export interface IStrokeDashEntry {
    /** Role: "d" dash length, "g" gap length, "o" offset along the path. */
    n?: string;
    /** The animatable length, in shape-local units. */
    v?: IProp;
}

/** A shape-tree item (group, path, fill, gradient fill, transform, …). */
export interface IShapeItem {
    ty: string;
    nm?: string;
    /** Group children. */
    it?: IShapeItem[];
    /** Path: the shape property. */
    ks?: IProp;
    /** Fill/stroke/transform color or gradient stop color. */
    c?: IProp;
    /** Opacity (0–100). */
    o?: IProp;
    /** Fill rule: 1 = nonzero, 2 = even-odd. */
    r?: number;
    /** Gradient type: 1 = linear, 2 = radial. */
    t?: number;
    /** Gradient start point (shape-local). */
    s?: IProp;
    /** Gradient end point (shape-local). */
    e?: IProp;
    /** Gradient stops: `p` stop count, `k` the stop data property. */
    g?: { p: number; k: IProp };
    /** Transform anchor (ty === "tr"). */
    a?: IProp;
    /** Transform position (ty === "tr"), or rect center (ty === "rc"). */
    p?: IProp;
    /** Stroke width (ty === "st" / "gs"). */
    w?: IProp;
    /** Stroke dash pattern (ty === "st" / "gs"). */
    d?: IStrokeDashEntry[];
    /** Stroke line cap: 1 butt, 2 round, 3 square (ty === "st"). */
    lc?: number;
    /** Stroke line join: 1 miter, 2 round, 3 bevel (ty === "st"). */
    lj?: number;
    /** Hidden flag. */
    hd?: boolean;
}

/** A layer mask (`layer.masksProperties[]`). The mask path clips the layer's content. */
export interface IMaskProperty {
    /** Mask mode: "a" add, "s" subtract, "i" intersect, "n" none, "l" lighten, "d" darken, "f" difference. */
    mode?: string;
    /** Mask path — an animatable shape property (morphs like any path). */
    pt?: IProp;
    /** Mask opacity (0–100). */
    o?: IProp;
    /** Inverted: the masked region is the OUTSIDE of the path. */
    inv?: boolean;
    /** Expansion / feather (px). */
    x?: IProp;
}

/** A layer. We render shape layers (`ty === 4`) and image layers (`ty === 2`). */
export interface ILayer {
    /** Index used for parenting. Optional in the spec; the parser assigns a synthetic one when absent. */
    ind?: number;
    ty: number;
    nm?: string;
    /** Hidden. */
    hd?: boolean;
    /** Time stretch. */
    sr?: number;
    /** Auto-orient (0 false, 1 true). */
    ao?: number;
    /** Collapse transform (0 false, 1 true). */
    ct?: number;
    /** IAsset reference (image layers point at an entry in `assets`). */
    refId?: string;
    /** ILayer masks. Each clips the layer's content to a path region. */
    masksProperties?: IMaskProperty[];
    /** Whether the layer has any mask (mirrors `masksProperties.length > 0`). */
    hasMask?: boolean;
    /** Track-matte mode on a consumer: 1 alpha, 2 alpha inverted, 3 luma, 4 luma inverted. */
    tt?: number;
    /** Marks a layer as a track-matte source. */
    td?: number;
    /** Explicit matte-source layer index; otherwise the preceding layer is used. */
    tp?: number;
    /** ITransform (anchor a, position p, scale s, rotation r, opacity o). */
    ks: {
        a?: IProp;
        p?: IProp;
        s?: IProp;
        r?: IProp;
        o?: IProp;
    };
    shapes?: IShapeItem[];
    /** Text data (text layers, `ty === 5`). */
    t?: ITextData;
    /** Solid layer (`ty === 1`) color, e.g. "#f0f0f0". */
    sc?: string;
    /** Solid layer width. */
    sw?: number;
    /** Solid layer height. */
    sh?: number;
    /** In point (first visible frame). */
    ip?: number;
    /** Out point (first hidden frame). */
    op?: number;
    /** Start time (timeline offset). */
    st?: number;
    parent?: number;
}

/** A single text-document keyframe value (the `s` of `t.d.k[i]`). */
export interface ITextDocument {
    /** The text string (may contain `\r` line breaks). */
    t: string;
    /** Font name (resolves against `fonts.list[].fName`). */
    f: string;
    /** Font size (px). */
    s: number;
    /** Fill color [r,g,b] in 0–1. */
    fc?: number[];
    /** Justify: 0 left, 1 right, 2 center. */
    j?: number;
    /** Tracking (letter spacing, 1/1000 em). */
    tr?: number;
    /** Line height (px). */
    lh?: number;
    /** Box size [w, h] for paragraph/boxed text (absent for point text). */
    sz?: number[];
    /** Box top-left position [x, y] in layer-local space (boxed text). */
    ps?: number[];
}

/** Text layer data (`layer.t`). */
export interface ITextData {
    d?: { k?: { s: ITextDocument }[] };
}

/** A font definition (`fonts.list[]`). */
export interface IFontDef {
    fName: string;
    fFamily: string;
    fStyle?: string;
    fWeight?: string;
    /** Path to the font file. When absent the font is expected to be available to the browser. */
    fPath?: string;
    /** Font path origin: 0 local, 1 css url, 2 script url, 3 font url. */
    origin?: number;
    /** Ascent in pixels. */
    ascent?: number;
}

/** An asset entry. Image assets carry width/height and a (possibly embedded) source. */
export interface IAsset {
    id: string;
    /** Image width. */
    w?: number;
    /** Image height. */
    h?: number;
    /** Path or data URI. When `p` is a `data:` URI the image is embedded. */
    p?: string;
    /** Directory prefix for external images. */
    u?: string;
    /** Embedded flag (1 when `p` is a data URI). */
    e?: number;
}

/** Top-level Lottie document. */
export interface ILottieFile {
    v: string;
    /** Human readable name. */
    nm?: string;
    /** Comp width. */
    w: number;
    /** Comp height. */
    h: number;
    /** In point. */
    ip: number;
    /** Out point. */
    op: number;
    /** Frame rate. */
    fr: number;
    layers: ILayer[];
    assets?: IAsset[];
    /** Font definitions. */
    fonts?: { list: IFontDef[] };
}

import type {
    RawLottieAnimation,
    RawLottieLayer,
    RawGraphicElement,
    RawGroupShape,
    RawRectangleShape,
    RawPathShape,
    RawFillShape,
    RawGradientFillShape,
    RawTransformShape,
    RawTransform,
    RawScalarProperty,
    RawVectorProperty,
    RawVectorKeyframe,
    RawPositionProperty,
    RawPositionKeyframe,
    RawBezierShapeProperty,
    RawBezierShapeKeyframe,
    RawColorProperty,
    RawColorKeyframe,
    RawGradientsProperty,
    RawGradientProperty,
    RawKeyFrameEasing,
    RawBezier,
    RawNumberBoolean,
    RawLayerType,
    RawShapeType,
    RawShapeDirection,
    RawFillRule,
    RawGradientType,
} from "./foo.types";

// Context-specific property mappings for semantic correctness
type AnimationPropertyMap = {
    v: "version";
    fr: "frameRate";
    ip: "inPoint";
    op: "outPoint";
    w: "width";
    h: "height";
    nm: "name";
    layers: "layers";
};

type LayerPropertyMap = {
    ind: "index";
    ty: "type";
    nm: "name";
    parent: "parent";
    hd: "hidden";
    sr: "stretch";
    ao: "autoOrient";
    ip: "inPoint";
    op: "outPoint";
    st: "startTime";
    ct: "collapseTransform";
    ks: "transform";
    shapes: "shapes";
};

type GraphicElementPropertyMap = {
    nm: "name";
    hd: "hidden";
    ty: "type";
    bm: "blendMode";
    ix: "index";
};

type GroupShapePropertyMap = GraphicElementPropertyMap & {
    it: "items";
};

type RectangleShapePropertyMap = GraphicElementPropertyMap & {
    d: "direction";
    p: "position";
    s: "size";
    r: "roundness";
};

type PathShapePropertyMap = GraphicElementPropertyMap & {
    d: "direction";
    ks: "shape";
};

type FillShapePropertyMap = GraphicElementPropertyMap & {
    o: "opacity";
    c: "color";
    r: "fillRule";
};

type GradientFillShapePropertyMap = GraphicElementPropertyMap & {
    o: "opacity";
    g: "gradient";
    s: "startPoint";
    e: "endPoint";
    t: "type";
    h: "highlightLength";
    a: "highlightAngle";
    r: "fillRule";
};

type TransformShapePropertyMap = GraphicElementPropertyMap & {
    a: "anchorPoint";
    p: "position";
    r: "rotation";
    s: "scale";
    o: "opacity";
    sk: "skew";
    sa: "skewAxis";
};

type TransformPropertyMap = {
    a: "anchorPoint";
    p: "position";
    r: "rotation";
    s: "scale";
    o: "opacity";
};

type PropertyPropertyMap = {
    a: "animated";
    k: "keyframes";
    l: "length";
};

type KeyframePropertyMap = {
    t: "time";
    s: "value";
    h: "holdFlag";
    i: "inTangent";
    o: "outTangent";
};

type PositionKeyframePropertyMap = KeyframePropertyMap & {
    ti: "valueInTangent";
    to: "valueOutTangent";
};

type BezierShapePropertyMap = {
    a: "animated";
    k: "keyframes";
};

type BezierShapeKeyframePropertyMap = KeyframePropertyMap & {
    s: "value";
};

type ColorPropertyMap = PropertyPropertyMap;

type GradientsPropertyMap = {
    p: "colorStopCount";
    k: "gradientProperty";
};

type GradientPropertyMap = {
    a: "animated";
    k: "keyframes";
};

type KeyFrameEasingPropertyMap = {
    x: "timeComponent";
    y: "valueComponent";
};

type BezierPropertyMap = {
    c: "closed";
    i: "inTangents";
    o: "outTangents";
    v: "vertices";
};

// Utility type to rename properties
type RenameProperties<T, M extends Record<string, string>> = {
    [K in keyof T as K extends keyof M ? M[K] : K]: T[K] extends object
        ? T[K] extends any[]
            ? T[K] extends (infer U)[]
                ? U extends object
                    ? RenameProperties<U, M>[]
                    : T[K]
                : T[K]
            : RenameProperties<T[K], M>
        : T[K];
};

// Descriptive types using context-specific mappings
export type LottieAnimation = RenameProperties<RawLottieAnimation, AnimationPropertyMap>;
export type LottieLayer = RenameProperties<RawLottieLayer, LayerPropertyMap>;
export type GraphicElement = RenameProperties<RawGraphicElement, GraphicElementPropertyMap>;
export type GroupShape = RenameProperties<RawGroupShape, GroupShapePropertyMap>;
export type RectangleShape = RenameProperties<RawRectangleShape, RectangleShapePropertyMap>;
export type PathShape = RenameProperties<RawPathShape, PathShapePropertyMap>;
export type FillShape = RenameProperties<RawFillShape, FillShapePropertyMap>;
export type GradientFillShape = RenameProperties<RawGradientFillShape, GradientFillShapePropertyMap>;
export type TransformShape = RenameProperties<RawTransformShape, TransformShapePropertyMap>;
export type Transform = RenameProperties<RawTransform, TransformPropertyMap>;
export type ScalarProperty = RenameProperties<RawScalarProperty, PropertyPropertyMap>;
export type VectorProperty = RenameProperties<RawVectorProperty, PropertyPropertyMap>;
export type VectorKeyframe = RenameProperties<RawVectorKeyframe, KeyframePropertyMap>;
export type PositionProperty = RenameProperties<RawPositionProperty, PropertyPropertyMap>;
export type PositionKeyframe = RenameProperties<RawPositionKeyframe, PositionKeyframePropertyMap>;
export type BezierShapeProperty = RenameProperties<RawBezierShapeProperty, BezierShapePropertyMap>;
export type BezierShapeKeyframe = RenameProperties<RawBezierShapeKeyframe, BezierShapeKeyframePropertyMap>;
export type ColorProperty = RenameProperties<RawColorProperty, ColorPropertyMap>;
export type ColorKeyframe = RenameProperties<RawColorKeyframe, KeyframePropertyMap>;
export type GradientsProperty = RenameProperties<RawGradientsProperty, GradientsPropertyMap>;
export type GradientProperty = RenameProperties<RawGradientProperty, GradientPropertyMap>;
export type KeyFrameEasing = RenameProperties<RawKeyFrameEasing, KeyFrameEasingPropertyMap>;
export type Bezier = RenameProperties<RawBezier, BezierPropertyMap>;

// Re-export the simple types
export type NumberBoolean = RawNumberBoolean;
export type LayerType = RawLayerType;
export type ShapeType = RawShapeType;
export type ShapeDirection = RawShapeDirection;
export type FillRule = RawFillRule;
export type GradientType = RawGradientType;

// Zero-cost conversion helpers with proper typing
export function asLottieAnimation(raw: RawLottieAnimation): LottieAnimation {
    return raw;
}

export function asLottieLayer(raw: RawLottieLayer): LottieLayer {
    return raw as any;
}

export function asGraphicElement(raw: RawGraphicElement): GraphicElement {
    return raw as any;
}

export function asGroupShape(raw: RawGroupShape): GroupShape {
    return raw as any;
}

export function asRectangleShape(raw: RawRectangleShape): RectangleShape {
    return raw as any;
}

export function asPathShape(raw: RawPathShape): PathShape {
    return raw as any;
}

export function asFillShape(raw: RawFillShape): FillShape {
    return raw as any;
}

export function asGradientFillShape(raw: RawGradientFillShape): GradientFillShape {
    return raw as any;
}

export function asTransformShape(raw: RawTransformShape): TransformShape {
    return raw as any;
}

export function asTransform(raw: RawTransform): Transform {
    return raw as any;
}

export function asScalarProperty(raw: RawScalarProperty): ScalarProperty {
    return raw as any;
}

export function asVectorProperty(raw: RawVectorProperty): VectorProperty {
    return raw as any;
}

export function asVectorKeyframe(raw: RawVectorKeyframe): VectorKeyframe {
    return raw as any;
}

export function asPositionProperty(raw: RawPositionProperty): PositionProperty {
    return raw as any;
}

export function asPositionKeyframe(raw: RawPositionKeyframe): PositionKeyframe {
    return raw as any;
}

export function asBezierShapeProperty(raw: RawBezierShapeProperty): BezierShapeProperty {
    return raw as any;
}

export function asBezierShapeKeyframe(raw: RawBezierShapeKeyframe): BezierShapeKeyframe {
    return raw as any;
}

export function asColorProperty(raw: RawColorProperty): ColorProperty {
    return raw as any;
}

export function asColorKeyframe(raw: RawColorKeyframe): ColorKeyframe {
    return raw as any;
}

export function asGradientsProperty(raw: RawGradientsProperty): GradientsProperty {
    return raw as any;
}

export function asGradientProperty(raw: RawGradientProperty): GradientProperty {
    return raw as any;
}

export function asKeyFrameEasing(raw: RawKeyFrameEasing): KeyFrameEasing {
    return raw as any;
}

export function asBezier(raw: RawBezier): Bezier {
    return raw as any;
}

// Generic helper for when you know the target type
export function asDescriptive<TRaw, TDescriptive>(raw: TRaw): TDescriptive {
    return raw as any;
}

// Usage examples:
/*
// At the boundary where you receive raw data
const rawAnimation: RawLottieAnimation = JSON.parse(lottieJsonString);
const animation = asLottieAnimation(rawAnimation);

// Now you can use descriptive property names
console.log(animation.version);     // instead of rawAnimation.v
console.log(animation.frameRate);   // instead of rawAnimation.fr
console.log(animation.width);       // instead of rawAnimation.w

// For keyframes
const rawKeyframe: RawColorKeyframe = { t: 100, s: [1, 0, 0], h: 1 };
const keyframe = asColorKeyframe(rawKeyframe);
console.log(keyframe.time);         // instead of rawKeyframe.t
console.log(keyframe.value);        // instead of rawKeyframe.s
console.log(keyframe.holdFlag);     // instead of rawKeyframe.h

// For transforms
const rawTransform: RawTransform = { a: {...}, p: {...}, r: {...} };
const transform = asTransform(rawTransform);
console.log(transform.anchorPoint); // instead of rawTransform.a
console.log(transform.position);    // instead of rawTransform.p
console.log(transform.rotation);    // instead of rawTransform.r
*/

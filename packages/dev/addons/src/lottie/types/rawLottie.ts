/* eslint-disable jsdoc/require-jsdoc */

// Types for the raw lottie .json data

// General animation information
export type RawLottieAnimation = {
    v: string; // Version
    fr: number; // Framerate in frames per second
    ip: number; // 	Frame the animation starts at (usually 0)
    op: number; // 	Frame the animation stops/loops at, which makes this the duration in frames when ip is 0
    w: number; // Width
    h: number; // Height
    nm?: string; // Human readable name
    layers: RawLottieLayer[]; // Layers
};

type RawLottieLayer = {
    ind?: number; // Index that can be used for parenting and referenced in expressions
    ty: LayerType; // Layer type (0: precomp, 1: solid, 2: image, 3: null, 4: shape, 5: text)
    nm?: string; // Human readable name
    parent?: number; // Must be the ind property of another layer
    sr?: number; // Time Stretch
    ao?: number; // Auto-Orient (0: false, 1: true), if 1, the layer will rotate itself to match its animated position path
    ip?: number; // Frame when the layer becomes visible
    op?: number; // Frame when the layer becomes invisible
    st?: number; // Start time
    ct?: number; // Collapse Transform (0: false, 1: true), marks that transforms should be applied before masks
    ks?: RawTransform; // Layer transform
    shapes?: Shape[];
};

type RawTransform = {
    a?: PositionProperty; // Anchor point: a position (relative to its parent) around which transformations are applied (ie: center for rotation / scale)
    p?: PositionProperty; // Position / Translation
    r?: ScalarProperty; // Rotation in degrees, clockwise
    s?: VectorProperty; // Scale factor, [100, 100] for no scaling
    o?: ScalarProperty; // Opacity
};

type ScalarProperty = {
    a: NumberBoolean; // Animated (0: false, 1: true)
    k: number | number[]; // When it's not animated, k will contain the value directly. When animated, k will be an array of keyframes.
};

type VectorProperty = {
    a: NumberBoolean; // Animated (0: false, 1: true)
    k: number[] | VectorKeyframe[]; // When it's not animated, k will contain the value directly. When animated, k will be an array of keyframes.
    l: number; // Number of components in the value arrays. If present values will be truncated or expanded to match this length when accessed from expressions
};

type VectorKeyframe = {
    t: number; // Time, Frame number
    h?: NumberBoolean; // Hold flag (0: false, 1: true)
    i?: KeyFrameEasing; // In tangent, easing tangent going into the next keyframe
    o?: KeyFrameEasing; // Out tanget, easing tangent leaving the current keyframe
    s: number[]; // Value at this keyframe
};

type PositionProperty = {
    a: NumberBoolean; // Animated (0: false, 1: true)
    k: number[] | PositionKeyframe[]; // When it's not animated, k will contain the value directly. When animated, k will be an array of keyframes.
    l: number; // Number of components in the value arrays. If present values will be truncated or expanded to match this length when accessed from expressions
};

type PositionKeyframe = {
    t: number; // Time, Frame number
    h?: NumberBoolean; // Hold flag (0: false, 1: true)
    i?: KeyFrameEasing; // In tangent, easing tangent going into the next keyframe
    o?: KeyFrameEasing; // Out tanget, easing tangent leaving the current keyframe
    s: number[]; // Value at this keyframe
    ti: number[]; // Value In Tangent, tangent for values (eg: moving position around a curved path)
    to: number[]; // Value Out Tangent, tangent for values (eg: moving position around a curved path)
};

type BezierShapeProperty = {
    a: NumberBoolean; // Animated (0: false, 1: true)
    k: Bezier | BezierShapeKeyframe[]; // When it's not animated, k will contain the value directly. When animated, k will be an array of keyframes
};

type BezierShapeKeyframe = {
    t: number; // Time, Frame number
    h?: NumberBoolean; // Hold flag (0: false, 1: true)
    i?: KeyFrameEasing; // In tangent, easing tangent going into the next keyframe
    o?: KeyFrameEasing; // Out tanget, easing tangent leaving the current keyframe
    s: Bezier[]; // Value at this keyframe
};

type ColorProperty = {
    a: NumberBoolean; // Animated (0: false, 1: true)
    k: number[] | ColorKeyframe[]; // When it's not animated, k will contain the value directly. When animated, k will be an array of keyframes
};

type ColorKeyframe = {
    t: number; // Time, Frame number
    h?: NumberBoolean; // Hold flag (0: false, 1: true)
    i?: KeyFrameEasing; // In tangent, easing tangent going into the next keyframe
    o?: KeyFrameEasing; // Out tanget, easing tangent leaving the current keyframe
    s: number[]; // Value at this keyframe
};

type GradientsProperty = {
    p: number; // Color stop count
    k: GradientProperty;
};

type GradientProperty = {
    a: NumberBoolean; // Animated (0: false, 1: true)
    k: number[]; // Gradient array
};

type KeyFrameEasing = {
    x: number | number[]; // Time component: 0 means start time of the keyframe, 1 means time of the next keyframe.
    y: number | number[]; // Value interpolation component: 0 means start value of the keyframe, 1 means value at the next keyframe.
};

type Bezier = {
    c: boolean; // Closed
    i: number[][]; // In tangents, array of points, each point is an array of coordinates. These points are along the in tangents relative to the corresponding v
    o: number[][]; // Out tangents, array of points, each point is an array of coordinates. These points are along the out tangents relative to the corresponding v
    v: number[][]; // Vertices, array of points, each point is an array of coordinates. These points are along the bezier path
};

type GraphicElement = {
    nm?: string; // Human readable name
    hd?: boolean; // Hidden
    ty: ShapeType; // Type ('gr' for group, 'rc' for rectangle, 'el' for ellipse, 'sh' for path, etc.)
    bm?: number; // Blend mode
    ix?: number; // Index
};

type RectangleShape = GraphicElement & {
    d: ShapeDirection; // direction the shape is drawn as, mostly relevant when using trim path
    p: PositionProperty; // center of the rectangle
    s: VectorProperty; // size of the rectangle
    r: ScalarProperty; // rounded corners radius
};

type PathShape = GraphicElement & {
    d: ShapeDirection; // direction the shape is drawn as, mostly relevant when using trim path
    ks: BezierShapeProperty; // bezier path
};

type FillShape = GraphicElement & {
    o: ScalarProperty; // Opacity, 100 means fully opaque
    c: ColorProperty; // Color
    r: FillRule; // fill rule
};

type GradientFillShape = GraphicElement & {
    o: ScalarProperty; // Opacity, 100 means fully opaque
    g: GradientsProperty; // Gradient colors
    s: PositionProperty; // Starting point of the gradient
    e: PositionProperty; // End point of the gradient
    t: GradientType; // type of the gradient
    h: ScalarProperty; // highlight length as a percentage between s and e
    a: ScalarProperty; // highlight angle in clockwise degrees, relative to the direction from s to e
    r: FillRule; // fill rule
};

type GroupShape = GraphicElement & {
    np?: number; // number of properties
    it?: GraphicElement[]; // shapes
};

type TransformShape = GraphicElement & {
    a: PositionProperty; // anchor point
    p: PositionProperty; // position/translation
    r: ScalarProperty; // rotation in degrees, clockwise
    s: VectorProperty; // scale factor, [100, 100] for no scaling
    o: ScalarProperty; // opacity
    sk: ScalarProperty; // skew amount as an angle in degrees
    sa: ScalarProperty; // skew axis, direction along which skew is applied, in degrees (0 skes along the x axis, 90 along the Y axys)
};

type NumberBoolean = 0 | 1; // 0: false, 1: true;
type LayerType = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Layer type (0: precomposition, 1: solid, 2: image, 3: null, 4: shape, 5: text, 6: audio)
type ShapeType = "fl" | "gf" | "gr" | "tr" | "sh" | "rc"; // Shape type (fl: fill, gf: gradient fill, gr: group, tr: transform, sh: shape, rc: rectangle)
type ShapeDirection = 1 | 3; // 1: clockwise, 3: counter-clockwise
type FillRule = 1 | 2; // Fill rule (1: non-zero, everything is colored (You can think of this as an OR), 2: even-odd, colored based on intersections and path direction, can be used to create "holes")
type GradientType = 1 | 2; // Gradient type (1: linear, 2: radial)

// type Shape = {
//     ty: string; // Type ('gr' for group, 'rc' for rectangle, 'el' for ellipse, 'sh' for path, etc.)
//     nm?: string; // Name

//     // For groups (ty: 'gr')
//     it?: Shape[]; // Items

//     // For paths (ty: 'sh')
//     ks?: ShapeProperty; // KeyShape property

//     // For fills (ty: 'fl')
//     c?: ColorProperty; // Color
//     o?: ValueProperty; // Opacity
//     r?: number | RotationProperty | ValueProperty; // Fill rule

//     // For strokes (ty: 'st')
//     w?: ValueProperty; // Width
//     lc?: number; // Line cap
//     lj?: number; // Line join
//     ml?: number; // Miter limit
//     d?: DashProperty[]; // Dashes

//     // For transforms (ty: 'tr')
//     p?: PositionProperty; // Position
//     a?: PositionProperty; // Anchor point
//     s?: ScaleProperty | SizeProperty; // Scale
// };

// // Dash property
// type DashProperty = {
//     n: string; // Name ('o' for offset, 'd' for dash, 'g' for gap)
//     v: ValueProperty; // Value
// };

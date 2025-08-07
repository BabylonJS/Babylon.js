/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Types for the raw Lottie .json data

// General animation data
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

// Layer data
export type RawLottieLayer = {
    ind?: number; // Index that can be used for parenting and referenced in expressions
    ty: RawLayerType; // Layer type (0: precomp, 1: solid, 2: image, 3: null, 4: shape, 5: text)
    nm?: string; // Human readable name
    parent?: number; // Must be the ind property of another layer
    hd?: boolean; // Hidden
    sr?: number; // Time Stretch
    ao?: number; // Auto-Orient (0: false, 1: true), if 1, the layer will rotate itself to match its animated position path
    ip?: number; // Frame when the layer becomes visible
    op?: number; // Frame when the layer becomes invisible
    st?: number; // Start time
    ct?: number; // Collapse Transform (0: false, 1: true), marks that transforms should be applied before masks
    ks: RawTransform; // Layer transform
    shapes?: RawGraphicElement[];
};

export type RawGraphicElement = {
    nm?: string; // Human readable name
    hd?: boolean; // Hidden
    ty: RawShapeType; // Type ('gr' for group, 'rc' for rectangle, 'el' for ellipse, 'sh' for path, etc.)
    bm?: number; // Blend mode
    ix?: number; // Index
};

export type RawGroupShape = RawGraphicElement & {
    it?: RawGraphicElement[]; // shapes
};

export type RawRectangleShape = RawGraphicElement & {
    d: RawShapeDirection; // direction the shape is drawn as, mostly relevant when using trim path
    p: RawPositionProperty; // center of the rectangle
    s: RawVectorProperty; // size of the rectangle
    r: RawScalarProperty; // rounded corners radius
};

export type RawPathShape = RawGraphicElement & {
    d: RawShapeDirection; // direction the shape is drawn as, mostly relevant when using trim path
    ks: RawBezierShapeProperty; // bezier path
};

export type RawFillShape = RawGraphicElement & {
    o: RawScalarProperty; // Opacity, 100 means fully opaque
    c: RawColorProperty; // Color
    r: RawFillRule; // fill rule
};

export type RawGradientFillShape = RawGraphicElement & {
    o: RawScalarProperty; // Opacity, 100 means fully opaque
    g: RawGradientsProperty; // Gradient colors
    s: RawPositionProperty; // Starting point of the gradient
    e: RawPositionProperty; // End point of the gradient
    t: RawGradientType; // type of the gradient
    h: RawScalarProperty; // highlight length as a percentage between s and e
    a?: RawScalarProperty; // highlight angle in clockwise degrees, relative to the direction from s to e
    r: RawFillRule; // fill rule
};

export type RawTransformShape = RawGraphicElement & {
    a: RawPositionProperty; // anchor point
    p: RawPositionProperty; // position/translation
    r: RawScalarProperty; // rotation in degrees, clockwise
    s: RawVectorProperty; // scale factor, [100, 100] for no scaling
    o: RawScalarProperty; // opacity
    sk: RawScalarProperty; // skew amount as an angle in degrees
    sa: RawScalarProperty; // skew axis, direction along which skew is applied, in degrees (0 skes along the x axis, 90 along the Y axys)
};

export type RawTransform = {
    a?: RawPositionProperty; // Anchor point: a position (relative to its parent) around which transformations are applied (ie: center for rotation / scale)
    p?: RawPositionProperty; // Position / Translation
    r?: RawScalarProperty; // Rotation in degrees, clockwise
    s?: RawVectorProperty; // Scale factor, [100, 100] for no scaling
    o?: RawScalarProperty; // Opacity
};

export type RawScalarProperty = {
    a: RawNumberBoolean; // Animated (0: false, 1: true)
    k: number | RawVectorKeyframe[]; // When it's not animated, k will contain the value directly. When animated, k will be an array of keyframes.
};

export type RawVectorProperty = {
    a: RawNumberBoolean; // Animated (0: false, 1: true)
    k: number[] | RawVectorKeyframe[]; // When it's not animated, k will contain the value directly. When animated, k will be an array of keyframes.
    l: number; // Number of components in the value arrays. If present values will be truncated or expanded to match this length when accessed from expressions
};

export type RawVectorKeyframe = {
    t: number; // Time, Frame number
    s: number[]; // Value at this keyframe
    h?: RawNumberBoolean; // Hold flag (0: false, 1: true)
    i?: RawKeyFrameEasing; // In tangent, easing tangent going into the next keyframe
    o?: RawKeyFrameEasing; // Out tanget, easing tangent leaving the current keyframe
};

export type RawPositionProperty = {
    a: RawNumberBoolean; // Animated (0: false, 1: true)
    k: number[] | RawPositionKeyframe[]; // When it's not animated, k will contain the value directly. When animated, k will be an array of keyframes.
    l: number; // Number of components in the value arrays. If present values will be truncated or expanded to match this length when accessed from expressions
};

export type RawPositionKeyframe = {
    t: number; // Time, Frame number
    h?: RawNumberBoolean; // Hold flag (0: false, 1: true)
    i?: RawKeyFrameEasing; // In tangent, easing tangent going into the next keyframe
    o?: RawKeyFrameEasing; // Out tanget, easing tangent leaving the current keyframe
    s: number[]; // Value at this keyframe
    ti: number[]; // Value In Tangent, tangent for values (eg: moving position around a curved path)
    to: number[]; // Value Out Tangent, tangent for values (eg: moving position around a curved path)
};

export type RawBezierShapeProperty = {
    a: RawNumberBoolean; // Animated (0: false, 1: true)
    k: RawBezier | RawBezierShapeKeyframe[]; // When it's not animated, k will contain the value directly. When animated, k will be an array of keyframes
};

export type RawBezierShapeKeyframe = {
    t: number; // Time, Frame number
    h?: RawNumberBoolean; // Hold flag (0: false, 1: true)
    i?: RawKeyFrameEasing; // In tangent, easing tangent going into the next keyframe
    o?: RawKeyFrameEasing; // Out tanget, easing tangent leaving the current keyframe
    s: RawBezier[]; // Value at this keyframe
};

export type RawColorProperty = {
    a: RawNumberBoolean; // Animated (0: false, 1: true)
    k: number[] | RawColorKeyframe[]; // When it's not animated, k will contain the value directly. When animated, k will be an array of keyframes
};

export type RawColorKeyframe = {
    t: number; // Time, Frame number
    h?: RawNumberBoolean; // Hold flag (0: false, 1: true)
    i?: RawKeyFrameEasing; // In tangent, easing tangent going into the next keyframe
    o?: RawKeyFrameEasing; // Out tanget, easing tangent leaving the current keyframe
    s: number[]; // Value at this keyframe
};

export type RawGradientsProperty = {
    p: number; // Color stop count
    k: RawGradientProperty;
};

export type RawGradientProperty = {
    a: RawNumberBoolean; // Animated (0: false, 1: true)
    k: number[]; // Gradient colors array
};

export type RawKeyFrameEasing = {
    x: number | number[]; // Time component: 0 means start time of the keyframe, 1 means time of the next keyframe.
    y: number | number[]; // Value interpolation component: 0 means start value of the keyframe, 1 means value at the next keyframe.
};

export type RawBezier = {
    c: boolean; // Closed
    i: number[][]; // In tangents, array of points, each point is an array of coordinates. These points are along the in tangents relative to the corresponding v
    o: number[][]; // Out tangents, array of points, each point is an array of coordinates. These points are along the out tangents relative to the corresponding v
    v: number[][]; // Vertices, array of points, each point is an array of coordinates. These points are along the bezier path
};

export type RawNumberBoolean = 0 | 1; // 0: false, 1: true;
export type RawLayerType = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Layer type (0: precomposition, 1: solid, 2: image, 3: null, 4: shape, 5: text, 6: audio)
export type RawShapeType = "fl" | "gf" | "gr" | "tr" | "sh" | "rc"; // Shape type (fl: fill, gf: gradient fill, gr: group, tr: transform, sh: path, rc: rectangle)
export type RawShapeDirection = 1 | 3; // 1: clockwise, 3: counter-clockwise
export type RawFillRule = 1 | 2; // Fill rule (1: non-zero, everything is colored (You can think of this as an OR), 2: even-odd, colored based on intersections and path direction, can be used to create "holes")
export type RawGradientType = 1 | 2; // Gradient type (1: linear, 2: radial)

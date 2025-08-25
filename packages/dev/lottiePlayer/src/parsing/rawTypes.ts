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
    fonts?: RawFontsList;
    layers: RawLottieLayer[]; // Layers
};

export type RawFontsList = {
    list: RawFont[];
};

export type RawFont = {
    fName: string; // Font name inside the lottie file
    fFamily: string; // Font family name
    fStyle: string; // Font style (eg: "Regular", "Bold", "Italic")
    fPath?: string; // Optional path to the font file, if not present, the font is expected to be available in the browser
    fWeight?: string; // Font weight
    origin?: RawFontPathOrigin;
    ascent?: number; // Ascent in pixels, text will be moved down based on this value
};

export type RawFontPathOrigin = 0 | 1 | 2 | 3; // 0: local, 1: css url, 2: script url, 3: font url

// Layer data
export type RawLottieLayer = {
    ind?: number; // Index that can be used for parenting and referenced in expressions
    ty: RawLayerType; // Layer type. Supported: 3: null, 4: shape, 5: text
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
};

export type RawShapeLayer = RawLottieLayer & {
    ty: 4; // Shape layer type
    shapes: RawElement[]; // Shapes in this layer
};

export type RawTextLayer = RawLottieLayer & {
    ty: 5; // Text layer type
    t: RawTextData;
};

export type RawElement = {
    nm?: string; // Human readable name
    hd?: boolean; // Hidden
    ty: RawShapeType; // Type ('gr' for group, 'rc' for rectangle, 'el' for ellipse, 'sh' for path, etc.)
    it?: RawElement[]; // Nested elements, only present for groups
    bm?: number; // Blend mode
    ix?: number; // Index
};

export type RawRectangleShape = RawElement & {
    d: RawShapeDirection; // direction the shape is drawn as, mostly relevant when using trim path
    p: RawPositionProperty; // center of the rectangle
    s: RawVectorProperty; // size of the rectangle
    r: RawScalarProperty; // rounded corners radius
};

export type RawPathShape = RawElement & {
    d: RawShapeDirection; // direction the shape is drawn as, mostly relevant when using trim path
    ks: RawBezierShapeProperty; // bezier path
};

export type RawFillShape = RawElement & {
    o: RawScalarProperty; // Opacity, 100 means fully opaque
    c: RawColorProperty; // Color
    r: RawFillRule; // fill rule
};

export type RawStrokeShape = RawElement & {
    lc: RawStrokeLineCap; // Line Cap (1: butt, 2: round, 3: square)
    lj: RawStrokeLineJoin; // Line Join (1: miter, 2: round, 3: bevel)
    ml?: number; // Miter Limit
    c: RawColorProperty; // Color
    o: RawScalarProperty; // Opacity, 100 means fully opaque
    w: RawScalarProperty; // Width of the stroke
    d?: RawStrokeDash[]; // Dashes array
};

export type RawStrokeDash = {
    n: RawStrokeDashType; // Dash type (d: dash, g: gap, s: space)
    v: RawScalarProperty; // Dash length, when animated, this will be an array of keyframes
};

export type RawGradientFillShape = RawElement & {
    o: RawScalarProperty; // Opacity, 100 means fully opaque
    g: RawGradientsProperty; // Gradient colors
    s: RawPositionProperty; // Starting point of the gradient
    e: RawPositionProperty; // End point of the gradient
    t: RawGradientType; // type of the gradient
    h: RawScalarProperty; // highlight length as a percentage between s and e
    a?: RawScalarProperty; // highlight angle in clockwise degrees, relative to the direction from s to e
    r: RawFillRule; // fill rule
};

export type RawTransformShape = RawElement & {
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

export type RawTextData = {
    a: RawTextRange[]; // Text animations, each animation is a range of characters that can be animated
    d: RawAnimatedTextDocument; // Text document, contains the actual text and formatting
    m: RawTextAligmentOptions; // Text alignment options
};

export type RawTextRange = {
    nm?: string; // Human readable name
    s: RawTextRangeSelector; // Range selector, defines which characters are affected by this animation
    a: RawTextStyle; // Text style, defines how the text is styled
};

export type RawAnimatedTextDocument = {
    k: RawTextDocumentKeyframe[]; // Keyframes for the text document, each keyframe contains the text and formatting at a specific time
};

export type RawTextAligmentOptions = {
    a: RawVectorProperty; // Alignment vector, [0, 0] for no alignment
    g: RawTextGrouping; // Text grouping for alignment (1: by character, 2: by word, 3: by line, 4: all)
};

export type RawTextRangeSelector = {
    t: number; // Expressible
    a: RawScalarProperty; // Max amount
    b: RawTextBased; // Text based (1: characters, 2: characters excluding spaces, 3: words, 4: lines)
    sh: RawTextShape; // Text shape type (1: square, 2: ramp up, 3: ramp down, 4: triangle, 5: round, 6: smooth)
};

export type RawTextStyle = {
    so: RawScalarProperty; // Stroke Opacity
    fo: RawScalarProperty; // Fill Opacity
};

export type RawTextDocumentKeyframe = {
    t: number;
    s: RawTextDocument;
};

export type RawTextDocument = {
    f: string; // Font family
    s: number; // Font size
    lh: number; // Line height
    t: string; // Text content
    ca: RawTextCaps; // Text caps (0: regular, 1: all caps, 2: small caps)
    j: RawTextJustify;
    fc?: number[] | string; // Fill color, can be a number array or a variable name
    sc?: number[]; // Stroke color
    sw?: number; // Stroke width
    of?: boolean; // Stroke over fill
    ls: number; // Baseline shift
    tr?: number; // Tracking
};

export type RawNumberBoolean = 0 | 1; // 0: false, 1: true;
export type RawLayerType = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Layer type (0: precomposition, 1: solid, 2: image, 3: null, 4: shape, 5: text, 6: audio)
export type RawShapeType = "fl" | "st" | "gf" | "gr" | "tr" | "sh" | "rc"; // Shape type (fl: fill, st: stroke, gf: gradient fill, gr: group, tr: transform, sh: path, rc: rectangle)
export type RawShapeDirection = 1 | 3; // 1: clockwise, 3: counter-clockwise
export type RawFillRule = 1 | 2; // Fill rule (1: non-zero, everything is colored (You can think of this as an OR), 2: even-odd, colored based on intersections and path direction, can be used to create "holes")
export type RawStrokeLineCap = 1 | 2 | 3; // Stroke line cap (1: butt, 2: round, 3: square)
export type RawStrokeLineJoin = 1 | 2 | 3; // Stroke line join (1: miter, 2: round, 3: bevel)
export type RawStrokeDashType = "d" | "g" | "s"; // Stroke dash type (d: dash, g: gap, s: space)
export type RawGradientType = 1 | 2; // Gradient type (1: linear, 2: radial)
export type RawTextBased = 1 | 2 | 3 | 4; // Text based (1: characters, 2: characters excluding spaces, 3: words, 4: lines)
export type RawTextShape = 1 | 2 | 3 | 4 | 5 | 6; // Text shape type (1: square, 2: ramp up, 3: ramp down, 4: triangle, 5: round, 6: smooth)
export type RawTextGrouping = 1 | 2 | 3 | 4; // Text grouping (1: by character, 2: by word, 3: by line, 4: all
export type RawTextCaps = 0 | 1 | 2; // Text caps (0: regular, 1: all caps, 2: small caps)
export type RawTextJustify = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Text justification (0: left, 1: right, 2: center, 3: justify with alst line left, 4: justify with last line right, 5: justify with last line center, 6: justify with last line full)

/** @hidden */
export enum PowerPreference {
    SRGB = "srgb"
}

/** @hidden */
export enum PowerPreference {
    LowPower = "low-power",
    HighPerformance = "high-performance"
}

/** @hidden */
export enum FeatureName {
    DepthClamping = "depth-clamping",
    Depth24UnormStencil8 = "depth24unorm-stencil8",
    Depth32FloatStencil8 = "depth32float-stencil8",
    PipelineStatisticsQuery = "pipeline-statistics-query",
    TextureCompressionBC = "texture-compression-bc",
    TimestampQuery = "timestamp-query"
}

/** @hidden */
export enum BufferUsage {
    MapRead = 1,
    MapWrite = 2,
    CopySrc = 4,
    CopyDst = 8,
    Index = 16,
    Vertex = 32,
    Uniform = 64,
    Storage = 128,
    Indirect = 256,
    QueryResolve = 512
}

/** @hidden */
export enum MapMode {
    Read = 1,
    Write = 2
}

/** @hidden */
export enum TextureDimension {
    E1d = "1d",
    E2d = "2d",
    E3d = "3d"
}

/** @hidden */
export enum TextureUsage {
    CopySrc = 1,
    CopyDst = 2,
    Sampled = 4,
    Storage = 8,
    RenderAttachment = 16
}

/** @hidden */
export enum TextureViewDimension {
    E1d = "1d",
    E2d = "2d",
    E2dArray = "2d-array",
    Cube = "cube",
    CubeArray = "cube-array",
    E3d = "3d"
}

/** @hidden */
export enum TextureAspect {
    All = "all",
    StencilOnly = "stencil-only",
    DepthOnly = "depth-only"
}

/** @hidden */
export enum TextureFormat {
    // 8-bit formats
    R8Unorm = "r8unorm",
    R8Snorm = "r8snorm",
    R8Uint = "r8uint",
    R8Sint = "r8sint",

    // 16-bit formats
    R16Uint = "r16uint",
    R16Sint = "r16sint",
    R16Float = "r16float",
    RG8Unorm = "rg8unorm",
    RG8Snorm = "rg8snorm",
    RG8Uint = "rg8uint",
    RG8Sint = "rg8sint",

    // 32-bit formats
    R32Uint = "r32uint",
    R32Sint = "r32sint",
    R32Float = "r32float",
    RG16Uint = "rg16uint",
    RG16Sint = "rg16sint",
    RG16Float = "rg16float",
    RGBA8Unorm = "rgba8unorm",
    RGBA8UnormSRGB = "rgba8unorm-srgb",
    RGBA8Snorm = "rgba8snorm",
    RGBA8Uint = "rgba8uint",
    RGBA8Sint = "rgba8sint",
    BGRA8Unorm = "bgra8unorm",
    BGRA8UnormSRGB = "bgra8unorm-srgb",
    // Packed 32-bit formats
    RGB9E5UFloat = "rgb9e5ufloat",
    RGB10A2Unorm = "rgb10a2unorm",
    RG11B10UFloat = "rg11b10ufloat",

    // 64-bit formats
    RG32Uint = "rg32uint",
    RG32Sint = "rg32sint",
    RG32Float = "rg32float",
    RGBA16Uint = "rgba16uint",
    RGBA16Sint = "rgba16sint",
    RGBA16Float = "rgba16float",

    // 128-bit formats
    RGBA32Uint = "rgba32uint",
    RGBA32Sint = "rgba32sint",
    RGBA32Float = "rgba32float",

    // Depth and stencil formats
    Stencil8 = "stencil8",
    Depth16Unorm = "depth16unorm",
    Depth24Plus = "depth24plus",
    Depth24PlusStencil8 = "depth24plus-stencil8",
    Depth32Float = "depth32float",

    // BC compressed formats usable if "texture-compression-bc" is both
    // supported by the device/user agent and enabled in requestDevice.
    BC1RGBAUnorm = "bc1-rgba-unorm",
    BC1RGBAUnormSRGB = "bc1-rgba-unorm-srgb",
    BC2RGBAUnorm = "bc2-rgba-unorm",
    BC2RGBAUnormSRGB = "bc2-rgba-unorm-srgb",
    BC3RGBAUnorm = "bc3-rgba-unorm",
    BC3RGBAUnormSRGB = "bc3-rgba-unorm-srgb",
    BC4RUnorm = "bc4-r-unorm",
    BC4RSnorm = "bc4-r-snorm",
    BC5RGUnorm = "bc5-rg-unorm",
    BC5RGSnorm = "bc5-rg-snorm",
    BC6HRGBUFloat = "bc6h-rgb-ufloat",
    BC6HRGBFloat = "bc6h-rgb-float",
    BC7RGBAUnorm = "bc7-rgba-unorm",
    BC7RGBAUnormSRGB = "bc7-rgba-unorm-srgb",

    // "depth24unorm-stencil8" feature
    Depth24UnormStencil8 = "depth24unorm-stencil8",

    // "depth32float-stencil8" feature
    Depth32FloatStencil8 = "depth32float-stencil8"
}

/** @hidden */
export enum AddressMode {
    ClampToEdge = "clamp-to-edge",
    Repeat = "repeat",
    MirrorRepeat = "mirror-repeat"
}

/** @hidden */
export enum FilterMode {
    Nearest = "nearest",
    Linear = "linear"
}

/** @hidden */
export enum CompareFunction {
    Never = "never",
    Less = "less",
    Equal = "equal",
    LessEqual = "less-equal",
    Greater = "greater",
    NotEqual = "not-equal",
    GreaterEqual = "greater-equal",
    Always = "always"
}

/** @hidden */
export enum ShaderStage {
    Vertex = 1,
    Fragment = 2,
    Compute = 4
}

/** @hidden */
export enum BufferBindingType {
    Uniform = "uniform",
    Storage = "storage",
    ReadOnlyStorage = "read-only-storage"
}

/** @hidden */
export enum SamplerBindingType {
    Filtering = "filtering",
    NonFiltering = "non-filtering",
    Comparison = "comparison"
}

/** @hidden */
export enum TextureSampleType {
    Float = "float",
    UnfilterableFloat = "unfilterable-float",
    Depth = "depth",
    Sint = "sint",
    Uint = "uint"
}

/** @hidden */
export enum StorageTextureAccess {
    ReadOnly = "read-only",
    WriteOnly = "write-only"
}

/** @hidden */
export enum CompilationMessageType {
    Error = "error",
    Warning = "warning",
    Info = "info"
}

/** @hidden */
export enum PrimitiveTopology {
    PointList = "point-list",
    LineList = "line-list",
    LineStrip = "line-strip",
    TriangleList = "triangle-list",
    TriangleStrip = "triangle-strip"
}

/** @hidden */
export enum FrontFace {
    CCW = "ccw",
    CW = "cw"
}

/** @hidden */
export enum CullMode {
    None = "none",
    Front = "front",
    Back = "back"
}

/** @hidden */
export enum ColorWrite {
    Red = 1,
    Green = 2,
    Blue = 4,
    Alpha = 8,
    All = 15
}

/** @hidden */
export enum BlendFactor {
    Zero = "zero",
    One = "one",
    Src = "src",
    OneMinusSrc = "one-minus-src",
    SrcAlpha = "src-alpha",
    OneMinusSrcAlpha = "one-minus-src-alpha",
    Dst = "dst",
    OneMinusDst = "one-minus-dst",
    DstAlpha = "dst-alpha",
    OneMinusDstAlpha = "one-minus-dst-alpha",
    SrcAlphaSaturated = "src-alpha-saturated",
    Constant = "constant",
    OneMinusConstant = "one-minus-constant"
}

/** @hidden */
export enum BlendOperation {
    Add = "add",
    Subtract = "subtract",
    ReverseSubtract = "reverse-subtract",
    Min = "min",
    Max = "max"
}

/** @hidden */
export enum StencilOperation {
    Keep = "keep",
    Zero = "zero",
    Replace = "replace",
    Invert = "invert",
    IncrementClamp = "increment-clamp",
    DecrementClamp = "decrement-clamp",
    IncrementWrap = "increment-wrap",
    DecrementWrap = "decrement-wrap"
}

/** @hidden */
export enum IndexFormat {
    Uint16 = "uint16",
    Uint32 = "uint32"
}

/** @hidden */
export enum VertexFormat {
    Uint8x2 = "uint8x2",
    Uint8x4 = "uint8x4",
    Sint8x2 = "sint8x2",
    Sint8x4 = "sint8x4",
    Unorm8x2 = "unorm8x2",
    Unorm8x4 = "unorm8x4",
    Snorm8x2 = "snorm8x2",
    Snorm8x4 = "snorm8x4",
    Uint16x2 = "uint16x2",
    Uint16x4 = "uint16x4",
    Sint16x2 = "sint16x2",
    Sint16x4 = "sint16x4",
    Unorm16x2 = "unorm16x2",
    Unorm16x4 = "unorm16x4",
    Snorm16x2 = "snorm16x2",
    Snorm16x4 = "snorm16x4",
    Float16x2 = "float16x2",
    Float16x4 = "float16x4",
    Float32 = "float32",
    Float32x2 = "float32x2",
    Float32x3 = "float32x3",
    Float32x4 = "float32x4",
    Uint32 = "uint32",
    Uint32x2 = "uint32x2",
    Uint32x3 = "uint32x3",
    Uint32x4 = "uint32x4",
    Sint32 = "sint32",
    Sint32x2 = "sint32x2",
    Sint32x3 = "sint32x3",
    Sint32x4 = "sint32x4"
}

/** @hidden */
export enum InputStepMode {
    Vertex = "vertex",
    Instance = "instance"
}

/** @hidden */
export enum LoadOp {
    Load = "load"
}

/** @hidden */
export enum StoreOp {
    Store = "store",
    Clear = "clear"
}

/** @hidden */
export enum QueryType {
    Occlusion = "occlusion",
    PipelineStatistics = "pipeline-statistics",
    Timestamp = "timestamp"
}

/** @hidden */
export enum PipelineStatisticName {
    VertexShaderInvocations = "vertex-shader-invocations",
    ClipperInvocations = "clipper-invocations",
    ClipperPrimitivesOut = "clipper-primitives-out",
    FragmentShaderInvocations = "fragment-shader-invocations",
    ComputeShaderInvocations = "compute-shader-invocations"
}

/** @hidden */
export enum CanvasCompositingAlphaMode {
    Opaque = "opaque",
    Premultiplied = "premultiplied"
}

/** @hidden */
export enum DeviceLostReason {
    Destroyed = "destroyed"
}

/** @hidden */
export enum ErrorFilter {
    OutOfMemory = "out-of-memory",
    Validation = "validation"
}

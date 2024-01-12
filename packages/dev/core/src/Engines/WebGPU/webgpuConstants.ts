/** @internal */
// eslint-disable-next-line import/export
export enum PowerPreference {
    LowPower = "low-power",
    HighPerformance = "high-performance",
}

/** @internal */
export enum FeatureName {
    DepthClipControl = "depth-clip-control",
    Depth32FloatStencil8 = "depth32float-stencil8",
    TextureCompressionBC = "texture-compression-bc",
    TextureCompressionETC2 = "texture-compression-etc2",
    TextureCompressionASTC = "texture-compression-astc",
    TimestampQuery = "timestamp-query",
    IndirectFirstInstance = "indirect-first-instance",
    ShaderF16 = "shader-f16",
    RG11B10UFloatRenderable = "rg11b10ufloat-renderable",
    BGRA8UnormStorage = "bgra8unorm-storage",
    Float32Filterable = "float32-filterable",
}

/** @internal */
export enum BufferMapState {
    Unmapped = "unmapped",
    Pending = "pending",
    Mapped = "mapped",
}

/** @internal */
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
    QueryResolve = 512,
}

/** @internal */
export enum MapMode {
    Read = 1,
    Write = 2,
}

/** @internal */
export enum TextureDimension {
    E1d = "1d",
    E2d = "2d",
    E3d = "3d",
}

/** @internal */
export enum TextureUsage {
    CopySrc = 1,
    CopyDst = 2,
    TextureBinding = 4,
    StorageBinding = 8,
    RenderAttachment = 16,
}

/** @internal */
export enum TextureViewDimension {
    E1d = "1d",
    E2d = "2d",
    E2dArray = "2d-array",
    Cube = "cube",
    CubeArray = "cube-array",
    E3d = "3d",
}

/** @internal */
export enum TextureAspect {
    All = "all",
    StencilOnly = "stencil-only",
    DepthOnly = "depth-only",
}

/**
 * Comments taken from https://github.com/gfx-rs/wgpu/blob/master/wgpu-types/src/lib.rs
 * @internal
 */
export enum TextureFormat {
    // 8-bit formats
    R8Unorm = "r8unorm", // Red channel only. 8 bit integer per channel. [0, 255] converted to/from float [0, 1] in shader.
    R8Snorm = "r8snorm", // Red channel only. 8 bit integer per channel. [-127, 127] converted to/from float [-1, 1] in shader.
    R8Uint = "r8uint", // Red channel only. 8 bit integer per channel. Unsigned in shader.
    R8Sint = "r8sint", // Red channel only. 8 bit integer per channel. Signed in shader.

    // 16-bit formats
    R16Uint = "r16uint", // Red channel only. 16 bit integer per channel. Unsigned in shader.
    R16Sint = "r16sint", // Red channel only. 16 bit integer per channel. Signed in shader.
    R16Float = "r16float", // Red channel only. 16 bit float per channel. Float in shader.
    RG8Unorm = "rg8unorm", // Red and green channels. 8 bit integer per channel. [0, 255] converted to/from float [0, 1] in shader.
    RG8Snorm = "rg8snorm", // Red and green channels. 8 bit integer per channel. [-127, 127] converted to/from float [-1, 1] in shader.
    RG8Uint = "rg8uint", // Red and green channels. 8 bit integer per channel. Unsigned in shader.
    RG8Sint = "rg8sint", // Red and green channels. 8 bit integer per channel. Signed in shader.

    // 32-bit formats
    R32Uint = "r32uint", // Red channel only. 32 bit integer per channel. Unsigned in shader.
    R32Sint = "r32sint", // Red channel only. 32 bit integer per channel. Signed in shader.
    R32Float = "r32float", // Red channel only. 32 bit float per channel. Float in shader.
    RG16Uint = "rg16uint", // Red and green channels. 16 bit integer per channel. Unsigned in shader.
    RG16Sint = "rg16sint", // Red and green channels. 16 bit integer per channel. Signed in shader.
    RG16Float = "rg16float", // Red and green channels. 16 bit float per channel. Float in shader.
    RGBA8Unorm = "rgba8unorm", // Red, green, blue, and alpha channels. 8 bit integer per channel. [0, 255] converted to/from float [0, 1] in shader.
    RGBA8UnormSRGB = "rgba8unorm-srgb", // Red, green, blue, and alpha channels. 8 bit integer per channel. Srgb-color [0, 255] converted to/from linear-color float [0, 1] in shader.
    RGBA8Snorm = "rgba8snorm", // Red, green, blue, and alpha channels. 8 bit integer per channel. [-127, 127] converted to/from float [-1, 1] in shader.
    RGBA8Uint = "rgba8uint", // Red, green, blue, and alpha channels. 8 bit integer per channel. Unsigned in shader.
    RGBA8Sint = "rgba8sint", // Red, green, blue, and alpha channels. 8 bit integer per channel. Signed in shader.
    BGRA8Unorm = "bgra8unorm", // Blue, green, red, and alpha channels. 8 bit integer per channel. [0, 255] converted to/from float [0, 1] in shader.
    BGRA8UnormSRGB = "bgra8unorm-srgb", // Blue, green, red, and alpha channels. 8 bit integer per channel. Srgb-color [0, 255] converted to/from linear-color float [0, 1] in shader.
    // Packed 32-bit formats
    RGB9E5UFloat = "rgb9e5ufloat", // Packed unsigned float with 9 bits mantisa for each RGB component, then a common 5 bits exponent
    RGB10A2UINT = "rgb10a2uint", // Red, green, blue, and alpha channels. 10 bit integer for RGB channels, 2 bit integer for alpha channel. [0, 1023] ([0, 3] for alpha).
    RGB10A2Unorm = "rgb10a2unorm", // Red, green, blue, and alpha channels. 10 bit integer for RGB channels, 2 bit integer for alpha channel. [0, 1023] ([0, 3] for alpha) converted to/from float [0, 1] in shader.
    RG11B10UFloat = "rg11b10ufloat", // Red, green, and blue channels. 11 bit float with no sign bit for RG channels. 10 bit float with no sign bit for blue channel. Float in shader.

    // 64-bit formats
    RG32Uint = "rg32uint", // Red and green channels. 32 bit integer per channel. Unsigned in shader.
    RG32Sint = "rg32sint", // Red and green channels. 32 bit integer per channel. Signed in shader.
    RG32Float = "rg32float", // Red and green channels. 32 bit float per channel. Float in shader.
    RGBA16Uint = "rgba16uint", // Red, green, blue, and alpha channels. 16 bit integer per channel. Unsigned in shader.
    RGBA16Sint = "rgba16sint", // Red, green, blue, and alpha channels. 16 bit integer per channel. Signed in shader.
    RGBA16Float = "rgba16float", // Red, green, blue, and alpha channels. 16 bit float per channel. Float in shader.

    // 128-bit formats
    RGBA32Uint = "rgba32uint", // Red, green, blue, and alpha channels. 32 bit integer per channel. Unsigned in shader.
    RGBA32Sint = "rgba32sint", // Red, green, blue, and alpha channels. 32 bit integer per channel. Signed in shader.
    RGBA32Float = "rgba32float", // Red, green, blue, and alpha channels. 32 bit float per channel. Float in shader.

    // Depth and stencil formats
    Stencil8 = "stencil8",
    Depth16Unorm = "depth16unorm",
    Depth24Plus = "depth24plus", // Special depth format with at least 24 bit integer depth.
    Depth24PlusStencil8 = "depth24plus-stencil8", // Special depth/stencil format with at least 24 bit integer depth and 8 bits integer stencil.
    Depth32Float = "depth32float", // Special depth format with 32 bit floating point depth.

    // BC compressed formats usable if "texture-compression-bc" is both
    // supported by the device/user agent and enabled in requestDevice.
    BC1RGBAUnorm = "bc1-rgba-unorm", // 4x4 block compressed texture. 8 bytes per block (4 bit/px). 4 color + alpha pallet. 5 bit R + 6 bit G + 5 bit B + 1 bit alpha. Also known as DXT1.
    BC1RGBAUnormSRGB = "bc1-rgba-unorm-srgb", // 4x4 block compressed texture. 8 bytes per block (4 bit/px). 4 color + alpha pallet. 5 bit R + 6 bit G + 5 bit B + 1 bit alpha. Also known as DXT1.
    BC2RGBAUnorm = "bc2-rgba-unorm", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). 4 color pallet. 5 bit R + 6 bit G + 5 bit B + 4 bit alpha. Also known as DXT3.
    BC2RGBAUnormSRGB = "bc2-rgba-unorm-srgb", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). 4 color pallet. 5 bit R + 6 bit G + 5 bit B + 4 bit alpha. Also known as DXT3.
    BC3RGBAUnorm = "bc3-rgba-unorm", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). 4 color pallet + 8 alpha pallet. 5 bit R + 6 bit G + 5 bit B + 8 bit alpha. Also known as DXT5.
    BC3RGBAUnormSRGB = "bc3-rgba-unorm-srgb", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). 4 color pallet + 8 alpha pallet. 5 bit R + 6 bit G + 5 bit B + 8 bit alpha. Also known as DXT5.
    BC4RUnorm = "bc4-r-unorm", // 4x4 block compressed texture. 8 bytes per block (4 bit/px). 8 color pallet. 8 bit R. Also known as RGTC1.
    BC4RSnorm = "bc4-r-snorm", // 4x4 block compressed texture. 8 bytes per block (4 bit/px). 8 color pallet. 8 bit R. Also known as RGTC1.
    BC5RGUnorm = "bc5-rg-unorm", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). 8 color red pallet + 8 color green pallet. 8 bit RG. Also known as RGTC2.
    BC5RGSnorm = "bc5-rg-snorm", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). 8 color red pallet + 8 color green pallet. 8 bit RG. Also known as RGTC2.
    BC6HRGBUFloat = "bc6h-rgb-ufloat", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). Variable sized pallet. 16 bit unsigned float RGB. Float in shader. Also known as BPTC (float).
    BC6HRGBFloat = "bc6h-rgb-float", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). Variable sized pallet. 16 bit signed float RGB. Float in shader. Also known as BPTC (float).
    BC7RGBAUnorm = "bc7-rgba-unorm", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). Variable sized pallet. 8 bit integer RGBA. Also known as BPTC (unorm).
    BC7RGBAUnormSRGB = "bc7-rgba-unorm-srgb", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). Variable sized pallet. 8 bit integer RGBA. Also known as BPTC (unorm).

    // ETC2 compressed formats usable if "texture-compression-etc2" is both
    // supported by the device/user agent and enabled in requestDevice.
    ETC2RGB8Unorm = "etc2-rgb8unorm", // 4x4 block compressed texture. 8 bytes per block (4 bit/px). Complex pallet. 8 bit integer RGB.
    ETC2RGB8UnormSRGB = "etc2-rgb8unorm-srgb", // 4x4 block compressed texture. 8 bytes per block (4 bit/px). Complex pallet. 8 bit integer RGB.
    ETC2RGB8A1Unorm = "etc2-rgb8a1unorm", // 4x4 block compressed texture. 8 bytes per block (4 bit/px). Complex pallet. 8 bit integer RGB + 1 bit alpha.
    ETC2RGB8A1UnormSRGB = "etc2-rgb8a1unorm-srgb", // 4x4 block compressed texture. 8 bytes per block (4 bit/px). Complex pallet. 8 bit integer RGB + 1 bit alpha.
    ETC2RGBA8Unorm = "etc2-rgba8unorm", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). Complex pallet. 8 bit integer RGB + 8 bit alpha.
    ETC2RGBA8UnormSRGB = "etc2-rgba8unorm-srgb", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). Complex pallet. 8 bit integer RGB + 8 bit alpha.
    EACR11Unorm = "eac-r11unorm", // 4x4 block compressed texture. 8 bytes per block (4 bit/px). Complex pallet. 11 bit integer R.
    EACR11Snorm = "eac-r11snorm", // 4x4 block compressed texture. 8 bytes per block (4 bit/px). Complex pallet. 11 bit integer R.
    EACRG11Unorm = "eac-rg11unorm", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). Complex pallet. 11 bit integer R + 11 bit integer G.
    EACRG11Snorm = "eac-rg11snorm", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). Complex pallet. 11 bit integer R + 11 bit integer G.

    // ASTC compressed formats usable if "texture-compression-astc" is both
    // supported by the device/user agent and enabled in requestDevice.
    ASTC4x4Unorm = "astc-4x4-unorm", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC4x4UnormSRGB = "astc-4x4-unorm-srgb", // 4x4 block compressed texture. 16 bytes per block (8 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC5x4Unorm = "astc-5x4-unorm", // 5x4 block compressed texture. 16 bytes per block (6.4 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC5x4UnormSRGB = "astc-5x4-unorm-srgb", // 5x4 block compressed texture. 16 bytes per block (6.4 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC5x5Unorm = "astc-5x5-unorm", // 5x5 block compressed texture. 16 bytes per block (5.12 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC5x5UnormSRGB = "astc-5x5-unorm-srgb", // 5x5 block compressed texture. 16 bytes per block (5.12 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC6x5Unorm = "astc-6x5-unorm", // 6x5 block compressed texture. 16 bytes per block (4.27 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC6x5UnormSRGB = "astc-6x5-unorm-srgb", // 6x5 block compressed texture. 16 bytes per block (4.27 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC6x6Unorm = "astc-6x6-unorm", // 6x6 block compressed texture. 16 bytes per block (3.56 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC6x6UnormSRGB = "astc-6x6-unorm-srgb", // 6x6 block compressed texture. 16 bytes per block (3.56 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC8x5Unorm = "astc-8x5-unorm", // 8x5 block compressed texture. 16 bytes per block (3.2 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC8x5UnormSRGB = "astc-8x5-unorm-srgb", // 8x5 block compressed texture. 16 bytes per block (3.2 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC8x6Unorm = "astc-8x6-unorm", // 8x6 block compressed texture. 16 bytes per block (2.67 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC8x6UnormSRGB = "astc-8x6-unorm-srgb", // 8x6 block compressed texture. 16 bytes per block (2.67 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC8x8Unorm = "astc-8x8-unorm", // 8x8 block compressed texture. 16 bytes per block (2 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC8x8UnormSRGB = "astc-8x8-unorm-srgb", // 8x8 block compressed texture. 16 bytes per block (2 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC10x5Unorm = "astc-10x5-unorm", // 10x5 block compressed texture. 16 bytes per block (2.56 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC10x5UnormSRGB = "astc-10x5-unorm-srgb", // 10x5 block compressed texture. 16 bytes per block (2.56 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC10x6Unorm = "astc-10x6-unorm", // 10x6 block compressed texture. 16 bytes per block (2.13 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC10x6UnormSRGB = "astc-10x6-unorm-srgb", // 10x6 block compressed texture. 16 bytes per block (2.13 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC10x8Unorm = "astc-10x8-unorm", // 10x8 block compressed texture. 16 bytes per block (1.6 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC10x8UnormSRGB = "astc-10x8-unorm-srgb", // 10x8 block compressed texture. 16 bytes per block (1.6 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC10x10Unorm = "astc-10x10-unorm", // 10x10 block compressed texture. 16 bytes per block (1.28 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC10x10UnormSRGB = "astc-10x10-unorm-srgb", // 10x10 block compressed texture. 16 bytes per block (1.28 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC12x10Unorm = "astc-12x10-unorm", // 12x10 block compressed texture. 16 bytes per block (1.07 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC12x10UnormSRGB = "astc-12x10-unorm-srgb", // 12x10 block compressed texture. 16 bytes per block (1.07 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC12x12Unorm = "astc-12x12-unorm", // 12x12 block compressed texture. 16 bytes per block (0.89 bit/px). Complex pallet. 8 bit integer RGBA.
    ASTC12x12UnormSRGB = "astc-12x12-unorm-srgb", // 12x12 block compressed texture. 16 bytes per block (0.89 bit/px). Complex pallet. 8 bit integer RGBA.

    // "depth32float-stencil8" feature
    Depth32FloatStencil8 = "depth32float-stencil8",
}

/** @internal */
export enum AddressMode {
    ClampToEdge = "clamp-to-edge",
    Repeat = "repeat",
    MirrorRepeat = "mirror-repeat",
}

/** @internal */
export enum FilterMode {
    Nearest = "nearest",
    Linear = "linear",
}

/** @internal */
export enum MipmapFilterMode {
    Nearest = "nearest",
    Linear = "linear",
}

/** @internal */
export enum CompareFunction {
    Never = "never",
    Less = "less",
    Equal = "equal",
    LessEqual = "less-equal",
    Greater = "greater",
    NotEqual = "not-equal",
    GreaterEqual = "greater-equal",
    Always = "always",
}

/** @internal */
export enum ShaderStage {
    Vertex = 1,
    Fragment = 2,
    Compute = 4,
}

/** @internal */
export enum BufferBindingType {
    Uniform = "uniform",
    Storage = "storage",
    ReadOnlyStorage = "read-only-storage",
}

/** @internal */
export enum SamplerBindingType {
    Filtering = "filtering",
    NonFiltering = "non-filtering",
    Comparison = "comparison",
}

/** @internal */
export enum TextureSampleType {
    Float = "float",
    UnfilterableFloat = "unfilterable-float",
    Depth = "depth",
    Sint = "sint",
    Uint = "uint",
}

/** @internal */
export enum StorageTextureAccess {
    WriteOnly = "write-only",
    ReadOnly = "read-only",
    ReadWrite = "read-write",
}

/** @internal */
export enum CompilationMessageType {
    Error = "error",
    Warning = "warning",
    Info = "info",
}

/** @internal */
export enum PipelineErrorReason {
    Validation = "validation",
    Internal = "internal",
}

/** @internal */
export enum AutoLayoutMode {
    Auto = "auto",
}

/** @internal */
export enum PrimitiveTopology {
    PointList = "point-list",
    LineList = "line-list",
    LineStrip = "line-strip",
    TriangleList = "triangle-list",
    TriangleStrip = "triangle-strip",
}

/** @internal */
export enum FrontFace {
    CCW = "ccw",
    CW = "cw",
}

/** @internal */
export enum CullMode {
    None = "none",
    Front = "front",
    Back = "back",
}

/** @internal */
export enum ColorWrite {
    Red = 1,
    Green = 2,
    Blue = 4,
    Alpha = 8,
    All = 15,
}

/** @internal */
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
    OneMinusConstant = "one-minus-constant",
}

/** @internal */
export enum BlendOperation {
    Add = "add",
    Subtract = "subtract",
    ReverseSubtract = "reverse-subtract",
    Min = "min",
    Max = "max",
}

/** @internal */
export enum StencilOperation {
    Keep = "keep",
    Zero = "zero",
    Replace = "replace",
    Invert = "invert",
    IncrementClamp = "increment-clamp",
    DecrementClamp = "decrement-clamp",
    IncrementWrap = "increment-wrap",
    DecrementWrap = "decrement-wrap",
}

/** @internal */
export enum IndexFormat {
    Uint16 = "uint16",
    Uint32 = "uint32",
}

/** @internal */
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
    Sint32x4 = "sint32x4",
    UNORM10x10x10x2 = "unorm10-10-10-2",
}

/** @internal */
export enum VertexStepMode {
    Vertex = "vertex",
    Instance = "instance",
}

/** @internal */
export enum ComputePassTimestampLocation {
    Beginning = "beginning",
    End = "end",
}

/** @internal */
export enum RenderPassTimestampLocation {
    Beginning = "beginning",
    End = "end",
}

/** @internal */
export enum LoadOp {
    Load = "load",
    Clear = "clear",
}

/** @internal */
export enum StoreOp {
    Store = "store",
    Discard = "discard",
}

/** @internal */
export enum QueryType {
    Occlusion = "occlusion",
    Timestamp = "timestamp",
}

/** @internal */
export enum CanvasAlphaMode {
    Opaque = "opaque",
    Premultiplied = "premultiplied",
}

/** @internal */
export enum DeviceLostReason {
    Unknown = "unknown",
    Destroyed = "destroyed",
}

/** @internal */
export enum ErrorFilter {
    Validation = "validation",
    OutOfMemory = "out-of-memory",
    Internal = "internal",
}

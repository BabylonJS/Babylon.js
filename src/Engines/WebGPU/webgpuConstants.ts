/** @hidden */
export class WebGPUConstants {
    public static readonly GPUCullMode_none: GPUCullMode = "none";
    public static readonly GPUCullMode_front: GPUCullMode = "front";
    public static readonly GPUCullMode_back: GPUCullMode = "back";

    public static readonly GPUFrontFace_ccw: GPUFrontFace = "ccw";
    public static readonly GPUFrontFace_cw: GPUFrontFace = "cw";

    public static readonly GPUIndexFormat_uint16: GPUIndexFormat = "uint16";
    public static readonly GPUIndexFormat_uint32: GPUIndexFormat = "uint32";

    public static readonly GPULoadOp_load: GPULoadOp = "load";

    public static readonly GPUStoreOp_store: GPUStoreOp = "store";
    public static readonly GPUStoreOp_clear: GPUStoreOp = "clear";

    public static readonly GPUPrimitiveTopology_pointList: GPUPrimitiveTopology = "point-list";
    public static readonly GPUPrimitiveTopology_lineList: GPUPrimitiveTopology = "line-list";
    public static readonly GPUPrimitiveTopology_lineStrip: GPUPrimitiveTopology = "line-strip";
    public static readonly GPUPrimitiveTopology_triangleList: GPUPrimitiveTopology = "triangle-list";
    public static readonly GPUPrimitiveTopology_triangleStrip: GPUPrimitiveTopology = "triangle-strip";

    public static readonly GPUTextureDimension_1d: GPUTextureDimension = "1d";
    public static readonly GPUTextureDimension_2d: GPUTextureDimension = "2d";
    public static readonly GPUTextureDimension_3d: GPUTextureDimension = "3d";

    /* Normal 8 bit formats */
    public static readonly GPUTextureFormat_r8unorm: GPUTextureFormat = "r8unorm";
    public static readonly GPUTextureFormat_r8snorm: GPUTextureFormat = "r8snorm";
    public static readonly GPUTextureFormat_r8uint: GPUTextureFormat = "r8uint";
    public static readonly GPUTextureFormat_r8sint: GPUTextureFormat = "r8sint";
    /* Normal 16 bit formats */
    public static readonly GPUTextureFormat_r16uint: GPUTextureFormat = "r16uint";
    public static readonly GPUTextureFormat_r16sint: GPUTextureFormat = "r16sint";
    public static readonly GPUTextureFormat_r16float: GPUTextureFormat = "r16float";
    public static readonly GPUTextureFormat_rg8unorm: GPUTextureFormat = "rg8unorm";
    public static readonly GPUTextureFormat_rg8snorm: GPUTextureFormat = "rg8snorm";
    public static readonly GPUTextureFormat_rg8uint: GPUTextureFormat = "rg8uint";
    public static readonly GPUTextureFormat_rg8sint: GPUTextureFormat = "rg8sint";
    /* Normal 32 bit formats */
    public static readonly GPUTextureFormat_r32uint: GPUTextureFormat = "r32uint";
    public static readonly GPUTextureFormat_r32sint: GPUTextureFormat = "r32sint";
    public static readonly GPUTextureFormat_r32float: GPUTextureFormat = "r32float";
    public static readonly GPUTextureFormat_rg16uint: GPUTextureFormat = "rg16uint";
    public static readonly GPUTextureFormat_rg16sint: GPUTextureFormat = "rg16sint";
    public static readonly GPUTextureFormat_rg16float: GPUTextureFormat = "rg16float";
    public static readonly GPUTextureFormat_rgba8unorm: GPUTextureFormat = "rgba8unorm";
    public static readonly GPUTextureFormat_rgba8unormSrgb: GPUTextureFormat = "rgba8unorm-srgb";
    public static readonly GPUTextureFormat_rgba8snorm: GPUTextureFormat = "rgba8snorm";
    public static readonly GPUTextureFormat_rgba8uint: GPUTextureFormat = "rgba8uint";
    public static readonly GPUTextureFormat_rgba8sint: GPUTextureFormat = "rgba8sint";
    public static readonly GPUTextureFormat_bgra8unorm: GPUTextureFormat = "bgra8unorm";
    public static readonly GPUTextureFormat_bgra8unormSrgb: GPUTextureFormat = "bgra8unorm-srgb";
    /* Packed 32 bit formats */
    public static readonly GPUTextureFormat_rgb10a2unorm: GPUTextureFormat = "rgb10a2unorm";
    public static readonly GPUTextureFormat_rg11b10float: GPUTextureFormat = "rg11b10float";
    /* Normal 64 bit formats */
    public static readonly GPUTextureFormat_rg32uint: GPUTextureFormat = "rg32uint";
    public static readonly GPUTextureFormat_rg32sint: GPUTextureFormat = "rg32sint";
    public static readonly GPUTextureFormat_rg32float: GPUTextureFormat = "rg32float";
    public static readonly GPUTextureFormat_rgba16uint: GPUTextureFormat = "rgba16uint";
    public static readonly GPUTextureFormat_rgba16sint: GPUTextureFormat = "rgba16sint";
    public static readonly GPUTextureFormat_rgba16float: GPUTextureFormat = "rgba16float";
    /* Normal 128 bit formats */
    public static readonly GPUTextureFormat_rgba32uint: GPUTextureFormat = "rgba32uint";
    public static readonly GPUTextureFormat_rgba32sint: GPUTextureFormat = "rgba32sint";
    public static readonly GPUTextureFormat_rgba32float: GPUTextureFormat = "rgba32float";
    /* Depth and Stencil formats */
    public static readonly GPUTextureFormat_depth32float: GPUTextureFormat = "depth32float";
    public static readonly GPUTextureFormat_depth24plus: GPUTextureFormat = "depth24plus";
    public static readonly GPUTextureFormat_depth24plusStencil8: GPUTextureFormat = "depth24plus-stencil8";

    public static readonly GPUTextureViewDimension_1d: GPUTextureViewDimension = "1d";
    public static readonly GPUTextureViewDimension_2d: GPUTextureViewDimension = "2d";
    public static readonly GPUTextureViewDimension_2dArray: GPUTextureViewDimension = "2d-array";
    public static readonly GPUTextureViewDimension_cube: GPUTextureViewDimension = "cube";
    public static readonly GPUTextureViewDimension_cubeArray: GPUTextureViewDimension = "cube-array";
    public static readonly GPUTextureViewDimension_3d: GPUTextureViewDimension = "3d";

    public static readonly GPUPowerPreference_lowPower: GPUPowerPreference = "low-power";
    public static readonly GPUPowerPreference_highPerformance: GPUPowerPreference = "high-performance";

    public static readonly GPUVertexFormat_uchar2: GPUVertexFormat = "uchar2";
    public static readonly GPUVertexFormat_uchar4: GPUVertexFormat = "uchar4";
    public static readonly GPUVertexFormat_char2: GPUVertexFormat = "char2";
    public static readonly GPUVertexFormat_char4: GPUVertexFormat = "char4";
    public static readonly GPUVertexFormat_uchar2norm: GPUVertexFormat = "uchar2norm";
    public static readonly GPUVertexFormat_uchar4norm: GPUVertexFormat = "uchar4norm";
    public static readonly GPUVertexFormat_char2norm: GPUVertexFormat = "char2norm";
    public static readonly GPUVertexFormat_char4norm: GPUVertexFormat = "char4norm";
    public static readonly GPUVertexFormat_ushort2: GPUVertexFormat = "ushort2";
    public static readonly GPUVertexFormat_ushort4: GPUVertexFormat = "ushort4";
    public static readonly GPUVertexFormat_short2: GPUVertexFormat = "short2";
    public static readonly GPUVertexFormat_short4: GPUVertexFormat = "short4";
    public static readonly GPUVertexFormat_ushort2norm: GPUVertexFormat = "ushort2norm";
    public static readonly GPUVertexFormat_ushort4norm: GPUVertexFormat = "ushort4norm";
    public static readonly GPUVertexFormat_short2norm: GPUVertexFormat = "short2norm";
    public static readonly GPUVertexFormat_short4norm: GPUVertexFormat = "short4norm";
    public static readonly GPUVertexFormat_half2: GPUVertexFormat = "half2";
    public static readonly GPUVertexFormat_half4: GPUVertexFormat = "half4";
    public static readonly GPUVertexFormat_float: GPUVertexFormat = "float";
    public static readonly GPUVertexFormat_float2: GPUVertexFormat = "float2";
    public static readonly GPUVertexFormat_float3: GPUVertexFormat = "float3";
    public static readonly GPUVertexFormat_float4: GPUVertexFormat = "float4";
    public static readonly GPUVertexFormat_uint: GPUVertexFormat = "uint";
    public static readonly GPUVertexFormat_uint2: GPUVertexFormat = "uint2";
    public static readonly GPUVertexFormat_uint3: GPUVertexFormat = "uint3";
    public static readonly GPUVertexFormat_uint4: GPUVertexFormat = "uint4";
    public static readonly GPUVertexFormat_int: GPUVertexFormat = "int";
    public static readonly GPUVertexFormat_int2: GPUVertexFormat = "int2";
    public static readonly GPUVertexFormat_int3: GPUVertexFormat = "int3";
    public static readonly GPUVertexFormat_int4: GPUVertexFormat = "int4";

    public static readonly GPUBufferUsage_NONE = 0x0000;
    public static readonly GPUBufferUsage_MAP_READ = 0x0001;
    public static readonly GPUBufferUsage_MAP_WRITE = 0x0002;
    public static readonly GPUBufferUsage_COPY_SRC = 0x0004;
    public static readonly GPUBufferUsage_COPY_DST = 0x0008;
    public static readonly GPUBufferUsage_INDEX = 0x0010;
    public static readonly GPUBufferUsage_VERTEX = 0x0020;
    public static readonly GPUBufferUsage_UNIFORM = 0x0040;
    public static readonly GPUBufferUsage_STORAGE = 0x0080;
    public static readonly GPUBufferUsage_INDIRECT = 0x0100;
    public static readonly GPUBufferUsage_QUERY_RESOLVE = 0x0200;

    public static readonly GPUMapMode_READ = 1;
    public static readonly GPUMapMode_WRITE = 2;

    public static readonly GPUColorWriteBits_NONE = 0;
    public static readonly GPUColorWriteBits_RED = 1;
    public static readonly GPUColorWriteBits_GREEN = 2;
    public static readonly GPUColorWriteBits_BLUE = 4;
    public static readonly GPUColorWriteBits_ALPHA = 8;
    public static readonly GPUColorWriteBits_ALL = 15;

    public static readonly GPUShaderStageBit_NONE = 0;
    public static readonly GPUShaderStageBit_VERTEX = 1;
    public static readonly GPUShaderStageBit_FRAGMENT = 2;
    public static readonly GPUShaderStageBit_COMPUTE = 4;

    public static readonly GPUTextureAspect_all: GPUTextureAspect = "all";
    public static readonly GPUTextureAspect_depthOnly: GPUTextureAspect = "depth-only";
    public static readonly GPUTextureAspect_stencilOnly: GPUTextureAspect = "stencil-only";

    public static readonly GPUTextureUsage_NONE = 0;
    public static readonly GPUTextureUsage_COPY_SRC = 1;
    public static readonly GPUTextureUsage_COPY_DST = 2;
    public static readonly GPUTextureUsage_SAMPLED = 4;
    public static readonly GPUTextureUsage_STORAGE = 8;
    public static readonly GPUTextureUsage_OUTPUT_ATTACHMENT = 16;

    public static readonly GPUCompareFunction_never: GPUCompareFunction = "never";
    public static readonly GPUCompareFunction_less: GPUCompareFunction = "less";
    public static readonly GPUCompareFunction_equal: GPUCompareFunction = "equal";
    public static readonly GPUCompareFunction_lessEqual: GPUCompareFunction = "less-equal";
    public static readonly GPUCompareFunction_greater: GPUCompareFunction = "greater";
    public static readonly GPUCompareFunction_notEqual: GPUCompareFunction = "not-equal";
    public static readonly GPUCompareFunction_greaterEqual: GPUCompareFunction = "greater-equal";
    public static readonly GPUCompareFunction_always: GPUCompareFunction = "always";

    public static readonly GPUBindingType_uniformBuffer: GPUBindingType = "uniform-buffer";
    public static readonly GPUBindingType_storageBuffer: GPUBindingType = "storage-buffer";
    public static readonly GPUBindingType_readonlyStorageBuffer: GPUBindingType = "readonly-storage-buffer";
    public static readonly GPUBindingType_sampler: GPUBindingType = "sampler";
    public static readonly GPUBindingType_comparisonSampler: GPUBindingType = "comparison-sampler";
    public static readonly GPUBindingType_sampledTexture: GPUBindingType = "sampled-texture";
    public static readonly GPUBindingType_storageTexture: GPUBindingType = "storage-texture";
    public static readonly GPUBindingType_readonlyStorageTexture: GPUBindingType = "readonly-storage-texture";
    public static readonly GPUBindingType_writeonlyStorageTexture: GPUBindingType = "writeonly-storage-texture";

    public static readonly GPUInputStepMode_vertex: GPUInputStepMode = "vertex";
    public static readonly GPUInputStepMode_instance: GPUInputStepMode = "instance";

    public static readonly GPUStencilOperation_keep: GPUStencilOperation = "keep";
    public static readonly GPUStencilOperation_zero: GPUStencilOperation = "zero";
    public static readonly GPUStencilOperation_replace: GPUStencilOperation = "replace";
    public static readonly GPUStencilOperation_invert: GPUStencilOperation = "invert";
    public static readonly GPUStencilOperation_incrementClamp: GPUStencilOperation = "increment-clamp";
    public static readonly GPUStencilOperation_decrementClamp: GPUStencilOperation = "decrement-clamp";
    public static readonly GPUStencilOperation_incrementWrap: GPUStencilOperation = "increment-wrap";
    public static readonly GPUStencilOperation_decrementWrap: GPUStencilOperation = "decrement-wrap";

    public static readonly GPUFilterMode_nearest: GPUFilterMode = "nearest";
    public static readonly GPUFilterMode_linear: GPUFilterMode = "linear";

    public static readonly GPUAddressMode_clampToEdge: GPUAddressMode = "clamp-to-edge";
    public static readonly GPUAddressMode_repeat: GPUAddressMode = "repeat";
    public static readonly GPUAddressMode_mirrorRepeat: GPUAddressMode = "mirror-repeat";

    public static readonly GPUBlendFactor_zero: GPUBlendFactor = "zero";
    public static readonly GPUBlendFactor_one: GPUBlendFactor = "one";
    public static readonly GPUBlendFactor_srcColor: GPUBlendFactor = "src-color";
    public static readonly GPUBlendFactor_oneMinusSrcColor: GPUBlendFactor = "one-minus-src-color";
    public static readonly GPUBlendFactor_srcAlpha: GPUBlendFactor = "src-alpha";
    public static readonly GPUBlendFactor_oneMinusSrcAlpha: GPUBlendFactor = "one-minus-src-alpha";
    public static readonly GPUBlendFactor_dstColor: GPUBlendFactor = "dst-color";
    public static readonly GPUBlendFactor_oneMinusDstColor: GPUBlendFactor = "one-minus-dst-color";
    public static readonly GPUBlendFactor_dstAlpha: GPUBlendFactor = "dst-alpha";
    public static readonly GPUBlendFactor_oneMinusDstAlpha: GPUBlendFactor = "one-minus-dst-alpha";
    public static readonly GPUBlendFactor_srcAlphaSaturated: GPUBlendFactor = "src-alpha-saturated";
    public static readonly GPUBlendFactor_blendColor: GPUBlendFactor = "blend-color";
    public static readonly GPUBlendFactor_oneMinusBlendColor: GPUBlendFactor = "one-minus-blend-color";

    public static readonly GPUBlendOperation_add: GPUBlendOperation = "add";
    public static readonly GPUBlendOperation_substract: GPUBlendOperation = "subtract";
    public static readonly GPUBlendOperation_reverseSubtract: GPUBlendOperation = "reverse-subtract";
    public static readonly GPUBlendOperation_min: GPUBlendOperation = "min";
    public static readonly GPUBlendOperation_max: GPUBlendOperation = "max";
}
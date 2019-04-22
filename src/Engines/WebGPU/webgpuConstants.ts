/** @hidden */
export class WebGPUConstants {
    public static readonly GPUCullMode_none: GPUCullMode = "none"
    public static readonly GPUCullMode_front: GPUCullMode = "front"
    public static readonly GPUCullMode_back: GPUCullMode = "back";

    public static readonly GPUFrontFace_ccw: GPUFrontFace = "ccw";
    public static readonly GPUFrontFace_cw: GPUFrontFace = "cw";

    public static readonly GPUIndexFormat_uint16: GPUIndexFormat = "uint16"
    public static readonly GPUIndexFormat_uint32: GPUIndexFormat = "uint32";

    public static readonly GPULoadOp_clear: GPULoadOp = "clear";
    public static readonly GPULoadOp_load: GPULoadOp = "load";

    public static readonly GPUStoreOp_store: GPUStoreOp = "store";

    public static readonly GPUPrimitiveTopology_pointList: GPUPrimitiveTopology = "point-list";
    public static readonly GPUPrimitiveTopology_lineList: GPUPrimitiveTopology = "line-list";
    public static readonly GPUPrimitiveTopology_lineStrip: GPUPrimitiveTopology = "line-strip";
    public static readonly GPUPrimitiveTopology_triangleList: GPUPrimitiveTopology = "triangle-list"
    public static readonly GPUPrimitiveTopology_triangleStrip: GPUPrimitiveTopology = "triangle-strip";
    
    public static readonly GPUTextureDimension_1d: GPUTextureDimension = "1d";
    public static readonly GPUTextureDimension_2d: GPUTextureDimension = "2d";
    public static readonly GPUTextureDimension_3d: GPUTextureDimension = "3d";

    /* Normal 8 bit formats */
    public static readonly GPUTextureFormat_r8unorm: GPUTextureFormat = "r8unorm";
    public static readonly GPUTextureFormat_r8unormSrgb: GPUTextureFormat = "r8unorm-srgb";
    public static readonly GPUTextureFormat_r8snorm: GPUTextureFormat = "r8snorm";
    public static readonly GPUTextureFormat_r8uint: GPUTextureFormat = "r8uint";
    public static readonly GPUTextureFormat_r8sint: GPUTextureFormat = "r8sint";
    /* Normal 16 bit formats */
    public static readonly GPUTextureFormat_r16unorm: GPUTextureFormat = "r16unorm";
    public static readonly GPUTextureFormat_r16snorm: GPUTextureFormat = "r16snorm";
    public static readonly GPUTextureFormat_r16uint: GPUTextureFormat = "r16uint";
    public static readonly GPUTextureFormat_r16sint: GPUTextureFormat = "r16sint";
    public static readonly GPUTextureFormat_r16float: GPUTextureFormat = "r16float";
    public static readonly GPUTextureFormat_rg8unorm: GPUTextureFormat = "rg8unorm";
    public static readonly GPUTextureFormat_rg8unormSrgb: GPUTextureFormat = "rg8unorm-srgb";
    public static readonly GPUTextureFormat_rg8snorm: GPUTextureFormat = "rg8snorm";
    public static readonly GPUTextureFormat_rg8uint: GPUTextureFormat = "rg8uint";
    public static readonly GPUTextureFormat_rg8sint: GPUTextureFormat = "rg8sint";
    /* Packed 16 bit formats */
    public static readonly GPUTextureFormat_b5g6r5unorm: GPUTextureFormat = "b5g6r5unorm";
    /* Normal 32 bit formats */
    public static readonly GPUTextureFormat_r32uint: GPUTextureFormat = "r32uint";
    public static readonly GPUTextureFormat_r32sint: GPUTextureFormat = "r32sint";
    public static readonly GPUTextureFormat_r32float: GPUTextureFormat = "r32float";
    public static readonly GPUTextureFormat_rg16unorm: GPUTextureFormat = "rg16unorm";
    public static readonly GPUTextureFormat_rg16snorm: GPUTextureFormat = "rg16snorm";
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
    public static readonly GPUTextureFormat_rgba16unorm: GPUTextureFormat = "rgba16unorm";
    public static readonly GPUTextureFormat_rgba16snorm: GPUTextureFormat = "rgba16snorm";
    public static readonly GPUTextureFormat_rgba16uint: GPUTextureFormat = "rgba16uint";
    public static readonly GPUTextureFormat_rgba16sint: GPUTextureFormat = "rgba16sint";
    public static readonly GPUTextureFormat_rgba16float: GPUTextureFormat = "rgba16float";
    /* Normal 128 bit formats */
    public static readonly GPUTextureFormat_rgba32uint: GPUTextureFormat = "rgba32uint";
    public static readonly GPUTextureFormat_rgba32sint: GPUTextureFormat = "rgba32sint";
    public static readonly GPUTextureFormat_rgba32float: GPUTextureFormat = "rgba32float";
    /* Depth and Stencil formats */
    public static readonly GPUTextureFormat_depth32float: GPUTextureFormat = "depth32float";
    public static readonly GPUTextureFormat_depth32floatStencil8: GPUTextureFormat = "depth32float-stencil8";
      
    public static readonly GPUTextureViewDimension_1d: GPUTextureViewDimension = "1d";
    public static readonly GPUTextureViewDimension_2d: GPUTextureViewDimension = "2d";
    public static readonly GPUTextureViewDimension_2dArray: GPUTextureViewDimension = "2d-array";
    public static readonly GPUTextureViewDimension_cube: GPUTextureViewDimension = "cube";
    public static readonly GPUTextureViewDimension_cubeArray: GPUTextureViewDimension = "cube-array";
    public static readonly GPUTextureViewDimension_3d: GPUTextureViewDimension = "3d";

    public static readonly GPUPowerPreference_lowPower: GPUPowerPreference = "low-power";
    public static readonly GPUPowerPreference_highPerformance: GPUPowerPreference = "high-performance";
    
    public static readonly GPUVertexFormat_uchar: GPUVertexFormat = "uchar";
    public static readonly GPUVertexFormat_uchar2: GPUVertexFormat = "uchar2";
    public static readonly GPUVertexFormat_uchar3: GPUVertexFormat = "uchar3";
    public static readonly GPUVertexFormat_uchar4: GPUVertexFormat = "uchar4";
    public static readonly GPUVertexFormat_char: GPUVertexFormat = "char";
    public static readonly GPUVertexFormat_char2: GPUVertexFormat = "char2";
    public static readonly GPUVertexFormat_char3: GPUVertexFormat = "char3";
    public static readonly GPUVertexFormat_char4: GPUVertexFormat = "char4";
    public static readonly GPUVertexFormat_ucharnorm: GPUVertexFormat = "ucharnorm";
    public static readonly GPUVertexFormat_uchar2norm: GPUVertexFormat = "uchar2norm";
    public static readonly GPUVertexFormat_uchar3norm: GPUVertexFormat = "uchar3norm";
    public static readonly GPUVertexFormat_uchar4norm: GPUVertexFormat = "uchar4norm";
    public static readonly GPUVertexFormat_uchar4normBGRA: GPUVertexFormat = "uchar4norm-bgra";
    public static readonly GPUVertexFormat_charnorm: GPUVertexFormat = "charnorm";
    public static readonly GPUVertexFormat_char2norm: GPUVertexFormat = "char2norm";
    public static readonly GPUVertexFormat_char3norm: GPUVertexFormat = "char3norm";
    public static readonly GPUVertexFormat_char4norm: GPUVertexFormat = "char4norm";
    public static readonly GPUVertexFormat_ushort: GPUVertexFormat = "ushort";
    public static readonly GPUVertexFormat_ushort2: GPUVertexFormat = "ushort2";
    public static readonly GPUVertexFormat_ushort3: GPUVertexFormat = "ushort3";
    public static readonly GPUVertexFormat_ushort4: GPUVertexFormat = "ushort4";
    public static readonly GPUVertexFormat_short: GPUVertexFormat = "short";
    public static readonly GPUVertexFormat_short2: GPUVertexFormat = "short2";
    public static readonly GPUVertexFormat_short3: GPUVertexFormat = "short3";
    public static readonly GPUVertexFormat_short4: GPUVertexFormat = "short4";
    public static readonly GPUVertexFormat_ushortnorm: GPUVertexFormat = "ushortnorm";
    public static readonly GPUVertexFormat_ushort2norm: GPUVertexFormat = "ushort2norm";
    public static readonly GPUVertexFormat_ushort3norm: GPUVertexFormat = "ushort3norm";
    public static readonly GPUVertexFormat_ushort4norm: GPUVertexFormat = "ushort4norm";
    public static readonly GPUVertexFormat_shortnorm: GPUVertexFormat = "shortnorm";
    public static readonly GPUVertexFormat_short2norm: GPUVertexFormat = "short2norm";
    public static readonly GPUVertexFormat_short3norm: GPUVertexFormat = "short3norm";
    public static readonly GPUVertexFormat_short4norm: GPUVertexFormat = "short4norm";
    public static readonly GPUVertexFormat_half: GPUVertexFormat = "half";
    public static readonly GPUVertexFormat_half2: GPUVertexFormat = "half2";
    public static readonly GPUVertexFormat_half3: GPUVertexFormat = "half3";
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

    public static readonly GPUBufferUsage_NONE = 0;
    public static readonly GPUBufferUsage_MAP_READ = 1;
    public static readonly GPUBufferUsage_MAP_WRITE = 2;
    public static readonly GPUBufferUsage_TRANSFER_SRC = 4;
    public static readonly GPUBufferUsage_TRANSFER_DST = 8;
    public static readonly GPUBufferUsage_INDEX = 16;
    public static readonly GPUBufferUsage_VERTEX = 32;
    public static readonly GPUBufferUsage_UNIFORM = 64;
    public static readonly GPUBufferUsage_STORAGE = 128;
    
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

    public static readonly GPUTextureAspect_COLOR = 1;
    public static readonly GPUTextureAspect_DEPTH = 2;
    public static readonly GPUTextureAspect_STENCIL = 4;

    public static readonly GPUTextureUsage_NONE = 0;
    public static readonly GPUTextureUsage_TRANSFER_SRC = 1;
    public static readonly GPUTextureUsage_TRANSFER_DST = 2;
    public static readonly GPUTextureUsage_SAMPLED = 4;
    public static readonly GPUTextureUsage_STORAGE = 8;
    public static readonly GPUTextureUsage_OUTPUT_ATTACHMENT = 16;

    public static readonly GPUCompareFunction_never: GPUCompareFunction = "never";
    public static readonly GPUCompareFunction_less: GPUCompareFunction = "less";
    public static readonly GPUCompareFunction_equal: GPUCompareFunction = "equal";
    public static readonly GPUCompareFunction_lessEqual: GPUCompareFunction = "lessEqual";
    public static readonly GPUCompareFunction_greater: GPUCompareFunction = "greater";
    public static readonly GPUCompareFunction_notEqual: GPUCompareFunction = "notEqual";
    public static readonly GPUCompareFunction_greaterEqual: GPUCompareFunction = "greaterEqual";
    public static readonly GPUCompareFunction_always: GPUCompareFunction = "always";

    public static readonly GPUBindingType_uniformBuffer: GPUBindingType = "uniform-buffer";
    public static readonly GPUBindingType_dynamicUniformBuffer: GPUBindingType = "dynamic-uniform-buffer";
    public static readonly GPUBindingType_sampler: GPUBindingType = "sampler";
    public static readonly GPUBindingType_sampledTexture: GPUBindingType = "sampled-texture";
    public static readonly GPUBindingType_storageBuffer: GPUBindingType = "storage-buffer";
    public static readonly GPUBindingType_dynamicStorageBuffer: GPUBindingType = "dynamic-storage-buffer";

    public static readonly GPUInputStepMode_vertex: GPUInputStepMode = "vertex";
    public static readonly GPUInputStepMode_instance: GPUInputStepMode = "instance";

    public static readonly GPUStencilOperation_keep = "keep";
    public static readonly GPUStencilOperation_zero = "zero";
    public static readonly GPUStencilOperation_replace = "replace";
    public static readonly GPUStencilOperation_invert = "invert";
    public static readonly GPUStencilOperation_incrementClamp = "increment-clamp";
    public static readonly GPUStencilOperation_decrementClamp = "decrement-clamp";
    public static readonly GPUStencilOperation_incrementWrap = "increment-wrap";
    public static readonly GPUStencilOperation_decrementWrap = "decrement-wrap";
}
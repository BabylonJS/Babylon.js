interface GPUObjectBase {
    label: string | undefined;
}

interface GPUObjectDescriptorBase {
    label?: string;
}

interface GPUSupportedLimits {
    readonly maxTextureDimension1D: GPUSize32;
    readonly maxTextureDimension2D: GPUSize32;
    readonly maxTextureDimension3D: GPUSize32;
    readonly maxTextureArrayLayers: GPUSize32;
    readonly maxBindGroups: GPUSize32;
    readonly maxDynamicUniformBuffersPerPipelineLayout: GPUSize32;
    readonly maxDynamicStorageBuffersPerPipelineLayout: GPUSize32;
    readonly maxSampledTexturesPerShaderStage: GPUSize32;
    readonly maxSamplersPerShaderStage: GPUSize32;
    readonly maxStorageBuffersPerShaderStage: GPUSize32;
    readonly maxStorageTexturesPerShaderStage: GPUSize32;
    readonly maxUniformBuffersPerShaderStage: GPUSize32;
    readonly maxUniformBufferBindingSize: GPUSize32;
    readonly maxStorageBufferBindingSize: GPUSize32;
    readonly maxVertexBuffers: GPUSize32;
    readonly maxVertexAttributes: GPUSize32;
    readonly maxVertexBufferArrayStride: GPUSize32;
}

type GPUSupportedFeatures = ReadonlySet<string>;

type GPUPredefinedColorSpace = "srgb";

interface Navigator {
    readonly gpu: GPU | undefined;
}

interface WorkerNavigator {
    readonly gpu: GPU | undefined;
}

declare class GPU {
    private __brand: void;
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
}

interface GPURequestAdapterOptions {
    powerPreference?: GPUPowerPreference;
}

type GPUPowerPreference = "low-power" | "high-performance";

declare class GPUAdapter {
    // https://michalzalecki.com/nominal-typing-in-typescript/#approach-1-class-with-a-private-property
    private __brand: void;
    readonly name: string;
    readonly features: GPUSupportedFeatures;
    readonly limits: GPUSupportedLimits;

    requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice | null>;
}

interface GPUDeviceDescriptor extends GPUObjectDescriptorBase {
    requiredFeatures?: GPUFeatureName[]; /* default=[] */
    requiredLimits?: { [name: string]: GPUSize32 }; /* default={} */
}

type GPUFeatureName =
    | "depth-clamping"
    | "depth24unorm-stencil8"
    | "depth32float-stencil8"
    | "pipeline-statistics-query"
    | "texture-compression-bc"
    | "timestamp-query";

declare class GPUDevice extends EventTarget implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    readonly features: GPUSupportedFeatures;
    readonly limits: GPUSupportedLimits;

    readonly queue: GPUQueue;

    destroy(): void;

    createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
    createTexture(descriptor: GPUTextureDescriptor): GPUTexture;
    createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler;
    importExternalTexture(descriptor: GPUExternalTextureDescriptor): GPUExternalTexture;

    createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout;
    createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout;
    createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;

    createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;

    createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
    createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline;
    createComputePipelineAsync(descriptor: GPUComputePipelineDescriptor): Promise<GPUComputePipeline>;
    createRenderPipelineAsync(descriptor: GPURenderPipelineDescriptor): Promise<GPURenderPipeline>;

    createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor): GPUCommandEncoder;
    createRenderBundleEncoder(descriptor: GPURenderBundleEncoderDescriptor): GPURenderBundleEncoder;

    createQuerySet(descriptor: GPUQuerySetDescriptor): GPUQuerySet;

    readonly lost: Promise<GPUDeviceLostInfo>;
    pushErrorScope(filter: GPUErrorFilter): void;
    popErrorScope(): Promise<GPUError | undefined>;
    onuncapturederror: Event | undefined;
}

declare class GPUBuffer implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    mapAsync(mode: GPUMapModeFlags, offset?: GPUSize64 /*default=0*/, size?: GPUSize64): Promise<void>;
    getMappedRange(offset?: GPUSize64 /*default=0*/, size?: GPUSize64): ArrayBuffer;
    unmap(): void;

    destroy(): void;
}

interface GPUBufferDescriptor extends GPUObjectDescriptorBase {
    size: GPUSize64;
    usage: GPUBufferUsageFlags;
    mappedAtCreation: boolean; /* default=false */
}

type GPUBufferUsageFlags = number;

type GPUMapModeFlags = number;

declare class GPUTexture implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView;
    destroy(): void;
}

interface GPUTextureDescriptor extends GPUObjectDescriptorBase {
    size: GPUExtent3D;
    mipLevelCount?: GPUIntegerCoordinate; /* default=1 */
    sampleCount?: GPUSize32; /* default=1 */
    dimension?: GPUTextureDimension; /* default="2d" */
    format: GPUTextureFormat;
    usage: GPUTextureUsageFlags;
}

type GPUTextureDimension = "1d" | "2d" | "3d";

type GPUTextureUsageFlags = number;

declare class GPUTextureView implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;
}

interface GPUTextureViewDescriptor extends GPUObjectDescriptorBase {
    format: GPUTextureFormat;
    dimension: GPUTextureViewDimension;
    aspect?: GPUTextureAspect; /* default="all" */
    baseMipLevel?: GPUIntegerCoordinate; /* default=0 */
    mipLevelCount: GPUIntegerCoordinate;
    baseArrayLayer?: GPUIntegerCoordinate; /* default=0*/
    arrayLayerCount: GPUIntegerCoordinate;
}

type GPUTextureViewDimension =
    | "1d"
    | "2d"
    | "2d-array"
    | "cube"
    | "cube-array"
    | "3d";

type GPUTextureAspect = "all" | "stencil-only" | "depth-only";

type GPUTextureFormat =
    // 8-bit formats
    | "r8unorm"
    | "r8snorm"
    | "r8uint"
    | "r8sint"

    // 16-bit formats
    | "r16uint"
    | "r16sint"
    | "r16float"
    | "rg8unorm"
    | "rg8snorm"
    | "rg8uint"
    | "rg8sint"

    // 32-bit formats
    | "r32uint"
    | "r32sint"
    | "r32float"
    | "rg16uint"
    | "rg16sint"
    | "rg16float"
    | "rgba8unorm"
    | "rgba8unorm-srgb"
    | "rgba8snorm"
    | "rgba8uint"
    | "rgba8sint"
    | "bgra8unorm"
    | "bgra8unorm-srgb"
    // Packed 32-bit formats
    | "rgb9e5ufloat"
    | "rgb10a2unorm"
    | "rg11b10ufloat"

    // 64-bit formats
    | "rg32uint"
    | "rg32sint"
    | "rg32float"
    | "rgba16uint"
    | "rgba16sint"
    | "rgba16float"

    // 128-bit formats
    | "rgba32uint"
    | "rgba32sint"
    | "rgba32float"

    // Depth and stencil formats
    | "stencil8"
    | "depth16unorm"
    | "depth24plus"
    | "depth24plus-stencil8"
    | "depth32float"

    // BC compressed formats usable if "texture-compression-bc" is both
    // supported by the device/user agent and enabled in requestDevice.
    | "bc1-rgba-unorm"
    | "bc1-rgba-unorm-srgb"
    | "bc2-rgba-unorm"
    | "bc2-rgba-unorm-srgb"
    | "bc3-rgba-unorm"
    | "bc3-rgba-unorm-srgb"
    | "bc4-r-unorm"
    | "bc4-r-snorm"
    | "bc5-rg-unorm"
    | "bc5-rg-snorm"
    | "bc6h-rgb-ufloat"
    | "bc6h-rgb-float"
    | "bc7-rgba-unorm"
    | "bc7-rgba-unorm-srgb"

    // "depth24unorm-stencil8" feature
    | "depth24unorm-stencil8"

    // "depth32float-stencil8" feature
    | "depth32float-stencil8";

declare class GPUExternalTexture implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;
}

interface GPUExternalTextureDescriptor extends GPUObjectDescriptorBase {
    source: HTMLVideoElement;
    colorSpace: GPUPredefinedColorSpace; /* default="srgb" */
}

declare class GPUSampler implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;
}

interface GPUSamplerDescriptor extends GPUObjectDescriptorBase {
    addressModeU?: GPUAddressMode; /* default="clamp-to-edge" */
    addressModeV?: GPUAddressMode; /* default="clamp-to-edge" */
    addressModeW?: GPUAddressMode; /* default="clamp-to-edge" */
    magFilter?: GPUFilterMode; /* default="nearest" */
    minFilter?: GPUFilterMode; /* default="nearest" */
    mipmapFilter?: GPUFilterMode; /* default="nearest" */
    lodMinClamp?: number; /* default=0 */
    lodMaxClamp?: number; /* default=0xffffffff */
    compare?: GPUCompareFunction;
    maxAnisotropy?: number; /* default=1 */
}

type GPUAddressMode = "clamp-to-edge" | "repeat" | "mirror-repeat";

type GPUFilterMode = "nearest" | "linear";

type GPUCompareFunction =
    | "never"
    | "less"
    | "equal"
    | "less-equal"
    | "greater"
    | "not-equal"
    | "greater-equal"
    | "always";

declare class GPUBindGroupLayout implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;
}

interface GPUBindGroupLayoutDescriptor extends GPUObjectDescriptorBase {
    entries: GPUBindGroupLayoutEntry[];
}

type GPUShaderStageFlags = number;

interface GPUBindGroupLayoutEntry {
    binding: GPUIndex32;
    visibility: GPUShaderStageFlags;

    buffer?: GPUBufferBindingLayout;
    sampler?: GPUSamplerBindingLayout;
    texture?: GPUTextureBindingLayout;
    storageTexture?: GPUStorageTextureBindingLayout;
    externalTexture?: GPUExternalTextureBindingLayout;
}

type GPUBufferBindingType = "uniform" | "storage" | "read-only-storage";

interface GPUBufferBindingLayout {
    type?: GPUBufferBindingType; /* default="uniform" */
    hasDynamicOffset?: boolean; /* default=false */
    minBindingSize?: GPUSize64; /* default=0 */
}

type GPUSamplerBindingType = "filtering" | "non-filtering" | "comparison";

interface GPUSamplerBindingLayout {
    type?: GPUSamplerBindingType; /* default="filtering" */
}

type GPUTextureSampleType =
    | "float"
    | "unfilterable-float"
    | "depth"
    | "sint"
    | "uint";

interface GPUTextureBindingLayout {
    sampleType?: GPUTextureSampleType; /* default="float" */
    viewDimension?: GPUTextureViewDimension; /* default="2d" */
    multisampled?: boolean; /* default=false */
}

type GPUStorageTextureAccess = "read-only" | "write-only";

interface GPUStorageTextureBindingLayout {
    access: GPUStorageTextureAccess;
    format: GPUTextureFormat;
    viewDimension?: GPUTextureViewDimension; /* default="2d" */
}

interface GPUExternalTextureBindingLayout {
}

declare class GPUBindGroup implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;
}

interface GPUBindGroupDescriptor extends GPUObjectDescriptorBase {
    layout: GPUBindGroupLayout;
    entries: GPUBindGroupEntry[];
}

type GPUBindingResource =
    | GPUSampler
    | GPUTextureView
    | GPUBufferBinding
    | GPUExternalTexture;

interface GPUBindGroupEntry {
    binding: GPUIndex32;
    resource: GPUBindingResource;
}

interface GPUBufferBinding {
    buffer: GPUBuffer;
    offset?: GPUSize64; /* default=0 */
    size?: GPUSize64; /* default=size_of_buffer - offset */
}

declare class GPUPipelineLayout implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;
}

interface GPUPipelineLayoutDescriptor extends GPUObjectDescriptorBase {
    bindGroupLayouts: GPUBindGroupLayout[];
}

declare class GPUShaderModule implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    compilationInfo(): Promise<GPUCompilationInfo>;
}

interface GPUShaderModuleDescriptor extends GPUObjectDescriptorBase {
    code: string | Uint32Array;
    sourceMap?: object;
}

type GPUCompilationMessageType = "error" | "warning" | "info";

interface GPUCompilationMessage {
    readonly message: string;
    readonly type: GPUCompilationMessageType;
    readonly lineNum: number;
    readonly linePos: number;
    readonly offset: number;
    readonly length: number;
}

interface GPUCompilationInfo {
    readonly messages: readonly GPUCompilationMessage[];
}

interface GPUPipelineDescriptorBase extends GPUObjectDescriptorBase {
    layout?: GPUPipelineLayout;
}

interface GPUPipelineBase {
    getBindGroupLayout(index: number): GPUBindGroupLayout;
}

interface GPUProgrammableStage {
    module: GPUShaderModule;
    entryPoint: string | Uint32Array;
}

declare class GPUComputePipeline implements GPUObjectBase, GPUPipelineBase {
    private __brand: void;
    label: string | undefined;

    getBindGroupLayout(index: number): GPUBindGroupLayout;
}

interface GPUComputePipelineDescriptor extends GPUPipelineDescriptorBase {
    compute: GPUProgrammableStage;
}

declare class GPURenderPipeline implements GPUObjectBase, GPUPipelineBase {
    private __brand: void;
    label: string | undefined;

    getBindGroupLayout(index: number): GPUBindGroupLayout;
}

interface GPURenderPipelineDescriptor extends GPUPipelineDescriptorBase {
    vertex: GPUVertexState;
    primitive?: GPUPrimitiveState; /* default={} */
    depthStencil?: GPUDepthStencilState;
    multisample?: GPUMultisampleState; /* default={} */
    fragment?: GPUFragmentState;
}

type GPUPrimitiveTopology =
    | "point-list"
    | "line-list"
    | "line-strip"
    | "triangle-list"
    | "triangle-strip";

interface GPUPrimitiveState {
    topology?: GPUPrimitiveTopology; /* default="triangle-list" */
    stripIndexFormat?: GPUIndexFormat;
    frontFace?: GPUFrontFace; /* default="ccw" */
    cullMode?: GPUCullMode; /* default="none" */

    // Enable depth clamping (requires "depth-clamping" feature)
    clampDepth?: boolean; /* default=false */
}

type GPUFrontFace = "ccw" | "cw";

type GPUCullMode = "none" | "front" | "back";

interface GPUMultisampleState {
    count?: GPUSize32; /* default=1 */
    mask?: GPUSampleMask; /* default=0xFFFFFFFF */
    alphaToCoverageEnabled?: boolean; /* default=false */
}

interface GPUFragmentState extends GPUProgrammableStage {
    targets: GPUColorTargetState[];
}

interface GPUColorTargetState {
    format: GPUTextureFormat;

    blend?: GPUBlendState;
    writeMask?: GPUColorWriteFlags; /* default=0xF - GPUColorWrite.ALL */
}

interface GPUBlendState {
    color: GPUBlendComponent;
    alpha: GPUBlendComponent;
}

type GPUColorWriteFlags = number;

interface GPUBlendComponent {
    srcFactor?: GPUBlendFactor; /* default="one" */
    dstFactor?: GPUBlendFactor; /* default="zero" */
    operation?: GPUBlendOperation; /* default="add" */
}

type GPUBlendFactor =
    | "zero"
    | "one"
    | "src"
    | "one-minus-src"
    | "src-alpha"
    | "one-minus-src-alpha"
    | "dst"
    | "one-minus-dst"
    | "dst-alpha"
    | "one-minus-dst-alpha"
    | "src-alpha-saturated"
    | "constant"
    | "one-minus-constant";

type GPUBlendOperation =
    | "add"
    | "subtract"
    | "reverse-subtract"
    | "min"
    | "max";

interface GPUDepthStencilState {
    format: GPUTextureFormat;

    depthWriteEnabled?: boolean; /* default=false */
    depthCompare?: GPUCompareFunction; /* default="always" */

    stencilFront?: GPUStencilStateFace; /* default={} */
    stencilBack?: GPUStencilStateFace; /* default={} */

    stencilReadMask?: GPUStencilValue; /* default=0xFFFFFFFF */
    stencilWriteMask?: GPUStencilValue; /* default=0xFFFFFFFF */

    depthBias?: GPUDepthBias; /* default=0 */
    depthBiasSlopeScale?: number; /* default= 0 */
    depthBiasClamp?: number; /* default=0 */
}

interface GPUStencilStateFace {
    compare?: GPUCompareFunction; /* default="always" */
    failOp?: GPUStencilOperation; /* default="keep" */
    depthFailOp?: GPUStencilOperation; /* default="keep" */
    passOp?: GPUStencilOperation; /* default="keep" */
}

type GPUStencilOperation =
    | "keep"
    | "zero"
    | "replace"
    | "invert"
    | "increment-clamp"
    | "decrement-clamp"
    | "increment-wrap"
    | "decrement-wrap";

type GPUIndexFormat = "uint16" | "uint32";

type GPUVertexFormat =
    | "uint8x2"
    | "uint8x4"
    | "sint8x2"
    | "sint8x4"
    | "unorm8x2"
    | "unorm8x4"
    | "snorm8x2"
    | "snorm8x4"
    | "uint16x2"
    | "uint16x4"
    | "sint16x2"
    | "sint16x4"
    | "unorm16x2"
    | "unorm16x4"
    | "snorm16x2"
    | "snorm16x4"
    | "float16x2"
    | "float16x4"
    | "float32"
    | "float32x2"
    | "float32x3"
    | "float32x4"
    | "uint32"
    | "uint32x2"
    | "uint32x3"
    | "uint32x4"
    | "sint32"
    | "sint32x2"
    | "sint32x3"
    | "sint32x4";

type GPUInputStepMode = "vertex" | "instance";

interface GPUVertexState extends GPUProgrammableStage {
    buffers?: GPUVertexBufferLayout[]; /* default=[] */
}

interface GPUVertexBufferLayout {
    arrayStride: GPUSize64;
    stepMode?: GPUInputStepMode; /* default="vertex" */
    attributes: GPUVertexAttribute[];
}

interface GPUVertexAttribute {
    format: GPUVertexFormat;
    offset: GPUSize64;
    shaderLocation: GPUIndex32;
}

declare class GPUCommandBuffer implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    readonly executionTime: Promise<number>;
}

interface GPUCommandBufferDescriptor extends GPUObjectDescriptorBase {
}

declare class GPUCommandEncoder implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
    beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePassEncoder;

    copyBufferToBuffer(
        source: GPUBuffer,
        sourceOffset: GPUSize64,
        destination: GPUBuffer,
        destinationOffset: GPUSize64,
        size: GPUSize64
    ): void;
    copyBufferToTexture(
        source: GPUImageCopyBuffer,
        destination: GPUImageCopyTexture,
        copySize: GPUExtent3D
    ): void;
    copyTextureToBuffer(
        source: GPUImageCopyTexture,
        destination: GPUImageCopyBuffer,
        copySize: GPUExtent3D
    ): void;
    copyTextureToTexture(
        source: GPUImageCopyTexture,
        destination: GPUImageCopyTexture,
        copySize: GPUExtent3D
    ): void;

    pushDebugGroup(groupLabel: string): void;
    popDebugGroup(): void;
    insertDebugMarker(markerLabel: string): void;

    writeTimestamp(querySet: GPUQuerySet, queryIndex: GPUSize32): void;

    resolveQuerySet(
        querySet: GPUQuerySet,
        firstQuery: GPUSize32,
        queryCount: GPUSize32,
        destination: GPUBuffer,
        destinationOffset: GPUSize64
    ): void;

    finish(descriptor?: GPUCommandBufferDescriptor): GPUCommandBuffer;
}

interface GPUCommandEncoderDescriptor extends GPUObjectDescriptorBase {
    measureExecutionTime?: boolean; /* default=false */
}

interface GPUImageDataLayout {
    offset?: GPUSize64; /* default=0 */
    bytesPerRow: GPUSize32;
    rowsPerImage?: GPUSize32;
}

interface GPUImageCopyBuffer extends GPUImageDataLayout {
    buffer: GPUBuffer;
}

interface GPUImageCopyTexture {
    texture: GPUTexture;
    mipLevel?: GPUIntegerCoordinate; /* default=0 */
    origin?: GPUOrigin3D; /* default={} */
    aspect?: GPUTextureAspect; /* default="all" */
}

interface GPUImageCopyExternalImage {
    source: ImageBitmap | HTMLCanvasElement | OffscreenCanvas;
    origin?: GPUOrigin2D; /* default={} */
}

interface GPUProgrammablePassEncoder {
    setBindGroup(
        index: GPUIndex32,
        bindGroup: GPUBindGroup,
        dynamicOffsets?: GPUBufferDynamicOffset[]
    ): void;
    setBindGroup(
        index: GPUIndex32,
        bindGroup: GPUBindGroup,
        dynamicOffsetData: Uint32Array,
        dynamicOffsetsDataStart: GPUSize64,
        dynamicOffsetsDataLength: GPUSize32
    ): void;

    pushDebugGroup(groupLabel: string): void;
    popDebugGroup(): void;
    insertDebugMarker(markerLabel: string): void;
}

declare class GPUComputePassEncoder implements GPUObjectBase, GPUProgrammablePassEncoder {
    private __brand: void;
    label: string | undefined;

    setBindGroup(
        index: number,
        bindGroup: GPUBindGroup,
        dynamicOffsets?: GPUBufferDynamicOffset[]
    ): void;
    setBindGroup(
        index: GPUIndex32,
        bindGroup: GPUBindGroup,
        dynamicOffsetData: Uint32Array,
        dynamicOffsetsDataStart: GPUSize64,
        dynamicOffsetsDataLength: GPUSize32
    ): void;

    pushDebugGroup(groupLabel: string): void;
    popDebugGroup(): void;
    insertDebugMarker(markerLabel: string): void;

    setPipeline(pipeline: GPUComputePipeline): void;
    dispatch(x: GPUSize32, y?: GPUSize32 /* default=1 */, z?: GPUSize32 /* default=1 */): void;
    dispatchIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64): void;

    beginPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: GPUSize32): void;
    endPipelineStatisticsQuery(): void;

    writeTimestamp(querySet: GPUQuerySet, queryIndex: GPUSize32): void;

    endPass(): void;
}

interface GPUComputePassDescriptor extends GPUObjectDescriptorBase {
}

interface GPURenderEncoderBase {
    setPipeline(pipeline: GPURenderPipeline): void;

    setIndexBuffer(buffer: GPUBuffer, indexFormat: GPUIndexFormat, offset?: GPUSize64 /* default=0 */, size?: GPUSize64 /* default=0 */): void;
    setVertexBuffer(slot: GPUIndex32, buffer: GPUBuffer, offset?: GPUSize64 /* default=0 */, size?: GPUSize64 /* default=0 */): void;

    draw(
        vertexCount: GPUSize32,
        instanceCount?: GPUSize32, /* default=1 */
        firstVertex?: GPUSize32, /* default=0 */
        firstInstance?: GPUSize32 /* default=0 */
    ): void;
    drawIndexed(
        indexCount: GPUSize32,
        instanceCount?: GPUSize32, /* default=1 */
        firstIndex?: GPUSize32, /* default=0 */
        baseVertex?: GPUSignedOffset32, /* default=0 */
        firstInstance?: GPUSize32 /* default=0 */
    ): void;

    drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64): void;
    drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64): void;
}

declare class GPURenderPassEncoder implements GPUObjectBase, GPUProgrammablePassEncoder, GPURenderEncoderBase {
    private __brand: void;
    label: string | undefined;

    setBindGroup(
        index: GPUIndex32,
        bindGroup: GPUBindGroup,
        dynamicOffsets?: GPUBufferDynamicOffset[]
    ): void;
    setBindGroup(
        index: GPUIndex32,
        bindGroup: GPUBindGroup,
        dynamicOffsetData: Uint32Array,
        dynamicOffsetsDataStart: GPUSize64,
        dynamicOffsetsDataLength: GPUSize32
    ): void;

    pushDebugGroup(groupLabel: string): void;
    popDebugGroup(): void;
    insertDebugMarker(markerLabel: string): void;

    setPipeline(pipeline: GPURenderPipeline): void;

    setIndexBuffer(buffer: GPUBuffer, indexFormat: GPUIndexFormat, offset?: GPUSize64 /* default=0 */, size?: GPUSize64 /* default=0 */): void;
    setVertexBuffer(slot: GPUIndex32, buffer: GPUBuffer, offset?: GPUSize64 /* default=0 */, size?: GPUSize64 /* default=0 */): void;

    draw(
        vertexCount: GPUSize32,
        instanceCount?: GPUSize32, /* default=1 */
        firstVertex?: GPUSize32, /* default=0 */
        firstInstance?: GPUSize32 /* default=0 */
    ): void;
    drawIndexed(
        indexCount: GPUSize32,
        instanceCount?: GPUSize32, /* default=1 */
        firstIndex?: GPUSize32, /* default=0 */
        baseVertex?: GPUSignedOffset32, /* default=0 */
        firstInstance?: GPUSize32 /* default=0 */
    ): void;

    drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64): void;
    drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64): void;

    setViewport(
        x: number, y: number,
        width: number, height: number,
        minDepth: number, maxDepth: number
    ): void;

    setScissorRect(x: GPUIntegerCoordinate, y: GPUIntegerCoordinate, width: GPUIntegerCoordinate, height: GPUIntegerCoordinate): void;

    setBlendConstant(color: GPUColor): void;
    setStencilReference(reference: GPUStencilValue): void;

    beginOcclusionQuery(queryIndex: GPUSize32): void;
    endOcclusionQuery(): void;

    beginPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: GPUSize32): void;
    endPipelineStatisticsQuery(): void;

    writeTimestamp(querySet: GPUQuerySet, queryIndex: GPUSize32): void;

    executeBundles(bundles: GPURenderBundle[]): void;
    endPass(): void;
}

interface GPURenderPassDescriptor extends GPUObjectDescriptorBase {
    colorAttachments: GPURenderPassColorAttachment[];
    depthStencilAttachment?: GPURenderPassDepthStencilAttachment;
    occlusionQuerySet?: GPUQuerySet;
}

interface GPURenderPassColorAttachment {
    view: GPUTextureView;
    resolveTarget?: GPUTextureView;

    loadValue: GPULoadOp | GPUColor;
    storeOp: GPUStoreOp;
}

interface GPURenderPassDepthStencilAttachment {
    view: GPUTextureView;

    depthLoadValue: GPULoadOp | number;
    depthStoreOp: GPUStoreOp;
    depthReadOnly?: boolean; /* default=false */

    stencilLoadValue: GPULoadOp | GPUStencilValue;
    stencilStoreOp: GPUStoreOp;
    stencilReadOnly?: boolean; /* default=false */
}

type GPULoadOp = "load";

type GPUStoreOp = "store" | "clear";

declare class GPURenderBundle implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;
}

interface GPURenderBundleDescriptor extends GPUObjectDescriptorBase {
}

declare class GPURenderBundleEncoder implements GPUObjectBase, GPUProgrammablePassEncoder, GPURenderEncoderBase {
    private __brand: void;
    label: string | undefined;

    setBindGroup(
        index: GPUIndex32,
        bindGroup: GPUBindGroup,
        dynamicOffsets?: GPUBufferDynamicOffset[]
    ): void;
    setBindGroup(
        index: GPUIndex32,
        bindGroup: GPUBindGroup,
        dynamicOffsetData: Uint32Array,
        dynamicOffsetsDataStart: GPUSize64,
        dynamicOffsetsDataLength: GPUSize32
    ): void;

    pushDebugGroup(groupLabel: string): void;
    popDebugGroup(): void;
    insertDebugMarker(markerLabel: string): void;

    setPipeline(pipeline: GPURenderPipeline): void;

    setIndexBuffer(buffer: GPUBuffer, indexFormat: GPUIndexFormat, offset?: GPUSize64 /* default=0 */, size?: GPUSize64 /* default=0 */): void;
    setVertexBuffer(slot: GPUIndex32, buffer: GPUBuffer, offset?: GPUSize64 /* default=0 */, size?: GPUSize64 /* default=0 */): void;

    draw(
        vertexCount: GPUSize32,
        instanceCount?: GPUSize32, /* default=1 */
        firstVertex?: GPUSize32, /* default=0 */
        firstInstance?: GPUSize32 /* default=0 */
    ): void;
    drawIndexed(
        indexCount: GPUSize32,
        instanceCount?: GPUSize32, /* default=1 */
        firstIndex?: GPUSize32, /* default=0 */
        baseVertex?: GPUSignedOffset32, /* default=0 */
        firstInstance?: GPUSize32 /* default=0 */
    ): void;

    drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64): void;
    drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64): void;

    finish(descriptor?: GPURenderBundleDescriptor): GPURenderBundle;
}

interface GPURenderBundleEncoderDescriptor extends GPUObjectDescriptorBase {
    colorFormats: GPUTextureFormat[];
    depthStencilFormat?: GPUTextureFormat;
    sampleCount?: GPUSize32; /* default=1 */
}

// @todo: to be removed
interface GPUImageBitmapCopyView {
    imageBitmap: ImageBitmap;
    origin?: GPUOrigin2D;
}

declare class GPUQueue implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    submit(commandBuffers: GPUCommandBuffer[]): void;

    onSubmittedWorkDone(): Promise<void>;

    writeBuffer(
        buffer: GPUBuffer,
        bufferOffset: GPUSize64,
        data: BufferSource,
        dataOffset?: GPUSize64, /* default=0 */
        size?: GPUSize64
    ): void;

    writeTexture(
        destination: GPUImageCopyTexture,
        data: BufferSource,
        dataLayout: GPUImageDataLayout,
        size: GPUExtent3D
    ): void;

    // @todo: to be removed
    copyImageBitmapToTexture(
        source: GPUImageBitmapCopyView,
        destination: GPUImageCopyTexture,
        copySize: GPUExtent3D
    ): void;

    copyExternalImageToTexture(
        source: GPUImageCopyExternalImage,
        destination: GPUImageCopyTexture,
        copySize: GPUExtent3D
    ): void;
}

declare class GPUQuerySet implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    destroy(): void;
}

interface GPUQuerySetDescriptor extends GPUObjectDescriptorBase {
    type: GPUQueryType;
    count: GPUSize32;
    pipelineStatistics?: GPUPipelineStatisticName[]; /* default=[] */
}

type GPUQueryType = "occlusion" | "pipeline-statistics" | "timestamp";

type GPUPipelineStatisticName =
    | "vertex-shader-invocations"
    | "clipper-invocations"
    | "clipper-primitives-out"
    | "fragment-shader-invocations"
    | "compute-shader-invocations";

declare class GPUPresentationContext {
    private __brand: void;

    configure(descriptor?: GPUPresentationConfiguration): void;

    getPreferredFormat(adapter: GPUAdapter): GPUTextureFormat;
    getCurrentTexture(): GPUTexture;
}

type GPUCanvasCompositingAlphaMode =
    | "opaque"
    | "premultiplied";

interface GPUPresentationConfiguration extends GPUObjectDescriptorBase {
    device: GPUDevice;
    format: GPUTextureFormat;
    usage?: GPUTextureUsageFlags; /* default=0x10 - GPUTextureUsage.RENDER_ATTACHMENT */
    compositingAlphaMode?: GPUCanvasCompositingAlphaMode; /* default="opaque" */
    size: GPUExtent3D;
}

type GPUDeviceLostReason = "destroyed";

declare class GPUDeviceLostInfo {
    private __brand: void;
    readonly reason?: GPUDeviceLostReason;
    readonly message: string;
}

type GPUErrorFilter = "out-of-memory" | "validation";

declare class GPUOutOfMemoryError {
    private __brand: void;
    constructor();
}

declare class GPUValidationError {
    private __brand: void;
    constructor(message: string);
    readonly message: string;
}

type GPUError = GPUOutOfMemoryError | GPUValidationError;

declare class GPUUncapturedErrorEvent extends Event {
    private __brand: void;
    constructor(
        type: string,
        gpuUncapturedErrorEventInitDict: GPUUncapturedErrorEventInit
    );
    readonly error: GPUError;
}

interface GPUUncapturedErrorEventInit extends EventInit {
    error: GPUError;
}

type GPUBufferDynamicOffset = number; /* unsigned long */
type GPUStencilValue = number; /* unsigned long */
type GPUSampleMask = number; /* unsigned long */
type GPUDepthBias = number; /* long */
type GPUSize64 = number; /* unsigned long long */
type GPUIntegerCoordinate = number; /* unsigned long */
type GPUIndex32 = number; /* unsigned long */
type GPUSize32 = number; /* unsigned long */
type GPUSignedOffset32 = number; /* long */

interface GPUColorDict {
    r: number;
    g: number;
    b: number;
    a: number;
}
type GPUColor = [number, number, number, number] | GPUColorDict;

interface GPUOrigin2DDict {
    x?: GPUIntegerCoordinate; /* default=0 */
    y?: GPUIntegerCoordinate; /* default=0 */
}
type GPUOrigin2D = [GPUIntegerCoordinate, GPUIntegerCoordinate] | GPUOrigin2DDict;

interface GPUOrigin3DDict {
    x?: GPUIntegerCoordinate; /* default=0 */
    y?: GPUIntegerCoordinate; /* default=0 */
    z?: GPUIntegerCoordinate; /* default=0 */
}
type GPUOrigin3D = [GPUIntegerCoordinate, GPUIntegerCoordinate, GPUIntegerCoordinate] | GPUOrigin3DDict;

interface GPUExtent3DDict {
    width: GPUIntegerCoordinate;
    height?: GPUIntegerCoordinate; /* default=1 */
    depthOrArrayLayers?: GPUIntegerCoordinate; /* default=1 */
}
type GPUExtent3D = [GPUIntegerCoordinate, GPUIntegerCoordinate, GPUIntegerCoordinate] | GPUExtent3DDict;

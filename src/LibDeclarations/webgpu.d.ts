interface Navigator {
    readonly gpu: GPU | undefined;
}

interface GPUColorDict {
    a: number;
    b: number;
    g: number;
    r: number;
}
type GPUColor = [number, number, number, number] | GPUColorDict;

interface GPUOrigin2DDict {
    x?: number;
    y?: number;
}
type GPUOrigin2D = [number, number] | GPUOrigin2DDict;

interface GPUOrigin3DDict {
    x?: number;
    y?: number;
    z?: number;
}
type GPUOrigin3D = [number, number, number] | GPUOrigin3DDict;

interface GPUExtent3DDict {
    width: number;
    height: number;
    depth: number;
}
type GPUExtent3D = [number, number, number] | GPUExtent3DDict;

type GPUBindingResource =
    | GPUSampler
    | GPUTextureView
    | GPUBufferBinding;

type GPUExtensionName =
    | "texture-compression-bc"
    | "timestamp-query"
    | "pipeline-statistics-query"
    | "depth-clamping"
    | "depth24unorm-stencil8"
    | "depth32float-stencil8";
type GPUAddressMode = "clamp-to-edge" | "repeat" | "mirror-repeat";
type GPUBindingType =
    | "uniform-buffer"
    | "storage-buffer"
    | "readonly-storage-buffer"
    | "sampler"
    | "comparison-sampler"
    | "sampled-texture"
    | "readonly-storage-texture"
    | "writeonly-storage-texture";
type GPUBlendFactor =
    | "zero"
    | "one"
    | "src-color"
    | "one-minus-src-color"
    | "src-alpha"
    | "one-minus-src-alpha"
    | "dst-color"
    | "one-minus-dst-color"
    | "dst-alpha"
    | "one-minus-dst-alpha"
    | "src-alpha-saturated"
    | "blend-color"
    | "one-minus-blend-color";
type GPUBlendOperation =
    | "add"
    | "subtract"
    | "reverse-subtract"
    | "min"
    | "max";
type GPUCompareFunction =
    | "never"
    | "less"
    | "equal"
    | "less-equal"
    | "greater"
    | "not-equal"
    | "greater-equal"
    | "always";
type GPUCullMode = "none" | "front" | "back";
type GPUFilterMode = "nearest" | "linear";
type GPUFrontFace = "ccw" | "cw";
type GPUIndexFormat = "uint16" | "uint32";
type GPUInputStepMode = "vertex" | "instance";
type GPULoadOp = "load";
type GPUPrimitiveTopology =
    | "point-list"
    | "line-list"
    | "line-strip"
    | "triangle-list"
    | "triangle-strip";
type GPUStencilOperation =
    | "keep"
    | "zero"
    | "replace"
    | "invert"
    | "increment-clamp"
    | "decrement-clamp"
    | "increment-wrap"
    | "decrement-wrap";
type GPUStoreOp = "store" | "clear";
type GPUTextureDimension = "1d" | "2d" | "3d";
type GPUTextureFormat =
    | "r8unorm"
    | "r8snorm"
    | "r8uint"
    | "r8sint"
    | "r16uint"
    | "r16sint"
    | "r16float"
    | "rg8unorm"
    | "rg8snorm"
    | "rg8uint"
    | "rg8sint"
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
    | "rgb9e5ufloat"
    | "rgb10a2unorm"
    | "rg11b10ufloat"
    | "rg32uint"
    | "rg32sint"
    | "rg32float"
    | "rgba16uint"
    | "rgba16sint"
    | "rgba16float"
    | "rgba32uint"
    | "rgba32sint"
    | "rgba32float"
    | "stencil8"
    | "depth16unorm"
    | "depth24plus"
    | "depth24plus-stencil8"
    | "depth32float"
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
    | "depth24unorm-stencil8"
    | "depth32float-stencil8";
type GPUTextureComponentType = "float" | "sint" | "uint" | "depth-comparison";
type GPUTextureViewDimension =
    | "1d"
    | "2d"
    | "2d-array"
    | "cube"
    | "cube-array"
    | "3d";
type GPUVertexFormat =
    | "uchar2"
    | "uchar4"
    | "char2"
    | "char4"
    | "uchar2norm"
    | "uchar4norm"
    | "char2norm"
    | "char4norm"
    | "ushort2"
    | "ushort4"
    | "short2"
    | "short4"
    | "ushort2norm"
    | "ushort4norm"
    | "short2norm"
    | "short4norm"
    | "half2"
    | "half4"
    | "float"
    | "float2"
    | "float3"
    | "float4"
    | "uint"
    | "uint2"
    | "uint3"
    | "uint4"
    | "int"
    | "int2"
    | "int3"
    | "int4";

type GPUTextureAspect = "all" | "stencil-only" | "depth-only";

type GPUBufferUsageFlags = number;

type GPUColorWriteFlags = number;

type GPUShaderStageFlags = number;

type GPUTextureUsageFlags = number;

type GPUMapModeFlags = number;

interface GPUBindGroupEntry {
    binding: number;
    resource: GPUBindingResource;
}

interface GPUBindGroupDescriptor extends GPUObjectDescriptorBase {
    layout: GPUBindGroupLayout;
    entries: Iterable<GPUBindGroupEntry>;
}

interface GPUBindGroupLayoutEntry {
    binding: number;
    visibility: GPUShaderStageFlags;
    type: GPUBindingType;
    hasDynamicOffset?: boolean;
    minBufferBindingSize?: number;
    viewDimension?: GPUTextureViewDimension;
    textureComponentType?: GPUTextureComponentType;
    storageTextureFormat?: GPUTextureFormat;
}

interface GPUBindGroupLayoutDescriptor
    extends GPUObjectDescriptorBase {
    entries: Iterable<GPUBindGroupLayoutEntry>;
}

interface GPUBlendDescriptor {
    dstFactor?: GPUBlendFactor;
    operation?: GPUBlendOperation;
    srcFactor?: GPUBlendFactor;
}

interface GPUColorStateDescriptor {
    format: GPUTextureFormat;

    alphaBlend?: GPUBlendDescriptor;
    colorBlend?: GPUBlendDescriptor;
    writeMask?: GPUColorWriteFlags;
}

interface GPUBufferBinding {
    buffer: GPUBuffer;
    offset?: number;
    size?: number;
}

interface GPUTextureDataLayout {
    offset?: number;
    bytesPerRow: number;
    rowsPerImage?: number;
}

interface GPUBufferCopyView extends GPUTextureDataLayout {
    buffer: GPUBuffer;
}

interface GPUTextureCopyView {
    texture: GPUTexture;
    mipLevel?: number;
    origin?: GPUOrigin3D;
}

interface GPUImageBitmapCopyView {
    imageBitmap: ImageBitmap;
    origin?: GPUOrigin2D;
}

interface GPUBufferDescriptor extends GPUObjectDescriptorBase {
    size: number;
    usage: GPUBufferUsageFlags;
    mappedAtCreation?: boolean;
}

interface GPUCommandEncoderDescriptor extends GPUObjectDescriptorBase {
    label?: string;

    measureExecutionTime?: boolean;
}

interface GPUComputePipelineDescriptor
    extends GPUPipelineDescriptorBase {
    computeStage: GPUProgrammableStageDescriptor;
}

interface GPUDepthStencilStateDescriptor {
    format: GPUTextureFormat;

    depthWriteEnabled?: boolean;
    depthCompare?: GPUCompareFunction;

    stencilFront?: GPUStencilStateFaceDescriptor;
    stencilBack?: GPUStencilStateFaceDescriptor;

    stencilReadMask?: number;
    stencilWriteMask?: number;
}

interface GPUDeviceDescriptor extends GPUObjectDescriptorBase {
    extensions?: Iterable<GPUExtensionName>;
    limits?: GPULimits;
}

interface GPUFenceDescriptor extends GPUObjectDescriptorBase {
    initialValue?: number;
    label?: string;
    signalQueue?: GPUQueue;
}

interface GPUVertexAttributeDescriptor {
    format: GPUVertexFormat;
    offset: number;
    shaderLocation: number;
}

interface GPUVertexBufferLayoutDescriptor {
    arrayStride: number;
    stepMode?: GPUInputStepMode;
    attributes: Iterable<GPUVertexAttributeDescriptor>;
}

interface GPUVertexStateDescriptor {
    indexFormat?: GPUIndexFormat;
    vertexBuffers?: Iterable<GPUVertexBufferLayoutDescriptor>;
}

interface GPULimits {
    maxBindGroups?: number;
    maxDynamicUniformBuffersPerPipelineLayout?: number;
    maxDynamicStorageBuffersPerPipelineLayout?: number;
    maxSampledTexturesPerShaderStage?: number;
    maxSamplersPerShaderStage?: number;
    maxStorageBuffersPerShaderStage?: number;
    maxStorageTexturesPerShaderStage?: number;
    maxUniformBuffersPerShaderStage?: number;
    maxUniformBufferBindingSize?: number;
}

interface GPUPipelineDescriptorBase {
    label?: string;
    layout?: GPUPipelineLayout;
}

interface GPUPipelineLayoutDescriptor extends GPUObjectDescriptorBase {
    bindGroupLayouts: Iterable<GPUBindGroupLayout>;
}

interface GPUProgrammableStageDescriptor {
    module: GPUShaderModule;
    entryPoint: string;
}

interface GPURasterizationStateDescriptor {
    frontFace?: GPUFrontFace;
    cullMode?: GPUCullMode;
    clampDepth?: boolean;
    depthBias?: number;
    depthBiasSlopeScale?: number;
    depthBiasClamp?: number;
}

interface GPURenderPassColorAttachmentDescriptor {
    attachment: GPUTextureView;
    resolveTarget?: GPUTextureView;

    loadValue: GPULoadOp | GPUColor;
    storeOp?: GPUStoreOp;
}

interface GPURenderPassDepthStencilAttachmentDescriptor {
    attachment: GPUTextureView;

    depthLoadValue: GPULoadOp | number;
    depthStoreOp: GPUStoreOp;
    depthReadOnly?: boolean;

    stencilLoadValue: GPULoadOp | number;
    stencilStoreOp: GPUStoreOp;
    stencilReadOnly?: boolean;
}

interface GPURenderPassDescriptor extends GPUObjectDescriptorBase {
    colorAttachments: Iterable<GPURenderPassColorAttachmentDescriptor>;
    depthStencilAttachment?: GPURenderPassDepthStencilAttachmentDescriptor;
}

interface GPURenderPipelineDescriptor
    extends GPUPipelineDescriptorBase {
    vertexStage: GPUProgrammableStageDescriptor;
    fragmentStage?: GPUProgrammableStageDescriptor;

    primitiveTopology: GPUPrimitiveTopology;
    rasterizationState?: GPURasterizationStateDescriptor;
    colorStates: Iterable<GPUColorStateDescriptor>;
    depthStencilState?: GPUDepthStencilStateDescriptor;
    vertexState?: GPUVertexStateDescriptor;

    sampleCount?: number;
    sampleMask?: number;
    alphaToCoverageEnabled?: boolean;
}

interface GPUSamplerDescriptor extends GPUObjectDescriptorBase {
    addressModeU?: GPUAddressMode;
    addressModeV?: GPUAddressMode;
    addressModeW?: GPUAddressMode;
    magFilter?: GPUFilterMode;
    minFilter?: GPUFilterMode;
    mipmapFilter?: GPUFilterMode;
    lodMinClamp?: number;
    lodMaxClamp?: number;
    compare?: GPUCompareFunction;
    maxAnisotropy?: number;
}

interface GPUShaderModuleDescriptor extends GPUObjectDescriptorBase {
    code: Uint32Array | string;
    label?: string;

    sourceMap?: object;
}

interface GPUStencilStateFaceDescriptor {
    compare?: GPUCompareFunction;
    depthFailOp?: GPUStencilOperation;
    passOp?: GPUStencilOperation;
    failOp?: GPUStencilOperation;
}

interface GPUSwapChainDescriptor extends GPUObjectDescriptorBase {
    device: GPUDevice;
    format: GPUTextureFormat;
    usage?: GPUTextureUsageFlags;
}

interface GPUTextureDescriptor extends GPUObjectDescriptorBase {
    size: GPUExtent3D;
    mipLevelCount?: number;
    sampleCount?: number;
    dimension?: GPUTextureDimension;
    format: GPUTextureFormat;
    usage: GPUTextureUsageFlags;
}

interface GPUTextureViewDescriptor extends GPUObjectDescriptorBase {
    format?: GPUTextureFormat;
    dimension?: GPUTextureViewDimension;
    aspect?: GPUTextureAspect;
    baseArrayLayer?: number;
    baseMipLevel?: number;
    arrayLayerCount?: number;
    mipLevelCount?: number;
}

declare class GPUAdapter {
    // https://michalzalecki.com/nominal-typing-in-typescript/#approach-1-class-with-a-private-property
    private __brand: void;
    readonly name: string;
    readonly extensions: GPUExtensionName[];
    readonly limits: Required<GPULimits>;

    requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice | null>;
}

declare class GPUBindGroup implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;
}

declare class GPUBindGroupLayout implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;
}

declare class GPUBuffer implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    destroy(): void;
    unmap(): void;

    mapAsync(mode: GPUMapModeFlags, offset?: number, size?: number): Promise<void>;
    getMappedRange(offset?: number, size?: number): ArrayBuffer;
}

declare class GPUCommandBuffer implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    readonly executionTime: Promise<number>;
}

interface GPUCommandBufferDescriptor extends GPUObjectDescriptorBase { }

declare class GPUCommandEncoder implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    beginComputePass(
        descriptor?: GPUComputePassDescriptor
    ): GPUComputePassEncoder;
    beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
    copyBufferToBuffer(
        source: GPUBuffer,
        sourceOffset: number,
        destination: GPUBuffer,
        destinationOffset: number,
        size: number
    ): void;
    copyBufferToTexture(
        source: GPUBufferCopyView,
        destination: GPUTextureCopyView,
        copySize: GPUExtent3D
    ): void;
    copyTextureToBuffer(
        source: GPUTextureCopyView,
        destination: GPUBufferCopyView,
        copySize: GPUExtent3D
    ): void;
    copyTextureToTexture(
        source: GPUTextureCopyView,
        destination: GPUTextureCopyView,
        copySize: GPUExtent3D
    ): void;
    finish(descriptor?: GPUCommandBufferDescriptor): GPUCommandBuffer;

    writeTimestamp(querySet: GPUQuerySet, queryIndex: number): void;

    popDebugGroup(): void;
    pushDebugGroup(groupLabel: string): void;
    insertDebugMarker(markerLabel: string): void;
}

interface GPUComputePassDescriptor extends GPUObjectDescriptorBase { }

declare class GPUComputePassEncoder implements GPUObjectBase, GPUProgrammablePassEncoder {
    private __brand: void;
    label: string | undefined;

    setBindGroup(
        index: number,
        bindGroup: GPUBindGroup,
        dynamicOffsets?: Iterable<number>
    ): void;

    popDebugGroup(): void;
    pushDebugGroup(groupLabel: string): void;
    insertDebugMarker(markerLabel: string): void;

    setPipeline(pipeline: GPUComputePipeline): void;
    dispatch(x: number, y?: number, z?: number): void;
    dispatchIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;

    writeTimestamp(querySet: GPUQuerySet, queryIndex: number): void;
    beginPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: number): void;
    endPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: number): void;

    endPass(): void;
}

declare class GPUComputePipeline implements GPUPipelineBase {
    private __brand: void;
    label: string | undefined;

    getBindGroupLayout(index: number): GPUBindGroupLayout;
}

interface GPUObjectBase {
    label: string | undefined;
}

interface GPUObjectDescriptorBase {
    label?: string;
}

// SwapChain / CanvasContext
declare class GPUCanvasContext {
    private __brand: void;
    configureSwapChain(descriptor: GPUSwapChainDescriptor): GPUSwapChain;

    getSwapChainPreferredFormat(device: GPUDevice): Promise<GPUTextureFormat>;
}

declare class GPUDevice extends EventTarget implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    readonly adapter: GPUAdapter;
    readonly extensions: GPUExtensionName[];
    readonly limits: Required<GPULimits>;

    createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
    createBindGroupLayout(
        descriptor: GPUBindGroupLayoutDescriptor
    ): GPUBindGroupLayout;
    createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
    createPipelineLayout(
        descriptor: GPUPipelineLayoutDescriptor
    ): GPUPipelineLayout;
    createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler;
    createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
    createTexture(descriptor: GPUTextureDescriptor): GPUTexture;

    createComputePipeline(
        descriptor: GPUComputePipelineDescriptor
    ): GPUComputePipeline;
    createRenderPipeline(
        descriptor: GPURenderPipelineDescriptor
    ): GPURenderPipeline;
    createReadyComputePipeline(
        descriptor: GPUComputePipelineDescriptor
    ): Promise<GPUComputePipeline>;
    createReadyRenderPipeline(
        descriptor: GPURenderPipelineDescriptor
    ): Promise<GPURenderPipeline>;

    createCommandEncoder(
        descriptor?: GPUCommandEncoderDescriptor
    ): GPUCommandEncoder;
    createRenderBundleEncoder(
        descriptor: GPURenderBundleEncoderDescriptor
    ): GPURenderBundleEncoder;

    createQuerySet(descriptor: GPUQuerySetDescriptor): GPUQuerySet;

    defaultQueue: GPUQueue;

    pushErrorScope(filter: GPUErrorFilter): void;
    popErrorScope(): Promise<GPUError | null>;
    onuncapturederror: Event | undefined;
    readonly lost: Promise<GPUDeviceLostInfo>;
}

declare class GPUFence implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    getCompletedValue(): number;
    onCompletion(completionValue: number): Promise<void>;
}

interface GPUPipelineBase extends GPUObjectBase {
    getBindGroupLayout(index: number): GPUBindGroupLayout;
}

declare class GPUPipelineLayout implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;
}

interface GPUProgrammablePassEncoder {
    setBindGroup(
        index: number,
        bindGroup: GPUBindGroup,
        dynamicOffsets?: Iterable<number>
    ): void;

    popDebugGroup(): void;
    pushDebugGroup(groupLabel: string): void;
    insertDebugMarker(markerLabel: string): void;
}

declare class GPUQueue implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    signal(fence: GPUFence, signalValue: number): void;
    submit(commandBuffers: Iterable<GPUCommandBuffer>): void;
    createFence(descriptor?: GPUFenceDescriptor): GPUFence;

    writeBuffer(buffer: GPUBuffer,
        bufferOffset: number,
        data: BufferSource | ArrayBuffer,
        dataOffset?: number,
        size?: number): void;
    writeTexture(destination: GPUTextureCopyView,
        data: BufferSource | ArrayBuffer,
        dataLayout: GPUTextureDataLayout,
        size: GPUExtent3D): void;

    copyImageBitmapToTexture(
        source: GPUImageBitmapCopyView,
        destination: GPUTextureCopyView,
        copySize: GPUExtent3D
    ): void;
}

type GPUQueryType =
    | "occlusion"
    | "timestamp"
    | "pipeline-statistics";
type GPUPipelineStatisticName =
    | "vertex-shader-invocations"
    | "clipper-invocations"
    | "clipper-primitives-out"
    | "fragment-shader-invocations"
    | "compute-shader-invocations";

interface GPUQuerySetDescriptor extends GPUObjectDescriptorBase {
    type: GPUQueryType;
    count: number;
    pipelineStatistics?: Iterable<GPUPipelineStatisticName>;
}

declare class GPUQuerySet implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    destroy(): void;
}

interface GPURenderEncoderBase {
    setPipeline(pipeline: GPURenderPipeline): void;

    setIndexBuffer(buffer: GPUBuffer, offset?: number, size?: number): void;
    setIndexBuffer(buffer: GPUBuffer, indexFormat: GPUIndexFormat, offset?: number, size?: number): void;
    setVertexBuffer(slot: number, buffer: GPUBuffer, offset?: number, size?: number): void;

    draw(
        vertexCount: number,
        instanceCount?: number,
        firstVertex?: number,
        firstInstance?: number
    ): void;
    drawIndexed(
        indexCount: number,
        instanceCount?: number,
        firstIndex?: number,
        baseVertex?: number,
        firstInstance?: number
    ): void;

    drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
    drawIndexedIndirect(
        indirectBuffer: GPUBuffer,
        indirectOffset: number
    ): void;
}

declare class GPURenderPassEncoder implements GPUObjectBase, GPUProgrammablePassEncoder, GPURenderEncoderBase {
    private __brand: void;
    label: string | undefined;

    setBindGroup(
        index: number,
        bindGroup: GPUBindGroup,
        dynamicOffsets?: Iterable<number>
    ): void;

    popDebugGroup(): void;
    pushDebugGroup(groupLabel: string): void;
    insertDebugMarker(markerLabel: string): void;

    setPipeline(pipeline: GPURenderPipeline): void;

    setIndexBuffer(buffer: GPUBuffer, offset?: number): void;
    setIndexBuffer(buffer: GPUBuffer, indexFormat: GPUIndexFormat, offset?: number, size?: number): void;
    setVertexBuffer(slot: number, buffer: GPUBuffer, offset?: number): void;

    draw(
        vertexCount: number,
        instanceCount?: number,
        firstVertex?: number,
        firstInstance?: number
    ): void;
    drawIndexed(
        indexCount: number,
        instanceCount?: number,
        firstIndex?: number,
        baseVertex?: number,
        firstInstance?: number
    ): void;

    drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
    drawIndexedIndirect(
        indirectBuffer: GPUBuffer,
        indirectOffset: number
    ): void;

    setViewport(
        x: number,
        y: number,
        width: number,
        height: number,
        minDepth: number,
        maxDepth: number
    ): void;
    setScissorRect(x: number, y: number, width: number, height: number): void;

    setBlendColor(color: GPUColor): void;
    setStencilReference(reference: number): void;

    writeTimestamp(querySet: GPUQuerySet, queryIndex: number): void;
    beginOcclusionQuery(queryIndex: number): void;
    endOcclusionQuery(): void;
    beginPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: number): void;
    endPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: number): void;

    executeBundles(bundles: Iterable<GPURenderBundle>): void;
    endPass(): void;
}

interface GPURenderBundleDescriptor extends GPUObjectDescriptorBase { }

declare class GPURenderBundle implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;
}

declare class GPURenderBundleEncoder implements GPURenderEncoderBase {
    private __brand: void;
    label: string | undefined;

    setBindGroup(
        index: number,
        bindGroup: GPUBindGroup,
        dynamicOffsets?: Iterable<number>
    ): void;

    popDebugGroup(): void;
    pushDebugGroup(groupLabel: string): void;
    insertDebugMarker(markerLabel: string): void;

    setPipeline(pipeline: GPURenderPipeline): void;

    setIndexBuffer(buffer: GPUBuffer, offset?: number): void;
    setIndexBuffer(buffer: GPUBuffer, indexFormat: GPUIndexFormat, offset?: number, size?: number): void;
    setVertexBuffer(slot: number, buffer: GPUBuffer, offset?: number): void;

    draw(
        vertexCount: number,
        instanceCount?: number,
        firstVertex?: number,
        firstInstance?: number
    ): void;
    drawIndexed(
        indexCount: number,
        instanceCount?: number,
        firstIndex?: number,
        baseVertex?: number,
        firstInstance?: number
    ): void;

    drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
    drawIndexedIndirect(
        indirectBuffer: GPUBuffer,
        indirectOffset: number
    ): void;

    finish(descriptor?: GPURenderBundleDescriptor): GPURenderBundle;
}

interface GPURenderBundleEncoderDescriptor
    extends GPUObjectDescriptorBase {
    colorFormats: Iterable<GPUTextureFormat>;
    depthStencilFormat?: GPUTextureFormat;
    sampleCount?: number;
}

declare class GPURenderPipeline implements GPUPipelineBase {
    private __brand: void;
    label: string | undefined;

    getBindGroupLayout(index: number): GPUBindGroupLayout;
}

declare class GPUSampler implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;
}

type GPUCompilationMessageType =
    | "error"
    | "warning"
    | "info";

interface GPUCompilationMessage {
    readonly message: string;
    readonly type: GPUCompilationMessageType;
    readonly lineNum: number;
    readonly linePos: number;
}

interface GPUCompilationInfo {
    readonly messages: readonly GPUCompilationMessage[];
}

declare class GPUShaderModule implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    compilationInfo(): Promise<GPUCompilationInfo>;
}

declare class GPUSwapChain implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    getCurrentTexture(): GPUTexture;
}

declare class GPUTexture implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;

    createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView;
    destroy(): void;
}

declare class GPUTextureView implements GPUObjectBase {
    private __brand: void;
    label: string | undefined;
}

type GPUPowerPreference = "low-power" | "high-performance";
interface GPURequestAdapterOptions {
    powerPreference?: GPUPowerPreference;
}

declare class GPU {
    private __brand: void;
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
}

// ****************************************************************************
// ERROR SCOPES
// ****************************************************************************

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

// ****************************************************************************
// TELEMETRY
// ****************************************************************************

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

declare class GPUDeviceLostInfo {
    private __brand: void;
    readonly message: string;
}

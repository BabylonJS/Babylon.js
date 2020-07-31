// https://github.com/gpuweb/gpuweb/blob/0a48816412b5d08a5fb8b89005e019165a1a2c63/spec/index.bs
// except #280 which removed setSubData
// except #494 which reverted the addition of GPUAdapter.limits
// except #591 which removed Uint32Array from GPUShaderModuleDescriptor
// including #543 which adds GPUPipelineBase.getBindGroupLayout
// v 0.0.24

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
  | "texture-compression-bc";
type GPUAddressMode = "clamp-to-edge" | "repeat" | "mirror-repeat";
type GPUBindingType =
  | "uniform-buffer"
  | "storage-buffer"
  | "readonly-storage-buffer"
  | "sampler"
  | "comparison-sampler"
  | "sampled-texture"
  | "storage-texture"
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
  | "rgb10a2unorm"
  | "rg11b10float"
  | "rg32uint"
  | "rg32sint"
  | "rg32float"
  | "rgba16uint"
  | "rgba16sint"
  | "rgba16float"
  | "rgba32uint"
  | "rgba32sint"
  | "rgba32float"
  | "depth32float"
  | "depth24plus"
  | "depth24plus-stencil8";
type GPUTextureComponentType = "float" | "sint" | "uint";
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
// const GPUBufferUsage: {
//   MAP_READ:  0x0001;
//   MAP_WRITE: 0x0002;
//   COPY_SRC:  0x0004;
//   COPY_DST:  0x0008;
//   INDEX:     0x0010;
//   VERTEX:    0x0020;
//   UNIFORM:   0x0040;
//   STORAGE:   0x0080;
//   INDIRECT:  0x0100;
// };

type GPUColorWriteFlags = number;
// const GPUColorWrite: {
//   RED:   0x1;
//   GREEN: 0x2;
//   BLUE:  0x4;
//   ALPHA: 0x8;
//   ALL:   0xf;
// };

type GPUShaderStageFlags = number;
// const GPUShaderStage: {
//   VERTEX:   0x1;
//   FRAGMENT: 0x2;
//   COMPUTE:  0x4;
// };

type GPUTextureUsageFlags = number;
// const GPUTextureUsage: {
//   COPY_SRC:          0x01;
//   COPY_DST:          0x02;
//   SAMPLED:           0x04;
//   STORAGE:           0x08;
//   OUTPUT_ATTACHMENT: 0x10;
// };

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
  viewDimension?: GPUTextureViewDimension;
  textureComponentType?: GPUTextureComponentType;
  multisampled?: boolean;
  hasDynamicOffset?: boolean;
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

interface GPUBufferCopyView {
  buffer: GPUBuffer;
  offset?: number;
  bytesPerRow: number;
  rowsPerImage: number;
}

interface GPUTextureCopyView {
  texture: GPUTexture;
  mipLevel?: number;
  arrayLayer?: number;
  origin?: GPUOrigin3D;
}

interface GPUImageBitmapCopyView {
  imageBitmap: ImageBitmap;
  origin?: GPUOrigin2D;
}

interface GPUBufferDescriptor extends GPUObjectDescriptorBase {
  size: number;
  usage: GPUBufferUsageFlags;
}

interface GPUCommandEncoderDescriptor extends GPUObjectDescriptorBase {
  label?: string;
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
  offset: number;
  format: GPUVertexFormat;
  shaderLocation: number;
}

interface GPUVertexBufferLayoutDescriptor {
  arrayStride: number;
  stepMode?: GPUInputStepMode;
  attributes: Iterable<GPUVertexAttributeDescriptor>;
}

interface GPUVertexStateDescriptor {
  indexFormat?: GPUIndexFormat;
  vertexBuffers: Iterable<GPUVertexBufferLayoutDescriptor>;
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
}

interface GPULimitsOut extends GPULimits {
  maxBindGroups: number;
  maxDynamicUniformBuffersPerPipelineLayout: number;
  maxDynamicStorageBuffersPerPipelineLayout: number;
  maxSampledTexturesPerShaderStage: number;
  maxSamplersPerShaderStage: number;
  maxStorageBuffersPerShaderStage: number;
  maxStorageTexturesPerShaderStage: number;
  maxUniformBuffersPerShaderStage: number;
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
  depthBias?: number;
  depthBiasSlopeScale?: number;
  depthBiasClamp?: number;
}

interface GPURenderPassColorAttachmentDescriptor {
  attachment: GPUTextureView;
  resolveTarget?: GPUTextureView;

  loadValue: GPULoadOp | GPUColor;
  storeOp: GPUStoreOp;
}

interface GPURenderPassDepthStencilAttachmentDescriptor {
  attachment: GPUTextureView;

  depthLoadValue: GPULoadOp | number;
  depthStoreOp: GPUStoreOp;

  stencilLoadValue: GPULoadOp | number;
  stencilStoreOp: GPUStoreOp;
}

interface GPURenderPassDescriptor extends GPUObjectDescriptorBase {
  colorAttachments: Iterable<GPURenderPassColorAttachmentDescriptor>;
  depthStencilAttachment?: GPURenderPassDepthStencilAttachmentDescriptor;
}

interface GPURenderPipelineStageDescriptor {
  vertexStage: GPUProgrammableStageDescriptor;
  fragmentStage?: GPUProgrammableStageDescriptor;
}

interface GPURenderPipelineDescriptor
  extends GPUPipelineDescriptorBase, GPUPipelineDescriptorBase {
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
  compare?: GPUCompareFunction;
  lodMaxClamp?: number;
  lodMinClamp?: number;
  magFilter?: GPUFilterMode;
  maxAnisotropy?: number;
  minFilter?: GPUFilterMode;
  mipmapFilter?: GPUFilterMode;
  addressModeU?: GPUAddressMode;
  addressModeV?: GPUAddressMode;
  addressModeW?: GPUAddressMode;
}

interface GPUShaderModuleDescriptor extends GPUObjectDescriptorBase {
  code: Uint32Array | string;
  label?: string;
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
  readonly name: string;
  readonly extensions: GPUExtensionName[];
  readonly limits: GPULimitsOut;

  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
}

declare class GPUBindGroup implements GPUObjectBase {
  label: string | undefined;
}

declare class GPUBindGroupLayout implements GPUObjectBase {
  label: string | undefined;
}

declare class GPUBuffer implements GPUObjectBase {
  label: string | undefined;
  //readonly mapping: ArrayBuffer | null;
  destroy(): void;
  unmap(): void;
  mapAsync(mode:number, offset?:number, size?: number): Promise<void>;
  getMappedRange(offset?:number, size?:number): ArrayBuffer;
  mapWriteAsync(): Promise<ArrayBuffer>;
  mapReadAsync(): Promise<ArrayBuffer>;
  // TODO: Remove setSubData (#280)
  writeBuffer(
    offset: number,
    src: ArrayBufferView,
    srcOffset?: number,
    byteLength?: number
  ): void;
}

declare class GPUCommandBuffer implements GPUObjectBase {
  label: string | undefined;
}

interface GPUCommandBufferDescriptor extends GPUObjectDescriptorBase {}

declare class GPUCommandEncoder implements GPUObjectBase {
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

  popDebugGroup(): void;
  pushDebugGroup(groupLabel: string): void;
  insertDebugMarker(markerLabel: string): void;
}

interface GPUComputePassDescriptor extends GPUObjectDescriptorBase {}

declare class GPUComputePassEncoder implements GPUProgrammablePassEncoder {
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

  endPass(): void;
}

declare class GPUComputePipeline implements GPUPipelineBase {
  label: string | undefined;

  getBindGroupLayout(index: number): GPUBindGroupLayout;
}

interface GPUObjectBase {
  label: string | undefined;
}

interface GPUPipelineBase extends GPUObjectBase {
  getBindGroupLayout(index: number): GPUBindGroupLayout;
}

interface GPUObjectDescriptorBase {
  label?: string;
}

// SwapChain / CanvasContext
declare class GPUCanvasContext {
  configureSwapChain(descriptor: GPUSwapChainDescriptor): GPUSwapChain;

  getSwapChainPreferredFormat(device: GPUDevice): Promise<GPUTextureFormat>;
}

declare class GPUDevice extends EventTarget implements GPUObjectBase {
  label: string | undefined;
  readonly adapter: GPUAdapter;
  readonly extensions: GPUExtensionName[];
  readonly limits: GPULimitsOut;

  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
  createBindGroupLayout(
    descriptor: GPUBindGroupLayoutDescriptor
  ): GPUBindGroupLayout;
  createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
  createBufferMapped(
    descriptor: GPUBufferDescriptor
  ): [GPUBuffer, ArrayBuffer];
  createBufferMappedAsync(
    descriptor: GPUBufferDescriptor
  ): Promise<[GPUBuffer, ArrayBuffer]>;
  createComputePipeline(
    descriptor: GPUComputePipelineDescriptor
  ): GPUComputePipeline;
  createPipelineLayout(
    descriptor: GPUPipelineLayoutDescriptor
  ): GPUPipelineLayout;
  createRenderPipeline(
    descriptor: GPURenderPipelineDescriptor
  ): GPURenderPipeline;
  createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler;
  createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
  createTexture(descriptor: GPUTextureDescriptor): GPUTexture;

  createCommandEncoder(
    descriptor?: GPUCommandEncoderDescriptor
  ): GPUCommandEncoder;
  createRenderBundleEncoder(
    descriptor: GPURenderBundleEncoderDescriptor
  ): GPURenderBundleEncoder;

  defaultQueue: GPUQueue;

  pushErrorScope(filter: GPUErrorFilter): void;
  popErrorScope(): Promise<GPUError | null>;
  onuncapturederror: Event | undefined;
  readonly lost: Promise<GPUDeviceLostInfo>;
}

declare class GPUFence implements GPUObjectBase {
  label: string | undefined;

  getCompletedValue(): number;
  onCompletion(completionValue: number): Promise<void>;
}

declare class GPUPipelineLayout implements GPUObjectBase {
  label: string | undefined;
}

interface GPUProgrammablePassEncoder extends GPUObjectBase {
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
  label: string | undefined;
  signal(fence: GPUFence, signalValue: number): void;
  submit(commandBuffers: Iterable<GPUCommandBuffer>): void;
  createFence(descriptor?: GPUFenceDescriptor): GPUFence;
  copyImageBitmapToTexture(
    source: GPUImageBitmapCopyView,
    destination: GPUTextureCopyView,
    copySize: GPUExtent3D
  ): void;
}

interface GPURenderEncoderBase extends GPUProgrammablePassEncoder {
  setPipeline(pipeline: GPURenderPipeline): void;

  setIndexBuffer(buffer: GPUBuffer, offset?: number, size?: number): void;

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

declare class GPURenderPassEncoder implements GPURenderEncoderBase {
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
  setVertexBuffer(slot: number, buffer: GPUBuffer, offset?: number): void;

  draw(
    vertexCount: number,
    instanceCount: number,
    firstVertex: number,
    firstInstance: number
  ): void;
  drawIndexed(
    indexCount: number,
    instanceCount: number,
    firstIndex: number,
    baseVertex: number,
    firstInstance: number
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

  executeBundles(bundles: Iterable<GPURenderBundle>): void;
  endPass(): void;
}

interface GPURenderBundleDescriptor extends GPUObjectDescriptorBase {}

declare class GPURenderBundle implements GPUObjectBase {
  label: string | undefined;
}

declare class GPURenderBundleEncoder implements GPURenderEncoderBase {
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
  setVertexBuffer(slot: number, buffer: GPUBuffer, offset?: number): void;

  draw(
    vertexCount: number,
    instanceCount: number,
    firstVertex: number,
    firstInstance: number
  ): void;
  drawIndexed(
    indexCount: number,
    instanceCount: number,
    firstIndex: number,
    baseVertex: number,
    firstInstance: number
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
  label: string | undefined;

  getBindGroupLayout: (index: number) => GPUBindGroupLayout;
}

declare class GPUSampler implements GPUObjectBase {
  label: string | undefined;
}

declare class GPUShaderModule implements GPUObjectBase {
  label: string | undefined;
}

declare class GPUSwapChain implements GPUObjectBase {
  label: string | undefined;
  getCurrentTexture(): GPUTexture;
}

declare class GPUTexture implements GPUObjectBase {
  label: string | undefined;
  createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView;
  destroy(): void;
}

declare class GPUTextureView implements GPUObjectBase {
  label: string | undefined;
}

type GPUPowerPreference = "low-power" | "high-performance";
interface GPURequestAdapterOptions {
  powerPreference?: GPUPowerPreference;
}

declare class GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter>;
}

// ****************************************************************************
// ERROR SCOPES
// ****************************************************************************

type GPUErrorFilter = "none" | "out-of-memory" | "validation";

declare class GPUOutOfMemoryError {
  constructor();
}

declare class GPUValidationError {
  constructor(message: string);
  readonly message: string;
}

type GPUError = GPUOutOfMemoryError | GPUValidationError;

interface GPUUncapturedErrorEventInit extends EventInit {
  error: GPUError;
}

declare class GPUUncapturedErrorEvent extends Event {
  constructor(
    type: string,
    gpuUncapturedErrorEventInitDict: GPUUncapturedErrorEventInit
  );
  readonly error: GPUError;
}

// ****************************************************************************
// TELEMETRY
// ****************************************************************************

interface GPUDeviceLostInfo {
  readonly message: string;
}

interface GPU {
  // May reject with DOMException  // TODO: DOMException("OperationError")?
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter>;
}

interface Navigator {
  readonly gpu: GPU | undefined;
}

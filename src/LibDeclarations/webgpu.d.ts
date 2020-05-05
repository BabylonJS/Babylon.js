// https://github.com/gpuweb/gpuweb/blob/402b69138fbedf4a3c9c85cd1bf7e1cc27c1b34e/spec/index.bs
// except #280 which removed setSubData
// except #494 which reverted the addition of GPUAdapter.limits
// v 0.0.19

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
  | "anisotropic-filtering";
type GPUAddressMode = "clamp-to-edge" | "repeat" | "mirror-repeat";
type GPUBindingType =
  | "uniform-buffer"
  | "storage-buffer"
  | "readonly-storage-buffer"
  | "sampler"
  | "sampled-texture"
  | "storage-texture";
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

interface GPUBindGroupBinding {
  binding: number;
  resource: GPUBindingResource;
}

interface GPUBindGroupDescriptor extends GPUObjectDescriptorBase {
  layout: GPUBindGroupLayout;
  entries: GPUBindGroupBinding[];
}

interface GPUBindGroupLayoutBinding {
  binding: number;
  visibility: GPUShaderStageFlags;
  type: GPUBindingType;
  textureDimension?: GPUTextureViewDimension;
  textureComponentType?: GPUTextureComponentType;
  multisampled?: boolean;
  hasDynamicOffset?: boolean;
}

interface GPUBindGroupLayoutDescriptor
  extends GPUObjectDescriptorBase {
  bindings?: GPUBindGroupLayoutBinding[];
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
  rowPitch: number;
  imageHeight: number;
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
  extensions?: GPUExtensionName[];
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
  attributes: GPUVertexAttributeDescriptor[];
}

interface GPUVertexStateDescriptor {
  indexFormat?: GPUIndexFormat;
  vertexBuffers: GPUVertexBufferLayoutDescriptor[];
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

interface GPULimitsOut {
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
  layout: GPUPipelineLayout;
}

interface GPUPipelineLayoutDescriptor extends GPUObjectDescriptorBase {
  bindGroupLayouts: GPUBindGroupLayout[];
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
  colorAttachments: GPURenderPassColorAttachmentDescriptor[];
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
  colorStates: GPUColorStateDescriptor[];
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
  arrayLayerCount?: number;
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

class GPUAdapter {
  readonly name: string;
  readonly extensions: GPUExtensionName[];
  readonly limits: GPULimitsOut;

  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
}

class GPUBindGroup implements GPUObjectBase {
  label: string | undefined;
}

class GPUBindGroupLayout implements GPUObjectBase {
  label: string | undefined;
}

class GPUBuffer implements GPUObjectBase {
  label: string | undefined;
  //readonly mapping: ArrayBuffer | null;
  destroy(): void;
  unmap(): void;

  mapWriteAsync(): Promise<ArrayBuffer>;
  mapReadAsync(): Promise<ArrayBuffer>;
  // TODO: Remove setSubData (#280)
  setSubData(
    offset: number,
    src: ArrayBufferView,
    srcOffset?: number,
    byteLength?: number
  ): void;
}

class GPUCommandBuffer implements GPUObjectBase {
  label: string | undefined;
}

interface GPUCommandBufferDescriptor extends GPUObjectDescriptorBase {}

class GPUCommandEncoder implements GPUObjectBase {
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

class GPUComputePassEncoder implements GPUProgrammablePassEncoder {
  label: string | undefined;

  setBindGroup(
    index: number,
    bindGroup: GPUBindGroup,
    dynamicOffsets?: number[]
  ): void;

  popDebugGroup(): void;
  pushDebugGroup(groupLabel: string): void;
  insertDebugMarker(markerLabel: string): void;

  setPipeline(pipeline: GPUComputePipeline): void;
  dispatch(x: number, y?: number, z?: number): void;
  dispatchIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;

  endPass(): void;
}

class GPUComputePipeline implements GPUObjectBase {
  label: string | undefined;
}

interface GPUObjectBase {
  label: string | undefined;
}

interface GPUObjectDescriptorBase {
  label?: string;
}

// SwapChain / CanvasContext
class GPUCanvasContext {
  configureSwapChain(descriptor: GPUSwapChainDescriptor): GPUSwapChain;

  getSwapChainPreferredFormat(device: GPUDevice): Promise<GPUTextureFormat>;
}

class GPUDevice extends EventTarget implements GPUObjectBase {
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

class GPUFence implements GPUObjectBase {
  label: string | undefined;

  getCompletedValue(): number;
  onCompletion(completionValue: number): Promise<void>;
}

class GPUPipelineLayout implements GPUObjectBase {
  label: string | undefined;
}

interface GPUProgrammablePassEncoder extends GPUObjectBase {
  setBindGroup(
    index: number,
    bindGroup: GPUBindGroup,
    dynamicOffsets?: number[]
  ): void;

  popDebugGroup(): void;
  pushDebugGroup(groupLabel: string): void;
  insertDebugMarker(markerLabel: string): void;
}

class GPUQueue implements GPUObjectBase {
  label: string | undefined;
  signal(fence: GPUFence, signalValue: number): void;
  submit(commandBuffers: GPUCommandBuffer[]): void;
  createFence(descriptor?: GPUFenceDescriptor): GPUFence;
  copyImageBitmapToTexture(
    source: GPUImageBitmapCopyView,
    destination: GPUTextureCopyView,
    copySize: GPUExtent3D
  ): void;
}

interface GPURenderEncoderBase extends GPUProgrammablePassEncoder {
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
}

class GPURenderPassEncoder implements GPURenderEncoderBase {
  label: string | undefined;

  setBindGroup(
    index: number,
    bindGroup: GPUBindGroup,
    dynamicOffsets?: number[]
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

  executeBundles(bundles: GPURenderBundle[]): void;
  endPass(): void;
}

interface GPURenderBundleDescriptor extends GPUObjectDescriptorBase {}

class GPURenderBundle implements GPUObjectBase {
  label: string | undefined;
}

class GPURenderBundleEncoder implements GPURenderEncoderBase {
  label: string | undefined;

  setBindGroup(
    index: number,
    bindGroup: GPUBindGroup,
    dynamicOffsets?: number[]
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
  colorFormats: GPUTextureFormat[];
  depthStencilFormat?: GPUTextureFormat;
  sampleCount?: number;
}

declare class GPURenderPipeline implements GPUObjectBase {
  label: string | undefined;
  getBindGroupLayout: (number) => GPUBindGroupLayout;
}

class GPUSampler implements GPUObjectBase {
  label: string | undefined;
}

class GPUShaderModule implements GPUObjectBase {
  label: string | undefined;
}

class GPUSwapChain implements GPUObjectBase {
  label: string | undefined;
  getCurrentTexture(): GPUTexture;
}

class GPUTexture implements GPUObjectBase {
  label: string | undefined;
  createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView;
  destroy(): void;
}

class GPUTextureView implements GPUObjectBase {
  label: string | undefined;
}

type GPUPowerPreference = "low-power" | "high-performance";
interface GPURequestAdapterOptions {
  powerPreference?: GPUPowerPreference;
}

class GPU {
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

class GPUUncapturedErrorEvent extends Event {
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

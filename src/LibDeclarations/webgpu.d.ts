/* tslint:disable */
// https://github.com/gpuweb/gpuweb/blob/9d7622bf366be74e0599122d8c4d0fd1128ae484/design/sketch.webidl

type u64 = number;

type GPUBindingResource = GPUSampler | GPUTextureView | GPUBufferBinding;

type GPUAddressMode =
  | "clamp-to-edge"
  | "repeat"
  | "mirror-repeat"
  | "clamp-to-border-color";
type GPUBindingType =
  | "uniform-buffer"
  | "dynamic-uniform-buffer"
  | "sampler"
  | "sampled-texture"
  | "storage-buffer"
  | "dynamic-storage-buffer";
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
type GPUBorderColor =
  | "transparent-black"
  | "opaque-black"
  | "opaque-white";
type GPUCompareFunction =
  | "never"
  | "less"
  | "equal"
  | "lessEqual"
  | "greater"
  | "notEqual"
  | "greaterEqual"
  | "always";
type GPUCullMode =
  | "none"
  | "front"
  | "back";
type GPUFilterMode =
  | "nearest"
  | "linear";
type GPUFrontFace =
  | "ccw"
  | "cw";
type GPUIndexFormat =
  | "uint16"
  | "uint32";
type GPUInputStepMode =
  | "vertex"
  | "instance";
type GPULoadOp =
  | "clear"
  | "load";
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
type GPUStoreOp =
  | "store";
type GPUTextureDimension =
  | "1d"
  | "2d"
  | "3d";
type GPUTextureFormat =
  /* Normal 8 bit formats */
  | "r8unorm"
  | "r8unorm-srgb"
  | "r8snorm"
  | "r8uint"
  | "r8sint"
  /* Normal 16 bit formats */
  | "r16unorm"
  | "r16snorm"
  | "r16uint"
  | "r16sint"
  | "r16float"
  | "rg8unorm"
  | "rg8unorm-srgb"
  | "rg8snorm"
  | "rg8uint"
  | "rg8sint"
  /* Packed 16 bit formats */
  | "b5g6r5unorm"
  /* Normal 32 bit formats */
  | "r32uint"
  | "r32sint"
  | "r32float"
  | "rg16unorm"
  | "rg16snorm"
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
  /* Packed 32 bit formats */
  | "rgb10a2unorm"
  | "rg11b10float"
  /* Normal 64 bit formats */
  | "rg32uint"
  | "rg32sint"
  | "rg32float"
  | "rgba16unorm"
  | "rgba16snorm"
  | "rgba16uint"
  | "rgba16sint"
  | "rgba16float"
  /* Normal 128 bit formats */
  | "rgba32uint"
  | "rgba32sint"
  | "rgba32float"
  /* Depth and Stencil formats */
  | "depth32float"
  | "depth32float-stencil8";

type GPUTextureViewDimension =
  | "1d"
  | "2d"
  | "2d-array"
  | "cube"
  | "cube-array"
  | "3d";
  
type GPUVertexFormat =
  | "uchar"
  | "uchar2"
  | "uchar3"
  | "uchar4"
  | "char"
  | "char2"
  | "char3"
  | "char4"
  | "ucharnorm"
  | "uchar2norm"
  | "uchar3norm"
  | "uchar4norm"
  | "uchar4norm-bgra"
  | "charnorm"
  | "char2norm"
  | "char3norm"
  | "char4norm"
  | "ushort"
  | "ushort2"
  | "ushort3"
  | "ushort4"
  | "short"
  | "short2"
  | "short3"
  | "short4"
  | "ushortnorm"
  | "ushort2norm"
  | "ushort3norm"
  | "ushort4norm"
  | "shortnorm"
  | "short2norm"
  | "short3norm"
  | "short4norm"
  | "half"
  | "half2"
  | "half3"
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

type GPUBufferUsageFlags = number;
// const enum GPUBufferUsage {
//   NONE = 0,
//   MAP_READ = 1,
//   MAP_WRITE = 2,
//   TRANSFER_SRC = 4,
//   TRANSFER_DST = 8,
//   INDEX = 16,
//   VERTEX = 32,
//   UNIFORM = 64,
//   STORAGE = 128,
// }

type GPUColorWriteFlags = number;
// const enum GPUColorWriteBits {
//   NONE = 0,
//   RED = 1,
//   GREEN = 2,
//   BLUE = 4,
//   ALPHA = 8,
//   ALL = 15,
// }

type GPUShaderStageFlags = number;
// const enum GPUShaderStageBit {
//   NONE = 0,
//   VERTEX = 1,
//   FRAGMENT = 2,
//   COMPUTE = 4,
// }

type GPUTextureAspectFlags = number;
// const enum GPUTextureAspect {
//   COLOR = 1,
//   DEPTH = 2,
//   STENCIL = 4,
// }

type GPUTextureUsageFlags = number;
// const enum GPUTextureUsage {
//   NONE = 0,
//   TRANSFER_SRC = 1,
//   TRANSFER_DST = 2,
//   SAMPLED = 4,
//   STORAGE = 8,
//   OUTPUT_ATTACHMENT = 16,
// }

interface GPUBindGroupBinding {
  binding?: number;
  resource?: GPUBindingResource;
}

interface GPUBindGroupDescriptor {
  bindings?: GPUBindGroupBinding[];
  layout?: GPUBindGroupLayout;
}

interface GPUBindGroupLayoutBinding {
  binding?: number;
  type?: GPUBindingType;
  visibility?: GPUShaderStageFlags;
}

interface GPUBindGroupLayoutDescriptor {
  bindings?: GPUBindGroupLayoutBinding[];
}

interface GPUBlendDescriptor {
  dstFactor?: GPUBlendFactor;
  operation?: GPUBlendOperation;
  srcFactor?: GPUBlendFactor;
}

interface GPUColorStateDescriptor {
    format?: GPUTextureFormat;

    alphaBlend?: GPUBlendDescriptor;
    colorBlend?: GPUBlendDescriptor;
    writeMask?: GPUColorWriteFlags;
}

interface GPUBlendStateDescriptor {
  alpha?: GPUBlendDescriptor;
  blendEnabled?: boolean;
  color?: GPUBlendDescriptor;
  writeMask?: GPUColorWriteFlags;
}

interface GPUBufferBinding {
  buffer?: GPUBuffer;
  offset?: number;
  size?: number;
}

interface GPUBufferCopyView {
  buffer?: GPUBuffer;
  imageHeight?: number;
  offset?: number;
  rowPitch?: number;
}

interface GPUBufferDescriptor {
  size?: number;
  usage?: GPUBufferUsageFlags;
}

interface GPUColor {
  a?: number;
  b?: number;
  g?: number;
  r?: number;
}

interface GPUCommandEncoderDescriptor {
  label?: string;
}

interface GPUComputePipelineDescriptor extends GPUPipelineDescriptorBase {
  computeStage?: GPUPipelineStageDescriptor;
}

interface GPUDepthStencilStateDescriptor {
  stencilBack?: GPUStencilStateFaceDescriptor;
  depthCompare?: GPUCompareFunction;
  depthWriteEnabled?: boolean;
  stencilFront?: GPUStencilStateFaceDescriptor;
  stencilReadMask?: number;
  stencilWriteMask?: number;
  format?: GPUTextureFormat;
}

interface GPUDeviceDescriptor {
  extensions?: GPUExtensions;
}

interface GPUExtensions {
  anisotropicFiltering?: boolean;
}

interface GPUExtent3D {
  width: number;
  height: number;
  depth: number;
}

interface GPUFenceDescriptor {
  initialValue?: u64;
  label?: string;
  signalQueue?: GPUQueue;
}

interface GPUInputStateDescriptor {
  indexFormat?: GPUIndexFormat;
  vertexBuffers?: GPUVertexInputDescriptor[];
}

interface GPULimits {
  maxBindGroups?: number;
}

interface GPUOrigin3D {
  x?: number;
  y?: number;
  z?: number;
}

interface GPUPipelineDescriptorBase {
  label?: string;
  layout?: GPUPipelineLayout;
}

interface GPUPipelineLayoutDescriptor {
  bindGroupLayouts?: GPUBindGroupLayout[];
}

interface GPUPipelineStageDescriptor {
  entryPoint?: string;
  module?: GPUShaderModule;
}

interface GPURasterizationStateDescriptor {
  cullMode?: GPUCullMode;
  depthBias?: number;
  depthBiasClamp?: number;
  depthBiasSlopeScale?: number;
  frontFace?: GPUFrontFace;
}

interface GPURenderPassColorAttachmentDescriptor {
  attachment?: GPUTextureView;
  clearColor?: GPUColor;
  loadOp?: GPULoadOp;
  resolveTarget?: GPUTextureView | null;
  storeOp?: GPUStoreOp;
}

interface GPURenderPassDepthStencilAttachmentDescriptor {
  attachment?: GPUTextureView;
  clearDepth?: number;
  clearStencil?: number;
  depthLoadOp?: GPULoadOp;
  depthStoreOp?: GPUStoreOp;
  stencilLoadOp?: GPULoadOp;
  stencilStoreOp?: GPUStoreOp;
}

interface GPURenderPassDescriptor {
  colorAttachments?: GPURenderPassColorAttachmentDescriptor[];
  depthStencilAttachment?: GPURenderPassDepthStencilAttachmentDescriptor;
}

interface GPURenderPipelineStageDescriptor {
  vertexStage?: GPUPipelineStageDescriptor;
  fragmentStage?: GPUPipelineStageDescriptor;
}

interface GPURenderPipelineDescriptor extends GPUPipelineDescriptorBase, GPURenderPipelineStageDescriptor {
  colorStates?: GPUColorStateDescriptor[];
  // blendStates?: GPUBlendStateDescriptor[];
  depthStencilState?: GPUDepthStencilStateDescriptor;
  vertexInput?: GPUInputStateDescriptor;
  primitiveTopology?: GPUPrimitiveTopology;
  rasterizationState?: GPURasterizationStateDescriptor;
  sampleCount?: number;
}

interface GPUSamplerDescriptor {
  borderColor?: GPUBorderColor;
  compareFunction?: GPUCompareFunction;
  lodMaxClamp?: number;
  lodMinClamp?: number;
  magFilter?: GPUFilterMode;
  maxAnisotropy?: number;
  minFilter?: GPUFilterMode;
  mipmapFilter?: GPUFilterMode;
  rAddressMode?: GPUAddressMode;
  sAddressMode?: GPUAddressMode;
  tAddressMode?: GPUAddressMode;
}

interface GPUShaderModuleDescriptor {
  // After Migration to Canary
  // code: Uint32Array;
  code: ArrayBuffer | string;
  label?: string;
}

interface GPUStencilStateFaceDescriptor {
  compare?: GPUCompareFunction;
  depthFailOp?: GPUStencilOperation;
  passOp?: GPUStencilOperation;
  failOp?: GPUStencilOperation;
}

interface GPUSwapChainDescriptor {
  context?: GPUCanvasContext ;
  format?: GPUTextureFormat;
  usage?: GPUTextureUsageFlags;
}

interface GPUTextureCopyView {
  texture: GPUTexture;
  mipLevel?: number;
  arrayLayer?: number;
  origin: GPUOrigin3D;
}

interface GPUTextureDescriptor {
  size: GPUExtent3D;
  arrayLayerCount?: number;
  mipLevelCount?: number;
  sampleCount?: number;
  dimension?: GPUTextureDimension;
  format: GPUTextureFormat;
  usage: GPUTextureUsageFlags;
}

interface GPUTextureViewDescriptor {
  aspect?: GPUTextureAspectFlags;
  baseArrayLayer?: number;
  baseMipLevel?: number;
  dimension?: GPUTextureViewDimension;
  format?: GPUTextureFormat;
  arrayLayerCount?: number;
  mipLevelCount?: number;
}

interface GPUVertexAttributeDescriptor {
  format?: GPUVertexFormat;
  // inputSlot?: number;
  offset?: number;
  shaderLocation?: number;
}

interface GPUVertexInputDescriptor {
  // inputSlot?: number;
  stride?: number;
  stepMode?: GPUInputStepMode;
  attributes?: GPUVertexAttributeDescriptor[];
}

interface GPUAdapter {
  readonly extensions: GPUExtensions;
  readonly name: string;
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
}

interface GPUBindGroup extends GPUDebugLabel {
}

interface GPUBindGroupLayout extends GPUDebugLabel {
}

interface GPUBuffer extends GPUDebugLabel {
  //readonly mapping: ArrayBuffer | null;
  destroy(): void;
  unmap(): void;

  mapWriteAsync(): Promise<ArrayBuffer>;
  mapReadAsync(): Promise<ArrayBuffer>;
  setSubData(offset: number, ab: ArrayBuffer): void;
  
  // After Migration to Canary
  // PR #261
  // If `byteLength` is 0, the ArrayBufferView is copied to the end.
  // That is, `byteLength` "defaults" to `src.byteLength - srcByteOffset`.
  // setSubData(dstByteOffset: number, src: ArrayBufferView, srcByteOffset = 0, byteLength = 0): void;
}

interface GPUCommandEncoder extends GPUDebugLabel {
  beginComputePass(): GPUComputePassEncoder;
  beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
  copyBufferToBuffer(src: GPUBuffer, srcOffset: number, dst: GPUBuffer, dstOffset: number, size: number): void;
  copyBufferToTexture(source: GPUBufferCopyView, destination: GPUTextureCopyView, copySize: GPUExtent3D): void;
  copyTextureToBuffer(source: GPUTextureCopyView, destination: GPUBufferCopyView, copySize: GPUExtent3D): void;
  copyTextureToTexture(source: GPUTextureCopyView, destination: GPUTextureCopyView, copySize: GPUExtent3D): void;
  finish(): GPUCommandBuffer;
}

interface GPUCommandBuffer extends GPUDebugLabel {
}

interface GPUComputePassEncoder extends GPUProgrammablePassEncoder {
  setPipeline(pipeline: GPUComputePipeline): void;
  dispatch(x: number, y: number, z: number): void;
}

interface GPUComputePipeline extends GPUDebugLabel {
}

interface GPUDebugLabel {
  label: string | undefined;
}

// SwapChain / CanvasContext
interface GPUCanvasContext {
}

interface GPUDevice {
  readonly adapter: GPUAdapter;
  readonly extensions: GPUExtensions;
  readonly limits: GPULimits;

  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
  createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout;
  createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
  //createBufferMapped(descriptor: GPUBufferDescriptor): GPUBuffer;
  //createBufferMappedAsync(descriptor: GPUBufferDescriptor): GPUBuffer;
  createCommandEncoder(descriptor: GPUCommandEncoderDescriptor): GPUCommandEncoder;
  createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
  createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout;
  createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline;
  createSampler(descriptor: GPUSamplerDescriptor): GPUSampler;
  createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
  createTexture(descriptor: GPUTextureDescriptor): GPUTexture;

  getQueue(): GPUQueue;

  // Calling createSwapChain a second time for the same GPUCanvasContext
  // invalidates the previous one, and all of the textures it’s produced.
  createSwapChain(descriptor: GPUSwapChainDescriptor): GPUSwapChain;

  getSwapChainPreferredFormat(context: GPUCanvasContext): Promise<GPUTextureFormat> ;
}

interface GPUFence extends GPUDebugLabel {
  getCompletedValue(): u64;
  onCompletion(completionValue: u64): Promise<void>;
}

interface GPULogEntryEvent extends Event {
  readonly object: any;
  readonly reason: string;
}

interface GPUPipelineLayout extends GPUDebugLabel {
}

interface GPUProgrammablePassEncoder extends GPUDebugLabel {
  endPass(): void;
  insertDebugMarker(markerLabel: string): void;
  popDebugGroup(): void;
  pushDebugGroup(groupLabel: string): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup): void;
}

interface GPUQueue extends GPUDebugLabel {
  signal(fence: GPUFence, signalValue: u64): void;
  submit(buffers: GPUCommandBuffer[]): void;
  createFence(descriptor: GPUFenceDescriptor): GPUFence ;
}

interface GPURenderPassEncoder extends GPUProgrammablePassEncoder {
  setPipeline(pipeline: GPURenderPipeline): void;
  setIndexBuffer(buffer: GPUBuffer, offset: number): void;
  setVertexBuffers(startSlot: number, buffers: GPUBuffer[], offsets: number[]): void;

  draw(vertexCount: number, instanceCount: number, firstVertex: number, firstInstance: number): void;
  drawIndexed(indexCount: number, instanceCount: number, firstIndex: number, baseVertex: number, firstInstance: number): void;

  setViewport(x: number, y: number, width: number, height: number, minDepth: number, maxDepth: number): void;
  setScissorRect(x: number, y: number, width: number, height: number): void;

  setStencilReference(reference: number): void;
  setBlendColor(color: GPUColor): void;
}

interface GPURenderPipeline extends GPUDebugLabel {
}

interface GPUSampler extends GPUDebugLabel {
}

interface GPUShaderModule extends GPUDebugLabel {
}

interface GPUSwapChain {
  getCurrentTexture(): GPUTexture;
}

interface GPUTexture extends GPUDebugLabel {
  createDefaultView(): GPUTextureView;
  createView(desc: GPUTextureViewDescriptor): GPUTextureView;
  destroy(): void;
}

interface GPUTextureView extends GPUDebugLabel {
}

type GPUPowerPreference =
  | "low-power"
  | "high-performance";

interface GPURequestAdapterOptions {
  powerPreference?: GPUPowerPreference;
}

interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter>;
}

// ****************************************************************************
// ERROR SCOPES
// ****************************************************************************

type GPUErrorFilter = "none"
    | "out-of-memory"
    | "validation";

interface GPUOutOfMemoryError { }

interface GPUValidationError {
    readonly message: string;
}

type GPUError = GPUOutOfMemoryError | GPUValidationError;

interface GPUDevice {
    pushErrorScope(filter: GPUErrorFilter): void;
    popErrorScope(): Promise<GPUError | null>;
}

 // ****************************************************************************
// TELEMETRY
// ****************************************************************************
interface GPUUncapturedErrorEvent extends Event {
    readonly error: GPUError;
}

interface GPUUncapturedErrorEventInit extends EventInit {
    message: string;
}

// TODO: is it possible to expose the EventTarget only on the main thread?
interface GPUDevice extends EventTarget {
    onuncapturederror: Event;
}

interface GPU {
    // May reject with DOMException  // TODO: DOMException("OperationError")?
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter>;
}

interface Navigator {
    readonly gpu: GPU | undefined;
}
/* tslint:disable */
// https://github.com/gpuweb/gpuweb/blob/9d7622bf366be74e0599122d8c4d0fd1128ae484/design/sketch.webidl

export type u64 = number;

export type GPUBindingResource = GPUSampler | GPUTextureView | GPUBufferBinding;

export type GPUAddressMode =
  | "clamp-to-edge"
  | "repeat"
  | "mirror-repeat"
  | "clamp-to-border-color";
export type GPUBindingType =
  | "uniform-buffer"
  | "dynamic-uniform-buffer"
  | "sampler"
  | "sampled-texture"
  | "storage-buffer"
  | "dynamic-storage-buffer";
export type GPUBlendFactor =
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
export type GPUBlendOperation =
  | "add"
  | "subtract"
  | "reverse-subtract"
  | "min"
  | "max";
export type GPUBorderColor =
  | "transparent-black"
  | "opaque-black"
  | "opaque-white";
export type GPUCompareFunction =
  | "never"
  | "less"
  | "equal"
  | "lessEqual"
  | "greater"
  | "notEqual"
  | "greaterEqual"
  | "always";
export type GPUCullMode =
  | "none"
  | "front"
  | "back";
export type GPUFilterMode =
  | "nearest"
  | "linear";
export type GPUFrontFace =
  | "ccw"
  | "cw";
export type GPUIndexFormat =
  | "uint16"
  | "uint32";
export type GPUInputStepMode =
  | "vertex"
  | "instance";
export type GPULoadOp =
  | "clear"
  | "load";
export type GPUPrimitiveTopology =
  | "point-list"
  | "line-list"
  | "line-strip"
  | "triangle-list"
  | "triangle-strip";
export type GPUStencilOperation =
  | "keep"
  | "zero"
  | "replace"
  | "invert"
  | "increment-clamp"
  | "decrement-clamp"
  | "increment-wrap"
  | "decrement-wrap";
export type GPUStoreOp =
  | "store";
export type GPUTextureDimension =
  | "1d"
  | "2d"
  | "3d";
export type GPUTextureFormat =
  | "r8unorm"
  | "r8unorm-srgb"
  | "r8snorm"
  | "r8uint"
  | "r8sint"
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
  | "b5g6r5unorm"
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
  | "rgb10a2unorm"
  | "rg11b10float"
  | "rg32uint"
  | "rg32sint"
  | "rg32float"
  | "rgba16unorm"
  | "rgba16snorm"
  | "rgba16uint"
  | "rgba16sint"
  | "rgba16float"
  | "rgba32uint"
  | "rgba32sint"
  | "rgba32float";
export type GPUTextureViewDimension =
  | "1d"
  | "2d"
  | "2d-array"
  | "cube"
  | "cube-array"
  | "3d";
export type GPUVertexFormat =
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

export type GPUBufferUsageFlags = number;
export const enum GPUBufferUsage {
  NONE = 0,
  MAP_READ = 1,
  MAP_WRITE = 2,
  TRANSFER_SRC = 4,
  TRANSFER_DST = 8,
  INDEX = 16,
  VERTEX = 32,
  UNIFORM = 64,
  STORAGE = 128,
}

export type GPUColorWriteFlags = number;
export const enum GPUColorWriteBits {
  NONE = 0,
  RED = 1,
  GREEN = 2,
  BLUE = 4,
  ALPHA = 8,
  ALL = 15,
}

export type GPUShaderStageFlags = number;
export const enum GPUShaderStageBit {
  NONE = 0,
  VERTEX = 1,
  FRAGMENT = 2,
  COMPUTE = 4,
}

export type GPUTextureAspectFlags = number;
export const enum GPUTextureAspect {
  COLOR = 1,
  DEPTH = 2,
  STENCIL = 4,
}

export type GPUTextureUsageFlags = number;
export const enum GPUTextureUsage {
  NONE = 0,
  TRANSFER_SRC = 1,
  TRANSFER_DST = 2,
  SAMPLED = 4,
  STORAGE = 8,
  OUTPUT_ATTACHMENT = 16,
}

export interface GPUBindGroupBinding {
  binding?: number;
  resource?: GPUBindingResource;
}

export interface GPUBindGroupDescriptor {
  bindings?: GPUBindGroupBinding[];
  layout?: GPUBindGroupLayout;
}

export interface GPUBindGroupLayoutBinding {
  binding?: number;
  type?: GPUBindingType;
  visibility?: GPUShaderStageFlags;
}

export interface GPUBindGroupLayoutDescriptor {
  bindings?: GPUBindGroupLayoutBinding[];
}

export interface GPUBlendDescriptor {
  dstFactor?: GPUBlendFactor;
  operation?: GPUBlendOperation;
  srcFactor?: GPUBlendFactor;
}

export interface GPUColorStateDescriptor {
    format?: GPUTextureFormat;

    alphaBlend?: GPUBlendDescriptor;
    colorBlend?: GPUBlendDescriptor;
    writeMask?: GPUColorWriteFlags;
}

export interface GPUBlendStateDescriptor {
  alpha?: GPUBlendDescriptor;
  blendEnabled?: boolean;
  color?: GPUBlendDescriptor;
  writeMask?: GPUColorWriteFlags;
}

export interface GPUBufferBinding {
  buffer?: GPUBuffer;
  offset?: number;
  size?: number;
}

export interface GPUBufferCopyView {
  buffer?: GPUBuffer;
  imageHeight?: number;
  offset?: number;
  rowPitch?: number;
}

export interface GPUBufferDescriptor {
  size?: number;
  usage?: GPUBufferUsageFlags;
}

export interface GPUColor {
  a?: number;
  b?: number;
  g?: number;
  r?: number;
}

export interface GPUCommandEncoderDescriptor {
  label?: string;
}

export interface GPUComputePipelineDescriptor extends GPUPipelineDescriptorBase {
  computeStage?: GPUPipelineStageDescriptor;
}

export interface GPUDepthStencilStateDescriptor {
  stencilBack?: GPUStencilStateFaceDescriptor;
  depthCompare?: GPUCompareFunction;
  depthWriteEnabled?: boolean;
  stencilFront?: GPUStencilStateFaceDescriptor;
  stencilReadMask?: number;
  stencilWriteMask?: number;
  format?: GPUTextureFormat;
}

export interface GPUDeviceDescriptor {
  extensions?: GPUExtensions;
}

export interface GPUExtensions {
  anisotropicFiltering?: boolean;
}

export interface GPUExtent3D {
  width: number;
  height: number;
  depth: number;
}

export interface GPUFenceDescriptor {
  initialValue?: u64;
  label?: string;
  signalQueue?: GPUQueue;
}

export interface GPUInputStateDescriptor {
  attributes?: GPUVertexAttributeDescriptor[];
  indexFormat?: GPUIndexFormat;
  inputs?: GPUVertexInputDescriptor[];
}

export interface GPULimits {
  maxBindGroups?: number;
}

export interface GPUOrigin3D {
  x?: number;
  y?: number;
  z?: number;
}

export interface GPUPipelineDescriptorBase {
  label?: string;
  layout?: GPUPipelineLayout;
}

export interface GPUPipelineLayoutDescriptor {
  bindGroupLayouts?: GPUBindGroupLayout[];
}

export interface GPUPipelineStageDescriptor {
  entryPoint?: string;
  module?: GPUShaderModule;
}

export interface GPURasterizationStateDescriptor {
  cullMode?: GPUCullMode;
  depthBias?: number;
  depthBiasClamp?: number;
  depthBiasSlopeScale?: number;
  frontFace?: GPUFrontFace;
}

export interface GPURenderPassColorAttachmentDescriptor {
  attachment?: GPUTextureView;
  clearColor?: GPUColor;
  loadOp?: GPULoadOp;
  resolveTarget?: GPUTextureView | null;
  storeOp?: GPUStoreOp;
}

export interface GPURenderPassDepthStencilAttachmentDescriptor {
  attachment?: GPUTextureView;
  clearDepth?: number;
  clearStencil?: number;
  depthLoadOp?: GPULoadOp;
  depthStoreOp?: GPUStoreOp;
  stencilLoadOp?: GPULoadOp;
  stencilStoreOp?: GPUStoreOp;
}

export interface GPURenderPassDescriptor {
  colorAttachments?: GPURenderPassColorAttachmentDescriptor[];
  depthStencilAttachment?: GPURenderPassDepthStencilAttachmentDescriptor;
}

export interface GPURenderPipelineDescriptor extends GPUPipelineDescriptorBase {
  colorStates?: GPUColorStateDescriptor[];
  blendStates?: GPUBlendStateDescriptor[];
  depthStencilState?: GPUDepthStencilStateDescriptor;
  fragmentStage?: GPUPipelineStageDescriptor;
  inputState?: GPUInputStateDescriptor;
  primitiveTopology?: GPUPrimitiveTopology;
  rasterizationState?: GPURasterizationStateDescriptor;
  sampleCount?: number;
  vertexStage?: GPUPipelineStageDescriptor;
}

export interface GPUSamplerDescriptor {
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

export interface GPUShaderModuleDescriptor {
  code: ArrayBuffer | string;
  label?: string;
}

export interface GPUStencilStateFaceDescriptor {
  compare?: GPUCompareFunction;
  depthFailOp?: GPUStencilOperation;
  passOp?: GPUStencilOperation;
  failOp?: GPUStencilOperation;
}

export interface GPUSwapChainDescriptor {
  context?: GPUCanvasContext ;
  format?: GPUTextureFormat;
  usage?: GPUTextureUsageFlags;
}

export interface GPUTextureCopyView {
  texture: GPUTexture;
  mipLevel?: number;
  arrayLayer?: number;
  origin: GPUOrigin3D;
}

export interface GPUTextureDescriptor {
  size: GPUExtent3D;
  arrayLayerCount?: number;
  mipLevelCount?: number;
  sampleCount?: number;
  dimension?: GPUTextureDimension;
  format: GPUTextureFormat;
  usage: GPUTextureUsageFlags;
}

export interface GPUTextureViewDescriptor {
  aspect?: GPUTextureAspectFlags;
  baseArrayLayer?: number;
  baseMipLevel?: number;
  dimension?: GPUTextureViewDimension;
  format?: GPUTextureFormat;
  arrayLayerCount?: number;
  mipLevelCount?: number;
}

export interface GPUVertexAttributeDescriptor {
  format?: GPUVertexFormat;
  inputSlot?: number;
  offset?: number;
  shaderLocation?: number;
}

export interface GPUVertexInputDescriptor {
  inputSlot?: number;
  stepMode?: GPUInputStepMode;
  stride?: number;
}

export interface GPUAdapter {
  readonly extensions: GPUExtensions;
  readonly name: string;
  requestDevice(descriptor: GPUDeviceDescriptor): Promise<GPUDevice>;
}

export interface GPUBindGroup extends GPUDebugLabel {
}

export interface GPUBindGroupLayout extends GPUDebugLabel {
}

export interface GPUBuffer extends GPUDebugLabel {
  //readonly mapping: ArrayBuffer | null;
  destroy(): void;
  unmap(): void;

  mapWriteAsync(): Promise<ArrayBuffer>;
  mapReadAsync(): Promise<ArrayBuffer>;
  setSubData(offset: number, ab: ArrayBuffer): void;
}

export interface GPUCommandEncoder extends GPUDebugLabel {
  beginComputePass(): GPUComputePassEncoder;
  beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
  copyBufferToBuffer(src: GPUBuffer, srcOffset: number, dst: GPUBuffer, dstOffset: number, size: number): void;
  copyBufferToTexture(source: GPUBufferCopyView, destination: GPUTextureCopyView, copySize: GPUExtent3D): void;
  copyTextureToBuffer(source: GPUTextureCopyView, destination: GPUBufferCopyView, copySize: GPUExtent3D): void;
  copyTextureToTexture(source: GPUTextureCopyView, destination: GPUTextureCopyView, copySize: GPUExtent3D): void;
  finish(): GPUCommandBuffer;
}

export interface GPUCommandBuffer extends GPUDebugLabel {
}

export interface GPUComputePassEncoder extends GPUProgrammablePassEncoder {
  setPipeline(pipeline: GPUComputePipeline): void;
  dispatch(x: number, y: number, z: number): void;
}

export interface GPUComputePipeline extends GPUDebugLabel {
}

export interface GPUDebugLabel {
  label: string | undefined;
}

// SwapChain / CanvasContext
export interface GPUCanvasContext {
}

export interface GPUDevice {
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

export interface GPUFence extends GPUDebugLabel {
  getCompletedValue(): u64;
  onCompletion(completionValue: u64): Promise<void>;
}

export interface GPULogEntryEvent extends Event {
  readonly object: any;
  readonly reason: string;
}

export interface GPUPipelineLayout extends GPUDebugLabel {
}

export interface GPUProgrammablePassEncoder extends GPUDebugLabel {
  endPass(): void;
  insertDebugMarker(markerLabel: string): void;
  popDebugGroup(): void;
  pushDebugGroup(groupLabel: string): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup): void;
}

export interface GPUQueue extends GPUDebugLabel {
  signal(fence: GPUFence, signalValue: u64): void;
  submit(buffers: GPUCommandBuffer[]): void;
  createFence(descriptor: GPUFenceDescriptor): GPUFence ;
}

export interface GPURenderPassEncoder extends GPUProgrammablePassEncoder {
  setPipeline(pipeline: GPURenderPipeline): void;
  draw(vertexCount: number, instanceCount: number, firstVertex: number, firstInstance: number): void;
  drawIndexed(indexCount: number, instanceCount: number, firstIndex: number, baseVertex: number, firstInstance: number): void;
  setBlendColor(color: GPUColor): void;
  setIndexBuffer(buffer: GPUBuffer, offset: number): void;
  setScissorRect(x: number, y: number, width: number, height: number): void;
  setStencilReference(reference: number): void;
  setVertexBuffers(startSlot: number, buffers: GPUBuffer[], offsets: number[]): void;
  setViewport(x: number, y: number, width: number, height: number, minDepth: number, maxDepth: number): void;
}

export interface GPURenderPipeline extends GPUDebugLabel {
}

export interface GPUSampler extends GPUDebugLabel {
}

export interface GPUShaderModule extends GPUDebugLabel {
}

export interface GPUSwapChain {
  getCurrentTexture(): GPUTexture;
}

export interface GPUTexture extends GPUDebugLabel {
  createDefaultView(): GPUTextureView;
  createView(desc: GPUTextureViewDescriptor): GPUTextureView;
  destroy(): void;
}

export interface GPUTextureView extends GPUDebugLabel {
}

export type GPUPowerPreference =
  | "low-power"
  | "high-performance";
export interface GPURequestAdapterOptions {
  powerPreference?: GPUPowerPreference;
}

export interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter>;
}

// ****************************************************************************
// ERROR SCOPES
// ****************************************************************************

export type GPUErrorFilter = "none"
    | "out-of-memory"
    | "validation";

export interface GPUOutOfMemoryError { }

export interface GPUValidationError {
    readonly message: string;
}

export type GPUError = GPUOutOfMemoryError | GPUValidationError;

export interface GPUDevice {
    pushErrorScope(filter: GPUErrorFilter): void;
    popErrorScope(): Promise<GPUError | null>;
}

 // ****************************************************************************
// TELEMETRY
// ****************************************************************************
export interface GPUUncapturedErrorEvent extends Event {
    readonly error: GPUError;
}

export interface GPUUncapturedErrorEventInit extends EventInit {
    message: string;
}

 // TODO: is it possible to expose the EventTarget only on the main thread?
 export interface GPUDevice extends EventTarget {
    onuncapturederror: Event;
}

export interface GPU {
    // May reject with DOMException  // TODO: DOMException("OperationError")?
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter>;
}

export interface Navigator {
    readonly gpu: GPU | undefined;
}
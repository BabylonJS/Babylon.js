// https://github.com/gpuweb/gpuweb/blob/72b88fd01c8dd7d17a03f5669e6b14fd0c9ce6b6/spec/index.bs
// except #280 setSubData (TODO)

export {};

declare global {

export interface GPUColorDict {
  a: number;
  b: number;
  g: number;
  r: number;
}
export type GPUColor = [number, number, number, number] | GPUColorDict;

export interface GPUOrigin2DDict {
  x?: number;
  y?: number;
}
export type GPUOrigin2D = [number, number] | GPUOrigin2DDict;

export interface GPUOrigin3DDict {
  x?: number;
  y?: number;
  z?: number;
}
export type GPUOrigin3D = [number, number, number] | GPUOrigin3DDict;

export interface GPUExtent3DDict {
  width: number;
  height: number;
  depth: number;
}
export type GPUExtent3D = [number, number, number] | GPUExtent3DDict;

export type GPUBindingResource = GPUSampler | GPUTextureView | GPUBufferBinding;

export type GPUAddressMode =
  | "clamp-to-edge"
  | "repeat"
  | "mirror-repeat";
export type GPUBindingType =
  | "uniform-buffer"
  | "storage-buffer"
  | "readonly-storage-buffer"
  | "sampler"
  | "sampled-texture"
  | "storage-texture";
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
  | "store"
  | "clear";
export type GPUTextureDimension =
  | "1d"
  | "2d"
  | "3d";
export type GPUTextureFormat =
  | "r8unorm"
  | "r8snorm"
  | "r8uint"
  | "r8sint"
  | "r16unorm"
  | "r16snorm"
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
  | "rgba32float"
  | "depth32float"
  | "depth32float-stencil8"
  | "depth24plus"
  | "depth24plus-stencil8";
export type GPUTextureViewDimension =
  | "1d"
  | "2d"
  | "2d-array"
  | "cube"
  | "cube-array"
  | "3d";
// SEB UPDATE.
export type GPUTextureAspect =
  | "all"
  | "stencil-only"
  | "depth-only";
export type GPUVertexFormat =
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

export type GPUBufferUsageFlags = number;
// export enum GPUBufferUsage {
//   NONE      = 0x0000,
//   MAP_READ  = 0x0001,
//   MAP_WRITE = 0x0002,
//   COPY_SRC  = 0x0004,
//   COPY_DST  = 0x0008,
//   INDEX     = 0x0010,
//   VERTEX    = 0x0020,
//   UNIFORM   = 0x0040,
//   STORAGE   = 0x0080,
// }

export type GPUColorWriteFlags = number;
// export enum GPUColorWrite {
//   NONE  = 0x0,
//   RED   = 0x1,
//   GREEN = 0x2,
//   BLUE  = 0x4,
//   ALPHA = 0x8,
//   ALL   = 0xF,
// }

export type GPUShaderStageFlags = number;
// export enum GPUShaderStage {
//   NONE     = 0x0,
//   VERTEX   = 0x1,
//   FRAGMENT = 0x2,
//   COMPUTE  = 0x4,
// }

export type GPUTextureUsageFlags = number;
// export enum GPUTextureUsage {
//   NONE              = 0x00,
//   COPY_SRC          = 0x01,
//   COPY_DST          = 0x02,
//   SAMPLED           = 0x04,
//   STORAGE           = 0x08,
//   OUTPUT_ATTACHMENT = 0x10,
// }

export interface GPUBindGroupBinding {
  binding: number;
  resource: GPUBindingResource;
}

export interface GPUBindGroupDescriptor extends GPUObjectDescriptorBase {
  layout: GPUBindGroupLayout;
  bindings: GPUBindGroupBinding[];
}

export interface GPUBindGroupLayoutBinding {
  binding: number;
  visibility: GPUShaderStageFlags;
  type: GPUBindingType;
  textureDimension?: GPUTextureViewDimension;
  multisampled?: boolean;
  dynamic?: boolean;
}

export interface GPUBindGroupLayoutDescriptor extends GPUObjectDescriptorBase {
  bindings?: GPUBindGroupLayoutBinding[];
}

export interface GPUBlendDescriptor {
  dstFactor?: GPUBlendFactor;
  operation?: GPUBlendOperation;
  srcFactor?: GPUBlendFactor;
}

export interface GPUColorStateDescriptor {
  format: GPUTextureFormat;

  alphaBlend?: GPUBlendDescriptor;
  colorBlend?: GPUBlendDescriptor;
  writeMask?: GPUColorWriteFlags;
}

export interface GPUBufferBinding {
  buffer: GPUBuffer;
  offset?: number;
  size?: number;
}

export interface GPUBufferCopyView {
  buffer: GPUBuffer;
  offset?: number;
  rowPitch: number;
  imageHeight: number;
}

export interface GPUTextureCopyView {
  texture: GPUTexture;
  mipLevel?: number;
  arrayLayer?: number;
  origin?: GPUOrigin3D;
}

export interface GPUImageBitmapCopyView {
  imageBitmap: ImageBitmap;
  origin?: GPUOrigin2D;
}

export interface GPUBufferDescriptor extends GPUObjectDescriptorBase {
  size: number;
  usage: GPUBufferUsageFlags;
}

export interface GPUCommandEncoderDescriptor extends GPUObjectDescriptorBase {
  label?: string;
}

export interface GPUComputePipelineDescriptor extends GPUPipelineDescriptorBase {
  computeStage: GPUProgrammableStageDescriptor;
}

export interface GPUDepthStencilStateDescriptor {
  format: GPUTextureFormat;

  depthWriteEnabled?: boolean;
  depthCompare?: GPUCompareFunction;

  stencilFront: GPUStencilStateFaceDescriptor;
  stencilBack: GPUStencilStateFaceDescriptor;

  stencilReadMask?: number;
  stencilWriteMask?: number;
}

export interface GPUDeviceDescriptor extends GPUObjectDescriptorBase {
  extensions?: GPUExtensions;
  limits?: GPULimits;
}

export interface GPUExtensions {
  anisotropicFiltering?: boolean;
}

export interface GPUFenceDescriptor extends GPUObjectDescriptorBase {
  initialValue?: number;
  label?: string;
  signalQueue?: GPUQueue;
}

export interface GPUVertexAttributeDescriptor {
  offset?: number;
  format: GPUVertexFormat;
  shaderLocation: number;
}

export interface GPUVertexBufferDescriptor {
  stride: number;
  stepMode?: GPUInputStepMode;
  attributeSet: GPUVertexAttributeDescriptor[];
}

export interface GPUVertexInputDescriptor {
  indexFormat?: GPUIndexFormat;
  vertexBuffers: GPUVertexBufferDescriptor[];
}

export interface GPULimits {
  maxBindGroups?: number;
}

export interface GPUPipelineDescriptorBase {
  label?: string;
  layout: GPUPipelineLayout;
}

export interface GPUPipelineLayoutDescriptor extends GPUObjectDescriptorBase {
  bindGroupLayouts: GPUBindGroupLayout[];
}

export interface GPUProgrammableStageDescriptor {
  module: GPUShaderModule;
  entryPoint: string;
}

export interface GPURasterizationStateDescriptor {
  frontFace?: GPUFrontFace;
  cullMode?: GPUCullMode;
  depthBias?: number;
  depthBiasSlopeScale?: number;
  depthBiasClamp?: number;
}

export interface GPURenderPassColorAttachmentDescriptor {
  attachment: GPUTextureView;
  resolveTarget?: GPUTextureView | null;

  loadValue: GPULoadOp | GPUColor;
  storeOp: GPUStoreOp;
}

export interface GPURenderPassDepthStencilAttachmentDescriptor {
  attachment: GPUTextureView;

  depthLoadValue: GPULoadOp | number;
  depthStoreOp: GPUStoreOp;

  stencilLoadValue: GPULoadOp | number;
  stencilStoreOp: GPUStoreOp;
}

export interface GPURenderPassDescriptor extends GPUObjectDescriptorBase {
  colorAttachments: GPURenderPassColorAttachmentDescriptor[];
  depthStencilAttachment?: GPURenderPassDepthStencilAttachmentDescriptor | null;
}

export interface GPURenderPipelineStageDescriptor {
  vertexStage: GPUProgrammableStageDescriptor;
  fragmentStage?: GPUProgrammableStageDescriptor | null;
}

export interface GPURenderPipelineDescriptor extends GPUPipelineDescriptorBase, GPURenderPipelineStageDescriptor {
  primitiveTopology: GPUPrimitiveTopology;
  rasterizationState?: GPURasterizationStateDescriptor;
  colorStates: GPUColorStateDescriptor[];
  depthStencilState?: GPUDepthStencilStateDescriptor | null;
  vertexInput: GPUVertexInputDescriptor;

  sampleCount?: number;
  sampleMask?: number;
  alphaToCoverageEnabled?: boolean;
}

export interface GPUSamplerDescriptor extends GPUObjectDescriptorBase {
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

export interface GPUShaderModuleDescriptor extends GPUObjectDescriptorBase {
  code: Uint32Array | string;
  label?: string;
}

export interface GPUStencilStateFaceDescriptor {
  compare?: GPUCompareFunction;
  depthFailOp?: GPUStencilOperation;
  passOp?: GPUStencilOperation;
  failOp?: GPUStencilOperation;
}

export interface GPUSwapChainDescriptor extends GPUObjectDescriptorBase {
  device: GPUDevice;
  format: GPUTextureFormat;
  usage?: GPUTextureUsageFlags;
}

export interface GPUTextureDescriptor extends GPUObjectDescriptorBase {
  size: GPUExtent3D;
  arrayLayerCount?: number;
  mipLevelCount?: number;
  sampleCount?: number;
  dimension?: GPUTextureDimension;
  format: GPUTextureFormat;
  usage: GPUTextureUsageFlags;
}

export interface GPUTextureViewDescriptor extends GPUObjectDescriptorBase {
  aspect: GPUTextureAspect;
  baseArrayLayer?: number;
  baseMipLevel?: number;
  dimension: GPUTextureViewDimension;
  format: GPUTextureFormat;
  arrayLayerCount?: number;
  mipLevelCount?: number;
}

export interface GPUAdapter extends GPUObjectBase {
  readonly extensions: GPUExtensions;
  readonly name: string;
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
}

export interface GPUBindGroup extends GPUObjectBase {
}

export interface GPUBindGroupLayout extends GPUObjectBase {
}

export interface GPUBuffer extends GPUObjectBase {
  //readonly mapping: ArrayBuffer | null;
  destroy(): void;
  unmap(): void;

  mapWriteAsync(): Promise<ArrayBuffer>;
  mapReadAsync(): Promise<ArrayBuffer>;
  // TODO: Remove setSubData (#280)
  setSubData(offset: number, src: ArrayBufferView, srcOffset?: number, byteLength?: number): void;
}

export interface GPUCommandBuffer extends GPUObjectBase {
}

export interface GPUCommandBufferDescriptor extends GPUObjectDescriptorBase {
}

export interface GPUCommandEncoder extends GPUObjectBase {
  beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePassEncoder;
  beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
  copyBufferToBuffer(source: GPUBuffer, sourceOffset: number, destination: GPUBuffer, destinationOffset: number, size: number): void;
  copyBufferToTexture(source: GPUBufferCopyView, destination: GPUTextureCopyView, copySize: GPUExtent3D): void;
  copyTextureToBuffer(source: GPUTextureCopyView, destination: GPUBufferCopyView, copySize: GPUExtent3D): void;
  copyTextureToTexture(source: GPUTextureCopyView, destination: GPUTextureCopyView, copySize: GPUExtent3D): void;
  copyImageBitmapToTexture(source: GPUImageBitmapCopyView, destination: GPUTextureCopyView, copySize: GPUExtent3D): void;
  finish(descriptor?: GPUCommandBufferDescriptor): GPUCommandBuffer;

  popDebugGroup(): void;
  pushDebugGroup(groupLabel: string): void;
  insertDebugMarker(markerLabel: string): void;
}

export interface GPUComputePassDescriptor extends GPUObjectDescriptorBase {
}

export interface GPUComputePassEncoder extends GPUProgrammablePassEncoder {
  setPipeline(pipeline: GPUComputePipeline): void;
  dispatch(x: number, y?: number, z?: number): void;
  dispatchIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;

  endPass(): void;
}

export interface GPUComputePipeline extends GPUObjectBase {
}

export interface GPUObjectBase {
  label: string | undefined;
}

export interface GPUObjectDescriptorBase {
  label?: string;
}

// SwapChain / CanvasContext
export interface GPUCanvasContext {
  configureSwapChain(descriptor: GPUSwapChainDescriptor): GPUSwapChain;

  getSwapChainPreferredFormat(device: GPUDevice): Promise<GPUTextureFormat>;
}

export interface GPUDevice extends GPUObjectBase {
  readonly adapter: GPUAdapter;
  readonly extensions: GPUExtensions;
  readonly limits: GPULimits;

  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
  createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout;
  createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
  createBufferMapped(descriptor: GPUBufferDescriptor): [GPUBuffer, ArrayBuffer];
  createBufferMappedAsync(descriptor: GPUBufferDescriptor): Promise<[GPUBuffer, ArrayBuffer]>;
  createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
  createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout;
  createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline;
  createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler;
  createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
  createTexture(descriptor: GPUTextureDescriptor): GPUTexture;

  createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor): GPUCommandEncoder;
  createRenderBundleEncoder(descriptor: GPURenderBundleEncoderDescriptor): GPURenderBundleEncoder;

  getQueue(): GPUQueue;

  readonly lost: Promise<GPUDeviceLostInfo>;
}

export interface GPUFence extends GPUObjectBase {
  getCompletedValue(): number;
  onCompletion(completionValue: number): Promise<void>;
}

export interface GPUPipelineLayout extends GPUObjectBase {
}

export interface GPUProgrammablePassEncoder extends GPUObjectBase {
  setBindGroup(index: number, bindGroup: GPUBindGroup): void;

  popDebugGroup(): void;
  pushDebugGroup(groupLabel: string): void;
  insertDebugMarker(markerLabel: string): void;
}

export interface GPUQueue extends GPUObjectBase {
  signal(fence: GPUFence, signalValue: number): void;
  submit(buffers: GPUCommandBuffer[]): void;
  createFence(descriptor?: GPUFenceDescriptor): GPUFence;
}

export interface GPURenderEncoderBase extends GPUProgrammablePassEncoder {
  setPipeline(pipeline: GPURenderPipeline): void;

  setIndexBuffer(buffer: GPUBuffer, offset: number): void;
  setVertexBuffers(startSlot: number, buffers: GPUBuffer[], offsets: number[]): void;

  draw(vertexCount: number, instanceCount: number, firstVertex: number, firstInstance: number): void;
  drawIndexed(indexCount: number, instanceCount: number, firstIndex: number, baseVertex: number, firstInstance: number): void;

  drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
  drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
}

export interface GPURenderPassEncoder extends GPURenderEncoderBase {
  setViewport(x: number, y: number, width: number, height: number, minDepth: number, maxDepth: number): void;
  setScissorRect(x: number, y: number, width: number, height: number): void;

  setBlendColor(color: GPUColor): void;
  setStencilReference(reference: number): void;

  executeBundles(bundles: GPURenderBundle[]): void;
  endPass(): void;
}

export interface GPURenderBundleDescriptor extends GPUObjectDescriptorBase {
}

export interface GPURenderBundle extends GPUObjectBase {
}

export interface GPURenderBundleEncoder extends GPURenderEncoderBase {
}

export interface GPURenderBundleEncoderDescriptor extends GPUObjectDescriptorBase {
  colorFormats: GPUTextureFormat[];
  depthStencilFormat: GPUTextureFormat;
  sampleCount?: number;
}

export interface GPURenderPipeline extends GPUObjectBase {
}

export interface GPUSampler extends GPUObjectBase {
}

export interface GPUShaderModule extends GPUObjectBase {
}

export interface GPUSwapChain extends GPUObjectBase {
  getCurrentTexture(): GPUTexture;
}

export interface GPUTexture extends GPUObjectBase {
  createDefaultView(): GPUTextureView;
  createView(descriptor: GPUTextureViewDescriptor): GPUTextureView;
  destroy(): void;
}

export interface GPUTextureView extends GPUObjectBase {
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

export class GPUOutOfMemoryError {
  constructor();
}

export class GPUValidationError {
  constructor(message: string);
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
  error: GPUError;
}

export interface GPUDevice extends EventTarget {
  onuncapturederror: Event | undefined;
}

export interface GPUDeviceLostInfo {
  readonly message: string;
}

export interface GPU {
  // May reject with DOMException  // TODO: DOMException("OperationError")?
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter>;
}

export interface Navigator {
  readonly gpu: GPU | undefined;
}

}
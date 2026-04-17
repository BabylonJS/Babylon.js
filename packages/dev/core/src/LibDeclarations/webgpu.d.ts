/* eslint-disable babylonjs/available */
/* eslint-disable @typescript-eslint/naming-convention */

// WebGPU type augmentations for APIs not yet in TypeScript's lib.dom.d.ts.
// Do NOT re-declare types, interfaces, or classes already in lib.dom.d.ts,
// as duplicate declarations cause errors with TypeScript 6.0+ which natively
// includes WebGPU types.

// String indexer and extra supported limits not yet in lib.dom.d.ts
interface GPUSupportedLimits {
    [name: string]: number;
    readonly maxStorageBuffersInVertexStage: number;
    readonly maxStorageBuffersInFragmentStage: number;
    readonly maxStorageTexturesInVertexStage: number;
    readonly maxStorageTexturesInFragmentStage: number;
}

// Extra adapter request options not yet in lib.dom.d.ts
interface GPURequestAdapterOptions {
    featureLevel?: string;
    xrCompatible?: boolean;
}

// Extra texture properties not yet in lib.dom.d.ts
interface GPUTexture {
    readonly textureBindingViewDimension: GPUTextureViewDimension | undefined;
}

interface GPUTextureDescriptor {
    textureBindingViewDimension?: GPUTextureViewDimension;
}

// Extra view descriptor property not yet in lib.dom.d.ts
interface GPUTextureViewDescriptor {
    swizzle?: string;
}

// Shader compilation hints not yet in lib.dom.d.ts
interface GPUShaderModuleDescriptor {
    compilationHints?: GPUShaderModuleCompilationHint[];
}

interface GPUShaderModuleCompilationHint {
    entryPoint: string;
    layout?: GPUPipelineLayout | GPUAutoLayoutMode;
}

// Empty mixin not in lib.dom.d.ts, used for type compatibility
interface GPUCommandsMixin {}

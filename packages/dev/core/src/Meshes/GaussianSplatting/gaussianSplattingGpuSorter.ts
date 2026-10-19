/**
 * Re-exports the pure implementation and imports required shaders/features for their runtime registration.
 * Import gaussianSplattingGpuSorter.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingGpuSorter.pure";

import "../../Engines/WebGPU/Extensions/engine.computeShader";
import "../../ShadersWGSL/gsSortKeys.compute";
import "../../ShadersWGSL/gsSortCount.compute";
import "../../ShadersWGSL/gsSortScanLocal.compute";
import "../../ShadersWGSL/gsSortScanSums.compute";
import "../../ShadersWGSL/gsSortScatter.compute";
import "../../ShadersWGSL/gsSortOutput.compute";

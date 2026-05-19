/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingGpuPickingMaterialPlugin.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingGpuPickingMaterialPlugin.pure";

import { RegisterGaussianSplattingGpuPickingMaterialPlugin } from "./gaussianSplattingGpuPickingMaterialPlugin.pure";
RegisterGaussianSplattingGpuPickingMaterialPlugin();

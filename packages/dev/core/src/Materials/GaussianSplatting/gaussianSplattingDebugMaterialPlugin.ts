/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingDebugMaterialPlugin.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingDebugMaterialPlugin.pure";

import { RegisterGaussianSplattingDebugMaterialPlugin } from "./gaussianSplattingDebugMaterialPlugin.pure";
RegisterGaussianSplattingDebugMaterialPlugin();

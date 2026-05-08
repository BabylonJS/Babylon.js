/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingMaterial.pure";

import { registerGaussianSplattingMaterial } from "./gaussianSplattingMaterial.pure";
registerGaussianSplattingMaterial();

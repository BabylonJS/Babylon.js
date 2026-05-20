/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingDebugger.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingDebugger.pure";

import "../../Materials/GaussianSplatting/gaussianSplattingMaterial";
import "../../Materials/GaussianSplatting/gaussianSplattingDebugMaterialPlugin";

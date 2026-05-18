/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingMaterial.pure";

// Depth shaders used synchronously by makeDepthRenderingMaterial / shadow depth wrapper
import "../../Shaders/gaussianSplattingDepth.fragment";
import "../../Shaders/gaussianSplattingDepth.vertex";
import "../../ShadersWGSL/gaussianSplattingDepth.fragment";
import "../../ShadersWGSL/gaussianSplattingDepth.vertex";

import { RegisterGaussianSplattingMaterial } from "./gaussianSplattingMaterial.pure";
RegisterGaussianSplattingMaterial();

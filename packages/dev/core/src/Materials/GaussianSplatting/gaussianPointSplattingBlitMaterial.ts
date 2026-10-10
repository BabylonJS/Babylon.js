/**
 * Re-exports the pure implementation and imports required shaders for their runtime registration.
 * Import gaussianPointSplattingBlitMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianPointSplattingBlitMaterial.pure";

import "../../ShadersWGSL/gaussianPointSplattingBlit.vertex";
import "../../ShadersWGSL/gaussianPointSplattingBlit.fragment";

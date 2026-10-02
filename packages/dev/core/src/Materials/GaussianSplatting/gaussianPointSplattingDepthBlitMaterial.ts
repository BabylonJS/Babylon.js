/**
 * Re-exports the pure implementation and imports required shaders for their runtime registration.
 * Import gaussianPointSplattingDepthBlitMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianPointSplattingDepthBlitMaterial.pure";

import "../../ShadersWGSL/gaussianPointSplattingBlit.vertex";
import "../../ShadersWGSL/gaussianPointSplattingDepthBlit.fragment";

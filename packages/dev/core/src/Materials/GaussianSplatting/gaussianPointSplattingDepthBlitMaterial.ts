/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianPointSplattingDepthBlitMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianPointSplattingDepthBlitMaterial.pure";

import "../../ShadersWGSL/gaussianPointSplattingBlit.vertex";
import "../../ShadersWGSL/gaussianPointSplattingDepthBlit.fragment";

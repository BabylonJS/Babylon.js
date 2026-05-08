export * from "./glowLayer.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import glowLayer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./glowLayer.pure";

import { registerGlowLayer } from "./glowLayer.pure";
registerGlowLayer();

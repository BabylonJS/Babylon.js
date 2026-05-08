/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorCurves.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorCurves.pure";

import { registerColorCurves } from "./colorCurves.pure";
registerColorCurves();

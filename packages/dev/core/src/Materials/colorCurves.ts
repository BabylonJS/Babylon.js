/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorCurves.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorCurves.pure";

import { RegisterColorCurves } from "./colorCurves.pure";
RegisterColorCurves();

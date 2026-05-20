/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorCurves.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorCurves.pure";
export * from "./colorCurves.types";

import { RegisterColorCurves } from "./colorCurves.pure";
RegisterColorCurves();

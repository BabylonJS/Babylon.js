/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import planeBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./planeBuilder.pure";

import { registerPlaneBuilder } from "./planeBuilder.pure";
registerPlaneBuilder();

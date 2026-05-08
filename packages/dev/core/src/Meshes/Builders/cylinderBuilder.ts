/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cylinderBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cylinderBuilder.pure";

import { registerCylinderBuilder } from "./cylinderBuilder.pure";
registerCylinderBuilder();

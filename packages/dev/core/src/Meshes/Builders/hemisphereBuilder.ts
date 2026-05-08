/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import hemisphereBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./hemisphereBuilder.pure";

import { registerHemisphereBuilder } from "./hemisphereBuilder.pure";
registerHemisphereBuilder();

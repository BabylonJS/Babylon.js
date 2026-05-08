/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import hemisphereBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./hemisphereBuilder.pure";

import { RegisterHemisphereBuilder } from "./hemisphereBuilder.pure";
RegisterHemisphereBuilder();

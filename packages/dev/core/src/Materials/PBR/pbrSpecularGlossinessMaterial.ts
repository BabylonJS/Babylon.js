/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pbrSpecularGlossinessMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrSpecularGlossinessMaterial.pure";

import { RegisterPbrSpecularGlossinessMaterial } from "./pbrSpecularGlossinessMaterial.pure";
RegisterPbrSpecularGlossinessMaterial();

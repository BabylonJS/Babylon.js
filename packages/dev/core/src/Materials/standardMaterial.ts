/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import standardMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./standardMaterial.pure";

import { RegisterStandardMaterial } from "./standardMaterial.pure";
RegisterStandardMaterial();

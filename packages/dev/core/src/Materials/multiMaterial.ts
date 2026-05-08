/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import multiMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./multiMaterial.pure";

import { RegisterMultiMaterial } from "./multiMaterial.pure";
RegisterMultiMaterial();

/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import backgroundMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./backgroundMaterial.pure";

import { RegisterBackgroundMaterial } from "./backgroundMaterial.pure";
RegisterBackgroundMaterial();

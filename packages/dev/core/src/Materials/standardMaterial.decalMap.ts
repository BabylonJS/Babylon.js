/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import standardMaterial.decalMap.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./standardMaterial.decalMap.pure";

import { registerStandardMaterialDecalMap } from "./standardMaterial.decalMap.pure";
registerStandardMaterialDecalMap();

export * from "./standardMaterial.decalMap.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import standardMaterial.decalMap.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./standardMaterial.decalMap.pure";

import { RegisterStandardMaterialDecalMap } from "./standardMaterial.decalMap.pure";
RegisterStandardMaterialDecalMap();

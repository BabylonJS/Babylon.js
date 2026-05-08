export * from "./pbrMaterial.decalMap.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pbrMaterial.decalMap.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrMaterial.decalMap.pure";

import { registerPbrMaterialDecalMap } from "./pbrMaterial.decalMap.pure";
registerPbrMaterialDecalMap();

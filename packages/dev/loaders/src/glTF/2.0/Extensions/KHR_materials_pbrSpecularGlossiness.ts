/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_pbrSpecularGlossiness.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_pbrSpecularGlossiness.types";
export * from "./KHR_materials_pbrSpecularGlossiness.pure";

import { RegisterKHR_materials_pbrSpecularGlossiness } from "./KHR_materials_pbrSpecularGlossiness.pure";
RegisterKHR_materials_pbrSpecularGlossiness();

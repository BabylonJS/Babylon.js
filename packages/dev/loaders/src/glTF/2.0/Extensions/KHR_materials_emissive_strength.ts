/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_emissive_strength.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_emissive_strength.types";
export * from "./KHR_materials_emissive_strength.pure";

import { RegisterKHR_materials_emissive_strength } from "./KHR_materials_emissive_strength.pure";
RegisterKHR_materials_emissive_strength();

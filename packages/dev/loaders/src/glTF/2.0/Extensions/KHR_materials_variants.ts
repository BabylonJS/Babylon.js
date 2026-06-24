/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_variants.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_variants.types";
export * from "./KHR_materials_variants.pure";

import { RegisterKHR_materials_variants } from "./KHR_materials_variants.pure";
RegisterKHR_materials_variants();

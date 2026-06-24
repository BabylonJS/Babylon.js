/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_fuzz.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_fuzz.types";
export * from "./KHR_materials_fuzz.pure";

import { RegisterKHR_materials_fuzz } from "./KHR_materials_fuzz.pure";
RegisterKHR_materials_fuzz();

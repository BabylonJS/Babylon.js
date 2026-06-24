/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_ior.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_ior.types";
export * from "./KHR_materials_ior.pure";

import { RegisterKHR_materials_ior } from "./KHR_materials_ior.pure";
RegisterKHR_materials_ior();

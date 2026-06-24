/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_clearcoat.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_clearcoat.types";
export * from "./KHR_materials_clearcoat.pure";

import { RegisterKHR_materials_clearcoat } from "./KHR_materials_clearcoat.pure";
RegisterKHR_materials_clearcoat();

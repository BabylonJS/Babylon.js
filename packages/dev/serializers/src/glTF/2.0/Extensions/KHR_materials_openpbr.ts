/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_openpbr.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_openpbr.pure";

import { RegisterKHR_materials_openpbr } from "./KHR_materials_openpbr.pure";
RegisterKHR_materials_openpbr();

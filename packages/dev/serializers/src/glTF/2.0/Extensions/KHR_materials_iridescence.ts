/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_iridescence.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_iridescence.pure";

import { RegisterKHR_materials_iridescence } from "./KHR_materials_iridescence.pure";
RegisterKHR_materials_iridescence();

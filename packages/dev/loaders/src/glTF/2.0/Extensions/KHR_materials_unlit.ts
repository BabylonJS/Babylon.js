/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_unlit.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_unlit.types";
export * from "./KHR_materials_unlit.pure";

import { RegisterKHR_materials_unlit } from "./KHR_materials_unlit.pure";
RegisterKHR_materials_unlit();

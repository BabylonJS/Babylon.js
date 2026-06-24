/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_coat.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_coat.types";
export * from "./KHR_materials_coat.pure";

import { RegisterKHR_materials_coat } from "./KHR_materials_coat.pure";
RegisterKHR_materials_coat();

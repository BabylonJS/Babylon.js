/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_dispersion.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_dispersion.types";
export * from "./KHR_materials_dispersion.pure";

import { RegisterKHR_materials_dispersion } from "./KHR_materials_dispersion.pure";
RegisterKHR_materials_dispersion();

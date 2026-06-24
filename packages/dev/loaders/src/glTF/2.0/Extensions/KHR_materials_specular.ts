/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_specular.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_specular.types";
export * from "./KHR_materials_specular.pure";

import { RegisterKHR_materials_specular } from "./KHR_materials_specular.pure";
RegisterKHR_materials_specular();

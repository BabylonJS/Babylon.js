/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_anisotropy.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_anisotropy.types";
export * from "./KHR_materials_anisotropy.pure";

import { RegisterKHR_materials_anisotropy } from "./KHR_materials_anisotropy.pure";
RegisterKHR_materials_anisotropy();

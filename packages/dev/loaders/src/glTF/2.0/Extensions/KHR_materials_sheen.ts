/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_sheen.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_sheen.types";
export * from "./KHR_materials_sheen.pure";

import { RegisterKHR_materials_sheen } from "./KHR_materials_sheen.pure";
RegisterKHR_materials_sheen();

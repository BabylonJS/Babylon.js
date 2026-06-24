/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_volume.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_volume.pure";

import { RegisterKHR_materials_volume } from "./KHR_materials_volume.pure";
RegisterKHR_materials_volume();

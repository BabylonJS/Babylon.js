/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_diffuse_roughness.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_diffuse_roughness.types";
export * from "./KHR_materials_diffuse_roughness.pure";

import { RegisterKHR_materials_diffuse_roughness } from "./KHR_materials_diffuse_roughness.pure";
RegisterKHR_materials_diffuse_roughness();

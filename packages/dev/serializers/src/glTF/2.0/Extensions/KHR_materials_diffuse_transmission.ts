/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_diffuse_transmission.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_diffuse_transmission.pure";

import { RegisterKHR_materials_diffuse_transmission } from "./KHR_materials_diffuse_transmission.pure";
RegisterKHR_materials_diffuse_transmission();

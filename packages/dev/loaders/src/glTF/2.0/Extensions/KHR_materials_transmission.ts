/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_transmission.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_transmission.types";
export * from "./KHR_materials_transmission.pure";

import { RegisterKHR_materials_transmission } from "./KHR_materials_transmission.pure";
RegisterKHR_materials_transmission();

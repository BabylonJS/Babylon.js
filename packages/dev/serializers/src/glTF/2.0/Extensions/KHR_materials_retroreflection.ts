/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_retroreflection.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_retroreflection.pure";

import { RegisterKHR_materials_retroreflection } from "./KHR_materials_retroreflection.pure";
RegisterKHR_materials_retroreflection();

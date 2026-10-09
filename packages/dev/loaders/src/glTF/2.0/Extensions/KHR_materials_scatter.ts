/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_materials_scatter.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_materials_scatter.types";
export * from "./KHR_materials_scatter.pure";

import { RegisterKHR_materials_scatter } from "./KHR_materials_scatter.pure";
RegisterKHR_materials_scatter();

/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_gaussian_splatting.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_gaussian_splatting.types";
export * from "./KHR_gaussian_splatting.pure";

import { RegisterKHR_gaussian_splatting } from "./KHR_gaussian_splatting.pure";
RegisterKHR_gaussian_splatting();

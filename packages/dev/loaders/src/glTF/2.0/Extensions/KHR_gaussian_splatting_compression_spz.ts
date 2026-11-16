/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_gaussian_splatting_compression_spz.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_gaussian_splatting_compression_spz.types";
export * from "./KHR_gaussian_splatting_compression_spz.pure";

import { RegisterKHR_gaussian_splatting_compression_spz } from "./KHR_gaussian_splatting_compression_spz.pure";
RegisterKHR_gaussian_splatting_compression_spz();

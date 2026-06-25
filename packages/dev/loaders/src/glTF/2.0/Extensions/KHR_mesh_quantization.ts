/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_mesh_quantization.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_mesh_quantization.types";
export * from "./KHR_mesh_quantization.pure";

import { RegisterKHR_mesh_quantization } from "./KHR_mesh_quantization.pure";
RegisterKHR_mesh_quantization();

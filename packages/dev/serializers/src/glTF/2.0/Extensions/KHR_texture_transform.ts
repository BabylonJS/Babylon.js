/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_texture_transform.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_texture_transform.pure";

import { RegisterKHR_texture_transform } from "./KHR_texture_transform.pure";
RegisterKHR_texture_transform();

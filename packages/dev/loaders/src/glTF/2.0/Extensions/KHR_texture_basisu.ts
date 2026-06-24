/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./KHR_texture_basisu.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./KHR_texture_basisu.types";
export * from "./KHR_texture_basisu.pure";

import { RegisterKHR_texture_basisu } from "./KHR_texture_basisu.pure";
RegisterKHR_texture_basisu();

/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./EXT_texture_webp.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./EXT_texture_webp.types";
export * from "./EXT_texture_webp.pure";

import { RegisterEXT_texture_webp } from "./EXT_texture_webp.pure";
RegisterEXT_texture_webp();

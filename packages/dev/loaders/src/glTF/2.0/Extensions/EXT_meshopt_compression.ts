/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./EXT_meshopt_compression.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./EXT_meshopt_compression.types";
export * from "./EXT_meshopt_compression.pure";

import { RegisterEXT_meshopt_compression } from "./EXT_meshopt_compression.pure";
RegisterEXT_meshopt_compression();

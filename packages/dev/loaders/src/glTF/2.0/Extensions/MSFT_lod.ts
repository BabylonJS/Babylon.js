/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./MSFT_lod.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./MSFT_lod.types";
export * from "./MSFT_lod.pure";

import { RegisterMSFT_lod } from "./MSFT_lod.pure";
RegisterMSFT_lod();

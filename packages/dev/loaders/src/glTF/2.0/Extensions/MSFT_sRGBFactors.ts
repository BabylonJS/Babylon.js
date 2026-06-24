/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./MSFT_sRGBFactors.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./MSFT_sRGBFactors.types";
export * from "./MSFT_sRGBFactors.pure";

import { RegisterMSFT_sRGBFactors } from "./MSFT_sRGBFactors.pure";
RegisterMSFT_sRGBFactors();

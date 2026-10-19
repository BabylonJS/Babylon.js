/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./usdFileLoader.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./usdFileLoader.types";
export * from "./usdFileLoader.pure";

import { RegisterUSDFileLoader } from "./usdFileLoader.pure";
RegisterUSDFileLoader();

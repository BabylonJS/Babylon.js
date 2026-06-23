/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./fbxFileLoader.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./fbxFileLoader.types";
export * from "./fbxFileLoader.pure";

import { RegisterFBXFileLoader } from "./fbxFileLoader.pure";
RegisterFBXFileLoader();

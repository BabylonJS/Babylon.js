/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./objFileLoader.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./objFileLoader.types";
export * from "./objFileLoader.pure";

import { RegisterOBJFileLoader } from "./objFileLoader.pure";
RegisterOBJFileLoader();

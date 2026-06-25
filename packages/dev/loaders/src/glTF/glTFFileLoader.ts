/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./glTFFileLoader.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./glTFFileLoader.types";
export * from "./glTFFileLoader.pure";

import { RegisterGLTFFileLoader } from "./glTFFileLoader.pure";
RegisterGLTFFileLoader();
